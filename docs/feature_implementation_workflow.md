# Coffee Monitor Frontend Feature Implementation and Workflow

This document describes the current frontend implementation in this repository. It separates features that are fully wired to backend APIs from features that currently run on mock data or local Zustand state.

## 1. Project Overview

Coffee Monitor is a React frontend for a smart coffee farm monitoring system. The app supports authentication, farm and IoT device management, zone metric dashboards, community interactions, user settings, profile loading, and web push notification registration.

The project is organized by feature folders under `src/features`, with shared routing, API client, state stores, and layouts under `src/lib`, `src/store`, `src/layouts`, and `src/components`.

## 2. Technology Stack

- React 19 with TypeScript.
- Vite 7 for development and build.
- React Router for routing.
- TanStack Query for server cache, queries, and mutations.
- Zustand for client state and persisted local state.
- Axios for backend API calls.
- Firebase Messaging for web push notifications.
- Tailwind CSS v4 via `@tailwindcss/vite`.
- Recharts for sensor charts.
- Zod for auth form validation.
- `react-hot-toast` for success/error notifications.
- `lucide-react` and Material UI icon package for icons.

Main scripts:

- `npm run dev`: starts Vite dev server.
- `npm run build`: runs TypeScript build and Vite production build.
- `npm run lint`: runs ESLint.
- `npm run preview`: previews the production build.

## 3. Application Startup

The app starts from `src/main.tsx`, which mounts `<App />` into `#root` inside React `StrictMode`.

`src/App.tsx` wraps the application with:

- `QueryClientProvider`, using the shared query client from `src/lib/query-client.ts`.
- `BrowserRouter`, defining guest and protected routes.
- `Toaster`, configured globally for app notifications.
- `ReactQueryDevtools`.

On mount, `App` registers a global TanStack Query mutation success handler. Mutations that set `meta.successMessage` can trigger a toast through this shared handler.

## 4. Routing Workflow

Routes are centralized in `src/lib/routes.ts`.

Implemented guest routes:

- `/login`: login page.
- `/register`: registration page.
- `/verify-email`: OTP verification page.

Implemented protected dashboard routes:

- `/dashboard`: farm overview dashboard.
- `/dashboard/metrics/:zoneId`: zone metrics detail page.
- `/dashboard/devices`: farm and IoT device management.
- `/dashboard/community`: community feed.
- `/dashboard/settings`: settings and profile.

Declared but not implemented as pages:

- `/dashboard/search`
- `/dashboard/monitor`
- `/dashboard/alerts`
- `/dashboard/experts`
- `/dashboard/reports`

The sidebar and header link to some of these future routes, but `App.tsx` does not currently register corresponding route components for them.

Route protection is handled by:

- `ProtectedRoute`: requires `authStore.accessToken`; otherwise redirects to `/login`.
- `GuestOnlyRoute`: redirects authenticated users away from auth screens to `/dashboard`.

Unknown routes redirect to `/dashboard`.

## 5. Layout Workflow

Protected pages render inside `DashboardLayout`.

`DashboardLayout` includes:

- `AuthSessionBootstrap`: loads the current profile and hydrates the auth user state.
- `Sidebar`: desktop navigation, profile summary, and logout action.
- `Header`: farm title, top tabs, weather chip, and mobile menu button.
- `PushNotificationsBootstrap`: manages push notification setup banners.
- `<Outlet />`: renders the current dashboard child page.

The sidebar is currently rendered as a desktop-only fixed sidebar. The layout has mobile overlay state, but the sidebar component itself is hidden on small screens, so the mobile drawer behavior is not fully implemented.

## 6. Shared API and State Architecture

### API Client

`src/lib/apiClient.ts` creates one Axios instance with:

- `baseURL` from `VITE_API_BASE_URL`, defaulting to `/api`.
- `Content-Type: application/json`.
- Console logging interceptors for requests, responses, and errors.
- Request headers:
  - `X-Device-ID`, generated and stored in `localStorage`.
  - `Authorization: Bearer <accessToken>` when an access token exists.

