import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../lib/routes";
import { renderWithClient } from "../../../test/render";
import { RagTreatmentPlansPage } from "./RagTreatmentPlansPage";

const ragApiMocks = vi.hoisted(() => ({
  getRagTreatmentPlans: vi.fn(),
  getRagTreatmentPlanById: vi.fn(),
}));

const createDialogApiMocks = vi.hoisted(() => ({
  getMyProfile: vi.fn(),
  getPlants: vi.fn(),
  getPlotsByOwner: vi.fn(),
  getZonesByPlot: vi.fn(),
  createTreatmentPlan: vi.fn(),
}));

vi.mock("../api/rag.api", () => ({
  ragApi: {
    getRagTreatmentPlans: ragApiMocks.getRagTreatmentPlans,
    getRagTreatmentPlanById: ragApiMocks.getRagTreatmentPlanById,
  },
}));

vi.mock("../../settings/api/profile.api", () => ({
  profileApi: {
    getMyProfile: createDialogApiMocks.getMyProfile,
  },
}));

vi.mock("../../plant-management/api/plant.api", () => ({
  plantApi: {
    getPlants: createDialogApiMocks.getPlants,
  },
}));

vi.mock("../../farm-management/api/farm.api", () => ({
  farmApi: {
    getPlotsByOwner: createDialogApiMocks.getPlotsByOwner,
    getZonesByPlot: createDialogApiMocks.getZonesByPlot,
  },
}));

vi.mock("../../plant-management/api/treatment-plan.api", () => ({
  treatmentPlanApi: {
    createTreatmentPlan: createDialogApiMocks.createTreatmentPlan,
  },
}));

const plan = {
  planId: "plan-1",
  title: "Kế hoạch xử lý gỉ sắt",
  diseaseName: "Gỉ sắt",
  summary: "Theo dõi và xử lý trong 7 ngày.",
  status: "DRAFT",
  createdAt: "2026-04-26T10:00:00Z",
  steps: [{ title: "Tỉa lá" }],
};

beforeEach(() => {
  ragApiMocks.getRagTreatmentPlans.mockReset();
  ragApiMocks.getRagTreatmentPlanById.mockReset();
  createDialogApiMocks.getMyProfile.mockResolvedValue({
    data: { data: { id: "profile-1" } },
  });
  createDialogApiMocks.getPlants.mockResolvedValue([]);
  createDialogApiMocks.getPlotsByOwner.mockResolvedValue([]);
  createDialogApiMocks.getZonesByPlot.mockResolvedValue([]);
  createDialogApiMocks.createTreatmentPlan.mockResolvedValue({
    id: "created-plan",
    status: "PENDING",
  });
});

describe("RagTreatmentPlansPage", () => {
  it("renders list plans and detail dialog", async () => {
    const user = userEvent.setup();
    ragApiMocks.getRagTreatmentPlans.mockResolvedValue([plan]);
    ragApiMocks.getRagTreatmentPlanById.mockResolvedValue(plan);

    renderWithClient(<RagTreatmentPlansPage />, {
      route: ROUTES.DASHBOARD.RAG_TREATMENT_PLANS,
    });

    expect(await screen.findByText("Kế hoạch xử lý gỉ sắt")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xem chi tiết" }));

    expect(await screen.findByText("Chi tiết kế hoạch")).toBeInTheDocument();
    expect(ragApiMocks.getRagTreatmentPlanById).toHaveBeenCalledWith("plan-1");
  });

  it("opens create treatment plan dialog from detail", async () => {
    const user = userEvent.setup();
    ragApiMocks.getRagTreatmentPlans.mockResolvedValue([plan]);
    ragApiMocks.getRagTreatmentPlanById.mockResolvedValue(plan);

    renderWithClient(<RagTreatmentPlansPage />, {
      route: ROUTES.DASHBOARD.RAG_TREATMENT_PLANS,
    });

    await user.click(await screen.findByRole("button", { name: "Xem chi tiết" }));
    await user.click(
      await screen.findByRole("button", { name: "Tạo kế hoạch điều trị" }),
    );

    expect(
      await screen.findByText(
        "Review kế hoạch AI trước khi tạo treatment plan thật và sinh lịch chăm sóc.",
      ),
    ).toBeInTheDocument();
  });

  it("renders empty state", async () => {
    ragApiMocks.getRagTreatmentPlans.mockResolvedValue([]);

    renderWithClient(<RagTreatmentPlansPage />, {
      route: ROUTES.DASHBOARD.RAG_TREATMENT_PLANS,
    });

    expect(await screen.findByText("Chưa có kế hoạch AI nào")).toBeInTheDocument();
  });

  it("renders error state", async () => {
    ragApiMocks.getRagTreatmentPlans.mockRejectedValue(new Error("boom"));

    renderWithClient(<RagTreatmentPlansPage />, {
      route: ROUTES.DASHBOARD.RAG_TREATMENT_PLANS,
    });

    expect(
      await screen.findByText(
        "Không tải được danh sách kế hoạch AI. Vui lòng thử lại.",
      ),
    ).toBeInTheDocument();
  });
});
