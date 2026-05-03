import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../lib/routes";
import { renderWithClient } from "../../../test/render";
import { AgricultureOverviewPage } from "./AgricultureOverviewPage";

const queryMocks = vi.hoisted(() => ({
  usePlants: vi.fn(),
  useMyTreatmentPlans: vi.fn(),
  usePlantEventsCalendar: vi.fn(),
  useDiagnoseRequests: vi.fn(),
  useRagHealth: vi.fn(),
}));

vi.mock("../queries", () => ({
  usePlants: queryMocks.usePlants,
  useMyTreatmentPlans: queryMocks.useMyTreatmentPlans,
  usePlantEventsCalendar: queryMocks.usePlantEventsCalendar,
}));

vi.mock("../../disease-diagnosis/queries", () => ({
  useDiagnoseRequests: queryMocks.useDiagnoseRequests,
}));

vi.mock("../../rag-assistant/queries", () => ({
  useRagHealth: queryMocks.useRagHealth,
}));

const successQuery = <T,>(data: T) => ({
  data,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
});

beforeEach(() => {
  queryMocks.usePlants.mockReturnValue(
    successQuery([{ id: "plant-1" }, { id: "plant-2" }]),
  );
  queryMocks.useMyTreatmentPlans.mockReturnValue(
    successQuery([
      { id: "plan-1", diseaseName: "Gỉ sắt", status: "ACTIVE", createdAt: "2026-04-26" },
      { id: "plan-2", diseaseName: "Nhện đỏ", status: "COMPLETED", createdAt: "2026-04-20" },
    ]),
  );
  queryMocks.usePlantEventsCalendar.mockReturnValue(
    successQuery([
      {
        id: "event-1",
        eventType: "SCOUTING",
        note: "Kiểm tra lá",
        description: null,
        calculatedStartDate: "2026-04-27",
      },
    ]),
  );
  queryMocks.useDiagnoseRequests.mockReturnValue(
    successQuery({
      content: [
        {
          diagnoseRequestId: "diag-1",
          imageFileName: "leaf.jpg",
          timeStamp: "2026-04-26T10:00:00Z",
        },
      ],
    }),
  );
  queryMocks.useRagHealth.mockReturnValue(successQuery({ status: "ok" }));
});

describe("AgricultureOverviewPage", () => {
  it("renders summary cards, upcoming events, active plans and recent diagnosis", () => {
    renderWithClient(<AgricultureOverviewPage />, {
      route: ROUTES.DASHBOARD.AGRICULTURE_OVERVIEW,
    });

    expect(screen.getByText("Tổng quan nông nghiệp thông minh")).toBeInTheDocument();
    expect(screen.getByText("Cây trồng")).toBeInTheDocument();
    expect(screen.getByText("Plan chờ/đang làm")).toBeInTheDocument();
    expect(screen.getByText("Lịch 7 ngày tới")).toBeInTheDocument();
    expect(screen.getAllByText("Chẩn đoán gần đây").length).toBeGreaterThan(0);
    expect(screen.getByText(/Kiểm tra lá/)).toBeInTheDocument();
    expect(screen.getByText("Gỉ sắt")).toBeInTheDocument();
    expect(screen.getByText("leaf.jpg")).toBeInTheDocument();
    expect(screen.getByText("AI sẵn sàng")).toBeInTheDocument();
  });

  it("keeps rendering when a partial API fails", () => {
    queryMocks.usePlantEventsCalendar.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderWithClient(<AgricultureOverviewPage />, {
      route: ROUTES.DASHBOARD.AGRICULTURE_OVERVIEW,
    });

    expect(screen.getByText("Tổng quan nông nghiệp thông minh")).toBeInTheDocument();
    expect(screen.getByText("Không tải được lịch chăm sóc.")).toBeInTheDocument();
    expect(screen.getByText("Gỉ sắt")).toBeInTheDocument();
  });

  it("shortcuts navigate to implemented routes", async () => {
    const user = userEvent.setup();

    function RouteProbe() {
      const location = useLocation();
      return <div>route: {location.pathname}</div>;
    }

    renderWithClient(
      <Routes>
        <Route path="/dashboard/agriculture-overview" element={<AgricultureOverviewPage />} />
        <Route path="/dashboard/disease-diagnosis" element={<RouteProbe />} />
      </Routes>,
      { route: ROUTES.DASHBOARD.AGRICULTURE_OVERVIEW },
    );

    await user.click(screen.getByRole("link", { name: "Chẩn đoán bệnh" }));
    expect(screen.getByText(`route: ${ROUTES.DASHBOARD.DISEASE_DIAGNOSIS}`)).toBeInTheDocument();
  });
});
