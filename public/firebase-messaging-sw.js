importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js')

const params = new URL(self.location.href).searchParams

const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
  measurementId: params.get('measurementId') || undefined
}

const hasRequiredConfig = Object.entries(firebaseConfig)
  .filter(([key]) => key !== 'measurementId')
  .every(([, value]) => Boolean(value))

if (hasRequiredConfig) {
  firebase.initializeApp(firebaseConfig)

  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'Leafy'
    const options = {
      body: payload.notification?.body,
      icon: '/vite.svg',
      data: payload.data
    }

    self.registration.showNotification(title, options)
  })
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }

      return undefined
    })
  )
})
