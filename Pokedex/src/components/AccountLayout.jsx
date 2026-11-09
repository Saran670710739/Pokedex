import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/profile", label: "ข้อมูลส่วนตัว", icon: "◉" },
  { to: "/settings/password", label: "เปลี่ยนรหัสผ่าน", icon: "✦" },
];

function AccountLayout({ title, description, children, preview = false }) {
  const base = preview ? "/ui-preview" : "";

  return (
    <div className="relative isolate min-h-[calc(100vh-100px)] overflow-hidden bg-[#fff9fc] px-4 py-10 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        {preview && (
          <p role="note" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            ตัวอย่าง Frontend UI เท่านั้น — ไม่ใช่บัญชีที่ Login จริงและไม่มีการบันทึกข้อมูลลง Backend
          </p>
        )}
        <div className="mb-9">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-red-500">MY ACCOUNT</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-white bg-white/90 p-4 shadow-sm">
            <p className="px-3 pb-3 pt-1 text-xs font-bold uppercase tracking-wider text-slate-400">Account menu</p>
            {navItems.map(({ to, label, icon }) => (
              <NavLink key={to} to={`${base}${to}`}
                className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? "bg-rose-50 text-red-500" : "text-slate-600 hover:bg-slate-50"
                }`}>
                <span aria-hidden="true">{icon}</span>{label}
              </NavLink>
            ))}
            {preview && <NavLink to="/ui-preview" className="mt-4 block border-t border-slate-100 px-4 pt-4 text-sm font-semibold text-blue-600 hover:underline">← กลับหน้า UI Preview</NavLink>}
          </aside>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default AccountLayout;
