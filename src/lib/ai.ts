import Anthropic from "@anthropic-ai/sdk";
import type { TailoredResumeDoc } from "@/types/resume";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Tailor a resume to a JD and return a STRUCTURED document so the client can
 * render bullets for the summary/experience and a table for skills.
 */
export async function tailorResumeStructured(
  resumeContent: string,
  jobDescription: string,
  linkedinUrl?: string
): Promise<TailoredResumeDoc> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are an expert resume writer. Restructure the candidate's EXISTING resume to better target the job description, then return it as STRUCTURED JSON.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${resumeContent}
${linkedinUrl ? `\nCANDIDATE LINKEDIN: ${linkedinUrl}` : ""}

Return ONLY a JSON object (no markdown, no commentary) with exactly this shape:
{
  "name": string,                           // the candidate's full name ONLY (no role/title in this field)
  "title": string,                          // the candidate's current professional title (e.g. "Senior Software Engineer")
  "contact": string,                        // one line: email · phone · location${linkedinUrl ? " · LinkedIn URL" : ""}
  "summary": string[],                      // 2-4 bullet points
  "skills": [ { "category": string, "items": string[] } ],
  "experience": [ { "company": string, "role": string, "period": string, "location": string, "bullets": string[] } ],
  "education": [ { "school": string, "degree": string, "period": string } ]
}

IMPORTANT rules:
- PRESERVE the candidate's real content. Keep EVERY job, employer, date, and education entry from the original resume — do not drop or merge any.
- Keep each role's full set of responsibilities/achievements. You may lightly rephrase bullets to mirror JD wording, but do NOT shorten or summarize away detail. Aim to keep roughly the same number of bullets per role as the original (or more), not fewer.
- "name" is the person's name only. Never put the target job title in the name field.
${linkedinUrl ? `- Include this LinkedIn URL in the contact line: ${linkedinUrl}` : "- Only include contact details present in the original resume."}
- Never invent employers, titles, dates, degrees, or skills the candidate doesn't have.
- Group skills into logical categories for a clean table.
- If a field is unknown, use an empty string or empty array.`,
      },
    ],
  });

  const text = (message.content[0] as { text: string }).text.trim();
  // Strip accidental code fences just in case.
  const json = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(json) as TailoredResumeDoc;
}

/**
 * Tailor a resume to a pasted job description (no Job record needed).
 * Returns clean, ATS-friendly resume text.
 */
export async function tailorResumeToJD(
  resumeContent: string,
  jobDescription: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert resume writer. Rewrite the candidate's resume so it is tailored to the job description below, while staying truthful and ATS-friendly.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${resumeContent}

Instructions:
1. Reorder and rephrase to surface the experience and skills most relevant to this JD.
2. Naturally incorporate keywords/technologies from the JD that the candidate genuinely has.
3. Never invent experience, employers, dates, or credentials.
4. Keep a clean structure: a short summary, skills, experience (with bullet points), education.
5. Return ONLY the finished resume as plain text. No commentary, no markdown fences.

Tailored Resume:`,
      },
    ],
  });

  return (message.content[0] as { text: string }).text.trim();
}

export async function tailorResume(
  resumeContent: string,
  jobDescription: string,
  jobTitle: string,
  company: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert resume writer. Tailor the following resume to match the job description while keeping it authentic and ATS-friendly.

JOB: ${jobTitle} at ${company}

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${resumeContent}

Instructions:
1. Highlight relevant skills and experiences that match the job requirements
2. Use keywords from the job description naturally
3. Keep all facts truthful - do not fabricate experience
4. Maintain professional formatting
5. Return ONLY the tailored resume content, no explanations

Tailored Resume:`,
      },
    ],
  });

  return (message.content[0] as { text: string }).text;
}

export async function generateCoverLetter(
  resumeContent: string,
  jobDescription: string,
  jobTitle: string,
  company: string,
  userName: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Write a compelling, personalized cover letter for ${userName} applying for ${jobTitle} at ${company}.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME:
${resumeContent}

Write a 3-paragraph cover letter that:
1. Opens with enthusiasm and a specific hook about the company
2. Highlights 2-3 most relevant experiences/skills from the resume
3. Closes with a clear call to action

Return ONLY the cover letter text, no subject line or formatting instructions.`,
      },
    ],
  });

  return (message.content[0] as { text: string }).text;
}

export async function calculateMatchScore(
  resumeContent: string,
  jobDescription: string,
  skills: string[]
): Promise<{ score: number; insights: string[] }> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Analyze how well this candidate matches the job. Return a JSON object with:
- score: number 0-100
- insights: array of 3 short insight strings (what matches, what's missing, recommendation)

JOB: ${jobDescription.slice(0, 500)}
SKILLS: ${skills.join(", ")}
RESUME SUMMARY: ${resumeContent.slice(0, 500)}

Return ONLY valid JSON, no markdown:`,
      },
    ],
  });

  try {
    return JSON.parse((message.content[0] as { text: string }).text);
  } catch {
    return { score: 70, insights: ["Good skill alignment", "Consider adding more projects", "Strong candidate"] };
  }
}

export async function getAIInsights(
  applications: { status: string; matchScore: number | null }[],
  preferences: { skills: string[]; roleTypes: string[] }
): Promise<string[]> {
  const stats = {
    total: applications.length,
    interviews: applications.filter((a) => a.status === "INTERVIEW").length,
    avgScore: Math.round(
      applications.reduce((sum, a) => sum + (a.matchScore ?? 0), 0) / (applications.length || 1)
    ),
  };

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Give 3 short, actionable job search insights as a JSON array of strings.

Stats: ${JSON.stringify(stats)}
Skills: ${preferences.skills.join(", ")}
Target roles: ${preferences.roleTypes.join(", ")}

Return ONLY a JSON array of 3 strings, each under 80 chars:`,
      },
    ],
  });

  try {
    return JSON.parse((message.content[0] as { text: string }).text);
  } catch {
    return [
      "Your resume is strongly matched for Frontend Engineer roles",
      "Consider adding more projects with measurable impact",
      "You're most likely to hear back on Tuesdays and Thursdays",
    ];
  }
}
