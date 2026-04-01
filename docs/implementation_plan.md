# Auth API Integration Plan

Replace all mock auth logic with real API calls to the BondHub backend at `http://localhost:8060`.

## API Endpoints Discovered

| Endpoint | Method | Purpose | Key Fields |
|---------|--------|---------|------------|
| `/auth/login` | POST | Login | `email`, `password`, `appVersion` + headers: `User-Agent`, `X-Device-ID` |
| `/auth/register/init` | POST | Start registration | `email`, `phoneNumber`, `password`, `appVersion` |
| `/auth/register/verify` | POST | Verify OTP & complete registration | `email`, `otp` + headers: `User-Agent`, `X-Device-ID` |
| `/auth/register/resend-otp` | POST | Resend OTP | `email` |
| `/auth/refresh` | POST | Refresh access token | `refreshToken` |

**Standard response envelope:** `{ code: number, message: string, data: object | null }`  
**Auth tokens:** `{ accessToken, refreshToken, tokenType: "Bearer", expiresIn: 3600 }`

---

## Proposed Changes

### API Client Layer

#### [NEW] [authApi.ts](file:///d:/KLTN/Leafy_FE/src/features/auth/services/authApi.ts)
Create a centralized API service with these functions:
- `apiLogin(email, password)` → `POST /api/auth/login`
- `apiRegisterInit(email, phoneNumber, password)` → `POST /api/auth/register/init`
- `apiVerifyOTP(email, otp)` → `POST /api/auth/register/verify`
- `apiResendOTP(email)` → `POST /api/auth/register/resend-otp`
- `apiRefreshToken(refreshToken)` → `POST /api/auth/refresh`

Uses `fetch` with base URL from `VITE_API_BASE_URL` env var. Sends `Content-Type: application/json`, `User-Agent`, and `X-Device-ID` headers.

---

### Types

#### [MODIFY] [types.ts](file:///d:/KLTN/Leafy_FE/src/features/auth/types.ts)
- Update [LoginCredentials](file:///d:/KLTN/Leafy_FE/src/features/auth/types.ts#1-5) to use `email` + `password` (instead of `identifier`)
- Update [AuthResponse](file:///d:/KLTN/Leafy_FE/src/features/auth/types.ts#14-18) to match API shape: `{ accessToken, refreshToken, tokenType, expiresIn }`
- Add `RegisterInitRequest`, `VerifyOTPRequest`, `ResendOTPRequest` interfaces
- Add `ApiEnvelope<T>` generic for the `{ code, message, data }` wrapper

---

### Auth Store

#### [MODIFY] [authStore.ts](file:///d:/KLTN/Leafy_FE/src/store/authStore.ts)
- Add `accessToken`, `refreshToken` state fields
- Add `setTokens(access, refresh)` action
- Update [logout()](file:///d:/KLTN/Leafy_FE/src/store/authStore.ts#21-22) to clear tokens
- Add `persist` middleware to save tokens to localStorage

---

### Login Flow

#### [MODIFY] [useLogin.ts](file:///d:/KLTN/Leafy_FE/src/features/auth/hooks/useLogin.ts)
- Replace the mock `setTimeout` with a real call to `apiLogin()`
- On success (`code === 0`), store `accessToken` + `refreshToken` via `authStore.setTokens()`
- Map API error messages to Vietnamese UI strings
- Update the Zod schema `identifier` field to `email` to match the API

#### [MODIFY] [LoginForm.tsx](file:///d:/KLTN/Leafy_FE/src/features/auth/components/LoginForm.tsx)
- Rename the `identifier` field to `email` (label stays "Email")

---

### Register Flow

#### [MODIFY] [useRegisterLogic.ts](file:///d:/KLTN/Leafy_FE/src/features/auth/hooks/useRegisterLogic.ts)
- Replace the mock `setTimeout` with a real call to `apiRegisterInit()`
- On success, store `pendingEmail` and navigate to `/verify-email`
- Remove the [setUser()](file:///d:/KLTN/Leafy_FE/src/store/authStore.ts#18-19) call (user is only set after OTP verification)
- Map API error messages to Vietnamese UI strings

#### [MODIFY] [RegisterForm.tsx](file:///d:/KLTN/Leafy_FE/src/features/auth/components/RegisterForm.tsx)
- Remove the `fullName` field (API does not accept it at this stage)

---

### OTP Verification Flow

#### [MODIFY] [VerifyOTPForm.tsx](file:///d:/KLTN/Leafy_FE/src/features/auth/components/VerifyOTPForm.tsx)
- Wire the submit button to call `apiVerifyOTP(email, otp)`
- On success, store tokens from response, navigate to `/dashboard`
- Wire the "Gửi lại mã" button to call `apiResendOTP(email)`

---

> [!IMPORTANT]
> The [RegisterForm](file:///d:/KLTN/Leafy_FE/src/features/auth/components/RegisterForm.tsx#5-225) field `fullName` does not exist in the `/auth/register/init` API. We need to either remove the field from the form, or keep it for the UI but skip it in the API call. The API only needs `email`, `phoneNumber`, `password`.

> [!WARNING]  
> The login API uses `email` only (not phone). The current [useLogin](file:///d:/KLTN/Leafy_FE/src/features/auth/hooks/useLogin.ts#18-60) validates `identifier` as email OR phone. We should scope the login to email-only to match the API contract, or clarify with the backend team.

## Verification Plan

### Manual Verification
1. **Register flow:** Fill the registration form → Should call `/auth/register/init` → Redirect to OTP page
2. **OTP flow:** Enter OTP on the verify page → Should call `/auth/register/verify` → Redirect to dashboard
3. **Login flow:** Enter email + password → Should call `/auth/login` → Redirect to dashboard
4. **Error handling:** Enter invalid credentials → Should display Vietnamese error message
5. **Resend OTP:** Click "Gửi lại mã" → Should call `/auth/register/resend-otp`
