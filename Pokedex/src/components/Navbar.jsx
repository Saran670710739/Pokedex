import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const linkClass = ({ isActive }) =>
  `rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive
      ? "bg-rose-50 text-red-500"
      : "text-slate-600 hover:bg-rose-50/70 hover:text-slate-900"
  }`;

function Navbar({ title = "PokémonHub" }) {
  const { user, loading, signOut, isBackendConfigured } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setLoggingOut(true);
    setError("");
    try {
      await signOut();
    } catch (err) {
      setError(err.message || "ออกจากระบบไม่สำเร็จ");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="relative z-40 border-b border-rose-100/70 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-6">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-red-500">◉</span>
          {title}
        </Link>
        <div className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/pokemon" className={linkClass}>Pokémon</NavLink>
          <NavLink to="/watchlist" className={linkClass}>Wishlist</NavLink>
          <NavLink to="/about" className={linkClass}>About</NavLink>
          {!isBackendConfigured && (
            <NavLink to="/ui-preview" className={linkClass}>UI Preview</NavLink>
          )}
          {!loading && !user && (
            <>
              <NavLink to="/login" className={linkClass}>Log in</NavLink>
              <Link to="/register" className="ml-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700">Sign up</Link>
            </>
          )}
          {!loading && user && (
            <>
              <NavLink to="/profile" className={linkClass}>Profile</NavLink>
              {user.role === "admin" && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
              <button type="button" disabled={loggingOut} onClick={handleLogout}
                className="ml-1 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-rose-50 disabled:opacity-50">
                {loggingOut ? "กำลังออก..." : "Logout"}
              </button>
            </>
          )}
        </div>
      </nav>
      {error && <p role="alert" className="mx-auto mt-2 max-w-6xl text-sm text-red-600">{error}</p>}
    </header>
  );
}

export default Navbar;
