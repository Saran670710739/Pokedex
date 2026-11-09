
import { NavLink } from "react-router-dom";

function Navbar({ title }) {
  const linkClass = ({ isActive }) =>
    isActive
      ? "font-semibold text-red-500"
      : "text-gray-500 transition hover:text-gray-900";

  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>

        <div className="flex flex-wrap gap-5 text-sm">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>

          <NavLink to="/pokemon" className={linkClass}>
            Pokémon
          </NavLink>

          <NavLink to="/watchlist" className={linkClass}>
            Wishlist
          </NavLink>

          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
