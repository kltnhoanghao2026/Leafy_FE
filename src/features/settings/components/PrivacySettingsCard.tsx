import { useState, useEffect, type ReactNode } from "react";
import { Lock, Loader2, MapPin, Leaf, ClipboardList, Sprout } from "lucide-react";
import {
  useMyPreferences,
  useUpdatePrivacyPreferencesMutation,
} from "../queries";
import { useTranslation } from "../../../i18n/useTranslation";

export function PrivacySettingsCard() {
  const { t } = useTranslation();
  const { data: preferences, isLoading, error, refetch } = useMyPreferences();
  const updatePrivacy = useUpdatePrivacyPreferencesMutation();

  const [privacyState, setPrivacyState] = useState({
    shareFarmPlotsWithConsultants: true,
    sharePlantsWithConsultants: true,
    sharePlantEventsWithConsultants: true,
    sharePlansWithConsultants: true,
  });

  const [message, setMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Sync privacy state from preferences — deferred to avoid cascading renders during effect sync
  useEffect(() => {
    const timer = setTimeout(() => {
      setPrivacyState({
        shareFarmPlotsWithConsultants: preferences?.privacySettings?.shareFarmPlotsWithConsultants ?? true,
        sharePlantsWithConsultants: preferences?.privacySettings?.sharePlantsWithConsultants ?? true,
        sharePlantEventsWithConsultants: preferences?.privacySettings?.sharePlantEventsWithConsultants ?? true,
        sharePlansWithConsultants: preferences?.privacySettings?.sharePlansWithConsultants ?? true,
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [preferences]);

  const handlePrivacyChange = async (key: keyof typeof privacyState, value: unknown) => {
    if (updatePrivacy.isPending) return;
    setMessage(null);
    setMutationError(null);

    const nextState = { ...privacyState, [key]: value };
    try {
      await updatePrivacy.mutateAsync(nextState);
      setPrivacyState(nextState);
      setMessage(t("settings.privacy.saved"));
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : t("settings.privacy.saveError"));
    }
  };

  const isBusy = updatePrivacy.isPending;

  return (
    <section className="bg-[var(--app-card)] rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center">
          <Lock className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
          <h2 className="text-lg font-bold text-slate-800">{t("settings.privacy.title")}</h2>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#245A34]" />}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">{t("settings.privacy.loadError")}</p>
          <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-bold text-red-700 underline">{t("settings.privacy.retry")}</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* ── Consulting Sharing Toggles ── */}
          <div className="border-t border-slate-200 pt-4 mt-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
              {t("settings.privacy.consultingSharing")}
            </p>

            {/* Share Farm Plots */}
            <div className="mb-3">
              <ToggleRow
                icon={<MapPin className="w-5 h-5 text-[#245A34]" strokeWidth={2} />}
                bgClass="bg-green-100"
                title={t("settings.privacy.shareFarmPlots")}
                desc={t("settings.privacy.shareFarmPlotsDesc")}
                checked={privacyState.shareFarmPlotsWithConsultants}
                disabled={isBusy}
                onChange={(v) => handlePrivacyChange("shareFarmPlotsWithConsultants", v)}
              />
            </div>

            {/* Share Plants */}
            <div className="mb-3">
              <ToggleRow
                icon={<Leaf className="w-5 h-5 text-emerald-600" strokeWidth={2} />}
                bgClass="bg-emerald-100"
                title={t("settings.privacy.sharePlants")}
                desc={t("settings.privacy.sharePlantsDesc")}
                checked={privacyState.sharePlantsWithConsultants}
                disabled={isBusy}
                onChange={(v) => handlePrivacyChange("sharePlantsWithConsultants", v)}
              />
            </div>

            {/* Share Plant Events */}
            <div className="mb-3">
              <ToggleRow
                icon={<ClipboardList className="w-5 h-5 text-amber-600" strokeWidth={2} />}
                bgClass="bg-amber-100"
                title={t("settings.privacy.sharePlantEvents")}
                desc={t("settings.privacy.sharePlantEventsDesc")}
                checked={privacyState.sharePlantEventsWithConsultants}
                disabled={isBusy}
                onChange={(v) => handlePrivacyChange("sharePlantEventsWithConsultants", v)}
              />
            </div>

            {/* Share Plans */}
            <div>
              <ToggleRow
                icon={<Sprout className="w-5 h-5 text-teal-600" strokeWidth={2} />}
                bgClass="bg-teal-100"
                title={t("settings.privacy.sharePlans")}
                desc={t("settings.privacy.sharePlansDesc")}
                checked={privacyState.sharePlansWithConsultants}
                disabled={isBusy}
                onChange={(v) => handlePrivacyChange("sharePlansWithConsultants", v)}
              />
            </div>
          </div>
        </div>
      )}

      <div aria-live="polite" className="mt-4 min-h-5">
        {isBusy && <p className="text-sm font-semibold text-slate-500">{t("settings.privacy.saving")}</p>}
        {message && <p className="text-sm font-bold text-emerald-700" role="status">{message}</p>}
        {mutationError && <p className="text-sm font-bold text-red-600" role="alert">{mutationError}</p>}
      </div>
    </section>
  );
}

interface ToggleRowProps {
  icon: ReactNode;
  bgClass: string;
  title: string;
  desc: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ icon, bgClass, title, desc, checked, disabled, onChange }: ToggleRowProps) {
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
          onClick={() => onChange(!checked)}
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
