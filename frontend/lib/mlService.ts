import { SignJWT } from "jose";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://localhost:8000";

// Signs a token that is valid for one minute, so the FastAPI service can
// confirm the request came from this server (IR-03).
async function createServiceToken(): Promise<string> {
  const secret = process.env.ML_SERVICE_TOKEN;
  if (!secret || secret.length < 32) {
    throw new Error("ML_SERVICE_TOKEN is missing or shorter than 32 characters");
  }
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("nextjs-server")
    .setAudience("ml-service")
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(new TextEncoder().encode(secret));
}

// Sends an authenticated JSON request to the recommendation service (IR-02).
export async function callMlService(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown; timeoutMs?: number } = {},
): Promise<Response> {
  const token = await createServiceToken();
  return fetch(`${ML_SERVICE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? 10000),
  });
}

// Asks the service to (re)build a user's profile vectors (DR-03).
// Returns false instead of throwing, so a saved profile is never lost
// just because the recommendation service is down (NFR-07).
export async function requestProfileVectors(userId: string): Promise<boolean> {
  try {
    const response = await callMlService(`/profiles/${userId}/vectors`, { method: "POST" });
    if (!response.ok) {
      console.error("Vector generation failed:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Recommendation service unreachable:", error);
    return false;
  }
}