import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationState, useNotificationHistory } from '../queries/queries';
import { useMarkCheckedMutation, useMarkNotificationReadMutation, useMarkAllReadMutation } from '../queries/mutations';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationItem } from './NotificationItem';
import { useNotificationWebSocket } from '../hooks/useNotificationWebSocket';
import { notificationKeys } from '../queries/keys';
import { ROUTES } from '../../../lib/routes';
import type { UserNotificationResponse } from '../types';

// ─── Skeleton ───────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-slate-100 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 mt-1" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-2.5 bg-slate-100 rounded w-1/4 mt-1" />
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Establish WebSocket connection for real-time notifications
  useNotificationWebSocket();

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: stateData } = useNotificationState();
  const unreadCount = stateData?.data?.unreadCount ?? 0;

  // Pre-fetch on mount (enabled=true always) so dropdown is instant on first open
  const {
    data: historyData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useNotificationHistory(false, true);

  const markCheckedMutation = useMarkCheckedMutation();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();

  // ── Interactions ──────────────────────────────────────────────────────────

  const openPopover = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
    
    // Mark them as read when hovering
    if (unreadCount > 0) {
      markAllReadMutation.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: notificationKeys.state() });
          queryClient.invalidateQueries({ queryKey: [...notificationKeys.all(), 'history'] });
        },
      });
    }
  }, [unreadCount, markAllReadMutation, queryClient]);

  const closePopover = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  }, []);

  const handleToggleClick = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      openPopover();
    }
  }, [isOpen, openPopover]);

  // Close on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Infinite scroll: load next page when user scrolls near the bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isOpen]);

  const handleNotificationClick = (notification: UserNotificationResponse) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: notificationKeys.state() });
          queryClient.invalidateQueries({ queryKey: [...notificationKeys.all(), 'history'] });
        },
      });
    }
    setIsOpen(false);

    if (notification.referenceId) {
      switch (notification.type) {
        case 'COMMENT':
        case 'VOTE':
        case 'POST':
          navigate(`/dashboard/community?post=${notification.referenceId}`);
          break;
        default:
          break;
      }
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.state() });
        queryClient.invalidateQueries({ queryKey: [...notificationKeys.all(), 'history'] });
      },
    });
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const notifications = historyData?.pages.flatMap((page) => page.data ?? []) ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative"
      ref={popoverRef}
      onMouseEnter={openPopover}
      onMouseLeave={closePopover}
    >
      {/* Bell trigger */}
      <button
        id="notification-bell"
        onClick={handleToggleClick}
        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
        aria-label="Thông báo"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden z-50 flex flex-col"
          style={{ maxHeight: 'min(520px, 80vh)' }}
          onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
          onMouseLeave={closePopover}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0 bg-white">
            <h3 className="font-bold text-slate-800 text-[15px]">Thông báo</h3>
            {hasUnread && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1 text-[12px] font-semibold text-[#245A34] hover:text-[#1a4228] disabled:opacity-50 transition-colors"
                aria-label="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Scrollable body */}
          <div ref={listRef} className="overflow-y-auto flex-1 overscroll-contain">
            {/* Loading skeletons */}
            {isLoading && (
              <>
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
              </>
            )}

            {/* Error state */}
            {isError && !isLoading && (
              <div className="p-8 text-center">
                <p className="text-sm text-red-500 font-medium">Không thể tải thông báo.</p>
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: notificationKeys.history() })}
                  className="mt-2 text-xs text-[#245A34] font-semibold hover:underline"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && notifications.length === 0 && (
              <div className="p-10 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-slate-500 font-medium">Chưa có thông báo nào.</p>
              </div>
            )}

            {/* Notification list */}
            {!isLoading && !isError && notifications.length > 0 && (
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={handleNotificationClick}
                    isCompact={true}
                  />
                ))}

                {/* Infinite scroll sentinel / manual load-more */}
                {isFetchingNextPage && (
                  <>
                    <NotificationSkeleton />
                    <NotificationSkeleton />
                  </>
                )}
                {!hasNextPage && notifications.length >= 20 && (
                  <p className="text-center text-[11px] text-slate-400 py-3 font-medium">
                    Đã hiển thị tất cả thông báo
                  </p>
                )}
              </div>
            )}
          </div>

          {/* See all footer */}
          <div className="shrink-0 border-t border-slate-100 bg-white">
            <button
              onClick={() => { setIsOpen(false); navigate(ROUTES.DASHBOARD.NOTIFICATIONS); }}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-[13px] font-bold text-[#245A34] hover:bg-[#F1F9F3] transition-colors"
            >
              Xem tất cả thông báo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
