import { ulid } from "ulid";

/**
 * S3 / object-storage key layout for JobPilot.
 *
 * Design goals:
 *  - High-cardinality partitioning by userId so reads/writes spread evenly
 *    across S3 partitions (no hot prefixes as the user base grows).
 *  - Environment isolation via a top-level prefix (test/staging/prod) so a
 *    single bucket can safely serve multiple deploys.
 *  - Separation by artifact lifecycle (original vs AI-generated) so you can
 *    apply different lifecycle/retention rules and audit each independently.
 *  - ULIDs for object ids: globally unique, lexicographically sortable by
 *    creation time, so listing a prefix returns newest-last without a DB hit.
 *
 * Layout:
 *   {env}/resumes/{userId}/original/{ulid}.{ext}
 *   {env}/resumes/{userId}/ai-tailored/{jobId}/{ulid}.txt
 *   {env}/resumes/{userId}/cover-letters/{jobId}/{ulid}.txt
 */

const ENV_PREFIX = process.env.STORAGE_ENV_PREFIX || "test";

function ext(fileName: string): string {
  const m = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "bin";
}

/** Key for a user's uploaded (original) resume. */
export function originalResumeKey(userId: string, fileName: string): string {
  return `${ENV_PREFIX}/resumes/${userId}/original/${ulid()}.${ext(fileName)}`;
}

/** Key for an AI-tailored resume generated for a specific job. */
export function tailoredResumeKey(userId: string, jobId: string): string {
  return `${ENV_PREFIX}/resumes/${userId}/ai-tailored/${jobId}/${ulid()}.txt`;
}

/** Key for an AI-generated cover letter for a specific job. */
export function coverLetterKey(userId: string, jobId: string): string {
  return `${ENV_PREFIX}/resumes/${userId}/cover-letters/${jobId}/${ulid()}.txt`;
}

/** Key for a resume tailored to a pasted JD (no job record). */
export function jdTailoredKey(userId: string, ext = "txt"): string {
  return `${ENV_PREFIX}/resumes/${userId}/jd-tailored/${ulid()}.${ext}`;
}

export const storageEnvPrefix = ENV_PREFIX;
