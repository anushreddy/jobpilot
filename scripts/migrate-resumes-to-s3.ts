/**
 * One-off migration: move resumes stored on the local disk into S3.
 *
 * Reads every Resume whose filePath points at a local file, uploads the bytes
 * to S3 under the scalable key layout (test/ prefix by default), and updates
 * the DB record to the new S3 key.
 *
 * Usage:
 *   STORAGE_DRIVER=s3 STORAGE_ENV_PREFIX=test \
 *   AWS_REGION=... AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... S3_BUCKET_NAME=... \
 *   npx tsx scripts/migrate-resumes-to-s3.ts
 *
 * Safe to re-run: records already on an S3-style key (containing the env prefix)
 * are skipped.
 */
import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import path from "path";
import { S3Storage } from "../src/lib/storage/s3";
import { originalResumeKey, storageEnvPrefix } from "../src/lib/storage/keys";

const db = new PrismaClient();

async function main() {
  const storage = new S3Storage();
  const resumes = await db.resume.findMany({ where: { filePath: { not: null } } });

  console.log(`Found ${resumes.length} resume(s) with a stored file.`);
  let migrated = 0;
  let skipped = 0;

  for (const resume of resumes) {
    const current = resume.filePath!;

    // Already an S3 key for this env? skip.
    if (current.startsWith(`${storageEnvPrefix}/`)) {
      skipped++;
      continue;
    }

    // Old local layout was "uploads/resumes/<name>" relative to cwd.
    const absPath = path.join(process.cwd(), current);
    let buffer: Buffer;
    try {
      buffer = await readFile(absPath);
    } catch {
      console.warn(`  ! Local file missing for user ${resume.userId}: ${current} — skipping`);
      skipped++;
      continue;
    }

    const key = originalResumeKey(resume.userId, resume.fileName);
    await storage.put(key, buffer, "application/octet-stream");
    await db.resume.update({ where: { id: resume.id }, data: { filePath: key } });

    console.log(`  ✓ ${resume.userId}: ${current} → ${key}`);
    migrated++;
  }

  console.log(`\nDone. Migrated ${migrated}, skipped ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
