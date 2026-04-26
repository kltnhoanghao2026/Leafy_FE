import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithClient } from "../../../test/render";
import { CreateTreatmentPlanFromRagDialog } from "./CreateTreatmentPlanFromRagDialog";

const apiMocks = vi.hoisted(() => ({
  getMyProfile: vi.fn(),
  getPlants: vi.fn(),
  getPlotsByOwner: vi.fn(),
  getZonesByPlot: vi.fn(),
  createTreatmentPlan: vi.fn(),
}));

vi.mock("../../settings/api/profile.api", () => ({
  profileApi: {
    getMyProfile: apiMocks.getMyProfile,
  },
}));

vi.mock("../../plant-management/api/plant.api", () => ({
  plantApi: {
    getPlants: apiMocks.getPlants,
  },
}));

vi.mock("../../farm-management/api/farm.api", () => ({
  farmApi: {
    getPlotsByOwner: apiMocks.getPlotsByOwner,
    getZonesByPlot: apiMocks.getZonesByPlot,
  },
}));

vi.mock("../../plant-management/api/treatment-plan.api", () => ({
  treatmentPlanApi: {
    createTreatmentPlan: apiMocks.createTreatmentPlan,
  },
}));

const ragPlan = {
  planId: "rag-plan-1",
  title: "Kế hoạch xử lý gỉ sắt",
  diseaseName: "Gỉ sắt",
  summary: "Phun phòng và tỉa lá bệnh.",
  schedule: [
    {
      title: "Tỉa lá bệnh",
      description: "Loại bỏ lá nhiễm nặng.",
      dayOffset: 0,
      eventType: "PRUNING",
    },
  ],
};

beforeEach(() => {
  apiMocks.getMyProfile.mockResolvedValue({
    data: { data: { id: "profile-1" } },
  });
  apiMocks.getPlants.mockResolvedValue([
    {
      id: "plant-1",
      plantNumber: "P-001",
      nickName: "Cà phê A",
      speciesId: "species-1",
      farmPlotId: "plot-1",
      plantStatus: "ACTIVE",
    },
  ]);
  apiMocks.getPlotsByOwner.mockResolvedValue([
    {
      id: "plot-1",
      ownerProfileId: "profile-1",
      name: "Vườn chính",
      code: "PLOT-1",
      status: "ACTIVE",
    },
  ]);
  apiMocks.getZonesByPlot.mockResolvedValue([
    {
      id: "zone-1",
      farmPlotId: "plot-1",
      zoneName: "Khu A",
      status: "ACTIVE",
    },
  ]);
  apiMocks.createTreatmentPlan.mockResolvedValue({
    id: "plan-created-1",
    plantId: "plant-1",
    farmPlotId: "plot-1",
    farmZoneId: "zone-1",
    diseaseName: "Gỉ sắt",
    plantEventIds: ["event-1"],
    status: "PENDING",
  });
});

describe("CreateTreatmentPlanFromRagDialog", () => {
  it("prefills plant, farm plot, and zone from disease context", async () => {
    renderWithClient(
      <CreateTreatmentPlanFromRagDialog
        plan={ragPlan}
        context={{
          diseaseClassName: "rust",
          diseaseLabel: "Gỉ sắt",
          confidence: 0.92,
          plantId: "plant-1",
          plantName: "Cà phê A",
          farmPlotId: "plot-1",
          farmPlotName: "Vườn chính",
          farmZoneId: "zone-1",
          farmZoneName: "Khu A",
        }}
        onClose={vi.fn()}
      />,
    );

    await screen.findByRole("option", { name: "Cà phê A" });
    await screen.findByRole("option", { name: "Khu A" });
    expect(screen.getByLabelText("Cây trồng")).toHaveValue("plant-1");
    expect(screen.getByLabelText("Vườn")).toHaveValue("plot-1");
    expect(screen.getByLabelText("Khu vực")).toHaveValue("zone-1");
  });

  it("renders AI plan info, allows scope selection, and submits plant treatment plan", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <CreateTreatmentPlanFromRagDialog plan={ragPlan} onClose={vi.fn()} />,
    );

    expect(screen.getByText("Tạo kế hoạch điều trị")).toBeInTheDocument();
    expect(screen.getByText("Kế hoạch xử lý gỉ sắt")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Gỉ sắt")).toBeInTheDocument();

    await screen.findByRole("option", { name: "Cà phê A" });
    await user.selectOptions(screen.getByLabelText("Cây trồng"), "plant-1");
    await waitFor(() => {
      expect(screen.getByLabelText("Vườn")).toHaveValue("plot-1");
    });
    await screen.findByRole("option", { name: "Khu A" });
    await user.selectOptions(screen.getByLabelText("Khu vực"), "zone-1");
    await user.clear(screen.getByDisplayValue("Tỉa lá bệnh"));
    await user.type(screen.getByLabelText("Tiêu đề/note"), "Tỉa lá và thu gom");
    await user.click(screen.getByRole("button", { name: "Tạo kế hoạch" }));

    await waitFor(() => {
      expect(apiMocks.createTreatmentPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          ragPlanId: "rag-plan-1",
          plantId: "plant-1",
          farmPlotId: "plot-1",
          farmZoneId: "zone-1",
          diseaseName: "Gỉ sắt",
          schedule: [
            expect.objectContaining({
              eventType: "PRUNING",
              note: "Tỉa lá và thu gom",
              isPlanned: true,
            }),
          ],
        }),
      );
    });
    expect(
      await screen.findByText("Kế hoạch điều trị đã được tạo thành công."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Xem kế hoạch điều trị" }),
    ).toHaveAttribute("href", "/dashboard/treatment-plans/plan-created-1");
  });

  it("shows validation error when plan has no schedule", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <CreateTreatmentPlanFromRagDialog
        plan={{ planId: "rag-plan-2", diseaseName: "Nhện đỏ" }}
        onClose={vi.fn()}
      />,
    );

    await screen.findByRole("option", { name: "Vườn chính" });
    await user.selectOptions(screen.getByLabelText("Vườn"), "plot-1");
    expect(screen.getByRole("button", { name: "Tạo kế hoạch" })).toBeDisabled();
    expect(
      screen.getByText(
        "Kế hoạch AI không có schedule. Phase này cần ít nhất một bước để plant-management sinh PlantEvent.",
      ),
    ).toBeInTheDocument();
  });
});
