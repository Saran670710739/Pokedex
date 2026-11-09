
function PokemonCard({ name, type, image }) {
  return (
    <div>
      <img src={image} alt={name} width="150" />
      <h2>{name}</h2>
      <p>Type: {type}</p>
    </div>
  );
}

export default PokemonCard;
