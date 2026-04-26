import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ROUTES } from "../../../lib/routes";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type { FarmPlotResponse } from "../../farm-management/types";
import { PlantDetailPage } from "./PlantDetailPage";
import type {
  PlantEventResponse,
  PlantResponse,
  SpeciesResponse,
  TreatmentPlanResponse,
} from "../types";

const PROFILE_ID = "profile-1";
const PLOT_ID = "plot-1";
const PLANT_ID = "plant-1";
const SPECIES_ID = "species-1";

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

const plant: PlantResponse = {
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

const event: PlantEventResponse = {
  id: "event-1",
  plantId: PLANT_ID,
  farmPlotId: PLOT_ID,
  farmZoneId: null,
  eventType: "IRRIGATION",
  note: "Morning watering",
  description: "Tưới nước buổi sáng",
  daysFromNow: null,
  durationDays: 1,
  planned: false,
  calculatedStartDate: "2026-04-20",
  calculatedEndDate: "2026-04-20",
  phiDays: null,
  ppeRequired: null,
  mrlNote: null,
  estimatedCost: null,
  sourcePlanId: null,
  createdAt: "2026-04-16T03:00:00Z",
  lastModifiedAt: "2026-04-16T03:00:00Z",
  createdBy: null,
  lastModifiedBy: null,
  active: true,
};

const plannedEvent: PlantEventResponse = {
  ...event,
  id: "event-2",
  planned: true,
  eventType: "NUTRITION",
  description: "Bón phân định kỳ",
};

const treatmentPlan: TreatmentPlanResponse = {
  id: "plan-1",
  userId: "user-1",
  ragPlanId: null,
  question: null,
  source: "manual",
  plantId: PLANT_ID,
  farmPlotId: PLOT_ID,
  farmZoneId: null,
  diseaseName: "Coffee rust",
  confidenceScore: 0.92,
  severityLevel: "MEDIUM",
  urgency: "HIGH",
  requiredInputs: [],
  safetyWarnings: [],
  successIndicators: "Leaves recover",
  estimatedCost: "120000",
  plantEventIds: ["event-2"],
  status: "ACTIVE",
  createdAt: "2026-04-16T03:00:00Z",
  lastModifiedAt: "2026-04-16T03:00:00Z",
  createdBy: null,
  lastModifiedBy: null,
  active: true,
};

const mockDetailData = () => {
  server.use(
    http.get("*/api/profiles/me", () => HttpResponse.json(envelope(profile))),
    http.get("*/api/farms/plots", () => HttpResponse.json(envelope([farmPlot]))),
    http.get("*/api/species", () => HttpResponse.json(envelope(page([species])))),
    http.get("*/api/plants/:plantId", () => HttpResponse.json(envelope(plant))),
    http.get("*/api/plant-events/plant/:plantId", () =>
      HttpResponse.json(envelope(page([event]))),
    ),
    http.get("*/api/plant-events/plant/:plantId/planned", () =>
      HttpResponse.json(envelope(page([plannedEvent]))),
    ),
    http.get("*/api/treatment-plans/plant/:plantId", () =>
      HttpResponse.json(envelope(page([treatmentPlan]))),
    ),
  );
};

const renderPlantDetailPage = (plantId = PLANT_ID) =>
  renderWithClient(
    <Routes>
      <Route path="/dashboard/plants/:plantId" element={<PlantDetailPage />} />
    </Routes>,
    { route: ROUTES.DASHBOARD.PLANT_DETAIL(plantId) },
  );

describe("PlantDetailPage", () => {
  it("renders plant detail, plant events, planned events, and treatment plans", async () => {
    mockDetailData();

    renderPlantDetailPage();

    expect(await screen.findByText("Cà phê A01")).toBeInTheDocument();
    expect(screen.getByText("PLANT-001")).toBeInTheDocument();
    expect(await screen.findAllByText("Arabica")).toHaveLength(2);
    expect(screen.getByText("North Field")).toBeInTheDocument();
    expect(await screen.findByText("Tưới nước")).toBeInTheDocument();
    expect(screen.getByText("Tưới nước buổi sáng")).toBeInTheDocument();
    expect(await screen.findByText("Dinh dưỡng")).toBeInTheDocument();
    expect(screen.getByText("Coffee rust")).toBeInTheDocument();
    expect(screen.getByText("Đang điều trị")).toBeInTheDocument();
  });

  it("renders error state when plant detail cannot be loaded", async () => {
    server.use(
      http.get("*/api/plants/:plantId", () =>
        HttpResponse.json({ message: "not found" }, { status: 404 }),
      ),
    );

    renderPlantDetailPage("missing");

    expect(
      await screen.findByText("Không tải được chi tiết cây trồng"),
    ).toBeInTheDocument();
  });
});
