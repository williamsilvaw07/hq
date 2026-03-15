import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-5xl mx-auto w-full">
        <Link href="/">
          <Logo size="md" />
        </Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/features" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hidden sm:inline-flex">
            Features
          </Link>
          <Link href="/about" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hidden sm:inline-flex">
            About
          </Link>
          <Link href="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            Sign in
          </Link>
          <Link href="/register" className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

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
