import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../lib/routes";
import { renderWithClient } from "../../../test/render";
import { TreatmentPlanDetailPage } from "./TreatmentPlanDetailPage";

const apiMocks = vi.hoisted(() => ({
  getTreatmentPlanById: vi.fn(),
  updateTreatmentPlanStatus: vi.fn(),
  deleteTreatmentPlan: vi.fn(),
  getPlantEventsByPlan: vi.fn(),
  updatePlantEvent: vi.fn(),
  deletePlantEvent: vi.fn(),
  getMyProfile: vi.fn(),
  getPlotsByOwner: vi.fn(),
  getPlantById: vi.fn(),
}));

vi.mock("../api/treatment-plan.api", () => ({
  treatmentPlanApi: {
    getTreatmentPlanById: apiMocks.getTreatmentPlanById,
    updateTreatmentPlanStatus: apiMocks.updateTreatmentPlanStatus,
    deleteTreatmentPlan: apiMocks.deleteTreatmentPlan,
  },
}));

vi.mock("../api/plant-event.api", () => ({
  plantEventApi: {
    getPlantEventsByPlan: apiMocks.getPlantEventsByPlan,
    updatePlantEvent: apiMocks.updatePlantEvent,
    deletePlantEvent: apiMocks.deletePlantEvent,
  },
}));

vi.mock("../api/plant.api", () => ({
  plantApi: {
    getPlantById: apiMocks.getPlantById,
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
  },
}));

const plan = {
  id: "plan-1",
  ragPlanId: "rag-plan-1",
  diseaseName: "Gỉ sắt",
  question: "Câu hỏi AI",
  source: "documents",
  plantId: "plant-1",
  farmPlotId: "plot-1",
  status: "PENDING",
  confidenceScore: 0.92,
  severityLevel: "HIGH",
  requiredInputs: ["Kéo"],
  safetyWarnings: ["Đeo găng"],
  successIndicators: "Lá mới khỏe",
  plantEventIds: ["event-1"],
  createdAt: "2026-04-26T10:00:00Z",
  active: true,
};

const event = {
  id: "event-1",
  plantId: "plant-1",
  farmPlotId: "plot-1",
  farmZoneId: null,
  eventType: "TREATMENT_APPLICATION",
  note: "Phun thuốc",
  description: "Phun theo khuyến cáo",
  planned: true,
  calculatedStartDate: "2026-04-27",
  calculatedEndDate: "2026-04-27",
  phiDays: 14,
  ppeRequired: "Găng tay",
  sourcePlanId: "rag-plan-1",
  active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  apiMocks.getTreatmentPlanById.mockResolvedValue(plan);
  apiMocks.updateTreatmentPlanStatus.mockResolvedValue({
    ...plan,
    status: "ACTIVE",
  });
  apiMocks.deleteTreatmentPlan.mockResolvedValue(undefined);
  apiMocks.getPlantEventsByPlan.mockResolvedValue([event]);
  apiMocks.updatePlantEvent.mockResolvedValue({ ...event, planned: false });
  apiMocks.deletePlantEvent.mockResolvedValue(undefined);
  apiMocks.getMyProfile.mockResolvedValue({ data: { data: { id: "profile-1" } } });
  apiMocks.getPlotsByOwner.mockResolvedValue([
    { id: "plot-1", name: "Vườn chính", ownerProfileId: "profile-1" },
  ]);
  apiMocks.getPlantById.mockResolvedValue({
    id: "plant-1",
    nickName: "Cà phê A",
    plantNumber: "P-001",
    farmPlotId: "plot-1",
    speciesId: "species-1",
    plantStatus: "ACTIVE",
  });
});

describe("TreatmentPlanDetailPage", () => {
  it("renders detail, AI source info and plant events", async () => {
    renderWithClient(<TreatmentPlanDetailPage />, {
      route: ROUTES.DASHBOARD.TREATMENT_PLAN_DETAIL("plan-1"),
    });

    expect(await screen.findByText("Gỉ sắt")).toBeInTheDocument();
    expect(screen.getByText("Thông tin nguồn AI")).toBeInTheDocument();
    expect(await screen.findByText("Phun thuốc")).toBeInTheDocument();
    expect(apiMocks.getPlantEventsByPlan).toHaveBeenCalledWith("rag-plan-1");
  });

  it("updates status and event planned flag", async () => {
    const user = userEvent.setup();
    renderWithClient(<TreatmentPlanDetailPage />, {
      route: ROUTES.DASHBOARD.TREATMENT_PLAN_DETAIL("plan-1"),
    });

    await screen.findByText("Gỉ sắt");
    await user.selectOptions(screen.getByLabelText("Đổi trạng thái kế hoạch"), "ACTIVE");
    await user.click(await screen.findByRole("button", { name: "Đánh dấu đã ghi nhận" }));

    await waitFor(() => {
      expect(apiMocks.updateTreatmentPlanStatus).toHaveBeenCalledWith(
        "plan-1",
        "ACTIVE",
      );
      expect(apiMocks.updatePlantEvent).toHaveBeenCalledWith("event-1", {
        isPlanned: false,
      });
    });
  });

  it("renders error state", async () => {
    apiMocks.getTreatmentPlanById.mockRejectedValueOnce(new Error("boom"));
    renderWithClient(<TreatmentPlanDetailPage />, {
      route: ROUTES.DASHBOARD.TREATMENT_PLAN_DETAIL("plan-1"),
    });

    expect(
      await screen.findByText("Không tải được chi tiết kế hoạch điều trị."),
    ).toBeInTheDocument();
  });
});
