
import { useState } from "react";
import { Link } from "react-router-dom";

function PokemonGallery({ pokemons = [] }) {
  const [index, setIndex] = useState(5);
  const [showMore, setShowMore] = useState(false);

  if (pokemons.length === 0) return null;

  const currentPokemon = pokemons[index % pokemons.length];
  const displayNumber = (index % pokemons.length) + 1;

  function handleNextClick() {
    setIndex((current) => (current + 1) % pokemons.length);
    setShowMore(false);
  }

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/90 bg-white/75 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-sm sm:p-7">
      <img
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentPokemon.id}.png`}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-10 h-56 w-56 object-contain opacity-[0.08]"
      />

      <div className="relative z-10">
        <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600">
          ✦ Pokémon Recommendation
        </span>

        <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
          <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-50 to-pink-100/90">
            <img
              src={currentPokemon.image}
              alt={currentPokemon.name}
              className="h-36 w-36 object-contain"
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          <div className="min-w-0 text-center sm:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {currentPokemon.name}
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              ตัวที่ {displayNumber} จาก {pokemons.length}
            </p>

            <p className="mt-4 text-sm text-slate-500">
              Type:{" "}
              <span className="rounded-full bg-violet-100 px-3 py-1 font-bold text-violet-700">
                {currentPokemon.type}
              </span>
            </p>

            <Link
              to={`/pokemon/${currentPokemon.id}`}
              className="mt-5 inline-flex items-center gap-2 font-bold text-blue-600 hover:underline"
            >
              ดูรายละเอียด →
            </Link>
          </div>
        </div>

        {showMore && (
          <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
            {currentPokemon.detail}
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowMore((current) => !current)}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            {showMore ? "ซ่อนคำอธิบาย" : "อ่านคำอธิบาย"}
          </button>

          <button
            type="button"
            onClick={handleNextClick}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            ตัวถัดไป →
          </button>
        </div>
      </div>
    </div>
  );
}

export default PokemonGallery;
