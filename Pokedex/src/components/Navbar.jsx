
function Navbar({ title }) {
  return (
    <nav>
      <h1>{title}</h1>
      <div>
        <a href="#home">Home</a>{" | "}
        <a href="#pokemon">Pokémon</a>
      </div>
    </nav>
  );
}

export default Navbar;
