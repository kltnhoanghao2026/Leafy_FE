import type {
  PlantEventType,
  PlantStatus,
  TreatmentStatus,
} from "../types";

export const PLANT_STATUS_LABELS: Record<PlantStatus, string> = {
  ACTIVE: "Đang phát triển",
  INACTIVE: "Tạm ngưng",
  ARCHIVED: "Đã lưu trữ",
};

export const TREATMENT_STATUS_LABELS: Record<TreatmentStatus, string> = {
  PENDING: "Chờ xử lý",
  ACTIVE: "Đang điều trị",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

export const EVENT_TYPE_LABELS: Record<PlantEventType, string> = {
  IRRIGATION: "Tưới nước",
  NUTRITION: "Dinh dưỡng",
  WEED_CONTROL: "Kiểm soát cỏ",
  PRUNING: "Tỉa cành",
  SCOUTING: "Kiểm tra vườn",
  DISEASE_DETECTED: "Phát hiện bệnh",
  TREATMENT_APPLICATION: "Áp dụng điều trị",
  QUARANTINE: "Cách ly",
  HEALTH_RECOVERY: "Phục hồi",
  PHENOLOGY: "Giai đoạn sinh trưởng",
  REPOT: "Chuyển chậu",
  HARVEST: "Thu hoạch",
};

export const formatDate = (value?: string | null) => {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const toDateTimeInputValue = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

export const toApiDateTime = (value: string) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
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
