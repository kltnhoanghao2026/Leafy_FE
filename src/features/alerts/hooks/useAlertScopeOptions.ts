import { useMemo } from "react";
import { useMyDevices } from "../../device-onboarding/queries";
import {
  useFarmPlots,
  useFarmZones,
  useFarmZonesByOwner,
} from "../../farm-management/queries";
import type { FarmPlotResponse, FarmZoneResponse } from "../../farm-management/types";
import { useMyProfile } from "../../settings/queries/queries";
import type { DeviceResponse, MyDevicesParams } from "../../../types/iot";

interface UseAlertScopeOptionsArgs {
  farmPlotId?: string;
  zoneId?: string;
  enabled?: boolean;
}

const deviceListParams = (
  farmPlotId?: string,
  zoneId?: string,
): MyDevicesParams => ({
  page: 0,
  size: 100,
  sortBy: "deviceName",
  sortDir: "asc",
  farmPlotId: farmPlotId || undefined,
  zoneId: zoneId || undefined,
});

const toMap = <T extends { id: string }>(items: T[]) =>
  new Map(items.map((item) => [item.id, item]));

export const useAlertScopeOptions = ({
  farmPlotId = "",
  zoneId = "",
  enabled = true,
}: UseAlertScopeOptionsArgs) => {
  const profileQuery = useMyProfile(enabled);
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plotsQuery = useFarmPlots(ownerProfileId, enabled && !!ownerProfileId);
  const zonesQuery = useFarmZones(farmPlotId, enabled && !!farmPlotId);
  const allZonesQuery = useFarmZonesByOwner(ownerProfileId, enabled && !!ownerProfileId);
  const devicesQuery = useMyDevices(
    deviceListParams(farmPlotId, zoneId),
    enabled,
  );

  const farmPlots = useMemo(
    () => plotsQuery.data ?? [],
    [plotsQuery.data],
  );
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);
  const allZones = useMemo(
    () => allZonesQuery.data ?? [],
    [allZonesQuery.data],
  );
  const devices = useMemo(
    () => devicesQuery.data?.items ?? [],
    [devicesQuery.data],
  );

  const farmPlotMap = useMemo<Map<string, FarmPlotResponse>>(
    () => toMap(farmPlots),
    [farmPlots],
  );
  const zoneMap = useMemo<Map<string, FarmZoneResponse>>(
    () => toMap([...allZones, ...zones]),
    [allZones, zones],
  );
  const deviceMap = useMemo<Map<string, DeviceResponse>>(
    () => toMap(devices),
    [devices],
  );

  return {
    profileQuery,
    plotsQuery,
    zonesQuery,
    allZonesQuery,
    devicesQuery,
    farmPlots,
    zones,
    allZones,
    devices,
    farmPlotMap,
    zoneMap,
    deviceMap,
  };
};
