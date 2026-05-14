import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { diseaseApi } from "../api/disease.api";
import { diseaseDiagnosisKeys } from "./keys";

export const usePredictHealth = () =>
  useQuery({
    queryKey: diseaseDiagnosisKeys.predictHealth(),
    queryFn: diseaseApi.getPredictHealth,
    staleTime: 1000 * 60,
  });

export const useDiagnoseRequests = (
  params: { page?: number; size?: number } = {},
) =>
  useQuery({
    queryKey: diseaseDiagnosisKeys.requests(params),
    queryFn: () => diseaseApi.getDiagnoseRequests(params),
  });

export const useDiagnoseResults = (
  params: { page?: number; size?: number } = {},
) =>
  useQuery({
    queryKey: diseaseDiagnosisKeys.results(params),
    queryFn: () => diseaseApi.getDiagnoseResults(params),
  });

export const useDiagnoseRequest = (id: string, enabled = true) =>
  useQuery({
    queryKey: diseaseDiagnosisKeys.request(id),
    queryFn: () => diseaseApi.getDiagnoseRequestById(id),
    enabled: enabled && !!id,
  });

export const useDiagnoseResultsByRequest = (id: string, enabled = true) =>
  useQuery({
    queryKey: diseaseDiagnosisKeys.resultsByRequest(id),
    queryFn: () => diseaseApi.getResultsByRequest(id),
    enabled: enabled && !!id,
  });

export const usePredictDiseaseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => diseaseApi.predictDisease(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: diseaseDiagnosisKeys.all(),
      });
    },
  });
};

export const useDeleteDiagnoseRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => diseaseApi.deleteDiagnoseRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: diseaseDiagnosisKeys.all(),
      });
    },
    meta: {
      successMessage: "Đã xóa lịch sử chẩn đoán.",
    },
  });
};

export const useDetectLeafMutation = () => {
  return useMutation({
    mutationFn: (file: File) => diseaseApi.detectLeaf(file),
  });
};
