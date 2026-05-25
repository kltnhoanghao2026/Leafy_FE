import { storage, STORAGE_KEYS } from "./local-storage";

export const getDeviceId = (): string => {
  const deviceId = storage.get<string>(STORAGE_KEYS.DEVICE_ID);
  if (deviceId) return deviceId;

  const newId = `web-${crypto.randomUUID()}`;
  storage.set(STORAGE_KEYS.DEVICE_ID, newId);
  return newId;
};
