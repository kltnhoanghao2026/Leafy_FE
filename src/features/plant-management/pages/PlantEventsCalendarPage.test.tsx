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
}));

vi.mock("../api/plant-event.api", () => ({
  plantEventApi: {
    getPlantEventsCalendar: apiMocks.getPlantEventsCalendar,
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
      eventType: "SCOUTING",
      note: "Kiểm tra lá",
      planned: true,
      calculatedStartDate: "2026-04-27",
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

    expect(await screen.findByText("Kiểm tra lá")).toBeInTheDocument();
    await screen.findByRole("option", { name: "Vườn chính" });
    await user.selectOptions(screen.getByLabelText("Vườn"), "plot-1");
    expect(await screen.findByRole("option", { name: "Khu A" })).toBeInTheDocument();
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
