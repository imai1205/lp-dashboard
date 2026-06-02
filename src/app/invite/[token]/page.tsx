import Link from "next/link";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { getSession } from "@/features/auth/queries";
import {
  ROLE_LABEL,
  acceptInvitation,
  getInvitationByToken,
} from "@/features/invitations";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: { token: string } };

export default async function InviteAcceptPage({ params }: Props) {
  const inv = await getInvitationByToken(params.token);
  const session = await getSession();
  const now = Date.now();

  // 状況判別: invalid / revoked / accepted / expired / ready / not-logged-in / email-mismatch
  let state:
    | "invalid"
    | "revoked"
    | "accepted"
    | "expired"
    | "not-logged-in"
    | "email-mismatch"
    | "ready" = "invalid";

  let loginEmail: string | null = null;
  if (!inv) {
    state = "invalid";
  } else if (inv.status === "revoked") {
    state = "revoked";
  } else if (inv.status === "accepted") {
    state = "accepted";
  } else if (inv.expiresAt.getTime() < now) {
    state = "expired";
  } else if (!session) {
    state = "not-logged-in";
  } else {
    // セッションあり: email 一致確認
    const [me] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    loginEmail = me?.email ?? null;
    if (!loginEmail || loginEmail.toLowerCase() !== inv.email.toLowerCase()) {
      state = "email-mismatch";
    } else {
      state = "ready";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 items-center justify-center text-white font-bold text-lg mb-3">
            LP
          </div>
          <h1 className="text-xl font-semibold text-slate-900">組織への招待</h1>
        </div>

        {state === "invalid" && (
          <Notice tone="error" title="招待リンクが無効です">
            URLが正しいかご確認ください。発行者に再発行を依頼することもできます。
          </Notice>
        )}

        {state === "revoked" && (
          <Notice tone="error" title="この招待は取り消されました">
            発行者が招待を取り消しています。改めて発行を依頼してください。
          </Notice>
        )}

        {state === "accepted" && (
          <Notice tone="info" title="この招待は既に受諾済みです">
            <Link href="/dashboard" className="text-brand-600 hover:underline">
              ダッシュボードを開く →
            </Link>
          </Notice>
        )}

        {state === "expired" && (
          <Notice tone="error" title="招待リンクの有効期限が切れています">
            発行から7日が経過しました。発行者に再発行を依頼してください。
          </Notice>
        )}

        {state === "not-logged-in" && inv && (
          <>
            <InviteDetails inv={inv} />
            <Notice tone="info" title="ログインが必要です">
              この招待は <strong>{inv.email}</strong> 宛です。
              そのメールアドレスを持つ Google アカウントでログインしてください。
            </Notice>
            <Link
              href="/login"
              className="block w-full mt-4 text-center bg-brand-600 hover:bg-brand-700 text-white px-4 py-3 rounded-lg transition font-semibold"
            >
              Google でログイン
            </Link>
            <p className="mt-3 text-[11px] text-slate-500 text-center">
              ログイン後、この招待リンクをもう一度開いてください。
            </p>
          </>
        )}

        {state === "email-mismatch" && inv && (
          <>
            <InviteDetails inv={inv} />
            <Notice tone="error" title="メールアドレスが一致しません">
              この招待は <strong>{inv.email}</strong> 宛です。
              <br />
              現在ログイン中: <strong>{loginEmail}</strong>
              <br />
              <br />
              <Link href="/dashboard" className="text-brand-600 hover:underline">
                自分のダッシュボードへ
              </Link>
              {" / "}招待先のアカウントに切り替える場合は一度ログアウトしてください。
            </Notice>
          </>
        )}

        {state === "ready" && inv && (
          <>
            <InviteDetails inv={inv} />
            <form action={acceptInvitation} className="mt-4">
              <input type="hidden" name="token" value={params.token} />
              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white px-4 py-3 rounded-lg transition font-semibold"
              >
                招待を受諾して参加
              </button>
            </form>
            <p className="mt-3 text-[11px] text-slate-500 text-center">
              参加すると、{inv.organizationName} の共有データにアクセスできるようになります。
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function InviteDetails({
  inv,
}: {
  inv: {
    organizationName: string;
    email: string;
    role: "owner" | "admin" | "member";
    expiresAt: Date;
  };
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm space-y-1.5 mb-4">
      <div className="flex justify-between gap-2">
        <span className="text-slate-500 text-xs">組織</span>
        <span className="text-slate-900 font-medium">
          {inv.organizationName}
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-slate-500 text-xs">招待先メール</span>
        <span className="text-slate-900 font-mono text-xs">{inv.email}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-slate-500 text-xs">ロール</span>
        <span className="text-slate-900">{ROLE_LABEL[inv.role]}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-slate-500 text-xs">有効期限</span>
        <span className="text-slate-900 text-xs">
          {formatDateTime(inv.expiresAt.toISOString())}
        </span>
      </div>
    </div>
  );
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: "info" | "error";
  title: string;
  children: React.ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-brand-200 bg-brand-50 text-brand-800";
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-xs leading-relaxed">{children}</div>
    </div>
  );
}
