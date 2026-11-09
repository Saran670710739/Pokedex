
import { useEffect, useState } from "react";
import PokemonGrid from "../components/PokemonGrid";
import SearchBox from "../components/SearchBox";
import {
  getPokemonList,
  clearPokemonListCache,
} from "../api/pokemon";

function Pokemon({ wishlistIds = [], onToggleWishlist }) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
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
          setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
          setStatus("error");
        }
      }
    }

    loadPokemon();

    return () => {
      ignore = true;
    };
  }, [retryKey]);

  // สร้างรายการธาตุที่ไม่ซ้ำจากข้อมูล API
  const types = [
    ...new Set(pokemonList.map((item) => item.type)),
  ].sort();

  // กรองชื่อและธาตุจากข้อมูลใน React State
  const filteredPokemon = pokemonList.filter((item) => {
    const matchesName = item.name
      .toLowerCase()
      .includes(query.trim().toLowerCase());

    const matchesType =
      selectedType === "all" ||
      item.type === selectedType;

    return matchesName && matchesType;
  });

  function handleRetry() {
    clearPokemonListCache();
    setRetryKey((current) => current + 1);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-extrabold text-slate-900">
        Pokémon List
      </h1>

      <p className="mb-6 text-sm text-slate-500">
        ค้นหาและเลือกธาตุของ Pokémon ได้
      </p>

      <SearchBox
        query={query}
        onQueryChange={setQuery}
      />

      {status === "loading" && (
        <p className="mt-6 rounded-2xl bg-white/80 p-6 text-slate-600">
          กำลังโหลด Pokémon จาก PokéAPI...
        </p>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="mt-6 rounded-2xl bg-white p-6"
        >
          <p className="mb-4 text-red-600">{error}</p>

          <button
            type="button"
            onClick={handleRetry}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {status === "success" && (
        <>
          <div
            className="my-6 flex flex-wrap gap-2"
            aria-label="กรองตามธาตุ"
          >
            <button
              type="button"
              onClick={() => setSelectedType("all")}
              aria-pressed={selectedType === "all"}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selectedType === "all"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
              }`}
            >
              ทุกธาตุ
            </button>

            {types.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                aria-pressed={selectedType === type}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selectedType === type
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <p className="mb-5 text-sm text-slate-500">
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
            <p className="rounded-2xl bg-white p-8 text-center text-slate-500">
              ไม่พบ Pokémon ที่ตรงกับชื่อหรือธาตุที่เลือก 🔎
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default Pokemon;
