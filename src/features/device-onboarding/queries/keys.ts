import type { MyDevicesParams } from "../../../types/iot";

export const onboardingDeviceKeys = {
  all: () => ["iot-onboarding-devices"] as const,
  myDevices: (params: MyDevicesParams) =>
    [...onboardingDeviceKeys.all(), "my-devices", params] as const,
};
