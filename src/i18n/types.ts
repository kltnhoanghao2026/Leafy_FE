import { vi } from "./locales/vi";

/**
 * Supported locale codes.
 * Add new locales here and in `locales/` when expanding.
 */
export type Locale = "vi" | "en";

/**
 * The canonical shape of a translation dictionary.
 * Inferred from the Vietnamese source-of-truth so all locales stay in sync.
 *
 * Function-valued leaves (e.g. memberCount) are kept as-is; callers
 * invoke them directly via t('chat.memberCount')(count).
 */
export type TranslationDict = typeof vi;

/**
 * Dot-separated key path into TranslationDict, resolving to a leaf value.
 * Used to type the t() accessor.
 *
 * Example valid paths:
 *   'common.loading'
 *   'chat.memberCount'
 *   'settings.display.themeLight'
 */
export type TranslationPath = DotPath<TranslationDict>;

// ── Utility: build dot-separated path union ───────────────────────────────────
type DotPath<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? DotPath<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[keyof T & string];

// ── Utility: resolve a dot path to its leaf type ──────────────────────────────
export type PathValue<
  T,
  P extends string,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;
