import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import {
  analyticsDaily,
  analyticsSourcesDaily,
  eventDefinitions,
  events,
  inquiries,
  organizationMembers,
  organizations,
  sites,
  users,
} from "./schema";

config({ path: ".env.local" });

function yyyymmdd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set in .env.local");

  console.log(`🎯 Target: ${url}`);
  console.log("");

  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });

  // ---- 既存データを全消し (FK 依存の逆順) ---------------------------------
  console.log("🧹 Clearing existing data...");
  await db.delete(inquiries);
  await db.delete(events);
  await db.delete(analyticsSourcesDaily);
  await db.delete(analyticsDaily);
  await db.delete(eventDefinitions);
  await db.delete(sites);
  await db.delete(organizationMembers);
  await db.delete(users);
  await db.delete(organizations);

  // ---- 1. organization ---------------------------------------------------
  const [org] = await db
    .insert(organizations)
    .values({ name: "Demo Co." })
    .returning();
  console.log(`✅ organization        : ${org.name} (${org.id})`);

  // ---- 2. site -----------------------------------------------------------
  const [site] = await db
    .insert(sites)
    .values({
      organizationId: org.id,
      name: "Main LP",
      domain: "demo.example.com",
      trackingId: "trk_demo_main",
    })
    .returning();
  console.log(`✅ site                : ${site.name} (${site.trackingId})`);

  // ---- 3. event_definitions (3件) ---------------------------------------
  const defs = await db
    .insert(eventDefinitions)
    .values([
      {
        siteId: site.id,
        key: "form_submit",
        label: "資料請求",
        type: "conversion",
        isConversion: true,
        sortOrder: 1,
      },
      {
        siteId: site.id,
        key: "contact_form",
        label: "お問い合わせ",
        type: "conversion",
        isConversion: true,
        sortOrder: 2,
      },
      {
        siteId: site.id,
        key: "phone_tap",
        label: "電話タップ",
        type: "conversion",
        isConversion: true,
        sortOrder: 3,
      },
    ])
    .returning();
  console.log(`✅ event_definitions   : ${defs.length} 件`);

  // ---- 4. analytics_daily (7日分、今日を含む直近7日) --------------------
  const today = new Date();
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(yyyymmdd(d));
  }

  // 日が進むにつれ少しずつ伸びる数値 (再現性のために決定的)
  const dailyRows = dates.map((date, i) => ({
    siteId: site.id,
    date,
    impressions: 4500 + i * 600,
    visitors: 1400 + i * 180,
    conversions: 28 + i * 5,
  }));
  await db.insert(analyticsDaily).values(dailyRows);
  console.log(`✅ analytics_daily     : ${dailyRows.length} 日分`);

  // ---- 5. analytics_sources_daily (6 source × 7 day = 42 件) ------------
  const SOURCES = [
    { name: "Google 検索", weight: 0.4, cvr: 0.035 },
    { name: "Yahoo!広告", weight: 0.2, cvr: 0.028 },
    { name: "X (Twitter)", weight: 0.12, cvr: 0.025 },
    { name: "Instagram", weight: 0.1, cvr: 0.022 },
    { name: "ダイレクト", weight: 0.1, cvr: 0.02 },
    { name: "メルマガ", weight: 0.08, cvr: 0.03 },
  ];

  const sourceRows: Array<typeof analyticsSourcesDaily.$inferInsert> = [];
  for (let i = 0; i < dates.length; i++) {
    const v = dailyRows[i].visitors;
    for (const s of SOURCES) {
      const visitors = Math.round(v * s.weight);
      const conversions = Math.round(visitors * s.cvr);
      sourceRows.push({
        siteId: site.id,
        date: dates[i],
        source: s.name,
        visitors,
        conversions,
      });
    }
  }
  await db.insert(analyticsSourcesDaily).values(sourceRows);
  console.log(
    `✅ analytics_sources_daily: ${sourceRows.length} 件 (${SOURCES.length} sources × ${dates.length} days)`,
  );

  // ---- 5.5. events (CVを 3 event_def に 50/30/20 で按分し、日次の合計と一致させる)
  // 「アクション別成果」のソースになる。
  const DEF_RATIO = [0.5, 0.3, 0.2]; // 資料請求 / お問い合わせ / 電話タップ
  const eventRows: Array<typeof events.$inferInsert> = [];
  for (let i = 0; i < dates.length; i++) {
    const totalCvs = dailyRows[i].conversions;
    const baseTs = new Date(`${dates[i]}T00:00:00.000Z`).getTime();
    for (let j = 0; j < defs.length; j++) {
      const count = Math.round(totalCvs * DEF_RATIO[j]);
      for (let k = 0; k < count; k++) {
        // 9:00-21:00 の間に12刻みでばらけさせる (決定的)
        const hour = 9 + (k % 13);
        eventRows.push({
          siteId: site.id,
          eventDefinitionId: defs[j].id,
          type: "conversion",
          source: SOURCES[k % SOURCES.length].name,
          occurredAt: new Date(baseTs + hour * 60 * 60 * 1000),
        });
      }
    }
  }
  await db.insert(events).values(eventRows);
  console.log(`✅ events              : ${eventRows.length} 件 (conversion)`);

  // ---- 6. inquiries (5件、ステータス散らす) -----------------------------
  const t = today.getTime();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  await db.insert(inquiries).values([
    {
      siteId: site.id,
      name: "山田 太郎",
      email: "taro.yamada@example.com",
      company: "山田商事",
      message: "資料を送ってください。導入時期は来月を予定しています。",
      status: "open",
      receivedAt: new Date(t - 2 * hour),
    },
    {
      siteId: site.id,
      name: "佐藤 花子",
      email: "hanako.sato@example.co.jp",
      message: "料金プランの詳細について相談したいです。",
      status: "in_progress",
      receivedAt: new Date(t - 8 * hour),
    },
    {
      siteId: site.id,
      name: "鈴木 健",
      email: "ken@suzuki-corp.jp",
      phone: "03-1234-5678",
      message: "デモを希望します。来週水曜以降でお願いします。",
      status: "in_progress",
      receivedAt: new Date(t - 1 * day),
    },
    {
      siteId: site.id,
      name: "田中 美咲",
      email: "misaki.t@example.com",
      message: "競合他社からの乗り換えを検討しています。",
      status: "resolved",
      receivedAt: new Date(t - 2 * day),
    },
    {
      siteId: site.id,
      name: "高橋 隆",
      email: "takahashi@example.jp",
      message: "API連携の可否について教えてください。",
      status: "open",
      receivedAt: new Date(t - 3 * day),
    },
  ]);
  console.log("✅ inquiries           : 5 件");

  console.log("");
  console.log("🎉 Seed completed");

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
