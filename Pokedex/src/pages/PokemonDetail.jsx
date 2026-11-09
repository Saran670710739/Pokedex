
import { Link, useParams } from "react-router-dom";
import pokemon from "../data/pokemon";
import ReviewForm from "../components/ReviewForm";

function PokemonDetail() {
  const { id } = useParams();

  const selectedPokemon = pokemon.find(
    (p) => p.id === Number(id)
  );

  if (!selectedPokemon) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold">
          ไม่พบ Pokémon ตัวนี้
        </h1>

        <Link
          to="/pokemon"
          className="mt-6 inline-block text-red-500 hover:underline"
        >
          กลับไปหน้า Pokémon
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="rounded-xl bg-white p-8 text-center shadow-md">
        <img
          src={selectedPokemon.image}
          alt={selectedPokemon.name}
          className="mx-auto h-48 w-48 object-contain"
        />

        <h1 className="mt-4 text-3xl font-bold">
          {selectedPokemon.name}
        </h1>

        <p className="mt-3 text-gray-500">
          Pokédex No. {selectedPokemon.id}
        </p>

        <p className="mt-2 text-gray-500">
          Type: {selectedPokemon.type}
        </p>

        <Link
          to="/pokemon"
          className="mt-8 inline-block rounded-lg bg-red-500 px-5 py-3 text-white hover:bg-red-600"
        >
          กลับไปหน้า Pokémon
        </Link>
      </div>

      <section className="mt-8 rounded-xl bg-white p-6 shadow-md">
        <ReviewForm pokemonName={selectedPokemon.name} />
      </section>
    </div>
  );
}

export default PokemonDetail;
