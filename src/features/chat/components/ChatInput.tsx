import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon, Smile, Mic, X, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import type { AttachmentRequest, MessageResponse, ReplyMetadata } from '../api/chatApi';
import { fileApi } from '../../../lib/api/fileApi';

// ── Pending file state ───────────────────────────────────────────────────────

export interface PendingFile {
  file: File;
  previewUrl: string;
  uploading: boolean;
  error: boolean;
  result?: { s3Key: string };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Pending file strip ───────────────────────────────────────────────────────

function PendingFileStrip({ files, onRemove }: { files: PendingFile[]; onRemove: (i: number) => void }) {
  if (files.length === 0) return null;
  return (
    <div className="px-4 pt-2 pb-0 flex gap-2 flex-wrap">
      {files.map((pf, i) => {
        const isImage = pf.file.type.startsWith('image/');
        return (
          <div key={i} className="relative group">
            {isImage
              ? <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-green-400 bg-gray-100">
                  <img src={pf.previewUrl} alt="" className="w-full h-full object-cover" />
                </div>
              : <div className="w-36 h-14 rounded-xl border-2 border-green-400 bg-gray-50 flex items-center gap-2 px-2">
                  <Paperclip className="w-4 h-4 text-green-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-gray-700 truncate">{pf.file.name}</p>
                    <p className="text-[10px] text-gray-400">{formatSize(pf.file.size)}</p>
                  </div>
                </div>
            }
            {pf.uploading && (
              <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {pf.error && (
              <div className="absolute inset-0 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            )}
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

// ── ChatInput ────────────────────────────────────────────────────────────────

interface ChatInputProps {
  conversationId: string;
  isDisbanded: boolean;
  canSendMessages?: boolean;
  wsConnected: boolean;
  replyTarget?: MessageResponse | null;
  onCancelReply?: () => void;
  editTarget?: MessageResponse | null;
  onCancelEdit?: () => void;
}

export function ChatInput({
  conversationId,
  isDisbanded,
  canSendMessages = true,
  wsConnected,
  replyTarget,
  onCancelReply,
  editTarget,
  onCancelEdit
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Pre-fill input when editTarget changes
  useEffect(() => {
    if (editTarget) {
      setInput(editTarget.content || '');
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
      }
    } else if (replyTarget) {
      if (textareaRef.current) textareaRef.current.focus();
    }
  }, [editTarget, replyTarget]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  };

  const uploadFiles = useCallback(async (files: File[]) => {
    const newEntries: PendingFile[] = files.map(f => ({
      file: f,
      previewUrl: (f.type.startsWith('image/') || f.type.startsWith('video/'))
        ? URL.createObjectURL(f) : '',
      uploading: true,
      error: false,
    }));
    setPendingFiles(prev => [...prev, ...newEntries]);
    const startIdx = pendingFiles.length;

    const settled = await Promise.allSettled(files.map(f => fileApi.uploadFileDirectToS3(f)));
    setPendingFiles(prev => {
      const updated = [...prev];
      settled.forEach((result, i) => {
        const idx = startIdx + i;
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

  const sendMutation = useMutation({
    mutationFn: async ({ content, attachments, replyTo }: { content: string; attachments: AttachmentRequest[], replyTo?: ReplyMetadata }) => {
      if (editTarget) {
        await chatApi.editMessage(editTarget.id, content);
      } else {
        await chatApi.sendMessage({ conversationId, content: content || undefined, attachments, replyTo });
      }
    },
    onSuccess: () => {
      // When WS is connected, the new message will arrive via WebSocket — no need to refetch.
      // If WS is disconnected, invalidate to get the latest messages.
      if (!wsConnected) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages-v2', conversationId] });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setInput('');
      setPendingFiles([]);
      if (onCancelReply) onCancelReply();
      if (onCancelEdit) onCancelEdit();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisbanded) return;
    const hasText = input.trim().length > 0;
    const uploadedFiles = pendingFiles.filter(pf => !pf.uploading && !pf.error && pf.result);
    if (!hasText && uploadedFiles.length === 0) return;
    if (pendingFiles.some(pf => pf.uploading)) return;

    const attachments: AttachmentRequest[] = uploadedFiles.map(pf => ({
      key: pf.result!.s3Key,
      fileName: pf.file.name,
      originalFileName: pf.file.name,
      contentType: pf.file.type || 'application/octet-stream',
      size: pf.file.size,
    }));

    let replyTo: ReplyMetadata | undefined = undefined;
    if (replyTarget) {
      replyTo = {
        messageId: replyTarget.id,
        senderId: replyTarget.senderId,
        senderName: replyTarget.senderName,
        content: replyTarget.content,
        type: replyTarget.type,
      };
    }

    sendMutation.mutate({ content: input.trim(), attachments, replyTo });
  };

  const isUploading = pendingFiles.some(pf => pf.uploading);
  const canSend = !sendMutation.isPending && !isDisbanded && !isUploading &&
    (input.trim().length > 0 || pendingFiles.some(pf => !pf.uploading && !pf.error && pf.result));

  // If group setting blocks member from sending messages, show a notice banner
  if (!canSendMessages && !isDisbanded) {
    return (
      <div className="bg-white border-t border-gray-100 shrink-0">
        <div className="flex items-center justify-center gap-2.5 py-4 px-6">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Trưởng nhóm đã <span className="text-orange-600 font-semibold">tắt quyền nhắn tin</span> của thành viên
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border-t border-gray-100 shrink-0 z-10 ${isDisbanded ? 'pointer-events-none opacity-50' : ''}`}>
      {replyTarget && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-green-600">Trả lời {replyTarget.senderName || 'Người dùng'}</span>
            <span className="text-xs text-gray-500 truncate">{replyTarget.content || '[Đính kèm]'}</span>
          </div>
          <button type="button" onClick={onCancelReply} className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {editTarget && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-blue-600">Đang chỉnh sửa tin nhắn</span>
          </div>
          <button type="button" onClick={onCancelEdit} className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <PendingFileStrip files={pendingFiles} onRemove={removePendingFile} />

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
      <input ref={imageInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />

      <form onSubmit={handleSend} className="p-4 flex gap-2 items-end max-w-4xl mx-auto w-full">
        <div className={`flex gap-1 pb-1 shrink-0 ${editTarget ? 'opacity-30 pointer-events-none' : ''}`}>
          <button type="button" title="Đính kèm tệp" onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-all">
            <Paperclip className="w-5 h-5" />
          </button>
          <button type="button" title="Gửi ảnh / video" onClick={() => imageInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-all hidden sm:block">
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 relative flex items-end bg-gray-100 rounded-[24px] border border-transparent focus-within:border-green-500 focus-within:bg-white focus-within:shadow-sm transition-all overflow-hidden">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
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

        <div className="pb-1 shrink-0 ml-1">
          {canSend || input.trim() ? (
            <button type="submit" disabled={!canSend}
              className="bg-green-600 text-white rounded-full p-2.5 flex items-center justify-center hover:bg-green-700 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed">
              {isUploading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send className="w-5 h-5 ml-0.5" />}
            </button>
          ) : (
            <button type="button" disabled={isDisbanded}
              className="bg-gray-100 text-gray-500 rounded-full p-2.5 flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 transition-all">
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
