
function SearchBox({ query, onQueryChange }) {
  return (
    <div className="mb-6">
      <label
        htmlFor="pokemon-search"
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        ค้นหา Pokémon
      </label>

      <input
        id="pokemon-search"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="เช่น Pikachu, Eevee..."
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400"
      />
    </div>
  );
}

export default SearchBox;
