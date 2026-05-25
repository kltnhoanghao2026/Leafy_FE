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
import { useTranslation } from '../../../i18n';
import { useAlertEvents, useOpenAlertCount } from '../../alerts/queries';
import { AlertMessageSummary } from '../../alerts/components/AlertMessageSummary';
import { alertSeverityClasses, alertStatusClasses } from '../../alerts/utils/alertLabels';
import {
  formatAlertStatusLabel,
  formatAlertTypeLabel,
} from '../../iot/utils/iotTranslation';
import { formatDateTime } from '../../metrics-view/utils/format';
import type { AlertEventItemResponse } from '../../../types/iot';

type NotificationPopoverTab = 'notifications' | 'alerts';

// ─── Routing map — keep in sync with NotificationsPage ────────────────────────

const NOTIFICATION_ROUTES: Record<string, (referenceId: string, payload?: Record<string, string>) => string | null | { path: string; state?: Record<string, unknown> }> = {
  POST_COMMENT:    (id) => `/dashboard/community?post=${id}`,
  POST_UPVOTE:     (id) => `/dashboard/community?post=${id}`,
  COMMENT_REPLY:   (id) => `/dashboard/community?post=${id}`,
  COMMENT_UPVOTE:  (id) => `/dashboard/community?post=${id}`,
  USER_FOLLOW:     (id) => ROUTES.DASHBOARD.PROFILE_VIEW(id),
  CONSULT_REQUEST: (id) => ROUTES.DASHBOARD.PROFILE_VIEW(id),
  PLAN_CONSULTING_CREATED: (id) => ROUTES.DASHBOARD.PLAN_DETAIL(id),
  PLAN_APPLIED:            (id) => ROUTES.DASHBOARD.PLAN_DETAIL(id),
  DIRECT_MESSAGE: (_id, payload) =>
    payload?.conversationId
      ? { path: ROUTES.DASHBOARD.CHAT, state: { openConversationId: payload.conversationId } }
      : null,
  SYSTEM:          () => null,
};

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

