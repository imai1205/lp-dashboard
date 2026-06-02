// ダッシュボードのKPIサマリー型。
// 後で db.query.analyticsDaily ベースの集計結果型に置き換える想定。
export type Summary = {
  impressions: number;
  visitors: number;
  sessions: number;
  conversions: number;
  cvr: number;
  impressionsDelta: number;
  visitorsDelta: number;
  sessionsDelta: number;
  conversionsDelta: number;
  cvrDelta: number;
};
