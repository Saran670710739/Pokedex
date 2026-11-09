
function PokemonCard({ name, type, image }) {
  return (
    <div className="rounded-xl bg-white p-6 text-center shadow-md transition hover:shadow-xl">
      <img
        src={image}
        alt={name}
        className="mx-auto h-40 w-40 object-contain"
      />

      <h2 className="mt-4 text-xl font-bold">
        {name}
      </h2>

      <p className="mt-2 text-gray-500">
        Type: {type}
      </p>
    </div>
  );
}

export default PokemonCard;
