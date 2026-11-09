import { getPokemonJSON } from "./pokemon";
import { onceADay, forget } from "./cache";

// ใช้ .env ตัวเดิมของ Create React App ไม่ต้องเพิ่มตัวแปรใหม่
const BASE_URL = (
  process.env.REACT_APP_POKEAPI_BASE_URL || "https://pokeapi.co/api/v2"
).replace(/\/+$/, "");

const CACHE_PREFIX = "pokemonhub-rich-detail-v1-";

// ชื่อธาตุมาตรฐานสำหรับคำนวณการโจมตีที่ได้รับ
const ATTACK_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting",
  "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
  "dragon", "dark", "steel", "fairy",
];

const STAT_LABELS = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Attack",
  "special-defense": "Sp. Defense",
  speed: "Speed",
};

const prettify = (value = "") =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

async function getJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("json")) {
    throw new Error(`API ส่งข้อมูลไม่ใช่ JSON กรุณาตรวจ REACT_APP_POKEAPI_BASE_URL`);
  }

  return response.json();
}

function calculateMaxStat(name, base) {
  // เลเวล 100 / IV 31 / EV 252 / Nature เพิ่มค่านั้น 10%
  // ตัวเลขแต่ละสเตตัสคือเพดานรายค่า ไม่สามารถได้ทุกค่าพร้อมกัน
  if (name === "hp") {
    return base === 1 ? 1 : 2 * base + 31 + 63 + 110;
  }
  return Math.floor((2 * base + 31 + 63 + 5) * 1.1);
}

function calculateDefense(typeResources) {
  if (!typeResources.length) return null;

  return ATTACK_TYPES.map((attackType) => {
    const multiplier = typeResources.reduce((value, typeData) => {
      const relations = typeData.damage_relations;
      if (relations.no_damage_from.some((item) => item.name === attackType)) {
        return value * 0;
      }
      if (relations.double_damage_from.some((item) => item.name === attackType)) {
        return value * 2;
      }
      if (relations.half_damage_from.some((item) => item.name === attackType)) {
        return value * 0.5;
      }
      return value;
    }, 1);

    return { name: prettify(attackType), multiplier };
  });
}

function getEvolutionHint(chain, speciesName) {
  if (!chain) return "ไม่มีข้อมูล";

  function findStage(stage) {
    if (stage.species?.name === speciesName) return stage;
    for (const branch of stage.evolves_to || []) {
      const found = findStage(branch);
      if (found) return found;
    }
    return null;
  }

  const current = findStage(chain.chain);
  if (!current) return "ไม่มีข้อมูล";
  const next = current.evolves_to?.[0];
  if (!next) return "ร่างสุดท้าย";

  const level = next.evolution_details?.[0]?.min_level;
  return level
    ? `Lv. ${level} → ${prettify(next.species.name)}`
    : `→ ${prettify(next.species.name)}`;
}

function collectMoves(rawMoves) {
  const levelUp = [];
  const others = [];

  for (const item of rawMoves || []) {
    const details = item.version_group_details || [];
    const levelEntries = details.filter(
      (detail) => detail.move_learn_method?.name === "level-up"
    );

    if (levelEntries.length) {
      levelUp.push({
        name: prettify(item.move.name),
        level: Math.min(...levelEntries.map((entry) => entry.level_learned_at)),
      });
    } else {
      const method = details[0]?.move_learn_method?.name || "other";
      others.push({ name: prettify(item.move.name), method: prettify(method) });
    }
  }

  levelUp.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  others.sort((a, b) => a.name.localeCompare(b.name));
  return { levelUp, others };
}

export function getPokemonRichDetail(id) {
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) {
    return Promise.reject(new Error("หมายเลข Pokémon ไม่ถูกต้อง"));
  }

  return onceADay(`${CACHE_PREFIX}${numericId}`, async () => {
    // ตัวหลักต้องโหลดสำเร็จ ส่วน species/type เป็นข้อมูลเพิ่มเติม
    const raw = await getPokemonJSON(numericId);
    const names = raw.types.map(({ type }) => type.name);

    const [species, typeResults] = await Promise.all([
      getJSON(`${BASE_URL}/pokemon-species/${raw.species?.name || numericId}`)
        .catch(() => null),
      Promise.all(
        names.map((name) => getJSON(`${BASE_URL}/type/${name}`).catch(() => null))
      ),
    ]);

    const chain = species?.evolution_chain?.url
      ? await getJSON(species.evolution_chain.url).catch(() => null)
      : null;

    const englishDescriptions = (species?.flavor_text_entries || []).filter(
      (entry) => entry.language.name === "en"
    );
    const description = englishDescriptions.length
      ? englishDescriptions[englishDescriptions.length - 1].flavor_text
          .replace(/[\f\n\r]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "Explore this Pokémon's information, base stats, and abilities.";

    const moves = collectMoves(raw.moves);

    return {
      id: raw.id,
      name: prettify(raw.name),
      types: names.map(prettify),
      artwork:
        raw.sprites?.other?.["official-artwork"]?.front_default ||
        raw.sprites?.front_default || "",
      shinyArtwork:
        raw.sprites?.other?.["official-artwork"]?.front_shiny ||
        raw.sprites?.front_shiny || "",
      height: (raw.height / 10).toFixed(1),
      weight: (raw.weight / 10).toFixed(1),
      genus: species?.genera?.find((item) => item.language.name === "en")?.genus || "Pokémon",
      description,
      evolution: getEvolutionHint(chain, raw.species?.name),
      stats: raw.stats.map(({ stat, base_stat }) => ({
        key: stat.name,
        name: STAT_LABELS[stat.name] || prettify(stat.name),
        base: base_stat,
        max: calculateMaxStat(stat.name, base_stat),
      })),
      defense: calculateDefense(typeResults.filter(Boolean)),
      abilities: raw.abilities.map(({ ability, is_hidden }) => ({
        name: prettify(ability.name),
        hidden: is_hidden,
      })),
      breeding: {
        eggGroups: (species?.egg_groups || []).map((group) => prettify(group.name)),
        captureRate: species?.capture_rate ?? null,
        hatchCounter: species?.hatch_counter ?? null,
        genderRate: species?.gender_rate ?? null,
      },
      moves,
    };
  });
}

export function clearPokemonRichDetailCache(id) {
  forget(`${CACHE_PREFIX}${Number(id)}`);
}
