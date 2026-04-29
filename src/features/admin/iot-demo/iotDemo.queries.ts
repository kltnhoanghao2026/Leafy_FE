import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { iotDemoApi, toIotDemoErrorMessage } from "./iotDemo.api";

const iotDemoKeys = {
  simulationStatus: ["iot-demo", "simulation-status"] as const,
};

const successToast = (message: string) => toast.success(message);
const errorToast = (message: string, error: unknown) =>
  toast.error(`${message}: ${toIotDemoErrorMessage(error)}`);

export const useSimulationStatusQuery = () =>
  useQuery({
    queryKey: iotDemoKeys.simulationStatus,
    queryFn: iotDemoApi.getSimulationStatus,
  });

export const useBootstrapMinimalMutation = () =>
  useMutation({
    mutationFn: iotDemoApi.bootstrapMinimal,
    onSuccess: () => successToast("Bootstrap minimal completed"),
    onError: (error) => errorToast("Bootstrap minimal failed", error),
  });

export const useBootstrapFullMutation = () =>
  useMutation({
    mutationFn: iotDemoApi.bootstrapFull,
    onSuccess: () => successToast("Bootstrap full completed"),
    onError: (error) => errorToast("Bootstrap full failed", error),
  });

export const useSeedHistory7dMutation = () =>
  useMutation({
    mutationFn: iotDemoApi.seedHistory7d,
    onSuccess: () => successToast("Seed last 7 days completed"),
    onError: (error) => errorToast("Seed last 7 days failed", error),
  });

export const useSeedHistory30dMutation = () =>
  useMutation({
    mutationFn: iotDemoApi.seedHistory30d,
    onSuccess: () => successToast("Seed last 30 days completed"),
    onError: (error) => errorToast("Seed last 30 days failed", error),
  });

export const useStartSimulationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: iotDemoApi.startSimulation,
    onSuccess: () => {
      successToast("Simulation started");
      void queryClient.invalidateQueries({
        queryKey: iotDemoKeys.simulationStatus,
      });
    },
    onError: (error) => errorToast("Start simulation failed", error),
  });
};

export const useStopSimulationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: iotDemoApi.stopSimulation,
    onSuccess: () => {
      successToast("Simulation stopped");
      void queryClient.invalidateQueries({
        queryKey: iotDemoKeys.simulationStatus,
      });
    },
    onError: (error) => errorToast("Stop simulation failed", error),
  });
};

export const useTriggerHighTemperatureMutation = () =>
  useMutation({
    mutationFn: iotDemoApi.triggerHighTemperature,
    onSuccess: () => successToast("High temperature scenario published"),
    onError: (error) => errorToast("High temperature scenario failed", error),
  });

export const useTriggerLowSoilMoistureMutation = () =>
  useMutation({
    mutationFn: iotDemoApi.triggerLowSoilMoisture,
    onSuccess: () => successToast("Low soil moisture scenario published"),
    onError: (error) => errorToast("Low soil moisture scenario failed", error),
  });

export const useConfigAckSuccessMutation = () =>
  useMutation({
    mutationFn: iotDemoApi.sendConfigAckSuccess,
    onSuccess: () => successToast("Config ACK success published"),
    onError: (error) => errorToast("Config ACK success failed", error),
  });

export const useConfigAckFailureMutation = () =>
  useMutation({
    mutationFn: iotDemoApi.sendConfigAckFailure,
    onSuccess: () => successToast("Config ACK failure published"),
    onError: (error) => errorToast("Config ACK failure failed", error),
  });
