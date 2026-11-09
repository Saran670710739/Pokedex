
function Navbar({ title }) {
  return (
    <nav className="bg-red-500 px-6 py-4 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <h1 className="text-2xl font-bold">
          {title}
        </h1>

        <div className="flex gap-6">
          <a href="#home" className="hover:underline">
            Home
          </a>
          <a href="#pokemon" className="hover:underline">
            Pokémon
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
