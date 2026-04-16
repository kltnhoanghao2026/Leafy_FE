import { useQuery } from "@tanstack/react-query";
import { collectorApi } from "../../../lib/api/collectorApi";
import type { MyDevicesParams } from "../../../types/iot";
import { onboardingDeviceKeys } from "./keys";

export const useMyDevices = (params: MyDevicesParams, enabled = true) =>
  useQuery({
    queryKey: onboardingDeviceKeys.myDevices(params),
    queryFn: () => collectorApi.getMyDevices(params),
    select: (response) => response.data,
    enabled,
  });
