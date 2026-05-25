import { useMemo } from "react";
import { useDeviceLatestReadings } from "../../device-detail/queries";
import { useZoneOverview } from "../../metrics-view/queries";

export interface SensorTypeOption {
  id: string;
  code: string;
  name: string;
  unit: string;
}

export const useInferredSensorTypeOptions = (
  deviceId: string,
  zoneId: string,
) => {
  const deviceReadingsQuery = useDeviceLatestReadings(deviceId, undefined, !!deviceId);
  const zoneOverviewQuery = useZoneOverview(zoneId, !deviceId && !!zoneId);

  const sensorOptions = useMemo<SensorTypeOption[]>(() => {
    const readings = deviceId
      ? (deviceReadingsQuery.data ?? [])
      : (zoneOverviewQuery.data?.latestReadings ?? []);
    const byId = new Map<string, SensorTypeOption>();

    readings.forEach((reading) => {
      if (!reading.sensorTypeId) {
        return;
      }

      byId.set(reading.sensorTypeId, {
        id: reading.sensorTypeId,
        code: reading.sensorCode,
        name: reading.sensorName || reading.sensorCode,
        unit: reading.unit || "",
      });
    });

    return Array.from(byId.values());
  }, [deviceId, deviceReadingsQuery.data, zoneOverviewQuery.data]);

  return {
    sensorOptions,
    isLoading: deviceId
      ? deviceReadingsQuery.isLoading
      : zoneOverviewQuery.isLoading,
    isError: deviceId ? deviceReadingsQuery.isError : zoneOverviewQuery.isError,
  };
};
