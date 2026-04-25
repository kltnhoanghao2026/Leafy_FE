import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { ROUTES } from "../../../lib/routes";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type {
  FarmPlotResponse,
  FarmZoneResponse,
} from "../../farm-management/types";
import type { DashboardOverviewResponse } from "../../../types/iot";

const PROFILE_ID = "profile-1";
const PLOT_ID = "plot-1";
const ZONE_ID = "zone-1";

const envelope = <T,>(data: T) => ({
  code: 1000,
  message: "success",
  data,
});

const currentProfile = {
  id: PROFILE_ID,
  userId: "user-1",
  fullName: "Current Grower",
  profilePicture: null,
  avatar: null,
  role: "FARMER",
  specialty: null,
  certificates: [],
  isVerified: true,
  bio: null,
  addressLine: null,
  provinceCode: null,
  districtCode: null,
  wardCode: null,
  latitude: null,
  longitude: null,
  active: true,
  email: "grower@example.com",
  phoneNumber: "0123456789",
  createdAt: "2026-04-16T03:00:00Z",
  lastModifiedAt: "2026-04-16T03:00:00Z",
};

const makePlot = (
  overrides: Partial<FarmPlotResponse> = {},
): FarmPlotResponse => ({
  id: PLOT_ID,
  ownerProfileId: PROFILE_ID,
  code: "PLOT-001",
  name: "North Field",
  description: "Main production plot",
  areaM2: 3200,
  addressLine: "Da Lat, Lam Dong",
  provinceCode: "68",
  districtCode: "672",
  wardCode: "24778",
  latitude: 11.9416,
  longitude: 108.4382,
  boundaryGeojson: null,
  status: "ACTIVE",
  createdAt: "2026-04-16T03:00:00Z",
  lastModifiedAt: "2026-04-16T03:00:00Z",
  ...overrides,
});

const makeZone = (
  overrides: Partial<FarmZoneResponse> = {},
): FarmZoneResponse => ({
  id: ZONE_ID,
  farmPlotId: PLOT_ID,
  zoneName: "Greenhouse Row A",
  zoneCode: "ZONE-A",
  description: "Tomato seedlings",
  areaM2: 800,
  soilType: "Loam",
  cropType: "Tomato",
  plantingDate: "2026-04-01",
  elevationM: 1520,
  boundaryGeojson: null,
  status: "ACTIVE",
  createdAt: "2026-04-16T03:00:00Z",
  lastModifiedAt: "2026-04-16T03:00:00Z",
  ...overrides,
});

const makeOverview = (
  overrides: Partial<DashboardOverviewResponse> = {},
): DashboardOverviewResponse => ({
  farmPlotId: PLOT_ID,
  totalDevices: 3,
  onlineDevices: 2,
  offlineDevices: 1,
  totalZones: 1,
  openAlerts: 4,
  lastUpdatedAt: "2026-04-16T03:00:00Z",
  ...overrides,
});

const mockProfile = () => {
  server.use(
    http.get("*/api/profiles/me", () => {
      return HttpResponse.json(envelope(currentProfile));
    }),
  );
};

const mockAddressApi = ({ fail = false } = {}) => {
  if (fail) {
    server.use(
      http.get("https://provinces.open-api.vn/api/p/", () => {
        return HttpResponse.json({ message: "boom" }, { status: 500 });
      }),
    );
    return;
  }

  server.use(
    http.get("https://provinces.open-api.vn/api/p/", () => {
      return HttpResponse.json([{ code: 68, name: "Tỉnh Lâm Đồng" }]);
    }),
    http.get("https://provinces.open-api.vn/api/p/:provinceCode", () => {
      return HttpResponse.json({
        code: 68,
        name: "Tỉnh Lâm Đồng",
        districts: [{ code: 672, name: "Thành phố Đà Lạt" }],
      });
    }),
    http.get("https://provinces.open-api.vn/api/d/:districtCode", () => {
      return HttpResponse.json({
        code: 672,
        name: "Thành phố Đà Lạt",
        wards: [{ code: 24778, name: "Phường 1" }],
      });
    }),
  );
};

const mockDashboardData = ({
  plots = [makePlot()],
  zones = [makeZone()],
  overview = makeOverview(),
}: {
  plots?: FarmPlotResponse[];
  zones?: FarmZoneResponse[];
  overview?: DashboardOverviewResponse;
} = {}) => {
  server.use(
    http.get("*/api/farms/plots", ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("ownerProfileId")).toBe(PROFILE_ID);
      return HttpResponse.json(envelope(plots));
    }),
    http.get("*/api/farms/plots/:plotId/zones", () => {
      return HttpResponse.json(envelope(zones));
    }),
    http.get("*/api/iot/dashboard/overview", () => {
      return HttpResponse.json(overview);
    }),
  );
};

