import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    expect(await screen.findByText("Chẩn đoán bệnh lá cà phê")).toBeInTheDocument();
    expect(screen.getByText("Tải ảnh lá cây")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chẩn đoán" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Xem lịch sử chẩn đoán" }),
    ).toHaveAttribute("href", ROUTES.DASHBOARD.DIAGNOSIS_HISTORY);
  });

  it("shows preview when a valid image is selected", async () => {
    const user = userEvent.setup();

    renderWithClient(<DiseaseDiagnosisPage />);

    const file = new File(["leaf"], "leaf.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("Tải ảnh lá cây"), file);

    expect(await screen.findByAltText("Preview ảnh lá cây")).toHaveAttribute(
      "src",
      "blob:preview",
    );
    expect(screen.getByText("leaf.jpg")).toBeInTheDocument();
  });

  it("rejects non-image files", async () => {
    const user = userEvent.setup({ applyAccept: false });

    renderWithClient(<DiseaseDiagnosisPage />);

    const file = new File(["not-image"], "leaf.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText("Tải ảnh lá cây"), file);

    expect(
      await screen.findByText("File không hợp lệ. Vui lòng chọn ảnh JPG, PNG hoặc WebP."),
    ).toBeInTheDocument();
  });

  it("submits multipart predict API and renders prediction result", async () => {
    const user = userEvent.setup();
    diseaseApiMocks.predictDisease.mockResolvedValue(predictionResponse);

    renderWithClient(<DiseaseDiagnosisPage />);

    const file = new File(["leaf"], "leaf.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("Tải ảnh lá cây"), file);
    await user.click(screen.getByRole("button", { name: "Chẩn đoán" }));

    await waitFor(() => {
      expect(diseaseApiMocks.predictDisease).toHaveBeenCalledWith(file);
    });
    expect((await screen.findAllByText("Gỉ sắt")).length).toBeGreaterThan(0);
    expect(screen.getByText("86%")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hỏi AI tư vấn cách xử lý" }),
    ).toBeDisabled();
  });

  it("shows friendly error when predict fails", async () => {
    const user = userEvent.setup();
    diseaseApiMocks.predictDisease.mockRejectedValue(
      new Error("MODEL_NOT_LOADED"),
    );

    renderWithClient(<DiseaseDiagnosisPage />);

    const file = new File(["leaf"], "leaf.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("Tải ảnh lá cây"), file);
    await user.click(screen.getByRole("button", { name: "Chẩn đoán" }));

    expect(
      await screen.findByText("Model chẩn đoán chưa sẵn sàng. Vui lòng thử lại sau."),
    ).toBeInTheDocument();
  });
});
