import type { ApiEnvelope } from "../../../shared/types/api";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";

// ── Response types ──────────────────────────────────────────────────────────

export interface AccountSeedResult {
  created: number;
  skipped: number;
  total: number;
  profileCreated: number;
  profileFailed: number;
  eventsPublished: number;
  seededPassword: string;
  nextStartIndex: number;
  message: string;
}

export interface FarmSeedResult {
  deletedPlotCount: number;
  deletedZoneCount: number;
  seededPlotCount: number;
  seededZoneCount: number;
  sourceProfileCount: number;
}

export interface PlantSeedResult {
  seededSpeciesCount: number;
  createdSpeciesCount: number;
  updatedSpeciesCount: number;
  deletedPlantCount: number;
  seededPlantCount: number;
  deletedEventCount: number;
  seededEventCount: number;
  sourceFarmPlotCount: number;
  sourceFarmZoneCount: number;
}

export interface SpeciesPerenualSeedResult {
  startPage: number;
  pagesRequested: number;
  perPage: number;
  totalSaved: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedPages: number[];
}

export interface CommunitySeedResult {
  deletedPostCount: number;
  deletedCommentCount: number;
  deletedVoteCount: number;
  seededPostCount: number;
  seededCommentCount: number;
  seededVoteCount: number;
  sourceProfileCount: number;
}

export interface CertificateSeedResult {
  deletedPendingCount: number;
  seededRequestCount: number;
  seededCertificateCount: number;
  sourceProfileCount: number;
}

// ── API calls ───────────────────────────────────────────────────────────────

export const seedingApi = {
  seedAccounts: (count: number) =>
    apiClient.post<ApiEnvelope<AccountSeedResult>>(
      API_ENDPOINTS.ADMIN.SEED.ACCOUNTS,
      null,
      { params: { count } },
    ),

  seedFarms: (plotsPerProfile?: number, zonesPerPlot?: number) =>
    apiClient.post<ApiEnvelope<FarmSeedResult>>(
      API_ENDPOINTS.ADMIN.SEED.FARMS,
      null,
      {
        params: {
          ...(plotsPerProfile != null && { plotsPerProfile }),
          ...(zonesPerPlot != null && { zonesPerPlot }),
        },
      },
    ),

  seedPlants: (
    speciesCount?: number,
    plantCount?: number,
    eventsPerPlant?: number,
  ) =>
    apiClient.post<ApiEnvelope<PlantSeedResult>>(
      API_ENDPOINTS.ADMIN.SEED.PLANTS,
      null,
      {
        params: {
          ...(speciesCount != null && { speciesCount }),
          ...(plantCount != null && { plantCount }),
          ...(eventsPerPlant != null && { eventsPerPlant }),
        },
      },
    ),

  seedSpeciesPerenual: (startPage: number, pages: number, perPage: number) =>
    apiClient.post<ApiEnvelope<SpeciesPerenualSeedResult>>(
      API_ENDPOINTS.ADMIN.SEED.SPECIES_PERENUAL,
      null,
      { params: { startPage, pages, perPage } },
    ),

  seedCommunity: () =>
    apiClient.post<ApiEnvelope<CommunitySeedResult>>(
      API_ENDPOINTS.ADMIN.SEED.COMMUNITY,
    ),

  seedCertificates: (requestCount?: number, certsPerRequest?: number) =>
    apiClient.post<ApiEnvelope<CertificateSeedResult>>(
      API_ENDPOINTS.ADMIN.SEED.CERTIFICATES,
      null,
      {
        params: {
          ...(requestCount != null && { requestCount }),
          ...(certsPerRequest != null && { certsPerRequest }),
        },
      },
    ),

  seedExperts: (count: number) =>
    apiClient.post<ApiEnvelope<number>>(
      API_ENDPOINTS.ADMIN.SEED.EXPERTS,
      null,
      { params: { count } },
    ),
};
