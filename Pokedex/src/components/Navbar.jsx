import { Link, NavLink } from "react-router-dom";

function Navbar({ title }) {
  const linkClass = ({ isActive }) =>
    isActive
      ? "rounded-xl bg-red-50 px-4 py-2 font-semibold text-red-500"
      : "rounded-xl px-4 py-2 text-slate-600 transition hover:bg-white hover:text-slate-900";

  return (
    <header className="relative z-40 border-b border-white/80 bg-white/85 px-6 py-4 shadow-sm backdrop-blur-lg">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-slate-900">
          {title}
        </Link>
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/pokemon" className={linkClass}>Pokémon</NavLink>
          <NavLink to="/watchlist" className={linkClass}>Wishlist</NavLink>
          <NavLink to="/about" className={linkClass}>About</NavLink>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
