import { connection } from "next/server";
import { pool } from "@/lib/db";

// Health check: proves the app can reach the database.
export async function GET() {
  await connection();

  const started = performance.now();
  try {
    const { rows } = await pool.query<{ now: Date; version: string; database: string }>(
      "select now(), version(), current_database() as database",
    );
    const ms = Math.round(performance.now() - started);
    return Response.json({
      status: "ok",
      baza: rows[0].database,
      vremeBaze: rows[0].now,
      postgres: rows[0].version.split(" ").slice(0, 2).join(" "),
      trajanjeMs: ms,
    });
  } catch (error) {
    console.error("Health check failed", error);
    return Response.json(
      { status: "greska", poruka: "Baza nije dostupna" },
      { status: 503 },
    );
  }
}
