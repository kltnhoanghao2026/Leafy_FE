import { z } from "zod";
import type { TFunction } from "../../../i18n/context";
import type { DeviceQrPayload } from "../types";

const deviceQrSchema = z.object({
  deviceUid: z.string().trim().min(1, "deviceUid is required"),
  deviceCode: z.string().trim().min(1, "deviceCode is required"),
  deviceType: z.string().trim().min(1, "deviceType is required"),
  model: z.string().trim().optional(),
});

export interface ParsedQrPayload {
  data: DeviceQrPayload;
  raw: string;
}

export const parseDeviceQrPayload = (
  input: string,
  t: TFunction,
): { success: true; data: ParsedQrPayload } | { success: false; error: string } => {
  const raw = input.trim();

  if (!raw) {
    return {
      success: false,
      error: t("iot.devices.onboarding.qrEmpty"),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      success: false,
      error: t("iot.devices.onboarding.qrInvalidJson"),
    };
  }

  const result = deviceQrSchema.safeParse(parsed);
  if (!result.success) {
    const missingFields = result.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean);

    return {
      success: false,
      error:
        missingFields.length > 0
          ? t("iot.devices.onboarding.qrMissingFields")(missingFields.join(", "))
          : t("iot.devices.onboarding.qrMissingRequired"),
    };
  }

  return {
    success: true,
    data: {
      raw,
      data: {
        deviceUid: result.data.deviceUid,
        deviceCode: result.data.deviceCode,
        deviceType: result.data.deviceType,
        model: result.data.model?.trim() || "",
      },
    },
  };
};
