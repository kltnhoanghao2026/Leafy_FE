import type { PlantEventResponse } from '../../shared/types';

export type ViewType = 'month' | 'week' | 'timeline';

export interface HoveredDateRange {
  start: string;
  end: string;
  color: string;
}

export interface CalendarDateRange {
  startDate: string;
  endDate: string;
  activeView: ViewType;
}

export interface CalendarViewPanelProps {
  calendarQuery: { isLoading: boolean; isError: boolean; refetch: () => unknown };
  activeView: ViewType;
  events: PlantEventResponse[];
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  weekDays: string[];
  eventsByDate: Map<string, PlantEventResponse[]>;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
  isCurrentWeek: boolean;
  weekLabel: string;
  tlMonth: Date;
  onPrevTlMonth: () => void;
  onNextTlMonth: () => void;
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
  hoveredDateRange: HoveredDateRange | null;
}

export interface CalendarWorkspaceProps {
  events: PlantEventResponse[];
  calendarQuery?: { isLoading: boolean; isError: boolean; refetch: () => unknown };
  onDateRangeChange?: (range: CalendarDateRange) => void;
  onEditEvent?: (event: PlantEventResponse) => void;
  onToggleComplete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
  onSelectEvent?: (event: PlantEventResponse) => void;
  onDelete?: (event: PlantEventResponse) => void;
  emptyState?: React.ReactNode;
  renderHeaderLeft?: () => React.ReactNode;
  splitterRange?: [number, number];
  initialSelectedDate?: string;
  className?: string;
}

export interface EventListPanelProps {
  selectedDate: string | null;
  selectedDateEvents: PlantEventResponse[];
  onEdit: (event: PlantEventResponse) => void;
  onEventHover: (event: PlantEventResponse | null) => void;
  onToggleComplete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
  onSelectEvent?: (event: PlantEventResponse) => void;
  onDelete?: (event: PlantEventResponse) => void;
}

export interface GroupedEventListProps {
  events: PlantEventResponse[];
  selectedDate?: string | null;
  onEdit?: (event: PlantEventResponse) => void;
  onDelete?: (event: PlantEventResponse) => void;
  onEventHover?: (event: PlantEventResponse | null) => void;
  onToggleComplete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
  onSelectEvent?: (event: PlantEventResponse) => void;
  emptyNode?: React.ReactNode;
  headerAction?: React.ReactNode;
  hideHeader?: boolean;
}

export interface FilterState {
  farmPlotId: string;
  farmZoneId: string;
  plantId: string;
  targetType: string;
  eventType: string;
  selectedApplyId: string;
}

export interface ApplyLabelFn {
  (apply: import('../../shared/types').PlanApplyResponse): string;
}
