
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Pokemon from "./pages/Pokemon";
import PokemonDetail from "./pages/PokemonDetail";
import Watchlist from "./pages/Watchlist";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const STORAGE_KEY = "pokemonhub-wishlist";

function App() {
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(saved)
        ? saved.filter(Number.isInteger)
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(wishlistIds)
      );
    } catch {
      // บางเบราว์เซอร์อาจไม่อนุญาตให้บันทึก
    }
  }, [wishlistIds]);

  function toggleWishlist(id) {
    setWishlistIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id]
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <Navbar title="PokémonHub" />

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                wishlistIds={wishlistIds}
                onToggleWishlist={toggleWishlist}
              />
            }
          />

          <Route
            path="/pokemon"
            element={
              <Pokemon
                wishlistIds={wishlistIds}
                onToggleWishlist={toggleWishlist}
              />
            }
          />

          <Route
            path="/pokemon/:id"
            element={
              <PokemonDetail
                wishlistIds={wishlistIds}
                onToggleWishlist={toggleWishlist}
              />
            }
          />

          <Route
          path="/watchlist"
          element={
        <Watchlist
      wishlistIds={wishlistIds}
      onToggleWishlist={toggleWishlist}
    />
  }
/>
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