On HTTP 401, the response interceptor attempts to refresh the token once by calling `/auth/refresh` directly through Axios. A shared `refreshPromise` prevents multiple simultaneous refresh calls. If refresh succeeds, the failed request is retried with the new token. If refresh fails, auth state is cleared.

### Query Client

`src/lib/query-client.ts` configures TanStack Query defaults:

- Queries retry once.
- Refetch on window focus is disabled.
- Query data is stale for 5 minutes.
- Garbage collection is 10 minutes.
- Mutations retry once.

It also supports mutation metadata:

- `invalidatesQuery`: invalidates a query key after mutation settles.
- `successMessage`: shows a global success toast when mutation succeeds.

### Client Device ID

`src/lib/clientDevice.ts` creates a stable browser device ID:

- Stored under `x-device-id` in `localStorage`.
- Formatted as `web-<uuid>`.
- Used by API requests and push token registration.

It can also build a readable device identifier using browser name, platform, and part of the UUID.

## 7. Auth Feature

Auth code lives under `src/features/auth`.

### Auth State

`src/store/authStore.ts` uses persisted Zustand state:

- `user`
- `accessToken`
- `refreshToken`
- `isLoading`
- `rememberMe`

Actions include:

- `setUser`
- `setTokens`
- `setIsLoading`
- `setRememberMe`
- `logout`

The store persists under `auth-storage`, so tokens survive page refresh.

### Login Workflow

Files involved:

- `pages/LoginPage.tsx`
- `components/LoginForm.tsx`
- `components/LoginHero.tsx`
- `hooks/useLogin.ts`
- `queries/mutations.ts`
- `api/auth.api.ts`

Workflow:

1. User opens `/login`.
2. `LoginPage` renders the shared auth hero and `LoginForm`.
3. User enters email and password.
4. `useLogin` validates input with Zod:
   - email must be a valid email.
   - password must be at least 6 characters.
5. `useLoginMutation` calls `authApi.login`.
6. `authApi.login` posts to `/auth/login`.
7. On success, the hook stores `accessToken` and `refreshToken` in `authStore`.
8. It stores the remember-me value.
9. It navigates to `/dashboard`.
10. On failure, backend errors are mapped through `authErrorMapper`.

The Google login button is present visually but does not have a real OAuth workflow attached.

### Registration Workflow

Files involved:

- `pages/RegisterPage.tsx`
- `components/RegisterForm.tsx`
- `hooks/useRegisterLogic.ts`
- `store/registerStore.ts`
- `queries/mutations.ts`
- `api/auth.api.ts`

Workflow:

1. User opens `/register`.
2. `RegisterForm` collects phone, email, password, confirm password, and terms agreement.
3. `useRegisterLogic` validates:
   - Vietnamese-style phone regex.
   - valid email.
   - password minimum length.
   - matching password confirmation.
   - terms must be accepted.
4. `useInitiateRegistrationMutation` calls `authApi.initiateRegistration`.
5. The frontend posts to `/auth/register/init` with:
   - `email`
   - `phoneNumber`
   - `password`
6. On success, the email is saved in `sessionStorage` as `pending-verify-email`.
7. User is navigated to `/verify-email`.

### OTP Verification Workflow

Files involved:

- `pages/VerifyEmailPage.tsx`
- `components/VerifyOTPForm.tsx`
- `store/registerStore.ts`
- `queries/mutations.ts`
- `api/auth.api.ts`

Workflow:

1. `/verify-email` reads the pending email from `sessionStorage`.
2. If no pending email exists, the user is redirected back to `/register`.
3. User enters OTP.
4. `useVerifyOtpAndRegisterMutation` posts to `/auth/register/verify`.
5. On success, returned access and refresh tokens are stored.
6. The pending email is removed from `sessionStorage`.
7. A success toast is shown.
8. User is navigated to `/dashboard`.

Resend workflow:

1. User clicks resend.
2. `useResendOtpMutation` posts to `/auth/register/resend-otp`.
3. A toast confirms the resend when successful.

### Session Bootstrap Workflow

`AuthSessionBootstrap` runs inside `DashboardLayout`.

Workflow:

