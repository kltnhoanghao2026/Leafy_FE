import { CalendarDays } from 'lucide-react';
import { GroupedEventList } from './GroupedEventList';
import type { PlantEventResponse } from '../../shared/types';

export interface EventListPanelProps {
  selectedDate: string | null;
  selectedDateEvents: PlantEventResponse[];
  onEdit: (event: PlantEventResponse) => void;
  onEventHover: (event: PlantEventResponse | null) => void;
}

export function EventListPanel({
  selectedDate,
  selectedDateEvents,
  onEdit,
  onEventHover,
}: EventListPanelProps): React.ReactElement {
  if (!selectedDate) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
        <CalendarDays className="h-10 w-10 text-slate-200" />
        <p className="text-sm font-medium text-slate-400">Chọn một ngày từ lịch</p>
      </div>
    );
  }

  if (selectedDateEvents.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
        <CalendarDays className="h-10 w-10 text-slate-200" />
        <p className="text-sm font-medium text-slate-500">Không có sự kiện trong ngày này</p>
      </div>
    );
  }

  return (
    <GroupedEventList
      events={selectedDateEvents}
      selectedDate={selectedDate}
      onEdit={onEdit}
      onEventHover={onEventHover}
    />
  );
}
