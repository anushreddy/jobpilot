/** Structured, formatting-aware tailored resume returned by the AI. */
export interface TailoredResumeDoc {
  name: string;
  title: string;
  contact: string; // single line: email · phone · location · links
  summary: string[]; // bullet points
  skills: { category: string; items: string[] }[]; // rendered as a table
  experience: {
    company: string;
    role: string;
    period: string;
    location?: string;
    bullets: string[];
  }[];
  education: { school: string; degree: string; period: string }[];
}

/** Flatten a structured resume to plain text (fallback / search / storage). */
export function resumeDocToText(doc: TailoredResumeDoc): string {
  const lines: string[] = [];
  lines.push(doc.name, doc.title, doc.contact, "");
  if (doc.summary?.length) {
    lines.push("SUMMARY");
    doc.summary.forEach((b) => lines.push(`• ${b}`));
    lines.push("");
  }
  if (doc.skills?.length) {
    lines.push("SKILLS");
    doc.skills.forEach((s) => lines.push(`${s.category}: ${s.items.join(", ")}`));
    lines.push("");
  }
  if (doc.experience?.length) {
    lines.push("EXPERIENCE");
    doc.experience.forEach((e) => {
      lines.push(`${e.role} — ${e.company} (${e.period})`);
      e.bullets.forEach((b) => lines.push(`• ${b}`));
      lines.push("");
    });
  }
  if (doc.education?.length) {
    lines.push("EDUCATION");
    doc.education.forEach((ed) => lines.push(`${ed.degree}, ${ed.school} (${ed.period})`));
  }
  return lines.join("\n");
}
