# IoT and Alert Display Mapping

This module keeps raw backend fields out of user-facing IoT, camera, media, and alert screens.
Backend IDs are still preserved in API payloads and React Query cache keys, but UI components should consume the `display` objects produced by `src/features/iot/utils/iotDisplay.ts`.

| Old field/raw value | New display field/label | Notes |
| --- | --- | --- |
| `deviceUid` in schedule tables | `schedule.display.device` | Shows a readable device label. The raw UID is only exposed as secondary tooltip/title text for admin context. |
| `scheduleId` / `id` | Hidden from normal UI | Kept for React keys and mutations only. |
| `timeOfDay` as `HH:mm:ss` | `schedule.display.timeOfDay` | Shows `HH:mm` when seconds are not meaningful. |
| `recurrence` enum | `schedule.display.recurrence` | Localized with `iot.cameraSchedules.recurrence*` keys. |
| `resolution` enum | `schedule.display.resolution` | Localized with `iot.cameraSchedules.resolutionOptions.*`. |
| `quality` enum | `schedule.display.quality` | Localized with `iot.cameraSchedules.qualityOptions.*`. |
| `uploadEndpoint` URL | `schedule.display.endpoint` | Shows a friendly default destination when empty. |
| media `requestId` | Hidden from media history | Replaced with upload/capture status and fallback message. |
| media dimensions and bytes | `media.display.size` | Formats dimensions and byte count consistently. |
| media analysis status enums | `media.display.analysis.status` | Localized labels for pending, processing, processed, detected, and failed analysis. |
| disease severity enums | `media.display.analysis.severity` | Uses shared severity labels instead of raw `HIGH`, `CRITICAL`, etc. |
| alert `id` | Hidden from alert table and button labels | Buttons use alert type and opened time for accessible labels. |
| alert status/severity/type enums | `alert.display.status`, `alert.display.severity`, `alert.display.type` | Localized through IoT alert translation helpers. |
| raw timestamps | `*.display.*At` | Uses the shared date-time formatter before rendering. |

When adding new IoT or Alert UI, prefer:

- Format in query `select` with `withMediaDisplay`, `withScheduleDisplay`, or `withAlertDisplay`.
- Keep raw IDs for mutations/cache keys only.
- Add new user-facing text to both `src/i18n/locales/en.ts` and `src/i18n/locales/vi.ts`.
- Use raw backend values only as secondary technical text when admin workflows require it.
