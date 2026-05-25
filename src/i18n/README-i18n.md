# IoT i18n Coverage

The frontend uses the custom i18n provider in `src/i18n`. Vietnamese locale shape is canonical and English mirrors that shape with widened string values.

## Shared IoT Keys

Reusable labels live under `iot.common`, `iot.sensor`, `iot.severity`, `iot.alertStatus`, `iot.alertType`, `iot.deviceStatus`, `iot.deviceType`, `iot.configStatus`, `iot.actions`, `iot.ranges`, `iot.telemetry`, `iot.media`, and `iot.charts`.

Enum/backend display values should go through `src/features/iot/utils/iotTranslation.ts`:

- `formatSensorLabel`
- `formatAlertStatusLabel`
- `formatSeverityLabel`
- `formatDeviceStatusLabel`
- `formatDeviceTypeLabel`
- `formatConfigStatusLabel`
- `formatAlertTypeLabel`
- `formatMediaStatusLabel`
- `formatChartRangeLabel`

Unknown backend values fall back to a readable version of the raw value, or to `iot.common.unknown` when no value is present.

## Migrated IoT Surfaces

- Alert Center: `iot.alerts`
- Alert Rules: `iot.alertRules`
- Device Detail, Config, and Media: `iot.devices.detail`, `iot.devices.config`, `iot.devices.media`
- Device Onboarding and Device Index: `iot.devices.onboarding`, `iot.devices.location`, `iot.devices.index`
- Dashboard and farm/zone management: `iot.dashboard`
- Zone Metrics and chart components: `iot.metrics`, `iot.charts`
- Admin IoT Demo Tools: `iot.demo`

## Known Boundaries

Community/profile/auth pages are outside IoT i18n scope. Metrics-view components that link to community data now use IoT dashboard keys only for their local headings and action labels.
