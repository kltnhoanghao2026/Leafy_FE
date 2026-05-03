/**
 * Centralized routing configuration
 * Define all app routes and backend API endpoints here
 *
 * Backend: Spring Boot microservices with API Gateway at /api
 * Auth Service: /auth (handles login, signup, token refresh)
 * User Service: /users (user management - requires JWT)
 */

// ============================================================================
// APP ROUTES (Navigation)
// ============================================================================

export const ROUTES = {
  // Auth routes (no JWT required)
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    VERIFY_EMAIL: "/verify-email",
  },

  // Main app routes (JWT required)
  DASHBOARD: {
    ROOT: "/dashboard",
    AGRICULTURE_OVERVIEW: "/dashboard/agriculture-overview",
    ZONE_METRICS: (zoneId: string) => `/dashboard/metrics/${zoneId}`,
    DEVICE_DETAIL: (deviceId: string) => `/dashboard/devices/${deviceId}`,
    SEARCH: "/dashboard/search",
    DISEASE_PREDICTION: "/dashboard/disease-prediction",
    RAG_PANEL: "/dashboard/rag-panel",
    RAG_TREATMENT_PLAN: (planId: string) =>
      `/dashboard/rag-panel/treatment-plans/${planId}`,
    ALERTS: "/dashboard/alerts",
    ALERT_RULES: "/dashboard/alert-rules",
    PENDING_REQUESTS: "/dashboard/pending-requests",
    DEVICES: "/dashboard/devices",
    DEVICE_ONBOARDING: "/dashboard/devices/onboarding",
    PLANTS: "/dashboard/plants",
    PLANT_DETAIL: (plantId: string) => `/dashboard/plants/${plantId}`,
    PLANS: "/dashboard/plans",
    PLAN_DETAIL: (planId: string) =>
      `/dashboard/plans/${planId}`,
    PLANT_EVENTS_CALENDAR: "/dashboard/plant-events/calendar",
    DISEASE_DIAGNOSIS: "/dashboard/disease-diagnosis",
    DIAGNOSIS_HISTORY: "/dashboard/disease-diagnosis/history",
    RAG_PANEL: "/dashboard/rag-panel",
    RAG_PLAN: (planId: string) =>
      `/dashboard/rag-panel/plans/${planId}`,
    COMMUNITY: "/dashboard/community",
    EXPERTS: "/dashboard/experts",
    CHAT: "/dashboard/chat",
    SETTINGS: "/dashboard/settings",
    MY_PROFILE: "/dashboard/profile",
    PROFILE_VIEW: (profileId: string) => `/dashboard/profile/${profileId}`,
  },

  // Admin routes (JWT required, ADMIN role required)
  ADMIN: {
    ROOT: "/admin",
    OVERVIEW: "/admin/overview",
    USERS: "/admin/users",
    FARMS: "/admin/farms",
    FARM_DETAIL: (plotId: string) => `/admin/farms/${plotId}`,
    FARM_ZONE_DETAIL: (zoneId: string) => `/admin/farms/zones/${zoneId}`,
    CONTENT: "/admin/content",
    HEALTH: "/admin/health",
    ANALYTICS: "/admin/analytics",
    PLANTS: "/admin/plants",
    PLANT_DETAIL: (id: string) => `/admin/plants/${id}`,
    SPECIES: "/admin/species",
    SPECIES_DETAIL: (id: string) => `/admin/species/${id}`,
    PLANT_EVENTS: "/admin/plant-events",
    PLANT_EVENT_DETAIL: (id: string) => `/admin/plant-events/${id}`,
    DISEASES: "/admin/diseases",
    PROFILES: "/admin/profiles",
    PROFILE_DETAIL: (profileId: string) => `/admin/profiles/${profileId}`,
    CERTIFICATES: "/admin/certificates",
    KNOWLEDGE_BASE: "/admin/knowledge-base",
    SEEDING: "/admin/seeding",
    SYNC: "/admin/sync",
    IOT_DEMO_TOOLS: "/admin/iot-demo-tools",
  },
} as const;

// ============================================================================
// ROUTE HELPERS
// ============================================================================

