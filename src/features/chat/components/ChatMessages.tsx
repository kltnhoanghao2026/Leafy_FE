import React, { useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import type { MessageResponse } from '../api/chatApi';
import { MessageBubble, SystemMessageBubble } from './MessageBubble';
import { chatApi as chatApiMarkRead } from '../api/chatApi';

interface ChatMessagesProps {
  conversationId: string;
  currentUserId: string; // profileId
  isGroup: boolean;
  unreadCount: number;
  wsConnected: boolean;
  /** Live messages appended by WebSocket, keyed by conversationId */
  liveMessages: MessageResponse[];
  onReply?: (msg: MessageResponse) => void;
  onEdit?: (msg: MessageResponse) => void;
}

export function ChatMessages({
  conversationId,
  currentUserId,
  isGroup,
  unreadCount,
  wsConnected,
  liveMessages,
  onReply,
  onEdit,
}: ChatMessagesProps) {
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // ── Cursor-based infinite query (V2) ──────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['chat-messages-v2', conversationId],
    queryFn: ({ pageParam }) =>
      chatApi.getMessagesV2(conversationId, {
        cursor: pageParam as string | null,
        limit: 30,
        direction: 'OLDER',
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMoreOlder ? lastPage.olderCursor : undefined,
    enabled: !!conversationId,
    staleTime: wsConnected ? Infinity : 30_000,
  });

  // Flatten pages: each page is DESC (newest first), pages are OLDER first
  // Final array should be ASC (oldest first for rendering top-to-bottom)
  const historicalMessages: MessageResponse[] = React.useMemo(() => {
    if (!data) return [];
    // pages[0] = most recent page, pages[N] = oldest page
    // Each page's data is DESC (newest first)
    const allMessages: MessageResponse[] = [];
    // Iterate pages from oldest to newest, then reverse each page
    for (let i = data.pages.length - 1; i >= 0; i--) {
      const pageItems = [...data.pages[i].data].reverse(); // ASC within page
      allMessages.push(...pageItems);
    }
    return allMessages;
  }, [data]);

  // Merge historical + live WS messages, dedup by id
  const allMessages = React.useMemo(() => {
    const seen = new Set(historicalMessages.map(m => m.id));
    const newLive = liveMessages.filter(m => !seen.has(m.id));
    return [...historicalMessages, ...newLive];
  }, [historicalMessages, liveMessages]);

  // ── Scroll to bottom on first load and new live messages ─────────────────
  useEffect(() => {
    if (isLoading) return;
    if (isFirstLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      isFirstLoad.current = false;
    }
  }, [isLoading]);

  useEffect(() => {
    if (liveMessages.length === 0) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveMessages]);

  // ── IntersectionObserver for infinite scroll (load older messages) ────────
  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    fetchNextPage().then(() => {
      // Preserve scroll position after prepending older messages
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop += container.scrollHeight - prevScrollHeight;
        }
      });
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Mark as read ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (conversationId && unreadCount > 0) {
      chatApiMarkRead.markAsRead(conversationId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });
    }
  }, [conversationId, queryClient]);  // intentionally omit unreadCount to run once per conv

  // ── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: chatApi.deleteMessageForMe,
    onSuccess: (_, deletedId) => {
      // Remove from live WS cache
      queryClient.setQueryData(
        ['chat-live-messages', conversationId],
        (oldData: MessageResponse[] | undefined) => oldData?.filter(m => m.id !== deletedId)
      );
      // Also invalidate V2 cache to refresh history
      queryClient.invalidateQueries({ queryKey: ['chat-messages-v2', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const handleDeleteForMe = useCallback((messageId: string) => {
    deleteMutation.mutate(messageId);
  }, [deleteMutation]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-slate-50">
      {/* Top sentinel — triggers loading older messages */}
      <div ref={topSentinelRef} className="flex justify-center h-8 items-center">
        {isFetchingNextPage && (
          <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="space-y-0.5">
        {allMessages.map((msg, index) => {
          if (msg.type === 'SYSTEM') return <SystemMessageBubble key={msg.id} msg={msg} />;
          const isMe = msg.senderId === currentUserId;
          const prevMsg = allMessages[index - 1];
          const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId || prevMsg.type === 'SYSTEM';
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMe={isMe}
              isFirstInGroup={isFirstInGroup}
              showSenderInfo={isGroup}
              onReply={onReply}
              onEdit={onEdit}
              onDeleteForMe={handleDeleteForMe}
            />
          );
        })}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
