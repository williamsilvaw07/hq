"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: "default" | "lg";
};

export function Modal({ isOpen, title, children, footer, onClose, size = "default" }: ModalProps) {
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
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className={`w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0 mx-4 sm:mx-0 bg-card rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col transform origin-bottom sm:origin-center animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 pb-2 shrink-0">
          {title ? (
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 rounded-xl text-muted-foreground hover:text-foreground active:bg-secondary touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 min-w-0 p-4 sm:p-6 pt-2 space-y-4">
          {children}
        </div>
        {footer ? (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 border-t border-border/40 bg-card/80 flex flex-col gap-3">
            {footer}
          </div>
        ) : null}
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

