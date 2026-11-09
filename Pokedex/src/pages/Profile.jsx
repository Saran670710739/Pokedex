import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AccountLayout from "../components/AccountLayout";
import StatusNotice from "../components/StatusNotice";
import { useAuth } from "../auth/AuthContext";

// Only for /ui-preview/profile; never treated as an authenticated session.
const SAMPLE_USER = {
  id: "preview-001",
  name: "Pokémon Trainer",
  email: "trainer@example.com",
  role: "member",
  joinedAt: "2026-11-01",
};

const fieldClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

function Profile({ preview = false, wishlistCount = 0 }) {
  const { user, saveProfile, isBackendConfigured } = useAuth();
  const person = preview ? SAMPLE_USER : user;
  const [form, setForm] = useState({ name: person?.name || "", email: person?.email || "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    setForm({ name: person?.name || "", email: person?.email || "" });
  }, [person?.name, person?.email]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setNote("");
    if (form.name.trim().length < 2) {
      setError("ชื่อที่แสดงต้องมีอย่างน้อย 2 ตัวอักษร");
      return;
    }
    if (preview || !isBackendConfigured) {
      setNote("นี่คือหน้าตัวอย่าง UI — ยังไม่ได้บันทึกข้อมูลลง Backend");
      return;
    }
    setBusy(true);
    try {
      await saveProfile({ name: form.name.trim(), email: form.email.trim() });
      setSuccess("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
    } catch (err) {
      setError(err.message || "บันทึกโปรไฟล์ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const initial = (person?.name || "P").trim().charAt(0).toUpperCase();
  return (
    <AccountLayout preview={preview} title="Trainer Profile" description="จัดการข้อมูลโปรไฟล์และบัญชีของคุณ">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-white bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-rose-100 via-pink-50 to-violet-100" />
          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-10 flex flex-wrap items-end justify-between gap-3">
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-red-500 text-3xl font-extrabold text-white shadow-md" aria-label="อักษรย่อชื่อผู้ใช้">{initial}</span>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                {person?.role || "member"}
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-slate-900">{person?.name || "Trainer"}</h2>
            <p className="mt-1 text-sm text-slate-500">{person?.email || "—"}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-slate-600">♡ Wishlist <strong className="ml-2 text-slate-900">{preview ? "ตัวอย่าง" : wishlistCount}</strong></div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Account ID <strong className="ml-2 text-slate-900">{person?.id || "—"}</strong></div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-900">Personal information</h2>
            <p className="mt-2 text-sm text-slate-500">ข้อมูลที่แสดงในโปรไฟล์สมาชิก</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-name" className="text-sm font-semibold text-slate-700">ชื่อที่แสดง</label>
                <input id="profile-name" type="text" minLength={2} maxLength={50} required value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="profile-email" className="text-sm font-semibold text-slate-700">อีเมล</label>
                <input id="profile-email" type="email" required value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className={fieldClass} />
              </div>
            </div>
            <StatusNotice error={error} success={success} note={note} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <Link to={preview ? "/ui-preview/settings/password" : "/settings/password"}
                className="text-sm font-bold text-blue-600 hover:underline">เปลี่ยนรหัสผ่าน →</Link>
              <button type="submit" disabled={busy}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                {busy ? "กำลังบันทึก..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AccountLayout>
  );
}

export default Profile;
