
import { useEffect, useState } from "react";
import PokemonGrid from "../components/PokemonGrid";
import SearchBox from "../components/SearchBox";
import {
  getPokemonList,
  clearPokemonListCache,
} from "../api/pokemon";

function Pokemon({ wishlistIds = [], onToggleWishlist }) {
  const [query, setQuery] = useState("");
  const [pokemonList, setPokemonList] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadPokemon() {
      setStatus("loading");
      setError("");

      try {
        const list = await getPokemonList();

        if (!ignore) {
          setPokemonList(list);
          setStatus("success");
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.message || "โหลดข้อมูลไม่สำเร็จ"
          );
          setStatus("error");
        }
      }
    }

    loadPokemon();

    return () => {
      ignore = true;
    };
  }, [retryKey]);

  const filteredPokemon = pokemonList.filter((item) =>
    item.name
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  function handleRetry() {
    clearPokemonListCache();
    setRetryKey((current) => current + 1);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">
        Pokémon List
      </h1>

      <SearchBox
        query={query}
        onQueryChange={setQuery}
      />

      {status === "loading" && (
        <p className="rounded-xl bg-white p-6 text-slate-600">
          กำลังโหลด Pokémon จาก PokéAPI...
        </p>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="rounded-xl bg-white p-6"
        >
          <p className="mb-4 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {status === "success" && (
        <>
          <p className="mb-4 text-sm text-slate-500">
            พบ {filteredPokemon.length} จาก{" "}
            {pokemonList.length} ตัว
          </p>

          {filteredPokemon.length > 0 ? (
            <PokemonGrid
              pokemons={filteredPokemon}
              wishlistIds={wishlistIds}
              onToggleWishlist={onToggleWishlist}
            />
          ) : (
            <p className="rounded-xl bg-white p-6 text-center text-slate-500">
              ไม่พบ Pokémon ที่ค้นหา 🔎
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default Pokemon;
