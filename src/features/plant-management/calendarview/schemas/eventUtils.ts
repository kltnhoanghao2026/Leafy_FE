import type { PlantEventResponse } from '../../shared/types';
import { EVENT_CATEGORY_MAP, type EventCategory } from '../../shared/components/displayUtils';

export const CATEGORY_ORDER: EventCategory[] = ['ROUTINE_CARE', 'HEALTH_MEDICAL', 'GROWTH_LIFECYCLE', 'ALERTS'];

/** Recursively count all events (including nested children). */
export function countAllEvents(events: PlantEventResponse[]): number {
  let count = 0;
  for (const e of events) {
    count += 1;
    if (e.children && e.children.length > 0) {
      count += countAllEvents(e.children);
    }
  }
  return count;
}

/** Check if a single event is considered done. */
export function isEventDone(e: PlantEventResponse): boolean {
  if (e.children && e.children.length > 0) {
    return e.completed || e.children.every(child => isEventDone(child));
  }
  return e.completed;
}

/** Recursively count done events (including nested children). */
export function countDoneEvents(events: PlantEventResponse[]): number {
  let count = 0;
  for (const e of events) {
    if (isEventDone(e)) count += 1;
    if (e.children && e.children.length > 0) {
      count += countDoneEvents(e.children);
    }
  }
  return count;
}

/** Group events by category */
export function groupEventsByCategory(events: PlantEventResponse[]): Record<EventCategory, PlantEventResponse[]> {
  const grouped: Record<EventCategory, PlantEventResponse[]> = {
    ROUTINE_CARE: [],
    HEALTH_MEDICAL: [],
    GROWTH_LIFECYCLE: [],
    ALERTS: [],
  };

  for (const evt of events) {
    const cat = EVENT_CATEGORY_MAP[evt.eventType] ?? 'ROUTINE_CARE';
    grouped[cat].push(evt);
  }

  return grouped;
}
