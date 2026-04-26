# Leafy Web Agriculture E2E Checklist

Use this checklist to demo-test the full web flow against real backend services.

## Preconditions

- [ ] API Gateway is running and the web app points to the gateway `/api` base URL.
- [ ] Farm-service, plant-management-service, disease-detection-service, and rag-service are reachable through the gateway.
- [ ] A farmer account can log in successfully.
- [ ] The logged-in user has an active profile so farm-service can resolve ownership.
- [ ] Browser console does not expose access tokens or raw auth headers.

## Flow With Expected API Calls

### 1. Login

- [ ] Login with a farmer account.
- Expected UI: dashboard layout renders and sidebar is available.
- Expected API: auth/profile APIs used by the existing auth/profile flow.

### 2. Farm plot and zone setup

- [ ] Create or verify at least one farm plot.
- Expected API: `GET /farms/plots?ownerProfileId={ownerProfileId}`.
- Expected API on create: `POST /farms/plots`.
- Expected UI: plot list refetches, new plot appears, selected plot remains valid.

- [ ] Create or verify at least one farm zone under that farm plot.
- Expected API: `GET /farms/plots/{plotId}/zones`.
- Expected API on create: `POST /farms/plots/{plotId}/zones`.
- Expected UI: zone list refetches under the selected plot.

### 3. Plant management

- [ ] Open `Cây trồng`.
- Expected API: `GET /plants`, `GET /species`.
- Expected UI: plant list renders loading, empty, or cards/table without crashing.

- [ ] Create a plant assigned to the farm plot and species.
- Expected API: `POST /plants`.
- Expected UI: create dialog closes, plant list refetches, new plant appears.

- [ ] Open the plant detail page.
- Expected API: `GET /plants/{plantId}`, `GET /plant-events/plant/{plantId}`, `GET /treatment-plans/plant/{plantId}`.
- Expected UI: basic plant info, events, and treatment plans render.

### 4. Disease diagnosis with plant context

- [ ] From plant detail, click `Chẩn đoán bệnh cho cây này`.
- Expected UI: disease page opens with plant/farm/zone context prefilled when available.

- [ ] Upload a valid coffee leaf image.
- Expected UI: preview image appears before submit.

- [ ] Run disease prediction.
- Expected API: `POST /diseases/predict` with multipart field `file`.
- Expected UI: top disease, confidence, and top predictions render.
- Expected refresh: diagnosis history query is invalidated/refetched.

### 5. Disease to RAG Assistant

- [ ] Click `Hỏi AI tư vấn cách xử lý`.
- Expected UI: AI Assistant opens with a prefilled prompt containing disease, confidence, plant, farm plot, and zone context when available.
- Expected behavior: prompt is not auto-submitted.

- [ ] Submit the prompt manually.
- Expected API: `POST /rag/v1/chat` with `question`, `language`, and optional `thread_id`.
- Expected response unwrap: use `result`, not `data`.
- Expected UI: assistant answer renders; no raw JSON is shown.
- Expected refresh: if `result.treatment_plan`, `result.treatmentPlan`, or `result.plan` exists, RAG treatment plan list is invalidated.

### 6. Create real treatment plan from RAG

- [ ] Confirm treatment plan preview renders if RAG returns a plan.
- [ ] Click `Tạo kế hoạch điều trị`.
- Expected UI: review dialog opens and preselects plant/farm/zone if context is available.

- [ ] Review disease name, scope, start date, and schedule.
- Expected validation: disease name required, plant or farm plot required, schedule not empty, event type/note/date required.

- [ ] Submit `Tạo kế hoạch`.
- Expected API: `POST /treatment-plans`.
- Expected body: `diseaseName`, optional `plantId`, `farmPlotId`, `farmZoneId`, `ragPlanId`, `question`, `source`, and `schedule`.
- Expected backend behavior: plant-management bulk-creates PlantEvent records from schedule.
- Expected refresh: treatment plan list/detail, plan events, plant events, and calendar are invalidated/refetched.

- [ ] Click `Xem kế hoạch điều trị`.
- Expected route: `/dashboard/treatment-plans/{planId}`.

### 7. Treatment plan detail and status

- [ ] Open the created treatment plan detail page.
- Expected API: `GET /treatment-plans/{planId}`.
- Expected API for events: `GET /plant-events/plan/{sourcePlanId}`.
- Expected UI: plan scope, AI source info, safety warning, and generated plant events render.

- [ ] Change treatment plan status.
- Expected API: `PATCH /treatment-plans/{planId}/status?status={PENDING|ACTIVE|COMPLETED|CANCELLED}`.
- Expected UI: status badge updates after refetch.

### 8. Calendar and event edit

- [ ] Open `Lịch chăm sóc`.
- Expected API: `GET /plant-events/calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`.
- Expected UI: week view plus grouped list render.

- [ ] Use week navigation.
- Expected UI: `Tuần trước`, `Tuần này`, and `Tuần sau` update local date-only range without timezone shift.

- [ ] Click an event and edit note/date/safety fields.
- Expected API: `PUT /plant-events/{eventId}`.
- Expected validation: event type required, note required, date range valid, number fields non-negative.
- Expected refresh: events by plan, events by plant, and calendar refetch.

### 9. Overview

- [ ] Return to `Tổng quan`.
- Expected API: plants, `GET /treatment-plans/me`, `GET /plant-events/calendar`, `GET /diseases/diagnose/requests`, and `GET /rag/health`.
- Expected UI: summary cards reflect latest data.
- Expected failure mode: one failing card does not crash the whole dashboard.

## Negative Checks

- [ ] Disease prediction service offline shows a friendly error.
- [ ] Disease model not ready shows a model/service-not-ready message, not raw stack trace.
- [ ] RAG health fail does not crash overview or AI page.
- [ ] RAG chat fail keeps the user's draft question available.
- [ ] No species data shows an empty/error state in plant form.
- [ ] No farm plot/zone data shows CTA to create farm data first.
- [ ] Treatment plan creation fail keeps the review dialog open with error state.
- [ ] Treatment plan created but events missing: verify `sourcePlanId` in events matches the created treatment plan id, not only the RAG plan id.
- [ ] Calendar with no events shows empty state.
- [ ] Partial overview API failures only affect their own card/panel.
- [ ] 401 responses show a login/session message or use the global auth handler.
- [ ] 403 responses show a permission message.

## Troubleshooting

- Disease model not ready: verify disease-detection-service loaded the model and `GET /diseases/predict/health` returns healthy.
- RAG health fail: verify rag-service is running and gateway route `/api/rag/health` is reachable.
- No species data: seed plant-management species or verify `GET /species`.
- No farm plot/zone: create farm plot/zone first; plant and treatment flows need scope.
- Treatment plan created but events not shown: compare `TreatmentPlanResponse.id`, `ragPlanId`, and PlantEvent `sourcePlanId`; the detail page reads `GET /plant-events/plan/{sourcePlanId}`.
- CORS/gateway issues: verify requests go through gateway `/api`, not direct service URLs.
- Auth/header issues: backend services expect gateway-forwarded user headers; do not hardcode `X-User-Id` in FE.
