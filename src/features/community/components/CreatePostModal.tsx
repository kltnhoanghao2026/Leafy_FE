import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ClipboardList, Image as ImageIcon, MapPin, Send, X } from "lucide-react";
import { useCreateCommunityPost } from "../queries";
import { useUploadFileMutation } from "../../settings/queries";
import { Avatar } from '../../../components/ui/Avatar'
import { Select } from '../../../components/ui/Select'
import { useCommunityCurrentUser } from "../hooks/useCommunityCurrentUser";
import { useMyPlans } from "../../plant-management/plan/queries/plan.queries";
import type { CommunityVisibility } from "../types";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VISIBILITY_OPTIONS = [
  { value: "ALL" as CommunityVisibility, label: "Công khai" },
  { value: "FOLLOWER" as CommunityVisibility, label: "Người theo dõi" },
  { value: "ONLY_ME" as CommunityVisibility, label: "Chỉ mình tôi" },
];

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const createPost = useCreateCommunityPost();
  const uploadFile = useUploadFileMutation();
  const currentUser = useCommunityCurrentUser();
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [postType, setPostType] = useState<"FEED" | "PLAN_SHARE">("FEED");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<CommunityVisibility>("ALL");
  const [location, setLocation] = useState<"PICKING" | string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myPlansQuery = useMyPlans();

  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
    };
  }, [previewImage]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewImage) URL.revokeObjectURL(previewImage);
    setMediaError(null);
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (previewImage) URL.revokeObjectURL(previewImage);
    setSelectedFile(null);
    setPreviewImage(null);
    setMediaError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setContent("");
    setSelectedFile(null);
    if (previewImage) URL.revokeObjectURL(previewImage);
    setPreviewImage(null);
    setMediaError(null);
    setPostType("FEED");
    setSelectedPlanId(null);
    setVisibility("ALL");
    uploadFile.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (createPost.isPending || uploadFile.isPending) return;
    createPost.reset();
    uploadFile.reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;
    setMediaError(null);

    try {
      const uploadedMedia = selectedFile
        ? await uploadFile.mutateAsync(selectedFile)
        : null;

      if (postType === "PLAN_SHARE" && !selectedPlanId) {
        setMediaError("Vui lòng chọn một kế hoạch điều trị để chia sẻ.");
        return;
      }

      await createPost.mutateAsync({
        content: {
          caption: trimmedContent,
          hashtags: [],
        },
        media: uploadedMedia
          ? [
              {
                url: uploadedMedia.id,
                type: uploadedMedia.contentType || selectedFile?.type || "image",
              },
            ]
          : [],
        postType,
        location: location && location !== "PICKING" ? { name: location } : null,
        visibility: visibility,
        planId: postType === "PLAN_SHARE" ? selectedPlanId : null,
      });

      resetForm();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Post could not be created. Please try again.";
      setMediaError(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg mx-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="w-8" />
          <h2 className="text-[17px] font-bold text-gray-900">Create post</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={createPost.isPending}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5">
            <div className="flex items-center gap-3 mb-4">
              <Avatar src={currentUser.avatar} name={currentUser.name} size="xl" className="border border-slate-200" />
              <div>
                <p className="text-[15px] font-bold text-gray-900">
                  {currentUser.name}
                </p>
              </div>
            </div>

            <textarea
              autoFocus
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Share a garden update, question, or experience..."
              rows={4}
              className="w-full text-[15px] text-gray-900 placeholder:text-slate-400 outline-none resize-none leading-relaxed"
            />

            {previewImage ? (
              <div className="relative mt-3 rounded-2xl overflow-hidden border border-slate-200">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-auto max-h-[200px] object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
                <p className="bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
                  Image will be uploaded to file-service before the post is
                  created.
                </p>
              </div>
            ) : null}

            {postType === "PLAN_SHARE" ? (
              <div className="mt-3 bg-green-50 rounded-2xl p-3 border border-green-200 animate-in slide-in-from-top-2 duration-150">
                <p className="text-[12px] font-bold text-[#245A34] mb-2 uppercase tracking-wider flex items-center gap-1">
                  <ClipboardList className="w-3.5 h-3.5" />
                  Chọn kế hoạch điều trị
                </p>
                {myPlansQuery.isLoading ? (
                  <p className="text-[13px] text-slate-500">Đang tải...</p>
                ) : (myPlansQuery.data?.content ?? []).filter((p) => p.isPublic).length === 0 ? (
                  <p className="text-[13px] text-slate-500">
                    Bạn chưa có kế hoạch công khai nào. Hãy bật chế độ công khai cho kế hoạch trước.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    {(myPlansQuery.data?.content ?? []).filter((p) => p.isPublic).map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`text-left px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors border ${
                          selectedPlanId === plan.id
                            ? "bg-[#245A34] text-white border-[#245A34]"
                            : "bg-white border-slate-200 text-slate-700 hover:border-[#245A34] hover:text-[#245A34]"
                        }`}
                      >
                        {plan.diseaseName ?? plan.planName ?? `Kế hoạch ${plan.id.slice(0, 8)}`}
                        {plan.severityLevel ? (
                          <span className="ml-2 opacity-70">· {plan.severityLevel}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            {mediaError || createPost.isError || uploadFile.isError ? (
              <p role="alert" className="mt-4 text-sm font-bold text-red-600">
                {mediaError ||
                  "Post could not be created. Check the content and try again."}
              </p>
            ) : null}
          </div>

          <div className="px-6 pb-5">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2.5 mb-4">
              <p className="text-[13px] font-bold text-slate-500">
                Add to post
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#245A34] hover:opacity-70 transition-opacity"
                  title="Add image preview"
                >
                  <ImageIcon className="w-5 h-5" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLocation(
                      location && location !== "PICKING" ? "" : "PICKING",
                    )
                  }
                  className={`transition-opacity ${
                    location && location !== "PICKING"
                      ? "text-[#245A34]"
                      : "text-slate-400"
                  } hover:opacity-70`}
                  title="Location"
                >
                  <MapPin className="w-5 h-5" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = postType === "PLAN_SHARE" ? "FEED" : "PLAN_SHARE";
                    setPostType(next);
                    if (next !== "PLAN_SHARE") setSelectedPlanId(null);
                  }}
                  className={`transition-opacity ${
                    postType === "PLAN_SHARE" ? "text-[#245A34]" : "text-slate-400"
                  } hover:opacity-70`}
                  title="Chia sẻ kế hoạch điều trị"
                >
                  <ClipboardList className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Visibility Selector */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[13px] font-bold text-slate-500">Ai có thể xem:</span>
              <div className="w-40">
                <Select
                  value={visibility}
                  onChange={(val) => setVisibility(val as CommunityVisibility)}
                  options={VISIBILITY_OPTIONS}
                  size="sm"
                />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Post image file"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="submit"
              disabled={!content.trim() || (postType === "PLAN_SHARE" && !selectedPlanId) || createPost.isPending || uploadFile.isPending}
              className="w-full py-3 bg-[#245A34] text-white text-[15px] font-bold rounded-full hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createPost.isPending || uploadFile.isPending ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" strokeWidth={2.5} />
                  Post
                </>
              )}
              {uploadFile.isPending ? "Uploading media..." : null}
              {!uploadFile.isPending && createPost.isPending ? "Creating post..." : null}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


