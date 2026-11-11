import { NextResponse } from "next/server";

// Small helpers so every API route answers errors in the same JSON shape.
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
}
