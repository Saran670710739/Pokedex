import { useEffect, useState } from "react";
import PokemonGrid from "../components/PokemonGrid";
import SearchBox from "../components/SearchBox";
import {
  getPokemonList,
  clearPokemonListCache,
  getRandomPokemonList,
  searchAllPokemon,
  SEARCH_PAGE_SIZE,
} from "../api/pokemon";

// จำชุด 21 ตัวที่สุ่มไว้ แยกจาก Cache รายตัวและ Wishlist
const RANDOM_LIST_STORAGE_KEY = "pokemonhub-random21-selection-v1";

function loadSavedRandomList() {
  try {
    const list = JSON.parse(
      localStorage.getItem(RANDOM_LIST_STORAGE_KEY) || "null"
    );
    if (!Array.isArray(list) || list.length !== 21) return null;
    const valid = list.every(
      (item) =>
        item &&
        Number.isSafeInteger(item.id) &&
        item.id > 0 &&
        typeof item.name === "string" &&
        typeof item.type === "string" &&
        typeof item.image === "string" &&
        typeof item.detail === "string"
    );
    if (!valid || new Set(list.map((item) => item.id)).size !== 21) {
      return null;
    }
    return list;
  } catch {
    return null;
  }
}

function saveRandomList(list) {
  try {
    localStorage.setItem(RANDOM_LIST_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // แสดงข้อมูลที่สุ่มได้ต่อ แม้ไม่สามารถใช้ localStorage
  }
}

const EMPTY_SEARCH = {
  term: "",
  page: 0,
  status: "idle",
  items: [],
  total: 0,
  error: "",
};

function Pokemon({ wishlistIds = [], onToggleWishlist }) {
  const [savedRandomList] = useState(loadSavedRandomList);
  const [pokemonList, setPokemonList] = useState(() => savedRandomList || []);
  const [status, setStatus] = useState(
    savedRandomList ? "success" : "loading"
  );
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [searchPage, setSearchPage] = useState(0);
  const [searchRetryKey, setSearchRetryKey] = useState(0);
  const [searchState, setSearchState] = useState(EMPTY_SEARCH);

  const [randomLoading, setRandomLoading] = useState(false);
  const [randomError, setRandomError] = useState("");

  // โหลดรายการเริ่มต้นเฉพาะเมื่อไม่เคยบันทึกชุดสุ่มไว้
  useEffect(() => {
    if (savedRandomList && retryKey === 0) return;
    let ignore = false;

    async function loadPokemon() {
      setStatus("loading");
      setError("");
      try {
        const list = await getPokemonList();
        if (!ignore) {
          setPokemonList(list);
          setStatus("success");
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
          setStatus("error");
        }
      }
    }

    loadPokemon();
    return () => { ignore = true; };
  }, [retryKey, savedRandomList]);

  // เมื่อค้นหา ให้ค้นจากฐานข้อมูล PokéAPI ทั้งหมด ไม่ใช่เฉพาะชุด 21 ตัว
  // หน่วง 400ms เพื่อไม่ส่ง Request ทุกครั้งที่ผู้ใช้กดแป้นพิมพ์
  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setSearchState(EMPTY_SEARCH);
      return;
    }

    let ignore = false;
    const normalizedTerm = term.toLowerCase();
    const currentPage = searchPage;
    setSearchState({
      term: normalizedTerm,
      page: currentPage,
      status: "loading",
      items: [],
      total: 0,
      error: "",
    });

    const timer = setTimeout(async () => {
      try {
        const result = await searchAllPokemon(term, currentPage);
        if (!ignore) {
          setSearchState({
            term: normalizedTerm,
            page: currentPage,
            status: "success",
            items: result.items,
            total: result.total,
            error: "",
          });
        }
      } catch (err) {
        if (!ignore) {
          setSearchState({
            term: normalizedTerm,
            page: currentPage,
            status: "error",
            items: [],
            total: 0,
            error: err.message || "ค้นหา Pokémon ไม่สำเร็จ",
          });
        }
      }
    }, 400);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query, searchPage, searchRetryKey]);

  const isSearching = query.trim().length > 0;
  const searchIsCurrent =
    searchState.term === query.trim().toLowerCase() &&
    searchState.page === searchPage;
  const searchStatus = searchIsCurrent ? searchState.status : "loading";

  // ตัวกรองธาตุใช้กับชุดปัจจุบันเฉพาะเมื่อไม่มีคำค้นหา
  const types = [...new Set(pokemonList.map((item) => item.type))].sort();
  const filteredPokemon = pokemonList.filter(
    (item) => selectedType === "all" || item.type === selectedType
  );

  function handleQueryChange(value) {
    setQuery(value);
    setSearchPage(0);
    setSelectedType("all");
  }

  function handleRetry() {
    clearPokemonListCache();
    setRetryKey((current) => current + 1);
  }

  async function handleRandomize() {
    if (randomLoading) return;
    setRandomLoading(true);
    setRandomError("");
    try {
      const newList = await getRandomPokemonList(
        pokemonList.map((item) => item.id)
      );
      saveRandomList(newList);
      setPokemonList(newList);
      setQuery("");
      setSearchPage(0);
      setSelectedType("all");
    } catch (err) {
      setRandomError(err.message || "สุ่ม Pokémon ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setRandomLoading(false);
    }
  }

  const firstSearchItem = searchPage * SEARCH_PAGE_SIZE + 1;
  const lastSearchItem = Math.min(
    (searchPage + 1) * SEARCH_PAGE_SIZE,
    searchState.total
  );
  const totalPages = Math.ceil(searchState.total / SEARCH_PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Pokémon List
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            ค้นหา Pokémon ได้ทุกตัวด้วยชื่อหรือหมายเลข Pokédex
          </p>
        </div>

        <button
          type="button"
          onClick={handleRandomize}
          disabled={status !== "success" || randomLoading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-200/60 transition hover:-translate-y-0.5 hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <span aria-hidden="true">🎲</span>
          {randomLoading ? "กำลังสุ่ม 21 ตัว..." : "สุ่ม Pokémon 21 ตัว"}
        </button>
      </div>

      <SearchBox query={query} onQueryChange={handleQueryChange} />
      <p className="mt-2 text-xs text-slate-500">
        ตัวอย่าง: Pikachu, Charizard, Mewtwo, 25 หรือ 150 — ค้นหาทั้งฐานข้อมูล ไม่จำกัดแค่ 21 ตัวที่แสดง
      </p>

      {randomLoading && (
        <p role="status" aria-live="polite" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          กำลังดึง Pokémon ชุดใหม่จาก PokéAPI... รายการเดิมยังแสดงอยู่
        </p>
      )}
      {randomError && (
        <p role="alert" className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-red-600">
          {randomError} — ลองกดสุ่มใหม่อีกครั้ง
        </p>
      )}

      {isSearching ? (
        <section className="mt-6" aria-label="ผลการค้นหา Pokémon ทั้งหมด">
          {searchStatus === "loading" && (
            <p role="status" className="rounded-2xl bg-white/80 p-6 text-slate-600">
              กำลังค้นหา Pokémon จากรายชื่อทั้งหมด...
            </p>
          )}
          {searchStatus === "error" && (
            <div role="alert" className="rounded-2xl bg-white p-6">
              <p className="text-red-600">{searchState.error}</p>
              <button
                type="button"
                onClick={() => setSearchRetryKey((value) => value + 1)}
                className="mt-3 rounded-xl bg-red-500 px-5 py-2 text-white hover:bg-red-600"
              >
                ลองค้นหาอีกครั้ง
              </button>
            </div>
          )}
          {searchStatus === "success" && (
            <>
              <p className="mb-5 text-sm text-slate-500">
                ค้นพบ {searchState.total} ตัวจาก PokéAPI
                {searchState.total > 0 &&
                  ` · แสดง ${firstSearchItem}–${lastSearchItem}`}
              </p>

              {searchState.items.length > 0 ? (
                <PokemonGrid
                  pokemons={searchState.items}
                  wishlistIds={wishlistIds}
                  onToggleWishlist={onToggleWishlist}
                />
              ) : (
                <p className="rounded-2xl bg-white p-8 text-center text-slate-500">
                  ไม่พบ Pokémon ที่ตรงกับคำค้นหา 🔎
                </p>
              )}

              {totalPages > 1 && (
                <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSearchPage((page) => Math.max(0, page - 1))}
                    disabled={searchPage === 0}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    ← ก่อนหน้า
                  </button>
                  <span className="text-sm font-semibold text-slate-600">
                    หน้า {searchPage + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchPage((page) => page + 1)}
                    disabled={searchPage + 1 >= totalPages}
                    className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40"
                  >
                    ถัดไป →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <>
          {status === "loading" && (
            <p className="mt-6 rounded-2xl bg-white/80 p-6 text-slate-600">
              กำลังโหลด Pokémon จาก PokéAPI...
            </p>
          )}

          {status === "error" && (
            <div role="alert" className="mt-6 rounded-2xl bg-white p-6">
              <p className="mb-4 text-red-600">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                ลองใหม่
              </button>
            </div>
          )}

          {status === "success" && (
            <>
              <div className="my-6 flex flex-wrap gap-2" aria-label="กรองตามธาตุ">
                <button
                  type="button"
                  onClick={() => setSelectedType("all")}
                  aria-pressed={selectedType === "all"}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    selectedType === "all"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                  }`}
                >
                  ทุกธาตุ
                </button>
                {types.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    aria-pressed={selectedType === type}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      selectedType === type
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <p className="mb-5 text-sm text-slate-500">
                พบ {filteredPokemon.length} จาก {pokemonList.length} ตัว
              </p>

              {filteredPokemon.length > 0 ? (
                <PokemonGrid
                  pokemons={filteredPokemon}
                  wishlistIds={wishlistIds}
                  onToggleWishlist={onToggleWishlist}
                />
              ) : (
                <p className="rounded-2xl bg-white p-8 text-center text-slate-500">
                  ไม่พบ Pokémon ที่ตรงกับธาตุที่เลือก 🔎
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Pokemon;
