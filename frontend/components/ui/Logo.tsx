export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };
  const iconSizes = { sm: "w-6 h-6", md: "w-8 h-8", lg: "w-11 h-11" };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${iconSizes[size]} rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-[60%] h-[60%]">
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#0b0b0b" />
          <path d="M2 17l10 5 10-5" stroke="#0b0b0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12l10 5 10-5" stroke="#0b0b0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className={`${sizes[size]} font-black tracking-tight text-foreground`}>
        North<span className="text-white/40">Track</span>
      </span>
    </div>
  );
}

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-[60%] h-[60%]">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#0b0b0b" />
        <path d="M2 17l10 5 10-5" stroke="#0b0b0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12l10 5 10-5" stroke="#0b0b0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
