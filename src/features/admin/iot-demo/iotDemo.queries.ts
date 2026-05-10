import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "../../../i18n";
import { iotDemoApi, toIotDemoErrorMessage } from "./iotDemo.api";

const iotDemoKeys = {
  simulationStatus: ["iot-demo", "simulation-status"] as const,
};

export const useSimulationStatusQuery = () =>
  useQuery({
    queryKey: iotDemoKeys.simulationStatus,
    queryFn: iotDemoApi.getSimulationStatus,
  });

export const useBootstrapMinimalMutation = () => {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: iotDemoApi.bootstrapMinimal,
    onSuccess: () => toast.success(t("iot.demo.toastBootstrapMinimalCompleted")),
    onError: (error) =>
      toast.error(t("iot.demo.errorPrefix")(t("iot.demo.toastBootstrapMinimalFailed"), toIotDemoErrorMessage(error))),
  });
};

export const useBootstrapFullMutation = () => {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: iotDemoApi.bootstrapFull,
    onSuccess: () => toast.success(t("iot.demo.toastBootstrapFullCompleted")),
    onError: (error) =>
      toast.error(t("iot.demo.errorPrefix")(t("iot.demo.toastBootstrapFullFailed"), toIotDemoErrorMessage(error))),
  });
};

export const useSeedHistory7dMutation = () => {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: iotDemoApi.seedHistory7d,
    onSuccess: () => toast.success(t("iot.demo.toastSeed7dCompleted")),
    onError: (error) =>
      toast.error(t("iot.demo.errorPrefix")(t("iot.demo.toastSeed7dFailed"), toIotDemoErrorMessage(error))),
  });
};

export const useSeedHistory30dMutation = () => {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: iotDemoApi.seedHistory30d,
    onSuccess: () => toast.success(t("iot.demo.toastSeed30dCompleted")),
    onError: (error) =>
      toast.error(t("iot.demo.errorPrefix")(t("iot.demo.toastSeed30dFailed"), toIotDemoErrorMessage(error))),
  });
};

export const useStartSimulationMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: iotDemoApi.startSimulation,
    onSuccess: () => {
      toast.success(t("iot.demo.toastSimulationStarted"));
      void queryClient.invalidateQueries({
        queryKey: iotDemoKeys.simulationStatus,
      });
    },
    onError: (error) =>
      toast.error(t("iot.demo.errorPrefix")(t("iot.demo.toastStartSimulationFailed"), toIotDemoErrorMessage(error))),
  });
};

export const useStopSimulationMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: iotDemoApi.stopSimulation,
    onSuccess: () => {
      toast.success(t("iot.demo.toastSimulationStopped"));
      void queryClient.invalidateQueries({
        queryKey: iotDemoKeys.simulationStatus,
      });
    },
    onError: (error) =>
      toast.error(t("iot.demo.errorPrefix")(t("iot.demo.toastStopSimulationFailed"), toIotDemoErrorMessage(error))),
  });
};

export const useTriggerHighTemperatureMutation = () => {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: iotDemoApi.triggerHighTemperature,
    onSuccess: () => toast.success(t("iot.demo.toastHighTemperaturePublished")),
    onError: (error) =>
      toast.error(t("iot.demo.errorPrefix")(t("iot.demo.toastHighTemperatureFailed"), toIotDemoErrorMessage(error))),
  });
};

export const useTriggerLowSoilMoistureMutation = () => {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: iotDemoApi.triggerLowSoilMoisture,
    onSuccess: () => toast.success(t("iot.demo.toastLowSoilMoisturePublished")),
    onError: (error) =>
      toast.error(t("iot.demo.errorPrefix")(t("iot.demo.toastLowSoilMoistureFailed"), toIotDemoErrorMessage(error))),
  });
};

export const useConfigAckSuccessMutation = () => {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: iotDemoApi.sendConfigAckSuccess,
    onSuccess: () => toast.success(t("iot.demo.toastConfigAckSuccessPublished")),
    onError: (error) =>
      toast.error(t("iot.demo.errorPrefix")(t("iot.demo.toastConfigAckSuccessFailed"), toIotDemoErrorMessage(error))),
  });
};

export const useConfigAckFailureMutation = () => {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: iotDemoApi.sendConfigAckFailure,
    onSuccess: () => toast.success(t("iot.demo.toastConfigAckFailurePublished")),
    onError: (error) =>
      toast.error(t("iot.demo.errorPrefix")(t("iot.demo.toastConfigAckFailureFailed"), toIotDemoErrorMessage(error))),
  });
};