describe("DashboardPage", () => {
  it("renders farm plots, selected plot detail, zones, and live overview", async () => {
    mockProfile();
    mockDashboardData({
      plots: [
        makePlot(),
        makePlot({
          id: "plot-2",
          code: "PLOT-002",
          name: "South Orchard",
          status: "INACTIVE",
        }),
      ],
    });

    renderWithClient(<DashboardPage />, { route: ROUTES.DASHBOARD.ROOT });

    expect(await screen.findByText("Quản lý vườn và khu vực")).toBeInTheDocument();
    expect(await screen.findByText("Current Grower")).toBeInTheDocument();
    expect(await screen.findAllByText("North Field")).toHaveLength(2);
    expect(screen.getByText("South Orchard")).toBeInTheDocument();
    expect(await screen.findByText("Greenhouse Row A")).toBeInTheDocument();
    expect(await screen.findByText("2 / 3")).toBeInTheDocument();
    expect(screen.getByText("1 thiết bị offline")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tên vườn")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Xem số liệu" }),
    ).toHaveAttribute("href", ROUTES.DASHBOARD.ZONE_METRICS(ZONE_ID));
  });

  it("opens the add farm plot dialog and submits province, district, and ward codes", async () => {
    const user = userEvent.setup();
    mockProfile();
    mockAddressApi();

    let plots: FarmPlotResponse[] = [];
    let submittedBody: unknown;

    server.use(
      http.get("*/api/farms/plots", () => {
        return HttpResponse.json(envelope(plots));
      }),
      http.post("*/api/farms/plots", async ({ request }) => {
        submittedBody = await request.json();
        const createdPlot = makePlot({
          id: "plot-2",
          code: "PLOT-002",
          name: "Back Orchard",
          areaM2: 1450,
          addressLine: "Thửa 5, Phường 1, Thành phố Đà Lạt, Tỉnh Lâm Đồng",
          description: "Newly added orchard plot",
        });
        plots = [createdPlot];
        return HttpResponse.json(envelope(createdPlot), { status: 201 });
      }),
      http.get("*/api/farms/plots/:plotId/zones", () => {
        return HttpResponse.json(envelope([]));
      }),
      http.get("*/api/iot/dashboard/overview", () => {
        return HttpResponse.json(makeOverview({ farmPlotId: "plot-2" }));
      }),
    );

    renderWithClient(<DashboardPage />);

    expect(await screen.findByText("Chưa có vườn")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Thêm vườn" }));

    const dialog = await screen.findByRole("dialog", { name: "Thêm vườn" });
    await user.type(within(dialog).getByLabelText("Tên vườn"), "Back Orchard");
    await user.type(within(dialog).getByLabelText("Diện tích (m²)"), "1450");
    await user.selectOptions(
      await within(dialog).findByLabelText("Tỉnh/Thành phố"),
      "68",
    );
    await user.selectOptions(
      await within(dialog).findByLabelText("Quận/Huyện"),
      "672",
    );
    await user.selectOptions(
      await within(dialog).findByLabelText("Phường/Xã"),
      "24778",
    );
    await user.clear(within(dialog).getByLabelText("Địa chỉ chi tiết"));
    await user.type(within(dialog).getByLabelText("Địa chỉ chi tiết"), "Thửa 5");
    await user.type(
      within(dialog).getByLabelText("Mô tả"),
      "Newly added orchard plot",
    );
    await user.click(within(dialog).getByRole("button", { name: "Tạo vườn" }));

    await waitFor(() => {
      expect(submittedBody).toEqual(
        expect.objectContaining({
          ownerProfileId: PROFILE_ID,
          name: "Back Orchard",
          description: "Newly added orchard plot",
          areaM2: 1450,
          addressLine: "Thửa 5",
          provinceCode: "68",
          districtCode: "672",
          wardCode: "24778",
        }),
      );
    });

    expect(await screen.findAllByText("Back Orchard")).toHaveLength(2);
    expect(await screen.findByText("Chưa có khu vực")).toBeInTheDocument();
  });

  it("opens the edit farm plot dialog with existing data and submits updates", async () => {
    const user = userEvent.setup();
    mockProfile();
    mockAddressApi();

    let submittedBody: unknown;

    mockDashboardData();
    server.use(
      http.put("*/api/farms/plots/:plotId", async ({ request, params }) => {
        expect(params.plotId).toBe(PLOT_ID);
        submittedBody = await request.json();
        return HttpResponse.json(
          envelope(makePlot({ name: "North Field Updated" })),
        );
      }),
    );

    renderWithClient(<DashboardPage />);

    expect(await screen.findAllByText("North Field")).toHaveLength(2);
    await user.click(screen.getAllByRole("button", { name: "Chỉnh sửa vườn" })[0]);

    const dialog = await screen.findByRole("dialog", { name: "Chỉnh sửa vườn" });
    expect(within(dialog).getByLabelText("Tên vườn")).toHaveValue("North Field");
    await user.clear(within(dialog).getByLabelText("Tên vườn"));
    await user.type(within(dialog).getByLabelText("Tên vườn"), "North Field Updated");
    await user.click(within(dialog).getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(submittedBody).toEqual(
        expect.objectContaining({
          name: "North Field Updated",
          provinceCode: "68",
          districtCode: "672",
          wardCode: "24778",
          status: "ACTIVE",
        }),
      );
    });
  });

  it("opens the add farm zone dialog and creates a zone inside the selected plot", async () => {
    const user = userEvent.setup();
    mockProfile();

    let zones: FarmZoneResponse[] = [];
    let submittedBody: unknown;

    server.use(
      http.get("*/api/farms/plots", () => {
        return HttpResponse.json(envelope([makePlot()]));
      }),
      http.get("*/api/farms/plots/:plotId/zones", () => {
        return HttpResponse.json(envelope(zones));
      }),
      http.post("*/api/farms/plots/:plotId/zones", async ({ request, params }) => {
        expect(params.plotId).toBe(PLOT_ID);
        submittedBody = await request.json();
        const createdZone = makeZone({
          id: "zone-2",
          zoneName: "Herb Corner",
          zoneCode: "ZONE-HERB",
          soilType: "Sandy loam",
          areaM2: 120,
        });
        zones = [createdZone];
        return HttpResponse.json(envelope(createdZone), { status: 201 });
      }),
      http.get("*/api/iot/dashboard/overview", () => {
        return HttpResponse.json(makeOverview());
      }),
    );

    renderWithClient(<DashboardPage />);

    expect(await screen.findByText("Chưa có khu vực")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Thêm khu vực" })[0]);

    const dialog = await screen.findByRole("dialog", { name: "Thêm khu vực" });
    await user.type(within(dialog).getByLabelText("Tên khu vực"), "Herb Corner");
    await user.type(within(dialog).getByLabelText("Diện tích (m²)"), "120");
    await user.type(within(dialog).getByLabelText("Loại đất"), "Sandy loam");
    await user.click(within(dialog).getByRole("button", { name: "Tạo khu vực" }));

    await waitFor(() => {
      expect(submittedBody).toEqual(
        expect.objectContaining({
          zoneName: "Herb Corner",
          areaM2: 120,
          soilType: "Sandy loam",
        }),
      );
    });

    expect(await screen.findByText("Herb Corner")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem số liệu" })).toHaveAttribute(
      "href",
      ROUTES.DASHBOARD.ZONE_METRICS("zone-2"),
    );
  });

  it("uses a confirmation dialog for deleting zones instead of window.confirm", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm");
    mockProfile();

    let deleteCalled = false;

    mockDashboardData();
    server.use(
      http.delete("*/api/farms/zones/:zoneId", ({ params }) => {
        expect(params.zoneId).toBe(ZONE_ID);
        deleteCalled = true;
        return HttpResponse.json(envelope(null));
      }),
    );

    renderWithClient(<DashboardPage />);

    expect(await screen.findByText("Greenhouse Row A")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Xóa" })[1]);

    const dialog = await screen.findByRole("dialog", { name: "Xóa khu vực" });
    expect(dialog).toHaveTextContent('Bạn có chắc muốn xóa khu vực "Greenhouse Row A"?');
    await user.click(within(dialog).getByRole("button", { name: "Xóa" }));

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("shows address picker error without crashing when the public address API fails", async () => {
    const user = userEvent.setup();
    mockProfile();
    mockDashboardData({ plots: [], zones: [] });
    mockAddressApi({ fail: true });

    renderWithClient(<DashboardPage />);

    await user.click(await screen.findByRole("button", { name: "Thêm vườn" }));

    expect(
      await screen.findByText(/Không tải được dữ liệu địa chỉ/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Thêm vườn" })).toBeInTheDocument();
  });
});
