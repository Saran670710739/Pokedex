
import { useState } from "react";

function ReviewForm({ pokemonName }) {
  const [review, setReview] = useState("");
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("typing");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");

    try {
      await submitReview(review);
      setStatus("success");
    } catch (err) {
      setStatus("typing");
      setError(err);
    }
  }

  if (status === "success") {
    return (
      <p className="font-semibold text-green-600">
        ขอบคุณสำหรับรีวิว {pokemonName} 🎉
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-xl font-bold">
        รีวิว {pokemonName}
      </h3>

      <textarea
        value={review}
        onChange={(e) => {
          setReview(e.target.value);
          setError(null);
        }}
        disabled={status === "submitting"}
        placeholder="คุณคิดอย่างไรกับ Pokémon ตัวนี้..."
        rows={4}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100"
      />

      <button
        type="submit"
        disabled={
          review.trim().length === 0 ||
          status === "submitting"
        }
        className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {status === "submitting"
          ? "กำลังส่ง..."
          : "ส่งรีวิว"}
      </button>

      {error !== null && (
        <p className="text-sm text-red-500">
          {error.message}
        </p>
      )}
    </form>
  );
}

function submitReview(text) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (text.trim().length < 10) {
        reject(new Error("รีวิวสั้นเกินไป ลองเขียนอีกนิด"));
      } else {
        resolve();
      }
    }, 1500);
  });
}

export default ReviewForm;
