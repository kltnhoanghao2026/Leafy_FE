import { useEffect, useState } from "react";
import { Eye, Loader2, Moon, Sun } from "lucide-react";
import {
  useMyPreferences,
  useUpdateAppearancePreferencesMutation,
} from "../queries";
import { useSettingsStore, type ThemeMode } from "../store/useSettingsStore";

const toThemeMode = (backendTheme?: boolean): ThemeMode =>
  backendTheme === false ? "dark" : "light";

export function DisplaySettingsCard() {
  const { data: preferences, isLoading, error, refetch } = useMyPreferences();
  const updateAppearanceMutation = useUpdateAppearancePreferencesMutation();
  const { theme, setTheme } = useSettingsStore();
  const [message, setMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);

  useEffect(() => {
    if (!preferences?.appearanceSettings) return;
    setTheme(toThemeMode(preferences.appearanceSettings.theme));
  }, [preferences, setTheme]);

  const handleThemeChange = async (nextTheme: ThemeMode) => {
    if (nextTheme === theme || updateAppearanceMutation.isPending) return;

    setMessage(null);
    setMutationError(null);

    try {
      await updateAppearanceMutation.mutateAsync({
        theme: nextTheme === "light",
      });
      setTheme(nextTheme);
      setMessage("Display preferences saved.");
    } catch (updateError) {
      const nextMessage =
        updateError instanceof Error
          ? updateError.message
          : "Display preferences could not be saved.";
      setMutationError(nextMessage);
    }
  };

  return (
    <section className="bg-[var(--app-card)] rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center">
          <Eye className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
          <h2 className="text-lg font-bold text-slate-800">
            Display settings
          </h2>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#245A34]" />}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">
            Display preferences could not be loaded.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-sm font-bold text-red-700 underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100/60 bg-slate-50/30 rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <div className="w-5 h-5 rounded-full border-2 border-amber-500 bg-gradient-to-r from-transparent from-50% to-amber-500 to-50%" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Theme</h3>
              <p className="text-[13px] font-semibold text-slate-500 mt-0.5">
                Stored in profile preferences and applied to the app shell.
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-200/60 shrink-0">
            <ThemeButton
              label="Light"
              icon="light"
              active={theme === "light"}
              disabled={updateAppearanceMutation.isPending}
              onClick={() => void handleThemeChange("light")}
            />
            <ThemeButton
              label="Dark"
              icon="dark"
              active={theme === "dark"}
              disabled={updateAppearanceMutation.isPending}
              onClick={() => void handleThemeChange("dark")}
            />
          </div>
        </div>
      )}

      <div aria-live="polite" className="mt-4 min-h-5">
        {updateAppearanceMutation.isPending && (
          <p className="text-sm font-semibold text-slate-500">
            Saving display preferences...
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

function ThemeButton({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: "light" | "dark";
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = icon === "light" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center px-6 py-2.5 rounded-full text-sm font-bold transition-all disabled:opacity-60 ${
        active
          ? "bg-[#245A34] text-white shadow-sm"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      <Icon className="w-4 h-4 mr-2" strokeWidth={2.5} />
      {label}
    </button>
  );
}
