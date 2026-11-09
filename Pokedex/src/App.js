
import Navbar from "./components/Navbar";
import PokemonCard from "./components/PokemonCard";

function App() {
  return (
    <div id="home">
      <Navbar title="PokémonHub" />

      <main id="pokemon">
        <h1>Welcome to PokémonHub</h1>
        <p>Explore your favorite Pokémon!</p>

        <PokemonCard
          name="Pikachu"
          type="Electric"
          image="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
        />

        <PokemonCard
          name="Charmander"
          type="Fire"
          image="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png"
        />
      </main>
    </div>
  );
}

export default App;
