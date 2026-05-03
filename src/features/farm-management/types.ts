export type FarmPlotStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type FarmZoneStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface FarmPlotResponse {
  id: string;
  ownerProfileId: string;
  name: string;
  code: string;
  description: string | null;
  areaM2: number | null;
  addressLine: string | null;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  latitude: number | null;
  longitude: number | null;
  boundaryGeojson: Record<string, unknown> | null;
  status: FarmPlotStatus;
  createdAt: string | null;
  lastModifiedAt: string | null;
}

export interface FarmZoneResponse {
  id: string;
  farmPlotId: string;
  zoneName: string;
  zoneCode: string | null;
  description: string | null;
  areaM2: number | null;
  soilType: string | null;
  cropType: string | null;
  plantingDate: string | null;
  elevationM: number | null;
  boundaryGeojson: Record<string, unknown> | null;
  status: FarmZoneStatus;
  createdAt: string | null;
  lastModifiedAt: string | null;
}

export interface CreateFarmPlotRequest {
  ownerProfileId: string;
  name: string;
  description?: string;
  areaM2?: number;
  addressLine?: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  latitude?: number;
  longitude?: number;
  boundaryGeojson?: Record<string, unknown>;
}

export interface UpdateFarmPlotRequest {
  name?: string;
  description?: string;
  areaM2?: number;
  addressLine?: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  latitude?: number;
  longitude?: number;
  boundaryGeojson?: Record<string, unknown>;
  status?: FarmPlotStatus;
}

export interface CreateFarmZoneRequest {
  zoneName: string;
  zoneCode?: string;
  description?: string;
  areaM2?: number;
  soilType?: string;
  cropType?: string;
  plantingDate?: string;
  elevationM?: number;
  boundaryGeojson?: Record<string, unknown>;
}

export interface UpdateFarmZoneRequest {
  zoneName?: string;
  zoneCode?: string;
  description?: string;
  areaM2?: number;
  soilType?: string;
  cropType?: string;
  plantingDate?: string;
  elevationM?: number;
  boundaryGeojson?: Record<string, unknown>;
  status?: FarmZoneStatus;
}
