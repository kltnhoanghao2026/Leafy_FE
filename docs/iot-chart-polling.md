# IoT Chart Polling

Leafy web uses controlled React Query polling for near-realtime IoT data while the browser tab is active.

## Polling Policy

| Query | Interval | Reason |
| --- | ---: | --- |
| Device latest readings | 10s | `sensor_latest_readings` is updated immediately after MQTT ingest |
| Zone overview | 10s | overview uses latest readings and summary state |
| Dashboard overview | 15s | dashboard summary does not need second-level refresh |
| 1h chart | 60s | short chart window; backend data can refresh near the 5-minute aggregate rebuild cadence |
| 1d chart | 60s | typically backed by 5-minute aggregate data rebuilt about once per minute |
| 7d chart | 120s | longer window; no need to poll as frequently |
| 30d chart | 120s | longer window; no need to poll as frequently |

Current Web UI renders four chart ranges: `1h`, `1d`, `7d`, and `30d`.

The internal display range values are `H1`, `D1`, `D7`, and `M1`. Before calling the backend, they are mapped to API ranges:

| UI label | Display value | Backend range |
| --- | --- | --- |
| 1h | `H1` | `H24` |
| 1d | `D1` | `H24` |
| 7d | `D7` | `D7` |
| 30d | `M1` | `D30` |

Polling is disabled in background tabs with `refetchIntervalInBackground: false`. Returning to the tab triggers React Query window-focus refetch.

## Known Limitations

- This is near-realtime polling, not true telemetry streaming.
- Historical charts still depend on backend aggregate scheduler timing.
- Latest readings should update faster than historical charts.
- No WebSocket, SSE, MQTT bridge, FCM, or alert toast behavior is added in this phase.

## Next Phase

Add an alert polling watcher that detects newly opened alerts, shows an in-app toast, and invalidates alert queries without changing alert lifecycle state.
