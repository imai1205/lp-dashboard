import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { eventDefinitions, events, inquiries, sites } from "@/db/schema";

/**
 * 外部LPのフォームから問い合わせを受け付ける公開エンドポイント。
 *
 *   POST /api/inquiries
 *   Content-Type: application/json
 *   { siteId, name, email, phone?, message }
 *
 * 動作:
 *   1. siteId のサイトが存在 + isActive かを確認 (organization 制御は site 単位)
 *   2. inquiries に INSERT (status="open")
 *   3. 追加で events に "lp_form_submit" を1件 INSERT (KPI集計用)
 *   4. JSON で結果を返す
 *
 * 認証: 不要 (匿名訪問者から直接呼ばれる)。CORS は "*" で全許可。
 */

// libsql は Edge 不可
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

function json(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init?.headers ?? {}) },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// --- バリデーション ---------------------------------------------------------

const MAX_NAME = 200;
const MAX_EMAIL = 200;
const MAX_PHONE = 50;
const MAX_COMPANY = 200;
const MAX_MESSAGE = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimmedString(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  if (t.length > max) return null;
  return t;
}

// --- POST -------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;

  const siteId = trimmedString(raw.siteId, 64);
  const name = trimmedString(raw.name, MAX_NAME);
  const email = trimmedString(raw.email, MAX_EMAIL);
  const phone = trimmedString(raw.phone, MAX_PHONE);
  const company = trimmedString(raw.company, MAX_COMPANY);
  const message = trimmedString(raw.message, MAX_MESSAGE);

  if (!siteId) return json({ ok: false, error: "siteId is required" }, { status: 400 });
  if (!name) return json({ ok: false, error: "name is required" }, { status: 400 });
  if (!email) return json({ ok: false, error: "email is required" }, { status: 400 });
  if (!EMAIL_RE.test(email))
    return json({ ok: false, error: "email format invalid" }, { status: 400 });
  if (!message) return json({ ok: false, error: "message is required" }, { status: 400 });

  // site 存在 + アクティブ確認 (削除済 / 無効化済 のサイトは弾く)
  const [site] = await db
    .select()
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1);

  if (!site) return json({ ok: false, error: "site not found" }, { status: 404 });
  if (!site.isActive)
    return json({ ok: false, error: "site is inactive" }, { status: 403 });

  // inquiries に INSERT
  const [created] = await db
    .insert(inquiries)
    .values({
      siteId,
      name,
      email,
      phone,
      company,
      message,
      status: "open",
      // receivedAt は default で now() が入る
    })
    .returning();

  // 追加で events にも 1件 INSERT (lp_form_submit)
  // 失敗しても inquiry 保存は成功させたいので別 try/catch でラップ
  try {
    const FORM_EVENT_KEY = "lp_form_submit";
    let [def] = await db
      .select()
      .from(eventDefinitions)
      .where(
        and(
          eq(eventDefinitions.siteId, siteId),
          eq(eventDefinitions.key, FORM_EVENT_KEY),
        ),
      )
      .limit(1);

    // 未登録なら /activity で「お問い合わせ」と分かるように自動登録
    if (!def) {
      try {
        const [createdDef] = await db
          .insert(eventDefinitions)
          .values({
            siteId,
            key: FORM_EVENT_KEY,
            label: "お問い合わせ",
            type: "conversion",
            isConversion: false,
          })
          .returning();
        def = createdDef;
      } catch {
        const [retry] = await db
          .select()
          .from(eventDefinitions)
          .where(
            and(
              eq(eventDefinitions.siteId, siteId),
              eq(eventDefinitions.key, FORM_EVENT_KEY),
            ),
          )
          .limit(1);
        def = retry;
      }
    }

    const [evt] = await db
      .insert(events)
      .values({
        siteId,
        eventDefinitionId: def?.id ?? null,
        type: def?.type ?? "conversion",
        occurredAt: new Date(),
        metadata: { source: "api/inquiries", inquiryId: created.id },
        referrer: request.headers.get("referer"),
        userAgent: request.headers.get("user-agent"),
      })
      .returning({ id: events.id });

    // inquiry に紐づけ (後で「この成果イベント由来の問い合わせ」を辿れるように)
    await db
      .update(inquiries)
      .set({ eventId: evt.id })
      .where(eq(inquiries.id, created.id));
  } catch (err) {
    console.warn("[api/inquiries] event log failed (inquiry saved)", err);
  }

  return json({ ok: true, id: created.id });
}
