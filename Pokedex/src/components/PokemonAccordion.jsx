
import { useState } from "react";

function PokemonPanel({
  name,
  detail,
  isActive,
  onShow,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-bold text-slate-800">
        {name}
      </h3>

      {isActive ? (
        <p className="mt-2 text-slate-600">
          {detail}
        </p>
      ) : (
        <button
          type="button"
          onClick={onShow}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          อ่านรายละเอียด
        </button>
      )}
    </div>
  );
}

function PokemonAccordion({ pokemons = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {pokemons.map((item, index) => (
        <PokemonPanel
          key={item.id}
          name={item.name}
          detail={item.detail}
          isActive={activeIndex === index}
          onShow={() => setActiveIndex(index)}
        />
      ))}
    </div>
  );
}

export default PokemonAccordion;
