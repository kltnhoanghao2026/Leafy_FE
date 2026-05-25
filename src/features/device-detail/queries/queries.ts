import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "../../../i18n";
import { collectorApi } from "../../../lib/api/collectorApi";
import type { ChartRange } from "../../../types/iot";
import {
  getIotChartRefetchInterval,
  IOT_POLLING_INTERVALS,
} from "../../iot/utils/iotPolling";
import { withMediaDisplay } from "../../iot/utils/iotDisplay";
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
    refetchInterval: IOT_POLLING_INTERVALS.latest,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
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
    refetchInterval: getIotChartRefetchInterval(range),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
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
) => {
  const { t } = useTranslation();

  return useQuery({
    queryKey: deviceKeys.media(deviceId),
    queryFn: () => collectorApi.getDeviceMedia(deviceId),
    select: (response) => response.data.map((event) => withMediaDisplay(t, event)),
    enabled: enabled && !!deviceId,
    refetchInterval,
  });
};
