# Leafy Web Agriculture E2E Checklist

Use this checklist to demo-test the full web flow against real backend services.

## Preconditions

- Backend services and API Gateway are running.
- A farmer account can log in successfully.
- Farm-service, plant-management-service, disease-detection-service, and rag-service are reachable through `/api`.

## Flow

- [ ] Login with a farmer account.
- [ ] Create or verify at least one farm plot.
- [ ] Create or verify at least one farm zone under that farm plot.
- [ ] Create a plant assigned to the farm plot.
- [ ] Open the plant detail page.
- [ ] Click `Chẩn đoán bệnh cho cây này`.
- [ ] Confirm the disease diagnosis page preselects or carries plant context.
- [ ] Upload a valid coffee leaf image.
- [ ] Run disease prediction.
- [ ] Confirm the prediction result renders top disease and confidence.
- [ ] Click `Hỏi AI tư vấn cách xử lý`.
- [ ] Confirm AI Assistant opens with a prefilled prompt containing plant, farm plot, zone, disease, and confidence.
- [ ] Submit the prompt manually.
- [ ] Confirm RAG response renders an assistant answer.
- [ ] Confirm treatment plan preview renders if RAG returns a plan.
- [ ] Click `Tạo kế hoạch điều trị`.
- [ ] Review the dialog and confirm plant/farm/zone are prefilled.
- [ ] Adjust schedule items if needed.
- [ ] Submit `Tạo kế hoạch`.
- [ ] Open the created treatment plan detail page.
- [ ] Confirm plan scope, AI source info, and generated plant events render.
- [ ] Change treatment plan status.
- [ ] Open `Lịch chăm sóc`.
- [ ] Confirm week view shows upcoming events.
- [ ] Click an event and edit note/date/safety fields.
- [ ] Confirm the updated event is visible after refresh/refetch.
- [ ] Return to `Tổng quan` and verify summary cards reflect latest data.

## Negative Checks

- [ ] Disease prediction service offline shows a friendly error.
- [ ] RAG health fail does not crash overview or AI page.
- [ ] Treatment plan creation fail keeps the review dialog open with error state.
- [ ] Calendar with no events shows empty state.
- [ ] Partial overview API failures only affect their own card/panel.
