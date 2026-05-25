import type { PlantEventCreateRequest } from '../../plant-management/shared/types';

export interface PlanFormState {
  diseaseName: string;
  planName: string;
  farmPlotId: string;
  speciesId: string;
  speciesName: string;
  severityLevel: string;
  successIndicators: string;
  estimatedCost: string;
  requiredInputs: string;
  safetyWarnings: string;
  isPublic: boolean;
}

export const emptyForm = (): PlanFormState => ({
  diseaseName: '',
  planName: '',
  farmPlotId: '',
  speciesId: '',
  speciesName: '',
  severityLevel: '',
  successIndicators: '',
  estimatedCost: '',
  requiredInputs: '',
  safetyWarnings: '',
  isPublic: false,
});

export const emptyEvent = (): PlantEventCreateRequest => ({
  eventType: '' as PlantEventCreateRequest['eventType'],
  note: '',
  description: '',
  daysFromStart: undefined,
  durationDays: undefined,
  estimatedCost: '',
  phiDays: undefined,
  ppeRequired: '',
  mrlNote: '',
});
