import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../lib/routes";
import { renderWithClient } from "../../../test/render";
import { DiseaseDiagnosisPage } from "./DiseaseDiagnosisPage";

const predictionResponse = {
  predictions: [
    { className: "rust", confidenceScore: 0.86 },
    { className: "healthy", confidenceScore: 0.1 },
  ],
  modelName: "MobileNetV2",
  processingTimeMs: 120.4,
};

const diseaseApiMocks = vi.hoisted(() => ({
  getPredictHealth: vi.fn(),
  predictDisease: vi.fn(),
  getMyProfile: vi.fn(),
  getPlotsByOwner: vi.fn(),
  getZonesByPlot: vi.fn(),
  getPlants: vi.fn(),
}));

vi.mock("../api/disease.api", () => ({
  diseaseApi: {
    getPredictHealth: diseaseApiMocks.getPredictHealth,
    predictDisease: diseaseApiMocks.predictDisease,
  },
}));

vi.mock("../../settings/api/profile.api", () => ({
  profileApi: {
    getMyProfile: diseaseApiMocks.getMyProfile,
  },
}));

vi.mock("../../farm-management/api/farm.api", () => ({
  farmApi: {
    getPlotsByOwner: diseaseApiMocks.getPlotsByOwner,
    getZonesByPlot: diseaseApiMocks.getZonesByPlot,
  },
}));

vi.mock("../../plant-management/api/plant.api", () => ({
  plantApi: {
    getPlants: diseaseApiMocks.getPlants,
  },
}));

const uploadInput = () => screen.getByLabelText(/Tải ảnh lá cây|T/);
const diagnoseButton = () => screen.getByRole("button", { name: /Chẩn|Ch/ });

beforeEach(() => {
  diseaseApiMocks.getPredictHealth.mockResolvedValue({ status: "UP" });
  diseaseApiMocks.predictDisease.mockReset();
  diseaseApiMocks.getMyProfile.mockResolvedValue({ data: { data: { id: "profile-1" } } });
  diseaseApiMocks.getPlotsByOwner.mockResolvedValue([
    { id: "plot-1", name: "Vườn chính", ownerProfileId: "profile-1" },
  ]);
  diseaseApiMocks.getZonesByPlot.mockResolvedValue([
    { id: "zone-1", zoneName: "Khu A", farmPlotId: "plot-1" },
  ]);
  diseaseApiMocks.getPlants.mockResolvedValue([
    {
      id: "plant-1",
      nickName: "Cà phê A",
      plantNumber: "P-001",
      farmPlotId: "plot-1",
      speciesId: "species-1",
      plantStatus: "ACTIVE",
    },
  ]);
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:preview"),
    revokeObjectURL: vi.fn(),
  });
});

describe("DiseaseDiagnosisPage", () => {
  it("renders upload UI", async () => {
    renderWithClient(<DiseaseDiagnosisPage />, {
      route: ROUTES.DASHBOARD.DISEASE_DIAGNOSIS,
    });

    expect(await screen.findByText("Disease detection")).toBeInTheDocument();
    expect(await screen.findByText(/ThÃ´ng tin cÃ¢y liÃªn quan|Thông tin cây liên quan/)).toBeInTheDocument();
    expect(uploadInput()).toBeInTheDocument();
    expect(diagnoseButton()).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      ROUTES.DASHBOARD.DIAGNOSIS_HISTORY,
    );
  });

  it("shows preview when a valid image is selected", async () => {
    const user = userEvent.setup();
    renderWithClient(<DiseaseDiagnosisPage />);

    const file = new File(["leaf"], "leaf.jpg", { type: "image/jpeg" });
    await user.upload(uploadInput(), file);

    expect(await screen.findByAltText(/Preview/)).toHaveAttribute(
      "src",
      "blob:preview",
    );
    expect(screen.getByText("leaf.jpg")).toBeInTheDocument();
  });

  it("rejects non-image files", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderWithClient(<DiseaseDiagnosisPage />);

    const file = new File(["not-image"], "leaf.txt", { type: "text/plain" });
    await user.upload(uploadInput(), file);

    expect(await screen.findByText(/File/)).toBeInTheDocument();
  });

  it("submits predict API and renders prediction result", async () => {
    const user = userEvent.setup();
    diseaseApiMocks.predictDisease.mockResolvedValue(predictionResponse);
    renderWithClient(<DiseaseDiagnosisPage />);

    const file = new File(["leaf"], "leaf.jpg", { type: "image/jpeg" });
    await user.upload(uploadInput(), file);
    await user.click(diagnoseButton());

    await waitFor(() => {
      expect(diseaseApiMocks.predictDisease).toHaveBeenCalledWith(file);
    });
    expect((await screen.findAllByText(/sắt|sáº¯t/)).length).toBeGreaterThan(0);
    expect(screen.getByText("86%")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hỏi AI tư vấn cách xử lý" }),
    ).toBeEnabled();
  });

  it("navigates to AI assistant with diagnosis context", async () => {
    const user = userEvent.setup();
    diseaseApiMocks.predictDisease.mockResolvedValue(predictionResponse);

    function AiRouteProbe() {
      const location = useLocation();
      const state = location.state as {
        diseaseContext?: {
          diseaseClassName?: string;
          confidence?: number;
          plantId?: string;
          plantName?: string;
          farmPlotId?: string;
          farmPlotName?: string;
        };
      } | null;
      return (
        <div>
          AI route {state?.diseaseContext?.diseaseClassName}{" "}
          {state?.diseaseContext?.confidence} {state?.diseaseContext?.plantId}{" "}
          {state?.diseaseContext?.plantName} {state?.diseaseContext?.farmPlotId}{" "}
          {state?.diseaseContext?.farmPlotName}
        </div>
      );
    }

    renderWithClient(
      <Routes>
        <Route
          path={ROUTES.DASHBOARD.DISEASE_DIAGNOSIS}
          element={<DiseaseDiagnosisPage />}
        />
        <Route
          path={ROUTES.DASHBOARD.AI_ASSISTANT}
          element={<AiRouteProbe />}
        />
      </Routes>,
      { route: ROUTES.DASHBOARD.DISEASE_DIAGNOSIS },
    );

    const file = new File(["leaf"], "leaf.jpg", { type: "image/jpeg" });
    await screen.findByRole("option", { name: "Cà phê A" });
    await user.selectOptions(
      screen.getByLabelText(/Cây trồng|CÃ¢y trá»“ng/),
      "plant-1",
    );
    await user.upload(uploadInput(), file);
    await user.click(diagnoseButton());
    await user.click(
      await screen.findByRole("button", {
        name: "Hỏi AI tư vấn cách xử lý",
      }),
    );

    expect(
      await screen.findByText(/AI route rust 0.86 plant-1 Cà phê A plot-1 Vườn chính/),
    ).toBeInTheDocument();
  });

  it("shows friendly error when predict fails", async () => {
    const user = userEvent.setup();
    diseaseApiMocks.predictDisease.mockRejectedValue(
      new Error("MODEL_NOT_LOADED"),
    );
    renderWithClient(<DiseaseDiagnosisPage />);

    const file = new File(["leaf"], "leaf.jpg", { type: "image/jpeg" });
    await user.upload(uploadInput(), file);
    await user.click(diagnoseButton());

    expect(
      await screen.findByText(/Model chẩn đoán|Model cháº©n/),
    ).toBeInTheDocument();
  });
});
