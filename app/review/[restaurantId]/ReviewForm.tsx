"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function ReviewForm({ restaurantId }: { restaurantId: number }) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The Submit button stays disabled until a rating is picked and the
  // comment has content after trimming whitespace.
  const canSubmit = rating !== null && comment.trim().length > 0 && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        rating,
        comment: comment.trim(),
      }),
    });

    if (response.ok) {
      // Sent to the restaurant page, which will show the freshly computed average.
      router.push(`/restaurant/${restaurantId}`);
      router.refresh();
      return;
    }

    // Show exactly what the backend said — never a message invented here.
    const body = await response.json();
    setError(body.error ?? "Something went wrong.");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-12">
      <label className="text-sm font-medium text-stone-700">Your rating</label>

      {/* Star picker: 1 to 5, clickable, clear selected state */}
      <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            onClick={() => setRating(value)}
            className={`text-4xl leading-none transition-colors ${
              rating !== null && value <= rating
                ? "text-amber-700"
                : "text-stone-300 hover:text-stone-400"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <label
        htmlFor="comment"
        className="mt-8 block text-sm font-medium text-stone-700"
      >
        Your comment
      </label>
      <textarea
        id="comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={4}
        placeholder="What did you think?"
        className="mt-3 w-full rounded-lg border border-stone-300 bg-white p-4 text-stone-900 placeholder:text-stone-400 focus:border-amber-700 focus:outline-none"
      />

      {/* The backend's verdict appears here, in its own words */}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-8 w-full rounded-lg bg-amber-700 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}