import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import StatusNotice from "../components/StatusNotice";
import { useAuth } from "../auth/AuthContext";

const fieldClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

function Login() {
  const { user, signIn, isBackendConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  if (user) return <Navigate to="/profile" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNote("");
    if (!isBackendConfigured) {
      setNote("ฟอร์มพร้อมแล้ว แต่ยังไม่มี Go Backend จึงยังไม่สามารถ Login จริงได้");
      return;
    }
    setBusy(true);
    try {
      await signIn({ email: email.trim(), password });
      const destination = location.state?.from?.pathname || "/profile";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to your account"
      subtitle="กลับมาสำรวจ Pokémon ตัวโปรดของคุณกันต่อ"
      footer={<>ยังไม่มีบัญชี? <Link to="/register" className="font-bold text-red-500 hover:underline">สมัครสมาชิก</Link></>}
    >
      {location.state?.registered && (
        <div className="mb-5">
          <StatusNotice success="สมัครสมาชิกสำเร็จแล้ว กรุณาเข้าสู่ระบบ" />
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="text-sm font-semibold text-slate-700">อีเมล</label>
          <input id="login-email" type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="login-password" className="text-sm font-semibold text-slate-700">รหัสผ่าน</label>
          <div className="relative">
            <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password"
              required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="ใส่รหัสผ่าน" className={`${fieldClass} pr-20`} />
            <button type="button" onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
              {showPassword ? "ซ่อน" : "แสดง"}
            </button>
          </div>
        </div>
        <button type="submit" disabled={busy}
          className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60">
          {busy ? "กำลังเข้าสู่ระบบ..." : "Log in →"}
        </button>
        <StatusNotice error={error} note={note} />
        {!isBackendConfigured && (
          <p className="text-center text-sm text-slate-500">
            ยังไม่มี Backend? <Link to="/ui-preview" className="font-bold text-blue-600 hover:underline">ดูตัวอย่างหน้า Profile และ Admin</Link>
          </p>
        )}
      </form>
    </AuthLayout>
  );
}

export default Login;
