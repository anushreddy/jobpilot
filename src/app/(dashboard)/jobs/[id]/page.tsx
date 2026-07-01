import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { scoreResumeForJob } from "@/lib/ats";
import { formatSalary, timeAgo, platformColor } from "@/lib/utils";
import { AtsPie } from "@/components/jobs/AtsPie";
import { JobDetailTailor } from "@/components/jobs/JobDetailTailor";
import { OutreachGenerator } from "@/components/jobs/OutreachGenerator";
import { EditJobButton } from "@/components/jobs/EditJobButton";
import { ArrowLeft, MapPin, Building2, ExternalLink } from "lucide-react";

const PLATFORM_LABEL: Record<string, string> = {
  LINKEDIN: "LinkedIn", INDEED: "Indeed", GLASSDOOR: "Glassdoor",
  WELLFOUND: "Wellfound", LEVER: "Lever", GREENHOUSE: "Greenhouse",
  WORKDAY: "Workday", OTHER: "Other",
};

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const [job, resume, existingApplication] = await Promise.all([
    db.job.findUnique({ where: { id } }),
    db.resume.findUnique({ where: { userId: session!.user.id } }),
    db.application.findUnique({
      where: { userId_jobId: { userId: session!.user.id, jobId: id } },
      select: { id: true },
    }),
  ]);

  if (!job) notFound();

  const atsScore = resume?.content
    ? scoreResumeForJob(resume.content, {
        skills: job.skills,
        description: job.description,
        title: job.title,
      })
    : null;

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: job details */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-violet-600/10 border border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {job.companyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.companyLogo} alt={job.company} className="w-10 h-10 object-contain" />
                ) : (
                  <Building2 className="w-6 h-6 text-primary/60" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">{job.company}</p>
                <h1 className="text-xl font-bold text-foreground mt-0.5">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" /> {job.location}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-border text-muted-foreground capitalize">
                    {job.locationType}
                  </span>
                  <span className="text-sm text-muted-foreground">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                </div>
              </div>
              {atsScore != null && (
                <div className="flex flex-col items-center flex-shrink-0">
                  <AtsPie score={atsScore} size={56} />
                  <p className="text-[10px] text-muted-foreground mt-1">ATS Match</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: platformColor(job.platform) + "22", color: platformColor(job.platform) }}
              >
                {PLATFORM_LABEL[job.platform]}
              </span>
              <span className="text-xs text-muted-foreground">Posted {timeAgo(job.postedAt)}</span>
              <div className="ml-auto flex items-center gap-2">
                <EditJobButton
                  jobId={job.id}
                  job={{
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    locationType: job.locationType,
                    salary: job.salary,
                    description: job.description,
                    skills: job.skills,
                  }}
                />
                <a
                  href={job.platformUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/80 transition"
                >
                  Apply on {PLATFORM_LABEL[job.platform]} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className="glass rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-md bg-secondary text-foreground border border-border">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <div className="glass rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Requirements</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
                {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {/* Description */}
          <div className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Job Description</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
          </div>
        </div>

        {/* Right: tailor + outreach */}
        <div className="lg:col-span-2">
          <div className="sticky top-20 space-y-4">
            <JobDetailTailor
              jobId={job.id}
              hasResume={Boolean(resume?.content)}
              alreadyApplied={Boolean(existingApplication)}
              jobTitle={job.title}
              company={job.company}
              jobDescription={job.description}
              skills={job.skills}
            />
            <OutreachGenerator jobId={job.id} hasResume={Boolean(resume?.content)} />
          </div>
        </div>
      </div>
    </div>
  );
}
