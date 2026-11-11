import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isUuid, jsonError, readJson } from "@/lib/http";
import { getSessionForUser } from "@/lib/mentorships";
import { getSession } from "@/lib/session";

function rating(value: unknown): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 5 ? number : null; // DR-02
}

// A participant rates a completed session (FR-11). One record per person per session.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("Please log in.", 401);
  const body = await readJson(request);
  if (!body || !isUuid(body.sessionId)) return jsonError("Session not found.", 404);

  const target = await getSessionForUser(body.sessionId, session.userId);
  if (!target) return jsonError("Session not found.", 404);
  if (target.status !== "COMPLETED") {
    return jsonError("Feedback can be given once the session is completed.", 409);
  }

  const relevance = rating(body.relevanceRating);
  const satisfaction = rating(body.satisfactionScore);
  const comments = String(body.comments ?? "").trim();
  if (!relevance || !satisfaction) return jsonError("Choose a rating from 1 to 5 for both questions.", 400);
  if (comments.length > 2000) return jsonError("Comments can be at most 2000 characters.", 400);

  try {
    await query(
      `INSERT INTO feedback (session_id, user_id, relevance_rating, satisfaction_score, comments)
       VALUES ($1, $2, $3, $4, $5)`,
      [body.sessionId, session.userId, relevance, satisfaction, comments || null],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return jsonError("You have already given feedback for this session.", 409);
    }
    throw error;
  }
  return NextResponse.json({ saved: true }, { status: 201 });
}
