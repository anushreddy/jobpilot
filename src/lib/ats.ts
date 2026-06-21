// Heuristic ATS scoring — keyword/section coverage of a resume against a job.
// Runs locally with no external API so it works in dev without an API key.

const ATS_SECTIONS = [
  "experience",
  "education",
  "skills",
  "summary",
  "projects",
  "contact",
];

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#. ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
}

/**
 * Score a resume against a single job (0-100).
 * Blends skill-keyword overlap with the job's required skills and a check
 * for standard ATS-readable sections.
 */
export function scoreResumeForJob(
  resumeContent: string,
  job: { skills: string[]; description: string; title: string }
): number {
  if (!resumeContent.trim()) return 0;

  const resumeTokens = tokenize(resumeContent);
  const covers = (phrase: string) =>
    phrase.toLowerCase().split(/\s+/).every((part) => resumeTokens.has(part));

  // 1. Required-skill coverage (70% weight) — the highest-signal ATS factor.
  const jobSkills = job.skills.map((s) => s.toLowerCase());
  const skillCov = jobSkills.length
    ? jobSkills.filter(covers).length / jobSkills.length
    : 0.5;

  // 2. JD keyword coverage (30% weight).
  const jdKeys = extractJDKeywords(job.description, 20);
  const jdCov = jdKeys.length ? jdKeys.filter(covers).length / jdKeys.length : 0;

  const raw = skillCov * 0.7 + jdCov * 0.3;
  // Curve: full skills + ~70% JD keywords → ~90+.
  return Math.round(Math.min(99, Math.max(15, raw * 90 + 9)));
}

/** Overall ATS health score for the resume itself (section + length quality). */
export function scoreResumeQuality(resumeContent: string): number {
  if (!resumeContent.trim()) return 0;
  const lower = resumeContent.toLowerCase();
  const sectionsFound = ATS_SECTIONS.filter((s) => lower.includes(s)).length;
  const sectionScore = sectionsFound / ATS_SECTIONS.length;

  const words = resumeContent.split(/\s+/).length;
  // Healthy resumes are roughly 350-900 words
  const lengthScore = words < 150 ? 0.4 : words > 1200 ? 0.7 : 1;

  return Math.round(Math.min(99, Math.max(10, (sectionScore * 0.7 + lengthScore * 0.3) * 100)));
}

// Common words to ignore when matching a resume against a free-text JD.
const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "our", "are", "will", "this", "that",
  "have", "has", "your", "their", "from", "who", "all", "can", "out", "use",
  "job", "role", "team", "work", "working", "experience", "years", "year",
  "ability", "strong", "we", "a", "an", "to", "of", "in", "on", "as", "is",
  "be", "or", "at", "by", "it", "we're", "etc", "including", "such",
]);

/**
 * Extract the most significant keywords from a job description, most-frequent
 * first. Used to steer the AI toward including real JD terminology so the
 * tailored resume scores highly.
 */
export function extractJDKeywords(jobDescription: string, limit = 24): string[] {
  const words = jobDescription
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

/**
 * Match score (0-100) between a resume and a pasted job description.
 * Measures how many meaningful JD keywords appear in the resume.
 */
export function scoreResumeAgainstJD(resumeContent: string, jobDescription: string): number {
  if (!resumeContent.trim() || !jobDescription.trim()) return 0;

  const resumeTokens = tokenize(resumeContent);

  // Score against the JD's most SIGNIFICANT keywords (the same set the AI is
  // instructed to weave in), not every word — this is what an ATS actually
  // weights, and lets a well-tailored resume legitimately reach 90+.
  const keywords = extractJDKeywords(jobDescription, 30);
  if (keywords.length === 0) return 0;

  const matched = keywords.filter((k) =>
    k.split(/\s+/).every((part) => resumeTokens.has(part))
  ).length;
  const coverage = matched / keywords.length;

  // Generous curve: ~80% keyword coverage → ~90 score.
  return Math.round(Math.min(99, Math.max(20, coverage * 95 + 16)));
}
