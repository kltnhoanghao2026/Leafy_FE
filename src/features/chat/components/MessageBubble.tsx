import { BanIcon, AlertTriangle, CornerUpLeft, Edit2, Trash2 } from 'lucide-react';
import type { MessageResponse } from '../api/chatApi';
import { Avatar } from '../../../components/ui/Avatar';
import { AttachmentPreview } from './AttachmentPreview';
import { LinkPreviewCard } from './LinkPreviewCard';
import { SystemMessageBubble } from './SystemMessageBubble';

export function formatTime(ts: string | null | undefined): string {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

interface BubbleProps {
  msg: MessageResponse;
  isMe: boolean;
  isFirstInGroup: boolean;
  showSenderInfo: boolean;
  onReply?: (msg: MessageResponse) => void;
  onEdit?: (msg: MessageResponse) => void;
  onDeleteForMe?: (messageId: string) => void;
}

export function MessageBubble({ msg, isMe, isFirstInGroup, showSenderInfo, onReply, onEdit, onDeleteForMe }: BubbleProps) {
  // Use createdAt (HTTP) — field name fixed in chatApi.ts
  const ts = msg.createdAt;
  const isRevoked = msg.status === 'REVOKED';
  const isDeletedByAdmin = msg.status === 'DELETED_BY_ADMIN';
  const isSuppressed = isRevoked || isDeletedByAdmin;
  const hasAttachments = (msg.attachments?.length ?? 0) > 0;
  const hasTextContent = !!msg.content;
  const hasLinkPreview = msg.type === 'LINK' && !!msg.linkPreview;
  const hasReply = !!msg.replyTo;
  const isImageOrVideo = msg.type === 'IMAGE' || msg.type === 'VIDEO';

  if (isSuppressed) {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${!isFirstInGroup ? 'mt-0.5' : 'mt-4'}`}>
        {!isMe && (
          <div className="w-8 shrink-0 mr-2 self-end">
            {isFirstInGroup
              ? <Avatar src={msg.senderAvatar} name={msg.senderName} className="!w-8 !h-8 text-[10px] border border-gray-200" />
              : null}
          </div>
        )}
        <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
          {!isMe && showSenderInfo && isFirstInGroup && msg.senderName && (
            <p className="text-[11px] font-semibold text-gray-500 mb-1 px-1">{msg.senderName}</p>
          )}
          <div className={`px-4 py-2.5 shadow-sm ${isMe ? 'bg-green-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'}`}>
            {isRevoked && (
              <div className={`flex items-center gap-1.5 italic text-[13px] ${isMe ? 'text-green-100/70' : 'text-gray-400'}`}>
                <BanIcon className="w-3.5 h-3.5 shrink-0" />
                Tin nhắn đã bị thu hồi
              </div>
            )}
            {isDeletedByAdmin && (
              <div className={`flex items-center gap-1.5 italic text-[13px] ${isMe ? 'text-green-100/70' : 'text-gray-400'}`}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Tin nhắn đã bị xóa bởi quản trị viên
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${!isFirstInGroup ? 'mt-0.5' : 'mt-4'}`}>
      {!isMe && (
        <div className="w-8 shrink-0 mr-2 self-end">
          {isFirstInGroup
            ? <Avatar src={msg.senderAvatar} name={msg.senderName} className="!w-8 !h-8 text-[10px] border border-gray-200" />
            : null}
        </div>
      )}

      <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && showSenderInfo && isFirstInGroup && msg.senderName && (
          <p className="text-[11px] font-semibold text-gray-500 mb-1 px-1">{msg.senderName}</p>
        )}

        <div className={`relative group flex flex-col shadow-sm max-w-full ${isMe
          ? `bg-green-600 text-white ${isFirstInGroup ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl'}`
          : `bg-white border border-gray-100 text-gray-800 ${isFirstInGroup ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl'}`
        }`}>
          {/* Attachments */}
          {hasAttachments && (
            <div className={isImageOrVideo ? 'p-1' : 'px-4 pt-2.5 pb-1'}>
              <AttachmentPreview attachments={msg.attachments!} type={msg.type === 'FILE' ? 'FILE' : msg.type} isMe={isMe} />
            </div>
          )}

          {/* Text/Link/Reply Bubble */}
          {(hasTextContent || hasLinkPreview || hasReply) && (
            <div className={`px-4 ${hasAttachments ? 'pb-2.5 pt-1' : 'py-2.5'}`}>
              {hasReply && (
                <div className={`mb-2 pl-2 border-l-2 ${isMe ? 'border-green-300' : 'border-gray-300'} text-[12px] opacity-70`}>
                  <p className="font-semibold">{msg.replyTo!.senderName || 'Người dùng'}</p>
                  <p className="truncate max-w-[200px]">{msg.replyTo!.content || '[Đính kèm]'}</p>
                </div>
              )}
              
              {hasLinkPreview && msg.linkPreview && (
                <LinkPreviewCard linkPreview={msg.linkPreview} content={msg.content} isMe={isMe} />
              )}

              {!hasLinkPreview && hasTextContent && (
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
              )}

              {/* Timestamp inside text bubble */}
              <p className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-green-100 justify-end' : 'text-gray-400 justify-start'}`}>
                {msg.isEdited && <span className="italic">đã sửa ·</span>}
                {formatTime(ts)}
                {isMe && (
                  <svg className="w-3 h-3 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </p>
            </div>
          )}

          {/* Timestamp if ONLY attachments */}
          {hasAttachments && !hasTextContent && !hasLinkPreview && !hasReply && (
            <div className="px-3 pb-1.5 flex justify-end">
              <p className={`text-[10px] flex items-center gap-1 ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                {formatTime(ts)}
                {isMe && (
                  <svg className="w-3 h-3 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </p>
            </div>
          )}

          {/* Hover Action Pill */}
          <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-gray-200 shadow-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all z-10 ${
            isMe ? 'right-full mr-2' : 'left-full ml-2'
          }`}>
            {onReply && (
              <button onClick={() => onReply(msg)} title="Trả lời" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full">
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {isMe && onEdit && msg.type === 'CHAT' && !hasAttachments && (
              <button onClick={() => onEdit(msg)} title="Chỉnh sửa" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDeleteForMe && (
              <button onClick={() => onDeleteForMe(msg.id)} title="Xóa phía tôi" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { SystemMessageBubble };
