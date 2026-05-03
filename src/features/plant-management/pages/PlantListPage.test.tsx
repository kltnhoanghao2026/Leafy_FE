import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../lib/routes";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type { FarmPlotResponse } from "../../farm-management/types";
import { PlantListPage } from "./PlantListPage";
import type { PlantResponse, SpeciesResponse } from "../types";

const PROFILE_ID = "profile-1";
const PLOT_ID = "plot-1";
const SPECIES_ID = "species-1";
const PLANT_ID = "plant-1";

const envelope = <T,>(data: T) => ({
  code: 1000,
  message: "success",
  data,
});

const page = <T,>(content: T[]) => ({
  content,
  number: 0,
  size: 100,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
});

const profile = {
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
  phoneNumber: null,
  createdAt: "2026-04-16T03:00:00Z",
  lastModifiedAt: "2026-04-16T03:00:00Z",
};

const farmPlot: FarmPlotResponse = {
  id: PLOT_ID,
  ownerProfileId: PROFILE_ID,
  code: "PLOT-001",
  name: "North Field",
  description: null,
  areaM2: 1200,
  addressLine: "Da Lat",
  provinceCode: "68",
  districtCode: "672",
  wardCode: "24778",
  latitude: null,
  longitude: null,
  boundaryGeojson: null,
  status: "ACTIVE",
  createdAt: "2026-04-16T03:00:00Z",
  lastModifiedAt: "2026-04-16T03:00:00Z",
};

const species: SpeciesResponse = {
  id: SPECIES_ID,
  commonName: "Arabica",
  cultivarName: "Catimor",
  waterFrequencyDays: 3,
  lightRequirements: "Full sun",
  daysToMaturity: 500,
  plantingWindow: null,
  plantingSeason: null,
  idealEnv: null,
  spacing: null,
  expectedYieldKg: null,
  commonDiseaseIds: [],
};

const makePlant = (overrides: Partial<PlantResponse> = {}): PlantResponse => ({
  id: PLANT_ID,
  plantNumber: "PLANT-001",
  plantStatus: "ACTIVE",
  nickName: "Cà phê A01",
  tagCode: "TAG-A01",
  batchNumber: "BATCH-1",
  sourceType: "Nursery",
  motherPlantId: null,
  plantingDate: "2026-04-01T00:00:00",
  germinationDate: null,
  actualHarvestDate: null,
  totalYieldKg: null,
  speciesId: SPECIES_ID,
  farmPlotId: PLOT_ID,
  ...overrides,
});

const mockBaseData = (plants: PlantResponse[] = [makePlant()]) => {
  server.use(
    http.get("*/api/profiles/me", () => HttpResponse.json(envelope(profile))),
    http.get("*/api/farms/plots", () => HttpResponse.json(envelope([farmPlot]))),
    http.get("*/api/species", () => HttpResponse.json(envelope(page([species])))),
    http.get("*/api/plants", () => HttpResponse.json(envelope(page(plants)))),
    http.get("*/api/plants/farm-plot/:farmPlotId", () =>
      HttpResponse.json(envelope(page(plants))),
    ),
  );
};

describe("PlantListPage", () => {
  it("renders the plant list", async () => {
    mockBaseData();

    renderWithClient(<PlantListPage />, { route: ROUTES.DASHBOARD.PLANTS });

    expect(await screen.findByText("Quản lý cây trồng")).toBeInTheDocument();
    expect(await screen.findByText("Cà phê A01")).toBeInTheDocument();
    expect(screen.getByText("Arabica - Catimor")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xem chi tiết/i })).toHaveAttribute(
      "href",
      ROUTES.DASHBOARD.PLANT_DETAIL(PLANT_ID),
    );
  });

  it("opens the create dialog and submits a new plant", async () => {
    const user = userEvent.setup();
    let submittedBody: unknown;
    let plants: PlantResponse[] = [];
    mockBaseData(plants);
    server.use(
      http.post("*/api/plants", async ({ request }) => {
        submittedBody = await request.json();
        plants = [makePlant({ id: "plant-2", nickName: "Cà phê B02" })];
        return HttpResponse.json(envelope(plants[0]), { status: 201 });
      }),
      http.get("*/api/plants", () => HttpResponse.json(envelope(page(plants)))),
    );

    renderWithClient(<PlantListPage />);

    expect(await screen.findByText("Chưa có cây trồng nào")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Thêm cây" }));

    const dialog = await screen.findByRole("dialog", { name: "Thêm cây" });
    await user.type(within(dialog).getByLabelText("Tên cây"), "Cà phê B02");
    await user.selectOptions(within(dialog).getByLabelText("Vườn"), PLOT_ID);
    await user.selectOptions(
      within(dialog).getByLabelText("Giống/Loài cây"),
      SPECIES_ID,
    );
    await user.click(within(dialog).getByRole("button", { name: "Tạo cây" }));

    await waitFor(() => {
      expect(submittedBody).toEqual(
        expect.objectContaining({
          plantStatus: "ACTIVE",
          nickName: "Cà phê B02",
          speciesId: SPECIES_ID,
          farmPlotId: PLOT_ID,
        }),
      );
    });
    expect(await screen.findByText("Cà phê B02")).toBeInTheDocument();
  });

  it("opens the edit dialog and submits updates", async () => {
    const user = userEvent.setup();
    let submittedBody: unknown;
    mockBaseData();
    server.use(
      http.put("*/api/plants/:plantId", async ({ request, params }) => {
        expect(params.plantId).toBe(PLANT_ID);
        submittedBody = await request.json();
        return HttpResponse.json(
          envelope(makePlant({ nickName: "Cà phê A01 updated" })),
        );
      }),
    );

    renderWithClient(<PlantListPage />);

    expect(await screen.findByText("Cà phê A01")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Chỉnh sửa" }));

    const dialog = await screen.findByRole("dialog", { name: "Chỉnh sửa cây" });
    await user.clear(within(dialog).getByLabelText("Tên cây"));
    await user.type(within(dialog).getByLabelText("Tên cây"), "Cà phê A01 updated");
    await user.click(within(dialog).getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(submittedBody).toEqual(
        expect.objectContaining({
          nickName: "Cà phê A01 updated",
          speciesId: SPECIES_ID,
          farmPlotId: PLOT_ID,
        }),
      );
    });
  });

  it("deletes a plant with confirmation dialog instead of window.confirm", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm");
    let deleteCalled = false;
    mockBaseData();
    server.use(
      http.delete("*/api/plants/:plantId", ({ params }) => {
        expect(params.plantId).toBe(PLANT_ID);
        deleteCalled = true;
        return HttpResponse.json(envelope(null));
      }),
    );

    renderWithClient(<PlantListPage />);

    expect(await screen.findByText("Cà phê A01")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xóa" }));
    const dialog = await screen.findByRole("dialog", { name: "Xóa cây trồng" });
    await user.click(within(dialog).getByRole("button", { name: "Xóa" }));

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