1. If an access token exists, it calls `useMyProfile`.
2. When profile data returns, it maps profile fields to the auth `user` shape.
3. It stores that user in `authStore`.
4. If no access token exists, it clears the user.

This lets the sidebar and other areas use a normalized user object even though login only returns tokens.

### Logout Workflow

`useLogout` performs:

1. Reads current push token from push notification store.
2. If a push token exists, attempts to deactivate it through `/push-tokens/deactivate`.
3. Resets push notification state.
4. Resets settings profile state.
5. Clears auth tokens and user.
6. Clears all TanStack Query cache.
7. Navigates to `/login`.

The auth API includes logout endpoints, but the current logout hook does not call `/auth/logout`; it only clears frontend state and deactivates push token if possible.

## 8. Dashboard and Metrics Feature

Metrics code lives under `src/features/metrics-view`.

### Dashboard Overview Workflow

Files involved:

- `pages/DashboardPage.tsx`

Current data source:

- Local static `AREAS` array inside `DashboardPage`.

Workflow:

1. User opens `/dashboard`.
2. The page renders a farm overview heading.
3. It displays a map-like panel with three area cards: A, B, and C.
4. Each card shows status, temperature, humidity, and soil moisture.
5. Clicking a zone card navigates to `/dashboard/metrics/<zoneId>`.
6. A summary row displays average temperature, average soil moisture, online sensor count, and new alert count.

The search bar, zoom buttons, and target button are visual controls only.

### Zone Detail Metrics Workflow

Files involved:

- `pages/ZoneDetailMetricsPage.tsx`
- `mockData.ts`
- `components/ZoneTabSwitcher.tsx`
- `components/HealthGaugesRow.tsx`
- `components/IoTMetricCard.tsx`
- `components/RecentAlerts.tsx`
- `components/ExpertRecommendations.tsx`
- `components/QuickActions.tsx`

Current data sources:

- `MOCK_ZONES_DATA` for metrics.
- `useManagementStore.zones` for valid zone list and tab rendering.

Workflow:

1. User visits `/dashboard/metrics/:zoneId`.
2. The page checks whether `zoneId` exists in management store zones.
3. If the zone is missing, it redirects away.
4. If mock metrics exist for that zone, it uses them.
5. If the zone is user-created and has no mock metrics, the page generates default healthy sensor metrics.
6. It renders:
   - health gauges for healthy/warning/danger plant percentages.
   - IoT metric cards for temperature, air humidity, soil moisture, and light.
   - bar charts for each metric using Recharts.
   - recent alert cards.
   - suggested expert cards.
   - quick action buttons.

### Zone Switching Workflow

`ZoneTabSwitcher` reads available zones from `useManagementStore`.

Workflow:

1. It syncs URL `zoneId` to `dashboardStore.selectedZoneId`.
2. If the URL zone is invalid but zones exist, it navigates to the first zone.
3. If no zones exist, it navigates to `/dashboard`.
4. Clicking a tab updates selected zone state and navigates to that zone metrics page.

## 9. Farm and Device Management Feature

Device management code lives under `src/features/device-management`.

Current data source:

- `MOCK_DEVICES_DATA`, loaded into persisted Zustand store `useManagementStore`.

Persisted store key:

- `management-storage`

### Management Page Workflow

`DeviceManagementPage` renders:

1. `FarmInfoCard`
2. `ZoneManager`
3. `SensorTable`

### Farm Info Workflow

`FarmInfoCard` handles farm-level info:

- farm name
- location
- total area

Workflow:

1. Reads farm info from `useManagementStore`.
2. Copies it to local component state for editing.
3. User clicks update.
4. Inputs become editable.
5. User saves.
6. A loading toast is shown.
7. A mock `setTimeout` simulates API delay.
8. Store is updated and persisted.
9. Success toast is shown.

This workflow is local-only and does not call a backend API.

### Zone Management Workflow

`ZoneManager` handles farm zones.

Capabilities:

- list zones.
- add zone.
- edit zone variety and area.
- delete zone.

Workflow:

