import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Camera, Loader2, User } from "lucide-react";
import toast from "react-hot-toast";
import { isFileServiceReference } from "../../../lib/api/fileApi";
import {
  useFilePreviewUrl,
  useMyProfile,
  useUpdateProfileMutation,
  useUploadFileMutation,
} from "../queries";
import { ROLE_LABELS, type ProfileResponse, type ProfileUpdateRequest } from "../types";

type ProfileFormState = {
  fullName: string;
  specialty: string;
  bio: string;
  addressLine: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  latitude: string;
  longitude: string;
};

const FALLBACK_AVATAR = "https://i.pravatar.cc/150?img=11";

const toFormState = (profile: ProfileResponse): ProfileFormState => ({
  fullName: profile.fullName || "",
  specialty: profile.specialty || "",
  bio: profile.bio || "",
  addressLine: profile.addressLine || "",
  provinceCode: profile.provinceCode || "",
  districtCode: profile.districtCode || "",
  wardCode: profile.wardCode || "",
  latitude: profile.latitude == null ? "" : String(profile.latitude),
  longitude: profile.longitude == null ? "" : String(profile.longitude),
});

const trimOptional = (value: string) => value.trim();

const numberFromInput = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
};

const buildUpdatePayload = (
  profile: ProfileResponse,
  form: ProfileFormState,
): ProfileUpdateRequest => {
  const original = toFormState(profile);
  const payload: ProfileUpdateRequest = {};

  if (form.fullName !== original.fullName) payload.fullName = trimOptional(form.fullName);
  if (form.specialty !== original.specialty) payload.specialty = trimOptional(form.specialty);
  if (form.bio !== original.bio) payload.bio = trimOptional(form.bio);
  if (form.addressLine !== original.addressLine) {
    payload.addressLine = trimOptional(form.addressLine);
  }
  if (form.provinceCode !== original.provinceCode) {
    payload.provinceCode = trimOptional(form.provinceCode);
  }
  if (form.districtCode !== original.districtCode) {
    payload.districtCode = trimOptional(form.districtCode);
  }
  if (form.wardCode !== original.wardCode) payload.wardCode = trimOptional(form.wardCode);

  if (form.latitude !== original.latitude) {
    const latitude = numberFromInput(form.latitude);
    if (latitude !== undefined) payload.latitude = latitude;
  }
  if (form.longitude !== original.longitude) {
    const longitude = numberFromInput(form.longitude);
    if (longitude !== undefined) payload.longitude = longitude;
  }

  return payload;
};

const hasPayload = (payload: ProfileUpdateRequest) =>
  Object.keys(payload).length > 0;

