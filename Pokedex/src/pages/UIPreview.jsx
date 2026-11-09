import { Link } from "react-router-dom";

const previewItems = [
  { to: "/ui-preview/profile", icon: "◉", name: "Trainer Profile", desc: "ดูข้อมูลบัญชี และแบบฟอร์มแก้ไขชื่อ/อีเมล", shade: "bg-rose-100 text-red-500" },
  { to: "/ui-preview/settings/password", icon: "✦", name: "Account Security", desc: "ทดลองตรวจสอบฟอร์มเปลี่ยนรหัสผ่าน", shade: "bg-violet-100 text-violet-700" },
  { to: "/ui-preview/admin", icon: "▦", name: "Admin Dashboard", desc: "ดูหน้าตารางสมาชิกและตัวกรองด้วยข้อมูลตัวอย่าง", shade: "bg-blue-100 text-blue-700" },
];

function UIPreview() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#fff9fc] px-4 py-14 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-rose-200/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-violet-200/50 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-red-500">FRONTEND SHOWCASE</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Account UI Preview</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
          ตัวอย่างหน้าสมาชิกและ Admin ที่เตรียมไว้เพื่อรอเชื่อม Go Backend — ไม่ใช่ระบบ Login จริง
        </p>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {previewItems.map((item) => (
            <Link to={item.to} key={item.to}
              className="group rounded-3xl border border-white bg-white/90 p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${item.shade}`}>{item.icon}</div>
              <h2 className="mt-7 text-xl font-extrabold text-slate-900">{item.name}</h2>
              <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-500">{item.desc}</p>
              <span className="mt-7 inline-block text-sm font-bold text-blue-600 group-hover:underline">ดูตัวอย่าง →</span>
            </Link>
          ))}
        </div>
        <div className="mt-9 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
          <strong>สถานะการพัฒนา:</strong> ฝั่ง React UI เสร็จแล้ว แต่ยังไม่สร้างบัญชี เก็บข้อมูลสมาชิก หรืออนุญาตการใช้งาน Admin จริง
          เมื่อ Go Backend พร้อม จึงเชื่อม API และปิดหน้าสาธิตนี้ได้
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/login" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">หน้า Login</Link>
          <Link to="/register" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">หน้า Register</Link>
        </div>
      </div>
    </section>
  );
}

export default UIPreview;
