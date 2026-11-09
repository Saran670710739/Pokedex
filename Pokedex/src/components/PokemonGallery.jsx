
import { useState } from "react";
import pokemon from "../data/pokemon";

function PokemonGallery() {
  const [index, setIndex] = useState(0);
  const [showMore, setShowMore] = useState(false);

  const currentPokemon = pokemon[index];

  function handleNextClick() {
    if (index < pokemon.length - 1) {
      setIndex(index + 1);
    } else {
      setIndex(0);
    }

    setShowMore(false);
  }

  function handleMoreClick() {
    setShowMore(!showMore);
  }

  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-md">
      <button
        type="button"
        onClick={handleNextClick}
        className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Pokémon ตัวถัดไป
      </button>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
        <img
          src={currentPokemon.image}
          alt={currentPokemon.name}
          className="h-40 w-40 object-contain"
        />

        <div>
          <h2 className="text-2xl font-bold">
            {currentPokemon.name}
          </h2>

          <p className="mt-2 text-gray-500">
            ตัวที่ {index + 1} จาก {pokemon.length}
          </p>

          <p className="text-gray-500">
            Type: {currentPokemon.type}
          </p>

          <button
            type="button"
            onClick={handleMoreClick}
            className="mt-4 text-blue-600 hover:underline"
          >
            {showMore ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
          </button>

          {showMore && (
            <p className="mt-3 text-gray-700">
              {currentPokemon.detail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PokemonGallery;
