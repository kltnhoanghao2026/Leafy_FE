import { useCallback, useEffect, useState } from 'react';
import { BellRing, CheckCheck, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationHistory, useNotificationState } from '../queries/queries';
import {
  useMarkNotificationReadMutation,
  useMarkAllReadMutation,
} from '../queries/mutations';
import { NotificationItem } from '../components/NotificationItem';
import { PendingAccessRequests } from '../components/PendingAccessRequests';
import { notificationKeys } from '../queries/keys';
import { ROUTES } from '../../../lib/routes';
import type { UserNotificationResponse } from '../types';
import { useTranslation } from '../../../i18n';
import { PageErrorState } from '../../../components/ui/PageErrorState';

// ─── Routing map — all NotificationType values ────────────────────────────────

const NOTIFICATION_ROUTES: Record<string, (referenceId: string, payload?: Record<string, string>) => string | null | { path: string; state?: Record<string, unknown> }> = {
  POST_COMMENT:    (id) => `/dashboard/community?post=${id}`,
  POST_UPVOTE:     (id) => `/dashboard/community?post=${id}`,
  COMMENT_REPLY:   (id) => `/dashboard/community?post=${id}`,
  COMMENT_UPVOTE:  (id) => `/dashboard/community?post=${id}`,
  USER_FOLLOW:     (id) => ROUTES.DASHBOARD.PROFILE_VIEW(id),
  CONSULT_REQUEST: (id) => ROUTES.DASHBOARD.PROFILE_VIEW(id),
  PLAN_CONSULTING_CREATED: (id) => ROUTES.DASHBOARD.PLAN_DETAIL(id),
  PLAN_APPLIED:            (id) => ROUTES.DASHBOARD.PLAN_DETAIL(id),
  CONSULTING_DATA_ACCESS_REQUEST: (id, payload) =>
    payload?.expertProfileId ? ROUTES.DASHBOARD.PROFILE_VIEW(payload.expertProfileId) : null,
  CONSULTING_DATA_ACCESS_APPROVED: (id, payload) =>
    payload?.farmerProfileId ? ROUTES.DASHBOARD.PROFILE_VIEW(payload.farmerProfileId) : null,
  CONSULTING_DATA_ACCESS_DENIED: (id, payload) =>
    payload?.farmerProfileId ? ROUTES.DASHBOARD.PROFILE_VIEW(payload.farmerProfileId) : null,
  DIRECT_MESSAGE: (id, payload) =>
    payload?.conversationId
      ? { path: ROUTES.DASHBOARD.CHAT, state: { openConversationId: payload.conversationId } }
      : null,
  SYSTEM:          () => null,
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 px-6 py-5 border border-transparent rounded-2xl animate-pulse bg-slate-50/50">
      <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3.5 bg-slate-200 rounded-full w-3/4" />
        <div className="h-3 bg-slate-200/60 rounded-full w-1/2" />
        <div className="h-2.5 bg-slate-200/40 rounded-full w-1/4 mt-2" />
      </div>
    </div>
  );
}

// ─── Tab type ────────────────────────────────────────────────────────────────

type Tab = 'all' | 'unread';

