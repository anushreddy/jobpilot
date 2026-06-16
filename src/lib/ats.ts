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

  // 1. Skill keyword coverage (60% weight)
  const jobSkills = job.skills.map((s) => s.toLowerCase());
  const matchedSkills = jobSkills.filter((skill) =>
    skill.split(/\s+/).every((part) => resumeTokens.has(part))
  );
  const skillScore =
    jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0.5;

  // 2. Title keyword presence (15% weight)
  const titleTokens = tokenize(job.title);
  const titleMatched = [...titleTokens].filter((t) => resumeTokens.has(t)).length;
  const titleScore = titleTokens.size > 0 ? titleMatched / titleTokens.size : 0;

  // 3. ATS section completeness (25% weight)
  const lower = resumeContent.toLowerCase();
  const sectionsFound = ATS_SECTIONS.filter((s) => lower.includes(s)).length;
  const sectionScore = sectionsFound / ATS_SECTIONS.length;

  const raw = skillScore * 0.6 + titleScore * 0.15 + sectionScore * 0.25;
  return Math.round(Math.min(99, Math.max(5, raw * 100)));
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
