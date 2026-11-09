
import { useState } from "react";
import { getPokemonJSON, toPokemon } from "../api/pokemon";

function ApiLab() {
  const [id, setId] = useState("25");
  const [status, setStatus] = useState("idle");
  const [raw, setRaw] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const number = Number(id);

    if (!Number.isInteger(number) || number < 1) {
      setStatus("error");
      setError("กรุณาใส่หมายเลข Pokémon ที่มากกว่า 0");
      return;
    }

    setStatus("loading");
    setError("");
    setRaw(null);
    setSelected(null);

    try {
      const data = await getPokemonJSON(number);
      setRaw(data);
      setSelected(toPokemon(data));
      setStatus("success");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  const preview = raw
    ? {
        id: raw.id,
        name: raw.name,
        types: raw.types,
        sprites: {
          front_default: raw.sprites?.front_default,
        },
      }
    : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">
        Week 8 — PokéAPI Lab
      </h1>

      <p className="mt-2 text-slate-600">
        ทดลองใช้ fetch ดึงข้อมูล Pokémon และอ่าน JSON จริง
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
        <input
          type="number"
          min="1"
          value={id}
          onChange={(e) => setId(e.target.value)}
          aria-label="Pokémon ID"
          className="w-36 rounded-xl border border-slate-200 bg-white px-4 py-3"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {status === "loading"
            ? "กำลังโหลด..."
            : "โหลดจาก PokéAPI"}
        </button>
      </form>

      {status === "loading" && (
        <p className="mt-6 text-slate-600">
          กำลังดึงข้อมูล Pokémon...
        </p>
      )}

      {status === "error" && (
        <p role="alert" className="mt-6 text-red-600">
          {error}
        </p>
      )}

      {status === "success" && selected && (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <img
            src={selected.image}
            alt={selected.name}
            className="h-36 w-36 object-contain"
          />

          <h2 className="text-2xl font-bold">
            {selected.name}
          </h2>

          <p className="mt-1 text-slate-500">
            No. {selected.id} · Type: {selected.type}
          </p>
        </div>
      )}

      {preview && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold">
            ตัวอย่าง JSON ที่ API ส่งมา
          </h2>

          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-green-200">
            {JSON.stringify(preview, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}

export default ApiLab;
