
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PokemonGrid from "../components/PokemonGrid";
import { getPokemonById } from "../api/pokemon";

function Watchlist({
  wishlistIds = [],
  onToggleWishlist,
}) {
  const [savedPokemon, setSavedPokemon] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    if (wishlistIds.length === 0) {
      setSavedPokemon([]);
      setStatus("success");
      setError("");

      return () => {
        ignore = true;
      };
    }

    async function loadWishlist() {
      setStatus("loading");
      setError("");

      try {
        const list = await Promise.all(
          wishlistIds.map((id) => getPokemonById(id))
        );

        if (!ignore) {
          setSavedPokemon(list);
          setStatus("success");
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "โหลด Wishlist ไม่สำเร็จ");
          setStatus("error");
        }
      }
    }

    loadWishlist();

    return () => {
      ignore = true;
    };
  }, [wishlistIds, retryKey]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-3 text-3xl font-extrabold text-slate-900">
        My Pokémon Wishlist
      </h1>

      <p className="mb-8 text-slate-600">
        บันทึกไว้ {wishlistIds.length} ตัว
      </p>

      {status === "loading" && (
        <p className="rounded-xl bg-white p-6 text-slate-600">
          กำลังโหลด Pokémon ใน Wishlist...
        </p>
      )}

      {status === "error" && (
        <div role="alert" className="rounded-xl bg-white p-6">
          <p className="text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-white"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {status === "success" && wishlistIds.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="mb-4 text-slate-500">
            ยังไม่มี Pokémon ใน Wishlist
          </p>

          <Link
            to="/pokemon"
            className="inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            ไปเลือก Pokémon
          </Link>
        </div>
      )}

      {status === "success" && savedPokemon.length > 0 && (
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
