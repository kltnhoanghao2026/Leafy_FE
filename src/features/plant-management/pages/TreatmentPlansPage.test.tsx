import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../lib/routes";
import { renderWithClient } from "../../../test/render";
import { TreatmentPlansPage } from "./TreatmentPlansPage";

const apiMocks = vi.hoisted(() => ({
  getMyTreatmentPlans: vi.fn(),
  updateTreatmentPlanStatus: vi.fn(),
  deleteTreatmentPlan: vi.fn(),
  getPlants: vi.fn(),
}));

vi.mock("../api/treatment-plan.api", () => ({
  treatmentPlanApi: {
    getMyTreatmentPlans: apiMocks.getMyTreatmentPlans,
    updateTreatmentPlanStatus: apiMocks.updateTreatmentPlanStatus,
    deleteTreatmentPlan: apiMocks.deleteTreatmentPlan,
  },
}));

vi.mock("../api/plant.api", () => ({
  plantApi: {
    getPlants: apiMocks.getPlants,
  },
}));

const plan = {
  id: "plan-1",
  diseaseName: "Gỉ sắt",
  question: "Lá cà phê bị gỉ sắt xử lý thế nào?",
  plantId: "plant-1",
  farmPlotId: "plot-1",
  status: "PENDING",
  severityLevel: "HIGH",
  plantEventIds: ["event-1"],
  createdAt: "2026-04-26T10:00:00Z",
  active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  apiMocks.getMyTreatmentPlans.mockResolvedValue([plan]);
  apiMocks.getPlants.mockResolvedValue([
    {
      id: "plant-1",
      plantNumber: "P-001",
      nickName: "Cà phê A",
      farmPlotId: "plot-1",
      speciesId: "species-1",
      plantStatus: "ACTIVE",
    },
  ]);
  apiMocks.updateTreatmentPlanStatus.mockResolvedValue({
    ...plan,
    status: "ACTIVE",
  });
  apiMocks.deleteTreatmentPlan.mockResolvedValue(undefined);
});

describe("TreatmentPlansPage", () => {
  it("renders list and updates status", async () => {
    const user = userEvent.setup();
    renderWithClient(<TreatmentPlansPage />, {
      route: ROUTES.DASHBOARD.TREATMENT_PLANS,
    });

    expect(await screen.findByText("Gỉ sắt")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Đổi trạng thái Gỉ sắt"), "ACTIVE");

    await waitFor(() => {
      expect(apiMocks.updateTreatmentPlanStatus).toHaveBeenCalledWith(
        "plan-1",
        "ACTIVE",
      );
    });
  });

  it("renders empty state", async () => {
    apiMocks.getMyTreatmentPlans.mockResolvedValueOnce([]);
    renderWithClient(<TreatmentPlansPage />, {
      route: ROUTES.DASHBOARD.TREATMENT_PLANS,
    });

    expect(await screen.findByText("Chưa có kế hoạch điều trị")).toBeInTheDocument();
  });

  it("renders error state", async () => {
    apiMocks.getMyTreatmentPlans.mockRejectedValueOnce(new Error("boom"));
    renderWithClient(<TreatmentPlansPage />, {
      route: ROUTES.DASHBOARD.TREATMENT_PLANS,
    });

    expect(
      await screen.findByText("Không tải được danh sách kế hoạch điều trị."),
    ).toBeInTheDocument();
  });

  it("uses confirmation dialog for delete", async () => {
    const user = userEvent.setup();
    renderWithClient(<TreatmentPlansPage />, {
      route: ROUTES.DASHBOARD.TREATMENT_PLANS,
    });

    await screen.findByText("Gỉ sắt");
    await user.click(screen.getAllByRole("button", { name: "Xóa" })[0]);
    expect(screen.getByText("Xóa kế hoạch điều trị")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Xóa" }).at(-1)!);

    await waitFor(() => {
      expect(apiMocks.deleteTreatmentPlan).toHaveBeenCalledWith("plan-1");
    });
  });
});