// ─── Page ────────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const { data: stateData } = useNotificationState();
  const unreadCount = stateData?.data?.unreadCount ?? 0;

  const {
    data: historyData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useNotificationHistory(activeTab === 'unread', true);

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();

  // Mark all as read on mount
  useEffect(() => {
    if (unreadCount > 0) {
      markAllReadMutation.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: notificationKeys.state() });
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll via IntersectionObserver
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const handleNotificationClick = (notification: UserNotificationResponse) => {
    // Mark as read
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: notificationKeys.state() });
          queryClient.invalidateQueries({ queryKey: [...notificationKeys.all(), 'history'] });
        },
      });
    }

    // Navigate based on notification type
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
          return;
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

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // Invalidate the queries for that tab so it re-fetches fresh
    queryClient.invalidateQueries({ queryKey: notificationKeys.history(tab === 'unread') });
  };

  const notifications = historyData?.pages.flatMap((p) => p.data ?? []) ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);
  const totalLoaded = notifications.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20 mt-4 md:mt-8 px-4 sm:px-6 lg:px-8">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-[#245A34]/10 rounded-2xl">
              <BellRing className="w-7 h-7 text-[#245A34]" strokeWidth={2.5} />
            </div>
            {t('notifications.pageTitle')}
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[26px] h-[26px] px-2 bg-red-500 text-white text-[13px] font-bold rounded-full shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </h1>
          <p className="text-[15px] font-medium text-slate-500 mt-2">
            {t('notifications.pageSubtitle')}
          </p>
        </div>

        {/* Segmented Controls & Mark All Read */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-3 text-[14px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl shadow-sm transition-all disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4 text-[#245A34]" />
              {t('notifications.pageMarkAllRead')}
            </button>
          )}

          <div className="flex p-1 bg-slate-100/80 rounded-2xl w-full sm:w-auto">
            {(['all', 'unread'] as Tab[]).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-[#245A34] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {tab === 'all' ? t('notifications.tabAll') : t('notifications.tabUnread')}
                  {tab === 'unread' && unreadCount > 0 && (
                    <span className={`ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold rounded-full leading-none transition-colors ${
                      isActive ? 'bg-red-100 text-red-600' : 'bg-red-500 text-white'
                    }`}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-4xl p-4 sm:p-6 lg:p-8 shadow-sm border border-slate-100/50 min-h-[400px]">
        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <PageErrorState
            title={t('notifications.pageLoadError')}
            description={t('notifications.pageLoadErrorDetail')}
            onRetry={() =>
              queryClient.invalidateQueries({
                queryKey: notificationKeys.history(activeTab === 'unread'),
              })
            }
            className="my-10"
          />
        )}

        {/* Empty state */}
        {!isLoading && !isError && notifications.length === 0 && (
          <div className="py-28 flex flex-col items-center gap-5 text-center px-6">
            <div className="w-20 h-20 rounded-4xl bg-[#F2FCF4] flex items-center justify-center border border-[#10B981]/10 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)]">
              <Inbox className="w-10 h-10 text-[#10B981]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[17px] font-black text-gray-900">
                {activeTab === 'unread'
                  ? t('notifications.emptyUnreadTitle')
                  : t('notifications.emptyAllTitle')}
              </p>
              <p className="text-[15px] font-medium text-slate-500 mt-2 max-w-sm mx-auto">
                {activeTab === 'unread'
                  ? t('notifications.emptyUnreadSubtitle')
                  : t('notifications.emptyAllSubtitle')}
              </p>
            </div>
            {activeTab === 'all' && (
              <button
                onClick={() => navigate(ROUTES.DASHBOARD.COMMUNITY)}
                className="mt-4 px-6 py-3 bg-[#245A34] text-white text-[14px] font-bold rounded-xl hover:bg-[#1A4226] shadow-sm transition-colors"
              >
                {t('notifications.exploreCommunity')}
              </button>
            )}
          </div>
        )}

        {/* Notification list */}
        {!isLoading && !isError && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={handleNotificationClick}
                isCompact={false}
              />
            ))}

            {/* Infinite scroll sentinel */}
            {hasNextPage && (
              <div ref={sentinelRef} className="pt-4 space-y-4">
                {isFetchingNextPage && (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                )}
              </div>
            )}

            {/* End-of-list footer */}
            {!hasNextPage && totalLoaded >= 20 && (
              <div className="py-8 mt-4 text-center">
                <div className="inline-flex items-center justify-center px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                  <span className="text-[13px] text-slate-500 font-bold">
                    {t('notifications.allShownCount')(totalLoaded)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Access Request Approvals — shown when there are pending requests */}
        <PendingAccessRequests />
      </div>
    </div>
  );
}
