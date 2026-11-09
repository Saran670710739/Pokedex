import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getPokemonRichDetail,
  clearPokemonRichDetailCache,
} from "../api/pokemonDetail";
import ReviewForm from "../components/ReviewForm";

const THEMES = {
  Grass: { start: "#e5ffd0", end: "#c4dfb8", accent: "#4aab72" },
  Fire: { start: "#fff1d7", end: "#ffd2b3", accent: "#f07843" },
  Water: { start: "#e1f6ff", end: "#bddfee", accent: "#4b9fe4" },
  Electric: { start: "#fffad4", end: "#f8e6a6", accent: "#dcb638" },
  Psychic: { start: "#ffe5f0", end: "#eec5df", accent: "#e568a5" },
  Ghost: { start: "#ece9ff", end: "#cbc5e8", accent: "#8176c7" },
  Poison: { start: "#f3e5ff", end: "#d7c1e9", accent: "#a369b9" },
  Normal: { start: "#f9f5eb", end: "#e7e2d8", accent: "#8e8b82" },
  Ice: { start: "#e2fcfa", end: "#bce6e8", accent: "#57babc" },
  Fighting: { start: "#ffe8e4", end: "#efc6bb", accent: "#d45b53" },
  Ground: { start: "#fff1d6", end: "#e7d1ad", accent: "#bf9554" },
  Flying: { start: "#edf0ff", end: "#cbd5f6", accent: "#8498df" },
  Bug: { start: "#f0f8d7", end: "#d5e2b1", accent: "#8cae45" },
  Rock: { start: "#f0ebe1", end: "#d6caba", accent: "#a39270" },
  Dragon: { start: "#e9e8ff", end: "#c8c5f4", accent: "#7668d4" },
  Dark: { start: "#e6e4e7", end: "#c6c2c8", accent: "#746a7c" },
  Steel: { start: "#eaf2f4", end: "#c9d8dd", accent: "#7f9ba4" },
  Fairy: { start: "#fff0f9", end: "#f2cde5", accent: "#d878b2" },
};

const TYPE_COLORS = {
  Normal: "#9b9b8e", Fire: "#f28543", Water: "#589ce9",
  Electric: "#edc53a", Grass: "#67c94c", Ice: "#78cfd1",
  Fighting: "#c94b44", Poison: "#a84bad", Ground: "#d7aa57",
  Flying: "#997de4", Psychic: "#f26994", Bug: "#96bc41",
  Rock: "#a79965", Ghost: "#7f6cab", Dragon: "#7660d7",
  Dark: "#75666b", Steel: "#7fa2a9", Fairy: "#dc85b5",
};

const TABS = [
  { key: "breeding", label: "Breeding" },
  { key: "defense", label: "Defense" },
  { key: "moves", label: "Moveset" },
  { key: "other", label: "Other Moves" },
];

function TypePill({ name, multiplier }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {multiplier !== undefined && (
        <span className="text-xs font-extrabold text-[#232843]">
          ×{multiplier}
        </span>
      )}
      <span
        className="inline-flex min-w-[85px] items-center justify-center rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm"
        style={{ backgroundColor: TYPE_COLORS[name] || "#858a9e" }}
      >
        {name}
      </span>
    </div>
  );
}

