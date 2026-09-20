import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

// The exact shape a reviews row arrives in (verified against the live database:
// id is a number, rating is a number, comment is a string, created_at is a Date).
type ReviewRow = {
  id: number;
  rating: number;
  comment: string;
  created_at: Date;
};

// Converts a database row into the shape this API publicly prints: the frontend
// receives createdAt as an ISO 8601 text string (safe to ship over the internet).
function toReviewView(row: ReviewRow) {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = Number(id);

  if (!Number.isInteger(restaurantId)) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  // Does the restaurant exist at all?
  const restaurants = await sql.query(
    "SELECT id, name, cuisine, area FROM restaurants WHERE id = $1",
    [restaurantId]
  );
  if (restaurants.length === 0) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }
  const restaurant = restaurants[0];

  // One row with COUNT(*) and AVG(rating) rounded to one decimal place.
  // Note: no average is stored anywhere — Postgres computes it here, on demand.
  const aggregates = await sql.query(
    "SELECT COUNT(*) AS total_reviews, ROUND(AVG(rating), 1) AS average_rating FROM reviews WHERE restaurant_id = $1",
    [restaurantId]
  );
  const totalReviews = Number(aggregates[0].total_reviews);
  const averageRating =
    aggregates[0].average_rating === null
      ? null
      : Number(aggregates[0].average_rating);

  // The newest review, by created_at. The driver types rows loosely, so we
  // assert the verified shape once, at the boundary, then type-check onward
  // strictly (no "any" anywhere).
  const latestRows = (await sql.query(
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC LIMIT 1",
    [restaurantId]
  )) as ReviewRow[];

  // Every review except the newest one, newest first (OFFSET 1 skips the first row).
  const olderRows = (await sql.query(
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC OFFSET 1",
    [restaurantId]
  )) as ReviewRow[];

  return NextResponse.json({
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    area: restaurant.area,
    averageRating,
    totalReviews,
    latestReview: latestRows.length > 0 ? toReviewView(latestRows[0]) : null,
    reviews: olderRows.map(toReviewView),
  });
}