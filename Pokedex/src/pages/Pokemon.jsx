
import PokemonGrid from "../components/PokemonGrid";
import pokemon from "../data/pokemon";

function Pokemon() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold">
        Pokémon List
      </h1>

      <PokemonGrid pokemons={pokemon} />
    </div>
  );
}

export default Pokemon;
