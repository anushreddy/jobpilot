import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Zap, Sparkles, FileText, Send, Target, Mail, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: Target, title: "Smart Job Matching", desc: "See your ATS match score for every role and focus on the jobs you'll actually land." },
  { icon: Sparkles, title: "AI Resume Tailoring", desc: "Instantly rewrite your resume for any job description — keyword-optimized to score 90+." },
  { icon: FileText, title: "One-Click Documents", desc: "Download tailored resumes as polished PDF or DOC, formatting preserved." },
  { icon: Mail, title: "Cover Letters & Outreach", desc: "Generate cover letters plus LinkedIn and email messages that get replies." },
  { icon: Send, title: "Application Tracking", desc: "Track every application, the resume you used, and its match score in one place." },
  { icon: Zap, title: "Add Any Job", desc: "Paste a job URL and Intervo pulls in the details so you can tailor and apply." },
];

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[650px] h-[650px] rounded-full bg-violet-600/15 blur-[130px] pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">Intervo</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-500 hover:to-violet-500 transition"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6">
          <Sparkles className="w-3.5 h-3.5" /> AI-powered job search
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
          Land your next role
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
            faster with Intervo
          </span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-6">
          Tailor your resume to any job in seconds, generate cover letters and outreach, track every
          application, and apply with confidence — all in one place.
        </p>

        <div className="flex items-center justify-center gap-3 mt-9">
          <Link
            href="/register"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium rounded-xl hover:from-purple-500 hover:to-violet-500 transition shadow-lg shadow-purple-600/20"
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-border text-foreground font-medium rounded-xl hover:bg-secondary transition"
          >
            Log in
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Intervo</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Intervo · intervo.io</p>
        </div>
      </footer>
    </div>
  );
}
