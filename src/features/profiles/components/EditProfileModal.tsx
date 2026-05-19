import { useState, useCallback, useRef } from "react";
import { ModalShell } from "../../../components/ui/ModalShell";
import { Avatar } from "../../../components/ui/Avatar";
import { useFilePreviewUrl } from "../../settings/queries";
import { isFileServiceReference } from "../../../lib/api/fileApi";
import { fileApi } from "../../../lib/api/fileApi";
import { Loader2, Camera, User, FileText, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import type { ProfileResponse, ProfileUpdateRequest } from "../../settings/types";

interface EditProfileModalProps {
  profile: ProfileResponse;
  onClose: () => void;
  onSave: (data: ProfileUpdateRequest) => Promise<void>;
}

export function EditProfileModal({ profile, onClose, onSave }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [addressLine, setAddressLine] = useState(profile.addressLine ?? "");
  const [specialty, setSpecialty] = useState(profile.specialty ?? "");
  const [avatarFileId, setAvatarFileId] = useState<string | undefined>(
    profile.avatar && !isFileServiceReference(profile.avatar) ? profile.avatar : undefined
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: resolvedAvatarUrl } = useFilePreviewUrl(avatarFileId);
  const avatarSrc =
    resolvedAvatarUrl ||
    (avatarFileId && !isFileServiceReference(avatarFileId) ? avatarFileId : null) ||
    undefined;

  const handleAvatarSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const uploaded = await fileApi.uploadFile(file);
      setAvatarFileId(uploaded.id);
      toast.success("Ảnh đại diện đã được tải lên!");
    } catch {
      toast.error("Tải ảnh thất bại, vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }, []);

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ tên.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        fullName: fullName.trim(),
        bio: bio.trim() || undefined,
        addressLine: addressLine.trim() || undefined,
        specialty: specialty.trim() || undefined,
        avatar: avatarFileId,
      });
      onClose();
    } catch {
      toast.error("Lưu thất bại, vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      onClose={onClose}
      icon={<User className="w-5 h-5 text-[#245A34]" />}
      title="Chỉnh sửa hồ sơ"
      maxWidth="sm:max-w-lg"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-[14px]"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl transition-colors text-[14px] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Lưu thay đổi
          </button>
        </div>
      }
    >
      <div className="px-6 py-5 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative inline-block">
            <Avatar
              src={avatarSrc}
              name={fullName}
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-sm bg-slate-50"
            />
            {isUploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 w-9 h-9 bg-white rounded-full shadow border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-60"
              aria-label="Đổi ảnh đại diện"
            >
              <Camera className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarSelected}
            />
          </div>
          <p className="text-[13px] font-semibold text-slate-400">Nhấn để đổi ảnh đại diện</p>
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[14px] font-bold text-slate-700">
            <User className="w-4 h-4 text-slate-400" />
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nhập họ và tên của bạn"
            className="w-full text-[14px] text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] transition-colors"
          />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[14px] font-bold text-slate-700">
            <FileText className="w-4 h-4 text-slate-400" />
            Giới thiệu
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Viết vài dòng giới thiệu về bản thân..."
            rows={3}
            className="w-full text-[14px] text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] transition-colors"
          />
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[14px] font-bold text-slate-700">
            <MapPin className="w-4 h-4 text-slate-400" />
            Địa chỉ
          </label>
          <input
            type="text"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="Ví dụ: Quận 1, TP. Hồ Chí Minh"
            className="w-full text-[14px] text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] transition-colors"
          />
        </div>

        {/* Specialty (for EXPERT role) */}
        {profile.role === "EXPERT" && (
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[14px] font-bold text-slate-700">
              <FileText className="w-4 h-4 text-slate-400" />
              Chuyên môn
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ví dụ: Chuyên gia về cây ăn quả"
              className="w-full text-[14px] text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] transition-colors"
            />
          </div>
        )}
      </div>
    </ModalShell>
  );
}
