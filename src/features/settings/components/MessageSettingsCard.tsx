import { useState, useEffect } from "react";
import { MessageCircle, Loader2, Zap, Inbox, MoreHorizontal } from "lucide-react";
import {
  useMyPreferences,
  useUpdateMessagePreferencesMutation,
} from "../queries";
import { useTranslation } from "../../../i18n/useTranslation";

export function MessageSettingsCard() {
  const { t } = useTranslation();
  const { data: preferences, isLoading, error, refetch } = useMyPreferences();
  const updateMutation = useUpdateMessagePreferencesMutation();

  const [settings, setSettings] = useState({
    quickResponseEnable: false,
    separatePriorityAndOtherEnable: false,
    showTypingStatus: true,
  });

  const [message, setMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    if (preferences?.messageSettings) {
      setSettings(preferences.messageSettings as any);
    }
  }, [preferences]);

  const handleToggle = async (key: keyof typeof settings) => {
    if (updateMutation.isPending) return;
    setMessage(null);
    setMutationError(null);

    const nextValue = !settings[key];
    const nextState = { ...settings, [key]: nextValue };
    
    try {
      await updateMutation.mutateAsync(nextState);
      setSettings(nextState);
      setMessage(t("settings.message.saved"));
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : t("settings.message.saveError"));
    }
  };

  return (
    <section className="bg-[var(--app-card)] rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center">
          <MessageCircle className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
          <h2 className="text-lg font-bold text-slate-800">{t("settings.message.title")}</h2>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#245A34]" />}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">{t("settings.message.loadError")}</p>
          <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-bold text-red-700 underline">{t("settings.message.retry")}</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ToggleRow
            icon={<Zap className="w-5 h-5 text-amber-600" />}
            bgClass="bg-amber-100"
            title={t("settings.message.quickReply")}
            desc={t("settings.message.quickReplyDesc")}
            checked={settings.quickResponseEnable}
            disabled={updateMutation.isPending}
            onChange={() => handleToggle("quickResponseEnable")}
          />
          <ToggleRow
            icon={<Inbox className="w-5 h-5 text-blue-600" />}
            bgClass="bg-blue-100"
            title={t("settings.message.priorityInbox")}
            desc={t("settings.message.priorityInboxDesc")}
            checked={settings.separatePriorityAndOtherEnable}
            disabled={updateMutation.isPending}
            onChange={() => handleToggle("separatePriorityAndOtherEnable")}
          />
          <ToggleRow
            icon={<MoreHorizontal className="w-5 h-5 text-indigo-600" />}
            bgClass="bg-indigo-100"
            title={t("settings.message.typingStatus")}
            desc={t("settings.message.typingStatusDesc")}
            checked={settings.showTypingStatus}
            disabled={updateMutation.isPending}
            onChange={() => handleToggle("showTypingStatus")}
          />
        </div>
      )}

      <div aria-live="polite" className="mt-4 min-h-5">
        {updateMutation.isPending && <p className="text-sm font-semibold text-slate-500">{t("settings.message.saving")}</p>}
        {message && <p className="text-sm font-bold text-emerald-700" role="status">{message}</p>}
        {mutationError && <p className="text-sm font-bold text-red-600" role="alert">{mutationError}</p>}
      </div>
    </section>
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
