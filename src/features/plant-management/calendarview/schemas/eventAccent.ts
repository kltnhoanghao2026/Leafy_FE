import type { EventCategory } from '../../shared/components/displayUtils';

export interface EventAccentStyle {
  borderColor: string;
  headerText: string;
  countBg: string;
  countText: string;
  iconBg: string;
  iconText: string;
  dotColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  headerBadgeBg: string;
  headerBadgeText: string;
}

export const CATEGORY_ACCENT_STYLES: Record<EventCategory, EventAccentStyle> = {
  ROUTINE_CARE: {
    borderColor: '#3B82F6',
    headerText: 'text-blue-700',
    countBg: 'bg-blue-100',
    countText: 'text-blue-700',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-500',
    dotColor: '#3B82F6',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    badgeText: 'text-blue-700',
    headerBadgeBg: 'bg-blue-50',
    headerBadgeText: 'text-blue-600',
  },
  HEALTH_MEDICAL: {
    borderColor: '#F97316',
    headerText: 'text-orange-700',
    countBg: 'bg-orange-100',
    countText: 'text-orange-700',
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-500',
    dotColor: '#F97316',
    badgeBg: 'bg-orange-50',
    badgeBorder: 'border-orange-200',
    badgeText: 'text-orange-700',
    headerBadgeBg: 'bg-red-50',
    headerBadgeText: 'text-red-500',
  },
  GROWTH_LIFECYCLE: {
    borderColor: '#10B981',
    headerText: 'text-emerald-700',
    countBg: 'bg-emerald-100',
    countText: 'text-emerald-700',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    dotColor: '#10B981',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-[#245A34]',
    headerBadgeBg: 'bg-emerald-50',
    headerBadgeText: 'text-emerald-700',
  },
  ALERTS: {
    borderColor: '#EF4444',
    headerText: 'text-red-700',
    countBg: 'bg-red-100',
    countText: 'text-red-700',
    iconBg: 'bg-red-50',
    iconText: 'text-red-500',
    dotColor: '#EF4444',
    badgeBg: 'bg-red-50',
    badgeBorder: 'border-red-200',
    badgeText: 'text-red-700',
    headerBadgeBg: 'bg-red-50',
    headerBadgeText: 'text-red-600',
  },
};
