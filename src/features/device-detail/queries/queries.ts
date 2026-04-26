import { useQuery } from "@tanstack/react-query";
import { collectorApi } from "../../../lib/api/collectorApi";
import type { ChartRange } from "../../../types/iot";
import { deviceKeys } from "./keys";

export const useDeviceDetail = (deviceId: string, enabled = true) =>
  useQuery({
    queryKey: deviceKeys.detail(deviceId),
    queryFn: () => collectorApi.getDeviceDetail(deviceId),
    select: (response) => response.data,
    enabled: enabled && !!deviceId,
  });

export const useDeviceLatestReadings = (deviceId: string, enabled = true) =>
  useQuery({
    queryKey: deviceKeys.latestReadings(deviceId),
    queryFn: () => collectorApi.getDeviceLatestReadings(deviceId),
    select: (response) => response.data,
    enabled: enabled && !!deviceId,
  });

export const useDeviceChart = (
  deviceId: string,
  sensorCode: string,
  range: ChartRange,
  enabled = true,
) =>
  useQuery({
    queryKey: deviceKeys.chart(deviceId, sensorCode, range),
    queryFn: () => collectorApi.getDeviceChart(deviceId, sensorCode, range),
    select: (response) => response.data,
    enabled: enabled && !!deviceId && !!sensorCode && !!range,
  });

export const useDeviceConfig = (deviceId: string, enabled = true) =>
  useQuery({
    queryKey: deviceKeys.config(deviceId),
    queryFn: () => collectorApi.getDeviceConfig(deviceId),
    select: (response) => response.data,
    enabled: enabled && !!deviceId,
  });

export const useDeviceMedia = (
  deviceId: string,
  enabled = true,
  refetchInterval?: number | false,
) =>
  useQuery({
    queryKey: deviceKeys.media(deviceId),
    queryFn: () => collectorApi.getDeviceMedia(deviceId),
    select: (response) => response.data,
    enabled: enabled && !!deviceId,
    refetchInterval,
  });
