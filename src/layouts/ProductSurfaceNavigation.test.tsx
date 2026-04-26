import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ROUTES } from "../lib/routes";
import { renderWithClient } from "../test/render";
import { server } from "../test/server";

const envelope = <T,>(data: T) => ({
  code: 1000,
  message: "success",
  data,
});

const profile = {
  id: "profile-1",
  userId: "user-1",
  fullName: "Backend Farmer",
  profilePicture: null,
  avatar: null,
  role: "FARMER",
  specialty: null,
  certificates: [],
  isVerified: false,
  bio: null,
  addressLine: null,
  provinceCode: null,
  districtCode: null,
  wardCode: null,
  latitude: null,
  longitude: null,
  active: true,
  email: "farmer@example.com",
  phoneNumber: null,
  createdAt: "2026-04-16T03:00:00Z",
  lastModifiedAt: "2026-04-16T03:00:00Z",
};

const visibleProductRoutes = [
  ROUTES.DASHBOARD.ROOT,
  ROUTES.DASHBOARD.SEARCH,
  ROUTES.DASHBOARD.ALERTS,
  ROUTES.DASHBOARD.ALERT_RULES,
  ROUTES.DASHBOARD.DEVICE_ONBOARDING,
  ROUTES.DASHBOARD.AGRICULTURE_OVERVIEW,
  ROUTES.DASHBOARD.PLANTS,
  ROUTES.DASHBOARD.TREATMENT_PLANS,
  ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR,
  ROUTES.DASHBOARD.DISEASE_DIAGNOSIS,
  ROUTES.DASHBOARD.AI_ASSISTANT,
  ROUTES.DASHBOARD.COMMUNITY,
  ROUTES.DASHBOARD.SETTINGS,
];

describe("product surface navigation", () => {
  it("does not expose unfinished dashboard route constants", () => {
    const dashboardRoutes = ROUTES.DASHBOARD as Record<string, unknown>;

    expect("MONITOR" in dashboardRoutes).toBe(false);
    expect("EXPERTS" in dashboardRoutes).toBe(false);
    expect("REPORTS" in dashboardRoutes).toBe(false);
  });

  it("header only links to implemented primary tabs", () => {
    renderWithClient(<Header onMenuClick={() => undefined} />, {
      route: ROUTES.DASHBOARD.ROOT,
    });

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).toEqual([
      ROUTES.DASHBOARD.ROOT,
      ROUTES.DASHBOARD.DEVICE_ONBOARDING,
    ]);
    expect(hrefs).not.toContain("/dashboard/reports");
  });

  it("sidebar primary navigation only links to real product pages", async () => {
    server.use(
      http.get("*/api/profiles/me", () => {
        return HttpResponse.json(envelope(profile));
      }),
    );

    renderWithClient(<Sidebar />, {
      route: ROUTES.DASHBOARD.ROOT,
    });

    const nav = screen.getByRole("navigation");
    expect(screen.getByText("Nông nghiệp thông minh")).toBeInTheDocument();
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).toEqual(visibleProductRoutes);
    expect(hrefs).not.toContain("/dashboard/monitor");
    expect(hrefs).not.toContain("/dashboard/experts");
    expect(hrefs).not.toContain("/dashboard/reports");
  });
});
