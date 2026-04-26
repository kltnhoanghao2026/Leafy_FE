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
}));

vi.mock("../api/disease.api", () => ({
  diseaseApi: {
    getPredictHealth: diseaseApiMocks.getPredictHealth,
    predictDisease: diseaseApiMocks.predictDisease,
  },
}));

const uploadInput = () => screen.getByLabelText(/Tải ảnh lá cây|T/);
const diagnoseButton = () => screen.getByRole("button", { name: /Chẩn|Ch/ });

beforeEach(() => {
  diseaseApiMocks.getPredictHealth.mockResolvedValue({ status: "UP" });
  diseaseApiMocks.predictDisease.mockReset();
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
        diseaseContext?: { diseaseClassName?: string; confidence?: number };
      } | null;
      return (
        <div>
          AI route {state?.diseaseContext?.diseaseClassName}{" "}
          {state?.diseaseContext?.confidence}
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
    await user.upload(uploadInput(), file);
    await user.click(diagnoseButton());
    await user.click(
      await screen.findByRole("button", {
        name: "Hỏi AI tư vấn cách xử lý",
      }),
    );

    expect(await screen.findByText(/AI route rust 0.86/)).toBeInTheDocument();
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
