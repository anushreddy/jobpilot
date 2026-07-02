import Link from "next/link";
import type { Metadata } from "next";
import { Zap, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — Intervo",
  description:
    "How Intervo collects, uses, processes, and protects your personal data, including resumes and job-search activity.",
};

const LAST_UPDATED = "July 2, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[650px] h-[650px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">Intervo</span>
        </Link>
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

      {/* Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-10 pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-3">Last updated: {LAST_UPDATED}</p>

        <p className="text-muted-foreground leading-relaxed mt-6">
          Intervo (&ldquo;Intervo,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
          helps you search for jobs, tailor your resume, and manage applications. This policy explains
          what personal data we collect, how and why we process it, who we share it with, and the
          choices and rights you have. It applies to intervo.io and the Intervo web application (the
          &ldquo;Service&rdquo;).
        </p>

        <Section title="1. Information we collect">
          <p>We collect the following categories of information:</p>
          <SubList
            items={[
              ["Account &amp; identity", "Your name, email address, and a securely hashed password. If you sign in with Google or GitHub, we receive your name, email, and profile image from that provider."],
              ["Resume &amp; documents", "Resume files you upload, the text and structured data we extract from them, ATS scores, and any AI-generated tailored resumes or cover letters you create."],
              ["Job preferences &amp; activity", "Your target roles, skills, locations, salary expectations, and job types, plus the jobs you save or apply to, application statuses, and notes."],
              ["Connected accounts", "If you link a job platform (e.g. LinkedIn, Indeed, Glassdoor), we store the access tokens needed to provide that integration until you disconnect it."],
              ["Usage &amp; device data", "Pages viewed, features used, approximate location derived from IP address, browser and device type, and similar analytics collected automatically."],
              ["Communications", "Email verification codes, messages you send us through the contact form, and support correspondence."],
            ]}
          />
        </Section>

        <Section title="2. How we collect it">
          <SubList
            items={[
              ["Directly from you", "When you register, upload a resume, set preferences, apply to jobs, or contact us."],
              ["Automatically", "Through cookies and analytics as you use the Service (see &ldquo;Cookies &amp; tracking&rdquo; below)."],
              ["From third parties", "From identity providers when you use Google or GitHub sign-in, and from job platforms you choose to connect."],
            ]}
          />
        </Section>

        <Section title="3. How we use and process your data">
          <p>We process your personal data to:</p>
          <BulletList
            items={[
              "Provide and operate the Service — authenticate you, store your resumes, match you to jobs, and track your applications.",
              "Generate AI outputs — tailor resumes, write cover letters, and calculate match scores (see section 4).",
              "Communicate with you — send verification codes, service notices, and responses to your requests.",
              "Improve and secure the Service — understand usage, fix problems, prevent fraud and abuse, and keep accounts safe.",
              "Comply with legal obligations and enforce our terms.",
            ]}
          />
          <p className="mt-4">
            Where required by law, our legal bases for processing are your consent, the performance of
            our contract with you, our legitimate interests in operating and improving the Service, and
            compliance with legal obligations.
          </p>
        </Section>

        <Section title="4. AI processing of your resume and job data">
          <p>
            Intervo&rsquo;s tailoring, cover-letter, and match-score features work by sending the
            relevant content — such as your resume text and the job description you provide — to our
            third-party AI provider, <strong>Anthropic</strong> (the maker of Claude), which returns the
            generated result to us. This processing happens only when you actively use an AI feature.
          </p>
          <p className="mt-4">
            We use Anthropic&rsquo;s commercial API, under which, per their terms, your inputs and
            outputs are <strong>not used to train their models</strong>. We do not sell your resume or
            job data, and we do not use it for advertising.
          </p>
        </Section>

        <Section title="5. Who we share data with (sub-processors)">
          <p>
            We do not sell your personal data. We share it only with service providers that help us run
            Intervo, under agreements that limit their use of it to providing services to us:
          </p>
          <SubList
            items={[
              ["Anthropic", "AI generation of tailored resumes, cover letters, and match scores."],
              ["PostHog", "Product analytics to understand and improve how the Service is used."],
              ["Amazon Web Services (S3)", "Secure storage of uploaded and generated resume files."],
              ["Transactional email provider", "Delivery of verification codes and service emails."],
              ["Google &amp; GitHub", "Optional single sign-on, only if you choose to use it."],
              ["Job platforms you connect", "Only to enable the integration you explicitly authorize."],
            ]}
          />
          <p className="mt-4">
            We may also disclose data if required by law, to protect our rights or users&rsquo; safety,
            or in connection with a merger or acquisition (in which case we will notify you).
          </p>
        </Section>

        <Section title="6. Data retention">
          <p>
            We keep your personal data for as long as your account is active or as needed to provide the
            Service. You can delete individual resumes at any time from your account, and you can request
            deletion of your entire account, after which we delete or anonymize your data except where we
            must retain it to meet legal obligations or resolve disputes.
          </p>
        </Section>

        <Section title="7. Data security">
          <p>
            We protect your data with industry-standard safeguards: passwords are hashed (never stored in
            plain text), data is encrypted in transit using TLS, and access to systems is restricted. No
            method of transmission or storage is completely secure, but we work to protect your
            information and continuously improve our safeguards.
          </p>
        </Section>

        <Section title="8. Your rights and choices">
          <p>Depending on where you live, you may have the right to:</p>
          <BulletList
            items={[
              "Access the personal data we hold about you and receive a copy.",
              "Correct inaccurate data or update your preferences and profile.",
              "Delete your resumes, connected accounts, or your entire account.",
              "Object to or restrict certain processing, and withdraw consent where processing is based on it.",
              "Disconnect any linked job platform at any time.",
            ]}
          />
          <p className="mt-4">
            You can exercise most of these directly in your account settings. For anything else, contact
            us using the details below and we will respond within the timeframe required by applicable law.
          </p>
        </Section>

        <Section title="9. Cookies &amp; tracking">
          <p>
            We use essential cookies to keep you signed in and to operate the Service, and analytics
            cookies (via PostHog) to measure usage. You can control cookies through your browser
            settings; disabling essential cookies may prevent parts of the Service from working.
          </p>
        </Section>

        <Section title="10. Children&rsquo;s privacy">
          <p>
            Intervo is not intended for anyone under 16, and we do not knowingly collect data from
            children. If you believe a child has provided us personal data, please contact us and we will
            delete it.
          </p>
        </Section>

        <Section title="11. International data transfers">
          <p>
            Your data may be processed in countries other than your own, including the United States,
            where our providers operate. Where required, we rely on appropriate safeguards such as
            standard contractual clauses to protect your data during these transfers.
          </p>
        </Section>

        <Section title="12. Changes to this policy">
          <p>
            We may update this policy from time to time. When we make material changes, we will update the
            &ldquo;Last updated&rdquo; date above and, where appropriate, notify you through the Service.
          </p>
        </Section>

        <Section title="13. Contact us">
          <p>
            If you have questions about this policy or how we handle your data, reach us through our{" "}
            <Link href="/contact" className="text-primary hover:underline">
              contact page
            </Link>{" "}
            or by email at{" "}
            <a href="mailto:privacy@intervo.io" className="text-primary hover:underline">
              privacy@intervo.io
            </a>
            .
          </p>
        </Section>
      </main>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2
        className="text-xl font-semibold mb-3"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div className="space-y-1 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 marker:text-primary/60">
      {items.map((item, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
      ))}
    </ul>
  );
}

function SubList({ items }: { items: [string, string][] }) {
  return (
    <ul className="space-y-2.5 mt-1">
      {items.map(([label, desc], i) => (
        <li key={i} className="flex flex-col">
          <span
            className="text-foreground font-medium"
            dangerouslySetInnerHTML={{ __html: label }}
          />
          <span dangerouslySetInnerHTML={{ __html: desc }} />
        </li>
      ))}
    </ul>
  );
}
