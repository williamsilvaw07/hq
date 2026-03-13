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

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = size === "lg" ? "max-w-lg" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-[2px] animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className={`w-full ${maxWidthClass} max-h-[92vh] sm:max-h-[90vh] overflow-hidden bg-card rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col transform origin-bottom sm:origin-center animate-scale-in transition-transform duration-300 ease-out`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 rounded-full bg-border/40 mx-auto mt-3 mb-1 shrink-0 cursor-grab active:cursor-grabbing" />
        
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 pb-2 shrink-0 relative">
          {subtitle && (
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5 text-center opacity-70">
              {subtitle}
            </span>
          )}
          {title ? (
            <h2 className="text-xl font-bold text-foreground text-center tracking-tight">{title}</h2>
          ) : (
            <span />
          )}
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-muted-foreground hover:text-foreground active:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 pt-2 pb-safe-offset-4 w-full">
          <div className="w-full max-w-full mx-auto space-y-4">
            {children}
          </div>
        </div>

        {footer ? (
          <div className="px-4 sm:px-6 pb-6 sm:pb-8 pt-4 border-t border-border/10 bg-card/80 backdrop-blur-md flex flex-col gap-3 shrink-0 mb-safe mt-auto">
            {footer}
          </div>
        ) : (
          <div className="h-6 sm:hidden shrink-0" />
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

