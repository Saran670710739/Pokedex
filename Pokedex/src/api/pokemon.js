
import pokemonMock from "../data/pokemon";
import { onceADay, forget } from "./cache";

const BASE_URL = "https://pokeapi.co/api/v2";
const LIST_CACHE_KEY = "pokemonhub-api-list-v1";

export async function getPokemonJSON(id) {
  const response = await fetch(
    `${BASE_URL}/pokemon/${id}`
  );

  if (!response.ok) {
    throw new Error(
      `PokéAPI ตอบกลับ HTTP ${response.status}`
    );
  }

  return response.json();
}

export function toPokemon(data) {
  const rawType =
    data.types?.[0]?.type?.name || "unknown";

  return {
    id: data.id,
    name:
      data.name.charAt(0).toUpperCase() +
      data.name.slice(1),
    type:
      rawType.charAt(0).toUpperCase() +
      rawType.slice(1),
    image:
      data.sprites?.front_default ||
      data.sprites?.other?.["official-artwork"]?.front_default ||
      "",
    detail: "",
  };
}

export function getPokemonList() {
  return onceADay(LIST_CACHE_KEY, async () => {
    const rawPokemon = await Promise.all(
      pokemonMock.map((item) =>
        getPokemonJSON(item.id)
      )
    );

    return rawPokemon.map((data) => {
      const fromAPI = toPokemon(data);

      const oldInfo = pokemonMock.find(
        (item) => item.id === fromAPI.id
      );

      return {
        ...fromAPI,
        detail: oldInfo?.detail || "",
      };
    });
  });
}

export function clearPokemonListCache() {
  forget(LIST_CACHE_KEY);
}
