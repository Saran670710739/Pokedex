import { useState } from "react";
import AccountLayout from "../components/AccountLayout";
import StatusNotice from "../components/StatusNotice";
import { useAuth } from "../auth/AuthContext";

const fieldClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

function ChangePassword({ preview = false }) {
  const { updatePassword, isBackendConfigured } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [note, setNote] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
    setNote("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setNote("");
    if (form.newPassword.length < 8) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setError("รหัสผ่านใหม่ต้องไม่ตรงกับรหัสผ่านเดิม");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("ยืนยันรหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    if (preview || !isBackendConfigured) {
      setNote("ตรวจสอบฟอร์มแล้ว แต่ยังไม่ได้เปลี่ยนรหัสผ่านจริง — รอ Go Backend");
      return;
    }
    setBusy(true);
    try {
      await updatePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
    } catch (err) {
      setError(err.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccountLayout preview={preview} title="Account Security" description="ตั้งค่ารหัสผ่านเพื่อรักษาความปลอดภัยของบัญชี">
      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-2xl text-violet-700">✦</div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Change password</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่ เพื่อยืนยันการเปลี่ยนแปลง</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
          <div>
            <label htmlFor="current-password" className="text-sm font-semibold text-slate-700">รหัสผ่านปัจจุบัน</label>
            <input id="current-password" name="currentPassword" type={show ? "text" : "password"}
              autoComplete="current-password" required value={form.currentPassword} onChange={updateField} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="new-password" className="text-sm font-semibold text-slate-700">รหัสผ่านใหม่</label>
            <input id="new-password" name="newPassword" type={show ? "text" : "password"}
              autoComplete="new-password" minLength={8} required value={form.newPassword} onChange={updateField} className={fieldClass} />
            <p className="mt-2 text-xs text-slate-500">อย่างน้อย 8 ตัวอักษร และไม่ซ้ำกับรหัสผ่านเดิม</p>
          </div>
          <div>
            <label htmlFor="confirm-new-password" className="text-sm font-semibold text-slate-700">ยืนยันรหัสผ่านใหม่</label>
            <input id="confirm-new-password" name="confirmPassword" type={show ? "text" : "password"}
              autoComplete="new-password" minLength={8} required value={form.confirmPassword} onChange={updateField} className={fieldClass} />
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-blue-600" />
            แสดงรหัสผ่าน
          </label>
          <StatusNotice error={error} success={success} note={note} />
          <div className="border-t border-slate-100 pt-5">
            <button type="submit" disabled={busy}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
              {busy ? "กำลังเปลี่ยนรหัสผ่าน..." : "Update password"}
            </button>
          </div>
        </form>
      </section>
      <div className="mt-6 rounded-2xl border border-rose-100 bg-white/70 p-5 text-sm leading-6 text-slate-600">
        <strong className="text-slate-800">Security tip:</strong> อย่าใช้รหัสผ่านซ้ำกับเว็บไซต์อื่น และอย่าแชร์รหัสผ่านกับใคร
      </div>
    </AccountLayout>
  );
}

export default ChangePassword;
