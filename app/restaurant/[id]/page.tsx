import Link from "next/link";
import { apiUrl } from "@/lib/api";

// Render this page on every request rather than baking it at build time:
// the data can change the moment someone submits a review.
export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Screen 2 calls the backend API and renders whatever it returns.
  const response = await fetch(await apiUrl(`/api/restaurants/${id}`), {
    cache: "no-store",
  });

  if (response.status === 404) {
    return (
      <main className="mx-auto flex w-full max-w-[560px] flex-col gap-3 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">No restaurant with that id.</h1>
        <Link href="/review/1" className="text-sm text-stone-500 underline underline-offset-4">
          Go write the first review instead
        </Link>
      </main>
    );
  }

  const data = await response.json();

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col px-6 py-12">
      {/* 1. Restaurant name, with cuisine and area underneath, smaller and muted */}
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
        {data.name}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {data.cuisine} · {data.area}
      </p>

      {/* 2. Average rating — the biggest thing on the page — with the count beside it */}
      <div className="mt-12 flex items-baseline gap-3">
        {/* The frontend does zero maths: this number was computed in the backend.*/}
        <span className="text-7xl font-bold leading-none text-stone-900">
          {data.averageRating === null ? "—" : data.averageRating}
        </span>
        <span className="text-sm text-stone-500">
          {data.totalReviews} review{data.totalReviews === 1 ? "" : "s"}
        </span>
      </div>

      {data.latestReview ? (
        <>
          {/* 3. The latest review, visually highlighted so it sits apart */}
          <section className="mt-12 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-baseline justify-between">
              <p className="font-medium text-stone-900">Latest review</p>
              <p className="text-sm text-stone-500">
                {formatDate(data.latestReview.createdAt)}
              </p>
            </div>
            <p className="mt-4 text-2xl leading-none text-amber-700">
              {"★".repeat(data.latestReview.rating)}
            </p>
            <p className="mt-4 leading-relaxed text-stone-800">
              {data.latestReview.comment}
            </p>
          </section>

          {/* 4. The older reviews, in a plain list */}
          {data.reviews.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xs font-medium uppercase tracking-widest text-stone-500">
                Earlier reviews
              </h2>
              <ul className="mt-4 divide-y divide-stone-200">
                {data.reviews.map((review: {
                  id: number;
                  rating: number;
                  comment: string;
                  createdAt: string;
                }) => (
                  <li key={review.id} className="py-5">
                    <div className="flex items-baseline justify-between">
                      <p className="text-amber-700">{"★".repeat(review.rating)}</p>
                      <p className="text-sm text-stone-500">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 text-stone-800">{review.comment}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        /* 6. Empty state: no reviews yet, invite the first one */
        <section className="mt-12 rounded-xl border border-stone-200 p-8 text-center">
          <p className="text-stone-700">No reviews yet.</p>
          <p className="mt-1 text-sm text-stone-500">Be the first to leave one.</p>
        </section>
      )}

      {/* 5. The way in to /review/[id] */}
      <Link
        href={`/review/${id}`}
        className="mt-12 inline-flex w-full items-center justify-center rounded-lg bg-amber-700 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-800"
      >
        Write a review
      </Link>
    </main>
  );
}