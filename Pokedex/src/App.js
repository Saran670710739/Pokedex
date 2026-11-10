
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext";
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

import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "./api/backend";

function AppContent() {
  const { user, loading } = useAuth();

  const userId = user?.id ?? user?.user_id;

  const [wishlistIds, setWishlistIds] = useState([]);

  // โหลด Wishlist ของบัญชีที่ Login อยู่
  useEffect(() => {
    let cancelled = false;

    // ล้างข้อมูลเดิมก่อนเปลี่ยนบัญชี
    setWishlistIds([]);

    if (loading || !userId) {
      return () => {
        cancelled = true;
      };
    }

    async function loadFavorites() {
      try {
        const response = await getFavorites();

        if (cancelled) return;

        const favorites = Array.isArray(response?.data)
          ? response.data
          : [];

        const ids = favorites
          .map((pokemon) => Number(pokemon.id))
          .filter((id) => Number.isInteger(id));

        setWishlistIds(ids);
      } catch (error) {
        if (!cancelled) {
          console.error("Load Wishlist failed:", error);
          setWishlistIds([]);
        }
      }
    }

    loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [userId, loading]);

  // เพิ่มหรือลบ Pokemon ใน Wishlist
  async function toggleWishlist(id) {
    if (!userId) {
      alert("กรุณาเข้าสู่ระบบก่อนใช้งาน Wishlist");
      return;
    }

    try {
      if (wishlistIds.includes(id)) {
        await removeFavorite(id);

        setWishlistIds((current) =>
          current.filter((itemId) => itemId !== id)
        );
      } else {
        await addFavorite(id);

        setWishlistIds((current) =>
          current.includes(id) ? current : [...current, id]
        );
      }
    } catch (error) {
      console.error("Toggle Wishlist failed:", error);
      alert(error.message || "ไม่สามารถแก้ไข Wishlist ได้");
    }
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
          <Route path="/api-lab" element={<ApiLab />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile wishlistCount={wishlistIds.length} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings/password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <Admin />
              </ProtectedRoute>
            }
          />

          <Route path="/ui-preview" element={<UIPreview />} />

          <Route
            path="/ui-preview/profile"
            element={<Profile preview />}
          />

          <Route
            path="/ui-preview/settings/password"
            element={<ChangePassword preview />}
          />

          <Route
            path="/ui-preview/admin"
            element={<Admin preview />}
          />

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
