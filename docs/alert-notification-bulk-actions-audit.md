# Alert Notification & Bulk Actions Audit

## 1. Executive Summary

Web hiện có 3 phần độc lập liên quan đến cảnh báo/thông báo:

- Topbar notification dropdown nằm tại `src/features/notifications/components/NotificationPopover.tsx`, được render từ `src/layouts/Header.tsx`. Dropdown hiện chỉ hiển thị notification chung, chưa có tab Cảnh báo.
- Sidebar nằm tại `src/layouts/Sidebar.tsx`. Component đã có cơ chế badge số, nhưng hiện chỉ áp dụng cho `Notifications` và `Chat`, chưa áp dụng cho route `Cảnh báo`.
- Trang cảnh báo nằm tại `src/features/alerts/pages/AlertsPage.tsx`. Trang dùng table, có filter, pagination, action từng dòng `acknowledge` và `resolve`, nhưng chưa có checkbox chọn nhiều/bulk action.

API alert hiện có đủ list/filter/pagination và lifecycle action từng alert:

- `GET /iot/alert-events`
- `GET /iot/alert-events/{id}`
- `POST /iot/alert-events/{id}/acknowledge`
- `POST /iot/alert-events/{id}/resolve`

Không thấy endpoint count riêng, bulk acknowledge/resolve, hoặc field `isRead/readAt` trong `AlertEventItemResponse`. Implementation đầu tiên nên định nghĩa “cảnh báo chưa xem/cần chú ý” là `status === "OPEN"` và lấy count bằng `GET /iot/alert-events?status=OPEN&page=0&size=1`, dùng `totalItems` từ `PagedResponse`.

## 2. Current Notification Modal

| Component/File | Vai trò | Data source | Hiện có unread count? | Có tab chưa? | Ghi chú |
| --- | --- | --- | ---: | ---: | --- |
| `src/layouts/Header.tsx` | Render topbar, mount `NotificationPopover` | N/A | N/A | Không | `NotificationPopover` được render ở header. |
| `src/features/notifications/components/NotificationPopover.tsx` | Dropdown notification ở topbar | `useNotificationState`, `useNotificationHistory(false)` | Có, từ `/notifications/state` | Chưa | Tự mark all read khi mở/hover nếu có unread. |
| `src/features/notifications/components/NotificationItem.tsx` | Row notification | `UserNotificationResponse` | Có `isRead` trên item | Không | Có icon theo notification type, click để navigate. |
| `src/features/notifications/pages/NotificationsPage.tsx` | Trang xem tất cả notification | `useNotificationHistory(activeTab === "unread")` | Có | Có tab `all/unread` | Đây là page riêng, không phải topbar dropdown. |
| `src/features/notifications/api/notification.api.ts` | Notification API wrapper | `/notifications/*` | Có endpoint state | N/A | Không liên quan trực tiếp alert events. |

Notification dropdown hiện là popover/dropdown absolute, không phải full modal. Nó dùng notification service riêng:

| API wrapper | HTTP endpoint | Method | Request | Response | Used by |
| --- | --- | --- | --- | --- | --- |
| `notificationApi.getState` | `/notifications/state` | GET | none | `NotificationStateResponse { unreadCount, lastCheckedAt }` | Sidebar, popover, NotificationsPage |
| `notificationApi.getHistory` | `/notifications/history` | GET | `cursor`, `limit` | `UserNotificationResponse[]` envelope | Popover, NotificationsPage |
| `notificationApi.getUnreadHistory` | `/notifications/history/unread` | GET | `cursor`, `limit` | `UserNotificationResponse[]` envelope | NotificationsPage unread tab |
| `notificationApi.markAsRead` | `/notifications/{id}/read` | POST | notification id | void envelope | Notification click |
| `notificationApi.markAllAsRead` | `/notifications/read-all` | POST | none | void envelope | Popover/page mark all read |
| `notificationApi.markChecked` | `/notifications/checked` | POST | none | void envelope | Hook exists; popover initializes mutation but does not visibly call it |

Feasibility: alert events can be embedded as a second tab in `NotificationPopover`, but they should use the alert query/API path, not the notification API path. The existing dropdown layout, badge styling, loading/error/empty patterns can be reused.

