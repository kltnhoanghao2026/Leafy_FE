import type { ApiEnvelope } from '../../auth/types'
import type { RegisterPushTokenPayload } from '../types'
import { getOrCreateDeviceId } from '../../../lib/clientDevice'
import { useAuthStore } from '../../../store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken

  return {
    'Content-Type': 'application/json',
    'X-Device-ID': getOrCreateDeviceId(),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function handleResponse<T>(res: Response): Promise<ApiEnvelope<T>> {
  const text = await res.text()

  let body: ApiEnvelope<T>
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error(text || `Request failed with status ${res.status}`)
  }

  if (!res.ok) {
    throw new Error(body.message || `Request failed with status ${res.status}`)
  }

  return body
}

export async function apiRegisterPushToken(payload: RegisterPushTokenPayload) {
  const res = await fetch(`${BASE_URL}/push-tokens`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  })

  return handleResponse<null>(res)
}

export async function apiDeactivatePushToken(fcmToken: string) {
  const res = await fetch(`${BASE_URL}/push-tokens/deactivate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ fcmToken })
  })

  return handleResponse<null>(res)
}
