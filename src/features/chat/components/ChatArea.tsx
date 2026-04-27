import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import type { ConversationResponse, MessageResponse } from '../api/chatApi';

interface ChatAreaProps {
  conversation: ConversationResponse | null;
  currentUserId: string;
  onToggleInfo?: () => void;
  isInfoOpen?: boolean;
}

function formatTime(ts: string | null | undefined): string {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 to-transparent pointer-events-none" />
      <div className="text-center z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 border border-green-100">
          <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Leafy Chat</h2>
        <p className="text-gray-500 max-w-sm">Chọn một cuộc trò chuyện từ danh sách hoặc bắt đầu một cuộc trò chuyện mới để kết nối.</p>
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
interface BubbleProps {
  msg: MessageResponse;
  isMe: boolean;
  isFirstInGroup: boolean;
  showSenderInfo: boolean;
}

function MessageBubble({ msg, isMe, isFirstInGroup, showSenderInfo }: BubbleProps) {
  const ts = msg.timestamp || msg.createdAt || '';
  const fallbackAvatar = `https://i.pravatar.cc/150?u=${msg.senderId}`;

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${!isFirstInGroup ? 'mt-0.5' : 'mt-4'}`}>
      {/* Sender avatar — only for others, only first in group */}
      {!isMe && (
        <div className="w-8 shrink-0 mr-2 self-end">
          {isFirstInGroup ? (
            <img
              src={msg.senderAvatar || fallbackAvatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          ) : null}
        </div>
      )}

      <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender name — shown for others in group, first bubble only */}
        {!isMe && showSenderInfo && isFirstInGroup && msg.senderName && (
          <p className="text-[11px] font-semibold text-gray-500 mb-1 px-1">{msg.senderName}</p>
        )}

        <div className={`px-4 py-2.5 shadow-sm relative group ${
          isMe
            ? `bg-green-600 text-white ${isFirstInGroup ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl'}`
            : `bg-white border border-gray-100 text-gray-800 ${isFirstInGroup ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl'}`
        }`}>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          <p className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-green-100 justify-end' : 'text-gray-400 justify-start'}`}>
            {formatTime(ts)}
            {isMe && (
              <svg className="w-3 h-3 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ChatArea({ conversation, currentUserId, onToggleInfo, isInfoOpen }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', conversation?.id],
    queryFn: () => chatApi.getMessages(conversation!.id),
    enabled: !!conversation?.id,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (conversation?.id && (conversation.unreadCount ?? 0) > 0) {
      chatApi.markAsRead(conversation.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });
    }
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      chatApi.sendMessage({ conversationId: conversation!.id, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', conversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setInput('');
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversation || conversation.isDisbanded) return;
    sendMutation.mutate(input);
  };

  if (!conversation) return <EmptyState />;

  const { name, avatar, isGroup, isDisbanded, members } = conversation;
  const memberCount = members?.length ?? 0;
  const fallbackAvatar = `https://i.pravatar.cc/150?u=${isGroup ? conversation.id : conversation.recipientId}`;

  // Display status subtitle
  const subtitle = isDisbanded
    ? '🔒 Nhóm đã giải tán'
    : isGroup
    ? `${memberCount} thành viên`
    : conversation.status === 'ONLINE' ? 'Đang hoạt động' : 'Ngoại tuyến';

  const subtitleColor = isDisbanded ? 'text-red-500' : isGroup ? 'text-blue-600' : 'text-green-600';

  // Chronological order (API returns newest first)
  const orderedMessages = [...messages].reverse();

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full relative min-w-0">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-md flex items-center gap-3 shrink-0 z-10 sticky top-0">
        <div className="relative">
          <img
            src={avatar || fallbackAvatar}
            alt={name}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          {isGroup && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center border border-white">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
          )}
          {!isGroup && conversation.status === 'ONLINE' && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900 leading-tight truncate">{name || 'Người dùng'}</h2>
          <p className={`text-xs font-medium tracking-wide ${subtitleColor}`}>{subtitle}</p>
        </div>

        {/* Info toggle — groups only */}
        {isGroup && onToggleInfo && (
          <button
            onClick={onToggleInfo}
            title="Thông tin nhóm"
            className={`p-2 rounded-full transition-all ${
              isInfoOpen
                ? 'bg-green-100 text-green-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Disbanded banner ── */}
      {isDisbanded && (
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 text-center text-sm text-red-600 font-medium shrink-0">
          🔒 Nhóm này đã bị giải tán và không thể gửi tin nhắn mới.
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-slate-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : (
          <div className="space-y-0.5">
            {orderedMessages.map((msg: MessageResponse, index: number) => {
              const isMe = msg.senderId === currentUserId;
              const prevMsg = orderedMessages[index - 1];
              const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
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

      {/* ── Input ── */}
      <div className={`p-4 bg-white border-t border-gray-100 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10 ${isDisbanded ? 'pointer-events-none opacity-50' : ''}`}>
        <form onSubmit={handleSend} className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={isDisbanded ? 'Nhóm đã giải tán' : 'Nhập tin nhắn...'}
              disabled={isDisbanded}
              rows={1}
              className="w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 pr-12 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-[15px] resize-none max-h-32 custom-scrollbar transition-all"
            />
            <div className="absolute right-3 bottom-3 flex items-center">
              <button type="button" className="text-gray-400 hover:text-green-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sendMutation.isPending || isDisbanded}
            className="bg-green-600 text-white rounded-full p-3 flex items-center justify-center hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600 transition-all hover:shadow-md active:scale-95 shrink-0 mb-1"
          >
            <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
