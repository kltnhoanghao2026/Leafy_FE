import { useMemo, type ReactNode } from "react";
import { I18nContext, type TFunction } from "./context";
import { useSettingsStore } from "../features/settings/store/useSettingsStore";
import type { Locale, TranslationDict, TranslationPath, PathValue } from "./types";
import { vi } from "./locales/vi";
import { en } from "./locales/en";

// ── Locale dictionary registry ────────────────────────────────────────────────

const LOCALES: Record<Locale, TranslationDict> = { vi, en };

// ── t() factory ──────────────────────────────────────────────────────────────

function makeT(dict: TranslationDict): TFunction {
  return <P extends TranslationPath>(path: P): PathValue<TranslationDict, P> => {
    const parts = (path as string).split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: any = dict;
    for (const part of parts) {
      if (node == null || typeof node !== "object") {
        // Key missing in this locale — fall back to the vi dict
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fallback: any = vi;
        for (const p of parts) fallback = fallback?.[p];
        return (fallback ?? path) as PathValue<TranslationDict, P>;
      }
      node = node[part];
    }
    return (node ?? path) as PathValue<TranslationDict, P>;
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface I18nProviderProps {
  children: ReactNode;
}

/**
 * I18nProvider
 *
 * Reads `locale` from the global `useSettingsStore` (Zustand) and exposes a
 * typed `t()` accessor to the entire component tree.
 *
 * Place this just inside <QueryClientProvider> in App.tsx so all components —
 * including those that call TanStack Query hooks — can call useTranslation().
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  const t = useMemo(() => makeT(LOCALES[locale] ?? vi), [locale]);

  const value = useMemo(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}
