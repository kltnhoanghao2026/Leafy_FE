const DEVICE_STORAGE_KEY = 'x-device-id'

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: {
    platform?: string
  }
}

function normalizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getBrowserName() {
  const userAgent = navigator.userAgent

  if (userAgent.includes('Edg/')) return 'edge'
  if (userAgent.includes('Chrome/')) return 'chrome'
  if (userAgent.includes('Firefox/')) return 'firefox'
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'safari'

  return 'browser'
}

function getPlatformName() {
  const platform = (navigator as NavigatorWithUserAgentData).userAgentData?.platform ?? navigator.platform ?? 'web'
  return normalizeSegment(platform) || 'web'
}

export function getOrCreateDeviceId() {
  const storedDeviceId = window.localStorage.getItem(DEVICE_STORAGE_KEY)
  if (storedDeviceId) {
    return storedDeviceId
  }

  const generatedDeviceId = `web-${window.crypto.randomUUID()}`
  window.localStorage.setItem(DEVICE_STORAGE_KEY, generatedDeviceId)
  return generatedDeviceId
}

export function buildWebDeviceIdentifier() {
  const suffix = getOrCreateDeviceId().replace(/^web-/, '').slice(0, 12)
  return `${getBrowserName()}-${getPlatformName()}-${suffix}`
}
