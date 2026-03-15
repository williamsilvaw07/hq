import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-5xl mx-auto">
        <Logo size="md" />
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/features" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hidden sm:inline-flex">
            Features
          </Link>
          <Link href="/about" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hidden sm:inline-flex">
            About
          </Link>
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
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pt-20 sm:pt-32 pb-24 sm:pb-40">
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
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pb-24 sm:pb-36">
        <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mb-8">Everything you need</p>
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

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pb-24 sm:pb-36">
        <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mb-8">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-black text-white/60">1</div>
            <h3 className="text-sm font-bold">Create a workspace</h3>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              Set up a workspace for yourself, your household, or your team. Add categories and budgets that match your life.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-black text-white/60">2</div>
            <h3 className="text-sm font-bold">Log transactions</h3>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              Add expenses and income from the app, or just send a message to the Telegram bot. Voice messages and receipt photos work too.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-black text-white/60">3</div>
            <h3 className="text-sm font-bold">Stay in control</h3>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              See your spending vs. budget at a glance. Get a clear picture of fixed bills, variable spending, and how much you have left.
            </p>
          </div>
        </div>
      </section>

      {/* Telegram highlight */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pb-24 sm:pb-36">
        <div className="bg-card border border-white/[0.06] rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row gap-8 sm:gap-12 items-start">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-400/10 border border-blue-400/20">
              <span className="text-sm">💬</span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Telegram Bot</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              Log expenses without<br />opening the app.
            </h2>
            <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-md">
              Just send a message like &quot;20 uber&quot; or &quot;income 500 salary&quot; to the NorthTrack bot.
              Send a voice note describing your purchase, or snap a photo of a receipt — AI handles the rest.
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-400/10 flex items-center justify-center text-[10px] text-emerald-400">✓</span>
                <span className="text-xs text-muted-foreground/80">Text, voice, and photo support</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-400/10 flex items-center justify-center text-[10px] text-emerald-400">✓</span>
                <span className="text-xs text-muted-foreground/80">AI-powered category detection</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-400/10 flex items-center justify-center text-[10px] text-emerald-400">✓</span>
                <span className="text-xs text-muted-foreground/80">Switch workspaces with /workspace</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-400/10 flex items-center justify-center text-[10px] text-emerald-400">✓</span>
                <span className="text-xs text-muted-foreground/80">Confirm before saving — nothing goes through without your OK</span>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-64 shrink-0 bg-background/60 border border-white/[0.06] rounded-xl p-4 space-y-3 text-xs font-mono">
            <div className="flex justify-end">
              <div className="bg-blue-500/20 text-blue-300 rounded-xl rounded-br-sm px-3 py-2 max-w-[80%]">20 uber</div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white/[0.06] text-muted-foreground rounded-xl rounded-bl-sm px-3 py-2 max-w-[90%]">
                🛒 Expense detected!<br />
                <br />
                Workspace: Personal<br />
                Amount: R$ 20.00<br />
                Category: Transport<br />
                <br />
                Reply yes or no
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-blue-500/20 text-blue-300 rounded-xl rounded-br-sm px-3 py-2">yes</div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white/[0.06] text-muted-foreground rounded-xl rounded-bl-sm px-3 py-2">✅ Confirmed!</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / social proof */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pb-24 sm:pb-36">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center space-y-1 py-6">
            <p className="text-2xl sm:text-3xl font-black tracking-tight">100%</p>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">Free to use</p>
          </div>
          <div className="text-center space-y-1 py-6">
            <p className="text-2xl sm:text-3xl font-black tracking-tight">3</p>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">Input methods</p>
          </div>
          <div className="text-center space-y-1 py-6">
            <p className="text-2xl sm:text-3xl font-black tracking-tight">AI</p>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">Categorization</p>
          </div>
          <div className="text-center space-y-1 py-6">
            <p className="text-2xl sm:text-3xl font-black tracking-tight">∞</p>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">Workspaces</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pb-24 sm:pb-36">
        <div className="bg-card border border-white/[0.06] rounded-2xl p-10 sm:p-16 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to take control?
          </h2>
          <p className="text-sm text-muted-foreground/60 max-w-md mx-auto leading-relaxed">
            Create your free account and start tracking in under a minute. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto text-center text-sm font-bold bg-white text-black px-10 py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all shadow-lg shadow-white/10"
            >
              Get started for free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6 sm:px-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <div className="flex items-center gap-6">
            <Link href="/features" className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">Features</Link>
            <Link href="/about" className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">About</Link>
            <Link href="/contact" className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">Contact</Link>
            <Link href="/privacy" className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">Privacy</Link>
          </div>
          <p className="text-[11px] text-muted-foreground/40">&copy; {new Date().getFullYear()} NorthTrack</p>
        </div>
      </footer>
    </div>
  );
}
