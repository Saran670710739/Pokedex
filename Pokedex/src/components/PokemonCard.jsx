
import { Link } from "react-router-dom";

function PokemonCard({
  id,
  name,
  type,
  image,
  isWishlisted,
  onToggleWishlist,
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link to={`/pokemon/${id}`} className="block">
        <img
          src={image}
          alt={name}
          className="mx-auto h-36 w-36 object-contain"
        />

        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          {name}
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Type: {type}
        </p>
      </Link>

      <button
        type="button"
        onClick={() => onToggleWishlist(id)}
        aria-pressed={isWishlisted}
        className={
          isWishlisted
            ? "mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            : "mt-5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:border-red-200 hover:text-red-600"
        }
      >
        {isWishlisted
          ? "❤️ ลบจาก Wishlist"
          : "🤍 เพิ่มลง Wishlist"}
      </button>
    </article>
  );
}

export default PokemonCard;
