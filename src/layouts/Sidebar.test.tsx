import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { Sidebar } from "./Sidebar";
import { renderWithClient } from "../test/render";
import { server } from "../test/server";

const pagedAlerts = (totalItems: number) => ({
  items: [],
  page: 0,
  size: 1,
  totalItems,
  totalPages: totalItems > 0 ? totalItems : 0,
  hasNext: totalItems > 1,
  hasPrevious: false,
});

const mockSidebarApis = (openAlertCount: number) => {
  server.use(
    http.get("*/api/profiles/me", () =>
      HttpResponse.json({
        data: {
          id: "profile-1",
          userId: "user-1",
          role: "FARMER",
        },
      }),
    ),
    http.get("*/api/notifications/state", () =>
      HttpResponse.json({
        data: {
          unreadCount: 0,
          lastCheckedAt: null,
        },
      }),
    ),
    http.get("*/api/conversations", () =>
      HttpResponse.json({
        data: {
          data: [],
        },
      }),
    ),
    http.get("*/api/iot/alert-events", ({ request }) => {
      const url = new URL(request.url);

      expect(url.searchParams.get("status")).toBe("OPEN");
      expect(url.searchParams.get("page")).toBe("0");
      expect(url.searchParams.get("size")).toBe("1");
      expect(url.searchParams.get("sortBy")).toBe("openedAt");
      expect(url.searchParams.get("sortDir")).toBe("desc");

      return HttpResponse.json(pagedAlerts(openAlertCount));
    }),
  );
};

describe("Sidebar alert badge", () => {
  it("shows the open alert count on the alerts nav item", async () => {
    mockSidebarApis(47);

    renderWithClient(<Sidebar collapsed={false} />, {
      route: "/dashboard",
    });

    expect(await screen.findByText("47")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cảnh báo\s*47/i })).toHaveAttribute(
      "href",
      "/dashboard/alerts",
    );
  });

  it("hides the alerts badge when there are no open alerts", async () => {
    mockSidebarApis(0);

    renderWithClient(<Sidebar collapsed={false} />, {
      route: "/dashboard",
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /^Cảnh báo$/i })).toBeInTheDocument();
    });

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("caps the visible alerts badge at 99+", async () => {
    mockSidebarApis(120);

    renderWithClient(<Sidebar collapsed={false} />, {
      route: "/dashboard",
    });

    expect(await screen.findByText("99+")).toBeInTheDocument();
  });
});
