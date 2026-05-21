import LoginButton from "./LoginButton";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 items-center justify-center text-white font-bold text-lg mb-3">
            LP
          </div>
          <h1 className="text-xl font-semibold text-slate-900">LP Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            ランディングページの成果を可視化
          </p>
        </div>
        <LoginButton />
        <p className="mt-6 text-xs text-slate-400 text-center">
          ログインすることで利用規約とプライバシーポリシーに同意したものとみなされます
        </p>
      </div>
    </div>
  );
}
