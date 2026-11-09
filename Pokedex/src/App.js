import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Pokemon from "./pages/Pokemon";
import PokemonDetail from "./pages/PokemonDetail";
import Watchlist from "./pages/Watchlist";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import ApiLab from "./pages/ApiLab";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import Admin from "./pages/Admin";
import UIPreview from "./pages/UIPreview";

const STORAGE_KEY = "pokemonhub-wishlist";

function AppContent() {
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved.filter(Number.isInteger) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // Some browsers can disable localStorage.
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
          <Route path="/" element={<Home wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} />} />
          <Route path="/pokemon" element={<Pokemon wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} />} />
          <Route path="/pokemon/:id" element={<PokemonDetail wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} />} />
          <Route path="/watchlist" element={<Watchlist wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} />} />
          <Route path="/about" element={<About />} />
          <Route path="/api-lab" element={<ApiLab />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<ProtectedRoute><Profile wishlistCount={wishlistIds.length} /></ProtectedRoute>} />
          <Route path="/settings/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
          <Route path="/ui-preview" element={<UIPreview />} />
          <Route path="/ui-preview/profile" element={<Profile preview />} />
          <Route path="/ui-preview/settings/password" element={<ChangePassword preview />} />
          <Route path="/ui-preview/admin" element={<Admin preview />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
