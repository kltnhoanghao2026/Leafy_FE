import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { AlertCircle, Image as ImageIcon, MapPin, Send, X } from "lucide-react";
import { useCreateCommunityPost } from "../queries";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOCATIONS = [
  "Di Linh, Lam Dong",
  "Buon Ma Thuot",
  "Da Lat",
  "Bao Loc",
  "Gia Nghia",
];

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const createPost = useCreateCommunityPost();
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setContent("");
    setLocation("");
    setIsUrgent(false);
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (createPost.isPending) return;
    createPost.reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) return;

    try {
      await createPost.mutateAsync({
        content: {
          caption: content.trim(),
          hashtags: isUrgent ? ["urgent"] : [],
        },
        media: [],
        postType: "FEED",
        location:
          location && location !== "PICKING" ? { name: location } : null,
        visibility: "ALL",
      });

      resetForm();
      onClose();
    } catch {
      // Mutation error state is rendered in the modal.
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
              <img
                src="https://i.pravatar.cc/150?img=11"
                alt="Current User"
                className="w-11 h-11 rounded-full object-cover border border-slate-200"
              />
              <div>
                <p className="text-[15px] font-bold text-gray-900">
                  Current user
                </p>
                {location && location !== "PICKING" ? (
                  <p className="text-[12px] font-semibold text-[#245A34] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {location}
                  </p>
                ) : null}
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
                  Image preview only. Media upload is not connected in this
                  phase.
                </p>
              </div>
            ) : null}

            {location === "PICKING" ? (
              <div className="mt-3 bg-slate-50 rounded-2xl p-3 border border-slate-200 animate-in slide-in-from-top-2 duration-150">
                <p className="text-[12px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Choose location
                </p>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className="px-3 py-1.5 text-[13px] font-bold rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#245A34] hover:text-[#245A34] transition-colors"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsUrgent(!isUrgent)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold border transition-all ${
                  isUrgent
                    ? "bg-red-50 border-red-200 text-red-500"
                    : "border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-400"
                }`}
              >
                <AlertCircle className="w-4 h-4" strokeWidth={2.5} />
                Urgent advice
              </button>
              {location && location !== "PICKING" ? (
                <button
                  type="button"
                  onClick={() => setLocation("")}
                  className="text-[13px] font-semibold text-slate-400 hover:text-red-400 transition-colors"
                >
                  Clear location
                </button>
              ) : null}
            </div>

            {createPost.isError ? (
              <p role="alert" className="mt-4 text-sm font-bold text-red-600">
                Post could not be created. Check the content and try again.
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
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="submit"
              disabled={!content.trim() || createPost.isPending}
              className="w-full py-3 bg-[#245A34] text-white text-[15px] font-bold rounded-full hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createPost.isPending ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" strokeWidth={2.5} />
                  Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
