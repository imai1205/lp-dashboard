// UI表示用の問い合わせ型 (ダッシュボードのテーブルが参照)。
// DB側 (db/schema inquiries) は status を english key で持つので、
// queries.ts で view model 変換する想定。
export type Inquiry = {
  id: string;
  receivedAt: string; // ISO
  name: string;
  email: string;
  message: string;
  status: "未対応" | "対応中" | "完了";
};

// 新規問い合わせ受信ペイロード (公開フォーム / track API 用)
export type NewInquiryInput = {
  siteId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
};

// 管理画面用の型。english status をそのまま保持 (select で送信し直すため)。
export type InquiryStatus = "open" | "in_progress" | "resolved";

export type InquiryAdminRow = {
  id: string;
  siteId: string;
  siteName: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  status: InquiryStatus;
  receivedAt: string; // ISO
  createdAt: string; // ISO
};

// as const でリテラル型を保持。Inquiry.status (Japanese union) と互換にするため。
export const STATUS_LABEL = {
  open: "未対応",
  in_progress: "対応中",
  resolved: "完了",
} as const satisfies Record<InquiryStatus, "未対応" | "対応中" | "完了">;

export const STATUS_BADGE_STYLE = {
  open: "bg-rose-50 text-rose-700 border-rose-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-slate-100 text-slate-600 border-slate-200",
} as const satisfies Record<InquiryStatus, string>;