function StatColumn({ title, subtitle, stats, type }) {
  const isMax = type === "max";
  return (
    <section className="min-w-0">
      <h3 className="text-xl font-extrabold text-[#202640] sm:text-2xl">
        {title}
      </h3>
      <p className="mb-5 min-h-[21px] text-xs text-[#596178] sm:text-sm">
        {subtitle}
      </p>
      <div className="space-y-3.5">
        {stats.map((stat) => {
          const value = isMax ? stat.max : stat.base;
          const maximum = isMax ? 714 : 255;
          return (
            <div key={stat.key}>
              <div className="mb-1 flex justify-between gap-2 text-xs font-medium text-[#242a41] sm:text-sm">
                <span>{stat.name}</span>
                <span className="font-extrabold tabular-nums">{value}</span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-[#d8ded9] sm:h-3"
                role="progressbar"
                aria-label={`${title} ${stat.name}`}
                aria-valuemin={0}
                aria-valuemax={maximum}
                aria-valuenow={value}
              >
                <div
                  className="h-full rounded-full bg-[#202640] transition-all duration-700"
                  style={{ width: `${Math.min(100, (value / maximum) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DefensePanel({ defense }) {
  if (!defense) {
    return (
      <p className="text-sm text-[#626b7d]">
        ยังโหลดข้อมูลการแพ้ทางไม่ได้ ลองเปิดหน้านี้ใหม่อีกครั้ง
      </p>
    );
  }

  const resistant = defense
    .filter((item) => item.multiplier < 1)
    .sort((a, b) => a.multiplier - b.multiplier);
  const weak = defense
    .filter((item) => item.multiplier > 1)
    .sort((a, b) => b.multiplier - a.multiplier);

  return (
    <div className="space-y-8">
      <section>
        <h4 className="text-base font-extrabold text-[#202640]">Strong Defense</h4>
        <p className="mt-0.5 text-sm text-[#5f6575]">
          รับความเสียหายจากธาตุเหล่านี้ลดลง
        </p>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-4">
          {resistant.length ? (
            resistant.map((item) => (
              <TypePill key={item.name} {...item} />
            ))
          ) : (
            <p className="text-sm text-[#626b7d]">ไม่มีธาตุที่ต้านทานเป็นพิเศษ</p>
          )}
        </div>
      </section>
      <section>
        <h4 className="text-base font-extrabold text-[#202640]">Weak Defense</h4>
        <p className="mt-0.5 text-sm text-[#5f6575]">
          รับความเสียหายจากธาตุเหล่านี้มากขึ้น
        </p>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-4">
          {weak.length ? (
            weak.map((item) => (
              <TypePill key={item.name} {...item} />
            ))
          ) : (
            <p className="text-sm text-[#626b7d]">ไม่มีธาตุที่เป็นจุดอ่อนพิเศษ</p>
          )}
        </div>
      </section>
    </div>
  );
}

function BreedingPanel({ breeding, abilities }) {
  const gender = breeding.genderRate === -1
    ? "ไม่ระบุเพศ"
    : breeding.genderRate == null
      ? "ไม่มีข้อมูล"
      : `เพศผู้ ${((8 - breeding.genderRate) / 8 * 100).toFixed(1)}% · เพศเมีย ${(breeding.genderRate / 8 * 100).toFixed(1)}%`;

  const items = [
    ["Egg Groups", breeding.eggGroups.join(", ") || "ไม่มีข้อมูล"],
    ["Gender Ratio", gender],
    ["Capture Rate", breeding.captureRate ?? "ไม่มีข้อมูล"],
    ["Hatch Counter", breeding.hatchCounter ?? "ไม่มีข้อมูล"],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white/65 p-4">
            <p className="text-xs text-[#747a89]">{label}</p>
            <p className="mt-1 text-sm font-bold text-[#202640]">{value}</p>
          </div>
        ))}
      </div>
      <div>
        <h4 className="mb-3 text-base font-extrabold text-[#202640]">Abilities</h4>
        <div className="flex flex-wrap gap-2">
          {abilities.map((ability) => (
            <span key={ability.name} className="rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-[#29334a]">
              {ability.name}{ability.hidden ? " · Hidden" : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MovesPanel({ moves, other = false }) {
  const list = other ? moves.others : moves.levelUp;
  return (
    <div>
      <p className="mb-4 text-sm text-[#5e6676]">
        {other
          ? "ท่าอื่น ๆ ที่เรียนได้ (จากข้อมูลเกมหลายภาค)"
          : "ท่าที่เรียนจากการเพิ่มเลเวล (รวมข้อมูลหลายเวอร์ชันเกม)"}
      </p>
      {list.length === 0 ? (
        <p className="text-sm text-[#6b7280]">ไม่มีข้อมูลท่าในหมวดนี้</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {list.slice(0, 16).map((move) => (
            <div key={move.name} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3 text-sm">
              <span className="font-semibold text-[#202640]">{move.name}</span>
              <span className="shrink-0 text-xs text-[#727c8b]">
                {other ? move.method : `Lv. ${move.level}`}
              </span>
            </div>
          ))}
        </div>
      )}
      {list.length > 16 && (
        <p className="mt-3 text-xs text-[#697386]">
          แสดง 16 จากทั้งหมด {list.length} ท่า
        </p>
      )}
    </div>
  );
}

function PokemonDetail({ wishlistIds = [], onToggleWishlist }) {
  const { id } = useParams();
  const [pokemon, setPokemon] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [tab, setTab] = useState("defense");
  const [shiny, setShiny] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPokemon(null);
    setStatus("loading");
    setError("");
    setTab("defense");
    setShiny(false);

    async function load() {
      try {
        const result = await getPokemonRichDetail(id);
        if (!cancelled) {
          setPokemon(result);
          setStatus("success");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
          setStatus("error");
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, retryKey]);

  function retry() {
    clearPokemonRichDetailCache(id);
    setRetryKey((value) => value + 1);
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-[#edf6e7] px-6">
        <div className="w-full max-w-5xl animate-pulse space-y-5">
          <div className="h-8 w-52 rounded-2xl bg-white/70" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-96 rounded-[36px] bg-white/45" />
            <div className="h-96 rounded-[36px] bg-white/70" />
          </div>
          <p className="text-center text-sm text-[#687485]">กำลังโหลดข้อมูลจาก PokéAPI...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-extrabold text-[#202640]">โหลดรายละเอียดไม่สำเร็จ</h1>
        <p className="mt-3 max-w-md text-sm text-red-600">{error}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={retry} className="rounded-xl bg-[#202640] px-5 py-3 font-bold text-white">
            ลองใหม่
          </button>
          <Link to="/pokemon" className="rounded-xl bg-white px-5 py-3 font-bold text-[#202640]">
            กลับไปรายการ
          </Link>
        </div>
      </div>
    );
  }

  if (!pokemon) return null;

  const theme = THEMES[pokemon.types[0]] || THEMES.Normal;
  const isWishlisted = wishlistIds.includes(pokemon.id);
  const inKanto = pokemon.id <= 151;
  const previousId = pokemon.id === 1 ? 151 : pokemon.id - 1;
  const nextId = inKanto && pokemon.id === 151 ? 1 : pokemon.id + 1;
  const number = String(pokemon.id).padStart(3, "0");
  const total = pokemon.stats.reduce((sum, stat) => sum + stat.base, 0);

  return (
    <div
      className="min-h-screen text-[#202640] transition-colors duration-500"
      style={{ background: `linear-gradient(140deg, ${theme.start} 0%, ${theme.end} 100%)` }}
    >
      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-7 sm:px-7 lg:px-10">
        <nav className="mb-8 flex items-center justify-between gap-2 sm:mb-9" aria-label="Pokédex navigation">
          <Link to={`/pokemon/${previousId}`} className="group inline-flex items-center gap-2 rounded-full px-2 py-2 text-xs font-semibold transition hover:bg-white/40 sm:text-base">
            <span className="text-lg transition-transform group-hover:-translate-x-1">◀</span>
            <span>#{String(previousId).padStart(3, "0")}</span>
          </Link>
          <h1 className="text-center text-lg font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
            {inKanto ? "Kanto Pokédex" : "National Pokédex"}
          </h1>
          <Link to={`/pokemon/${nextId}`} className="group inline-flex items-center gap-2 rounded-full px-2 py-2 text-xs font-semibold transition hover:bg-white/40 sm:text-base">
            <span>#{String(nextId).padStart(3, "0")}</span>
            <span className="text-lg transition-transform group-hover:translate-x-1">▶</span>
          </Link>
        </nav>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.55fr)] lg:gap-10">
          <section className="min-w-0 lg:sticky lg:top-5">
            <div className="relative flex h-[290px] items-center justify-center sm:h-[385px] lg:h-[440px]">
              <div
                className="absolute inset-x-12 bottom-4 h-10 rounded-[50%] bg-[#364e32]/10 blur-xl"
                aria-hidden="true"
              />
              <img
                src={shiny && pokemon.shinyArtwork ? pokemon.shinyArtwork : pokemon.artwork}
                alt={`${pokemon.name}${shiny ? " shiny" : ""}`}
                className="relative z-10 h-full w-full object-contain drop-shadow-[0_18px_18px_rgba(32,38,64,0.13)] transition-transform duration-500 hover:scale-105"
              />
            </div>

            <div className="mx-auto max-w-[480px] px-2 pb-5 sm:px-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  <span className="mr-2 text-xl font-medium sm:text-2xl">{number}</span>
                  {pokemon.name}
                </h2>
                {pokemon.shinyArtwork && (
                  <button
                    type="button"
                    aria-pressed={shiny}
                    onClick={() => setShiny((value) => !value)}
                    className="rounded-full border border-[#202640]/15 bg-white/60 px-4 py-2 text-xs font-extrabold transition hover:bg-white"
                  >
                    ✨ {shiny ? "Normal" : "Shiny"}
                  </button>
                )}
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm font-extrabold">Type:</span>
                {pokemon.types.map((type) => <TypePill key={type} name={type} />)}
              </div>

              <div className="space-y-2 text-sm leading-6 sm:text-base">
                <p><span className="font-extrabold">Species:</span> {pokemon.genus}</p>
                <p><span className="font-extrabold">Height:</span> {pokemon.height} m</p>
                <p><span className="font-extrabold">Weight:</span> {pokemon.weight} kg</p>
                <p><span className="font-extrabold">Evolve:</span> {pokemon.evolution}</p>
                <p className="pt-2 leading-7">
                  <span className="font-extrabold">Summary:</span> {pokemon.description}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onToggleWishlist?.(pokemon.id)}
                  aria-pressed={isWishlisted}
                  className="rounded-xl bg-[#202640] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#343b60]"
                >
                  {isWishlisted ? "♥ Remove Wishlist" : "♡ Add to Wishlist"}
                </button>
                <Link
                  to="/pokemon"
                  className="rounded-xl border border-[#202640]/15 bg-white/65 px-5 py-3 text-sm font-bold transition hover:bg-white"
                >
                  ← All Pokémon
                </Link>
              </div>
            </div>
          </section>

          <section className="min-w-0 rounded-[34px] border border-white/70 bg-white/75 p-5 shadow-[0_18px_55px_rgba(28,49,37,0.08)] backdrop-blur-sm sm:p-8 lg:p-9">
            <div className="grid gap-8 sm:grid-cols-2 sm:gap-9">
              <StatColumn
                title="Base Stats"
                subtitle={`Total (${total})`}
                stats={pokemon.stats}
                type="base"
              />
              <StatColumn
                title="Max Stats"
                subtitle="Beneficial Nature · Lv. 100"
                stats={pokemon.stats}
                type="max"
              />
            </div>
            <p className="mt-4 text-[11px] leading-4 text-[#7c8490]">
              Max Stats คำนวณรายค่าสมมติ IV 31 / EV 252 / Nature +10% (HP ไม่มีโบนัส Nature) ไม่ใช่ค่าที่ทุกสเตตัสทำได้พร้อมกัน
            </p>

            <div className="mt-9 border-b border-[#cbd1cd]">
              <div className="flex gap-6 overflow-x-auto sm:gap-9" role="tablist" aria-label="Pokémon details">
                {TABS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    id={`tab-${item.key}`}
                    aria-controls="pokemon-tab-panel"
                    aria-selected={tab === item.key}
                    onClick={() => setTab(item.key)}
                    className={`relative shrink-0 pb-3 text-sm font-semibold transition sm:text-lg ${
                      tab === item.key
                        ? "text-[#202640]"
                        : "text-[#868d96] hover:text-[#202640]"
                    }`}
                  >
                    {item.label}
                    {tab === item.key && (
                      <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#202640]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div
              role="tabpanel"
              id="pokemon-tab-panel"
              aria-labelledby={`tab-${tab}`}
              className="min-h-[250px] pb-2 pt-7 sm:pt-9"
            >
              {tab === "defense" && <DefensePanel defense={pokemon.defense} />}
              {tab === "breeding" && (
                <BreedingPanel breeding={pokemon.breeding} abilities={pokemon.abilities} />
              )}
              {tab === "moves" && <MovesPanel moves={pokemon.moves} />}
              {tab === "other" && <MovesPanel moves={pokemon.moves} other />}
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-[30px] border border-white/75 bg-white/75 p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-xl font-extrabold sm:text-2xl">Community Reviews</h2>
          <ReviewForm key={pokemon.id} pokemonName={pokemon.name} />
        </section>
      </div>
    </div>
  );
}

export default PokemonDetail;
