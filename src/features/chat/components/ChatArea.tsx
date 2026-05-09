import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ConversationResponse, MessageResponse } from '../api/chatApi';
import { Avatar } from '../../../components/ui/Avatar';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';

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

// ── ChatArea ──────────────────────────────────────────────────────────────────

interface ChatAreaProps {
  conversation: ConversationResponse | null;
  currentUserId: string;  // profileId
  wsConnected: boolean;
  onToggleInfo?: () => void;
  isInfoOpen?: boolean;
}

export function ChatArea({ conversation, currentUserId, wsConnected, onToggleInfo, isInfoOpen }: ChatAreaProps) {
  const queryClient = useQueryClient();

  // Live messages pushed by WebSocket live in the query cache keyed by ['chat-live-messages', id].
  // ChatMessages reads them from there; we just expose the cache data here for merging.
  const [liveMessages, setLiveMessages] = useState<MessageResponse[]>([]);

  // ── Action states ───────────────────────────────────────────────────────────
  const [replyTarget, setReplyTarget] = useState<MessageResponse | null>(null);
  const [editTarget, setEditTarget] = useState<MessageResponse | null>(null);

  const handleReply = (msg: MessageResponse) => {
    setEditTarget(null);
    setReplyTarget(msg);
  };

  const handleEdit = (msg: MessageResponse) => {
    setReplyTarget(null);
    setEditTarget(msg);
  };

  // Subscribe to query cache changes so ChatMessages re-renders when WS pushes a message
  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey[0] === 'chat-live-messages' &&
        event.query.queryKey[1] === conversation.id
      ) {
        const data = queryClient.getQueryData<MessageResponse[]>(['chat-live-messages', conversation.id]);
        if (data) setLiveMessages(data);
      }
    });
    return unsub;
  }, [conversation?.id, queryClient]);

  // Reset live messages and action states when switching conversations
  useEffect(() => {
    setLiveMessages([]);
    setReplyTarget(null);
    setEditTarget(null);
  }, [conversation?.id]);

  if (!conversation) return <EmptyState />;

  const { name, avatar, isGroup, isDisbanded, members, settings } = conversation;
  const memberCount = members?.length ?? 0;
  const subtitle = isDisbanded
    ? '🔒 Nhóm đã giải tán'
    : isGroup ? `${memberCount} thành viên` : 'Nhắn tin';
  const subtitleColor = isDisbanded ? 'text-red-500' : isGroup ? 'text-blue-600' : 'text-gray-500';

  // Determine if current user can send messages
  const currentMember = members?.find(m => m.profileId === currentUserId);
  const currentRole = currentMember?.role ?? 'MEMBER';
  const isAdminOrOwner = currentRole === 'OWNER' || currentRole === 'ADMIN';
  const memberCanSendMessages = settings?.memberCanSendMessages ?? true;
  const canSendMessages = isAdminOrOwner || memberCanSendMessages;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full relative min-w-0">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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

        {/* WS connection badge */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${wsConnected ? 'bg-green-400' : 'bg-gray-300'}`} title={wsConnected ? 'Đang kết nối' : 'Đang ngắt kết nối'} />

        {onToggleInfo && (
          <button onClick={onToggleInfo}
            title={isGroup ? 'Thông tin nhóm' : 'Thông tin hội thoại'}
            className={`p-2 rounded-full transition-all ${isInfoOpen ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Disbanded banner ────────────────────────────────────────────────── */}
      {isDisbanded && (
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 text-center text-sm text-red-600 font-medium shrink-0">
          🔒 Nhóm này đã bị giải tán và không thể gửi tin nhắn mới.
        </div>
      )}

      {/* ── Messages (cursor V2 + live WS merge) ────────────────────────────── */}
      <ChatMessages
        conversationId={conversation.id}
        currentUserId={currentUserId}
        isGroup={isGroup}
        unreadCount={conversation.unreadCount ?? 0}
        wsConnected={wsConnected}
        liveMessages={liveMessages}
        onReply={handleReply}
        onEdit={handleEdit}
      />

      {/* ── Input ────────────────────────────────────────────────────────────── */}
      <ChatInput
        conversationId={conversation.id}
        isDisbanded={isDisbanded}
        canSendMessages={canSendMessages}
        wsConnected={wsConnected}
        replyTarget={replyTarget}
        onCancelReply={() => setReplyTarget(null)}
        editTarget={editTarget}
        onCancelEdit={() => setEditTarget(null)}
      />
    </div>
  );
}
