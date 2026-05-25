import { describe, expect, it } from "vitest";
import type { TFunction } from "../../../i18n/context";
import { parseDeviceQrPayload } from "./qrPayload";

const t = ((key: string) => {
  const messages: Record<string, string | ((fields: string) => string)> = {
    "iot.devices.onboarding.qrEmpty": "empty",
    "iot.devices.onboarding.qrInvalidJson": "invalid json",
    "iot.devices.onboarding.qrNotLeafyDevice": "not leafy",
    "iot.devices.onboarding.qrUnsupportedVersion": "unsupported version",
    "iot.devices.onboarding.qrMissingFields": (fields: string) => `missing ${fields}`,
    "iot.devices.onboarding.qrMissingRequired": "missing required",
  };
  return messages[key] ?? key;
}) as TFunction;

describe("parseDeviceQrPayload", () => {
  it("accepts legacy payloads", () => {
    const result = parseDeviceQrPayload(
      JSON.stringify({
        deviceUid: " leafy-prototype-001 ",
        deviceCode: " LEAFY-PROTO-001 ",
        deviceType: " ESP32_CAM_SENSOR ",
      }),
      t,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data).toEqual({
        deviceUid: "leafy-prototype-001",
        deviceCode: "LEAFY-PROTO-001",
        deviceType: "ESP32_CAM_SENSOR",
        model: "",
        firmwareVersion: "",
        setupApSsid: "",
        setupPortalUrl: "",
      });
    }
  });

  it("accepts Leafy QR v1 payloads and strips unexpected fields", () => {
    const result = parseDeviceQrPayload(
      JSON.stringify({
        type: "LEAFY_IOT_DEVICE",
        version: 1,
        deviceUid: "leafy-prototype-001",
        deviceCode: "LEAFY-PROTO-001",
        deviceType: "ESP32_CAM_SENSOR",
        model: "Leafy IoT Module V1",
        firmwareVersion: "leafy-esp32-0.1.0",
        setupApSsid: "Leafy-Setup-YPE001",
        setupPortalUrl: "http://192.168.4.1",
        mqttPass: "secret",
        wifiPass: "secret",
      }),
      t,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data).toEqual({
        deviceUid: "leafy-prototype-001",
        deviceCode: "LEAFY-PROTO-001",
        deviceType: "ESP32_CAM_SENSOR",
        model: "Leafy IoT Module V1",
        firmwareVersion: "leafy-esp32-0.1.0",
        setupApSsid: "Leafy-Setup-YPE001",
        setupPortalUrl: "http://192.168.4.1",
      });
      expect(result.data.data).not.toHaveProperty("mqttPass");
      expect(result.data.data).not.toHaveProperty("wifiPass");
    }
  });

  it("rejects unsupported type and version", () => {
    expect(
      parseDeviceQrPayload(
        JSON.stringify({
          type: "OTHER",
          version: 1,
          deviceUid: "uid",
          deviceCode: "code",
          deviceType: "type",
        }),
        t,
      ),
    ).toEqual({ success: false, error: "not leafy" });

    expect(
      parseDeviceQrPayload(
        JSON.stringify({
          type: "LEAFY_IOT_DEVICE",
          version: 2,
          deviceUid: "uid",
          deviceCode: "code",
          deviceType: "type",
        }),
        t,
      ),
    ).toEqual({ success: false, error: "unsupported version" });
  });

  it("rejects missing identity fields", () => {
    expect(parseDeviceQrPayload(JSON.stringify({ deviceUid: "uid" }), t)).toEqual({
      success: false,
      error: "missing deviceCode, deviceType",
    });
  });
});
