import { onceADay, forget } from "./cache";

// CRA embeds REACT_APP_ variables at build time. Provide a safe public fallback.
const BASE_URL = (
  process.env.REACT_APP_POKEAPI_BASE_URL || "https://pokeapi.co/api/v2"
).replace(/\/+$/, "");
const LIST_CACHE_KEY = "pokemonhub-api-list-v2";
const DETAIL_CACHE_PREFIX = "pokemonhub-api-detail-v2-";
const FEATURED_IDS = [1, 4, 7, 25, 133, 94];

// ใช้ข้อมูลจาก PokéAPI โดยตรง ไม่ต้อง import ข้อมูลจำลอง
export async function getPokemonJSON(id) {
  const url = `${BASE_URL}/pokemon/${id}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`PokéAPI ตอบกลับ HTTP ${response.status} (${url})`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `API ไม่ได้ส่ง JSON กลับมา: ${url} (ได้ ${contentType || "unknown"})`
    );
  }

  return response.json();
}

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
    // สรุปข้อเท็จจริงเป็นภาษาไทยจาก height/weight/type ของ API
    // ไม่ใช่ข้อความเรื่องราวอย่างเป็นทางการจาก Pokédex
    detail: `โปเกมอนธาตุ ${type} สูง ${height} น้ำหนัก ${weight}`,
  };
}

export async function getPokemonById(id) {
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) {
    throw new Error("หมายเลข Pokémon ไม่ถูกต้อง");
  }

  return onceADay(`${DETAIL_CACHE_PREFIX}${numericId}`, async () => {
    const json = await getPokemonJSON(numericId);
    return toPokemon(json);
  });
}

export function getPokemonList() {
  return onceADay(LIST_CACHE_KEY, async () => {
    // ขอรายชื่อ 18 ตัวจาก API แล้วดึงรายละเอียดจริงของแต่ละตัว
    const url = `${BASE_URL}/pokemon?limit=18&offset=0`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`โหลดรายการ Pokémon ไม่สำเร็จ: HTTP ${response.status}`);
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`API ไม่ได้ส่ง JSON กลับมา: ${url}`);
    }

    const json = await response.json();
    const idsFromAPI = json.results.map((item) =>
      Number(item.url.split("/").filter(Boolean).pop())
    );

    // ID เหล่านี้เป็นเพียงตัวเลือกแนะนำ ไม่ใช่ข้อมูล Mock
    // ทำให้ Featured/Gallery ยังมีหกตัวที่ผู้ใช้คุ้นเคย
    const ids = [...new Set([...FEATURED_IDS, ...idsFromAPI])].filter(
      (id) => Number.isSafeInteger(id) && id > 0
    );

    return Promise.all(ids.map((id) => getPokemonById(id)));
  });
}

export function clearPokemonListCache() {
  forget(LIST_CACHE_KEY);
  // เก็บ cache รายตัวไว้เพื่อลดการยิง API ซ้ำ
}
