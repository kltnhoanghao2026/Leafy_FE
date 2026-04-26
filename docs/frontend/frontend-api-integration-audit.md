# Frontend API Integration Audit

Audit date: 2026-04-18

Scope: current React frontend in `Leafy_FE/src`, with source code as the source of truth. Existing docs were used only as a starting hypothesis and are treated as outdated where they conflict with the current code.

Classification key:

- A. Fully integrated
- B. Partially integrated
- C. API-ready but not used
- D. Local/mock only
- E. Route declared but page missing/incomplete
- F. Visual-only / placeholder action

## SECTION 1 - EXECUTIVE SUMMARY

Inspected 12 major frontend feature areas:

| Classification | Feature areas |
| --- | --- |
| A - Fully integrated | Alert rule management; device onboarding/claim; device detail/config; zone metrics data path |
| B - Partially integrated | Auth; profile/settings; push notifications; dashboard overview; alerts/alert center |
| C - API-ready but not used | Some auth logout/session mutations; push token query hooks; profile duplicate service wrappers; alert rule detail hook; many endpoint constants |
| D - Local/mock only | Device management/inventory screen; community feed/widgets/interactions |
| E - Route declared but missing | Search, monitor, experts, reports; demo/operator tooling has no FE route |
| F - Visual-only / placeholder actions | Google auth buttons, forgot password link, profile camera button, community messaging, legacy quick actions/widgets |

Biggest backend-integration wins since `docs/feature_implementation_workflow.md`:

- Dashboard no longer uses the old local static `AREAS` array. `DashboardPage` now reads `/iot/dashboard/overview`.
- Zone metrics no longer use `MOCK_ZONES_DATA` as the visible page data source. `ZoneDetailMetricsPage` uses `/iot/farm-zones/{zoneId}/overview`, `/charts`, and recent alerts.
- Alerts now have a real page at `/dashboard/alerts` with backend list, filters, and pagination.
- Device detail is now backend-driven and includes detail, latest readings, charts, config read/update, config push, push status, and short polling after push.
- Alert rules now have real CRUD and enable/disable mutations.
- Device onboarding now uses provision, claim-code, claim, and `/iot/devices/me`.

Biggest gaps:

- `/dashboard/devices` is still the old local-only farm/zone/module management screen backed by `management-storage`, while backend-owned inventory is shown inside `/dashboard/devices/onboarding`.
- Community remains entirely local/mock despite community endpoint constants.
- Alert lifecycle actions are not wired: backend has acknowledge/resolve endpoints, but the alert center is read-only.
- Several navigation items point to missing pages: search, monitor, experts, reports.
- Several wrappers/hooks exist but are unused, especially auth logout/session mutations and notification mutation hooks.
- Header/sidebar/navigation are inconsistent: sidebar "Thiet bi" opens onboarding, header "Cam bien" opens the local-only management page.

Outdated doc notes:

- `docs/feature_implementation_workflow.md` still says dashboard uses local `AREAS`, zone detail uses `MOCK_ZONES_DATA`, and `/dashboard/alerts` is missing. Current source contradicts those points.
- That doc remains accurate for local-only device management and local-only community.

## SECTION 2 - ROUTE INVENTORY AUDIT

| Route | Declared in `src/lib/routes.ts`? | Registered in `src/App.tsx`? | Visible in sidebar/header? | Real page component? | Data source type | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `/login` | Yes | Yes | No | `LoginPage` | Auth API mutation | B - partial |
| `/register` | Yes | Yes | No | `RegisterPage` | Auth API mutation + register store form state | B - partial |
| `/verify-email` | Yes | Yes | No | `VerifyEmailPage` | Auth API OTP/resend mutation + sessionStorage pending email | B - partial |
| `/dashboard` | Yes | Yes index | Sidebar home + header area tab | `DashboardPage` | `/iot/dashboard/overview`; farmPlotId from localStorage/env | B - partial |
| `/dashboard/metrics/:zoneId` | Route helper only | Yes as `metrics/:zoneId` | Not direct nav; reachable from dashboard form | `ZoneDetailMetricsPage` | `/iot/farm-zones/{id}/overview`, `/charts`, `/iot/alert-events` | A - integrated data path |
| `/dashboard/alerts` | Yes | Yes | Sidebar | `AlertsPage` | `/iot/alert-events` | B - read-only |
| `/dashboard/alert-rules` | Yes | Yes | Sidebar | `AlertRulesPage` | `/iot/alert-rules` CRUD | A - integrated |
| `/dashboard/devices` | Yes | Yes | Header "Cam bien" tab; dashboard link | `DeviceManagementPage` | Persisted Zustand `management-storage` seeded by `MOCK_DEVICES_DATA` | D - local/mock |
| `/dashboard/devices/onboarding` | Yes | Yes | Sidebar "Thiet bi" | `DeviceOnboardingPage` | Collector device onboarding + `/iot/devices/me` | A - integrated |
| `/dashboard/devices/:deviceId` | Route helper only | Yes | Links from onboarding table | `DeviceDetailPage` | Collector detail/readings/charts/config/push | A - integrated |
| `/dashboard/community` | Yes | Yes | Sidebar | `CommunityView` | Persisted Zustand `community-storage` seeded by mock community data | D - local/mock |
| `/dashboard/settings` | Yes | Yes | Sidebar + profile tile | `SettingsView` | `/profiles/me`, `/profiles/user/{userId}` for profile; theme local only | B - partial |
| `/dashboard/search` | Yes | No | Sidebar | No | None | E - missing |
| `/dashboard/monitor` | Yes | No | Sidebar | No | None | E - missing |
| `/dashboard/experts` | Yes | No | Sidebar | No | None | E - missing |
| `/dashboard/reports` | Yes | No | Header "Bao cao" tab | No | None | E - missing |
| Any notification list route | API endpoint constants only | No | No | No | None | E - missing |
| Demo/operator/test-data route | No | No | No | No | None | E - missing |

