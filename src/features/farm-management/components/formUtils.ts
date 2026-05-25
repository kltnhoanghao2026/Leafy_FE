import type {
  CreateFarmPlotRequest,
  CreateFarmZoneRequest,
  FarmPlotResponse,
  FarmPlotStatus,
  FarmZoneResponse,
  UpdateFarmPlotRequest,
  UpdateFarmZoneRequest,
} from "../types";

export type PlotFormState = {
  name: string;
  description: string;
  areaM2: string;
  addressLine: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  latitude: string;
  longitude: string;
  status: FarmPlotStatus;
};

export type ZoneFormState = {
  zoneName: string;
  zoneCode: string;
  description: string;
  areaM2: string;
  soilType: string;
  cropType: string;
  plantingDate: string;
  elevationM: string;
};

export const PLOT_STATUS_OPTIONS: FarmPlotStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
];

export const STATUS_LABELS: Record<FarmPlotStatus, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Tạm ngưng",
  ARCHIVED: "Đã lưu trữ",
};

export const EMPTY_PLOT_FORM: PlotFormState = {
  name: "",
  description: "",
  areaM2: "",
  addressLine: "",
  provinceCode: "",
  districtCode: "",
  wardCode: "",
  latitude: "",
  longitude: "",
  status: "ACTIVE",
};

export const EMPTY_ZONE_FORM: ZoneFormState = {
  zoneName: "",
  zoneCode: "",
  description: "",
  areaM2: "",
  soilType: "",
  cropType: "",
  plantingDate: "",
  elevationM: "",
};

export const optionalString = (value: string) => {
  const trimmed = value.trim();
  return trimmed || undefined;
};

export const optionalNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const toPlotForm = (plot?: FarmPlotResponse | null): PlotFormState => {
  if (!plot) {
    return EMPTY_PLOT_FORM;
  }

  return {
    name: plot.name ?? "",
    description: plot.description ?? "",
    areaM2: plot.areaM2 != null ? String(plot.areaM2) : "",
    addressLine: plot.addressLine ?? "",
    provinceCode: plot.provinceCode ?? "",
    districtCode: plot.districtCode ?? "",
    wardCode: plot.wardCode ?? "",
    latitude: plot.latitude != null ? String(plot.latitude) : "",
    longitude: plot.longitude != null ? String(plot.longitude) : "",
    status: plot.status,
  };
};

export const toZoneForm = (zone?: FarmZoneResponse | null): ZoneFormState => {
  if (!zone) {
    return EMPTY_ZONE_FORM;
  }

  return {
    zoneName: zone.zoneName ?? "",
    zoneCode: zone.zoneCode ?? "",
    description: zone.description ?? "",
    areaM2: zone.areaM2 != null ? String(zone.areaM2) : "",
    soilType: zone.soilType ?? "",
    cropType: zone.cropType ?? "",
    plantingDate: zone.plantingDate ?? "",
    elevationM: zone.elevationM != null ? String(zone.elevationM) : "",
  };
};

export const buildCreatePlotPayload = (
  form: PlotFormState,
  ownerProfileId: string,
): CreateFarmPlotRequest => ({
  ownerProfileId,
  name: form.name.trim(),
  description: optionalString(form.description),
  areaM2: optionalNumber(form.areaM2),
  addressLine: optionalString(form.addressLine),
  provinceCode: optionalString(form.provinceCode),
  districtCode: optionalString(form.districtCode),
  wardCode: optionalString(form.wardCode),
  latitude: optionalNumber(form.latitude),
  longitude: optionalNumber(form.longitude),
});

export const buildUpdatePlotPayload = (
  form: PlotFormState,
): UpdateFarmPlotRequest => ({
  name: form.name.trim(),
  description: optionalString(form.description),
  areaM2: optionalNumber(form.areaM2),
  addressLine: optionalString(form.addressLine),
  provinceCode: optionalString(form.provinceCode),
  districtCode: optionalString(form.districtCode),
  wardCode: optionalString(form.wardCode),
  latitude: optionalNumber(form.latitude),
  longitude: optionalNumber(form.longitude),
  status: form.status,
});

export const buildCreateZonePayload = (
  form: ZoneFormState,
): CreateFarmZoneRequest => ({
  zoneName: form.zoneName.trim(),
  zoneCode: optionalString(form.zoneCode),
  description: optionalString(form.description),
  areaM2: optionalNumber(form.areaM2),
  soilType: optionalString(form.soilType),
  cropType: optionalString(form.cropType),
  plantingDate: optionalString(form.plantingDate),
  elevationM: optionalNumber(form.elevationM),
});

export const buildUpdateZonePayload = (
  form: ZoneFormState,
): UpdateFarmZoneRequest => ({
  zoneName: form.zoneName.trim(),
  zoneCode: optionalString(form.zoneCode),
  description: optionalString(form.description),
  areaM2: optionalNumber(form.areaM2),
  soilType: optionalString(form.soilType),
  cropType: optionalString(form.cropType),
  plantingDate: optionalString(form.plantingDate),
  elevationM: optionalNumber(form.elevationM),
});