const normalizePath = (pathname: string): string => {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

/**
 * Check if pathname is a protected route (requires JWT)
 */
export const isProtectedRoute = (pathname?: string): boolean => {
  if (!pathname) return false;
  const normalizedPath = normalizePath(pathname);

  return (
    normalizedPath === ROUTES.DASHBOARD.ROOT ||
    normalizedPath.startsWith(`${ROUTES.DASHBOARD.ROOT}/`) ||
    normalizedPath === ROUTES.ADMIN.ROOT ||
    normalizedPath.startsWith(`${ROUTES.ADMIN.ROOT}/`)
  );
};

/**
 * Check if pathname is an auth route
 */
export const isAuthRoute = (pathname?: string): boolean => {
  if (!pathname) return false;
  const normalizedPath = normalizePath(pathname);
  const authRoutes = [
    ROUTES.AUTH.LOGIN,
    ROUTES.AUTH.REGISTER,
    ROUTES.AUTH.VERIFY_EMAIL,
  ];
  return authRoutes.some(
    (route) =>
      normalizedPath === route || normalizedPath.startsWith(`${route}/`),
  );
};

// ============================================================================
// API ENDPOINTS (Backend)
// ============================================================================

/**
 * Auth Service endpoints
 * All endpoints return ApiResponse<T> format
 */
export const API_ENDPOINTS = {
  AUTH: {
    // 2-step registration flow with OTP
    REGISTER_INIT: "/auth/register/init",
    REGISTER_VERIFY: "/auth/register/verify",
    REGISTER_RESEND_OTP: "/auth/register/resend-otp",

    // Login
    LOGIN: "/auth/login",

    // Token refresh
    REFRESH: "/auth/refresh",

    // Logout
    LOGOUT: "/auth/logout",
    LOGOUT_DEVICE: "/auth/logout-device",
    LOGOUT_OTHER: "/auth/logout-other",
  },

  PROFILES: {
    ME: "/profiles/me",
    GET: (profileId: string) => `/profiles/${profileId}`,
    GET_BY_USER: (userId: string) => `/profiles/user/${userId}`,
    PUBLIC_EXPERTS: "/profiles/experts",
    APPROVAL_REQUESTS: (profileId: string) =>
      `/profiles/${profileId}/approval-requests`,
    PENDING_APPROVAL_REQUESTS: `/profiles/admin/approval-requests/pending`,
    PROCESSED_APPROVAL_REQUESTS: `/profiles/admin/approval-requests/processed`,
    UPDATE_APPROVAL_STATUS: (profileId: string, requestId: string) =>
      `/profiles/${profileId}/approval-requests/${requestId}/status`,
    REVOKE_APPROVAL: (profileId: string, requestId: string) =>
      `/profiles/${profileId}/approval-requests/${requestId}/revoke`,
    // Admin-only endpoints
    LIST: "/profiles",
    SEARCH_EXPERTS: "/profiles/search/experts",
    SEARCH: "/profiles/search",
    DETAILS: (profileId: string) => `/profiles/${profileId}/details`,
    ACTIVATE: (profileId: string) => `/profiles/${profileId}/activate`,
    DEACTIVATE: (profileId: string) => `/profiles/${profileId}/deactivate`,
    VERIFY: (profileId: string) => `/profiles/${profileId}/verify`,
    DELETE: (profileId: string) => `/profiles/${profileId}`,
    PUBLIC: (profileId: string) => `/profiles/public/${profileId}`,
  },

  FILES: {
    UPLOAD: "/files/upload",
    PRESIGNED_URL: (fileId: string) => `/files/presigned-url/${fileId}`,
    PRESIGNED_UPLOAD_URL: "/files/presigned-upload-url",
    CREATE: "/files",
  },

  PREFERENCES: {
    ME: "/preferences/me",
    APPEARANCE: "/preferences/appearance",
  },

  USERS: {
    ME: "/users/me",
    CREATE: "/users",
    GET: (userId: string) => `/users/${userId}`,
    GET_DETAILS: (userId: string) => `/users/${userId}/details`,
    UPDATE: (userId: string) => `/users/${userId}`,
    DELETE: (userId: string) => `/users/${userId}`,
    LIST: "/users",
    ACTIVE: "/users/active",
    SEARCH: "/users/search",
    CHECK_EMAIL: "/users/check-email",
    CHECK_PHONE: "/users/check-phone",
    ACTIVATE: (userId: string) => `/users/${userId}/activate`,
    DEACTIVATE: (userId: string) => `/users/${userId}/deactivate`,
  },

  COMMUNITY: {
    CREATE_POST: "/posts",
    FEED_POSTS: "/posts/feed",
    POST_BY_ID: (postId: string) => `/posts/${postId}`,
    POSTS_BY_USER: (userId: string) => `/posts/user/${userId}`,
    CREATE_COMMENT: "/comments",
    COMMENTS_BY_POST: (postId: string) => `/comments/posts/${postId}`,
    REPLIES_BY_COMMENT: (commentId: string) => `/comments/${commentId}/replies`,
    VOTES_BY_POST: (postId: string) => `/votes/posts/${postId}`,
    VOTE: (targetType: "POST" | "COMMENT", targetId: string) =>
      `/votes/${targetType}/${targetId}`,
  },

  FARMS: {
    PLOTS: "/farms/plots",
    PLOT: (id: string) => `/farms/plots/${id}`,
    PLOT_ZONES: (plotId: string) => `/farms/plots/${plotId}/zones`,
    ZONE: (id: string) => `/farms/zones/${id}`,
    ADMIN_PLOTS: "/farms/plots/admin",
    ADMIN_ZONES: "/farms/admin/zones",
  },

  PLANTS: {
    LIST: "/plants",
    ITEM: (id: string) => `/plants/${id}`,
    BY_FARM_PLOT: (farmPlotId: string) => `/plants/farm-plot/${farmPlotId}`,
    BY_SPECIES: (speciesId: string) => `/plants/species/${speciesId}`,
  },

  SPECIES: {
    LIST: "/species",
    ITEM: (id: string) => `/species/${id}`,
    CREATE: "/species",
    UPDATE: (id: string) => `/species/${id}`,
    DELETE: (id: string) => `/species/${id}`,
    SEED_PERENUAL: "/species/seed/perenual",
  },

  PLANT_EVENTS: {
    LIST_ALL: "/plant-events",
    CREATE: "/plant-events",
    BULK_CREATE: "/plant-events/bulk",
    ITEM: (eventId: string) => `/plant-events/${eventId}`,
    BY_PLANT: (plantId: string) => `/plant-events/plant/${plantId}`,
    BY_PLANT_TYPE: (plantId: string, eventType: string) =>
      `/plant-events/plant/${plantId}/type/${eventType}`,
    BY_PLANT_PLANNED: (plantId: string) =>
      `/plant-events/plant/${plantId}/planned`,
    BY_PLAN: (sourcePlanId: string) => `/plant-events/plan/${sourcePlanId}`,
    BY_FARM_PLOT: (farmPlotId: string) =>
      `/plant-events/farm-plot/${farmPlotId}`,
    BY_FARM_ZONE: (farmZoneId: string) =>
      `/plant-events/farm-zone/${farmZoneId}`,
    CALENDAR: "/plant-events/calendar",
  },

  PLANS: {
    LIST: "/plans",
    CREATE: "/plans",
    ITEM: (planId: string) => `/plans/${planId}`,
    UPDATE_STATUS: (planId: string) => `/plans/${planId}/status`,
    MY: "/plans/me",
    BY_PLANT: (plantId: string) => `/plans/plant/${plantId}`,
    BY_FARM_PLOT: (farmPlotId: string) =>
      `/plans/farm-plot/${farmPlotId}`,
    BY_FARM_ZONE: (farmZoneId: string) =>
      `/plans/farm-zone/${farmZoneId}`,
  },

  SEARCH: {
    POSTS: "/search/posts/search",
    PROFILES: "/search/profiles/search",
    UNIFIED: "/search/search",
  },

  RAG: {
    HEALTH: "/rag/health",
    CHAT: "/rag/v1/chat",
    CHAT_STREAM: "/rag/v1/chat/stream",
    CONVERSATIONS: "/rag/v1/conversations",
    CONVERSATION: (conversationId: string) =>
      `/rag/v1/conversations/${conversationId}`,
    PLAN: (planId: string) => `/rag/v1/plans/${planId}`,
    INGEST: "/rag/v1/ingest",
    PREVIEW: "/rag/v1/preview",
    DOCUMENTS: "/rag/v1/documents",
    DOCUMENT: (documentId: string) => `/rag/v1/documents/${documentId}`,
    TASKS: "/rag/v1/tasks",
    TASK: (taskId: string) => `/rag/v1/tasks/${taskId}`,
    TREATMENT_PLANS: "/rag/v1/treatment-plans/",
    TREATMENT_PLAN: (planId: string) => `/rag/v1/treatment-plans/${planId}`,
  },

  DISEASES: {
    DETECT_LEAF: "/diseases/detect-leaf",
    DETECT_LEAF_HEALTH: "/diseases/detect-leaf/health",
    DETECT_LEAF_VISUALIZE: "/diseases/detect-leaf/visualize",
    DETECT_LEAF_CROP: "/diseases/detect-leaf/crop",
    PREDICT: "/diseases/predict",
    PREDICT_HEALTH: "/diseases/predict/health",
    PREDICT_TFLITE: "/diseases/predict/tflite",
    DIAGNOSE_REQUESTS: "/diseases/diagnose/requests",
    DIAGNOSE_REQUEST: (requestId: string) =>
      `/diseases/diagnose/requests/${requestId}`,
    DIAGNOSE_RESULTS: "/diseases/diagnose/results",
    DIAGNOSE_RESULT_BY_REQUEST: (requestId: string) =>
      `/diseases/diagnose/results/by-request/${requestId}`,
  },

  PUSH_TOKENS: {
    REGISTER: "/push-tokens",
    DEACTIVATE: "/push-tokens/deactivate",
  },

  IOT: {
    METRICS: "/iot/metrics",
    DEVICES: "/iot/devices",
    DEVICE: (id: string) => `/iot/devices/${id}`,
    MY_DEVICES: "/iot/devices/me",
    DEVICE_PROVISION: "/iot/devices/provision",
    DEVICE_CLAIM: "/iot/devices/claim",
    DEVICE_CLAIM_CODE: (deviceId: string) =>
      `/iot/devices/${deviceId}/claim-code`,
    DEVICE_DETAIL: (deviceId: string) => `/iot/devices/${deviceId}/detail`,
    DEVICE_LATEST_READINGS: (deviceId: string) =>
      `/iot/devices/${deviceId}/latest-readings`,
    DEVICE_CHARTS: (deviceId: string) => `/iot/devices/${deviceId}/charts`,
    DEVICE_CONFIG: (deviceId: string) => `/iot/devices/${deviceId}/config`,
    DEVICE_CONFIG_PUSH: (deviceId: string) =>
      `/iot/devices/${deviceId}/config/push`,
    DEVICE_CAMERA_CAPTURE: (deviceId: string) =>
      `/iot/devices/${deviceId}/camera/capture`,
    DEVICE_MEDIA: (deviceId: string) => `/iot/devices/${deviceId}/media`,
    MEDIA_EVENT: (mediaEventId: string) => `/iot/media-events/${mediaEventId}`,
    DASHBOARD_OVERVIEW: "/iot/dashboard/overview",
    FARM_ZONE_OVERVIEW: (zoneId: string) =>
      `/iot/farm-zones/${zoneId}/overview`,
    FARM_ZONE_CHARTS: (zoneId: string) => `/iot/farm-zones/${zoneId}/charts`,
    ALERT_EVENTS: "/iot/alert-events",
    ALERT_EVENT: (alertEventId: string) => `/iot/alert-events/${alertEventId}`,
    ALERT_EVENT_ACKNOWLEDGE: (alertEventId: string) =>
      `/iot/alert-events/${alertEventId}/acknowledge`,
    ALERT_EVENT_RESOLVE: (alertEventId: string) =>
      `/iot/alert-events/${alertEventId}/resolve`,
    ALERT_RULES: "/iot/alert-rules",
    ALERT_RULE: (ruleId: string) => `/iot/alert-rules/${ruleId}`,
    ALERT_RULE_ENABLED: (ruleId: string) =>
      `/iot/alert-rules/${ruleId}/enabled`,
  },

  MESSAGES: {
    ROOT: "/conversations",
    CONVERSATIONS: "/conversations",
    CONVERSATION: (id: string) => `/conversations/${id}`,
    MESSAGES: (conversationId: string) =>
      `/conversations/${conversationId}/messages`,
    MEDIA: (conversationId: string) =>
      `/conversations/${conversationId}/media`,
    FILES: (conversationId: string) =>
      `/conversations/${conversationId}/files`,
    SEND: (conversationId: string) => `/conversations/${conversationId}/messages`,
    MESSAGE_EDIT: (messageId: string) => `/messages/${messageId}`,
    MESSAGE_REVOKE: (messageId: string) => `/messages/${messageId}/revoke`,
    MESSAGE_DELETE_ME: (messageId: string) => `/messages/${messageId}/me`,
  },

  ADMIN: {
    HEALTH: "/admin/health",
    SYNC: {
      // Profile sync — profile-service /profiles/sync/*
      PROFILES_START: "/profiles/sync/start",
      PROFILES_RESUME: (taskId: string) => `/profiles/sync/resume/${taskId}`,
      PROFILES_STATUS: (taskId: string) => `/profiles/sync/status/${taskId}`,
      // Profile sync - search-service direct ES sync
      PROFILES_REINDEX: "/search/profiles/reindex-all",
      PROFILES_RESET: "/search/profiles/reset",
      // Post sync — search-service /sync/posts/* (via /api/search/sync/**)
      POSTS_REINDEX: "/search/sync/posts",
      POSTS_RESET: "/search/sync/posts/reset",
      // Failed events DLQ — search-service /failed-events/* (via /api/search/failed-events/**)
      FAILED_EVENTS_LIST: "/search/failed-events",
      FAILED_EVENTS_COUNT: "/search/failed-events/count",
      FAILED_EVENTS_RESOLVE: (id: string) =>
        `/search/failed-events/${id}/resolved`,
      FAILED_EVENTS_RETRY: (id: string) => `/search/failed-events/${id}/retry`,
      FAILED_EVENTS_RETRY_ALL: "/search/failed-events/retry/all",
      // ChatUser sync — message-service /conversations/admin/sync-chat-users
      CHAT_USERS_SYNC: "/conversations/admin/sync-chat-users",
    },
    SEED: {
      ACCOUNTS: "/admin/seed/accounts",
      FARMS: "/admin/seed/farms",
      PLANTS: "/admin/seed/plants",
      SPECIES_PERENUAL: "/admin/seed/species/perenual",
      COMMUNITY: "/admin/seed/community",
      COMMUNITY_PROFILES: "/admin/seed/profiles",
      CERTIFICATES: "/admin/seed/certificates",
      EXPERTS: "/admin/seed/experts",
    },
  },
} as const;

// ============================================================================
// TYPES
// ============================================================================

export type RootRoutes = typeof ROUTES;
export type ApiEndpoints = typeof API_ENDPOINTS;

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Error codes from backend (ErrorCode.java)
 */
export const ERROR_CODES = {
  SUCCESS: 1000,
  AUTH_UNAUTHENTICATED: 1001,
  AUTH_UNAUTHORIZED: 1002,
  JWT_INVALID_TOKEN: 1003,
  JWT_EXPIRED_TOKEN: 1004,
  JWT_SIGNATURE_INVALID: 1005,
  AUTH_INVALID_CREDENTIALS: 1006,
  AUTH_DEVICE_ID_REQUIRED: 1007,
  AUTH_DEVICE_MISMATCH: 1008,
  AUTH_SESSION_KICKED: 1009,
  TOKEN_REVOKED: 1010,
  TOKEN_REPLAY_DETECTED: 1011,
  RATE_LIMIT_EXCEEDED: 1012,
  REFRESH_TOKEN_NOT_FOUND: 1013,
  REFRESH_TOKEN_INVALID: 1014,
  TOKEN_FAMILY_REVOKED: 1015,
  ACC_PHONE_NUMBER_ALREADY_USED: 2001,
  ACC_EMAIL_ALREADY_USED: 2002,
  ACC_ACCOUNT_NOT_FOUND: 2003,
  USER_NOT_FOUND: 2004,
  INVALID_OTP: 2005,
  ACC_WRONG_PASSWORD: 2006,
  ACC_IS_OAUTH: 2007,
  CIC_IS_EXIST: 2008,
  OTP_COOLDOWN_ACTIVE: 2009,
  OTP_MAX_ATTEMPTS_EXCEEDED: 2010,
  OTP_EXPIRED: 2011,
  OTP_INVALID: 2012,
  OTP_PURPOSE_MISMATCH: 2013,
  OTP_NOT_FOUND: 2014,
  REGISTRATION_DATA_EXPIRED: 2015,
  VALIDATION_ERROR: 2200,
  ACC_PASSWORD_MISMATCH: 2207,
  SYS_UNCATEGORIZED: 9999,
} as const;

/**
 * Get human-readable error message from error code
 */
export const getErrorMessage = (code: number): string => {
  const messages: Record<number, string> = {
    [ERROR_CODES.SUCCESS]: "Success",
    [ERROR_CODES.AUTH_UNAUTHENTICATED]: "Session expired. Please log in again.",
    [ERROR_CODES.AUTH_UNAUTHORIZED]:
      "You do not have permission to perform this action.",
    [ERROR_CODES.JWT_INVALID_TOKEN]: "Invalid session. Please log in again.",
    [ERROR_CODES.JWT_EXPIRED_TOKEN]:
      "Your session has expired. Please log in again.",
    [ERROR_CODES.JWT_SIGNATURE_INVALID]:
      "Invalid session. Please log in again.",
    [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: "Invalid email or password.",
    [ERROR_CODES.AUTH_DEVICE_ID_REQUIRED]: "Device ID is required.",
    [ERROR_CODES.AUTH_DEVICE_MISMATCH]:
      "This session does not belong to this device.",
    [ERROR_CODES.AUTH_SESSION_KICKED]: "This session has been terminated.",
    [ERROR_CODES.TOKEN_REVOKED]:
      "Your session was revoked. Please log in again.",
    [ERROR_CODES.TOKEN_REPLAY_DETECTED]:
      "A security issue was detected. Please log in again.",
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]:
      "Too many requests. Please try again later.",
    [ERROR_CODES.REFRESH_TOKEN_NOT_FOUND]:
      "Refresh token not found. Please log in again.",
    [ERROR_CODES.REFRESH_TOKEN_INVALID]:
      "Refresh token is invalid. Please log in again.",
    [ERROR_CODES.TOKEN_FAMILY_REVOKED]:
      "Your session family was revoked. Please log in again.",
    [ERROR_CODES.ACC_PHONE_NUMBER_ALREADY_USED]:
      "This phone number is already registered.",
    [ERROR_CODES.ACC_EMAIL_ALREADY_USED]: "This email is already registered.",
    [ERROR_CODES.ACC_ACCOUNT_NOT_FOUND]: "Account not found.",
    [ERROR_CODES.USER_NOT_FOUND]: "User not found.",
    [ERROR_CODES.INVALID_OTP]: "Invalid or expired OTP. Please try again.",
    [ERROR_CODES.ACC_WRONG_PASSWORD]: "Incorrect password.",
    [ERROR_CODES.ACC_IS_OAUTH]: "This account uses OAuth sign-in.",
    [ERROR_CODES.CIC_IS_EXIST]: "This identifier already exists.",
    [ERROR_CODES.OTP_COOLDOWN_ACTIVE]:
      "Please wait before requesting another OTP.",
    [ERROR_CODES.OTP_MAX_ATTEMPTS_EXCEEDED]:
      "Too many OTP attempts. Please request a new OTP.",
    [ERROR_CODES.OTP_EXPIRED]: "OTP expired. Please request a new code.",
    [ERROR_CODES.OTP_INVALID]: "OTP is invalid.",
    [ERROR_CODES.OTP_PURPOSE_MISMATCH]: "OTP purpose mismatch.",
    [ERROR_CODES.OTP_NOT_FOUND]: "OTP not found.",
    [ERROR_CODES.REGISTRATION_DATA_EXPIRED]:
      "Registration data expired. Start again.",
    [ERROR_CODES.VALIDATION_ERROR]: "Please review the highlighted fields.",
    [ERROR_CODES.ACC_PASSWORD_MISMATCH]: "Passwords do not match.",
    [ERROR_CODES.SYS_UNCATEGORIZED]: "An unexpected error occurred.",
  };

  return messages[code] || "An error occurred.";
};
