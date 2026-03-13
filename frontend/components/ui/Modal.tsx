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

export function Modal({ isOpen, title, subtitle, showCloseButton = true, children, footer, onClose, size = "default" }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = size === "lg" ? "max-w-l" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidthClass} max-h-[96vh] sm:max-h-[90vh] bg-background border-t sm:border border-border/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col transform origin-bottom animate-in slide-in-from-bottom duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden`}
      >
        <div className="w-12 h-1.5 rounded-full bg-border/20 mx-auto mt-3 mb-1 shrink-0" />
        
        <header className="px-6 pt-4 pb-2 text-center relative shrink-0">
          {subtitle && (
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">
              {subtitle}
            </p>
          )}
          {title && (
            <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
          )}
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar min-h-0">
          <div className="max-w-full mx-auto pb-[env(safe-area-inset-bottom)]">
            {children}
          </div>
        </div>

        {footer && (
          <footer className="p-6 pt-2 border-t border-border/5 px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] bg-background/50 backdrop-blur-xl">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-32 rounded-full bg-secondary" />
      <div className="space-y-3">
        <div className="h-10 rounded-2xl bg-secondary" />
        <div className="h-10 rounded-2xl bg-secondary" />
        <div className="h-10 rounded-2xl bg-secondary" />
      </div>
      <div className="flex gap-3 pt-4">
        <div className="flex-1 h-11 rounded-xl bg-secondary" />
        <div className="flex-1 h-11 rounded-xl bg-secondary" />
      </div>
    </div>
  );
}

