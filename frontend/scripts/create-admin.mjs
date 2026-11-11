// Creates an administrator account (FR-01, FR-12).
// Administrators cannot self-register, so the first one is created with this
// script; after that, administrators can add others from the Users page.
//
// Run from the frontend folder:
//   node --env-file=.env.local scripts/create-admin.mjs First Last email@example.com
//
// A random password is generated and printed once. Store it safely.
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";

const [firstName, lastName, rawEmail] = process.argv.slice(2);
if (!firstName || !lastName || !rawEmail) {
  console.error("Usage: node --env-file=.env.local scripts/create-admin.mjs First Last email@example.com");
  process.exit(1);
}
const email = rawEmail.trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("That email address is not valid.");
  process.exit(1);
}

// Letters and numbers only, with at least one of each kind.
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
function generatePassword(length = 14) {
  const all = LETTERS + DIGITS;
  const chars = [LETTERS[randomInt(LETTERS.length)], DIGITS[randomInt(DIGITS.length)]];
  while (chars.length < length) chars.push(all[randomInt(all.length)]);
  return chars.sort(() => randomInt(3) - 1).join("");
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const password = generatePassword();
  const hash = await bcrypt.hash(password, 12);
  await client.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role, consent_given_at)
     VALUES ($1, $2, $3, $4, 'ADMIN', now())`,
    [firstName, lastName, email, hash],
  );
  console.log(`Administrator created: ${firstName} ${lastName} <${email}>`);
  console.log(`Password (shown once, store it safely): ${password}`);
} catch (error) {
  if (error.code === "23505") console.error("An account with this email already exists.");
  else console.error("Could not create the administrator:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