Route mismatches:

- `src/lib/routes.ts` declares `SEARCH`, `MONITOR`, `EXPERTS`, and `REPORTS`, and `Sidebar`/`Header` link to them, but `App.tsx` has no matching routes. Clicking them falls through to the wildcard redirect back to `/dashboard`.
- `Sidebar` sends "Thiet bi" to `/dashboard/devices/onboarding`, but `Header` sends "Cam bien" to `/dashboard/devices`. These are different screens with different data models.
- `ROUTES.DASHBOARD.DEVICES` is still the old local-only management page, not the backend `/iot/devices/me` inventory.

## SECTION 3 - FEATURE-BY-FEATURE AUDIT

### 1. Auth

Current classification: B - partially integrated.

Routes/pages: `/login`, `/register`, `/verify-email`.

API wrappers and hooks used:

- `authApi.login` -> `POST /auth/login`, used by `useLoginMutation` and `useLogin`.
- `authApi.initiateRegistration` -> `POST /auth/register/init`, used by `useRegisterLogic`.
- `authApi.verifyOtpAndRegister` -> `POST /auth/register/verify`, used by `VerifyOTPForm`.
- `authApi.resendOtp` -> `POST /auth/register/resend-otp`, used by `VerifyOTPForm`.
- Axios refresh interceptor calls `/auth/refresh` directly.

Actual UI data source:

- Tokens are persisted in `useAuthStore`.
- Register form state is local Zustand in `useRegisterStore`.
- Pending verification email is stored in `sessionStorage`.
- Current user is hydrated later from profile data in `AuthSessionBootstrap`.

Backend-wired actions:

- Login, registration init, OTP verify, and resend OTP are real backend mutations.
- Token refresh is wired through the Axios interceptor.

Mock/local/static/placeholder parts:

- Google auth buttons are visual only.
- Forgot-password and terms/privacy links are placeholders.
- Visible logout does not call `authApi.logout`; `useLogout` clears client state and optionally calls push-token deactivate.

Unused or half-wired assets:

- `useLogoutMutation`, `useLogoutDeviceMutation`, `useLogoutOtherDevicesMutation`, and `useRefreshAccessTokenMutation` exist but are not used by visible screens.
- `authApi.logout`, `authApi.logoutDevice`, and `authApi.logoutOtherDevices` are wrappers without visible consumers.

### 2. Profile / Settings

Current classification: B - partially integrated.

Routes/pages: `/dashboard/settings`.

API wrappers and hooks used:

- `profileApi.getMyProfile` -> `GET /profiles/me`, used by `useMyProfile`.
- `profileApi.getByUserId` -> `GET /profiles/user/{userId}`, exposed through `useProfileByUserId`.
- `profileApi.updateByUserId` -> `PUT /profiles/user/{userId}`, used by `useUpdateProfileMutation`.

Actual UI data source:

- Profile card and sidebar user tile read backend profile data.
- Theme state comes from local `useSettingsStore`.

Backend-wired actions:

- Profile save calls `PUT /profiles/user/{userId}`.

Mock/local/static/placeholder parts:

- Display theme toggle updates local Zustand only.
- Profile camera button is visual only.
- Full name, role, email, and phone are read-only.
- Save payload contains `bio`, but the current card does not render a bio input, so the action usually resends the loaded bio unchanged.
- `AboutCard` content and stats are static.

Important notes:

- `src/features/settings/services/profileApi.ts` duplicates profile API functions but is not imported anywhere.
- `profileApi.getMyProfile` only adds `X-User-Id` when `authStore.user?.id` exists. On fresh login this may race with profile hydration unless the gateway injects the user header.

### 3. Push Notifications

Current classification: B - partially integrated.

Routes/pages: no standalone route; `PushNotificationsBootstrap` renders inside `DashboardLayout`.

API wrappers and hooks:

- Visible bootstrap uses `apiRegisterPushToken` from `src/features/notifications/services/pushApi.ts` -> `POST /push-tokens`.
- Logout uses `apiDeactivatePushToken` -> `POST /push-tokens/deactivate`.
- `src/features/notifications/api/push.api.ts` and `queries/mutations.ts` define object-style wrappers and mutation hooks, but visible UI does not use them.

Actual UI data source:

- Browser Notification permission.
- Firebase Messaging token.
- Local push store persists `currentToken`.

Backend-wired actions:

- Enabling notifications can register a web FCM token.
- Logout attempts push-token deactivation.

Mock/local/static/placeholder parts:

- No notification inbox/list UI despite `API_ENDPOINTS.NOTIFICATIONS`.
- Foreground push only shows toast; there is no backend notification log screen.
- Banner states are local browser capability states.

Important backend mismatch:

