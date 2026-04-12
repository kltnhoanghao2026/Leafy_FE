import { useState } from "react";
import {
  X,
  Link2,
  Share2,
  RotateCcw,
  Check,
  MessageSquare,
} from "lucide-react";
import { useCommunityStore } from "../../../store/useCommunityStore";
import type { Post } from "../types";
import { toast } from "react-hot-toast";
import { ROUTES } from "../../../lib/routes";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const { incrementShares, addPost } = useCommunityStore();
  const [linkCopied, setLinkCopied] = useState(false);
  const [repostMessage, setRepostMessage] = useState("");

  // Mock share link
  const shareLink = `${window.location.origin}${ROUTES.DASHBOARD.COMMUNITY}?post=${post.id}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast.success("Đã sao chép liên kết!");
  };

  const handleRepost = () => {
    // Create a new "shared" post with the full original embedded
    const newSharedPost: Post = {
      id: `p${Date.now()}`,
      author: {
        id: "currentUser",
        name: "Lê Văn Tám",
        avatar: "https://i.pravatar.cc/150?img=11",
      },
      timestamp: "Vừa xong",
      content: repostMessage, // user's own caption (can be empty)
      likes: 0,
      comments: 0,
      commentsList: [],
      shares: 0,
      // Embed the full original post as a snapshot
      sharedPost: {
        id: post.id,
        author: post.author,
        timestamp: post.timestamp,
        location: post.location,
        content: post.content,
        images: post.images,
        isUrgent: post.isUrgent,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        commentsList: post.commentsList,
      },
    };

    addPost(newSharedPost);
    incrementShares(post.id);
    toast.success("Đã chia sẻ bài viết lên trang của bạn!");
    setRepostMessage("");
    onClose();
  };

  const handleShareOptions = [
    {
      id: "copyLink",
      icon: linkCopied ? Check : Link2,
      label: linkCopied ? "Đã sao chép!" : "Sao chép liên kết",
      color: linkCopied ? "#10B981" : "#245A34",
      action: handleCopyLink,
    },
    {
      id: "messenger",
      icon: MessageSquare,
      label: "Nhắn tin cho bạn bè",
      color: "#245A34",
      action: () => {
        toast("Tính năng nhắn tin sẽ sớm ra mắt!", { icon: "💬" });
        onClose();
      },
    },
    {
      id: "external",
      icon: Share2,
      label: "Chia sẻ ra ngoài",
      color: "#245A34",
      action: () => {
        if (navigator.share) {
          navigator.share({
            title: `Bài viết từ ${post.author.name}`,
            url: shareLink,
          });
        } else {
          handleCopyLink();
        }
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="w-8" />
          <h2 className="text-[17px] font-bold text-gray-900">
            Chia sẻ bài viết
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-6 pt-5 pb-2">
          {/* Post Preview Snippet */}
          <div className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900">
                {post.author.name}
              </p>
              <p className="text-[13px] text-slate-600 line-clamp-2 leading-snug">
                {post.content}
              </p>
            </div>
          </div>

          {/* Repost Section */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="w-4 h-4 text-[#245A34]" strokeWidth={2.5} />
              <p className="text-[14px] font-bold text-gray-900">
                Chia sẻ lên trang của bạn
              </p>
            </div>
            <div className="flex gap-3">
              <img
                src="https://i.pravatar.cc/150?img=11"
                alt="Current User"
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
              />
              <div className="flex-1 bg-slate-50 border border-slate-200/50 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#245A34]/20 focus-within:border-[#245A34] transition-all">
                <input
                  type="text"
                  value={repostMessage}
                  onChange={(e) => setRepostMessage(e.target.value)}
                  placeholder="Thêm một dòng suy nghĩ..."
                  className="w-full bg-transparent text-[14px] text-gray-900 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleRepost}
              className="w-full mt-3 py-2.5 bg-[#245A34] text-white text-[14px] font-bold rounded-full hover:bg-green-800 transition-colors"
            >
              Chia sẻ ngay
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                Hoặc chia sẻ qua
              </span>
            </div>
          </div>
        </div>

        {/* Quick Share Options */}
        <div className="px-6 pb-6 space-y-2">
          {handleShareOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <option.icon
                  className="w-5 h-5"
                  style={{ color: option.color }}
                  strokeWidth={2.5}
                />
              </div>
              <span className="text-[15px] font-bold text-gray-900">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {/* Link bar */}
        <div className="mx-6 mb-6 flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-2.5">
          <Link2 className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2} />
          <p className="text-[12px] text-slate-500 font-medium truncate flex-1">
            {shareLink}
          </p>
          <button
            onClick={handleCopyLink}
            className="text-[12px] font-black text-[#245A34] hover:opacity-70 transition-opacity shrink-0"
          >
            {linkCopied ? "Copied!" : "COPY"}
          </button>
        </div>
      </div>
    </div>
  );
}
