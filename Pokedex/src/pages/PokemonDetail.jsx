
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPokemonById } from "../api/pokemon";
import ReviewForm from "../components/ReviewForm";

function PokemonDetail({
  wishlistIds = [],
  onToggleWishlist,
}) {
  const { id } = useParams();

  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadPokemon() {
      setStatus("loading");
      setError("");
      setSelectedPokemon(null);

      try {
        const result = await getPokemonById(id);

        if (!ignore) {
          setSelectedPokemon(result);
          setStatus("success");
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "ไม่พบ Pokémon ตัวนี้");
          setStatus("error");
        }
      }
    }

    loadPokemon();

    return () => {
      ignore = true;
    };
  }, [id, retryKey]);

  if (status === "loading") {
    return (
      <p className="mx-auto max-w-3xl px-6 py-12 text-slate-600">
        กำลังโหลดรายละเอียด Pokémon...
      </p>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="mx-auto max-w-3xl px-6 py-12 text-center"
      >
        <h1 className="text-2xl font-bold text-slate-900">
          โหลดรายละเอียดไม่สำเร็จ
        </h1>
        <p className="mt-3 text-red-600">{error}</p>

        <button
          type="button"
          onClick={() => setRetryKey((value) => value + 1)}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-white"
        >
          ลองใหม่
        </button>

        <Link
          to="/pokemon"
          className="ml-4 font-semibold text-blue-600 hover:underline"
        >
          กลับไปรายการ
        </Link>
      </div>
    );
  }

  if (!selectedPokemon) return null;

  const isWishlisted = wishlistIds.includes(selectedPokemon.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="rounded-3xl border border-white bg-white/90 p-8 text-center shadow-lg shadow-slate-200/60">
        <img
          src={selectedPokemon.image}
          alt={selectedPokemon.name}
          className="mx-auto h-48 w-48 object-contain"
          style={{ imageRendering: "pixelated" }}
        />

        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
          {selectedPokemon.name}
        </h1>

        <p className="mt-3 text-slate-500">
          Pokédex No. {selectedPokemon.id}
        </p>

        <p className="mt-2 text-slate-500">
          Type: {selectedPokemon.type}
        </p>

        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-slate-600">
          {selectedPokemon.detail}
        </p>

        <button
          type="button"
          aria-pressed={isWishlisted}
          onClick={() => onToggleWishlist(selectedPokemon.id)}
          className="mt-6 rounded-xl bg-pink-100 px-5 py-3 font-semibold text-pink-700 hover:bg-pink-200"
        >
          {isWishlisted
            ? "♥ ลบจาก Wishlist"
            : "♡ เพิ่มลง Wishlist"}
        </button>

        <div>
          <Link
            to="/pokemon"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            กลับไปหน้า Pokémon
          </Link>
        </div>
      </div>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <ReviewForm
          key={selectedPokemon.id}
          pokemonName={selectedPokemon.name}
        />
      </section>
    </div>
  );
}

export default PokemonDetail;