function formatBadge(count: number) {
  return count > 99 ? '99+' : String(count);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NotificationPopover() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationPopoverTab>('notifications');
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Establish WebSocket connection for real-time notifications
  useNotificationWebSocket();

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: stateData } = useNotificationState();
  const unreadCount = stateData?.data?.unreadCount ?? 0;
  const { data: openAlertCount = 0 } = useOpenAlertCount();

  // Pre-fetch on mount (enabled=true always) so dropdown is instant on first open
  const {
    data: historyData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useNotificationHistory(false, true);

  const {
    data: recentOpenAlerts,
    isLoading: alertsLoading,
    isError: alertsError,
  } = useAlertEvents(
    {
      status: 'OPEN',
      page: 0,
      size: 5,
      sortBy: 'openedAt',
      sortDir: 'desc',
    },
    activeTab === 'alerts',
  );

  useMarkCheckedMutation();
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
    if (!el || activeTab !== 'notifications') return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [activeTab, hasNextPage, isFetchingNextPage, fetchNextPage, isOpen]);

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

    if (notification.referenceId && notification.type) {
      const routeFn = NOTIFICATION_ROUTES[notification.type];
      if (routeFn) {
        const result = routeFn(notification.referenceId, notification.payload ?? undefined);
        if (result) {
          if (typeof result === 'string') {
            navigate(result);
          } else {
            navigate(result.path, { state: result.state });
          }
        }
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

  const handleAlertClick = (alertId: string) => {
    setIsOpen(false);
    navigate(`${ROUTES.DASHBOARD.ALERTS}?status=OPEN&alertId=${encodeURIComponent(alertId)}`);
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const notifications = historyData?.pages.flatMap((page) => page.data ?? []) ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);
  const alertItems = recentOpenAlerts?.items ?? [];

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
        aria-label={t('notifications.bellAriaLabel')}
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
            <h3 className="font-bold text-slate-800 text-[15px]">{t('notifications.title')}</h3>
            {activeTab === 'notifications' && hasUnread && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1 text-[12px] font-semibold text-[#245A34] hover:text-[#1a4228] disabled:opacity-50 transition-colors"
                aria-label={t('notifications.markAllReadAriaLabel')}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label={t('notifications.popoverTabsAriaLabel')}
            className="grid grid-cols-2 gap-1 border-b border-slate-100 bg-slate-50/80 p-1.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'notifications'}
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-bold transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-white text-[#245A34] shadow-sm'
                  : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'
              }`}
            >
              {t('notifications.popoverTabNotifications')}
              {unreadCount > 0 && (
                <span className={`inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black leading-none ${
                  activeTab === 'notifications' ? 'bg-red-100 text-red-600' : 'bg-red-500 text-white'
                }`}>
                  {formatBadge(unreadCount)}
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'alerts'}
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-bold transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-white text-[#245A34] shadow-sm'
                  : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'
              }`}
            >
              {t('notifications.popoverTabAlerts')}
              {openAlertCount > 0 && (
                <span className={`inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black leading-none ${
                  activeTab === 'alerts' ? 'bg-red-100 text-red-600' : 'bg-red-500 text-white'
                }`}>
                  {formatBadge(openAlertCount)}
                </span>
              )}
            </button>
          </div>

          {/* Scrollable body */}
          <div ref={listRef} className="overflow-y-auto flex-1 overscroll-contain">
            {/* Loading skeletons */}
            {activeTab === 'notifications' && isLoading && (
              <>
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
              </>
            )}

            {/* Error state */}
            {activeTab === 'notifications' && isError && !isLoading && (
              <div className="p-8 text-center">
                <p className="text-sm text-red-500 font-medium">{t('notifications.loadError')}</p>
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: notificationKeys.history() })}
                  className="mt-2 text-xs text-[#245A34] font-semibold hover:underline"
                >
                  {t('notifications.retry')}
                </button>
              </div>
            )}

            {/* Empty state */}
            {activeTab === 'notifications' && !isLoading && !isError && notifications.length === 0 && (
              <div className="p-10 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-slate-500 font-medium">{t('notifications.empty')}</p>
              </div>
            )}

            {/* Notification list */}
            {activeTab === 'notifications' && !isLoading && !isError && notifications.length > 0 && (
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
                    {t('notifications.allShown')}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'alerts' && alertsLoading && (
              <>
                <NotificationSkeleton />
                <NotificationSkeleton />
              </>
            )}

            {activeTab === 'alerts' && alertsError && !alertsLoading && (
              <div className="p-8 text-center">
                <p className="text-sm text-red-500 font-medium">{t('notifications.popoverAlertsError')}</p>
              </div>
            )}

            {activeTab === 'alerts' && !alertsLoading && !alertsError && alertItems.length === 0 && (
              <div className="p-10 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-red-400" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-slate-500 font-medium">{t('notifications.popoverAlertsEmpty')}</p>
              </div>
            )}

            {activeTab === 'alerts' && !alertsLoading && !alertsError && alertItems.length > 0 && (
              <div className="flex flex-col">
                {alertItems.map((alert) => (
                  <button
                    type="button"
                    key={alert.id}
                    onClick={() => handleAlertClick(alert.id)}
                    className="w-full border-b border-slate-100 p-4 text-left transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-black text-slate-900">
                          {alert.display?.type ?? formatAlertTypeLabel(t, alert.alertType)}
                        </p>
                        <AlertMessageSummary
                          alert={alert as AlertEventItemResponse}
                          descriptionClassName="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-600"
                          detailClassName="mt-1 line-clamp-1 text-[11px] font-semibold text-slate-400"
                        />
                        <p className="mt-2 text-[11px] font-bold text-slate-400">
                          {alert.display?.openedAt ?? formatDateTime(alert.openedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${
                            alertSeverityClasses[alert.severity]
                          }`}
                        >
                          {alert.display?.severity}
                        </span>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${
                            alertStatusClasses[alert.status]
                          }`}
                        >
                          {alert.display?.status ?? formatAlertStatusLabel(t, alert.status)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* See all footer */}
          <div className="shrink-0 border-t border-slate-100 bg-white">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(activeTab === 'alerts' ? ROUTES.DASHBOARD.ALERTS : ROUTES.DASHBOARD.NOTIFICATIONS);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-[13px] font-bold text-[#245A34] hover:bg-[#F1F9F3] transition-colors"
            >
              {activeTab === 'alerts' ? t('notifications.popoverAlertsViewAll') : t('notifications.seeAll')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