## 3. Current Sidebar Navigation

| Component/File | Menu source | Route cảnh báo | Badge support hiện có? | Cần sửa gì |
| --- | --- | --- | ---: | --- |
| `src/layouts/Sidebar.tsx` | Hardcoded arrays: `coreNavItems`, `agricultureNavItems`, `utilityNavItems` | `ROUTES.DASHBOARD.ALERTS` = `/dashboard/alerts` | Có, qua `renderNavItem(item, badge?)` | Thêm alert count hook và badge map cho core nav. |
| `src/lib/routes.ts` | Route constants | `/dashboard/alerts`, `/dashboard/alert-rules` | N/A | Không cần đổi route. |
| `src/App.tsx` | Lazy route registration | `path="alerts"` | N/A | Không cần đổi route. |

Sidebar hiện có badge pattern sẵn:

- `utilityBadgeMap` map `ROUTES.DASHBOARD.NOTIFICATIONS` vào `unreadCount`.
- `utilityBadgeMap` map `ROUTES.DASHBOARD.CHAT` vào `chatUnreadCount`.
- `renderNavItem` đã hỗ trợ badge dạng `99+`, hidden khi `0`, và dot nhỏ khi sidebar collapsed.

Item “Cảnh báo” đang nằm trong `coreNavItems`, không đi qua `utilityBadgeMap`, nên implementation nên đổi `coreNavItems.map((item) => renderNavItem(item))` thành dùng một `coreBadgeMap`, ví dụ `{ [ROUTES.DASHBOARD.ALERTS]: openAlertCount }`.

## 4. Current Alert Events Page

| File | Render table/list | Row key | Current actions | Can add checkbox? | Notes |
| --- | --- | --- | --- | ---: | --- |
| `src/features/alerts/pages/AlertsPage.tsx` | `<table>` trong wrapper `overflow-x-auto` | `alert.id` | `acknowledgeAlert.mutate(alert.id)`, `resolveAlert.mutate(alert.id)` | Có | Thêm checkbox column đầu table là khả thi. |
| `src/features/alerts/pages/AlertsPage.test.tsx` | Tests page/filter/action | `alertItem.id` | Mock acknowledge/resolve endpoints | Có | Cần bổ sung tests bulk nếu implement. |
| `src/features/alerts/utils/alertLabels.ts` | CSS class severity/status | N/A | N/A | N/A | Có thể reuse trạng thái để disable action. |

Behavior hiện tại:

- Filter theo farm plot UI chỉ dùng để load zone/device options; request alert list không gửi `farmPlotId`.
- Request list gửi `severity`, `status`, `zoneId`, `deviceId`, `from`, `to`, `page`, `size`, `sortBy=openedAt`, `sortDir=desc`.
- Pagination dựa vào `PagedResponse.totalItems`, `page`, `totalPages`, `hasNext`, `hasPrevious`.
- `canAcknowledge = alert.status === "OPEN"`.
- `canResolve = alert.status === "OPEN" || alert.status === "ACKNOWLEDGED"`.
- Không có state chọn nhiều, không có checkbox, không có bulk toolbar.

Khi đổi page/filter, selection nên clear để tránh bulk action trên item không còn visible. Đây là hướng đơn giản và ít rủi ro nhất cho UI hiện tại.

## 5. Alert Event Data Model

`AlertEventItemResponse` hiện nằm trong `src/types/iot.ts`.

