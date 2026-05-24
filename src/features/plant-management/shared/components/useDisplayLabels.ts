/**
 * useDisplayLabels — locale-aware label getters for plant-management enums.
 *
 * Replaces the static maps in displayUtils.ts for React components.
 * Pure utility functions (formatDate, optionalString, etc.) in displayUtils.ts
 * are unchanged and should still be imported directly.
 */
import { useTranslation } from '../../../../i18n';
import type { PlantEventType, PlantStatus, TreatmentStatus } from '../types';
import type { EventCategory } from './displayUtils';

export function usePlantManagementLabels() {
  const { t } = useTranslation();

  return {
    plantStatusLabel: (status: PlantStatus): string =>
      t(`plantManagement.status.${status}` as string),

    treatmentStatusLabel: (status: TreatmentStatus | string): string =>
      t(`plantManagement.treatmentStatus.${status}` as string) ?? status,

    eventTypeLabel: (eventType: PlantEventType | string): string =>
      t(`plantManagement.eventType.${eventType}` as string) ?? eventType,

    categoryLabel: (category: EventCategory): string =>
      t(`plantManagement.category.${category}` as string),

    categoryShortLabel: (category: EventCategory): string =>
      t(`plantManagement.categoryShort.${category}` as string),

    severityLabel: (severity: string | null | undefined): string =>
      severity ? (t(`plantManagement.severity.${severity}` as string) ?? severity) : '—',
  };
}
