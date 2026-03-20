import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6 font-sans">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-[400px] rounded-2xl sm:rounded-[2rem] border border-white/[0.06] bg-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-2xl shadow-black/30">
        {children}
      </div>
      <p className="mt-6 text-xs text-muted-foreground/30">&copy; {new Date().getFullYear()} NorthTrack</p>
    </div>
  );
}
