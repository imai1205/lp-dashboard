// 流入元ランキングの1行
export type ReferrerRank = {
  source: string;
  visitors: number;
  conversions: number;
};

// アクション別成果の1行
export type ActionResult = {
  label: string;
  count: number;
  share: number; // 全体に占める割合 (％)
};
