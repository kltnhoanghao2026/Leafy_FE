const DEFAULT_API_BASE_URL = "/api";

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

const getCurrentOrigin = () => {
  if (typeof window === "undefined") return "";
  return window.location.origin;
};

const isHttpsPage = () =>
  typeof window !== "undefined" && window.location.protocol === "https:";

export const getApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    return DEFAULT_API_BASE_URL;
  }

  const normalizedBaseUrl = stripTrailingSlashes(configuredBaseUrl);

  if (isHttpsPage() && normalizedBaseUrl.startsWith("http://")) {
    return DEFAULT_API_BASE_URL;
  }

  const currentOrigin = getCurrentOrigin();
  if (currentOrigin && normalizedBaseUrl === currentOrigin) {
    return `${currentOrigin}${DEFAULT_API_BASE_URL}`;
  }

  return normalizedBaseUrl;
};
