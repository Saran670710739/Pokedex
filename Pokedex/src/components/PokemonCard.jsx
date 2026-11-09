
import { Link } from "react-router-dom";

const typeStyles = {
  Grass: "bg-green-100 text-green-700",
  Fire: "bg-orange-100 text-red-600",
  Water: "bg-blue-100 text-blue-700",
  Electric: "bg-yellow-100 text-amber-700",
  Normal: "bg-slate-100 text-slate-600",
  Ghost: "bg-violet-100 text-violet-700",
};

const imageStyles = {
  Grass: "from-emerald-50 to-green-100/60",
  Fire: "from-orange-50 to-rose-100/60",
  Water: "from-sky-50 to-blue-100/60",
  Electric: "from-yellow-50 to-amber-100/60",
  Normal: "from-slate-50 to-slate-100",
  Ghost: "from-violet-50 to-purple-100/70",
};

function PokemonCard({
  id,
  name,
  type,
  image,
  detail,
  isWishlisted = false,
  onToggleWishlist,
}) {
  return (
    <article className="relative flex min-h-[310px] flex-col items-center overflow-hidden rounded-[24px] border border-white/90 bg-white/80 p-6 text-center shadow-xl shadow-slate-200/60 transition duration-200 hover:-translate-y-1 hover:shadow-2xl">
      
      {/* รูป Pokémon จางๆ ด้านหลังการ์ด */}
      <img
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute -right-8 top-8 h-48 w-48 object-contain opacity-[0.08]"
      />

      <Link
        to={`/pokemon/${id}`}
        className="relative z-10 flex flex-1 flex-col items-center"
      >
        {/* รูป Pokémon */}
        <div
          className={`flex h-32 w-36 items-center justify-center rounded-2xl bg-gradient-to-br ${
            imageStyles[type] || "from-slate-50 to-pink-50"
          }`}
        >
          <img
            src={image}
            alt={name}
            className="h-28 w-28 object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* ชื่อ Pokémon */}
        <h3 className="mt-4 text-xl font-extrabold text-slate-900">
          {name}
        </h3>

        {/* ธาตุ Pokémon */}
        <div className="mt-2 text-sm text-slate-500">
          Type:
          <span
            className={`ml-2 rounded-full px-3 py-1 text-xs font-bold ${
              typeStyles[type] || "bg-slate-100 text-slate-600"
            }`}
          >
            {type}
          </span>
        </div>

        {/* คำอธิบาย Pokémon */}
        {detail && (
          <p className="mt-5 max-w-[290px] text-sm leading-6 text-slate-600">
            {detail}
          </p>
        )}
      </Link>

      {/* ปุ่ม Wishlist */}
      <button
        type="button"
        onClick={() => onToggleWishlist(id)}
        aria-pressed={isWishlisted}
        className={
          "relative z-10 mt-6 inline-flex min-w-[170px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition " +
          (isWishlisted
            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            : "border-slate-200 bg-white/85 text-slate-900 hover:border-red-200 hover:text-red-500")
        }
      >
        <span className="text-xl text-red-500">
          {isWishlisted ? "♥" : "♡"}
        </span>

        {isWishlisted
          ? "ลบจาก Wishlist"
          : "เพิ่มลง Wishlist"}
      </button>
    </article>
  );
}

export default PokemonCard;
