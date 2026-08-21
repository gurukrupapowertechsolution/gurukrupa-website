/**
 * scripts/hashAdminPassword.ts
 *
 * One-off CLI helper to generate the bcrypt hash to store in
 * ADMIN_PASSWORD_HASH. Run with: `npm run hash-password -- <plaintext>`
 */

import bcrypt from "bcryptjs";

const plaintext = process.argv[2];

if (!plaintext) {
  // eslint-disable-next-line no-console
  console.error("Usage: npm run hash-password -- <plaintext-password>");
  process.exit(1);
}

bcrypt.hash(plaintext, 12).then((hash) => {
  // eslint-disable-next-line no-console
  console.log(hash);
});
