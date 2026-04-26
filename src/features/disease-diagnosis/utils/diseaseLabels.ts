const DISEASE_LABELS: Record<string, string> = {
  healthy: "Khỏe mạnh",
  miner: "Sâu đục lá",
  phoma: "Bệnh Phoma",
  red_spider_mite: "Nhện đỏ",
  rust: "Gỉ sắt",
};

const normalizeDiseaseKey = (value: string) =>
  value.trim().toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");

export const getDiseaseLabel = (value?: string | null) => {
  if (!value) {
    return "Không rõ";
  }

  const key = normalizeDiseaseKey(value);
  return DISEASE_LABELS[key] ?? value;
};

export const isHealthyDisease = (value?: string | null) =>
  normalizeDiseaseKey(value ?? "") === "healthy";

export const formatConfidence = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) {
    return "-";
  }

  return `${Math.round(value * 100)}%`;
};
