import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithClient } from "../../../test/render";
import type { DeviceResponse } from "../../../types/iot";
import { EditDeviceModal } from "./EditDeviceModal";

vi.mock("../../device-onboarding/components/FarmLocationSelector", () => ({
  FarmLocationSelector: ({
    onFarmPlotChange,
    onZoneChange,
  }: {
    onFarmPlotChange: (farmPlotId: string) => void;
    onZoneChange: (zoneId: string) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onFarmPlotChange("farm-2")}>
        Set farm
      </button>
      <button type="button" onClick={() => onZoneChange("zone-2")}>
        Set zone
      </button>
    </div>
  ),
}));

const device: DeviceResponse = {
  id: "device-1",
  deviceUid: "leafy-cam-001",
  deviceCode: "CAM-001",
  deviceName: "Leafy Camera",
  deviceType: "ESP32_CAM",
  firmwareVersion: "1.0.0",
  isActive: true,
  status: "ONLINE",
  provisioningStatus: "CLAIMED",
  ownerUserId: "user-1",
  farmPlotId: "farm-1",
  zoneId: "zone-1",
  lastSeenAt: "2026-05-19T08:00:00Z",
};

describe("EditDeviceModal", () => {
  it("renders current device name", () => {
    renderWithClient(
      <EditDeviceModal
        open
        device={device}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Leafy Camera")).toBeInTheDocument();
  });

  it("validates blank device name", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithClient(
      <EditDeviceModal
        open
        device={device}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByDisplayValue("Leafy Camera"));

    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits changed metadata without immutable device identity fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderWithClient(
      <EditDeviceModal
        open
        device={device}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const nameInput = screen.getByDisplayValue("Leafy Camera");
    await user.clear(nameInput);
    await user.type(nameInput, "Greenhouse Camera");
    await user.click(screen.getByRole("button", { name: "Set farm" }));
    await user.click(screen.getByRole("button", { name: "Set zone" }));
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        deviceName: "Greenhouse Camera",
        farmPlotId: "farm-2",
        zoneId: "zone-2",
      }),
    );
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("deviceUid");
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("deviceCode");
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("deviceType");
  });
});
