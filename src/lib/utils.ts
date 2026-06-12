import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return "Not disclosed";
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString();
}

export function platformColor(platform: string): string {
  const colors: Record<string, string> = {
    LINKEDIN: "#0077B5",
    INDEED: "#2164F3",
    GLASSDOOR: "#0CAA41",
    WELLFOUND: "#FB5703",
    LEVER: "#4A90E2",
    GREENHOUSE: "#3AB549",
    WORKDAY: "#F37020",
    OTHER: "#6B7280",
  };
  return colors[platform] ?? colors.OTHER;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    SAVED: "text-gray-400 bg-gray-400/10",
    APPLIED: "text-blue-400 bg-blue-400/10",
    UNDER_REVIEW: "text-yellow-400 bg-yellow-400/10",
    INTERVIEW: "text-purple-400 bg-purple-400/10",
    OFFER: "text-green-400 bg-green-400/10",
    REJECTED: "text-red-400 bg-red-400/10",
    WITHDRAWN: "text-gray-400 bg-gray-400/10",
  };
  return colors[status] ?? colors.APPLIED;
}

export function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}
