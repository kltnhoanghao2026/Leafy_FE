import { useState, useEffect } from "react";
import { Wrench, Loader2, RefreshCcw, BarChart, Smile } from "lucide-react";
import {
  useMyPreferences,
  useUpdateSyncPreferencesMutation,
  useUpdateUtilitiesPreferencesMutation,
} from "../queries";
import { useTranslation } from "../../../i18n/useTranslation";

export function SyncAndUtilitiesCard() {
  const { t } = useTranslation();
  const { data: preferences, isLoading, error, refetch } = useMyPreferences();
  const updateSync = useUpdateSyncPreferencesMutation();
  const updateUtilities = useUpdateUtilitiesPreferencesMutation();

  const [syncState, setSyncState] = useState({
    syncSuggestion: true,
    showSyncProgress: true,
  });

  const [utilitiesState, setUtilitiesState] = useState({
    stickerSuggestion: true,
  });

  const [message, setMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    if (preferences?.syncSettings) {
      setSyncState(preferences.syncSettings as any);
    }
    if (preferences?.utilitiesSettings) {
      setUtilitiesState(preferences.utilitiesSettings as any);
    }
  }, [preferences]);

  const handleSyncToggle = async (key: keyof typeof syncState) => {
    if (updateSync.isPending) return;
    setMessage(null);
    setMutationError(null);

    const nextValue = !syncState[key];
    const nextState = { ...syncState, [key]: nextValue };
    
    try {
      await updateSync.mutateAsync(nextState);
      setSyncState(nextState);
      setMessage(t("settings.syncUtilities.savedSync"));
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : t("settings.syncUtilities.saveError"));
    }
  };

  const handleUtilitiesToggle = async (key: keyof typeof utilitiesState) => {
    if (updateUtilities.isPending) return;
    setMessage(null);
    setMutationError(null);

    const nextValue = !utilitiesState[key];
    const nextState = { ...utilitiesState, [key]: nextValue };
    
    try {
      await updateUtilities.mutateAsync(nextState);
      setUtilitiesState(nextState);
      setMessage(t("settings.syncUtilities.savedUtil"));
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : t("settings.syncUtilities.saveError"));
    }
  };

  const isBusy = updateSync.isPending || updateUtilities.isPending;

  return (
    <section className="bg-[var(--app-card)] rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col mt-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center">
          <Wrench className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
          <h2 className="text-lg font-bold text-slate-800">{t("settings.syncUtilities.title")}</h2>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#245A34]" />}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">{t("settings.syncUtilities.loadError")}</p>
          <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-bold text-red-700 underline">{t("settings.syncUtilities.retry")}</button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <SettingsGroup title={t("settings.syncUtilities.groups.sync")}>
            <ToggleRow
              icon={<RefreshCcw className="w-5 h-5 text-blue-600" />}
              bgClass="bg-blue-100"
              title={t("settings.syncUtilities.syncSuggest")}
              desc={t("settings.syncUtilities.syncSuggestDesc")}
              checked={syncState.syncSuggestion}
              disabled={isBusy}
              onChange={() => handleSyncToggle("syncSuggestion")}
            />
            <ToggleRow
              icon={<BarChart className="w-5 h-5 text-indigo-600" />}
              bgClass="bg-indigo-100"
              title={t("settings.syncUtilities.syncProgress")}
              desc={t("settings.syncUtilities.syncProgressDesc")}
              checked={syncState.showSyncProgress}
              disabled={isBusy}
              onChange={() => handleSyncToggle("showSyncProgress")}
            />
          </SettingsGroup>

          <SettingsGroup title={t("settings.syncUtilities.groups.utilities")}>
            <ToggleRow
              icon={<Smile className="w-5 h-5 text-pink-600" />}
              bgClass="bg-pink-100"
              title={t("settings.syncUtilities.stickerSuggest")}
              desc={t("settings.syncUtilities.stickerSuggestDesc")}
              checked={utilitiesState.stickerSuggestion}
              disabled={isBusy}
              onChange={() => handleUtilitiesToggle("stickerSuggestion")}
            />
          </SettingsGroup>
        </div>
      )}

      <div aria-live="polite" className="mt-4 min-h-5">
        {isBusy && <p className="text-sm font-semibold text-slate-500">{t("settings.syncUtilities.saving")}</p>}
        {message && <p className="text-sm font-bold text-emerald-700" role="status">{message}</p>}
        {mutationError && <p className="text-sm font-bold text-red-600" role="alert">{mutationError}</p>}
      </div>
    </section>
  );
}

function SettingsGroup({ title, children }: any) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider pl-2">{title}</h3>
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ icon, bgClass, title, desc, checked, disabled, onChange }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100/60 bg-slate-50/30 rounded-2xl p-4">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgClass}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          <p className="text-[13px] font-semibold text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="shrink-0 flex items-center">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={onChange}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#245A34] focus:ring-offset-2 ${
            checked ? "bg-[#245A34]" : "bg-slate-200"
          } disabled:opacity-50`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>
    </div>
  );
}
