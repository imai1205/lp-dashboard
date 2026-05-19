// 起動時に必須env varを検証する。zod等を入れたらここで parse する。

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const env = {
  TURSO_DATABASE_URL: required("TURSO_DATABASE_URL", process.env.TURSO_DATABASE_URL),
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ?? "",
  NODE_ENV: (process.env.NODE_ENV ?? "development") as
    | "development"
    | "production"
    | "test",
};