- Current backend source in `notification-service` exposes `POST /push-tokens`; no `/push-tokens/deactivate` controller endpoint was found. The frontend currently calls a likely missing endpoint on logout.

### 4. Dashboard Overview

Current classification: B - partially integrated.

Routes/pages: `/dashboard`.

API wrappers and hooks:

- `collectorApi.getDashboardOverview` -> `GET /iot/dashboard/overview?farmPlotId=...`.
- `useDashboardOverview`.

Actual UI data source:

- Backend returns total devices, online/offline devices, total zones, open alerts, and last updated time.
- Farm plot scope comes from `leafy.iot.farmPlotId` in localStorage, `VITE_IOT_FARM_PLOT_ID`, or manual input.

Backend-wired actions:

- Load/retry refetches dashboard overview.
- Links to alert center and device management are route navigation only.

Mock/local/static/placeholder parts:

- No static `AREAS` array in current `DashboardPage`.
- No backend farm plot picker/list.
- No backend zone cards because the overview API does not return per-zone summaries.
- Manual zone ID form only navigates to zone metrics.

Old doc conflict:

- `docs/feature_implementation_workflow.md` says dashboard uses local static `AREAS`. Current source no longer does.

### 5. Zone Metrics / Zone Overview

Current classification: A - fully integrated for visible data path.

Routes/pages: `/dashboard/metrics/:zoneId`.

API wrappers and hooks:

- `collectorApi.getZoneOverview` -> `GET /iot/farm-zones/{zoneId}/overview`.
- `collectorApi.getZoneChart` -> `GET /iot/farm-zones/{zoneId}/charts`.
- `collectorApi.getAlertEvents` through `RecentAlerts`.
- `useZoneOverview`, `useZoneChart`, `useAlertEvents`.

Actual UI data source:

- Latest readings and alert summaries come from zone overview.
- Trend cards come from chart API responses.
- Recent alert cards come from `/iot/alert-events?zoneId=...`.

Backend-wired actions:

- Range selector changes chart query range.
- Retry refetches backend data.
- Recent alerts "View all" routes to `/dashboard/alerts`.

Mock/local/static/placeholder parts:

- `SENSOR_CONFIG` is a static UI mapping for preferred sensor cards.
- `MOCK_ZONES_DATA` still exists but is not used by the current visible zone page.
- `ZoneTabSwitcher` still exists and reads local management zones, but current `ZoneDetailMetricsPage` does not render it.
- `latestMedia` from the backend `ZoneOverviewResponse` is not displayed.

Old doc conflict:

- Existing docs say zone metrics validate against management store, use `MOCK_ZONES_DATA`, and generate defaults. Current page does not do that.

### 6. Alerts / Alert Center

Current classification: B - partially integrated.

Routes/pages: `/dashboard/alerts`.

API wrappers and hooks:

- `collectorApi.getAlertEvents` -> `GET /iot/alert-events`.
- `useAlertEvents`.

Actual UI data source:

- Backend paged alert events.

Backend-wired actions:

- Severity/status/page-size filters change backend query params.
- Pagination changes backend page.
- Retry refetches backend data.

Mock/local/static/placeholder parts:

- No mock data on the current alert page.
- Lifecycle actions are absent. There are no acknowledge, resolve, close, or detail view buttons.

Important notes:

- Backend `AlertController` has `GET /iot/alert-events/{id}`, `POST /{id}/acknowledge`, and `POST /{id}/resolve`, but the frontend has no wrappers/hooks/UI actions for them.
- The page is intentionally read-only in copy and behavior.

### 7. Device Detail / Config

Current classification: A - fully integrated for current visible workflow.

Routes/pages: `/dashboard/devices/:deviceId`.

API wrappers and hooks:

- `collectorApi.getDeviceDetail` -> `GET /iot/devices/{deviceId}/detail`.
- `collectorApi.getDeviceLatestReadings` -> `GET /iot/devices/{deviceId}/latest-readings`.
- `collectorApi.getDeviceChart` -> `GET /iot/devices/{deviceId}/charts`.
- `collectorApi.getDeviceConfig` -> `GET /iot/devices/{deviceId}/config`.
- `collectorApi.updateDeviceConfig` -> `PUT /iot/devices/{deviceId}/config`.
- `collectorApi.pushDeviceConfig` -> `POST /iot/devices/{deviceId}/config/push`.
- Hooks: `useDeviceDetail`, `useDeviceLatestReadings`, `useDeviceChart`, `useDeviceConfig`, `useUpdateDeviceConfig`, `usePushDeviceConfig`.

Actual UI data source:

- Device metadata, readings, charts, config snapshot, push status, ack/error state all come from backend collector APIs.

Backend-wired actions:

- Chart range buttons fetch new chart ranges.
- Save config sends `PUT /iot/devices/{id}/config`.
- Push config sends `POST /iot/devices/{id}/config/push`.
- After save/push, queries are invalidated/refetched.
- After push, the page polls config every 4 seconds for up to 45 seconds until status is `ACKED` or `FAILED`.

Mock/local/static/placeholder parts:

- Static `SENSOR_CONFIG` is only a UI display mapping.
- No mock device data is used by this page.

Important limitations:

- Config actions are disabled unless `isActive === true` and `provisioningStatus === "CLAIMED"`.
- `latestMedia` and `alertSummary` from device detail are not surfaced.
- Polling observes config status only; it does not call the test-data ack endpoints.