1. Reads `zones` from management store.
2. Add button opens `AddZoneModal`.
3. Modal collects name, variety, area, and status.
4. On submit, a new ID is generated with `String.fromCharCode(65 + zones.length)`.
5. Zone is added to the store.
6. Success toast is shown.
7. Editing a zone updates only `variety` and `area`.
8. Deleting opens `ConfirmDeleteModal`, then removes the zone from store.

Important current behavior:

- New zone IDs depend on current zone count. If zones are deleted, duplicate IDs are possible.
- Deleting a zone does not automatically unassign devices attached to that zone.

### Sensor Device Workflow

`SensorTable` handles IoT modules.

Capabilities:

- list sensors.
- show online/offline state.
- show battery bar.
- show last signal.
- map sensor `zoneId` to zone name.
- add device.
- edit device.
- delete device.

Workflow:

1. Reads devices and zones from management store.
2. Add button opens `AddDeviceModal`.
3. Modal collects module name, device ID, and zone.
4. On submit, a new sensor is created with:
   - `status: online`
   - `battery: 100`
   - `lastSignal: Vua xong`
   - selected `zoneId`
5. Sensor is added to the store.
6. Edit button opens `EditDeviceModal`.
7. Delete button opens `ConfirmDeleteModal`.

Important current behavior:

- `EditDeviceModal` includes a zone selector, but `SensorTable` currently applies only `name` changes when saving.
- All device management is local-only and persisted in browser storage.

## 10. Community Feature

Community code lives under `src/features/community`.

Current data source:

- Mock community data loaded into persisted Zustand store `useCommunityStore`.

Persisted store key:

- `community-storage`

### Community Page Workflow

`CommunityView` renders:

1. Create post area.
2. Feed of post cards.
3. Hot topics widget.
4. Online experts widget.

### Create Post Workflow

Files involved:

- `CreatePostArea.tsx`
- `CreatePostModal.tsx`

Workflow:

1. User clicks the create post area or action buttons.
2. `CreatePostModal` opens.
3. User enters content.
4. User can attach one image.
5. Image preview uses `URL.createObjectURL`, so it is local browser-only.
6. User can choose a mock location.
7. User can mark the post as urgent.
8. Submit simulates a short delay.
9. A new post is added to the top of the persisted community store.
10. Success toast is shown.

### Feed Post Workflow

`PostCard` displays:

- author avatar and name.
- timestamp and optional location.
- urgent badge.
- content.
- image attachment.
- embedded shared post, when present.
- like/comment/share actions.

Like workflow:

1. User clicks the heart button.
2. `likePost` toggles `isLikedByMe`.
3. Like count increments or decrements.

Comment workflow:

1. User clicks comment button.
2. `CommentSection` expands.
3. User enters comment text.
4. New comment is appended to the post.
5. Post comment count increments.

Reply workflow:

1. User clicks reply on a top-level comment.
2. Reply input opens.
3. New reply is appended under that comment.
4. Post comment count increments.

Comment like workflow:

1. User clicks like on a comment.
2. `likeComment` toggles `isLikedByMe`.
3. Comment like count increments or decrements.

### Share Workflow

`ShareModal` supports:

- copy link.
- share through Web Share API when available.
- show fallback copy behavior.
- repost to the local feed with embedded original post snapshot.

Workflow:

1. User clicks share on a post.
2. Share modal opens with post preview.
3. Copy link writes to clipboard and shows a toast.
4. Repost creates a new post authored by the mock current user.
5. Original post data is copied into `sharedPost`.
6. Original post share count increments.

The messenger option is a placeholder and only shows a toast.

### Community Widgets

`HotTopicsWidget` and `OnlineExpertsWidget` render static mock data. Expert message buttons are visual and not wired to a messaging workflow.

## 11. Settings and Profile Feature

Settings code lives under `src/features/settings`.

### Profile API Workflow

Files involved:

- `api/profile.api.ts`
- `queries/queries.ts`
- `queries/mutations.ts`
- `types.ts`

Profile endpoints:

- `GET /profiles/me`
- `GET /profiles/user/:userId`
- `PUT /profiles/user/:userId`

`useMyProfile`:

