import { apiUrl } from "@/lib/api";
import ReviewForm from "./ReviewForm";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;

  // The top of the form shows the restaurant name, so fetch it from the API.
  const response = await fetch(await apiUrl(`/api/restaurants/${restaurantId}`), {
    cache: "no-store",
  });

  if (response.status === 404) {
    return (
      <main className="mx-auto flex w-full max-w-[560px] flex-col px-6 py-24">
        <h1 className="text-2xl font-semibold">That restaurant could not be found.</h1>
      </main>
    );
  }

  const restaurant = await response.json();

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
        {restaurant.name}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {restaurant.cuisine} · {restaurant.area}
      </p>

      {/* The interactive part of this screen lives in the browser */}
      <ReviewForm restaurantId={Number(restaurantId)} />
    </main>
  );
}