export function ProfileSettingsCard() {
  const { data: profile, isLoading, error, refetch } = useMyProfile();
  const updateMutation = useUpdateProfileMutation();
  const uploadMutation = useUploadFileMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<ProfileFormState>({
    fullName: "",
    specialty: "",
    bio: "",
    addressLine: "",
    provinceCode: "",
    districtCode: "",
    wardCode: "",
    latitude: "",
    longitude: "",
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const { data: resolvedAvatarUrl, isLoading: isAvatarResolving } =
    useFilePreviewUrl(profile?.avatar);

  useEffect(() => {
    if (!profile) return;
    setForm(toFormState(profile));
  }, [profile]);

  const updatePayload = useMemo(
    () => (profile ? buildUpdatePayload(profile, form) : {}),
    [form, profile],
  );

  const hasChanges = hasPayload(updatePayload);
  const roleDisplay = profile?.role
    ? ROLE_LABELS[profile.role] || profile.role
    : "";

  const avatarSrc =
    resolvedAvatarUrl ||
    (profile?.avatar && !isFileServiceReference(profile.avatar)
      ? profile.avatar
      : null) ||
    profile?.profilePicture ||
    FALLBACK_AVATAR;

  const updateField = (field: keyof ProfileFormState, value: string) => {
    setSaveMessage(null);
    setSaveError(null);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = useCallback(async () => {
    if (!profile || !hasChanges) return;
    setSaveMessage(null);
    setSaveError(null);

    try {
      await updateMutation.mutateAsync({
        userId: profile.userId,
        data: updatePayload,
      });
      setSaveMessage("Profile changes saved.");
      toast.success("Profile changes saved.");
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Profile update failed.";
      setSaveError(message);
      toast.error(message);
    }
  }, [hasChanges, profile, updateMutation, updatePayload]);

  const handleAvatarSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !profile) return;

      setAvatarMessage(null);
      setAvatarError(null);

      try {
        const uploaded = await uploadMutation.mutateAsync(file);
        await updateMutation.mutateAsync({
          userId: profile.userId,
          data: { avatar: uploaded.id },
        });
        setAvatarMessage("Avatar uploaded.");
        toast.success("Avatar uploaded.");
      } catch (mutationError) {
        const message =
          mutationError instanceof Error
            ? mutationError.message
            : "Avatar upload failed.";
        setAvatarError(message);
        toast.error(message);
      } finally {
        event.target.value = "";
      }
    },
    [profile, updateMutation, uploadMutation],
  );

  const isSaving = updateMutation.isPending;
  const isUploading = uploadMutation.isPending;

  if (isLoading) {
    return (
      <section className="bg-[var(--app-card)] rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
        <ProfileHeader />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#245A34] animate-spin" />
          <span className="ml-3 text-sm font-semibold text-slate-500">
            Loading profile...
          </span>
        </div>
      </section>
    );
  }

  if (error && !profile) {
    return (
      <section className="bg-[var(--app-card)] rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
        <ProfileHeader />
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-semibold text-slate-500">
            {error.message}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm font-bold text-[#245A34] hover:underline"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[var(--app-card)] rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <ProfileHeader compact />
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving || isUploading}
          className="bg-[#245A34] hover:bg-[#1a4226] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-full transition-colors flex items-center justify-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save profile
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex flex-col items-center justify-start shrink-0">
          <div className="relative">
            <img
              src={avatarSrc}
              alt="Profile avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm"
            />
            {(isUploading || isAvatarResolving) && (
              <div
                aria-label="Avatar loading"
                className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center"
              >
                <Loader2 className="w-5 h-5 animate-spin text-[#245A34]" />
              </div>
            )}
            <button
              type="button"
              aria-label="Upload avatar"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSaving || !profile}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              <Camera
                className="w-3.5 h-3.5 text-slate-700"
                strokeWidth={2.5}
              />
            </button>
            <input
              ref={fileInputRef}
              aria-label="Avatar image file"
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={handleAvatarSelected}
            />
          </div>
          <p className="mt-3 max-w-40 text-center text-xs font-semibold text-slate-500">
            Avatar is uploaded to file-service and saved as a profile file id.
          </p>
          {avatarMessage && (
            <p className="mt-2 text-xs font-bold text-emerald-700" role="status">
              {avatarMessage}
            </p>
          )}
          {avatarError && (
            <p className="mt-2 text-xs font-bold text-red-600" role="alert">
              {avatarError}
            </p>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 w-full">
          <TextField
            label="Full name"
            value={form.fullName}
            onChange={(value) => updateField("fullName", value)}
          />
          <ReadOnlyField label="Role" value={roleDisplay} />
          <ReadOnlyField label="Email" value={profile?.email || ""} />
          <ReadOnlyField label="Phone number" value={profile?.phoneNumber || ""} />
          <TextField
            label="Specialty"
            value={form.specialty}
            onChange={(value) => updateField("specialty", value)}
          />
          <TextField
            label="Address"
            value={form.addressLine}
            onChange={(value) => updateField("addressLine", value)}
          />
          <TextField
            label="Province code"
            value={form.provinceCode}
            onChange={(value) => updateField("provinceCode", value)}
          />
          <TextField
            label="District code"
            value={form.districtCode}
            onChange={(value) => updateField("districtCode", value)}
          />
          <TextField
            label="Ward code"
            value={form.wardCode}
            onChange={(value) => updateField("wardCode", value)}
          />
          <NumberField
            label="Latitude"
            value={form.latitude}
            onChange={(value) => updateField("latitude", value)}
          />
          <NumberField
            label="Longitude"
            value={form.longitude}
            onChange={(value) => updateField("longitude", value)}
          />
          <div className="md:col-span-2 flex flex-col space-y-2">
            <label className="text-xs font-bold text-slate-700" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              value={form.bio}
              rows={4}
              onChange={(event) => updateField("bio", event.target.value)}
              className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#245A34]/20 focus:border-[#245A34] w-full resize-y"
            />
          </div>
        </div>
      </div>

      <div aria-live="polite" className="mt-5 min-h-5">
        {saveMessage && (
          <p className="text-sm font-bold text-emerald-700" role="status">
            {saveMessage}
          </p>
        )}
        {saveError && (
          <p className="text-sm font-bold text-red-600" role="alert">
            {saveError}
          </p>
        )}
      </div>
    </section>
  );
}

function ProfileHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center">
      <User className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
      <h2 className="text-lg font-bold text-slate-800">
        {compact ? "Profile" : "Profile information"}
      </h2>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs font-bold text-slate-700" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#245A34]/20 focus:border-[#245A34] w-full"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase();
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs font-bold text-slate-700" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#245A34]/20 focus:border-[#245A34] w-full"
      />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs font-bold text-slate-700" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        readOnly
        className="bg-slate-100/70 border border-slate-100/70 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500 focus:outline-none cursor-not-allowed w-full"
      />
    </div>
  );
}
