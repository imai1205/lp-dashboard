// 流入元ランキングの1行
export type ReferrerRank = {
  /** 正規化前の生ソース文字列 (GA4 由来) */
  source: string;
  /** 顧客向け表示名 (normalizeSource() 適用後) */
  label: string;
  /** 識別用アイコン */
  icon: string;
  visitors: number;
  conversions: number;
};

// アクション別成果の1行
export type ActionResult = {
  label: string;
  count: number;
  share: number; // 全体に占める割合 (％)
};
