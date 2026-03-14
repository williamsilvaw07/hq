"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: "default" | "lg";
};

export function Modal({
  isOpen,
  title,
  subtitle,
  showCloseButton = true,
  children,
  footer,
  onClose,
  size = "default",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = size === "lg" ? "max-w-lg" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className={`
          w-full ${maxWidthClass}
          bg-[#1e1e1e]
          border border-white/[0.08]
          shadow-2xl shadow-black/60
          flex flex-col
          overflow-hidden
          animate-in slide-in-from-bottom duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          /* Mobile: bottom sheet with rounded top corners, max 88vh, margin at top */
          rounded-t-3xl max-h-[88vh]
          mt-auto
          /* Desktop: floating card, fully rounded */
          sm:rounded-2xl sm:max-h-[85vh] sm:mt-0
        `}
      >
        {/* Drag handle — mobile only */}
        <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mt-3 mb-0 shrink-0 sm:hidden" />

        {/* Header */}
        <header className="px-6 pt-5 pb-3 relative shrink-0">
          {subtitle && (
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-1 text-center">
              {subtitle}
            </p>
          )}
          {title && (
            <h2 className="text-base font-bold text-foreground tracking-tight text-center">
              {title}
            </h2>
          )}
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all active:scale-90"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </header>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mx-6 shrink-0" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0">
            <div className="h-px bg-white/[0.06] mx-6" />
            <div className="px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="space-y-4 animate-pulse px-1">
      <div className="h-4 w-28 rounded-full bg-white/5" />
      <div className="space-y-2.5">
        <div className="h-12 rounded-xl bg-white/5" />
        <div className="h-12 rounded-xl bg-white/5" />
        <div className="h-12 rounded-xl bg-white/5" />
      </div>
      <div className="flex gap-3 pt-2">
        <div className="flex-1 h-12 rounded-xl bg-white/5" />
        <div className="flex-1 h-12 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}
