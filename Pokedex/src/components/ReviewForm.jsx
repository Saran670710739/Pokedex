
import { useCallback, useEffect, useState } from "react";
import {
  getPokemonReviews,
  createPokemonReview,
  updatePokemonReview,
  deletePokemonReview,
} from "../api/backend";

import { useAuth } from "../auth/AuthContext";
function ReviewForm({ pokemonId, pokemonName }) {
  const { user } = useAuth();
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("typing");
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [actionLoading, setActionLoading] = useState(false);

  const loadReviews = useCallback(async () => {
  try {
    const response = await getPokemonReviews(pokemonId);
    setReviews(response?.data || []);
  } catch (err) {
    setError(err.message || "ไม่สามารถโหลดรีวิวได้");
  } finally {
    setLoading(false);
  }
}, [pokemonId]);

  useEffect(() => {
  if (pokemonId) {
    loadReviews();
  }
}, [pokemonId, loadReviews]);

  async function handleSubmit(e) {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setError("กรุณาเข้าสู่ระบบก่อนเขียนรีวิว");
      return;
    }

    if (review.trim().length < 10) {
      setError("รีวิวสั้นเกินไป ลองเขียนอย่างน้อย 10 ตัวอักษร");
      return;
    }

    setError("");
    setStatus("submitting");

    try {
      await createPokemonReview(
        pokemonId,
        rating,
        review.trim()
      );

      setReview("");
      setRating(5);
      setStatus("success");

      setLoading(true);
      await loadReviews();
    } catch (err) {
      setStatus("typing");

      if (err.status === 409) {
        setError("คุณเคยรีวิว Pokémon ตัวนี้แล้ว");
      } else {
        setError(err.message || "ส่งรีวิวไม่สำเร็จ");
      }
    }
  }

  async function handleUpdate(reviewId) {
  if (editComment.trim().length < 10) {
    setError("รีวิวสั้นเกินไป อย่างน้อย 10 ตัวอักษร");
    return;
  }

  try {
    setActionLoading(true);
    setError("");

    await updatePokemonReview(
      reviewId,
      editRating,
      editComment.trim()
    );

    setEditingId(null);
    await loadReviews();
  } catch (err) {
    setError(err.message || "แก้ไขรีวิวไม่สำเร็จ");
  } finally {
    setActionLoading(false);
  }
}

async function handleDelete(reviewId) {
  const confirmed = window.confirm(
    "คุณต้องการลบรีวิวนี้ใช่หรือไม่?"
  );

  if (!confirmed) return;

  try {
    setActionLoading(true);
    setError("");

    await deletePokemonReview(reviewId);

    await loadReviews();
  } catch (err) {
    setError(err.message || "ลบรีวิวไม่สำเร็จ");
  } finally {
    setActionLoading(false);
  }
}

  return (
    <section className="space-y-5">
      <h3 className="text-xl font-bold">
        รีวิว {pokemonName}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block font-medium mb-2">
            คะแนนของคุณ
          </label>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                disabled={status === "submitting"}
                className={`text-2xl ${
                  star <= rating
                    ? "text-yellow-400"
                    : "text-gray-300"
                }`}
                aria-label={`${star} ดาว`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={review}
          onChange={(e) => {
            setReview(e.target.value);
            setError("");
            setStatus("typing");
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
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      {status === "success" && (
        <p className="font-semibold text-green-600">
          ขอบคุณสำหรับรีวิว {pokemonName} 🎉
        </p>
      )}

      <div className="space-y-3">
        <h4 className="font-bold">
          รีวิวจากผู้ใช้งาน ({reviews.length})
        </h4>

        {loading ? (
          <p className="text-gray-500">
            กำลังโหลดรีวิว...
          </p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500">
            ยังไม่มีรีวิวสำหรับ Pokémon ตัวนี้
          </p>
        ) : (
          reviews.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  สมาชิก #{item.user_id}
                </p>

                <p className="text-yellow-500">
                  {"★".repeat(item.rating)}
                  <span className="text-gray-300">
                    {"★".repeat(5 - item.rating)}
                  </span>
                </p>
              </div>


{item.user_id === user?.id && editingId === item.id ? (
  <div className="mt-3 space-y-3">
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setEditRating(star)}
          disabled={actionLoading}
          className={`text-xl ${
            star <= editRating ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>

    <textarea
      value={editComment}
      onChange={(e) => setEditComment(e.target.value)}
      rows={3}
      disabled={actionLoading}
      className="w-full rounded-lg border p-2"
    />

    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => handleUpdate(item.id)}
        disabled={actionLoading}
        className="rounded-lg bg-blue-600 px-3 py-2 text-white"
      >
        บันทึก
      </button>

      <button
        type="button"
        onClick={() => setEditingId(null)}
        disabled={actionLoading}
        className="rounded-lg bg-gray-200 px-3 py-2"
      >
        ยกเลิก
      </button>
    </div>
  </div>
) : (
  <>
    <p className="mt-2 whitespace-pre-wrap text-sm">
      {item.comment}
    </p>

    {item.user_id === user?.id && (
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setEditingId(item.id);
            setEditComment(item.comment);
            setEditRating(item.rating);
            setError("");
          }}
          className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700"
        >
          แก้ไข
        </button>

        <button
          type="button"
          onClick={() => handleDelete(item.id)}
          disabled={actionLoading}
          className="rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700"
        >
          ลบ
        </button>
      </div>
    )}
  </>
)}

<p className="mt-2 text-xs text-gray-400">
  {item.created_at
    ? new Date(item.created_at).toLocaleDateString("th-TH")
    : ""}
</p>

            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default ReviewForm;
