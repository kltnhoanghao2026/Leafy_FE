/**
 * Vietnamese locale for notifications feature.
 * Source of truth — add keys here first.
 */
export const notificationsVi = {
  // ── Popover header ────────────────────────────────────────────────────────
  title: 'Thông báo',
  markAllRead: 'Đánh dấu đã đọc',
  markAllReadAriaLabel: 'Đánh dấu tất cả đã đọc',
  bellAriaLabel: 'Thông báo',
  popoverTabsAriaLabel: 'Chọn loại thông báo',
  popoverTabNotifications: 'Thông báo',
  popoverTabAlerts: 'Cảnh báo',

  // ── Popover body states ───────────────────────────────────────────────────
  loadError: 'Không thể tải thông báo.',
  retry: 'Thử lại',
  empty: 'Chưa có thông báo nào.',
  allShown: 'Đã hiển thị tất cả thông báo',
  seeAll: 'Xem tất cả thông báo',
  popoverAlertsError: 'Không thể tải cảnh báo.',
  popoverAlertsEmpty: 'Không có cảnh báo cần xử lý.',
  popoverAlertsViewAll: 'Xem tất cả cảnh báo',
  popoverAlertsFallbackMessage: 'Cảnh báo mới cần xử lý',

  // ── Notifications page ────────────────────────────────────────────────────
  pageTitle: 'Thông báo',
  pageSubtitle: 'Cập nhật những hoạt động và tương tác mới nhất của bạn',
  tabAll: 'Tất cả',
  tabUnread: 'Chưa đọc',
  pageMarkAllRead: 'Đánh dấu đã đọc',
  pageLoadError: 'Không thể tải thông báo',
  pageLoadErrorDetail: 'Đã có lỗi xảy ra trong quá trình kết nối.',
  pageTryAgain: 'Thử lại',
  emptyAllTitle: 'Chưa có thông báo nào',
  emptyAllSubtitle: 'Các thông báo mới về hoạt động cộng đồng và hệ thống sẽ xuất hiện ở đây.',
  emptyUnreadTitle: 'Bạn đã đọc tất cả thông báo',
  emptyUnreadSubtitle: 'Tuyệt vời! Bạn không bỏ lỡ bất kỳ thông tin quan trọng nào.',
  exploreCommunity: 'Khám phá cộng đồng',
  allShownCount: (count: number) => `Đã hiển thị tất cả ${count} thông báo`,

  // ── NotificationItem ──────────────────────────────────────────────────────
  defaultInteraction: 'đã tương tác với bạn',
  defaultUser: 'Người dùng',

  // ── Relative time ─────────────────────────────────────────────────────────
  timeJustNow: 'Vừa xong',
  timeMinutesAgo: (n: number) => `${n} phút trước`,
  timeHoursAgo: (n: number) => `${n} giờ trước`,
  timeDaysAgo: (n: number) => `${n} ngày trước`,
  timeMonthsAgo: (n: number) => `${n} tháng trước`,
  timeYearsAgo: (n: number) => `${n} năm trước`,

  // ── PushNotificationBanner — blocked mode ─────────────────────────────────
  blockedTag: 'Thông báo đang bị chặn',
  blockedTitle: 'Trình duyệt chưa cho phép nhận cảnh báo',
  blockedBody: 'Hãy bật lại quyền thông báo trong cài đặt trình duyệt để nhận cảnh báo độ ẩm, nhiệt độ và bệnh cây theo thời gian thực.',
  blockedDismiss: 'Ẩn nhắc nhở',

  // ── error mode ────────────────────────────────────────────────────────────
  errorTag: 'Đăng ký push chưa hoàn tất',
  errorTitle: 'Thiết bị chưa đồng bộ được push token',
  errorBodyFallback: 'Token đã được cấp quyền nhưng chưa gửi thành công lên backend. Bạn có thể thử đồng bộ lại.',
  errorLater: 'Để sau',
  errorRetry: 'Đồng bộ lại',

  // ── unconfigured mode ─────────────────────────────────────────────────────
  unconfiguredTag: 'Firebase chưa cấu hình',
  unconfiguredTitle: 'Thiếu biến môi trường cho web push',
  unconfiguredBody: 'Cần cấu hình Firebase Messaging và VAPID key trước khi web có thể tạo push token.',

  // ── enable mode ───────────────────────────────────────────────────────────
  enableTag: 'Bật thông báo cho thiết bị này',
  enableTitle: 'Nhận cảnh báo độ ẩm, nhiệt độ và bệnh cây theo thời gian thực',
  enableBody: 'Khi bạn cho phép, hệ thống sẽ lấy FCM token trên trình duyệt hiện tại và gắn nó với tài khoản đang đăng nhập.',
  enableLater: 'Để sau',
  enableButton: 'Bật thông báo',
  enabling: 'Đang bật...',
} as const;
