import { useState, useEffect, type ReactNode } from "react";
import { Lock, Loader2, UserX, MessageSquareOff, PhoneOff, Calendar, Users, Activity, EyeOff, SearchX, Clock } from "lucide-react";
import {
  useMyPreferences,
  useUpdatePrivacyPreferencesMutation,
  useUpdateGeneralPreferencesMutation,
} from "../queries";
import { useTranslation } from "../../../i18n/useTranslation";

export function PrivacySettingsCard() {
  const { t } = useTranslation();
  const { data: preferences, isLoading, error, refetch } = useMyPreferences();
  const updatePrivacy = useUpdatePrivacyPreferencesMutation();
  const updateGeneral = useUpdateGeneralPreferencesMutation();

  const [privacyState, setPrivacyState] = useState({
    showDob: "FULL_DATE",
    showActiveStatus: true,
    showReadStatus: true,
    canText: "EVERYBODY",
    canCall: "EVERYBODY",
    showPosts: true,
    showPostAfter: null as string | null,
    allowSearchOnPhoneNumber: true,
  });
  
  const [showAllFriends, setShowAllFriends] = useState(false);
  const [postAfterEnabled, setPostAfterEnabled] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    if (preferences?.privacySettings) {
      setPrivacyState({
        showDob: preferences.privacySettings.showDob || "FULL_DATE",
        showActiveStatus: preferences.privacySettings.showActiveStatus ?? true,
        showReadStatus: preferences.privacySettings.showReadStatus ?? true,
        canText: preferences.privacySettings.canText || "EVERYBODY",
        canCall: preferences.privacySettings.canCall || "EVERYBODY",
        showPosts: preferences.privacySettings.showPosts ?? true,
        showPostAfter: preferences.privacySettings.showPostAfter || null,
        allowSearchOnPhoneNumber: preferences.privacySettings.allowSearchOnPhoneNumber ?? true,
      });
      setPostAfterEnabled(!!preferences.privacySettings.showPostAfter);
    }
    if (preferences?.generalSettings) {
      setShowAllFriends(preferences.generalSettings.showAllFriends ?? false);
    }
  }, [preferences]);

  const handlePrivacyChange = async (key: keyof typeof privacyState, value: any) => {
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

  const handleGeneralChange = async (value: boolean) => {
    if (updateGeneral.isPending) return;
    setMessage(null);
    setMutationError(null);

    try {
      await updateGeneral.mutateAsync({ showAllFriends: value } as any);
      setShowAllFriends(value);
      setMessage(t("settings.privacy.saved"));
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : t("settings.privacy.saveError"));
    }
  };

  const isBusy = updatePrivacy.isPending || updateGeneral.isPending;

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
          {/* Active Status */}
          <ToggleRow
            icon={<Activity className="w-5 h-5 text-indigo-600" strokeWidth={2} />}
            bgClass="bg-indigo-100"
            title={t("settings.privacy.activeStatus")}
            desc={t("settings.privacy.activeStatusDesc")}
            checked={privacyState.showActiveStatus}
            disabled={isBusy}
            onChange={(v) => handlePrivacyChange("showActiveStatus", v)}
          />

          {/* Read Receipts */}
          <ToggleRow
            icon={<EyeOff className="w-5 h-5 text-blue-600" strokeWidth={2} />}
            bgClass="bg-blue-100"
            title={t("settings.privacy.readStatus")}
            desc={t("settings.privacy.readStatusDesc")}
            checked={privacyState.showReadStatus}
            disabled={isBusy}
            onChange={(v) => handlePrivacyChange("showReadStatus", v)}
          />

          {/* Search by Phone */}
          <ToggleRow
            icon={<SearchX className="w-5 h-5 text-purple-600" strokeWidth={2} />}
            bgClass="bg-purple-100"
            title={t("settings.privacy.searchPhone")}
            desc={t("settings.privacy.searchPhoneDesc")}
            checked={privacyState.allowSearchOnPhoneNumber}
            disabled={isBusy}
            onChange={(v) => handlePrivacyChange("allowSearchOnPhoneNumber", v)}
          />

          {/* Show All Friends */}
          <ToggleRow
            icon={<Users className="w-5 h-5 text-teal-600" strokeWidth={2} />}
            bgClass="bg-teal-100"
            title={t("settings.privacy.allFriends")}
            desc={t("settings.privacy.allFriendsDesc")}
            checked={showAllFriends}
            disabled={isBusy}
            onChange={handleGeneralChange}
          />

          {/* Show Posts */}
          <ToggleRow
            icon={<UserX className="w-5 h-5 text-amber-600" strokeWidth={2} />}
            bgClass="bg-amber-100"
            title={t("settings.privacy.showPosts")}
            desc={t("settings.privacy.showPostsDesc")}
            checked={privacyState.showPosts}
            disabled={isBusy}
            onChange={(v) => handlePrivacyChange("showPosts", v)}
          />

          {/* Date Limit for Posts */}
          <div className="flex flex-col gap-2 border border-slate-100/60 bg-slate-50/30 rounded-2xl p-4">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-rose-600" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{t("settings.privacy.postLimit")}</h3>
                  <p className="text-[13px] font-semibold text-slate-500 mt-0.5">
                    {t("settings.privacy.postLimitDesc")}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center">
                <button
                  type="button"
                  role="switch"
                  aria-checked={postAfterEnabled}
                  onClick={() => {
                    const next = !postAfterEnabled;
                    setPostAfterEnabled(next);
                    if (!next) handlePrivacyChange("showPostAfter", null);
                  }}
                  disabled={isBusy}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#245A34] focus:ring-offset-2 ${
                    postAfterEnabled ? "bg-[#245A34]" : "bg-slate-200"
                  } disabled:opacity-50`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${postAfterEnabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
            {postAfterEnabled && (
              <div className="mt-2 ml-14">
                <input
                  type="datetime-local"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700"
                  value={privacyState.showPostAfter || ""}
                  onChange={(e) => handlePrivacyChange("showPostAfter", e.target.value)}
                  disabled={isBusy}
                />
              </div>
            )}
          </div>

          {/* Who can message */}
          <SelectRow
            title={t("settings.privacy.canText")}
            desc={t("settings.privacy.canTextDesc")}
            icon={<MessageSquareOff className="w-5 h-5 text-sky-600" strokeWidth={2} />}
            bgClass="bg-sky-100"
            value={privacyState.canText}
            options={[{ label: t("settings.privacy.options.everybody"), value: "EVERYBODY" }, { label: t("settings.privacy.options.friends"), value: "FRIENDS" }, { label: t("settings.privacy.options.nobody"), value: "NOBODY" }]}
            disabled={isBusy}
            onChange={(v) => handlePrivacyChange("canText", v)}
          />

          {/* Who can call */}
          <SelectRow
            title={t("settings.privacy.canCall")}
            desc={t("settings.privacy.canCallDesc")}
            icon={<PhoneOff className="w-5 h-5 text-emerald-600" strokeWidth={2} />}
            bgClass="bg-emerald-100"
            value={privacyState.canCall}
            options={[{ label: t("settings.privacy.options.everybody"), value: "EVERYBODY" }, { label: t("settings.privacy.options.friends"), value: "FRIENDS" }, { label: t("settings.privacy.options.nobody"), value: "NOBODY" }]}
            disabled={isBusy}
            onChange={(v) => handlePrivacyChange("canCall", v)}
          />

          {/* Date of Birth Visibility */}
          <SelectRow
            title={t("settings.privacy.showDob")}
            desc={t("settings.privacy.showDobDesc")}
            icon={<Calendar className="w-5 h-5 text-pink-600" strokeWidth={2} />}
            bgClass="bg-pink-100"
            value={privacyState.showDob}
            options={[{ label: t("settings.privacy.options.fullDate"), value: "FULL_DATE" }, { label: t("settings.privacy.options.monthDay"), value: "MONTH_DAY" }, { label: t("settings.privacy.options.year"), value: "YEAR" }, { label: t("settings.privacy.options.none"), value: "NONE" }]}
            disabled={isBusy}
            onChange={(v) => handlePrivacyChange("showDob", v)}
          />
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

interface SelectOption {
  label: string;
  value: string;
}

interface SelectRowProps {
  icon: ReactNode;
  bgClass: string;
  title: string;
  desc: string;
  value: string;
  options: SelectOption[];
  disabled: boolean;
  onChange: (value: string) => void;
}

function SelectRow({ icon, bgClass, title, desc, value, options, disabled, onChange }: SelectRowProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-slate-100/60 bg-slate-50/30 rounded-2xl p-4">
      <div className="flex items-center gap-4 mb-2 lg:mb-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgClass}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          <p className="text-[13px] font-semibold text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center bg-slate-50 p-1 rounded-2xl border border-slate-200/60 shrink-0 gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${
              value === opt.value
                ? "bg-[#245A34] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
