import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminSummary, getAdminUsers } from "../api/backend";

// Pure sample data for /ui-preview/admin. No real user records are exposed.
const DEMO_USERS = [
  { id: "demo-001", name: "Trainer Alpha", email: "alpha@example.com", role: "member", status: "active" },
  { id: "demo-002", name: "Trainer Beta", email: "beta@example.com", role: "member", status: "active" },
  { id: "demo-003", name: "Trainer Gamma", email: "gamma@example.com", role: "admin", status: "active" },
  { id: "demo-004", name: "Trainer Delta", email: "delta@example.com", role: "member", status: "inactive" },
];

function StatCard({ label, value, icon, detail, shade }) {
  return (
    <div className="rounded-3xl border border-white bg-white/90 p-6 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${shade}`}>{icon}</div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function Admin({ preview = false }) {
  const [users, setUsers] = useState(preview ? DEMO_USERS : []);
  const [summary, setSummary] = useState(preview ? { totalUsers: 4, activeUsers: 3, totalAdmins: 1 } : null);
  const [status, setStatus] = useState(preview ? "success" : "loading");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    if (preview) return;
    let ignore = false;
    setStatus("loading");
    setError("");
    Promise.all([getAdminSummary(), getAdminUsers()])
      .then(([summaryData, usersData]) => {
        if (ignore) return;
        const list = Array.isArray(usersData) ? usersData : (usersData?.users || usersData?.data || []);
        setUsers(Array.isArray(list) ? list : []);
        setSummary(summaryData?.data || summaryData);
        setStatus("success");
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || "โหลด Dashboard ไม่สำเร็จ");
          setStatus("error");
        }
      });
    return () => {
      ignore = true;
    };
  }, [preview, retryKey]);

  const visibleUsers = useMemo(
    () => users.filter((person) => {
      const keyword = query.trim().toLowerCase();
      const matchText = `${person.name || ""} ${person.email || ""}`.toLowerCase().includes(keyword);
      const matchRole = roleFilter === "all" || person.role === roleFilter;
      return matchText && matchRole;
    }),
    [users, query, roleFilter]
  );

  const stats = [
    { label: "Total members", value: summary?.totalUsers ?? "—", icon: "♟", detail: "สมาชิกทั้งหมด", shade: "bg-blue-50 text-blue-600" },
    { label: "Active users", value: summary?.activeUsers ?? "—", icon: "✦", detail: "สมาชิกที่ใช้งาน", shade: "bg-emerald-50 text-emerald-600" },
    { label: "Administrators", value: summary?.totalAdmins ?? "—", icon: "◈", detail: "ผู้ดูแลระบบ", shade: "bg-rose-50 text-red-500" },
  ];

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#fff9fc] px-4 py-10 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 -top-20 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        {preview && (
          <p role="note" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            UI Preview เท่านั้น — จำนวนสมาชิกและบัญชีในตารางเป็นข้อมูลตัวอย่าง ไม่ใช่ฐานข้อมูลจริง
          </p>
        )}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-red-500">MANAGEMENT</span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-3 text-sm text-slate-500">ภาพรวมสมาชิกและการดูแล PokémonHub</p>
          </div>
          {preview && <Link to="/ui-preview" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-blue-600">← กลับหน้า Preview</Link>}
        </div>

        {status === "loading" && <p role="status" className="rounded-2xl bg-white p-6 text-slate-500">กำลังโหลดข้อมูลผู้ดูแลระบบ...</p>}
        {status === "error" && (
          <div role="alert" className="rounded-2xl bg-white p-6">
            <p className="text-red-600">{error}</p>
            <button type="button" onClick={() => setRetryKey((value) => value + 1)}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white">ลองใหม่</button>
          </div>
        )}
        {status === "success" && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {stats.map((item) => <StatCard key={item.label} {...item} />)}
            </div>
            <section className="mt-8 overflow-hidden rounded-3xl border border-white bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Member management</h2>
                  <p className="mt-1 text-sm text-slate-500">แสดงข้อมูลสมาชิกจาก Backend เมื่อพร้อมใช้งาน</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label htmlFor="admin-search" className="sr-only">ค้นหาสมาชิก</label>
                  <input id="admin-search" type="search" placeholder="ค้นหาชื่อหรืออีเมล..." value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-rose-300 sm:w-64" />
                  <label htmlFor="admin-role" className="sr-only">กรองสิทธิ์สมาชิก</label>
                  <select id="admin-role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
                    <option value="all">All roles</option>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="px-6 py-4">Member</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">ID</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleUsers.map((person) => (
                      <tr key={person.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{person.name || "—"}</p>
                          <p className="mt-1 text-xs text-slate-500">{person.email || "—"}</p>
                        </td>
                        <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${person.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-blue-50 text-blue-700"}`}>{person.role || "member"}</span></td>
                        <td className="px-6 py-4"><span className="text-slate-600">{person.status || "—"}</span></td>
                        <td className="px-6 py-4 text-slate-400">{person.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visibleUsers.length === 0 && <p className="p-8 text-center text-sm text-slate-500">ไม่พบสมาชิกตามเงื่อนไขที่ค้นหา</p>}
              </div>
              <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">แสดง {visibleUsers.length} จาก {users.length} รายการ</div>
            </section>
            <p className="mt-6 text-sm leading-6 text-slate-500">
              การแก้สิทธิ์ ลบบัญชี หรือระงับสมาชิกยังไม่เปิดใช้งานจนกว่า Go Backend จะตรวจสิทธิ์ Admin จริง
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default Admin;
