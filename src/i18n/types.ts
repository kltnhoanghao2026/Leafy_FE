import type { vi } from "./locales/vi";

/**
 * Supported locale codes.
 * Add new locales here and in `locales/` when expanding.
 */
export type Locale = "vi" | "en";

export type TranslationFunction = (...args: never[]) => string;

export type TranslationValue =
  | string
  | TranslationFunction
  | TranslationTree;

export type TranslationTree = {
  readonly [key: string]: TranslationValue;
};

/**
 * Widen locale string literals while preserving the object shape and function
 * leaf signatures inferred from the Vietnamese source-of-truth.
 */
export type WidenStrings<T> = {
  readonly [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends TranslationFunction
      ? T[K]
      : T[K] extends TranslationTree
        ? WidenStrings<T[K]>
        : T[K];
};

/**
 * The canonical shape of a translation dictionary.
 * Inferred from the Vietnamese source-of-truth so all locales stay in sync,
 * without forcing translated string values to match Vietnamese literals.
 *
 * Function-valued leaves (e.g. memberCount) are kept as-is; callers
 * invoke them directly via t('chat.memberCount')(count).
 */
export type TranslationDict = WidenStrings<typeof vi>;

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
