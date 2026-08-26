"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { subscribeApiEvents, type ApiEvent } from "@/lib/api";
import { Close, CheckCircle, ExclamationCircle } from "flowbite-react-icons/outline";
import { cn } from "@/components/ui";

type ToastTone = "success" | "error";
type Toast = { id: number; tone: ToastTone; message: string };
type ToastApi = { success: (message: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [nextId, setNextId] = useState(1);
  const isBusy = useIsFetching() + useIsMutating() > 0;

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = nextId;
    setNextId((value) => value + 1);
    // One toast at a time — a new one replaces whatever's showing, rather than stacking, so
    // rapid actions (e.g. repeated add-to-cart clicks) never pile several up at once.
    setToasts([{ id, tone, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500);
  }, [nextId]);

  useEffect(() => subscribeApiEvents((event: ApiEvent) => push(event.tone, event.message)), [push]);
  const value = useMemo<ToastApi>(() => ({ success: (message) => push("success", message), error: (message) => push("error", message) }), [push]);

  return (
    <ToastContext.Provider value={value}>
      <div className={cn("fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-brand transition-transform duration-300", isBusy ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0")} aria-hidden="true" />
      {children}
      <div className="pointer-events-none fixed right-4 top-2 z-[100] flex w-[min(92vw,200px)] flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={cn("pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface px-4 py-3 text-sm shadow-xl", toast.tone === "success" ? "border-emerald-200" : "border-red-200")}>
            {toast.tone === "success" ? <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <ExclamationCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}
            <p className="min-w-0 flex-1 text-ink">{toast.message}</p>
            <button type="button" className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-soft hover:bg-canvas" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} aria-label="Dismiss notification"><Close className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
}
