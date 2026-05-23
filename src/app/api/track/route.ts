import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { eventDefinitions, events, sites } from "@/db/schema";

// 外部LPの tracker.js から呼ばれる公開エンドポイント。
// middleware.matcher で /api 配下は除外しているので、認証ガードは無い。
//
// 受信ボディ:
//   { siteId: string, eventKey: string, metadata?: object }
//
// 動作:
//   1. siteId のサイトが存在するか確認
//   2. event_definitions から (siteId, eventKey) で定義を引く (なければ null で続行)
//   3. events に type="conversion" / occurredAt=now で INSERT

// libsql (Turso) を呼ぶので Node ランタイム必須。Edge 不可。
export const runtime = "nodejs";
// 外部LPからのPOSTを毎回新規処理するためキャッシュ無効
export const dynamic = "force-dynamic";

// CORS: credentials を送らない前提なので "*" でOK。
// クッキーが必要になる場合は Origin を allowlist に切り替えること。
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
  // application/json の preflight 用
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const { siteId, eventKey, metadata } = (body ?? {}) as {
    siteId?: unknown;
    eventKey?: unknown;
    metadata?: unknown;
  };

  // バリデーション: 型 + 長さ上限 (DoS / DB肥大化対策)
  const MAX_ID = 64;
  const MAX_KEY = 100;
  const MAX_METADATA_BYTES = 2000;

  if (typeof siteId !== "string" || !siteId || siteId.length > MAX_ID) {
    return json({ ok: false, error: "siteId is required" }, { status: 400 });
  }
  if (typeof eventKey !== "string" || !eventKey || eventKey.length > MAX_KEY) {
    return json({ ok: false, error: "eventKey is required" }, { status: 400 });
  }

  // metadata は JSON object のみ許可、シリアライズ後 2KB 超は拒否
  let safeMetadata: Record<string, unknown> | null = null;
  if (isPlainObject(metadata)) {
    try {
      const serialized = JSON.stringify(metadata);
      if (serialized.length > MAX_METADATA_BYTES) {
        return json(
          { ok: false, error: "metadata too large" },
          { status: 413 },
        );
      }
      safeMetadata = metadata;
    } catch {
      // 循環参照等
      return json({ ok: false, error: "metadata not serializable" }, { status: 400 });
    }
  }

  // サイト存在チェック (spoof対策) + アクティブ確認 (無効化サイトは弾く)
  const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
  if (!site) {
    return json({ ok: false, error: "site not found" }, { status: 404 });
  }
  if (!site.isActive) {
    return json({ ok: false, error: "site is inactive" }, { status: 403 });
  }

  // 対応する event_definition を引く。存在しなくても event は記録する。
  const [def] = await db
    .select()
    .from(eventDefinitions)
    .where(and(eq(eventDefinitions.siteId, siteId), eq(eventDefinitions.key, eventKey)))
    .limit(1);

  await db.insert(events).values({
    siteId,
    eventDefinitionId: def?.id ?? null,
    // 定義があればその type を使う。なければ既定で "conversion"
    type: def?.type ?? "conversion",
    occurredAt: new Date(),
    metadata: safeMetadata,
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
  });

  return json({ ok: true });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
