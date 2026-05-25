import { useQuery } from '@tanstack/react-query';
import { profilesApi } from '../../profiles/api/profilesApi';
import { Avatar } from '../../../components/ui/Avatar';
import type { UserNotificationResponse } from '../types';
import { useTranslation } from '../../../i18n';
import {
  MessageCircle,
  ThumbsUp,
  UserPlus,
  MessageSquare,
  Bell,
  ClipboardCheck,
  ClipboardList,
  Shield,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';

interface NotificationItemProps {
  notification: UserNotificationResponse;
  onClick: (notification: UserNotificationResponse) => void;
  isCompact?: boolean;
}

export function NotificationItem({ notification, onClick, isCompact = false }: NotificationItemProps) {
  const { t } = useTranslation();

  // Fetch actor profile individually using their profileId
  const { data: actorProfile } = useQuery({
    queryKey: ['profiles', 'public', notification.actorId],
    queryFn: () => profilesApi.getPublicProfile(notification.actorId || ''),
    select: (r) => r.data.data,
    enabled: !!notification.actorId,
  });

  const displayName = actorProfile?.fullName || notification.actorName || t('notifications.defaultUser');
  const avatarUrl = actorProfile?.profilePicture || actorProfile?.avatar || notification.actorAvatar || undefined;

  const timeAgo = formatDistanceToNow(new Date(notification.occurredAt), t);

  /**
   * The backend pre-renders `body` with the actor name + "và N người khác"
   * baked in for batched notifications. We treat any row with
   * `actorCount > 1` as already-rendered and show the body verbatim.
   * Single-actor rows keep the legacy "{displayName} {body}" prefix layout.
   */
  const isAggregated = (notification.actorCount ?? 1) > 1

  // Determine the overlay icon based on the notification type
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'POST_COMMENT':
      case 'COMMENT_REPLY':
        return { Icon: MessageCircle, colorClass: 'text-blue-500 bg-blue-50 border-blue-100' };
      case 'POST_UPVOTE':
      case 'COMMENT_UPVOTE':
        return { Icon: ThumbsUp, colorClass: 'text-pink-500 bg-pink-50 border-pink-100' };
      case 'USER_FOLLOW':
        return { Icon: UserPlus, colorClass: 'text-purple-500 bg-purple-50 border-purple-100' };
      case 'CONSULT_REQUEST':
        return { Icon: MessageSquare, colorClass: 'text-orange-500 bg-orange-50 border-orange-100' };
      case 'PLAN_CONSULTING_CREATED':
        return { Icon: ClipboardList, colorClass: 'text-emerald-500 bg-emerald-50 border-emerald-100' };
      case 'PLAN_APPLIED':
        return { Icon: ClipboardCheck, colorClass: 'text-green-600 bg-green-50 border-green-100' };
      case 'CONSULTING_DATA_ACCESS_REQUEST':
        return { Icon: Shield, colorClass: 'text-amber-500 bg-amber-50 border-amber-100' };
      case 'CONSULTING_DATA_ACCESS_APPROVED':
        return { Icon: ShieldCheck, colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
      case 'CONSULTING_DATA_ACCESS_DENIED':
        return { Icon: ShieldX, colorClass: 'text-red-500 bg-red-50 border-red-100' };
      case 'SYSTEM':
      default:
        return { Icon: Bell, colorClass: 'text-slate-500 bg-slate-50 border-slate-200' };
    }
  };

  const { Icon: TypeIcon, colorClass } = getTypeConfig(notification.type);

  // Dynamic styling based on compact mode and read status
  const containerClasses = isCompact
    ? `w-full flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0 ${
        !notification.isRead ? 'bg-[#F2FCF4]' : ''
      }`
    : `w-full flex items-start gap-4 p-4 md:p-5 text-left transition-all duration-200 border rounded-2xl ${
        !notification.isRead 
          ? 'bg-[#F2FCF4] border-[#10B981]/10 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)]' 
          : 'bg-white border-transparent hover:border-[#10B981]/20 hover:bg-slate-50'
      }`;

  const titleClasses = isCompact ? 'text-sm' : 'text-[15px]';
  const avatarSize = isCompact ? 'md' : 'lg';
  const iconSize = isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <button
      onClick={() => onClick(notification)}
      className={containerClasses}
    >
      <div className="relative shrink-0 mt-1">
        <Avatar
          src={avatarUrl}
          name={displayName}
          size={avatarSize}
        />
        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border ${colorClass}`}>
          <TypeIcon className={iconSize} strokeWidth={2.5} />
        </div>
      </div>
      
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`${titleClasses} font-bold text-slate-900 line-clamp-1`}>
          {notification.title}
        </p>
        <p className="text-[13px] text-slate-600 mt-1.5 line-clamp-2 leading-snug">
          {isAggregated ? (
            // Aggregated body already contains the actor name baked in by the
            // backend renderer — render verbatim to avoid duplication.
            <span className="text-slate-700">{notification.body}</span>
          ) : (
            <>
              <span className="font-bold text-slate-800 mr-1">{displayName}</span>
              {notification.body || t('notifications.defaultInteraction')}
            </>
          )}
        </p>
        <p className={`text-[11px] mt-2 ${!notification.isRead ? 'text-[#245A34] font-bold' : 'text-slate-400 font-medium'}`}>
          {timeAgo}
        </p>
      </div>
      
      {!notification.isRead && (
        <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0 mt-3 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
      )}
    </button>
  );
}

// ── Locale-aware relative time ────────────────────────────────────────────────

type TFunc = ReturnType<typeof useTranslation>['t'];

function formatDistanceToNow(date: Date, t: TFunc): string {
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return t('notifications.timeJustNow');

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return t('notifications.timeMinutesAgo')(diffInMinutes);

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return t('notifications.timeHoursAgo')(diffInHours);

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return t('notifications.timeDaysAgo')(diffInDays);

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return t('notifications.timeMonthsAgo')(diffInMonths);

  const diffInYears = Math.floor(diffInDays / 365);
  return t('notifications.timeYearsAgo')(diffInYears);
}