1. Calls `profileApi.getMyProfile`.
2. Selects `response.data.data`.
3. Can be disabled until an access token exists.

`useProfileByUserId`:

1. Calls profile detail endpoint.
2. Runs only when `userId` is truthy.

`useUpdateProfileMutation`:

1. Calls `profileApi.updateByUserId`.
2. Invalidates `profileKeys.me()`.
3. Invalidates the specific profile detail key.

### Settings Page Workflow

`SettingsView` renders:

1. `ProfileSettingsCard`
2. `DisplaySettingsCard`
3. `AboutCard`

### Profile Settings Workflow

`ProfileSettingsCard`:

1. Loads profile with `useMyProfile`.
2. Shows loading state while fetching.
3. Shows retry UI when profile loading fails.
4. Syncs profile data into local form state.
5. Displays avatar, full name, role, email, and phone.
6. Full name, role, email, and phone fields are read-only.
7. Save button calls `useUpdateProfileMutation` with `{ bio }`.

Important current behavior:

- The component tracks `bio`, but there is no visible bio input in the rendered JSX.
- The avatar camera button is visual only.
- Most profile fields are displayed read-only.

### Display Settings Workflow

`DisplaySettingsCard` uses `useSettingsStore`.

Workflow:

1. User toggles light or dark.
2. Store updates `theme`.

Important current behavior:

- Theme state is stored in memory only.
- The selected theme does not currently apply a global dark/light class or change the overall UI theme.

### About Card

`AboutCard` is static content describing Coffee Monitor, showing stats and a hotline.

## 12. Push Notifications Feature

Push notification code lives under `src/features/notifications`.

### Configuration

