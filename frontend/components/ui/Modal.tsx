"use client";

import { useEffect, useRef } from "react";

type ModalProps = {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
};

export function Modal({ isOpen, title, subtitle, children, footer, onClose }: ModalProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#1c1c1e] rounded-t-[2rem] overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-0 shrink-0">
          <div className="w-10 h-[5px] rounded-full bg-white/20" />
        </div>

        {/* Header */}
        {(subtitle || title) && (
          <div className="text-center px-6 pt-5 pb-2 shrink-0">
            {subtitle && (
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
            )}
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-5 pt-4 pb-2">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="space-y-4 animate-pulse px-1">
      <div className="h-14 rounded-2xl bg-white/5" />
      <div className="h-32 rounded-2xl bg-white/5" />
      <div className="h-24 rounded-2xl bg-white/5" />
    </div>
  );
}
