import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About – NorthTrack" };

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
      <div className="max-w-2xl mb-16">
        <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mb-4">About</p>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-6">
          Built for people who<br />
          <span className="text-white/30">want clarity, not complexity.</span>
        </h1>
      </div>

      <div className="space-y-12 max-w-2xl">
        <section className="space-y-4">
          <h2 className="text-base font-bold">Why NorthTrack?</h2>
          <p className="text-sm text-muted-foreground/70 leading-relaxed">
            Most finance apps are either too simple — just a list of numbers — or too complex, with features you&apos;ll never use. NorthTrack sits in the middle. It gives you real budget tracking, team workspaces, and AI-powered expense logging without the overhead.
          </p>
          <p className="text-sm text-muted-foreground/70 leading-relaxed">
            The idea started from a simple frustration: tracking expenses should be as easy as sending a text message. So we built a Telegram bot that does exactly that — send &quot;20 uber&quot; and it&apos;s logged, categorized, and tracked against your budget. No app switching, no forms, no friction.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-bold">What makes it different</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-400/10 flex items-center justify-center text-[10px] text-emerald-400 shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-bold mb-1">Telegram-first input</p>
                <p className="text-xs text-muted-foreground/60 leading-relaxed">Text, voice, or photo — the bot understands all three. AI picks the right category. You just confirm.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-400/10 flex items-center justify-center text-[10px] text-blue-400 shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-sm font-bold mb-1">Real team support</p>
                <p className="text-xs text-muted-foreground/60 leading-relaxed">Workspaces with roles (Owner, Admin, Member, Viewer). Share budgets with your partner, family, or roommates.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-400/10 flex items-center justify-center text-[10px] text-purple-400 shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-bold mb-1">Dashboard that matters</p>
                <p className="text-xs text-muted-foreground/60 leading-relaxed">See spent vs. budget, fixed bills total, variable spending, and recent transactions — all on one screen.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-orange-400/10 flex items-center justify-center text-[10px] text-orange-400 shrink-0 mt-0.5">4</span>
              <div>
                <p className="text-sm font-bold mb-1">Privacy by default</p>
                <p className="text-xs text-muted-foreground/60 leading-relaxed">No ads, no tracking, no data selling. Your financial data is yours. Period.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-bold">Tech stack</h2>
          <p className="text-sm text-muted-foreground/70 leading-relaxed">
            NorthTrack is built with Next.js, TypeScript, Tailwind CSS, and MySQL. The Telegram bot uses the Telegram Bot API with Groq for AI transcription, vision, and categorization. Hosted on a lightweight Node.js setup.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-bold">Open to feedback</h2>
          <p className="text-sm text-muted-foreground/70 leading-relaxed">
            NorthTrack is in active development. If you have ideas, run into bugs, or just want to say hi — reach out on the{" "}
            <Link href="/contact" className="text-foreground underline underline-offset-2">contact page</Link>.
          </p>
        </section>
      </div>

      <div className="mt-16 sm:mt-24 bg-card border border-white/[0.06] rounded-2xl p-10 sm:p-16 text-center space-y-6 max-w-2xl">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Try it yourself</h2>
        <p className="text-sm text-muted-foreground/60 max-w-md mx-auto leading-relaxed">
          Create a free account and see if it fits. No credit card, no commitment.
        </p>
        <Link
          href="/register"
          className="inline-block text-sm font-bold bg-white text-black px-10 py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all shadow-lg shadow-white/10"
        >
          Get started for free
        </Link>
      </div>
    </div>
  );
}
