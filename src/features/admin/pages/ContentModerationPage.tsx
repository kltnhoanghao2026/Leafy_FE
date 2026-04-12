import { MessageSquare, MessageCircle } from "lucide-react";

const tabs = ["Bài viết", "Bình luận"];

export function ContentModerationPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Kiểm duyệt nội dung
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý bài viết và bình luận trong cộng đồng
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 w-fit">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            disabled
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed ${
              i === 0
                ? "bg-[#245A34] text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content placeholder */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">
            Bài viết chờ kiểm duyệt
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="flex gap-3 mb-4 opacity-30">
            <MessageSquare className="w-8 h-8" strokeWidth={1.5} />
            <MessageCircle className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium">
            Không có nội dung cần kiểm duyệt
          </p>
          <p className="text-xs text-slate-400 mt-1">
            API integration coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
