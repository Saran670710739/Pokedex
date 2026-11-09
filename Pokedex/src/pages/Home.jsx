import { Link } from "react-router-dom";
import PokemonGrid from "../components/PokemonGrid";
import PokemonGallery from "../components/PokemonGallery";
import PokemonAccordion from "../components/PokemonAccordion";
import pokemon from "../data/pokemon";

function Home({ wishlistIds = [], onToggleWishlist }) {
  return (
    <div
  className="relative isolate min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage: "url('/images/pokemon-background.png')",
  }}
>
      {/* วงแสงพื้นหลังแบบพาสเทล: เป็นเพียงการตกแต่ง ไม่ทับปุ่ม */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-44 h-[420px] w-[420px] rounded-full bg-rose-200/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-28 h-[500px] w-[500px] rounded-full bg-violet-100/70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-44 left-1/4 h-[430px] w-[430px] rounded-full bg-pink-100/70 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-12 sm:pt-16">
        {/* HERO: ข้อความทางซ้าย + Gallery ทางขวา */}
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
              Explore your favorite Pokémon, discover their types, and build your wishlist.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/pokemon"
                className="inline-flex items-center gap-3 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-700"
              >
                <span aria-hidden="true">◉</span>
                Explore Pokémon
              </Link>
              <Link
                to="/watchlist"
                className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-6 py-3 font-semibold text-slate-800 shadow-sm transition hover:border-rose-200 hover:text-red-500"
              >
                <span aria-hidden="true" className="text-xl leading-none text-red-500">♡</span>
                View Wishlist
              </Link>
            </div>
          </div>

          <PokemonGallery />
        </section>

        {/* FEATURED: การ์ด 3 ตัวและปุ่ม Wishlist เดิม */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              <span aria-hidden="true" className="text-red-500">◎</span>
              Featured Pokémon
            </h2>
            <Link to="/pokemon" className="text-sm font-semibold text-blue-600 hover:underline">
              View all →
            </Link>
          </div>

          <PokemonGrid
            pokemons={pokemon.slice(0, 3)}
            wishlistIds={wishlistIds}
            onToggleWishlist={onToggleWishlist}
          />
        </section>

        {/* Accordion ของ Week 7 ไม่ถูกลบ */}
        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-slate-900">
            Explore Pokémon Details
          </h2>
          <PokemonAccordion />
        </section>
      </div>
    </div>
  );
}

export default Home;
