import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Header } from "./Header";
import { ROUTES } from "../lib/routes";
import { renderWithClient } from "../test/render";

describe("Header", () => {
  it("points the device tab to the backend-driven onboarding flow", () => {
    renderWithClient(<Header onMenuClick={() => undefined} />, {
      route: ROUTES.DASHBOARD.ROOT,
    });

    expect(screen.getByRole("link", { name: "Cảm biến" })).toHaveAttribute(
      "href",
      ROUTES.DASHBOARD.DEVICE_ONBOARDING,
    );
  });
});
