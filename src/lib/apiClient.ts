import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "../shared/types/api";
import { getOrCreateDeviceId } from "./clientDevice";
import { useAuthStore } from "../store/authStore";
import { API_ENDPOINTS } from "./routes";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

// ---------------------------------------------------------------------------
// Logging interceptors
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use((config) => {
  const { method, url, params, data } = config;
  console.groupCollapsed(
    `%c⬆ ${method?.toUpperCase()} ${url}`,
    "color: #4CAF50; font-weight: bold;",
  );
  if (params) console.log("Params:", params);
  if (data)
    console.log("Body:", typeof data === "string" ? JSON.parse(data) : data);
  console.groupEnd();
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const { status, config, data } = response;
    console.groupCollapsed(
      `%c⬇ ${status} ${config.method?.toUpperCase()} ${config.url}`,
      "color: #2196F3; font-weight: bold;",
    );
    console.log("Response:", data);
    console.groupEnd();
    return response;
  },
  (error: AxiosError) => {
    const { response, config } = error;
    console.groupCollapsed(
      `%c✖ ${response?.status ?? "ERR"} ${config?.method?.toUpperCase()} ${config?.url}`,
      "color: #F44336; font-weight: bold;",
    );
    console.log("Error:", response?.data ?? error.message);
    console.groupEnd();
    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Request interceptor – attach Device-ID & Bearer token
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use((config) => {
  config.headers.set("X-Device-ID", getOrCreateDeviceId());

  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor – unwrap ApiEnvelope & handle 401 refresh
// ---------------------------------------------------------------------------

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();

  if (!refreshToken) {
    logout();
    throw new Error("No refresh token available");
  }

  try {
    // Call refresh endpoint directly with axios to avoid interceptor loop.
    // Use a plain axios instance so the 401 interceptor doesn't recurse.
    const res = await axios.post<
      ApiEnvelope<{ accessToken: string; refreshToken: string }>
    >(
      `${apiClient.defaults.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
      { refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Device-ID": getOrCreateDeviceId(),
        },
      },
    );

    const envelope = res.data;
    if (!envelope.data) {
      throw new Error(envelope.message || "Token refresh failed");
    }

    setTokens(envelope.data.accessToken, envelope.data.refreshToken);
    return envelope.data.accessToken;
  } catch {
    logout();
    throw new Error("Session expired. Please log in again.");
  }
}

apiClient.interceptors.response.use(
  // Success – return raw response (callers will access response.data)
  (response) => response,

  // Error handler
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };

    // --- 401: attempt token refresh (once) ---
    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;

      // Mutex: reuse in-flight refresh if one is already running
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      try {
        const newToken = await refreshPromise;
        originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        return apiClient(originalRequest);
      } catch {
        // Refresh failed – already logged out inside refreshAccessToken
        return Promise.reject(error);
      }
    }

    // --- Extract server message from ApiEnvelope body ---
    const envelope = error.response?.data;
    const message =
      envelope?.message || error.message || "An unexpected error occurred";

    return Promise.reject(new Error(message));
  },
);

export default apiClient;