### 8. Alert Rule Management

Current classification: A - fully integrated.

Routes/pages: `/dashboard/alert-rules`.

API wrappers and hooks:

- `collectorApi.getAlertRules` -> `GET /iot/alert-rules`.
- `collectorApi.getAlertRule` -> `GET /iot/alert-rules/{ruleId}`.
- `collectorApi.createAlertRule` -> `POST /iot/alert-rules`.
- `collectorApi.updateAlertRule` -> `PUT /iot/alert-rules/{ruleId}`.
- `collectorApi.updateAlertRuleEnabled` -> `PATCH /iot/alert-rules/{ruleId}/enabled`.
- `collectorApi.deleteAlertRule` -> `DELETE /iot/alert-rules/{ruleId}`.
- Hooks: `useAlertRules`, `useAlertRule`, `useCreateAlertRule`, `useUpdateAlertRule`, `useUpdateAlertRuleEnabled`, `useDeleteAlertRule`.

Actual UI data source:

- Backend paged alert rule list.

Backend-wired actions:

- Filters and pagination call backend list with params.
- Create rule calls backend.
- Edit/save rule calls backend.
- Enable/disable calls backend.
- Delete calls backend.
- Queries are invalidated after mutations.

Mock/local/static/placeholder parts:

- No mock data source.
- Users manually type sensor/device/zone/farm IDs. No backend picker/dropdown integration.

Important limitations:

- `useAlertRule` and `collectorApi.getAlertRule` exist, but no visible detail page/modal uses them.
- The page depends on `X-User-Id` from `authStore.user` when calling collector APIs. On fresh auth state, user hydration may race with list queries.

### 9. Device Onboarding / Claim

Current classification: A - fully integrated.

Routes/pages: `/dashboard/devices/onboarding`.

API wrappers and hooks:

- `collectorApi.provisionDevice` -> `POST /iot/devices/provision`.
- `collectorApi.generateClaimCode` -> `POST /iot/devices/{deviceId}/claim-code`.
- `collectorApi.claimDevice` -> `POST /iot/devices/claim`.
- `collectorApi.getMyDevices` -> `GET /iot/devices/me`.
- Hooks: `useMyDevices`, `useProvisionDevice`, `useGenerateClaimCode`, `useClaimDevice`.

Actual UI data source:

- Owned devices table uses `/iot/devices/me`.
- Form results come from backend mutation responses.

Backend-wired actions:

- Provision submits to backend.
- Generate claim code submits to backend and fills the claim-code field.
- Claim submits to backend.
- Filters/pagination call `/iot/devices/me`.
- Device detail links route to `/dashboard/devices/:deviceId`.

Mock/local/static/placeholder parts:

- No mock device source.
- Farm plot ID and zone ID are manually typed. No backend farm/zone picker.

Important limitations:

- Like alert rules, collector calls require `X-User-Id` derived from `authStore.user`.
- The route is in sidebar as "Thiet bi", but the header device tab goes to the old local management screen.

### 10. Device Management / Inventory

Current classification: D - local/mock only.

Routes/pages: `/dashboard/devices`.

API wrappers and hooks: none.

Actual UI data source:

- `src/store/useManagementStore.ts`, persisted under `management-storage`.
- Initial seed data comes from `src/features/device-management/mockDevices.ts`.
- Local source-of-truth business data: `farmInfo`, `zones`, and `devices`.

Backend-wired actions:

- None.

Mock/local/static/placeholder parts:

- Farm info edit uses a local `setTimeout` to simulate API delay.
- Zone add/edit/delete mutates local persisted Zustand only.
- Device add/edit/delete mutates local persisted Zustand only.
- Sensor status, battery, last signal, and zone assignment are mock/local fields.

Important limitations:

- `EditDeviceModal` includes a zone selector, but `SensorTable` only applies `name` changes in `onEdit`.
- Zone IDs are generated from `String.fromCharCode(65 + zones.length)`, so duplicates can occur after deletion.
- Deleting a zone does not clean up devices assigned to that zone.
- This screen overlaps conceptually with backend device inventory but does not use `/iot/devices/me`.

### 11. Community

Current classification: D - local/mock only.

Routes/pages: `/dashboard/community`.

API wrappers and hooks: none.

Actual UI data source:

- `src/store/useCommunityStore.ts`, persisted under `community-storage`.
- Initial feed/widgets come from `src/features/community/mockCommunityData.ts`.
- Local source-of-truth business data: posts, comments/replies, likes, shares/reposts, hot topics, online experts.

Backend-wired actions:

- None.

Mock/local/static/placeholder parts:

- Create post waits 500 ms and inserts a local post.
- Image upload is a local `URL.createObjectURL` preview only.
- Comments/replies/likes/shares/reposts mutate local Zustand.
- Share link is generated locally.
- Messenger share option displays a toast.
- Hot topics and expert widgets are static mock arrays.
- Expert "Nhan tin" buttons are visual only.

Important limitations:

- `API_ENDPOINTS.COMMUNITY` declares posts/comments/votes endpoints, but there are no community API wrappers or visible query hooks.

### 12. Demo / Operator Tooling

Current classification: E - no frontend page.

Routes/pages: none.

API wrappers and hooks: none.

Backend/source evidence:

- Backend docs and scripts reference `iot-test-data-service` endpoints:
  - `POST /seed/bootstrap/minimal`
  - `POST /seed/bootstrap/full`
  - `POST /seed/simulation/start`
  - `POST /seed/simulation/stop`
  - `GET /seed/simulation/status`
  - `POST /seed/scenarios/high-temperature`
  - `POST /seed/scenarios/low-soil-moisture`
  - `POST /seed/scenarios/config-ack-success`
  - `POST /seed/scenarios/config-ack-failure`

Current UI behavior:

- No frontend screen, route, API wrapper, or button calls these endpoints.
- Backend `docs/iot/iot-demo-and-refresh-strategy.md` says bootstrap/history/simulation test-data endpoints should show response summaries directly to the operator. Current frontend does not implement this.

## SECTION 4 - API USAGE MATRIX

This section answers: "API nao da duoc gan vao giao dien, cai nao duoc dua vao su dung, cai nao van chi dung o muc mock/local or not used."

| Backend endpoint | Frontend wrapper/function | Hook | Visible UI consumer | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST /auth/login` | `authApi.login` | `useLoginMutation` | `LoginForm` via `useLogin` | Actively used | Stores tokens and navigates. |
| `POST /auth/register/init` | `authApi.initiateRegistration` | `useInitiateRegistrationMutation` | `RegisterForm` | Actively used | Starts OTP flow. |
| `POST /auth/register/verify` | `authApi.verifyOtpAndRegister` | `useVerifyOtpAndRegisterMutation` | `VerifyOTPForm` | Actively used | Completes registration. |
| `POST /auth/register/resend-otp` | `authApi.resendOtp` | `useResendOtpMutation` | `VerifyOTPForm` | Actively used | Resend action wired. |
| `POST /auth/refresh` | `authApi.refreshAccessToken`; direct axios in `apiClient` | `useRefreshAccessTokenMutation` unused | Axios interceptor | Partially used | Interceptor uses direct axios, hook unused. |
| `POST /auth/logout` | `authApi.logout` | `useLogoutMutation` | None | Wrapper exists but unused | Visible logout is local-only for auth session. |
| `POST /auth/logout-device` | `authApi.logoutDevice` | `useLogoutDeviceMutation` | None | Wrapper exists but unused | No UI. |
| `POST /auth/logout-other` | `authApi.logoutOtherDevices` | `useLogoutOtherDevicesMutation` | None | Wrapper exists but unused | No UI. |
| `GET /profiles/me` | `profileApi.getMyProfile`; duplicate `apiGetMyProfile` | `useMyProfile` | `AuthSessionBootstrap`, `Sidebar`, `ProfileSettingsCard`, push bootstrap | Actively used | Duplicate service wrapper unused. |
| `GET /profiles/user/{userId}` | `profileApi.getByUserId`; duplicate `apiGetProfileByUserId` | `useProfileByUserId` | None found | Wrapper/hook exists but unused | No visible profile detail page. |
| `PUT /profiles/user/{userId}` | `profileApi.updateByUserId`; duplicate `apiUpdateProfileByUserId` | `useUpdateProfileMutation` | `ProfileSettingsCard` | Partially used | Sends `bio`; no rendered bio input. |
| `POST /push-tokens` | `apiRegisterPushToken`; duplicate `pushApi.registerToken` | `useRegisterPushTokenMutation` unused | `PushNotificationsBootstrap` | Actively used | Bootstrap uses service function, not query hook. |
| `POST /push-tokens/deactivate` | `apiDeactivatePushToken`; duplicate `pushApi.deactivateToken` | `useDeactivatePushTokenMutation` unused | `useLogout` | Partially used / likely backend mismatch | No backend endpoint found in current source. |
| `GET /notifications` and read endpoints | Endpoint constants only | None | None | Not found in UI | No notification inbox. |
| `GET /iot/dashboard/overview` | `collectorApi.getDashboardOverview` | `useDashboardOverview` | `DashboardPage` | Actively used | Farm plot ID is local/manual. |
| `GET /iot/farm-zones/{zoneId}/overview` | `collectorApi.getZoneOverview` | `useZoneOverview` | `ZoneDetailMetricsPage` | Actively used | Latest readings and alert summary. |
| `GET /iot/farm-zones/{zoneId}/charts` | `collectorApi.getZoneChart` | `useZoneChart` | `ZoneDetailMetricsPage` | Actively used | Range selector wired. |
| `GET /iot/alert-events` | `collectorApi.getAlertEvents` | `useAlertEvents` | `AlertsPage`, `RecentAlerts` | Actively used | Filters/pagination wired. |
| `GET /iot/alert-events/{id}` | No wrapper | None | None | Not found in UI | Backend exists; no detail view. |
| `POST /iot/alert-events/{id}/acknowledge` | No wrapper | None | None | Not found in UI | Backend exists; lifecycle not wired. |
| `POST /iot/alert-events/{id}/resolve` | No wrapper | None | None | Not found in UI | Backend exists; lifecycle not wired. |
| `GET /iot/devices/{id}/detail` | `collectorApi.getDeviceDetail` | `useDeviceDetail` | `DeviceDetailPage` | Actively used | Metadata/detail page. |
| `GET /iot/devices/{id}/latest-readings` | `collectorApi.getDeviceLatestReadings` | `useDeviceLatestReadings` | `DeviceDetailPage` | Actively used | Readings cards. |
| `GET /iot/devices/{id}/charts` | `collectorApi.getDeviceChart` | `useDeviceChart` | `DeviceDetailPage` | Actively used | Range selector wired. |
| `GET /iot/devices/{id}/config` | `collectorApi.getDeviceConfig` | `useDeviceConfig` | `DeviceDetailPage` | Actively used | Push status and ack/error display. |
| `PUT /iot/devices/{id}/config` | `collectorApi.updateDeviceConfig` | `useUpdateDeviceConfig` | `DeviceDetailPage` | Actively used | Config save wired. |
| `POST /iot/devices/{id}/config/push` | `collectorApi.pushDeviceConfig` | `usePushDeviceConfig` | `DeviceDetailPage` | Actively used | Starts short polling watch. |
| `GET /iot/alert-rules` | `collectorApi.getAlertRules` | `useAlertRules` | `AlertRulesPage` | Actively used | Filters/pagination wired. |
| `GET /iot/alert-rules/{ruleId}` | `collectorApi.getAlertRule` | `useAlertRule` | None | Wrapper exists but unused | No detail modal/page. |
| `POST /iot/alert-rules` | `collectorApi.createAlertRule` | `useCreateAlertRule` | `AlertRulesPage` | Actively used | Manual ID inputs. |
| `PUT /iot/alert-rules/{ruleId}` | `collectorApi.updateAlertRule` | `useUpdateAlertRule` | `AlertRulesPage` | Actively used | Edit flow wired. |
| `PATCH /iot/alert-rules/{ruleId}/enabled` | `collectorApi.updateAlertRuleEnabled` | `useUpdateAlertRuleEnabled` | `AlertRulesPage` | Actively used | Enable/disable wired. |
| `DELETE /iot/alert-rules/{ruleId}` | `collectorApi.deleteAlertRule` | `useDeleteAlertRule` | `AlertRulesPage` | Actively used | Delete/refetch wired. |
| `POST /iot/devices/provision` | `collectorApi.provisionDevice` | `useProvisionDevice` | `DeviceOnboardingPage` | Actively used | Creates unclaimed device. |
| `POST /iot/devices/{id}/claim-code` | `collectorApi.generateClaimCode` | `useGenerateClaimCode` | `DeviceOnboardingPage` | Actively used | Displays/fills claim code. |
| `POST /iot/devices/claim` | `collectorApi.claimDevice` | `useClaimDevice` | `DeviceOnboardingPage` | Actively used | Requires current user header. |
| `GET /iot/devices/me` | `collectorApi.getMyDevices` | `useMyDevices` | `DeviceOnboardingPage` | Actively used | Real backend inventory currently visible. |
| `/iot/metrics`, `/iot/devices`, `/iot/devices/{id}` | Endpoint constants only | None | None | Not found in UI | Base CRUD not wrapped. |
| `/posts`, `/comments`, `/votes`, `/posts/feed` | Endpoint constants only | None | None | Not found in UI | Community is local/mock only. |
| `/farms/...` | Endpoint constants only | None | None | Not found in UI | Device management does not use farm APIs. |
| `/plants`, `/species`, `/plant-events`, `/treatment-plans` | Endpoint constants only | None | None | Not found in UI | No visible plant-management pages. |
| `/search/posts/search`, `/search/profiles/search` | Endpoint constants only | None | Missing `/dashboard/search` route | Not found in UI | Search nav has no page. |
| `/rag/v1/chat` and stream | Endpoint constants only | None | None | Not found in UI | No chat/RAG UI. |
| `/diseases/...` | Endpoint constants only | None | Missing disease search route | Not found in UI | Sidebar disease search page missing. |
| `/conversations`, `/messages` | Endpoint constants only | None | None | Not found in UI | Messaging buttons not wired. |
| `/seed/bootstrap/*`, `/seed/simulation/*`, `/seed/scenarios/*` | No FE wrapper | None | None | Not found in UI | Demo/operator APIs only in backend docs/scripts. |

## SECTION 5 - LOCAL / MOCK DATA INVENTORY

| File/path | Business concept | Active in UI? | Current behavior | Recommended next action |
| --- | --- | --- | --- | --- |
| `src/store/useManagementStore.ts` | Farm info, zones, sensor modules | Yes, `/dashboard/devices` and legacy `ZoneTabSwitcher` | Persisted local source of truth under `management-storage` | Replace with backend farm/zone/device APIs or clearly rename as local demo screen. |
| `src/features/device-management/mockDevices.ts` | Initial farm/zone/device inventory | Yes, seeds management store | Mock farm, zones, sensors | Replace with backend integration after migration; keep temporarily only as fixture. |
| `src/features/device-management/components/FarmInfoCard.tsx` | Farm info editing | Yes | Uses local state plus `setTimeout` fake API delay | Replace with farm API or remove if backend farm screen will be separate. |
| `src/features/device-management/components/ZoneManager.tsx` | Zone CRUD | Yes | Local add/edit/delete only | Replace with backend farm-zone CRUD; validate ID generation if kept. |
| `src/features/device-management/components/SensorTable.tsx` | Sensor/module inventory | Yes | Local add/edit/delete only | Replace with `/iot/devices/me` or collector inventory model. |
| `src/features/device-management/components/AddDeviceModal.tsx` | Add module form | Yes | Creates local sensor with battery/status defaults | Replace with provision/claim flow or remove duplicate UX. |
| `src/features/device-management/components/EditDeviceModal.tsx` | Edit module form | Yes | Zone selector rendered but not applied by parent | Fix or remove during backend migration. |
| `src/features/metrics-view/mockData.ts` | Old zone metrics | No visible current page usage found | Leftover `MOCK_ZONES_DATA` | Remove after confirming no tests/imports rely on it. |
| `src/store/dashboardStore.ts` | Selected zone | Only via unused `ZoneTabSwitcher` | Default selected zone `A` | Remove if `ZoneTabSwitcher` is retired. |
| `src/features/metrics-view/components/ZoneTabSwitcher.tsx` | Local zone tab navigation | No visible current page usage found | Reads management store zones | Remove/refactor when backend zone list exists. |
| `src/features/metrics-view/components/HealthGaugesRow.tsx` | Old health metrics | No visible current page usage found | Depends on `ZoneHealth` from mock data | Remove or rewire to backend health API if needed. |
| `src/features/metrics-view/components/ExpertRecommendations.tsx` | Suggested experts | No visible current page usage found | Static local `EXPERTS` array | Remove or rewire to profile/search/messaging. |
| `src/features/metrics-view/components/QuickActions.tsx` | Disease/expert/post shortcuts | No visible current page usage found | Buttons have no handlers | Remove or reintroduce only when routes exist. |
| `src/store/useCommunityStore.ts` | Community posts/topics/experts/actions | Yes, `/dashboard/community` | Persisted local source of truth under `community-storage` | Replace with posts/comments/votes APIs. |
| `src/features/community/mockCommunityData.ts` | Initial community feed/widgets | Yes | Mock posts, comments, topics, experts | Replace with backend feed/search/profile data. |
| `src/features/community/components/CreatePostModal.tsx` | Create post | Yes | 500 ms fake delay; local post insert; object URL image preview | Replace with post create and file upload integration. |
| `src/features/community/components/CommentSection.tsx` | Comments | Yes | Local add comment with mock current user | Replace with comment create/list APIs. |
| `src/features/community/components/CommentItem.tsx` | Replies/comment likes | Yes | Local reply/like only | Replace with comment/reply/vote APIs. |
| `src/features/community/components/PostCard.tsx` | Post like/comment/share UI | Yes | Local like and modal state | Replace with vote/comment/share APIs. |
| `src/features/community/components/ShareModal.tsx` | Share/repost | Yes | Clipboard/web share plus local repost | Keep browser share; backend-wire repost/share count. |
| `src/features/community/components/HotTopicsWidget.tsx` | Hot topics | Yes | Static mock topics | Replace with backend/search aggregation or remove. |
| `src/features/community/components/OnlineExpertsWidget.tsx` | Online experts | Yes | Static mock experts; message buttons visual | Replace with profile/search + messaging, or remove. |
| `src/features/settings/store/useSettingsStore.ts` | Theme | Yes | Local state only | Keep as local preference if intended, but apply to app or persist. Backend only if cross-device preference is required. |
| `src/features/metrics-view/config.ts` | Current farm plot ID | Yes | localStorage/env config | Keep as developer/demo convenience; replace with profile/farm selection when available. |
| `src/store/registerStore.ts` | Register form and pending email | Yes | Local form state/sessionStorage | Keep; not backend source-of-truth after registration. |
| `src/store/authStore.ts` | Tokens/current user | Yes | Persisted auth client state | Keep; consider server logout integration. |
| `src/features/notifications/store/usePushNotificationsStore.ts` | Push runtime/token state | Yes | Persists current token only | Keep; align deactivate endpoint. |

## SECTION 6 - UNUSED / DEAD / HALF-WIRED FRONTEND ASSETS

API wrappers/hooks likely unused by visible screens:

- `useLogoutMutation`, `useLogoutDeviceMutation`, `useLogoutOtherDevicesMutation`, and `useRefreshAccessTokenMutation` in `src/features/auth/queries/mutations.ts`.
- `authApi.logout`, `authApi.logoutDevice`, `authApi.logoutOtherDevices`.
- `src/features/settings/services/profileApi.ts` duplicate function-style profile API.
- `useProfileByUserId` appears exported but not used by visible pages.
- `src/features/notifications/api/push.api.ts` and notification mutation hooks are not used by `PushNotificationsBootstrap`, which imports `services/pushApi.ts` directly.
- `collectorApi.getAlertRule` and `useAlertRule` are not used by any visible rule detail page/modal.

Route constants/navigation without pages:

- `ROUTES.DASHBOARD.SEARCH` -> sidebar item, not registered in `App.tsx`.
- `ROUTES.DASHBOARD.MONITOR` -> sidebar item, not registered.
- `ROUTES.DASHBOARD.EXPERTS` -> sidebar item, not registered.
- `ROUTES.DASHBOARD.REPORTS` -> header tab, not registered.

Endpoint constants without frontend wrappers/screens:

- Community, farms, plants, species, plant events, treatment plans, search, RAG, diseases, notification list/read, and messages endpoint groups in `API_ENDPOINTS`.

Old components/assets no longer serving current metrics flow:

- `MOCK_ZONES_DATA`
- `ZoneTabSwitcher`
- `HealthGaugesRow`
- `QuickActions`
- `ExpertRecommendations`
- `dashboardStore`

Duplicate/overlapping implementations:

- Device management has two competing concepts:
  - `/dashboard/devices`: local farm/zone/module store.
  - `/dashboard/devices/onboarding`: backend device onboarding and owned-device list.
- Push token API exists in two styles: `features/notifications/api/push.api.ts` and `features/notifications/services/pushApi.ts`.
- Profile API exists in two styles: `features/settings/api/profile.api.ts` and `features/settings/services/profileApi.ts`.

Half-wired actions:

- Profile save button calls backend but has no visible editable backend field except an absent `bio` control.
- Logout clears client auth state and deactivates push token, but does not call `/auth/logout`.
- Alert center reads backend alerts but has no lifecycle actions despite backend support.
- Community expert/message actions are visual/local only.

## SECTION 7 - TEST COVERAGE IMPACT

Current frontend tests:

| Test file | Feature | What it verifies | Integration strength |
| --- | --- | --- | --- |
| `DashboardPage.test.tsx` | Dashboard | Backend overview request with `farmPlotId`, loading, error | Good for read path |
| `ZoneDetailMetricsPage.test.tsx` | Zone metrics | Zone overview, charts, range changes, empty/error states, recent alerts handler | Good for read path |
| `AlertsPage.test.tsx` | Alerts | Paged backend alert list, filters, pagination, empty/error states | Good for read path |
| `AlertRulesPage.test.tsx` | Alert rules | List, filters, create payload, validation, enable toggle, delete/refetch, loading/empty/error | Strong CRUD coverage |
| `DeviceOnboardingPage.test.tsx` | Device onboarding | Provision, backend errors, claim-code, claim, owned devices, filters/pagination, loading/empty/error | Strong onboarding coverage |
| `DeviceDetailPage.test.tsx` | Device detail/config | Metadata, readings, charts, range changes, config read/update validation, push, status states, loading/not-found/error | Strong detail/config coverage |

Important integrated flows with no/limited tests:

- Auth login/register/OTP flows have no RTL/MSW tests.
- Profile/settings `/profiles/me` and profile update have no tests.
- Push notification token registration and Firebase states have no tests.
- `AuthSessionBootstrap` user hydration and possible `X-User-Id` header timing are not tested.
- Logout does not have tests, including push deactivate failure behavior.
- Sidebar/header route mismatch is not tested.

Mock/local screens with no meaningful backend tests:

- Device management local store flow.
- Community feed/post/comment/share flow.

Test architecture notes:

- MSW server is empty by default; each test file registers per-test handlers.
- Current tests validate real request URLs and payloads for IoT pages, not just basic rendering.
- Tests do not currently assert collector `X-User-Id` headers for user-scoped endpoints.

## SECTION 8 - RECOMMENDED NEXT ACTIONS

High priority:

1. Decide the future of `/dashboard/devices`.
   - Either replace it with the backend `/iot/devices/me` inventory or clearly move the local farm/zone/module editor behind a demo-only route.
   - Avoid keeping two "device" pages with conflicting sources of truth.

2. Add alert lifecycle integration.
   - Add wrappers/hooks for `GET /iot/alert-events/{id}`, `POST /{id}/acknowledge`, and `POST /{id}/resolve`.
   - Add UI actions to `AlertsPage` and invalidate `alertKeys`.

3. Fix user-scoped collector header readiness.
   - User-scoped calls in alert rules and onboarding rely on `authStore.user?.id`.
   - Gate those queries/mutations on a resolved user ID from profile/auth context or derive the user ID consistently from the auth token/gateway.

4. Resolve push-token deactivate mismatch.
   - Either implement `POST /push-tokens/deactivate` on the backend or remove/change the frontend call.
   - Consolidate duplicate push API wrappers.

5. Add pages or remove nav items for missing routes.
   - `/dashboard/search`
   - `/dashboard/monitor`
   - `/dashboard/experts`
   - `/dashboard/reports`

Medium priority:

1. Backend-wire community or explicitly mark it as demo-only.
   - Replace local `community-storage` with feed, post create, comment, reply, vote, and share/repost APIs.

2. Add backend farm/zone selection.
   - Dashboard currently requires manual farmPlotId and zoneId input.
   - Integrate farm/plot/zone APIs or a profile-owned farm selection flow.

3. Improve profile settings.
   - Add real editable fields matching `ProfileUpdateRequest`, or remove the save button until there is an editable backend field.
   - Wire avatar upload via file service if camera button remains.

4. Add tests for auth, profile/settings, push notifications, and route/navigation mismatches.

5. Create demo/operator tooling only if it is still a product requirement.
   - A page could call bootstrap, simulation start/stop/status, high-temperature, low-soil-moisture, and config ack scenario endpoints.

Low priority:

1. Remove stale metrics mock assets after confirming no planned reuse:
   - `mockData.ts`
   - `dashboardStore.ts`
   - `ZoneTabSwitcher`
   - `HealthGaugesRow`
   - `QuickActions`
   - `ExpertRecommendations`

2. Consolidate duplicate API service styles:
   - Settings `api/profile.api.ts` vs `services/profileApi.ts`.
   - Notifications `api/push.api.ts` vs `services/pushApi.ts`.

3. Clean up mojibake UI strings and normalize localization.

4. Add optional detail views:
   - Alert event detail.
   - Alert rule detail using existing `useAlertRule`.

5. Decide whether notification list/read endpoints should have a visible inbox.

