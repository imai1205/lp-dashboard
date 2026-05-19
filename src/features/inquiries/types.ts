// UI表示用の問い合わせ型。
// DB側 (db/schema.ts inquiries) は status を english key で持つので、
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
