// 機能横断で使う共通型。
// 特定ドメインに属するものは features/<domain>/types.ts に置く。

export type Nullable<T> = T | null;

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type Paginated<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type DateRange = {
  from: Date;
  to: Date;
};
