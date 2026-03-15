import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-5xl mx-auto">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pt-16 sm:pt-28 pb-20 sm:pb-32">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Now in Beta</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            Track your money,<br />
            <span className="text-white/30">not your time.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground/70 leading-relaxed mb-10 max-w-lg">
            NorthTrack helps you manage budgets, track expenses, and stay on top of your finances — from your browser or Telegram.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto text-center text-sm font-bold bg-white text-black px-8 py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all shadow-lg shadow-white/10"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto text-center text-sm font-bold text-muted-foreground border border-white/10 px-8 py-3.5 rounded-xl hover:border-white/20 hover:text-foreground transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pb-20 sm:pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-white/[0.06] rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 text-lg">
              📊
            </div>
            <h3 className="text-sm font-bold">Budgets & Categories</h3>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              Set monthly budgets by category and see exactly where your money goes with real-time tracking.
            </p>
          </div>
          <div className="bg-card border border-white/[0.06] rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center text-blue-400 text-lg">
              🤖
            </div>
            <h3 className="text-sm font-bold">Telegram Integration</h3>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              Send expenses via text, voice, or photo in Telegram. AI categorizes them automatically.
            </p>
          </div>
          <div className="bg-card border border-white/[0.06] rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center text-purple-400 text-lg">
              👥
            </div>
            <h3 className="text-sm font-bold">Team Workspaces</h3>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              Share finances with your team or family. Invite members, assign roles, and track together.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6 sm:px-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <p className="text-[11px] text-muted-foreground/40">&copy; {new Date().getFullYear()} NorthTrack</p>
        </div>
      </footer>
    </div>
  );
}
