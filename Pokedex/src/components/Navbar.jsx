
import { NavLink } from "react-router-dom";

function Navbar({ title }) {
  const linkClass = ({ isActive }) =>
    isActive
      ? "font-bold underline underline-offset-4"
      : "hover:underline";

  return (
    <nav className="bg-red-500 px-6 py-4 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>

        <div className="flex gap-6">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>

          <NavLink to="/pokemon" className={linkClass}>
            Pokémon
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
