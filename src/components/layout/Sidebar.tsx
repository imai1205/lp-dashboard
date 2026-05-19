const nav = [
  { label: "ダッシュボード", icon: "📊", active: true },
  { label: "アクセス解析", icon: "📈", active: false },
  { label: "成果ログ", icon: "🎯", active: false },
  { label: "問い合わせ", icon: "✉️", active: false },
  { label: "LP管理", icon: "🗂", active: false },
  { label: "設定", icon: "⚙️", active: false },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-slate-200 bg-white">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">
            LP
          </div>
          <span className="font-semibold text-slate-900">LP Analytics</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              item.active
                ? "bg-brand-50 text-brand-700 font-medium"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-semibold">
            A
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium text-slate-900">Account name</div>
            <div className="text-xs text-slate-500">Acme Inc.</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
