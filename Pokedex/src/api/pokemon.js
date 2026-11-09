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


// Week 8 UI enhancement: สุ่ม 21 Pokémon จากสายพันธุ์ทั้งหมดของ PokéAPI
// แยกจาก getPokemonList() เพื่อไม่เปลี่ยน Featured บน Home
const RANDOM_POOL_CACHE_KEY = "pokemonhub-random-species-ids-v1";
const RANDOM_BATCH_SIZE = 21;
const RANDOM_CONCURRENCY = 5;

async function getSpeciesIds() {
  return onceADay(RANDOM_POOL_CACHE_KEY, async () => {
    // เอาจำนวนสายพันธุ์ปัจจุบันก่อน ไม่ตั้ง ID สูงสุดแบบเดาสุ่ม
    const first = await fetch(`${BASE_URL}/pokemon-species?limit=1&offset=0`);
    if (!first.ok) {
      throw new Error(`โหลดจำนวน Pokémon ไม่สำเร็จ (HTTP ${first.status})`);
    }
    const firstJSON = await first.json();
    const count = Number(firstJSON.count);
    if (!Number.isSafeInteger(count) || count < RANDOM_BATCH_SIZE) {
      throw new Error("จำนวน Pokémon ที่ API ส่งมาไม่ถูกต้อง");
    }

    // โหลดรายชื่อสายพันธุ์ทั้งหมดหนึ่งครั้งต่อวันและเก็บเฉพาะ ID
    const response = await fetch(
      `${BASE_URL}/pokemon-species?limit=${count}&offset=0`
    );
    if (!response.ok) {
      throw new Error(`โหลดรายชื่อ Pokémon ไม่สำเร็จ (HTTP ${response.status})`);
    }
    const json = await response.json();
    const ids = (json.results || [])
      .map((entry) => {
        const match = entry.url.match(/\/pokemon-species\/(\d+)\/?$/);
        return match ? Number(match[1]) : null;
      })
      .filter((id) => Number.isSafeInteger(id) && id > 0);

    if (ids.length < RANDOM_BATCH_SIZE) {
      throw new Error("PokéAPI ส่งรายชื่อ Pokémon มาไม่ครบ");
    }
    return ids;
  });
}

export async function getRandomPokemonList(previousIds = []) {
  const allIds = await getSpeciesIds();
  const previous = new Set(previousIds.map(Number));
  // หลีกเลี่ยง 21 ตัวที่แสดงก่อนหน้านี้ ถ้าจำนวนสายพันธุ์เพียงพอ
  const eligible = allIds.filter((id) => !previous.has(id));
  const pool = eligible.length >= RANDOM_BATCH_SIZE ? eligible : [...allIds];

  // Partial Fisher–Yates shuffle: สุ่ม 21 ID ที่ไม่ซ้ำกัน
  const selected = [];
  for (let i = 0; i < RANDOM_BATCH_SIZE; i += 1) {
    const randomIndex = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[randomIndex]] = [pool[randomIndex], pool[i]];
    selected.push(pool[i]);
  }

  // โหลดรายละเอียดทีละชุดย่อย ไม่ยิง 21 Requests พร้อมกันทั้งหมด
  const results = [];
  for (let i = 0; i < selected.length; i += RANDOM_CONCURRENCY) {
    const batch = selected.slice(i, i + RANDOM_CONCURRENCY);
    const pokemon = await Promise.all(batch.map((id) => getPokemonById(id)));
    results.push(...pokemon);
  }
  return results;
}

// v1.35: ค้นหาจากรายชื่อ Pokémon ทั้งหมด รวมรูปแบบพิเศษที่ /pokemon รองรับ
// เก็บแค่ชื่อ/ID ของทั้งฐานข้อมูลไว้ใน Cache ไม่โหลดรูป/Stats ทุกตัวในคราวเดียว
const SEARCH_INDEX_CACHE_KEY = "pokemonhub-search-index-v1";
export const SEARCH_PAGE_SIZE = 21;

export async function getPokemonSearchIndex() {
  return onceADay(SEARCH_INDEX_CACHE_KEY, async () => {
    // เว็บไซต์ทางการของ PokéAPI แสดงตัวอย่างการใช้ limit=100000
    // ซึ่งเพียงพอสำหรับดึงรายชื่อทั้งหมดในการเรียกครั้งเดียว
    const url = `${BASE_URL}/pokemon?limit=100000&offset=0`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`โหลดสารบัญชื่อ Pokémon ไม่สำเร็จ (HTTP ${response.status})`);
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("PokéAPI ไม่ได้ส่งข้อมูลรายชื่อเป็น JSON");
    }

    const json = await response.json();
    if (!Array.isArray(json.results) || json.results.length < json.count) {
      throw new Error("ได้รับรายชื่อ Pokémon ไม่ครบ กรุณาลองใหม่");
    }

    return json.results
      .map(({ name, url: pokemonUrl }) => {
        const match = pokemonUrl.match(/\/pokemon\/(\d+)\/?$/);
        return match ? { id: Number(match[1]), name } : null;
      })
      .filter((item) => item && Number.isSafeInteger(item.id) && item.id > 0);
  });
}

// ส่งผลลัพธ์ทีละหน้า หน้าละ 21 ตัว เพื่อไม่ยิง API หลายพันครั้งตอนค้นหา
export async function searchAllPokemon(query, page = 0) {
  const term = String(query ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const safePage = Number.isSafeInteger(page) && page >= 0 ? page : 0;

  if (!term) {
    return { items: [], total: 0, page: safePage, pageSize: SEARCH_PAGE_SIZE };
  }

  const index = await getPokemonSearchIndex();
  const isNumber = /^\d+$/.test(term);
  const matches = index.filter((item) =>
    isNumber ? item.id === Number(term) : item.name.includes(term)
  );

  // โปเกมอนที่ชื่อขึ้นต้นด้วยคำค้นจะอยู่ก่อนรายการที่มีคำนั้นอยู่กลางชื่อ
  if (!isNumber) {
    matches.sort((a, b) => {
      const aRank = a.name === term ? 0 : a.name.startsWith(term) ? 1 : 2;
      const bRank = b.name === term ? 0 : b.name.startsWith(term) ? 1 : 2;
      return aRank - bRank || a.id - b.id;
    });
  }

  const ids = matches
    .slice(safePage * SEARCH_PAGE_SIZE, (safePage + 1) * SEARCH_PAGE_SIZE)
    .map((item) => item.id);

  // จำกัดการโหลดรายละเอียดไว้สูงสุดครั้งละ 5 ตัว และใช้ Cache รายตัวเดิม
  const items = [];
  for (let i = 0; i < ids.length; i += 5) {
    const batch = ids.slice(i, i + 5);
    const results = await Promise.all(batch.map((id) => getPokemonById(id)));
    items.push(...results);
  }

  return { items, total: matches.length, page: safePage, pageSize: SEARCH_PAGE_SIZE };
}
