# Client Camera Schedules

Client web and mobile use the same device-scoped collector routes:

```text
GET    /iot/devices/{deviceUid}/camera/capture-schedule
POST   /iot/devices/{deviceUid}/camera/capture-schedule
PUT    /iot/devices/{deviceUid}/camera/capture-schedule/{scheduleId}
DELETE /iot/devices/{deviceUid}/camera/capture-schedule/{scheduleId}
POST   /iot/devices/{deviceUid}/camera/run-scheduled/{scheduleId}
```

Create/update payload:

```json
{
  "enabled": true,
  "timeOfDay": "08:30:00",
  "recurrence": "DAILY",
  "resolution": "VGA",
  "quality": "MEDIUM",
  "uploadEndpoint": "https://files.example.com/files/upload"
}
```

Allowed values:

- `recurrence`: `DAILY`, `WEEKLY`, `MONTHLY`
- `resolution`: `QVGA`, `VGA`, `HD`
- `quality`: `LOW`, `MEDIUM`, `HIGH`
- `uploadEndpoint`: optional HTTP or HTTPS URL

Web entry points:

- Device Detail media panel: schedule list, create schedule, run-now, latest media and analysis status.
- `DeviceCameraSchedulesPage`: device-scoped full CRUD page at `/devices/:deviceId/camera-schedules`.

Mobile entry point:

- `DeviceMediaPanel`: schedule list, create/edit/delete/run-now, pull-to-refresh through the parent Device Detail screen.

Both clients use optimistic TanStack Query updates and rollback local schedule cache when mutations fail.
