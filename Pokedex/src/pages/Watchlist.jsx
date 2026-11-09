
import { Link } from "react-router-dom";
import PokemonGrid from "../components/PokemonGrid";
import pokemon from "../data/pokemon";

function Watchlist({ wishlistIds, onToggleWishlist }) {
  const savedPokemon = pokemon.filter((item) =>
    wishlistIds.includes(item.id)
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-3 text-3xl font-bold">
        My Pokémon Wishlist
      </h1>

      <p className="mb-8 text-gray-600">
        บันทึกไว้ {savedPokemon.length} ตัว
      </p>

      {savedPokemon.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-md">
          <p className="mb-4 text-gray-500">
            ยังไม่มี Pokémon ใน Wishlist
          </p>

          <Link
            to="/pokemon"
            className="inline-block rounded-lg bg-red-500 px-5 py-3 text-white hover:bg-red-600"
          >
            ไปเลือก Pokémon
          </Link>
        </div>
      ) : (
        <PokemonGrid
          pokemons={savedPokemon}
          wishlistIds={wishlistIds}
          onToggleWishlist={onToggleWishlist}
        />
      )}
    </div>
  );
}

export default Watchlist;
