import { useNavigate } from "react-router-dom";
import { ChevronRight, User, ShieldCheck, Loader2 } from "lucide-react";
import { Avatar } from "../../../components/ui/Avatar";
import { ROUTES } from "../../../lib/routes";
import { useMyProfile, useFilePreviewUrl } from "../queries";
import { isFileServiceReference } from "../../../lib/api/fileApi";
import { ROLE_LABELS } from "../types";
import { useTranslation } from "../../../i18n/useTranslation";

export function ProfileSettingsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useMyProfile();
  const { data: resolvedAvatarUrl } = useFilePreviewUrl(profile?.avatar);

  const avatarSrc =
    resolvedAvatarUrl ||
    (profile?.avatar && !isFileServiceReference(profile.avatar) ? profile.avatar : null) ||
    profile?.profilePicture ||
    undefined;

  const roleDisplay = profile?.role ? ROLE_LABELS[profile.role] ?? profile.role : "";

  const handleClick = () => navigate(ROUTES.DASHBOARD.MY_PROFILE);

  if (isLoading) {
    return (
      <section className="bg-[var(--app-card)] rounded-[24px] p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded-full w-32 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded-full w-24 animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-[var(--app-card)] rounded-[24px] p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-[#10B981]/20 transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
      role="button"
      aria-label={t("settings.profile.viewProfile")}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar src={avatarSrc} name={profile?.fullName} size="2xl" className="border-2 border-slate-100 shadow-sm" />
          {profile?.isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#10B981] rounded-full border-2 border-white flex items-center justify-center">
              <ShieldCheck className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-slate-800 truncate group-hover:text-[#245A34] transition-colors">
            {profile?.fullName || t("settings.profile.unnamed")}
          </p>
          <p className="text-[13px] font-semibold text-slate-400 mt-0.5 truncate">
            {roleDisplay}{profile?.specialty ? ` · ${profile.specialty}` : ""}
          </p>
          {profile?.email && (
            <p className="text-[12px] text-slate-400 mt-0.5 truncate">{profile.email}</p>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight
          className="w-5 h-5 text-slate-300 group-hover:text-[#10B981] group-hover:translate-x-0.5 transition-all shrink-0"
          strokeWidth={2.5}
        />
      </div>

      <p className="mt-3 text-[12px] font-semibold text-[#10B981] flex items-center gap-1 pl-[4.5rem]">
        <User className="w-3 h-3" /> {t("settings.profile.viewProfile")}
      </p>
    </section>
  );
}