Firebase web push uses environment variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_FIREBASE_VAPID_KEY`

If required Firebase config or VAPID key is missing, the feature enters `unconfigured` state and shows an explanatory banner.

### Push State

`usePushNotificationsStore` persists only `currentToken` under `push-notifications-storage`.

Runtime state includes:

- support state.
- permission state.
- sync status.
- last synced token and user.
- error.
- prompt dismissed state.

### Push Bootstrap Workflow

`PushNotificationsBootstrap` runs inside the dashboard layout.

Workflow:

1. Waits for an access token and resolved user ID.
2. Checks Firebase configuration.
3. Checks browser push support.
4. Reads `Notification.permission`.
5. If permission is already granted, registers/syncs token.
6. If permission is default, shows enable banner.
7. If permission is denied, shows blocked banner.
8. If token sync fails, shows error banner with retry.

Enable workflow:

1. User clicks enable.
2. Browser permission prompt is requested.
3. If granted, service worker is registered.
4. Firebase FCM token is requested.
5. Token is sent to backend through `POST /push-tokens`.
6. Device identifier is included as `platform: WEB`, `deviceIdentifier`, and `fcmToken`.
7. Store marks the token as synced.

Foreground message workflow:

1. Firebase `onMessage` receives payload while the app is open.
2. A toast is shown with notification title.
3. Body is logged to the console.

Background notification workflow:

1. `public/firebase-messaging-sw.js` initializes Firebase from service worker URL query params.
2. Background messages show browser notifications.
3. Clicking a notification navigates/focuses an existing client or opens `/dashboard`.
4. If notification data contains `url`, that URL is used.

Logout integration:

1. `useLogout` deactivates the current FCM token through `/push-tokens/deactivate`.
2. Push store is reset.

## 13. Central API Endpoint Registry

`src/lib/routes.ts` contains `API_ENDPOINTS` for many backend domains:

- auth
- profiles
- files
- users
- community
- farms
- plants
- species
- plant events
- treatment plans
- search
- RAG
- diseases
- notifications
- IoT
- messages

Currently wired frontend API modules only use:

- auth endpoints.
- profile endpoints.
- push token endpoints.

The rest are prepared route constants for future integration.

## 14. Local Persistence Summary

The frontend persists several pieces of client data:

- `auth-storage`: auth user, tokens, remember-me value.
- `management-storage`: farm info, zones, and devices.
- `community-storage`: posts, hot topics, experts.
- `push-notifications-storage`: current FCM token.
- `x-device-id`: browser device ID in `localStorage`.
- `pending-verify-email`: registration email in `sessionStorage`.

## 15. Implemented vs Mocked Feature Status

Backend-integrated:

- Login.
- Registration initiation.
- OTP verification.
- OTP resend.
- Token refresh on 401.
- Profile loading.
- Profile update mutation.
- Push token registration.
- Push token deactivation.

Mock/local:

- Farm overview map data.
- Zone sensor metric data.
- Health gauges.
- Recent alerts.
- Expert recommendations.
- Farm info editing.
- Zone CRUD.
- Sensor CRUD.
- Community feed, posts, comments, likes, shares, reposts.
- Hot topics.
- Online experts.
- Display theme switching.

Visual or placeholder only:

- Google login/register buttons.
- Forgot password link.
- Dashboard map search and controls.
- Quick action buttons in zone detail.
- Sidebar routes for search, monitor, alerts, experts.
- Header reports route.
- Expert messaging buttons.
- Messenger share option.
- Avatar upload button.
- Full dark mode application.

## 16. Main User Workflows

### New User Registration

1. Open `/register`.
2. Fill phone, email, password, confirm password.
3. Accept terms.
4. Submit registration.
5. Frontend calls `/auth/register/init`.
6. Email is stored as pending verification email.
7. App navigates to `/verify-email`.
8. User enters OTP.
9. Frontend calls `/auth/register/verify`.
10. Tokens are stored.
11. User enters dashboard.

### Existing User Login

1. Open `/login`.
2. Enter email and password.
3. Frontend validates input.
4. Frontend calls `/auth/login`.
5. Tokens are stored.
6. Protected dashboard becomes available.
7. Dashboard layout loads profile and hydrates auth user state.

### Authenticated Dashboard Session

1. Protected route checks token.
2. Dashboard layout renders.
3. Profile is fetched.
4. Sidebar shows profile summary.
5. Push notification bootstrap checks support and permission.
6. Child page renders based on current route.

### Zone Monitoring

1. User opens `/dashboard`.
2. User selects a zone card.
3. App navigates to `/dashboard/metrics/:zoneId`.
4. Zone ID is validated against management store.
5. Metrics are loaded from mock data or generated defaults.
6. User can switch zones through tabs.

### Farm and Device Administration

1. User opens `/dashboard/devices`.
2. User edits farm info locally.
3. User adds, edits, or deletes zones.
4. User adds, edits, or deletes sensor modules.
5. Changes persist in browser storage.
6. Zone changes affect zone tabs and route validation in metrics pages.

### Community Interaction

1. User opens `/dashboard/community`.
2. Feed loads from persisted mock store.
3. User creates a post.
4. User can like posts.
5. User can open comments, add comments, and reply.
6. User can share/copy/repost.
7. Changes persist in browser storage.

### Settings/Profile

1. User opens `/dashboard/settings`.
2. Profile is fetched from backend.
3. User sees read-only identity fields.
4. Save button currently submits bio state.
5. User can toggle display theme state.
6. About card shows static product information.

### Push Notification Enablement

1. User logs in.
2. Dashboard checks Firebase config and browser support.
3. If permission is default, app shows enable banner.
4. User grants browser permission.
5. App registers Firebase service worker.
6. App obtains FCM token.
7. App sends token to backend.
8. Foreground notifications appear as toasts.
9. Background notifications are handled by service worker.

## 17. Notable Implementation Gaps

- Some navigation links point to routes without implemented pages.
- Mobile sidebar state exists, but the sidebar itself is desktop-only.
- Several features are mock/local and not wired to backend services yet.
- `EditDeviceModal` can edit zone in the UI, but the save handler only updates device name.
- Zone ID generation can duplicate IDs after deletion.
- Profile save sends `bio`, but no bio input is currently rendered.
- Theme toggle does not apply a global theme.
- Auth logout API exists but is not called by the logout hook.
- Several source files contain mojibake-looking Vietnamese text in raw terminal output, which may need encoding verification if the UI renders incorrectly.