| Field | Có trong type/response? | UI đang dùng? | Ý nghĩa |
| --- | ---: | ---: | --- |
| `id` | Có | Có | Row key, id gửi acknowledge/resolve. |
| `alertEventId` | Không trong `AlertEventItemResponse` | Không | Một số domain khác có thể dùng tên này, alert page dùng `id`. |
| `status` | Có | Có | Lifecycle: `OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `CLOSED`. |
| `severity` | Có | Có | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `message` | Có | Có | Message raw, dùng parse disease/threshold summary. |
| `deviceId` | Có | Có | Lookup device label qua `useAlertScopeOptions`. |
| `zoneId` | Có | Có | Lookup zone label qua `useAlertScopeOptions`. |
| `farmPlotId` | Không | Không | Không có trong alert item/list params hiện tại. |
| `sensorTypeId` | Có | Có | Lookup sensor label/unit. |
| `alertRuleId` | Có | Không trực tiếp | Có thể dùng cho detail/rule linking sau này. |
| `alertType` | Có | Có | Label alert type và message format. |
| `triggerValue` | Có | Có | Giá trị đo/kết quả confidence. |
| `thresholdMin` | Có | Có | Hiển thị ngưỡng thấp/range. |
| `thresholdMax` | Có | Có | Hiển thị ngưỡng cao/range. |
| `openedAt` | Có | Có | Sort/display thời điểm cảnh báo. |
| `acknowledgedAt` | Có | Không trực tiếp | Dữ liệu lifecycle, status đang là source chính. |
| `resolvedAt` | Có | Không trực tiếp | Dữ liệu lifecycle, status đang là source chính. |
| `createdAt` | Không | Không | Không có trong type. |
| `isRead` | Không | Không | Chưa có khái niệm unread/read riêng cho alert. |
| `readAt` | Không | Không | Chưa có khái niệm read riêng cho alert. |
| `ownerUserId` | Không | Không | Không expose ở alert event item. |
| `source` | Không | Không | Không expose ở alert event item. |
| `type` | Không | Không | Alert dùng `alertType`. |
| `pushSent` | Có | Không | Có thể dùng audit push sau này, hiện UI không dùng. |

Kết luận: hệ thống alert hiện không phân biệt “chưa đọc” theo `isRead/readAt`. UI tiếng Việt đang map:

- `OPEN` = “Cần xử lý”
- `ACKNOWLEDGED` = “Đã xác nhận”
- `RESOLVED` = “Đã xử lý”
- `CLOSED` = “Đã đóng”

Nút “Đã xem” hiện thực chất gọi acknowledge và chuyển lifecycle từ `OPEN` sang `ACKNOWLEDGED`.

## 6. Current Alert APIs and Query Hooks

| API wrapper | HTTP endpoint | Method | Request | Response | Used by |
| --- | --- | --- | --- | --- | --- |
| `collectorApi.getAlertEvents` | `/iot/alert-events` | GET | `AlertEventsParams` cleaned by `cleanParams` | `PagedResponse<AlertEventItemResponse>` | `useAlertEvents`, `AlertsPage` |
| `collectorApi.getAlertEvent` | `/iot/alert-events/{id}` | GET | id | `AlertEventItemResponse` | Wrapper exists; no hook found in alerts queries |
| `collectorApi.acknowledgeAlert` | `/iot/alert-events/{id}/acknowledge` | POST | id | `AlertEventItemResponse` | `useAcknowledgeAlert`, row action |
| `collectorApi.resolveAlert` | `/iot/alert-events/{id}/resolve` | POST | id | `AlertEventItemResponse` | `useResolveAlert`, row action |

| Hook | Query key | Params | Used by | Invalidation hiện có |
| --- | --- | --- | --- | --- |
| `useAlertEvents(params, enabled)` | `["iot-alert-events", "list", params]` | `AlertEventsParams` | `AlertsPage` | Invalidated by both mutations through `alertKeys.all()` |
| `useAcknowledgeAlert()` | Mutation only | `alertEventId` | `AlertsPage` | Invalidates `alertKeys.all()` and `alertKeys.detail(id)` |
| `useResolveAlert()` | Mutation only | `alertEventId` | `AlertsPage` | Invalidates `alertKeys.all()` and `alertKeys.detail(id)` |
| `alertKeys.detail(id)` | `["iot-alert-events", "detail", id]` | id | No detail hook found | Invalidated, but no matching query in current feature |

Không thấy:

- alert count endpoint
- alert bulk acknowledge endpoint
- alert bulk resolve endpoint
- hook `useAlertEventDetail`
- hook `useUnreadAlertCount`

`PagedResponse` có `totalItems`, nên có thể tính count bằng request size nhỏ.

## 7. Unread Alert Count Feasibility

| Strategy | Khả thi frontend-only? | Độ chính xác | Tradeoff | Khuyến nghị |
| --- | ---: | ---: | --- | --- |
| `status === "OPEN"` | Có | Tốt cho “cần chú ý/cần xử lý” | Không phải unread đúng nghĩa; alert đã nhìn nhưng chưa acknowledge vẫn còn count | Dùng cho phase đầu. |
| `acknowledgedAt == null` | Có nếu fetch list đủ dữ liệu | Tương đương gần với `OPEN` trong lifecycle hiện tại | Với pagination cần count tổng, không thể tính từ current page | Không dùng làm count nếu không có backend filter. |
| `isRead/readAt` | Chưa có | Tốt nhất cho “chưa đọc” đúng nghĩa | Cần backend/schema/API mới | Recommendation backend sau. |
| Backend count endpoint | Chưa có | Tốt | Cần backend API mới | Deferred nếu cần realtime/chính xác/rẻ hơn. |

Recommendation đầu tiên: đặt tên UI là “cảnh báo cần xử lý” hoặc dùng badge `OPEN` count, không gọi là unread nếu chưa có `readAt/isRead`. Implement hook:

```ts
useOpenAlertCount() => useAlertEvents({ status: "OPEN", page: 0, size: 1, sortBy: "openedAt", sortDir: "desc" })
```

Sau đó lấy `data?.totalItems ?? 0`. Nếu UI vẫn muốn text “chưa xem”, cần chốt nghiệp vụ rằng `OPEN` là chưa xem/cần xem.

## 8. Notification Modal Tab Feasibility

Có thể thêm tab vào `NotificationPopover` theo hướng:

- State `activeTab: "notifications" | "alerts"`.
- Tab Notifications giữ nguyên `useNotificationState` + `useNotificationHistory(false)`.
- Tab Alerts dùng `useAlertEvents({ status: "OPEN", page: 0, size: 5, sortBy: "openedAt", sortDir: "desc" })`.
- Badge `Thông báo (n)` lấy từ `/notifications/state`.
- Badge `Cảnh báo (n)` lấy từ alert `PagedResponse.totalItems`.
- Click alert navigate về `ROUTES.DASHBOARD.ALERTS`, có thể kèm query/state nếu sau này trang hỗ trợ focus detail.
- Footer đổi theo tab: “Xem tất cả thông báo” hoặc “Xem tất cả cảnh báo”.

Lưu ý: `NotificationPopover` hiện tự gọi `markAllRead` khi mở/hover nếu `unreadCount > 0`. Khi thêm tab cảnh báo, không nên tự acknowledge alert khi chỉ mở dropdown. Alert lifecycle phải là explicit user action.

## 9. Sidebar Badge Feasibility

Sidebar đã có đầy đủ UI badge. Cần thêm data source cho alert count:

- Tạo hook `useOpenAlertCount` hoặc dùng trực tiếp `useAlertEvents` với size `1`.
- Thêm `coreBadgeMap` cho `ROUTES.DASHBOARD.ALERTS`.
- Gọi `renderNavItem(item, coreBadgeMap[item.path])` cho `coreNavItems`.
- Badge ẩn nếu `0`, hiển thị `99+` nếu lớn hơn 99 theo pattern sẵn.

Data/cache:

- Dùng cùng `alertKeys.list(params)` để React Query cache theo params.
- Mutation acknowledge/resolve đã invalidate `alertKeys.all()`, nên sidebar count sẽ refresh sau lifecycle actions.
- Nếu cần realtime, hiện chưa thấy websocket alert-specific ở Web. Có thể dùng `refetchInterval` nhẹ hoặc backend notification integration sau.

## 10. Bulk Selection Feasibility

UI hiện là table nên thêm checkbox tương đối thẳng:

- Thêm state `selectedAlertIds: Set<string>`.
- Thêm checkbox column đầu `<thead>` và mỗi `<tr>`.
- Checkbox “select all current page” chỉ chọn `alerts` đang hiển thị.
- Clear selection khi đổi filter/page/size hoặc sau bulk success.
- Bulk toolbar hiển thị khi `selectedAlertIds.size > 0`.

Action logic đề xuất:

- Bulk “Đã xem”: chỉ apply cho selected alerts có `status === "OPEN"`.
- Bulk “Đánh dấu đã xử lý”: apply cho selected alerts có `status === "OPEN" || status === "ACKNOWLEDGED"`.
- Nếu selected có mixed status, hiển thị count eligible và disable action khi eligible count = 0.

Mutation strategy:

| Strategy | Required backend? | Ưu điểm | Nhược điểm | Khuyến nghị |
| --- | ---: | --- | --- | --- |
| Gọi từng endpoint bằng `Promise.allSettled` | Không | Implement frontend-only nhanh | N request, partial failure cần UI rõ | Dùng cho phase frontend đầu nếu số lượng nhỏ. |
| Gọi tuần tự từng endpoint | Không | Giảm burst request | Chậm hơn | Dùng nếu backend dễ bị quá tải. |
| Backend bulk endpoint | Có | Ít request, response tổng hợp rõ | Cần backend changes/tests | Khuyến nghị dài hạn. |

Vì backend hiện chưa có bulk endpoint trong route/API wrapper, phase đầu có thể dùng multiple calls. Nếu bulk selection cho 50 items thường xuyên, nên thêm backend endpoint.

## 11. Recommended Implementation Phases

### Phase 1: Count Hook + Sidebar Badge

- Chốt định nghĩa frontend đầu tiên: alert count = `status === "OPEN"`.
- Tạo `useOpenAlertCount`.
- Thêm badge cho `ROUTES.DASHBOARD.ALERTS` trong `Sidebar`.
- Thêm tests nếu có render test cho sidebar hoặc hook.

### Phase 2: Notification Dropdown Tabs

- Refactor `NotificationPopover` thêm tabs `Thông báo` và `Cảnh báo`.
- Tab Cảnh báo hiển thị 5 alert `OPEN` mới nhất.
- Không tự acknowledge alert khi mở dropdown.
- Footer alert navigate `/dashboard/alerts`.

### Phase 3: Alert List Bulk Selection/Actions

- Thêm checkbox per row và select all current page.
- Thêm bulk toolbar.
- Implement frontend-only bulk bằng existing per-alert mutations.
- Invalidate `alertKeys.all()` sau batch.

### Phase 4: Optional Backend Count/Bulk Endpoints

- `GET /iot/alert-events/count?status=OPEN`
- `POST /iot/alert-events/bulk-acknowledge`
- `POST /iot/alert-events/bulk-resolve`
- Optional `readAt/isRead` nếu muốn unread đúng nghĩa tách khỏi lifecycle.

### Phase 5: Tests

- NotificationPopover tab tests.
- Sidebar badge tests.
- AlertsPage bulk selection/action tests.
- API wrapper/query hook tests nếu project có pattern.

## 12. Risks / Decisions Needed

- Cần chốt wording: badge là “chưa đọc/chưa xem” hay “cần xử lý”. Code hiện chỉ có lifecycle status, không có read model.
- Nếu dùng `OPEN` count, một alert đã được user nhìn thấy nhưng chưa bấm “Đã xem” vẫn còn badge.
- `NotificationPopover` hiện mark all notifications read khi mở/hover; không nên copy behavior này cho alerts.
- Bulk frontend-only qua nhiều request có partial failure. UI cần báo số thành công/thất bại nếu làm kỹ.
- Count không realtime nếu alert events không đi qua notification websocket. Có thể chấp nhận cache/refetch hoặc thêm polling nhẹ.
- Alert list hiện không có detail route/focus alert id; click alert trong popover chỉ nên route về list trước, hoặc cần thêm query param support sau.

## 13. Recommended Next Codex Prompt

```text
Bạn là Codex. Hãy implement Phase 1 cho Web Leafy_FE alert badge:
- Chỉ sửa Leafy_FE.
- Định nghĩa alert count là số alert events status OPEN.
- Tạo hook useOpenAlertCount dùng GET /iot/alert-events với status=OPEN,page=0,size=1 và lấy totalItems.
- Thêm badge count cho sidebar item ROUTES.DASHBOARD.ALERTS, reuse badge UI hiện có, hiển thị 99+ nếu >99.
- Không đổi notification dropdown, không thêm bulk action trong phase này.
- Thêm/cập nhật tests nếu có pattern phù hợp.
- Chạy targeted tests/typecheck và báo kết quả.
```
