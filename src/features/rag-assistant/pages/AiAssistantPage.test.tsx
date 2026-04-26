import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../lib/routes";
import { createTestQueryClient, renderWithClient } from "../../../test/render";
import { AiAssistantPage } from "./AiAssistantPage";

const ragApiMocks = vi.hoisted(() => ({
  getRagHealth: vi.fn(),
  sendRagChat: vi.fn(),
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
    getRagHealth: ragApiMocks.getRagHealth,
    sendRagChat: ragApiMocks.sendRagChat,
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

const renderWithRouteState = (state: unknown) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          { pathname: ROUTES.DASHBOARD.AI_ASSISTANT, state },
        ]}
      >
        <AiAssistantPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  ragApiMocks.getRagHealth.mockResolvedValue({ status: "ok" });
  ragApiMocks.sendRagChat.mockReset();
  createDialogApiMocks.getMyProfile.mockResolvedValue({
    data: { data: { id: "profile-1" } },
  });
  createDialogApiMocks.getPlants.mockResolvedValue([
    {
      id: "plant-1",
      plantNumber: "P-001",
      nickName: "Cà phê A",
      speciesId: "species-1",
      farmPlotId: "plot-1",
      plantStatus: "ACTIVE",
    },
  ]);
  createDialogApiMocks.getPlotsByOwner.mockResolvedValue([
    {
      id: "plot-1",
      ownerProfileId: "profile-1",
      name: "Vườn chính",
      code: "PLOT-1",
      status: "ACTIVE",
    },
  ]);
  createDialogApiMocks.getZonesByPlot.mockResolvedValue([]);
  createDialogApiMocks.createTreatmentPlan.mockResolvedValue({
    id: "plan-created-1",
    plantId: "plant-1",
    farmPlotId: "plot-1",
    diseaseName: "Gỉ sắt",
    plantEventIds: ["event-1"],
    status: "PENDING",
  });
});

describe("AiAssistantPage", () => {
  it("renders UI and suggested prompts", async () => {
    renderWithClient(<AiAssistantPage />, {
      route: ROUTES.DASHBOARD.AI_ASSISTANT,
    });

    expect(await screen.findByText("Trợ lý AI nông nghiệp")).toBeInTheDocument();
    expect(
      screen.getByText("Lá cà phê bị gỉ sắt nên xử lý như thế nào?"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi" })).toBeDisabled();
  });

  it("sends a question and renders assistant answer", async () => {
    const user = userEvent.setup();
    ragApiMocks.sendRagChat.mockResolvedValue({
      answer: "Nên loại bỏ lá bệnh và theo dõi độ ẩm.",
      thread_id: "thread-1",
    });

    renderWithClient(<AiAssistantPage />, {
      route: ROUTES.DASHBOARD.AI_ASSISTANT,
    });

    await user.type(
      screen.getByPlaceholderText("Nhập câu hỏi cho trợ lý AI..."),
      "Lá bị gỉ sắt xử lý sao?",
    );
    await user.click(screen.getByRole("button", { name: "Gửi" }));

    await waitFor(() => {
      expect(ragApiMocks.sendRagChat).toHaveBeenCalledWith({
        question: "Lá bị gỉ sắt xử lý sao?",
        language: "Vietnamese",
        thread_id: null,
      });
    });
    expect(
      await screen.findByText("Nên loại bỏ lá bệnh và theo dõi độ ẩm."),
    ).toBeInTheDocument();
  });

  it("renders treatment plan preview from chat response and opens create dialog", async () => {
    const user = userEvent.setup();
    ragApiMocks.sendRagChat.mockResolvedValue({
      answer: "Tôi đã tạo kế hoạch xử lý.",
      thread_id: "thread-1",
      treatment_plan: {
        title: "Xử lý gỉ sắt",
        diseaseName: "Gỉ sắt",
        summary: "Phun phòng, tỉa lá bệnh và theo dõi ẩm độ.",
        steps: [{ title: "Tỉa lá" }, { title: "Phun phòng" }],
      },
    });

    renderWithClient(<AiAssistantPage />, {
      route: ROUTES.DASHBOARD.AI_ASSISTANT,
    });

    await user.type(
      screen.getByPlaceholderText("Nhập câu hỏi cho trợ lý AI..."),
      "Tạo kế hoạch xử lý gỉ sắt",
    );
    await user.click(screen.getByRole("button", { name: "Gửi" }));

    expect(await screen.findByText("Xử lý gỉ sắt")).toBeInTheDocument();
    const createButton = screen.getByRole("button", {
      name: "Tạo kế hoạch điều trị",
    });
    expect(createButton).toBeEnabled();
    await user.click(createButton);
    expect(
      await screen.findByText(
        "Review kế hoạch AI trước khi tạo treatment plan thật và sinh lịch chăm sóc.",
      ),
    ).toBeInTheDocument();
  });

  it("shows error state when chat fails", async () => {
    const user = userEvent.setup();
    ragApiMocks.sendRagChat.mockRejectedValue(new Error("network failed"));

    renderWithClient(<AiAssistantPage />, {
      route: ROUTES.DASHBOARD.AI_ASSISTANT,
    });

    await user.type(
      screen.getByPlaceholderText("Nhập câu hỏi cho trợ lý AI..."),
      "Hỏi thử",
    );
    await user.click(screen.getByRole("button", { name: "Gửi" }));

    expect(
      await screen.findByText(
        "Không kết nối được rag-service. Vui lòng thử lại sau.",
      ),
    ).toBeInTheDocument();
  });

  it("prefills prompt from disease diagnosis context", async () => {
    renderWithRouteState({
      diseaseContext: {
        diseaseClassName: "rust",
        diseaseLabel: "Gỉ sắt",
        confidence: 0.92,
      },
    });

    expect(
      await screen.findByDisplayValue(
        "Ảnh lá cà phê được chẩn đoán là Gỉ sắt với độ tin cậy 92%. Hãy tư vấn cách xử lý, phòng ngừa và lịch chăm sóc phù hợp.",
      ),
    ).toBeInTheDocument();
  });
});
