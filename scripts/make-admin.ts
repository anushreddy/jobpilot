/**
 * Promote a user to ADMIN by email.
 *
 * Usage:
 *   npx tsx scripts/make-admin.ts you@example.com
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/make-admin.ts <email>");
    process.exit(1);
  }

  const user = await db.user.update({
    where: { email },
    data: { role: "ADMIN", emailVerified: new Date() },
  }).catch(() => null);

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`✓ ${email} is now an ADMIN. Sign out and back in to refresh your session.`);
}

main().finally(() => db.$disconnect());
