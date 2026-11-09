
import { Link } from "react-router-dom";
import PokemonGrid from "../components/PokemonGrid";
import PokemonGallery from "../components/PokemonGallery";
import pokemon from "../data/pokemon";

function Home({ wishlistIds = [], onToggleWishlist }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#fff9fc]">

      {/* พื้นหลัง Pastel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-44 h-[420px] w-[420px] rounded-full bg-rose-200/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-28 h-[500px] w-[500px] rounded-full bg-violet-100/70 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-12 sm:pt-16">

        {/* HERO */}
        <section className="grid items-center gap-10 lg:min-h-[350px] lg:grid-cols-2 lg:gap-14">

          <div>
            <div className="mb-5 flex items-center gap-4">
              <span className="text-xs font-extrabold uppercase tracking-[0.17em] text-red-500">
                Explore the Pokédex
              </span>
              <span className="h-[2px] w-11 bg-red-400" />
            </div>

            <h1 className="max-w-lg text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Welcome to
              <br />
              PokémonHub
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-600">
              Explore your favorite Pokémon, discover their types,
              and build your wishlist.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/pokemon"
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700"
              >
                Explore Pokémon
              </Link>

              <Link
                to="/watchlist"
                className="rounded-xl border border-slate-200 bg-white/80 px-6 py-3 font-semibold text-slate-800 shadow-sm transition hover:text-red-500"
              >
                ♡ View Wishlist
              </Link>
            </div>
          </div>

          <PokemonGallery />
        </section>

        {/* FEATURED POKEMON */}
        <section className="mt-16 sm:mt-20">

          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              <span className="text-red-500">◎</span>
              Featured Pokémon
            </h2>

            <Link
              to="/pokemon"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              View all →
            </Link>
          </div>

          <PokemonGrid
            pokemons={pokemon.slice(0, 3)}
            wishlistIds={wishlistIds}
            onToggleWishlist={onToggleWishlist}
          />
        </section>
      </div>
    </div>
  );
}

export default Home;
