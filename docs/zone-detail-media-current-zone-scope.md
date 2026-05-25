# ZoneDetail media/diagnosis current-zone scope

## Problem

`ZoneDetailMetricsPage` previously loaded media with `useDeviceMedia(deviceId)` for the device currently assigned to the zone. That call used the legacy device-history endpoint and could show photos or diagnosis results captured when the same device belonged to another zone.

## Fix

The zone page now calls:

```http
GET /iot/devices/{deviceId}/media?zoneId={zoneId}
```

through `useDeviceMedia(deviceId, zoneId)`.

## Behavior

| Scenario | Result |
| --- | --- |
| Device moved from zone A to zone B | Zone B page does not show zone A media |
| No media in zone B | Empty zone media state |
| New capture in zone B | Media appears after refetch |
| Legacy device history | Still available only when calling without `zoneId` |

## Future Phase D2

Consider adding:

```http
GET /iot/farm-zones/{zoneId}/media
```

if a zone can have multiple devices or needs full zone media history independent of the currently selected device.
