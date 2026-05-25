import { createContext } from "react";
import type { Locale, TranslationDict, TranslationPath, PathValue } from "./types";
import { vi } from "./locales/vi";

// ── t() function type ─────────────────────────────────────────────────────────

/**
 * Typed translation accessor.
 * Returns the leaf value at the given dot-separated path.
 *
 * @example
 *   t('common.loading')         // → string
 *   t('chat.memberCount')       // → (count: number) => string
 *   t('settings.display.themeLight')  // → string
 */
export type TFunction = <P extends TranslationPath>(
  path: P,
) => PathValue<TranslationDict, P>;

// ── Context shape ─────────────────────────────────────────────────────────────

export interface I18nContextValue {
  /** Current active locale */
  locale: Locale;
  /** Typed translation accessor */
  t: TFunction;
  /** Change locale (triggers re-render of all t() consumers) */
  setLocale: (locale: Locale) => void;
}

// ── Default context (fallback to Vietnamese + no-op setter) ───────────────────

function makeFallbackT(dict: TranslationDict): TFunction {
  return <P extends TranslationPath>(path: P) => {
    const parts = (path as string).split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: any = dict;
    for (const part of parts) {
      if (node == null || typeof node !== "object") return path as PathValue<TranslationDict, P>;
      node = node[part];
    }
    return (node ?? path) as PathValue<TranslationDict, P>;
  };
}

export const I18nContext = createContext<I18nContextValue>({
  locale: "vi",
  t: makeFallbackT(vi),
  setLocale: () => {},
});
