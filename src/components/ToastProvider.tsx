import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cx } from "../lib/utils";

type Toast = {
  id: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  ttl?: number;
};

type ToastCtx = {
  toast: (t: Omit<Toast, "id">) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used within ToastProvider");
  return v;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    const t = timers.current[id];
    if (t) window.clearTimeout(t);
    delete timers.current[id];
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      const ttl = t.ttl ?? 4200;

      const next: Toast = { ...t, id, ttl };
      setItems((prev) => [next, ...prev].slice(0, 3));

      timers.current[id] = window.setTimeout(() => remove(id), ttl);
    },
    [remove]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={value}>
      {children}

      <div className="fixed right-4 top-4 z-[999] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              "rounded-[18px] border border-white/35 bg-white/75 backdrop-blur-xl shadow-[0_18px_60px_-35px_rgba(0,0,0,0.45)]",
              "px-3.5 py-3 text-sm",
              "dark:border-zinc-800/60 dark:bg-zinc-950/70"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">{t.title}</div>
                {t.description ? (
                  <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                    {t.description}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {t.actionLabel && t.onAction ? (
                  <button
                    onClick={() => {
                      t.onAction?.();
                      remove(t.id);
                    }}
                    className="rounded-xl border border-indigo-200/70 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700
                               hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/35 dark:text-indigo-200 dark:hover:bg-indigo-950/50"
                  >
                    {t.actionLabel}
                  </button>
                ) : null}

                <button
                  onClick={() => remove(t.id)}
                  className="rounded-xl border border-zinc-200/70 bg-white/70 px-2 py-1 text-xs text-zinc-700 hover:bg-white
                             dark:border-zinc-800/70 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                  aria-label="Close toast"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
