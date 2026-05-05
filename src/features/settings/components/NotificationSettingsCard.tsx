import { useState, useEffect } from "react";
import { Bell, Loader2, MessageSquare, Users, Phone, UserPlus, Cake, AppWindow, Vibrate, Eye } from "lucide-react";
import {
  useMyPreferences,
  useUpdateNotificationPreferencesMutation,
} from "../queries";
import { useTranslation } from "../../../i18n/useTranslation";

export function NotificationSettingsCard() {
  const { t } = useTranslation();
  const { data: preferences, isLoading, error, refetch } = useMyPreferences();
  const updateMutation = useUpdateNotificationPreferencesMutation();

  const [settings, setSettings] = useState({
    notifyNewMessageFromDirect: true,
    previewNewMessageFromDirect: true,
    notifyNewMessageFromGroup: true,
    notifyCall: true,
    notifyNewPostFromFriend: true,
    notifyDOB: true,
    notifyNewMessage: true,
    shakeOnNewMessage: true,
    previewNewMessage: true,
  });

  const [message, setMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    if (preferences?.notificationSettings) {
      setSettings(preferences.notificationSettings as any);
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
      setMessage(t("settings.notification.saved"));
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : t("settings.notification.saveError"));
    }
  };

  return (
    <section className="bg-[var(--app-card)] rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center">
          <Bell className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
          <h2 className="text-lg font-bold text-slate-800">{t("settings.notification.title")}</h2>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#245A34]" />}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">{t("settings.notification.loadError")}</p>
          <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-bold text-red-700 underline">{t("settings.notification.retry")}</button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          <SettingsGroup title={t("settings.notification.groups.messages")}>
            <ToggleRow icon={<MessageSquare className="w-5 h-5 text-blue-600"/>} bgClass="bg-blue-100" title={t("settings.notification.directMessage")} desc={t("settings.notification.directMessageDesc")} checked={settings.notifyNewMessageFromDirect} disabled={updateMutation.isPending} onChange={() => handleToggle("notifyNewMessageFromDirect")} />
            <ToggleRow icon={<Eye className="w-5 h-5 text-indigo-600"/>} bgClass="bg-indigo-100" title={t("settings.notification.previewMessage")} desc={t("settings.notification.previewMessageDesc")} checked={settings.previewNewMessageFromDirect} disabled={updateMutation.isPending} onChange={() => handleToggle("previewNewMessageFromDirect")} />
            <ToggleRow icon={<Users className="w-5 h-5 text-teal-600"/>} bgClass="bg-teal-100" title={t("settings.notification.groupMessage")} desc={t("settings.notification.groupMessageDesc")} checked={settings.notifyNewMessageFromGroup} disabled={updateMutation.isPending} onChange={() => handleToggle("notifyNewMessageFromGroup")} />
          </SettingsGroup>

          <SettingsGroup title={t("settings.notification.groups.calls")}>
            <ToggleRow icon={<Phone className="w-5 h-5 text-emerald-600"/>} bgClass="bg-emerald-100" title={t("settings.notification.incomingCall")} desc={t("settings.notification.incomingCallDesc")} checked={settings.notifyCall} disabled={updateMutation.isPending} onChange={() => handleToggle("notifyCall")} />
          </SettingsGroup>

          <SettingsGroup title={t("settings.notification.groups.friendActivity")}>
            <ToggleRow icon={<UserPlus className="w-5 h-5 text-amber-600"/>} bgClass="bg-amber-100" title={t("settings.notification.newPost")} desc={t("settings.notification.newPostDesc")} checked={settings.notifyNewPostFromFriend} disabled={updateMutation.isPending} onChange={() => handleToggle("notifyNewPostFromFriend")} />
            <ToggleRow icon={<Cake className="w-5 h-5 text-pink-600"/>} bgClass="bg-pink-100" title={t("settings.notification.birthday")} desc={t("settings.notification.birthdayDesc")} checked={settings.notifyDOB} disabled={updateMutation.isPending} onChange={() => handleToggle("notifyDOB")} />
          </SettingsGroup>

          <SettingsGroup title={t("settings.notification.groups.inApp")}>
            <ToggleRow icon={<AppWindow className="w-5 h-5 text-purple-600"/>} bgClass="bg-purple-100" title={t("settings.notification.inAppNotice")} desc={t("settings.notification.inAppNoticeDesc")} checked={settings.notifyNewMessage} disabled={updateMutation.isPending} onChange={() => handleToggle("notifyNewMessage")} />
            <ToggleRow icon={<Vibrate className="w-5 h-5 text-orange-600"/>} bgClass="bg-orange-100" title={t("settings.notification.vibrate")} desc={t("settings.notification.vibrateDesc")} checked={settings.shakeOnNewMessage} disabled={updateMutation.isPending} onChange={() => handleToggle("shakeOnNewMessage")} />
          </SettingsGroup>

        </div>
      )}

      <div aria-live="polite" className="mt-4 min-h-5">
        {updateMutation.isPending && <p className="text-sm font-semibold text-slate-500">{t("settings.notification.saving")}</p>}
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
