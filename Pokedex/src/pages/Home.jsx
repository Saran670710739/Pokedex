
import PokemonGrid from "../components/PokemonGrid";
import PokemonGallery from "../components/PokemonGallery";
import PokemonAccordion from "../components/PokemonAccordion";
import pokemon from "../data/pokemon";

function Home({ wishlistIds, onToggleWishlist }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-red-500">
            Explore the Pokédex
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Welcome to PokémonHub
          </h1>

          <p className="mt-5 max-w-md leading-7 text-gray-500">
            Explore your favorite Pokémon, discover their types,
            and build your wishlist.
          </p>
        </div>

        <PokemonGallery />
      </section>

      <section className="mt-14 sm:mt-20">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
            Explore
          </p>

          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            Featured Pokémon
          </h2>
        </div>

        <PokemonGrid
          pokemons={pokemon.slice(0, 3)}
          wishlistIds={wishlistIds}
          onToggleWishlist={onToggleWishlist}
        />
      </section>

      <section className="mt-14 sm:mt-20">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Pokémon Accordion
        </h2>

        <PokemonAccordion />
      </section>
    </div>
  );
}

export default Home;
