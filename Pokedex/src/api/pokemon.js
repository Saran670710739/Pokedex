
import { onceADay, forget } from "./cache";

const BASE_URL = "https://pokeapi.co/api/v2";
const LIST_CACHE_KEY = "pokemonhub-api-list-v2";
const DETAIL_CACHE_PREFIX = "pokemonhub-api-detail-v2-";

const FEATURED_IDS = [1, 4, 7, 25, 133, 94];

// ดึง JSON จาก PokéAPI
export async function getPokemonJSON(id) {
  const response = await fetch(`${BASE_URL}/pokemon/${id}`);

  if (!response.ok) {
    throw new Error(`PokéAPI ตอบกลับ HTTP ${response.status}`);
  }

  return response.json();
}

// แปลงข้อมูล API เป็นรูปแบบที่ Component ของเราใช้งาน
export function toPokemon(data) {
  const typeName = data.types?.[0]?.type?.name || "unknown";
  const type = typeName.charAt(0).toUpperCase() + typeName.slice(1);
  const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);

  const height =
    typeof data.height === "number"
      ? `${(data.height / 10).toFixed(1)} เมตร`
      : "ไม่ระบุ";

  const weight =
    typeof data.weight === "number"
      ? `${(data.weight / 10).toFixed(1)} กก.`
      : "ไม่ระบุ";

  return {
    id: data.id,
    name,
    type,
    image:
      data.sprites?.front_default ||
      data.sprites?.other?.["official-artwork"]?.front_default ||
      "",
    detail: `โปเกมอนธาตุ ${type} สูง ${height} น้ำหนัก ${weight}`,
  };
}

// โหลด Pokémon หนึ่งตัวจาก API และเก็บ Cache
export async function getPokemonById(id) {
  const numericId = Number(id);

  if (!Number.isSafeInteger(numericId) || numericId < 1) {
    throw new Error("หมายเลข Pokémon ไม่ถูกต้อง");
  }

  return onceADay(
    `${DETAIL_CACHE_PREFIX}${numericId}`,
    async () => {
      const json = await getPokemonJSON(numericId);
      return toPokemon(json);
    }
  );
}

// โหลดรายการ Pokémon จาก API
export function getPokemonList() {
  return onceADay(LIST_CACHE_KEY, async () => {
    const response = await fetch(
      `${BASE_URL}/pokemon?limit=18&offset=0`
    );

    if (!response.ok) {
      throw new Error(
        `โหลดรายการ Pokémon ไม่สำเร็จ: HTTP ${response.status}`
      );
    }

    const json = await response.json();

    const idsFromAPI = json.results.map((item) =>
      Number(item.url.split("/").filter(Boolean).pop())
    );

    const ids = [
      ...new Set([...FEATURED_IDS, ...idsFromAPI]),
    ].filter(
      (id) => Number.isSafeInteger(id) && id > 0
    );

    return Promise.all(
      ids.map((id) => getPokemonById(id))
    );
  });
}

export function clearPokemonListCache() {
  forget(LIST_CACHE_KEY);
}
