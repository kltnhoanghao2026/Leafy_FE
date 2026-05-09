const fallbackLabel = (value?: string | null) => {
  if (!value) return "Không rõ";
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const deviceStatusLabels: Record<string, string> = {
  ONLINE: "Đang online",
  OFFLINE: "Đang offline",
  UNKNOWN: "Chưa rõ trạng thái",
  DISABLED: "Đã tắt",
};

const provisioningStatusLabels: Record<string, string> = {
  PROVISIONED: "Chờ liên kết",
  CLAIMED: "Đã liên kết",
  RETIRED: "Ngừng sử dụng",
};

const deviceTypeLabels: Record<string, string> = {
  ESP32_CAM_SENSOR: "Cảm biến ESP32 có camera",
  ESP32_SENSOR: "Cảm biến ESP32",
  SENSOR_NODE: "Thiết bị cảm biến",
  CAMERA_SENSOR: "Cảm biến có camera",
};

const configPushStatusLabels: Record<string, string> = {
  PENDING: "Đang chờ gửi",
  SENT: "Đã gửi xuống thiết bị",
  ACKED: "Thiết bị đã xác nhận",
  FAILED: "Thiết bị báo lỗi",
};

const mediaStatusLabels: Record<string, string> = {
  REQUESTED: "Đã yêu cầu chụp",
  COMMAND_SENT: "Đã gửi lệnh chụp",
  UPLOADING: "Đang tải ảnh lên",
  UPLOADED: "Đã có ảnh",
  FAILED: "Chụp ảnh thất bại",
  TIMEOUT: "Quá thời gian chờ",
};

export const deviceStatusLabel = (status?: string | null) =>
  deviceStatusLabels[status ?? ""] ?? fallbackLabel(status);

export const provisioningStatusLabel = (status?: string | null) =>
  provisioningStatusLabels[status ?? ""] ?? fallbackLabel(status);

export const deviceTypeLabel = (deviceType?: string | null) =>
  deviceTypeLabels[deviceType ?? ""] ?? fallbackLabel(deviceType ?? "Thiết bị IoT");

export const configPushStatusLabel = (status?: string | null) =>
  status ? configPushStatusLabels[status] ?? fallbackLabel(status) : "Chưa gửi";

export const mediaStatusLabel = (status?: string | null) =>
  mediaStatusLabels[status ?? ""] ?? fallbackLabel(status);

export const readableDeviceName = (device?: { deviceName?: string | null; deviceCode?: string | null }) =>
  device?.deviceName?.trim() || device?.deviceCode?.trim() || "Thiết bị IoT";
