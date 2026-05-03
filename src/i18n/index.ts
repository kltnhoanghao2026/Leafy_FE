/**
 * i18n public API
 *
 * Import from here in all feature components:
 *   import { useTranslation } from '../../i18n';
 *   import { I18nProvider }   from '../../i18n';
 *   import type { Locale }    from '../../i18n';
 */

export { useTranslation } from "./useTranslation";
export { I18nProvider } from "./I18nProvider";
export type { Locale, TranslationPath } from "./types";
