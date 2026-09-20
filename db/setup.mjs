import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Make sure .env.local exists next to package.json.");
  process.exit(1);
}

// Hand the connection string to the driver explicitly (the driver no longer
// guesses it from the environment on its own).
const sql = neon(connectionString);

const schema = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
const seed = readFileSync(new URL("./seed.sql", import.meta.url), "utf8");

// Make it safe to run more than once: remove the tables first, then rebuild.
for (const stmt of splitStatements("DROP TABLE IF EXISTS reviews; DROP TABLE IF EXISTS restaurants;")) {
  await run(sql, stmt, "reset");
}
for (const stmt of splitStatements(schema)) {
  await run(sql, stmt, "schema");
}
for (const stmt of splitStatements(seed)) {
  await run(sql, stmt, "seed");
}

console.log("\n=== restaurants ===");
console.table(await sql.query("SELECT id, name, cuisine, area FROM restaurants ORDER BY id"));

console.log("\n=== reviews ===");
console.table(await sql.query("SELECT id, restaurant_id, rating, comment, created_at FROM reviews ORDER BY created_at"));

function splitStatements(text) {
  return text
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s + ";");
}

async function run(sql, statement, kind) {
  try {
    await sql.query(statement);
    console.log(`ok: ${kind}`);
  } catch (error) {
    console.error(`failed (${kind}):`, error.message);
    process.exit(1);
  }
}