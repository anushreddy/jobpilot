"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Save, Loader2, Plus, X, Lock, Zap, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkedAccountsTab } from "@/components/settings/LinkedAccountsTab";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";

const TABS = ["Profile", "Preferences", "Auto Apply", "Linked Accounts", "Billing"] as const;
type Tab = typeof TABS[number];

const SKILLS_SUGGESTIONS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Go", "Rust",
  "Next.js", "Vue.js", "Angular", "GraphQL", "REST APIs", "PostgreSQL",
  "MongoDB", "Redis", "AWS", "GCP", "Azure", "Docker", "Kubernetes",
  "Tailwind CSS", "Swift", "Kotlin", "React Native", "Flutter",
];

const ROLE_TYPES = [
  "Software Engineer", "Frontend Engineer", "Backend Engineer",
  "Full Stack Engineer", "Data Engineer", "ML Engineer",
  "DevOps Engineer", "Platform Engineer", "Mobile Engineer",
];

const DOMAINS = [
  "Software Engineering", "Data Science", "Product Management",
  "Design", "DevOps / Infrastructure", "Security", "QA",
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const defaultTab = (searchParams.get("tab") as Tab) ?? "Profile";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab as Tab);
  const isPro = session?.user.plan !== "FREE";

  const [profile, setProfile] = useState({ name: session?.user.name ?? "", email: session?.user.email ?? "" });
  const [prefs, setPrefs] = useState({
    domain: "",
    roleTypes: [] as string[],
    skills: [] as string[],
    locations: [] as string[],
    remoteOnly: false,
    salaryMin: 80000,
    salaryMax: 200000,
    experienceLevel: [] as string[],
    jobTypes: ["Full-time"] as string[],
  });
  const [autoApply, setAutoApply] = useState({
    enabled: false,
    dailyLimit: 10,
    minMatchScore: 70,
    platforms: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user/preferences").then((r) => r.json()).then((data) => {
      if (data?.domain !== undefined) setPrefs(data);
    });
    fetch("/api/auto-apply").then((r) => r.json()).then((data) => {
      if (data) setAutoApply(data);
    });
  }, []);

  async function savePreferences() {
    setSaving(true);
    await fetch("/api/user/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function saveAutoApply() {
    setSaving(true);
    await fetch("/api/auto-apply", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(autoApply),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addSkill(skill: string) {
    if (skill && !prefs.skills.includes(skill)) {
      setPrefs((p) => ({ ...p, skills: [...p.skills, skill] }));
    }
    setSkillInput("");
  }

  function toggleRole(role: string) {
    setPrefs((p) => ({
      ...p,
      roleTypes: p.roleTypes.includes(role) ? p.roleTypes.filter((r) => r !== role) : [...p.roleTypes, role],
    }));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and job preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-xl p-1 border border-border overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition",
              activeTab === tab ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
            {(tab === "Auto Apply" || tab === "Billing") && !isPro && (
              <Lock className="inline w-2.5 h-2.5 ml-1 mb-0.5" />
            )}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === "Profile" && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Profile Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full name</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                <input
                  value={profile.email}
                  disabled
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/80 transition">
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>

          <ChangePasswordCard />
        </div>
      )}

      {/* Preferences tab */}
      {activeTab === "Preferences" && (
        <div className="space-y-4">
          {/* Domain */}
          <div className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Domain</h2>
            <div className="grid grid-cols-3 gap-2">
              {DOMAINS.map((d) => (
                <button
                  key={d}
                  onClick={() => setPrefs((p) => ({ ...p, domain: d }))}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium text-left transition border",
                    prefs.domain === d
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Role types */}
          <div className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Target Roles</h2>
            <div className="flex flex-wrap gap-2">
              {ROLE_TYPES.map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition border",
                    prefs.roleTypes.includes(role)
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Skills</h2>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {prefs.skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20"
                >
                  {skill}
                  <button onClick={() => setPrefs((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill(skillInput)}
                placeholder="Add a skill..."
                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={() => addSkill(skillInput)}
                className="px-3 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SKILLS_SUGGESTIONS.filter((s) => !prefs.skills.includes(s)).slice(0, 12).map((s) => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border hover:text-foreground hover:border-primary/30 transition"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Preferred Locations</h2>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {prefs.locations.map((loc) => (
                <span
                  key={loc}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border"
                >
                  {loc}
                  <button onClick={() => setPrefs((p) => ({ ...p, locations: p.locations.filter((l) => l !== loc) }))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && locationInput.trim()) {
                    setPrefs((p) => ({ ...p, locations: [...p.locations, locationInput.trim()] }));
                    setLocationInput("");
                  }
                }}
                placeholder="Add location (e.g. New York, NY)"
                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={() => {
                  if (locationInput.trim()) {
                    setPrefs((p) => ({ ...p, locations: [...p.locations, locationInput.trim()] }));
                    setLocationInput("");
                  }
                }}
                className="px-3 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg text-sm font-medium hover:from-purple-500 hover:to-violet-500 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Preferences"}
          </button>
        </div>
      )}

      {/* Auto Apply tab */}
      {activeTab === "Auto Apply" && (
        <div className="space-y-4">
          {!isPro ? (
            <div className="glass rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Auto Apply — Pro Feature</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Let AI automatically apply to matching jobs on your behalf. Connects to LinkedIn, Indeed, and
                Glassdoor to submit applications while you sleep.
              </p>
              <a
                href="/settings?tab=billing"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg font-medium hover:from-purple-500 hover:to-violet-500 transition"
              >
                <Zap className="w-4 h-4" /> Upgrade to Pro
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Auto Apply</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Automatically apply to matching jobs</p>
                  </div>
                  <button
                    onClick={() => setAutoApply((a) => ({ ...a, enabled: !a.enabled }))}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors",
                      autoApply.enabled ? "bg-primary" : "bg-secondary border border-border"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                      autoApply.enabled ? "translate-x-5" : "translate-x-0.5"
                    )} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Daily application limit
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={autoApply.dailyLimit}
                      onChange={(e) => setAutoApply((a) => ({ ...a, dailyLimit: Number(e.target.value) }))}
                      className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Minimum match score: {autoApply.minMatchScore}%
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={99}
                      value={autoApply.minMatchScore}
                      onChange={(e) => setAutoApply((a) => ({ ...a, minMatchScore: Number(e.target.value) }))}
                      className="w-full mt-2 accent-purple-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Platforms to use</label>
                  <div className="flex gap-2">
                    {["LINKEDIN", "INDEED", "GLASSDOOR"].map((platform) => (
                      <button
                        key={platform}
                        onClick={() =>
                          setAutoApply((a) => ({
                            ...a,
                            platforms: a.platforms.includes(platform)
                              ? a.platforms.filter((p) => p !== platform)
                              : [...a.platforms, platform],
                          }))
                        }
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition border",
                          autoApply.platforms.includes(platform)
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
                        )}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={saveAutoApply}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg text-sm font-medium hover:from-purple-500 hover:to-violet-500 transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? "Saved!" : "Save Auto Apply Settings"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Linked Accounts tab */}
      {activeTab === "Linked Accounts" && <LinkedAccountsTab />}

      {/* Billing tab */}
      {activeTab === "Billing" && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{session?.user.plan ?? "FREE"}</p>
              </div>
              {isPro && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20">
                  <CheckCircle className="w-3.5 h-3.5" /> Active
                </span>
              )}
            </div>

            {!isPro && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Pro", price: "$19/mo", features: ["Auto Apply (up to 50/day)", "AI Resume Tailoring", "Advanced Analytics", "Priority Support"] },
                    { name: "Enterprise", price: "$49/mo", features: ["Unlimited Auto Apply", "Custom AI Models", "Team Dashboard", "Dedicated Support"] },
                  ].map((plan) => (
                    <div key={plan.name} className="border border-border rounded-xl p-4 hover:border-primary/40 transition">
                      <p className="text-sm font-bold text-foreground">{plan.name}</p>
                      <p className="text-xl font-bold text-primary mt-0.5">{plan.price}</p>
                      <ul className="mt-3 space-y-1.5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                      <button className="w-full mt-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-semibold rounded-lg hover:from-purple-500 hover:to-violet-500 transition">
                        Upgrade to {plan.name}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
