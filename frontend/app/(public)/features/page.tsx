import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Features – NorthTrack" };

const FEATURES = [
  {
    icon: "📊",
    color: "emerald",
    title: "Budgets & Categories",
    description: "Create monthly budgets for each spending category. Track how much you've spent vs. your limit in real time. Get visual progress bars and percentage breakdowns.",
    details: [
      "Set weekly, monthly, or quarterly budgets",
      "Auto-resets each period",
      "Visual progress tracking with color-coded alerts",
      "Link budgets to credit cards",
    ],
  },
  {
    icon: "🤖",
    color: "blue",
    title: "Telegram Bot",
    description: "Log expenses without opening the app. Send a text message, voice note, or photo of a receipt to the NorthTrack bot — AI handles categorization automatically.",
    details: [
      "Text: \"20 uber\" or \"income 500 salary\"",
      "Voice: describe your purchase in English or Portuguese",
      "Photo: snap a receipt and the AI reads it",
      "Confirm before saving — nothing goes through without your OK",
      "Switch workspaces with /workspace command",
      "Change category before confirming",
    ],
  },
  {
    icon: "👥",
    color: "purple",
    title: "Team Workspaces",
    description: "Share a financial workspace with your family, partner, roommates, or team. Everyone sees the same budgets, transactions, and categories.",
    details: [
      "Invite members by email",
      "Role-based permissions (Owner, Admin, Member, Viewer)",
      "Each workspace has its own budgets and categories",
      "Switch between workspaces instantly",
    ],
  },
  {
    icon: "💳",
    color: "orange",
    title: "Credit Cards",
    description: "Track credit card limits and current balances. Link cards to budgets so spending is automatically tracked against the right category.",
    details: [
      "Set credit limits and billing cycles",
      "Track current balance vs. available credit",
      "Link to budgets for combined tracking",
      "Due day reminders",
    ],
  },
  {
    icon: "📅",
    color: "red",
    title: "Fixed Bills",
    description: "Keep track of recurring expenses like rent, subscriptions, and utilities. See your total monthly commitments at a glance.",
    details: [
      "Set amount, frequency, and due date",
      "Weekly or monthly recurrence",
      "Total fixed costs displayed on dashboard",
      "Never forget a payment",
    ],
  },
  {
    icon: "📱",
    color: "cyan",
    title: "Mobile-First Design",
    description: "Built for your phone first. Fast, clean, and designed for one-handed use. Works great on desktop too.",
    details: [
      "Bottom navigation for easy thumb reach",
      "Quick-add transaction button always visible",
      "Dark mode by default",
      "Responsive — works on any screen size",
    ],
  },
  {
    icon: "🔒",
    color: "zinc",
    title: "Privacy & Security",
    description: "Your financial data stays yours. Passwords are hashed, sessions are secured with JWT, and we never sell or share your data.",
    details: [
      "Hashed passwords (bcrypt)",
      "JWT-based authentication",
      "Workspace-level data isolation",
      "No third-party analytics or tracking",
    ],
  },
  {
    icon: "🌐",
    color: "yellow",
    title: "Multi-Currency Support",
    description: "Set the currency for each workspace. Whether you track in BRL, USD, EUR, or GBP — NorthTrack handles it.",
    details: [
      "Per-workspace currency setting",
      "Consistent formatting across the app",
      "Exchange rate field on transactions",
    ],
  },
];

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  blue: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  purple: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  orange: "bg-orange-400/10 text-orange-400 border-orange-400/20",
  red: "bg-red-400/10 text-red-400 border-red-400/20",
  cyan: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  zinc: "bg-zinc-400/10 text-zinc-400 border-zinc-400/20",
  yellow: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
};

export default function FeaturesPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
      <div className="max-w-2xl mb-16">
        <p className="text-xs sm:text-[13px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-4">Features</p>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-4">
          Everything you need to<br />
          <span className="text-white/30">manage your money.</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground/60 leading-relaxed">
          From quick expense logging via Telegram to detailed budget tracking with your team — NorthTrack gives you full control without the complexity.
        </p>
      </div>

      <div className="space-y-6">
        {FEATURES.map((f) => {
          const colors = COLOR_MAP[f.color] ?? COLOR_MAP.zinc;
          return (
            <div
              key={f.title}
              className="bg-card border border-white/[0.06] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-10"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${colors.split(" ").slice(0, 2).join(" ")}`}>
                    {f.icon}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold">{f.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground/60 leading-relaxed">{f.description}</p>
              </div>
              <ul className="sm:w-72 shrink-0 space-y-2">
                {f.details.map((d) => (
                  <li key={d} className="flex items-start gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-medium shrink-0 mt-0.5 ${colors.split(" ").slice(0, 2).join(" ")}`}>✓</span>
                    <span className="text-xs text-muted-foreground/70 leading-relaxed">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-16 sm:mt-24 text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Ready to get started?</h2>
        <p className="text-sm text-muted-foreground/50">Free to use. No credit card required.</p>
        <Link
          href="/register"
          className="inline-block text-sm font-bold bg-white text-black px-10 py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all shadow-lg shadow-white/10"
        >
          Create your account
        </Link>
      </div>
    </div>
  );
}
