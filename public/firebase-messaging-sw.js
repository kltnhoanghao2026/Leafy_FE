importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js')

const params = new URL(self.location.href).searchParams

const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket') || undefined,
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
  measurementId: params.get('measurementId') || undefined
}

const hasRequiredConfig = Object.entries(firebaseConfig)
  .filter(([key]) => key !== 'measurementId' && key !== 'storageBucket')
  .every(([, value]) => Boolean(value))

if (hasRequiredConfig) {
  firebase.initializeApp(firebaseConfig)

  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const data = payload.data || {}
    const title = payload.notification?.title || data.title || 'Leafy'
    const options = {
      body: payload.notification?.body || data.message,
      icon: '/vite.svg',
      data: {
        ...data,
        url: sanitizeNotificationUrl(data.url || fallbackNotificationUrl(data))
      }
    }

    self.registration.showNotification(title, options)
  })
}

function fallbackNotificationUrl(data) {
  if (data?.type === 'IOT_ALERT' && (data.alertEventId || data.referenceId)) {
    const alertEventId = encodeURIComponent(data.alertEventId || data.referenceId)
    return `/dashboard/alerts?alertId=${alertEventId}`
  }
  return '/dashboard'
}

function sanitizeNotificationUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '/dashboard'
  }

  try {
    const parsed = new URL(rawUrl, self.location.origin)
    if (parsed.origin !== self.location.origin) {
      return '/dashboard'
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch (_error) {
    return '/dashboard'
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = sanitizeNotificationUrl(event.notification.data?.url)
  const absoluteTargetUrl = new URL(targetUrl, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && new URL(client.url).origin === self.location.origin) {
          if ('navigate' in client) {
            client.navigate(absoluteTargetUrl)
          }
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteTargetUrl)
      }

      return undefined
    })
  )
})
