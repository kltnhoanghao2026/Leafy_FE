export function buildAddressLineSuggestion(parts: {
  detail?: string;
  wardName?: string;
  districtName?: string;
  provinceName?: string;
}) {
  return [parts.detail, parts.wardName, parts.districtName, parts.provinceName]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(", ");
}
