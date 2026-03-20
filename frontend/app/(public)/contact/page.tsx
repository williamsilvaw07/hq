import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact – NorthTrack" };

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
      <div className="max-w-2xl mb-16">
        <p className="text-xs sm:text-[13px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-4">Contact</p>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-6">
          Get in touch.
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground/60 leading-relaxed">
          Have a question, found a bug, or want to suggest a feature? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        <div className="bg-card border border-white/[0.06] rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center text-blue-400 text-lg">
            ✉️
          </div>
          <h3 className="text-sm font-bold">Email</h3>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            For general questions, feedback, or support.
          </p>
          <a
            href="mailto:contact@williamhq.com"
            className="inline-block text-sm font-bold text-foreground underline underline-offset-2"
          >
            contact@williamhq.com
          </a>
        </div>

        <div className="bg-card border border-white/[0.06] rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 text-lg">
            🔒
          </div>
          <h3 className="text-sm font-bold">Privacy</h3>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            For privacy-related requests or data deletion.
          </p>
          <a
            href="mailto:privacy@williamhq.com"
            className="inline-block text-sm font-bold text-foreground underline underline-offset-2"
          >
            privacy@williamhq.com
          </a>
        </div>

        <div className="bg-card border border-white/[0.06] rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center text-red-400 text-lg">
            🐛
          </div>
          <h3 className="text-sm font-bold">Bug Reports</h3>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            Found something broken? Let us know what happened and we&apos;ll fix it.
          </p>
          <a
            href="mailto:bugs@williamhq.com"
            className="inline-block text-sm font-bold text-foreground underline underline-offset-2"
          >
            bugs@williamhq.com
          </a>
        </div>

        <div className="bg-card border border-white/[0.06] rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 text-lg">
            💡
          </div>
          <h3 className="text-sm font-bold">Feature Requests</h3>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            Have an idea for something we should build? We&apos;re all ears.
          </p>
          <a
            href="mailto:ideas@williamhq.com"
            className="inline-block text-sm font-bold text-foreground underline underline-offset-2"
          >
            ideas@williamhq.com
          </a>
        </div>
      </div>

      <div className="mt-16 max-w-2xl">
        <div className="bg-card border border-white/[0.06] rounded-2xl p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold">Response time</h3>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            We try to respond to all emails within 24–48 hours. For urgent issues, include &quot;URGENT&quot; in your subject line and we&apos;ll prioritize it.
          </p>
        </div>
      </div>
    </div>
  );
}
