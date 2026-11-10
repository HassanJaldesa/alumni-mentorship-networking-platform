import bcrypt from "bcryptjs";

// Cost factor 12: about a quarter of a second per hash on a laptop,
// slow enough to resist brute-force guessing (NFR-02).
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}