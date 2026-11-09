
import Navbar from "./components/Navbar";
import PokemonGrid from "./components/PokemonGrid";
import pokemon from "./data/pokemon";

function App() {
  return (
    <div id="home" className="min-h-screen bg-gray-100">
      <Navbar title="PokémonHub" />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="mb-3 text-4xl font-bold">
          Welcome to PokémonHub
        </h1>

        <p className="mb-10 text-gray-600">
          Explore your favorite Pokémon!
        </p>

        <section id="pokemon">
          <h2 className="mb-6 text-2xl font-bold">
            Pokémon List
          </h2>

          <PokemonGrid pokemons={pokemon} />
        </section>
      </main>
    </div>
  );
}

export default App;
