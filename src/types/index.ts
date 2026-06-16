export type Plan = "FREE" | "PRO" | "ENTERPRISE";

export type Platform =
  | "LINKEDIN"
  | "INDEED"
  | "GLASSDOOR"
  | "WELLFOUND"
  | "LEVER"
  | "GREENHOUSE"
  | "WORKDAY"
  | "OTHER";

export type ApplicationStatus =
  | "SAVED"
  | "APPLIED"
  | "UNDER_REVIEW"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN";

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  plan: Plan;
  createdAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  domain: string | null;
  roleTypes: string[];
  skills: string[];
  locations: string[];
  remoteOnly: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  experienceLevel: string[];
  jobTypes: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  locationType: string;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requirements: string[];
  skills: string[];
  platform: Platform;
  platformUrl: string;
  postedAt: string;
  matchScore?: number;
  atsScore?: number | null;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  matchScore: number | null;
  atsScore?: number | null;
  autoApplied: boolean;
  appliedAt: string;
  updatedAt: string;
  job: Job;
}

export interface DashboardStats {
  matchedJobs: number;
  matchedJobsChange: number;
  applications: number;
  applicationsChange: number;
  interviewRate: number;
  interviewRateChange: number;
  responseRate: number;
  responseRateChange: number;
  weeklyApplications: number;
  weeklyInterviews: number;
  weeklyResponses: number;
  weeklyOffers: number;
  applyVelocityScore: number;
}
