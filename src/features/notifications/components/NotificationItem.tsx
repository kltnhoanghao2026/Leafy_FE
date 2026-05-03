import { useQuery } from '@tanstack/react-query';
import { profilesApi } from '../../profiles/api/profilesApi';
import { Avatar } from '../../../components/ui/Avatar';
import type { UserNotificationResponse } from '../types';
import { 
  MessageCircle, 
  ThumbsUp, 
  UserPlus, 
  MessageSquare, 
  Bell 
} from 'lucide-react';

function formatDistanceToNowNative(date: Date): string {
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Vừa xong";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ngày trước`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} năm trước`;
}

interface NotificationItemProps {
  notification: UserNotificationResponse;
  onClick: (notification: UserNotificationResponse) => void;
  isCompact?: boolean;
}

export function NotificationItem({ notification, onClick, isCompact = false }: NotificationItemProps) {
  // Fetch actor profile individually using their profileId
  const { data: actorProfile } = useQuery({
    queryKey: ['profiles', 'public', notification.actorId],
    queryFn: () => profilesApi.getPublicProfile(notification.actorId || ''),
    select: (r) => r.data.data,
    enabled: !!notification.actorId,
  });

  const displayName = actorProfile?.fullName || notification.actorName || 'Người dùng';
  const avatarUrl = actorProfile?.profilePicture || actorProfile?.avatar || notification.actorAvatar || undefined;

  const timeAgo = formatDistanceToNowNative(new Date(notification.occurredAt));

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
          <span className="font-bold text-slate-800 mr-1">{displayName}</span>
          {notification.body || 'đã tương tác với bạn'}
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
