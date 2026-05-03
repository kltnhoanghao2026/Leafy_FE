import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../lib/routes";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import { DiagnosisHistoryPage } from "./DiagnosisHistoryPage";

const REQUEST_ID = "request-1";

const envelope = <T,>(data: T) => ({
  code: 1000,
  message: "Successful",
  data,
});

const page = <T,>(content: T[]) => ({
  content,
  page: 0,
  size: 50,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
});

const requestItem = {
  diagnoseRequestId: REQUEST_ID,
  userId: "user-1",
  imageFileName: "leaf.jpg",
  imageContentType: "image/jpeg",
  timeStamp: "2026-04-16T03:00:00Z",
};

const resultItem = {
  diagnoseResultId: "result-1",
  diagnoseRequestId: REQUEST_ID,
  userId: "user-1",
  result: [
    { diseaseName: "rust", confidenceScore: 0.9 },
    { diseaseName: "healthy", confidenceScore: 0.08 },
  ],
  timeStamp: "2026-04-16T03:00:10Z",
};

describe("DiagnosisHistoryPage", () => {
  it("renders history list", async () => {
    server.use(
      http.get("*/api/diseases/diagnose/requests", () =>
        HttpResponse.json(envelope(page([requestItem]))),
      ),
      http.get("*/api/diseases/diagnose/results", () =>
        HttpResponse.json(envelope(page([resultItem]))),
      ),
    );

    renderWithClient(<DiagnosisHistoryPage />, {
      route: ROUTES.DASHBOARD.DIAGNOSIS_HISTORY,
    });

    expect(await screen.findByText("Lịch sử chẩn đoán")).toBeInTheDocument();
    expect(await screen.findByText("leaf.jpg")).toBeInTheDocument();
    expect(screen.getByText(/Gỉ sắt/)).toBeInTheDocument();
  });

  it("renders empty state", async () => {
    server.use(
      http.get("*/api/diseases/diagnose/requests", () =>
        HttpResponse.json(envelope(page([]))),
      ),
      http.get("*/api/diseases/diagnose/results", () =>
        HttpResponse.json(envelope(page([]))),
      ),
    );

    renderWithClient(<DiagnosisHistoryPage />);

    expect(await screen.findByText("Chưa có lịch sử chẩn đoán")).toBeInTheDocument();
  });

  it("opens detail dialog and loads result by request", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/diseases/diagnose/requests", () =>
        HttpResponse.json(envelope(page([requestItem]))),
      ),
      http.get("*/api/diseases/diagnose/results", () =>
        HttpResponse.json(envelope(page([resultItem]))),
      ),
      http.get("*/api/diseases/diagnose/results/by-request/:requestId", ({ params }) => {
        expect(params.requestId).toBe(REQUEST_ID);
        return HttpResponse.json(envelope(resultItem));
      }),
    );

    renderWithClient(<DiagnosisHistoryPage />);

    await user.click(await screen.findByRole("button", { name: "Xem chi tiết" }));
    const dialog = await screen.findByRole("dialog", { name: "Chi tiết chẩn đoán" });

    expect(dialog).toHaveTextContent("leaf.jpg");
    expect(await within(dialog).findByText("Gỉ sắt")).toBeInTheDocument();
    expect(within(dialog).getByText("90%")).toBeInTheDocument();
  });

  it("deletes request with confirmation dialog instead of window.confirm", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm");
    let deleted = false;
    server.use(
      http.get("*/api/diseases/diagnose/requests", () =>
        HttpResponse.json(envelope(page([requestItem]))),
      ),
      http.get("*/api/diseases/diagnose/results", () =>
        HttpResponse.json(envelope(page([resultItem]))),
      ),
      http.delete("*/api/diseases/diagnose/requests/:requestId", ({ params }) => {
        expect(params.requestId).toBe(REQUEST_ID);
        deleted = true;
        return HttpResponse.json(envelope(null));
      }),
    );

    renderWithClient(<DiagnosisHistoryPage />);

    await user.click(await screen.findByRole("button", { name: "Xóa" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Xóa lịch sử chẩn đoán",
    });
    await user.click(within(dialog).getByRole("button", { name: "Xóa" }));

    await waitFor(() => {
      expect(deleted).toBe(true);
    });
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("renders error state", async () => {
    server.use(
      http.get("*/api/diseases/diagnose/requests", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
      http.get("*/api/diseases/diagnose/results", () =>
        HttpResponse.json(envelope(page([]))),
      ),
    );

    renderWithClient(<DiagnosisHistoryPage />);

    expect(
      await screen.findByText("Không tải được lịch sử chẩn đoán"),
    ).toBeInTheDocument();
  });
});
