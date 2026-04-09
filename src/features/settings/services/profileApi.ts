import type { ApiEnvelope, ProfileResponse, ProfileUpdateRequest } from '../types'
import { useAuthStore } from '../../../store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function getAuthHeaders (): HeadersInit {
  const token = useAuthStore.getState().accessToken
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function handleResponse<T> (res: Response): Promise<ApiEnvelope<T>> {
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

// --- Get My Profile ---
export async function apiGetMyProfile (): Promise<ApiEnvelope<ProfileResponse>> {
  const userId = useAuthStore.getState().user?.id
  const res = await fetch(`${BASE_URL}/profiles/me`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      ...(userId ? { 'X-User-Id': userId } : {})
    }
  })

  return handleResponse<ProfileResponse>(res)
}

// --- Get Profile by User ID ---
export async function apiGetProfileByUserId (userId: string): Promise<ApiEnvelope<ProfileResponse>> {
  const res = await fetch(`${BASE_URL}/profiles/user/${userId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  })

  return handleResponse<ProfileResponse>(res)
}

// --- Update Profile by User ID ---
export async function apiUpdateProfileByUserId (
  userId: string,
  data: ProfileUpdateRequest
): Promise<ApiEnvelope<ProfileResponse>> {
  const res = await fetch(`${BASE_URL}/profiles/user/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })

  return handleResponse<ProfileResponse>(res)
}
