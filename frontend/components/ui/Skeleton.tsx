export function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`bg-white/[0.06] rounded-xl animate-pulse ${className}`} />;
}
