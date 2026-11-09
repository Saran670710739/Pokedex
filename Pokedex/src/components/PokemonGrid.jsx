
import PokemonCard from "./PokemonCard";

function PokemonGrid({
  pokemons,
  wishlistIds = [],
  onToggleWishlist,
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {pokemons.map((pokemon) => (
        <PokemonCard
          key={pokemon.id}
          id={pokemon.id}
          name={pokemon.name}
          type={pokemon.type}
          image={pokemon.image}
          detail={pokemon.detail}
          isWishlisted={wishlistIds.includes(pokemon.id)}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </div>
  );
}

export default PokemonGrid;
