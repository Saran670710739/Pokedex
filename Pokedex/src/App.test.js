
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Home from "./pages/Home";
import { getPokemonList, clearPokemonListCache } from "./api/pokemon";

jest.mock("./api/pokemon", () => ({
  getPokemonList: jest.fn(),
  clearPokemonListCache: jest.fn(),
}));

jest.mock("./components/PokemonGallery", () => {
  return function MockPokemonGallery({ pokemons }) {
    return <div>Gallery: {pokemons.length} Pokémon</div>;
  };
});

jest.mock("./components/PokemonGrid", () => {
  return function MockPokemonGrid({ pokemons }) {
    return <div>Grid: {pokemons.length} Pokémon</div>;
  };
});

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

test("แสดงสถานะกำลังโหลด Pokémon", () => {
  getPokemonList.mockReturnValue(new Promise(() => {}));

  renderHome();

  expect(
    screen.getByText(/กำลังโหลด Pokémon จาก PokéAPI/i)
  ).toBeInTheDocument();
});

test("แสดง Pokémon เมื่อโหลดข้อมูลสำเร็จ", async () => {
  getPokemonList.mockResolvedValue([
    { id: 1, name: "bulbasaur" },
    { id: 2, name: "ivysaur" },
    { id: 3, name: "venusaur" },
    { id: 4, name: "charmander" },
    { id: 5, name: "charmeleon" },
    { id: 6, name: "charizard" },
  ]);

  renderHome();

  expect(
    await screen.findByText("Gallery: 6 Pokémon")
  ).toBeInTheDocument();

  expect(screen.getByText("Grid: 3 Pokémon")).toBeInTheDocument();
});

test("แสดงข้อความ Error เมื่อโหลดข้อมูลไม่สำเร็จ", async () => {
  getPokemonList.mockRejectedValue(
    new Error("เกิดข้อผิดพลาดในการโหลด")
  );

  renderHome();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "เกิดข้อผิดพลาดในการโหลด"
  );
});

test("กดลองใหม่แล้วโหลดข้อมูลอีกครั้ง", async () => {

  getPokemonList
    .mockRejectedValueOnce(new Error("โหลดไม่สำเร็จ"))
    .mockResolvedValueOnce([]);

  renderHome();

  await screen.findByRole("alert");

  userEvent.click(screen.getByRole("button", { name: "ลองใหม่" }));

  await waitFor(() => {
    expect(getPokemonList).toHaveBeenCalledTimes(2);
  });

  expect(clearPokemonListCache).toHaveBeenCalledTimes(1);
});
