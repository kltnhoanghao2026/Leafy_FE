import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../lib/routes";
import { renderWithClient } from "../../../test/render";
import { PlantEventsCalendarPage } from "./PlantEventsCalendarPage";

const apiMocks = vi.hoisted(() => ({
  getPlantEventsCalendar: vi.fn(),
  getMyProfile: vi.fn(),
  getPlotsByOwner: vi.fn(),
  getZonesByPlot: vi.fn(),
  getPlants: vi.fn(),
  updatePlantEvent: vi.fn(),
}));

vi.mock("../api/plant-event.api", () => ({
  plantEventApi: {
    getPlantEventsCalendar: apiMocks.getPlantEventsCalendar,
    updatePlantEvent: apiMocks.updatePlantEvent,
  },
}));

vi.mock("../api/plant.api", () => ({
  plantApi: {
    getPlants: apiMocks.getPlants,
  },
}));

vi.mock("../../settings/api/profile.api", () => ({
  profileApi: {
    getMyProfile: apiMocks.getMyProfile,
  },
}));

vi.mock("../../farm-management/api/farm.api", () => ({
  farmApi: {
    getPlotsByOwner: apiMocks.getPlotsByOwner,
    getZonesByPlot: apiMocks.getZonesByPlot,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  apiMocks.getPlantEventsCalendar.mockResolvedValue([
    {
      id: "event-1",
      plantId: "plant-1",
      farmPlotId: "plot-1",
      farmZoneId: "zone-1",
      eventType: "SCOUTING",
      note: "Kiểm tra lá",
      description: "Kiểm tra mặt dưới lá",
      planned: true,
      calculatedStartDate: "2026-04-27",
      calculatedEndDate: "2026-04-27",
      sourcePlanId: "plan-1",
      active: true,
    },
  ]);
  apiMocks.getMyProfile.mockResolvedValue({ data: { data: { id: "profile-1" } } });
  apiMocks.getPlotsByOwner.mockResolvedValue([
    { id: "plot-1", name: "Vườn chính", ownerProfileId: "profile-1" },
  ]);
  apiMocks.getZonesByPlot.mockResolvedValue([
    { id: "zone-1", zoneName: "Khu A", farmPlotId: "plot-1" },
  ]);
  apiMocks.updatePlantEvent.mockResolvedValue({
    id: "event-1",
    note: "Kiểm tra lá cập nhật",
  });
  apiMocks.getPlants.mockResolvedValue([
    {
      id: "plant-1",
      nickName: "Cà phê A",
      plantNumber: "P-001",
      farmPlotId: "plot-1",
      speciesId: "species-1",
      plantStatus: "ACTIVE",
    },
  ]);
});

describe("PlantEventsCalendarPage", () => {
  it("renders grouped events and supports filters", async () => {
    const user = userEvent.setup();
    renderWithClient(<PlantEventsCalendarPage />, {
      route: ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR,
    });

    expect((await screen.findAllByText("Kiểm tra lá")).length).toBeGreaterThan(0);
    await screen.findByRole("option", { name: "Vườn chính" });
    await user.selectOptions(screen.getByLabelText("Vườn"), "plot-1");
    expect(await screen.findByRole("option", { name: "Khu A" })).toBeInTheDocument();
  });

  it("renders week view and moves between weeks", async () => {
    const user = userEvent.setup();
    renderWithClient(<PlantEventsCalendarPage />, {
      route: ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR,
    });

    expect(await screen.findByText("Week view")).toBeInTheDocument();
    expect((await screen.findAllByText("Kiểm tra lá")).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Tuần sau" }));
    expect(apiMocks.getPlantEventsCalendar).toHaveBeenLastCalledWith(
      expect.objectContaining({
        startDate: expect.any(String),
        endDate: expect.any(String),
      }),
    );
    await user.click(screen.getByRole("button", { name: "Tuần trước" }));
    await user.click(screen.getByRole("button", { name: "Tuần này" }));
  });

  it("renders scope names and edits event", async () => {
    const user = userEvent.setup();
    renderWithClient(<PlantEventsCalendarPage />, {
      route: ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR,
    });

    expect((await screen.findAllByText("Kiểm tra lá")).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Chỉnh sửa event" }));
    await user.clear(screen.getByDisplayValue("Kiểm tra lá"));
    await user.type(screen.getByLabelText(/Tiêu đề\/note|TiÃªu Ä‘á»\/note/), "Kiểm tra lá cập nhật");
    await user.click(screen.getByRole("button", { name: /Lưu thay đổi|LÆ°u thay Ä‘á»•i/ }));

    expect(screen.getAllByText(/VÆ°á»n chÃ­nh|Vườn chính/).length).toBeGreaterThan(0);
    expect(apiMocks.updatePlantEvent).toHaveBeenCalledWith(
      "event-1",
      expect.objectContaining({
        note: "Kiểm tra lá cập nhật",
        farmPlotId: "plot-1",
        farmZoneId: "zone-1",
      }),
    );
  });

  it("renders empty state", async () => {
    apiMocks.getPlantEventsCalendar.mockResolvedValueOnce([]);
    renderWithClient(<PlantEventsCalendarPage />, {
      route: ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR,
    });

    expect(
      await screen.findByText("Không có lịch trong khoảng đã chọn"),
    ).toBeInTheDocument();
  });

  it("renders error state", async () => {
    apiMocks.getPlantEventsCalendar.mockRejectedValueOnce(new Error("boom"));
    renderWithClient(<PlantEventsCalendarPage />, {
      route: ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR,
    });

    expect(await screen.findByText("Không tải được lịch chăm sóc.")).toBeInTheDocument();
  });
});
