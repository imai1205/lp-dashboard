// ⚠️ TRANSITIONAL: DB接続が完成したら廃止する。
// 型は features/<domain>/types.ts に集約済み。ここはダミー値のみ。

import type { Summary } from "@/features/dashboard";
import type { ReferrerRank, ActionResult } from "@/features/analytics";
import type { Inquiry } from "@/features/inquiries";

export type { Summary, ReferrerRank, ActionResult, Inquiry };

export const summary: Summary = {
  impressions: 128_540,
  visitors: 42_310,
  conversions: 1_284,
  cvr: 3.04,
  impressionsDelta: 12.4,
  visitorsDelta: 8.1,
  conversionsDelta: 15.7,
  cvrDelta: 0.7,
};

export const referrerRanking: ReferrerRank[] = [
  { source: "google", label: "Google検索", icon: "🔍", visitors: 18_420, conversions: 612 },
  { source: "yahoo", label: "Yahoo!検索", icon: "🔍", visitors: 9_830, conversions: 254 },
  { source: "x", label: "X (Twitter)", icon: "𝕏", visitors: 5_210, conversions: 168 },
  { source: "instagram", label: "Instagram", icon: "📷", visitors: 4_125, conversions: 121 },
  { source: "(direct)", label: "直接アクセス", icon: "🔗", visitors: 2_980, conversions: 79 },
  { source: "newsletter", label: "メルマガ", icon: "📧", visitors: 1_745, conversions: 50 },
];

export const actionResults: ActionResult[] = [
  { label: "資料請求", count: 612, share: 47.7 },
  { label: "お問い合わせ", count: 318, share: 24.8 },
  { label: "無料体験 申込", count: 214, share: 16.7 },
  { label: "見積もり依頼", count: 92, share: 7.2 },
  { label: "電話タップ", count: 48, share: 3.6 },
];

export const inquiries: Inquiry[] = [
  {
    id: "INQ-2026-0142",
    receivedAt: "2026-05-19T10:24:00+09:00",
    name: "山田 太郎",
    email: "taro.yamada@example.com",
    message: "資料を送ってください。導入時期は来月を予定しています。",
    status: "未対応",
  },
  {
    id: "INQ-2026-0141",
    receivedAt: "2026-05-19T09:02:00+09:00",
    name: "佐藤 花子",
    email: "hanako.sato@example.co.jp",
    message: "料金プランの詳細について相談したいです。",
    status: "対応中",
  },
  {
    id: "INQ-2026-0140",
    receivedAt: "2026-05-18T18:41:00+09:00",
    name: "鈴木 健",
    email: "ken@suzuki-corp.jp",
    message: "デモを希望します。来週水曜以降でお願いします。",
    status: "対応中",
  },
  {
    id: "INQ-2026-0139",
    receivedAt: "2026-05-18T14:13:00+09:00",
    name: "田中 美咲",
    email: "misaki.t@example.com",
    message: "競合他社からの乗り換えを検討しています。",
    status: "完了",
  },
  {
    id: "INQ-2026-0138",
    receivedAt: "2026-05-17T11:55:00+09:00",
    name: "高橋 隆",
    email: "takahashi@example.jp",
    message: "API連携の可否について教えてください。",
    status: "未対応",
  },
];
