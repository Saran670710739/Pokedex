
import { Link } from "react-router-dom";
import PokemonCard from "./PokemonCard";

function PokemonGrid({ pokemons }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {pokemons.map((pokemon) => (
        <Link
          key={pokemon.id}
          to={`/pokemon/${pokemon.id}`}
          className="block rounded-xl transition hover:-translate-y-1"
        >
          <PokemonCard
            name={pokemon.name}
            type={pokemon.type}
            image={pokemon.image}
          />
        </Link>
      ))}
    </div>
  );
}

export default PokemonGrid;
