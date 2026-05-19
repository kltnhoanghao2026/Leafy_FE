# Phase C Camera Frontend

## Device Detail

The Device Detail media panel now supports the client scheduled capture flow:

- Latest uploaded thumbnail from `DeviceMediaEvent.fileId`.
- Analysis status from `DeviceMediaEvent.analysis.status`.
- Disease type, severity, and alert badge when `analysis.diseaseDetected=true`.
- Per-device schedule list with `timeOfDay`, `recurrence`, `resolution`,
  `quality`, `uploadEndpoint`, `nextRunAt`, and `lastRunAt`.
- Schedule creation through:

```http
POST /iot/devices/{deviceUid}/camera/capture-schedule
```

- Manual re-analysis through:

```http
POST /iot/devices/{deviceUid}/camera/detect
```

The re-analysis payload includes `force=true`; backend idempotency remains keyed
by `mediaEventId`.

## Admin Schedules

The admin schedule list supports:

- Device UID and enabled filters.
- Last capture thumbnail and media status.
- Capture options display.
- Per-device run through:

```http
POST /admin/camera/run-scheduled/{deviceUid}
```

The older schedule-id run action remains available for compatibility:

```http
POST /iot/camera-schedules/{scheduleId}/run-now
```

## i18n Keys

New `iot.cameraSchedules` keys:

- `runScheduledCaptureNow`
- `captureOptions`
- `resolution`
- `quality`
- `uploadEndpoint`

Existing keys reused:

- `title`
- `timeOfDay`
- `recurrence`
- `nextRunAt`
- `lastRunAt`
- `lastCapture`
- `enabled`
- `disabled`
- `toastRunSuccess`
- `toastRunFailed`
