import { Users, ExternalLink } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import type { LinkPreviewResponse } from '../api/chatApi';

interface Props {
  linkPreview: LinkPreviewResponse;
  content?: string | null;
  isMe: boolean;
}

export function LinkPreviewCard({ linkPreview, content, isMe }: Props) {
  const handleJoin = () => {
    window.open(linkPreview.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col gap-2 max-w-[280px]">
      {content && (
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-all">
          {content}
        </p>
      )}

      <div className={`rounded-2xl border overflow-hidden shadow-sm ${isMe ? 'border-green-500/30 bg-green-700/25' : 'border-gray-200 bg-gray-50'}`}>
        {/* Header */}
        <div className="p-3 flex items-center gap-3">
          <Avatar
            src={linkPreview.groupAvatar}
            name={linkPreview.groupName}
            size="lg"
            className="border border-gray-200/60 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-[14px] truncate ${isMe ? 'text-white' : 'text-gray-900'}`}>
              {linkPreview.groupName || 'Nhóm Leafy'}
            </p>
            <p className={`text-[12px] flex items-center gap-1 mt-0.5 ${isMe ? 'text-green-100/80' : 'text-gray-500'}`}>
              <Users className="w-3 h-3" />
              {linkPreview.memberCount} thành viên
            </p>
          </div>
        </div>

        {/* Member previews */}
        {linkPreview.memberPreviews && linkPreview.memberPreviews.length > 0 && (
          <div className={`px-3 pt-0.5 pb-2 flex items-center gap-2 border-t ${isMe ? 'border-green-500/20' : 'border-gray-100'}`}>
            <div className="flex -space-x-2">
              {linkPreview.memberPreviews.slice(0, 5).map((m, i) => (
                <Avatar
                  key={i}
                  src={m.avatar}
                  name={m.name}
                  className="!w-5 !h-5 text-[7px] border-2 border-white"
                />
              ))}
            </div>
            <span className={`text-[11px] ${isMe ? 'text-green-100/70' : 'text-gray-400'}`}>
              và những người khác…
            </span>
          </div>
        )}

        {/* Join button */}
        <div className={`px-3 pb-3 ${linkPreview.memberPreviews?.length ? '' : 'pt-2'}`}>
          <button
            onClick={handleJoin}
            className={`w-full py-2 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              isMe
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Tham gia nhóm
          </button>
        </div>
      </div>
    </div>
  );
}
