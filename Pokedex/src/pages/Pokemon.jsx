
import { useState } from "react";
import PokemonGrid from "../components/PokemonGrid";
import SearchBox from "../components/SearchBox";
import pokemon from "../data/pokemon";

function Pokemon({ wishlistIds, onToggleWishlist }) {
  const [query, setQuery] = useState("");

  const filteredPokemon = pokemon.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold">
        Pokémon List
      </h1>

      <SearchBox
        query={query}
        onQueryChange={setQuery}
      />

      <p className="mb-4 text-sm text-gray-500">
        พบ {filteredPokemon.length} จาก {pokemon.length} ตัว
      </p>

      {filteredPokemon.length > 0 ? (
        <PokemonGrid
          pokemons={filteredPokemon}
          wishlistIds={wishlistIds}
          onToggleWishlist={onToggleWishlist}
        />
      ) : (
        <p className="rounded-lg bg-white p-6 text-center text-gray-500">
          ไม่พบ Pokémon ที่ค้นหา 🔎
        </p>
      )}
    </div>
  );
}

export default Pokemon;
