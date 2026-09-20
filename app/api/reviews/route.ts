import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  let body: { rating?: unknown; comment?: unknown; restaurantId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request body is not valid JSON." },
      { status: 400 }
    );
  }

  const { rating, comment, restaurantId } = body;

  // 1) rating must be a whole number from 1 to 5
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be a whole number from 1 to 5." },
      { status: 400 }
    );
  }

  // 2) comment must be a non-empty string after trimming whitespace
  if (typeof comment !== "string" || comment.trim().length === 0) {
    return NextResponse.json(
      { error: "Comment cannot be empty." },
      { status: 400 }
    );
  }

  // 3) restaurantId must refer to a restaurant that actually exists
  if (typeof restaurantId !== "number" || !Number.isInteger(restaurantId)) {
    return NextResponse.json(
      { error: "restaurantId must be a whole number." },
      { status: 400 }
    );
  }
  const restaurants = await sql.query(
    "SELECT id FROM restaurants WHERE id = $1",
    [restaurantId]
  );
  if (restaurants.length === 0) {
    return NextResponse.json(
      { error: "That restaurant does not exist." },
      { status: 400 }
    );
  }

  // All checks passed: insert exactly one row. created_at gets NOW() by default.
  const inserted = await sql.query(
    "INSERT INTO reviews (restaurant_id, rating, comment) VALUES ($1, $2, $3) RETURNING id",
    [restaurantId, rating, comment.trim()]
  );

  return NextResponse.json(
    { success: true, reviewId: inserted[0].id },
    { status: 201 }
  );
}