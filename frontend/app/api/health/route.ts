// GET /api/health — checks the database and the recommendation service (NFR-07).
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic"; // always run the checks; never serve a cached answer

export async function GET() {
  let database = "unavailable";
  try {
    await pool.query("SELECT 1");
    database = "ok";
  } catch {
    // leave as "unavailable"
  }

  let recommendationService = "unavailable";
  try {
    const response = await fetch(`${process.env.ML_SERVICE_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000), // give up after 3 seconds
    });
    if (response.ok) recommendationService = "ok";
  } catch {
    // leave as "unavailable"
  }

  const allOk = database === "ok" && recommendationService === "ok";
  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", database, recommendationService },
    { status: allOk ? 200 : 503 }
  );
}