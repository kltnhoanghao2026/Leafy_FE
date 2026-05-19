import type {
  PlantEventType,
  PlantStatus,
  TargetType,
  TreatmentStatus,
} from '../../shared/types';

import {
  Droplets, Beaker, Trash2, Scissors, Search, Bug, Syringe,
  ShieldAlert, HeartPulse, Activity, PackageOpen, Wheat,
  MapPin, Leaf
} from 'lucide-react';

import type { ComponentType } from 'react';

// ── Category groupings (mirrors Leafy_APP plant-event.types.ts) ───────────────

export type EventCategory = 'ROUTINE_CARE' | 'HEALTH_MEDICAL' | 'GROWTH_LIFECYCLE';

export const EVENT_CATEGORY_MAP: Record<PlantEventType, EventCategory> = {
  IRRIGATION: 'ROUTINE_CARE',
  NUTRITION: 'ROUTINE_CARE',
  WEED_CONTROL: 'ROUTINE_CARE',
  PRUNING: 'ROUTINE_CARE',
  SCOUTING: 'HEALTH_MEDICAL',
  DISEASE_DETECTED: 'HEALTH_MEDICAL',
  TREATMENT_APPLICATION: 'HEALTH_MEDICAL',
  QUARANTINE: 'HEALTH_MEDICAL',
  HEALTH_RECOVERY: 'HEALTH_MEDICAL',
  PHENOLOGY: 'GROWTH_LIFECYCLE',
  REPOT: 'GROWTH_LIFECYCLE',
  HARVEST: 'GROWTH_LIFECYCLE',
};

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  ROUTINE_CARE: 'Chăm sóc định kỳ',
  HEALTH_MEDICAL: 'Sức khỏe & Y tế',
  GROWTH_LIFECYCLE: 'Sinh trưởng',
};

export const CATEGORY_DOT_COLORS: Record<EventCategory, string> = {
  ROUTINE_CARE: '#3B82F6',
  HEALTH_MEDICAL: '#F97316',
  GROWTH_LIFECYCLE: '#10B981',
};

export const getEventCategory = (eventType: PlantEventType): EventCategory =>
  EVENT_CATEGORY_MAP[eventType] ?? 'ROUTINE_CARE';

export const PLANT_STATUS_LABELS: Record<PlantStatus, string> = {
  ACTIVE: "Đang phát triển",
  INACTIVE: "Tạm ngưng",
  ARCHIVED: "Đã lưu trữ",
};

export const TREATMENT_STATUS_LABELS: Record<TreatmentStatus, string> = {
  PENDING: "Chờ xử lý",
  APPLYING: "Đang áp dụng",
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

export const EVENT_TYPE_ICONS: Record<PlantEventType, ComponentType<{ className?: string; style?: Record<string, string | number> }>> = {
  IRRIGATION: Droplets,
  NUTRITION: Beaker,
  WEED_CONTROL: Trash2,
  PRUNING: Scissors,
  SCOUTING: Search,
  DISEASE_DETECTED: Bug,
  TREATMENT_APPLICATION: Syringe,
  QUARANTINE: ShieldAlert,
  HEALTH_RECOVERY: HeartPulse,
  PHENOLOGY: Activity,
  REPOT: PackageOpen,
  HARVEST: Wheat,
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

// ── TargetType display helpers ────────────────────────────────────────────────

export const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  FARM: 'Toàn nông trại',
  FARM_ZONE: 'Vùng canh tác',
  PLANT: 'Cây cá nhân',
};

export const TARGET_TYPE_ICONS: Record<TargetType, ComponentType<{ className?: string }>> = {
  FARM: Wheat,
  FARM_ZONE: MapPin,
  PLANT: Leaf,
};

export const getTargetTypeLabel = (type: TargetType | null | undefined): string =>
  type ? (TARGET_TYPE_LABELS[type] ?? type) : '—';
