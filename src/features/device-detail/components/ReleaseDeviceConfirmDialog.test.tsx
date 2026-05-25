import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithClient } from "../../../test/render";
import { ReleaseDeviceConfirmDialog } from "./ReleaseDeviceConfirmDialog";

describe("ReleaseDeviceConfirmDialog", () => {
  it("renders release warning text", () => {
    renderWithClient(
      <ReleaseDeviceConfirmDialog
        open
        deviceName="Leafy Camera"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("Gỡ thiết bị khỏi tài khoản?")).toBeInTheDocument();
    expect(screen.getByText(/Thiết bị sẽ không còn thuộc tài khoản của bạn/)).toBeInTheDocument();
    expect(screen.getByText("Dữ liệu lịch sử không bị xóa.")).toBeInTheDocument();
  });

  it("calls confirm when clicking release", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithClient(
      <ReleaseDeviceConfirmDialog
        open
        deviceName="Leafy Camera"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Gỡ thiết bị" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables buttons while submitting", () => {
    renderWithClient(
      <ReleaseDeviceConfirmDialog
        open
        deviceName="Leafy Camera"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isSubmitting
      />,
    );

    expect(screen.getByRole("button", { name: "Hủy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Đang gỡ..." })).toBeDisabled();
  });
});
