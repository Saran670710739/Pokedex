import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div role="status" className="mx-auto max-w-5xl px-6 py-20 text-center text-slate-500">
        กำลังตรวจสอบสถานะสมาชิก...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-3xl">🔒</div>
        <h1 className="mt-6 text-3xl font-extrabold text-slate-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
        <p className="mt-3 text-slate-600">บัญชีของคุณไม่มีสิทธิ์ {role} สำหรับส่วนนี้</p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">กลับหน้าแรก</Link>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
