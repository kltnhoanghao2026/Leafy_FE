# IoT Alert FCM Web Push

## Required Frontend Env

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_VAPID_KEY
```

`VITE_FIREBASE_STORAGE_BUCKET` and `VITE_FIREBASE_MEASUREMENT_ID` are optional for Messaging bootstrap.

## Flow

```text
notification-service FCM data payload
-> foreground onMessage or firebase-messaging-sw.js
-> toast or browser notification
-> click opens /dashboard/alerts?alertId=<alertEventId>
```

## Foreground Behavior

When the tab is open and Firebase `onMessage` receives `type=IOT_ALERT`:

* Parse `alertEventId`, `url`, `severity`, title, and body.
* Mark the alert id as recently notified so the polling watcher does not immediately duplicate the toast.
* Invalidate `alertKeys.all()`.
* Invalidate `notificationKeys.all()`.
* Show an in-app toast.
* Click the toast route to the safe same-origin alert URL.

## Background Behavior

`public/firebase-messaging-sw.js`:

* shows a browser notification using notification or data title/body;
* stores sanitized `data.url`;
* rejects external URLs;
* focuses an existing same-origin client if possible;
* otherwise opens a new same-origin window.

## Permission UX

`PushNotificationsBootstrap` keeps the existing explicit banner flow. It does not prompt automatically on page load. If permission is denied or Firebase is unconfigured, polling and IN_APP fallback still work while the web app is open.

## Known Limitations

* Requires browser notification permission.
* Requires HTTPS or localhost.
* Real Firebase/browser behavior needs manual validation with valid Firebase config and service account.
* Polling fallback remains active by design.
