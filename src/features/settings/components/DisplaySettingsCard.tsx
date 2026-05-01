import { useEffect, useState } from "react";
import { Eye, Loader2, Moon, Sun, Globe } from "lucide-react";
import {
  useMyPreferences,
  useUpdateAppearancePreferencesMutation,
  useUpdateGeneralPreferencesMutation,
} from "../queries";
import { useSettingsStore, type ThemeMode } from "../store/useSettingsStore";
import type { Locale } from "../../../i18n/types";
import { useTranslation } from "../../../i18n/useTranslation";

// ── Converters (backend ↔ frontend) ─────────────────────────────────────────

const toThemeMode = (backendTheme?: boolean): ThemeMode =>
  backendTheme === false ? "dark" : "light";

const toLocale = (languageEn?: boolean): Locale =>
  languageEn === true ? "en" : "vi";

// ── Component ────────────────────────────────────────────────────────────────

export function DisplaySettingsCard() {
  const { t } = useTranslation();
  const { data: preferences, isLoading, error, refetch } = useMyPreferences();
  const updateAppearanceMutation = useUpdateAppearancePreferencesMutation();
  const updateGeneralMutation = useUpdateGeneralPreferencesMutation();

  const { theme, setTheme, locale, setLocale } = useSettingsStore();
  const [message, setMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // ── Bootstrap from backend ──────────────────────────────────────────────
  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);

  useEffect(() => {
    if (!preferences) return;
    if (preferences.appearanceSettings) {
      setTheme(toThemeMode(preferences.appearanceSettings.theme));
    }
    if (preferences.generalSettings) {
      setLocale(toLocale(preferences.generalSettings.languageEn));
    }
  }, [preferences, setTheme, setLocale]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleThemeChange = async (nextTheme: ThemeMode) => {
    if (nextTheme === theme || updateAppearanceMutation.isPending) return;
    setMessage(null);
    setMutationError(null);

    try {
      await updateAppearanceMutation.mutateAsync({ theme: nextTheme === "light" });
      setTheme(nextTheme);
      setMessage(t("settings.display.savedPrefs"));
    } catch (updateError) {
      setMutationError(
        updateError instanceof Error
          ? updateError.message
          : t("settings.display.saveError"),
      );
    }
  };

  const handleLocaleChange = async (nextLocale: Locale) => {
    if (nextLocale === locale || updateGeneralMutation.isPending) return;
    setMessage(null);
    setMutationError(null);

    try {
      await updateGeneralMutation.mutateAsync({ languageEn: nextLocale === "en" });
      setLocale(nextLocale);
      setMessage(t("settings.display.languageSavedPrefs"));
    } catch (updateError) {
      setMutationError(
        updateError instanceof Error
          ? updateError.message
          : t("settings.display.languageSaveError"),
      );
    }
  };

  const isBusy =
    updateAppearanceMutation.isPending || updateGeneralMutation.isPending;

  return (
    <section className="bg-[var(--app-card)] rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center">
          <Eye className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
          <h2 className="text-lg font-bold text-slate-800">
            {t("settings.display.title")}
          </h2>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#245A34]" />}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">
            {t("settings.display.loadError")}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-sm font-bold text-red-700 underline"
          >
            {t("settings.display.retry")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* ── Theme row ────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100/60 bg-slate-50/30 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <div className="w-5 h-5 rounded-full border-2 border-amber-500 bg-gradient-to-r from-transparent from-50% to-amber-500 to-50%" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{t("settings.display.theme")}</h3>
                <p className="text-[13px] font-semibold text-slate-500 mt-0.5">
                  {t("settings.display.themeDescription")}
                </p>
              </div>
            </div>

            <div className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-200/60 shrink-0">
              <ToggleButton
                label={t("settings.display.themeLight")}
                icon={<Sun className="w-4 h-4 mr-2" strokeWidth={2.5} />}
                active={theme === "light"}
                disabled={isBusy}
                onClick={() => void handleThemeChange("light")}
              />
              <ToggleButton
                label={t("settings.display.themeDark")}
                icon={<Moon className="w-4 h-4 mr-2" strokeWidth={2.5} />}
                active={theme === "dark"}
                disabled={isBusy}
                onClick={() => void handleThemeChange("dark")}
              />
            </div>
          </div>

          {/* ── Language row ─────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100/60 bg-slate-50/30 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-blue-600" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{t("settings.display.language")}</h3>
                <p className="text-[13px] font-semibold text-slate-500 mt-0.5">
                  {t("settings.display.languageDescription")}
                </p>
              </div>
            </div>

            <div className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-200/60 shrink-0">
              <ToggleButton
                label={t("settings.display.languageVi")}
                icon={<span className="mr-2 text-sm">🇻🇳</span>}
                active={locale === "vi"}
                disabled={isBusy}
                onClick={() => void handleLocaleChange("vi")}
              />
              <ToggleButton
                label={t("settings.display.languageEn")}
                icon={<span className="mr-2 text-sm">🇬🇧</span>}
                active={locale === "en"}
                disabled={isBusy}
                onClick={() => void handleLocaleChange("en")}
              />
            </div>
          </div>
        </div>
      )}

      <div aria-live="polite" className="mt-4 min-h-5">
        {isBusy && (
          <p className="text-sm font-semibold text-slate-500">
            {t("settings.display.savingPrefs")}
          </p>
        )}
        {message && (
          <p className="text-sm font-bold text-emerald-700" role="status">
            {message}
          </p>
        )}
        {mutationError && (
          <p className="text-sm font-bold text-red-600" role="alert">
            {mutationError}
          </p>
        )}
      </div>
    </section>
  );
}

// ── ToggleButton ─────────────────────────────────────────────────────────────

function ToggleButton({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center px-5 py-2.5 rounded-full text-sm font-bold transition-all disabled:opacity-60 ${
        active
          ? "bg-[#245A34] text-white shadow-sm"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
