
import { getPokemonJSON } from "./pokemon";
import { onceADay, forget } from "./cache";

const CACHE_PREFIX = "pokemonhub-rich-detail-v3-";

const STAT_LABELS = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

function prettify(value = "") {
  return String(value)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// คำนวณ Max Stats ที่ Level 100 (IV 31 / EV 252 / Nature +10%)
function calculateMaxStat(name, base) {
  if (name === "hp") {
    return Math.floor(2 * base + 31 + 63 + 100 + 10);
  }

  return Math.floor((2 * base + 31 + 63 + 5) * 1.1);
}

// แปลงข้อมูลแพ้ทางและต้านทาน
function calculateDefense(data) {
  const weaknesses = data.weaknesses || [];
  const resistances = data.resistances || [];

  return [
    ...weaknesses.map((item) => ({
      name: prettify(item.type),
      multiplier: item.multiplier,
    })),
    ...resistances.map((item) => ({
      name: prettify(item.type),
      multiplier: item.multiplier,
    })),
  ];
}

// แปลงข้อมูล Moves
function collectMoves(rawMoves = []) {
  const levelUp = [];
  const others = [];

  for (const move of rawMoves) {
    const name = prettify(move.name);

    if (move.learn_method === "level-up") {
      levelUp.push({
        name,
        level: move.level_learned_at ?? 0,
      });
    } else {
      others.push({
        name,
        method: prettify(move.learn_method || "other"),
      });
    }
  }

  return { levelUp, others };
}

// แปลงข้อความ Evolution
function getEvolutionHint(evolutions = []) {
  if (!evolutions.length) {
    return "ไม่มีวิวัฒนาการเพิ่มเติม";
  }

  return evolutions.map((item) => {
    const name = prettify(item.name);

    if (item.trigger === "use-item") {
      return `${name} (ใช้ ${prettify(item.item_name || "Item")})`;
    }

    if (item.min_level) {
      return `${name} (Level ${item.min_level})`;
    }

    return name;
  }).join(", ");
}

// โหลดรายละเอียดจาก Go Backend + Supabase
export async function getPokemonRichDetail(id) {
  const numericId = Number(id);

  if (!Number.isSafeInteger(numericId) || numericId < 1) {
    throw new Error("หมายเลข Pokémon ไม่ถูกต้อง");
  }

  return onceADay(
    `${CACHE_PREFIX}${numericId}`,
    async () => {
      const raw = await getPokemonJSON(numericId);

      const stats = (raw.stats || []).map((item) => ({
        key: item.name,
        name: STAT_LABELS[item.name] || prettify(item.name),
        base: item.value,
        max: calculateMaxStat(item.name, item.value),
      }));

      const abilities = (raw.abilities || []).map((item) => ({
        name: prettify(item.name),
        hidden: item.is_hidden,
        description: item.description || "",
      }));

      const moves = collectMoves(raw.moves || []);

      return {
        id: raw.id,
        name: prettify(raw.name),
        types: (raw.types || []).map(prettify),

        artwork: raw.artwork_url || "",
        shinyArtwork: raw.shiny_artwork_url || "",

        height: raw.height ?? 0,
        weight: raw.weight ?? 0,

        genus: raw.genus || "Pokémon",
        description: raw.description || "ไม่มีคำอธิบาย",

        evolution: getEvolutionHint(raw.evolutions),

        stats,
        defense: calculateDefense(raw),
        abilities,

        breeding: {
          eggGroups: (raw.egg_groups || []).map(prettify),
          captureRate: raw.capture_rate ?? null,
          hatchCounter: raw.hatch_counter ?? null,
          genderRate: raw.gender_rate ?? null,
        },

        moves,
      };
    }
  );
}

// ล้าง Cache
export function clearPokemonRichDetailCache(id) {
  forget(`${CACHE_PREFIX}${Number(id)}`);
}
