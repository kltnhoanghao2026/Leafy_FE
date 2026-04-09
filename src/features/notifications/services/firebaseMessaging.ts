import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
  type Messaging
} from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

let firebaseApp: FirebaseApp | null = null
let messagingInstance: Messaging | null = null

function hasBrowserPushPrimitives() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

function getRequiredWorkerConfig() {
  return {
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
    measurementId: firebaseConfig.measurementId ?? ''
  }
}

function buildMessagingServiceWorkerUrl() {
  const workerConfig = getRequiredWorkerConfig()
  const params = new URLSearchParams({
    apiKey: workerConfig.apiKey ?? '',
    authDomain: workerConfig.authDomain ?? '',
    projectId: workerConfig.projectId ?? '',
    storageBucket: workerConfig.storageBucket ?? '',
    messagingSenderId: workerConfig.messagingSenderId ?? '',
    appId: workerConfig.appId ?? '',
    measurementId: workerConfig.measurementId
  })
  return `/firebase-messaging-sw.js?${params.toString()}`
}

function getFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = initializeApp({
      apiKey: firebaseConfig.apiKey!,
      authDomain: firebaseConfig.authDomain!,
      projectId: firebaseConfig.projectId!,
      storageBucket: firebaseConfig.storageBucket!,
      messagingSenderId: firebaseConfig.messagingSenderId!,
      appId: firebaseConfig.appId!,
      measurementId: firebaseConfig.measurementId
    })
  }

  return firebaseApp
}

function getMessagingClient() {
  if (!messagingInstance) {
    messagingInstance = getMessaging(getFirebaseApp())
  }

  return messagingInstance
}

export function isFirebaseMessagingConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      vapidKey
  )
}

export async function isWebPushSupported() {
  if (!hasBrowserPushPrimitives()) {
    return false
  }

  return isSupported()
}

export async function registerMessagingServiceWorker() {
  return navigator.serviceWorker.register(buildMessagingServiceWorkerUrl())
}

export async function getCurrentFcmToken(serviceWorkerRegistration: ServiceWorkerRegistration) {
  const messaging = getMessagingClient()

  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration
  })
}

export function subscribeToForegroundMessages(
  onReceive: (payload: MessagePayload) => void
) {
  const messaging = getMessagingClient()
  return onMessage(messaging, onReceive)
}
