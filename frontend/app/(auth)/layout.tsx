export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[360px] rounded-2xl sm:rounded-[2rem] border border-white/5 bg-card/50 backdrop-blur-sm p-5 sm:p-8 shadow-2xl shadow-black/30">
        {children}
      </div>
    </div>
  );
}
