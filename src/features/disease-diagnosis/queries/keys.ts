export const diseaseDiagnosisKeys = {
  all: () => ["disease-diagnosis"] as const,
  requests: (params?: { page?: number; size?: number }) =>
    [...diseaseDiagnosisKeys.all(), "requests", params ?? {}] as const,
  results: (params?: { page?: number; size?: number }) =>
    [...diseaseDiagnosisKeys.all(), "results", params ?? {}] as const,
  request: (id: string) => [...diseaseDiagnosisKeys.all(), "request", id] as const,
  resultsByRequest: (id: string) =>
    [...diseaseDiagnosisKeys.all(), "results-by-request", id] as const,
  predictHealth: () => [...diseaseDiagnosisKeys.all(), "predict-health"] as const,
};
