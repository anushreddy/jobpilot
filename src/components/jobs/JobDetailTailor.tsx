"use client";

import { useRouter } from "next/navigation";
import { JdTailor } from "@/components/resume/JdTailor";

interface Props {
  hasResume: boolean;
  jobTitle: string;
  company: string;
  jobDescription: string;
  skills: string[];
}

export function JobDetailTailor({ hasResume, jobTitle, company, jobDescription, skills }: Props) {
  const router = useRouter();

  // Compose a rich JD so the AI and ATS scoring see the title + key skills.
  const presetJd = [
    `Job Title: ${jobTitle}`,
    `Company: ${company}`,
    skills.length ? `Key Skills: ${skills.join(", ")}` : "",
    "",
    jobDescription,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <JdTailor
      hasResume={hasResume}
      presetJd={presetJd}
      compact
      jobSkills={skills}
      jobTitle={jobTitle}
      onSaved={() => router.refresh()}
    />
  );
}
