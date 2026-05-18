#!/usr/bin/env node
/**
 * Generate a bcrypt hash for the admin password.
 *
 * Usage:
 *   npm run hash-password -- "your-password-here"
 *
 * Paste the resulting hash into ADMIN_PASSWORD_HASH in .env.local and Vercel.
 * It's safe to commit the hash (not the plain password).
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npm run hash-password -- \"your-password\"");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Pick a password at least 8 characters long.");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log(hash);
