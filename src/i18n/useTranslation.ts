import { useContext } from "react";
import { I18nContext, type TFunction, type I18nContextValue } from "./context";
import type { Locale } from "./types";

/**
 * useTranslation()
 *
 * Returns the typed translation accessor `t`, the current `locale`, and
 * `setLocale` to programmatically change language.
 *
 * Must be called inside a component that is a descendant of <I18nProvider>.
 *
 * @example
 *   const { t, locale, setLocale } = useTranslation();
 *
 *   // Static string
 *   <p>{t('common.loading')}</p>
 *
 *   // Function-valued leaf (e.g. memberCount)
 *   <p>{t('chat.memberCount')(42)}</p>
 *
 *   // Switch language
 *   <button onClick={() => setLocale('en')}>English</button>
 */
export function useTranslation(): {
  t: TFunction;
  locale: Locale;
  setLocale: I18nContextValue["setLocale"];
} {
  return useContext(I18nContext);
}
