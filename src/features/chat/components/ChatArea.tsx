import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import type { ConversationResponse, MessageResponse, AttachmentRequest } from '../api/chatApi';
import { Avatar } from '../../../components/ui/Avatar';
import { Send, Paperclip, Image as ImageIcon, Smile, Mic, X, BanIcon, AlertTriangle } from 'lucide-react';
import { fileApi } from '../../../lib/api/fileApi';
import { SystemMessageBubble } from './SystemMessageBubble';
import { AttachmentPreview } from './AttachmentPreview';
import { LinkPreviewCard } from './LinkPreviewCard';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ts: string | null | undefined): string {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function filePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PendingFile {
  file: File;
  previewUrl: string;  // object URL for preview
  uploading: boolean;
  error: boolean;
  result?: { s3Key: string };
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 to-transparent pointer-events-none" />
      <div className="text-center z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 border border-green-100">
          <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Leafy Chat</h2>
        <p className="text-gray-500 max-w-sm">Chọn một cuộc trò chuyện từ danh sách hoặc bắt đầu một cuộc trò chuyện mới để kết nối.</p>
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

interface BubbleProps {
  msg: MessageResponse;
  isMe: boolean;
  isFirstInGroup: boolean;
  showSenderInfo: boolean;
}

function MessageBubble({ msg, isMe, isFirstInGroup, showSenderInfo }: BubbleProps) {
  const ts = msg.timestamp || msg.createdAt || '';
  const isRevoked = msg.status === 'REVOKED';
  const isDeletedByAdmin = msg.status === 'DELETED_BY_ADMIN';
  const isSuppressed = isRevoked || isDeletedByAdmin;

  const hasAttachments = (msg.attachments?.length ?? 0) > 0;
  const isImageOrVideo = msg.type === 'IMAGE' || msg.type === 'VIDEO';

  // Bare image/video/file bubbles: no padding wrapper, just the media card
  const noPaddingBubble = (isImageOrVideo || msg.type === 'FILE') && !isSuppressed;

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${!isFirstInGroup ? 'mt-0.5' : 'mt-4'}`}>
      {/* Avatar for others */}
      {!isMe && (
        <div className="w-8 shrink-0 mr-2 self-end">
          {isFirstInGroup ? (
            <Avatar src={msg.senderAvatar} name={msg.senderName} className="!w-8 !h-8 text-[10px] border border-gray-200" />
          ) : null}
        </div>
      )}

      <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender name */}
        {!isMe && showSenderInfo && isFirstInGroup && msg.senderName && (
          <p className="text-[11px] font-semibold text-gray-500 mb-1 px-1">{msg.senderName}</p>
        )}

        {/* Bubble body */}
        <div className={`relative group ${noPaddingBubble
            ? ''
            : `px-4 py-2.5 shadow-sm ${isMe
              ? `bg-green-600 text-white ${isFirstInGroup ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl'}`
              : `bg-white border border-gray-100 text-gray-800 ${isFirstInGroup ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl'}`
            }`
          }`}>

          {/* ── Revoked ─────────────────────────────── */}
          {isRevoked && (
            <div className={`flex items-center gap-1.5 italic text-[13px] ${isMe ? 'text-green-100/70' : 'text-gray-400'}`}>
              <BanIcon className="w-3.5 h-3.5 shrink-0" />
              Tin nhắn đã bị thu hồi
            </div>
          )}

          {/* ── Deleted by admin ─────────────────────── */}
          {isDeletedByAdmin && (
            <div className={`flex items-center gap-1.5 italic text-[13px] ${isMe ? 'text-green-100/70' : 'text-gray-400'}`}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Tin nhắn đã bị xóa bởi quản trị viên
            </div>
          )}

          {/* ── Image/Video attachments ──────────────── */}
          {!isSuppressed && hasAttachments && (msg.type === 'IMAGE' || msg.type === 'VIDEO') && (
            <AttachmentPreview
              attachments={msg.attachments!}
              type={msg.type}
              isMe={isMe}
              content={msg.content}
            />
          )}

          {/* ── File attachments ─────────────────────── */}
          {!isSuppressed && hasAttachments && msg.type === 'FILE' && (
            <AttachmentPreview
              attachments={msg.attachments!}
              type="FILE"
              isMe={isMe}
              content={msg.content}
            />
          )}

          {/* ── Link preview ─────────────────────────── */}
          {!isSuppressed && msg.type === 'LINK' && msg.linkPreview && (
            <LinkPreviewCard linkPreview={msg.linkPreview} content={msg.content} isMe={isMe} />
          )}

          {/* ── Plain text (CHAT) ─────────────────────── */}
          {!isSuppressed && msg.type === 'CHAT' && (
            <>
              {msg.replyTo && (
                <div className={`mb-2 pl-2 border-l-2 ${isMe ? 'border-green-300' : 'border-gray-300'} text-[12px] opacity-70`}>
                  <p className="font-semibold">{msg.replyTo.senderName || 'Người dùng'}</p>
                  <p className="truncate max-w-[200px]">{msg.replyTo.content || '[Đính kèm]'}</p>
                </div>
              )}
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </>
          )}

          {/* ── Fallback: plain content for unknown types ── */}
          {!isSuppressed && !hasAttachments && msg.type !== 'CHAT' && msg.type !== 'LINK' && msg.content && (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          )}

          {/* ── Timestamp row ─────────────────────────── */}
          {!noPaddingBubble && (
            <p className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-green-100 justify-end' : 'text-gray-400 justify-start'}`}>
              {(msg.isEdited || msg.edited) && <span className="italic">đã sửa ·</span>}
              {formatTime(ts)}
              {isMe && (
                <svg className="w-3 h-3 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </p>
          )}
        </div>

        {/* Timestamp below bare media */}
        {noPaddingBubble && (
          <p className="text-[10px] mt-0.5 text-gray-400 px-1">{formatTime(ts)}</p>
        )}
      </div>
    </div>
  );
}

// ── Pending file strip ────────────────────────────────────────────────────────

interface PendingStripProps {
  files: PendingFile[];
  onRemove: (index: number) => void;
}

function PendingFileStrip({ files, onRemove }: PendingStripProps) {
  if (files.length === 0) return null;
  return (
    <div className="px-4 pt-2 pb-0 flex gap-2 flex-wrap">
      {files.map((pf, i) => {
        const isImage = pf.file.type.startsWith('image/');
        return (
          <div key={i} className="relative group">
            {isImage ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-green-400 bg-gray-100">
                <img src={pf.previewUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-36 h-14 rounded-xl border-2 border-green-400 bg-gray-50 flex items-center gap-2 px-2">
                <Paperclip className="w-4 h-4 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-gray-700 truncate">{pf.file.name}</p>
                  <p className="text-[10px] text-gray-400">{formatSize(pf.file.size)}</p>
                </div>
              </div>
            )}
            {/* uploading spinner */}
            {pf.uploading && (
              <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {/* error */}
            {pf.error && (
              <div className="absolute inset-0 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            )}
            {/* remove */}
            {!pf.uploading && (
              <button
                onClick={() => onRemove(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ChatAreaProps {
  conversation: ConversationResponse | null;
  currentUserId: string;
  onToggleInfo?: () => void;
  isInfoOpen?: boolean;
}

export function ChatArea({ conversation, currentUserId, onToggleInfo, isInfoOpen }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);   // any file
  const imageInputRef = useRef<HTMLInputElement>(null);   // image/video only
  const queryClient = useQueryClient();

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  };

  useEffect(() => {
    if (input === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input]);

  // ── Messages query ────────────────────────────────────────────────────────
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', conversation?.id],
    queryFn: () => chatApi.getMessages(conversation!.id),
    enabled: !!conversation?.id,
    refetchInterval: 3000,
  });

  // ── Mark as read ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (conversation?.id && (conversation.unreadCount ?? 0) > 0) {
      chatApi.markAsRead(conversation.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });
    }
  }, [conversation?.id]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Upload files helper ───────────────────────────────────────────────────
  const uploadFiles = useCallback(async (files: File[]) => {
    const newEntries: PendingFile[] = files.map(f => ({
      file: f,
      previewUrl: f.type.startsWith('image/') || f.type.startsWith('video/') ? filePreviewUrl(f) : '',
      uploading: true,
      error: false,
    }));

    setPendingFiles(prev => [...prev, ...newEntries]);
    const startIndex = pendingFiles.length; // index into the merged array

    const settled = await Promise.allSettled(
      files.map(f => fileApi.uploadFileDirectToS3(f))
    );

    setPendingFiles(prev => {
      const updated = [...prev];
      settled.forEach((result, i) => {
        const idx = startIndex + i;
        if (result.status === 'fulfilled') {
          updated[idx] = { ...updated[idx], uploading: false, result: { s3Key: result.value.s3Key } };
        } else {
          updated[idx] = { ...updated[idx], uploading: false, error: true };
        }
      });
      return updated;
    });
  }, [pendingFiles.length]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';
    await uploadFiles(files);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const pf = prev[index];
      if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // ── Send mutation ─────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async ({ content, attachments }: { content: string; attachments: AttachmentRequest[] }) => {
      await chatApi.sendMessage({ conversationId: conversation!.id, content: content || undefined, attachments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', conversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setInput('');
      setPendingFiles([]);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation || conversation.isDisbanded) return;
    const hasText = input.trim().length > 0;
    const uploadedFiles = pendingFiles.filter(pf => !pf.uploading && !pf.error && pf.result);
    if (!hasText && uploadedFiles.length === 0) return;
    if (pendingFiles.some(pf => pf.uploading)) return; // wait for uploads

    const attachments: AttachmentRequest[] = uploadedFiles.map(pf => ({
      key: pf.result!.s3Key,
      fileName: pf.file.name,
      originalFileName: pf.file.name,
      contentType: pf.file.type || 'application/octet-stream',
      size: pf.file.size,
    }));

    sendMutation.mutate({ content: input.trim(), attachments });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!conversation) return <EmptyState />;

  const { name, avatar, isGroup, isDisbanded, members } = conversation;
  const memberCount = members?.length ?? 0;
  const subtitle = isDisbanded
    ? '🔒 Nhóm đã giải tán'
    : isGroup
      ? `${memberCount} thành viên`
      : 'Nhắn tin';
  const subtitleColor = isDisbanded ? 'text-red-500' : isGroup ? 'text-blue-600' : 'text-gray-500';

  const orderedMessages = [...messages].reverse();
  const isUploading = pendingFiles.some(pf => pf.uploading);
  const canSend = !sendMutation.isPending && !isDisbanded && !isUploading &&
    (input.trim().length > 0 || pendingFiles.some(pf => !pf.uploading && !pf.error && pf.result));

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full relative min-w-0">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-md flex items-center gap-3 shrink-0 z-10 sticky top-0">
        <div className="relative">
          <Avatar src={avatar} name={name} size="lg" className="border border-gray-200" />
          {isGroup && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center border border-white">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
          )}

        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900 leading-tight truncate">{name || 'Người dùng'}</h2>
          <p className={`text-xs font-medium tracking-wide ${subtitleColor}`}>{subtitle}</p>
        </div>

        {onToggleInfo && (
          <button
            onClick={onToggleInfo}
            title={isGroup ? 'Thông tin nhóm' : 'Thông tin hội thoại'}
            className={`p-2 rounded-full transition-all ${isInfoOpen ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Disbanded banner ─────────────────────────────────────────────── */}
      {isDisbanded && (
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 text-center text-sm text-red-600 font-medium shrink-0">
          🔒 Nhóm này đã bị giải tán và không thể gửi tin nhắn mới.
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-slate-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : (
          <div className="space-y-0.5">
            {orderedMessages.map((msg: MessageResponse, index: number) => {
              if (msg.type === 'SYSTEM') {
                return <SystemMessageBubble key={msg.id} msg={msg} />;
              }
              const isMe = msg.senderId === currentUserId;
              const prevMsg = orderedMessages[index - 1];
              const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId || prevMsg.type === 'SYSTEM';
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  isFirstInGroup={isFirstInGroup}
                  showSenderInfo={isGroup}
                />
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ───────────────────────────────────────────────────── */}
      <div className={`bg-white border-t border-gray-100 shrink-0 z-10 ${isDisbanded ? 'pointer-events-none opacity-50' : ''}`}>
        {/* Pending files strip */}
        <PendingFileStrip files={pendingFiles} onRemove={removePendingFile} />

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <form onSubmit={handleSend} className="p-4 flex gap-2 items-end max-w-4xl mx-auto w-full">
          {/* Action buttons */}
          <div className="flex gap-1 pb-1 shrink-0">
            <button
              type="button"
              title="Đính kèm tệp"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-all"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Gửi ảnh / video"
              onClick={() => imageInputRef.current?.click()}
              className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-all hidden sm:block"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Text input */}
          <div className="flex-1 relative flex items-end bg-gray-100 rounded-[24px] border border-transparent focus-within:border-green-500 focus-within:bg-white focus-within:shadow-sm transition-all overflow-hidden">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={isDisbanded ? 'Nhóm đã giải tán' : 'Nhập tin nhắn…'}
              disabled={isDisbanded}
              rows={1}
              className="w-full bg-transparent px-4 py-3 min-h-[46px] max-h-32 focus:outline-none text-[15px] resize-none custom-scrollbar"
            />
            <div className="flex items-center pr-2 pb-1.5 shrink-0">
              <button type="button" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-all">
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Send / Mic */}
          <div className="pb-1 shrink-0 ml-1">
            {canSend || input.trim() ? (
              <button
                type="submit"
                disabled={!canSend}
                className="bg-green-600 text-white rounded-full p-2.5 flex items-center justify-center hover:bg-green-700 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5 ml-0.5" />
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={isDisbanded}
                className="bg-gray-100 text-gray-500 rounded-full p-2.5 flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 transition-all"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}