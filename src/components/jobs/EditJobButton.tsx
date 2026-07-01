"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Loader2 } from "lucide-react";

interface Props {
  jobId: string;
  job: {
    title: string;
    company: string;
    location: string;
    locationType: string;
    salary: string | null;
    description: string;
    skills: string[];
  };
}

export function EditJobButton({ jobId, job }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: job.title,
    company: job.company,
    location: job.location,
    locationType: job.locationType,
    salary: job.salary ?? "",
    description: job.description,
    skills: job.skills.join(", "),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Update failed");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition"
      >
        <Pencil className="w-3.5 h-3.5" /> Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-card border border-border rounded-xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Edit Job Details</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={save} className="space-y-3">
              <Field label="Title">
                <input value={form.title} onChange={(e) => set("title", e.target.value)} required className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company">
                  <input value={form.company} onChange={(e) => set("company", e.target.value)} required className={inputCls} />
                </Field>
                <Field label="Location">
                  <input value={form.location} onChange={(e) => set("location", e.target.value)} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Work type">
                  <select value={form.locationType} onChange={(e) => set("locationType", e.target.value)} className={inputCls}>
                    <option value="onsite">Onsite</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </select>
                </Field>
                <Field label="Salary">
                  <input value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="$120K - $160K" className={inputCls} />
                </Field>
              </div>
              <Field label="Skills (comma-separated)">
                <input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="React, TypeScript, AWS" className={inputCls} />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`${inputCls} h-48 resize-y`} />
              </Field>

              {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/80 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save changes
                </button>
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls =
  "w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
