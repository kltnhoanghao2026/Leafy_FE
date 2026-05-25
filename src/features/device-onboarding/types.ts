export type DeviceOnboardingMode = "qr" | "manual";

export type DeviceOnboardingStep =
  | "choose"
  | "scan"
  | "manual"
  | "location"
  | "connecting"
  | "success";

export interface DeviceOnboardingDraft {
  deviceUid: string;
  deviceCode: string;
  deviceType: string;
  model: string;
  firmwareVersion: string;
  setupApSsid: string;
  setupPortalUrl: string;
  deviceName: string;
  farmPlotId: string;
  zoneId: string;
  farmPlotName?: string;
  zoneName?: string;
}

export interface DeviceQrPayload {
  type?: "LEAFY_IOT_DEVICE";
  version?: 1;
  deviceUid: string;
  deviceCode: string;
  deviceType: string;
  model?: string | null;
  firmwareVersion?: string | null;
  setupApSsid?: string | null;
  setupPortalUrl?: string | null;
}

export interface DeviceOnboardingResult {
  deviceId: string;
  deviceUid: string;
  deviceCode: string;
  deviceName: string;
  deviceType: string;
  farmPlotId: string;
  zoneId: string;
  farmPlotName?: string;
  zoneName?: string;
  status: string | null;
  provisioningStatus: string | null;
}
