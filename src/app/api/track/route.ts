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

  if (typeof siteId !== "string" || !siteId) {
    return json({ ok: false, error: "siteId is required" }, { status: 400 });
  }
  if (typeof eventKey !== "string" || !eventKey) {
    return json({ ok: false, error: "eventKey is required" }, { status: 400 });
  }

  // サイト存在チェック (spoof対策)
  const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
  if (!site) {
    return json({ ok: false, error: "site not found" }, { status: 404 });
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
    metadata: isPlainObject(metadata) ? metadata : null,
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
  });

  return json({ ok: true });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
