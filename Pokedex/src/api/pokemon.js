
import { onceADay, forget } from "./cache";

// Go Backend บน Render
const BASE_URL = (
  process.env.REACT_APP_API_URL || "https://pokedex-backend-2ar0.onrender.com"
).replace(/\/+$/, "");

const LIST_CACHE_KEY = "pokemonhub-api-list-v3";
const DETAIL_CACHE_PREFIX = "pokemonhub-api-detail-v3-";

export const SEARCH_PAGE_SIZE = 21;

// เรียก Go Backend
async function request(path) {
  const response = await fetch(`${BASE_URL}/api${path}`);

  if (!response.ok) {
    throw new Error(`Backend ตอบกลับ HTTP ${response.status}`);
  }

  return response.json();
}

// แปลงข้อมูลจาก Backend ให้เข้ากับโครงสร้างเดิมของ Frontend
export function toPokemon(data) {
  const types = data.types || [];
  const type = types[0] || "unknown";

  return {
    id: data.id,
    name: data.name
      ? data.name.charAt(0).toUpperCase() + data.name.slice(1)
      : "",
    type: type.charAt(0).toUpperCase() + type.slice(1),
    types,
    image: data.artwork_url || "",
    detail: data.description || "",
  };
}

// โหลดรายละเอียด Pokémon ตาม ID
export async function getPokemonJSON(id) {
  const response = await request(`/pokemon/${id}`);
  return response.data || response;
}

export async function getPokemonById(id) {
  const numericId = Number(id);

  if (!Number.isSafeInteger(numericId) || numericId < 1) {
    throw new Error("หมายเลข Pokémon ไม่ถูกต้อง");
  }

  return onceADay(
    `${DETAIL_CACHE_PREFIX}${numericId}`,
    async () => {
      const data = await getPokemonJSON(numericId);
      return toPokemon(data);
    }
  );
}

// โหลดรายการ Pokémon
export function getPokemonList() {
  return onceADay(LIST_CACHE_KEY, async () => {
    const response = await request("/pokemon?page=1&limit=18");

    return (response.data || []).map(toPokemon);
  });
}

// ล้าง Cache รายการ
export function clearPokemonListCache() {
  forget(LIST_CACHE_KEY);
}

// สุ่ม Pokémon จาก Gen 1 จำนวน 21 ตัว
export async function getRandomPokemonList(previousIds = []) {
  const previous = new Set(previousIds.map(Number));

  let ids = Array.from({ length: 151 }, (_, i) => i + 1)
    .filter((id) => !previous.has(id));

  if (ids.length < SEARCH_PAGE_SIZE) {
    ids = Array.from({ length: 151 }, (_, i) => i + 1);
  }

  // สุ่มแบบไม่ซ้ำ
  ids.sort(() => Math.random() - 0.5);

  const selected = ids.slice(0, SEARCH_PAGE_SIZE);
  const results = [];

  for (let i = 0; i < selected.length; i += 5) {
    const batch = selected.slice(i, i + 5);
    const pokemon = await Promise.all(
      batch.map((id) => getPokemonById(id))
    );

    results.push(...pokemon);
  }

  return results;
}

// ค้นหา Pokémon จาก Go Backend
export async function getPokemonSearchIndex() {
  const response = await request("/pokemon?page=1&limit=151");

  return (response.data || []).map((pokemon) => ({
    id: pokemon.id,
    name: pokemon.name,
  }));
}

// ค้นหาและแบ่งหน้า
export async function searchAllPokemon(query, page = 0) {
  const term = String(query ?? "").trim();
  const safePage = Number.isSafeInteger(page) && page >= 0 ? page : 0;

  if (!term) {
    return {
      items: [],
      total: 0,
      page: safePage,
      pageSize: SEARCH_PAGE_SIZE,
    };
  }

  const params = new URLSearchParams({
    search: term,
    page: String(safePage + 1),
    limit: String(SEARCH_PAGE_SIZE),
  });

  const response = await request(`/pokemon?${params.toString()}`);

  return {
    items: (response.data || []).map(toPokemon),
    total: response.total || 0,
    page: safePage,
    pageSize: SEARCH_PAGE_SIZE,
  };
}
