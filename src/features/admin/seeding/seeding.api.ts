import type { ApiEnvelope } from "../../../shared/types/api";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";

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

const postWithParams = <T>(
  url: string,
  params?: Record<string, number | undefined>,
) =>
  apiClient.post<ApiEnvelope<T>>(url, undefined, {
    params: Object.fromEntries(
      Object.entries(params ?? {}).filter(([, value]) => value != null),
    ),
  });

export const seedingApi = {
  seedAccounts: (count: number) =>
    postWithParams<AccountSeedResult>(API_ENDPOINTS.ADMIN.SEED.ACCOUNTS, {
      count,
    }),

  seedFarms: (plotsPerProfile?: number, zonesPerPlot?: number) =>
    postWithParams<FarmSeedResult>(API_ENDPOINTS.ADMIN.SEED.FARMS, {
      plotsPerProfile,
      zonesPerPlot,
    }),

  seedPlants: (
    speciesCount?: number,
    plantCount?: number,
    eventsPerPlant?: number,
  ) =>
    postWithParams<PlantSeedResult>(API_ENDPOINTS.ADMIN.SEED.PLANTS, {
      speciesCount,
      plantCount,
      eventsPerPlant,
    }),

  seedSpeciesPerenual: (startPage: number, pages: number, perPage: number) =>
    postWithParams<SpeciesPerenualSeedResult>(
      API_ENDPOINTS.ADMIN.SEED.SPECIES_PERENUAL,
      { startPage, pages, perPage },
    ),

  seedCommunity: () =>
    apiClient.post<ApiEnvelope<CommunitySeedResult>>(
      API_ENDPOINTS.ADMIN.SEED.COMMUNITY,
      undefined,
    ),

  seedCertificates: (requestCount?: number, certsPerRequest?: number) =>
    postWithParams<CertificateSeedResult>(
      API_ENDPOINTS.ADMIN.SEED.CERTIFICATES,
      {
        requestCount,
        certsPerRequest,
      },
    ),
};
