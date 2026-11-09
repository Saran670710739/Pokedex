
import PokemonGrid from "../components/PokemonGrid";
import pokemon from "../data/pokemon";

function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-3 text-4xl font-bold">
        Welcome to PokémonHub
      </h1>
      <p className="mb-10 text-gray-600">
        Explore your favorite Pokémon!
      </p>

      <h2 className="mb-6 text-2xl font-bold">
        Featured Pokémon
      </h2>

      <PokemonGrid pokemons={pokemon.slice(0, 3)} />
    </div>
  );
}

export default Home;
