import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import StatusNotice from "../components/StatusNotice";
import { useAuth } from "../auth/AuthContext";

const fieldClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

function Register() {
  const { signUp, isBackendConfigured } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setNote("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNote("");
    if (form.name.trim().length < 2) {
      setError("กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร");
      return;
    }
    if (form.password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านที่ยืนยันไม่ตรงกัน");
      return;
    }
    if (!isBackendConfigured) {
      setNote("ตรวจสอบข้อมูลเบื้องต้นแล้ว แต่ยังไม่มี Go Backend จึงยังไม่ได้สร้างบัญชีจริง");
      return;
    }
    setBusy(true);
    try {
      await signUp({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      setError(err.message || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Join PokémonHub"
      title="Create your account"
      subtitle="สมัครสมาชิกเพื่อเตรียมเก็บ Pokémon ตัวโปรดไว้ในคอลเลกชันของคุณ"
      footer={<>มีบัญชีอยู่แล้ว? <Link to="/login" className="font-bold text-red-500 hover:underline">เข้าสู่ระบบ</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="register-name" className="text-sm font-semibold text-slate-700">ชื่อผู้ใช้</label>
          <input id="register-name" name="name" type="text" minLength={2} maxLength={50} autoComplete="username"
            required value={form.name} onChange={updateField} placeholder="ชื่อที่ต้องการให้แสดง" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="register-email" className="text-sm font-semibold text-slate-700">อีเมล</label>
          <input id="register-email" name="email" type="email" autoComplete="email" required value={form.email}
            onChange={updateField} placeholder="you@example.com" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="register-password" className="text-sm font-semibold text-slate-700">รหัสผ่าน</label>
          <div className="relative">
            <input id="register-password" name="password" type={showPassword ? "text" : "password"}
              minLength={8} autoComplete="new-password" required value={form.password}
              onChange={updateField} placeholder="อย่างน้อย 8 ตัวอักษร" className={`${fieldClass} pr-20`} />
            <button type="button" onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
              {showPassword ? "ซ่อน" : "แสดง"}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="register-confirm" className="text-sm font-semibold text-slate-700">ยืนยันรหัสผ่าน</label>
          <input id="register-confirm" name="confirmPassword" type="password" minLength={8} autoComplete="new-password"
            required value={form.confirmPassword} onChange={updateField} placeholder="กรอกรหัสผ่านอีกครั้ง" className={fieldClass} />
        </div>
        <StatusNotice error={error} note={note} />
        <button type="submit" disabled={busy}
          className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60">
          {busy ? "กำลังสมัครสมาชิก..." : "Create account →"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Register;
