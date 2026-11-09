
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Pokemon from "./pages/Pokemon";
import PokemonDetail from "./pages/PokemonDetail";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <Navbar title="PokémonHub" />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pokemon" element={<Pokemon />} />
          <Route
            path="/pokemon/:id"
            element={<PokemonDetail />}
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
