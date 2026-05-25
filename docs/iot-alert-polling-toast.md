# IoT Alert Polling Toast

Leafy web uses a lightweight frontend watcher for near-realtime alert awareness while the dashboard is open.

## Polling Policy

| Query | Interval | Scope |
| --- | ---: | --- |
| Recent OPEN alert watcher | 10s | Dashboard authenticated layout |

The watcher queries the five latest `OPEN` alert events with:

```text
GET /iot/alert-events?status=OPEN&page=0&size=5&sortBy=openedAt&sortDir=desc
```

## Toast Behavior

- The first query snapshot only records existing alert IDs and does not show a toast.
- A later query that contains unseen `OPEN` alert IDs shows an in-app toast.
- One new alert shows a detail toast with severity and alert message.
- Multiple new alerts show one summary toast.
- Clicking a single-alert toast routes to `/dashboard/alerts?alertId=<id>`.
- Clicking a summary toast routes to `/dashboard/alerts`.
- The watcher invalidates `alertKeys.all()` only when it detects new alerts.

## Safety

- The watcher does not acknowledge, resolve, or mutate alert lifecycle state.
- Polling is disabled in background tabs with `refetchIntervalInBackground: false`.
- This is frontend polling, not browser push and not WebSocket/SSE realtime.

## Known Limitations

- Toasts only work while the web app is open.
- Alert focus/highlight depends on `AlertsPage` handling the `alertId` query parameter.
- Backend notification-service, FCM, and WebSocket alert delivery remain separate future work.
