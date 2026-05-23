export const settingsVi = {
  title: "Cài đặt hệ thống",
  subtitle: "Quản lý tài khoản và tùy chỉnh trải nghiệm của bạn.",
  copyright: "© 2024 Coffee Monitor Việt Nam. Bảo lưu mọi quyền.",

  tabs: {
    account: "Tài khoản",
    display: "Hiển thị",
    privacy: "Quyền riêng tư",
    notifications: "Thông báo",
    consulting: "Tư vấn",
  },

  display: {
    title: "Giao diện & Ngôn ngữ",
    theme: "Giao diện",
    themeDescription: "Được lưu trong hồ sơ và áp dụng cho toàn bộ ứng dụng.",
    themeLight: "Sáng",
    themeDark: "Tối",
    language: "Ngôn ngữ",
    languageDescription: "Chọn ngôn ngữ hiển thị cho ứng dụng.",
    languageVi: "Tiếng Việt",
    languageEn: "English",
    savingPrefs: "Đang lưu tuỳ chỉnh...",
    savedPrefs: "Đã lưu tuỳ chỉnh giao diện.",
    loadError: "Không thể tải tuỳ chỉnh giao diện.",
    saveError: "Không thể lưu tuỳ chỉnh giao diện.",
    languageSavedPrefs: "Đã lưu ngôn ngữ hiển thị.",
    languageSaveError: "Không thể lưu ngôn ngữ hiển thị.",
    retry: "Thử lại",
  },

  profile: {
    title: "Thông tin hồ sơ",
    fullName: "Họ và tên",
    bio: "Giới thiệu",
    role: "Vai trò",
    specialty: "Chuyên môn",
    save: "Lưu thay đổi",
    saving: "Đang lưu...",
    saveSuccess: "Hồ sơ đã được cập nhật.",
    saveError: "Không thể lưu thay đổi.",
    unnamed: "Chưa đặt tên",
    viewProfile: "Xem trang hồ sơ của bạn",
  },

  privacy: {
    title: "Quyền riêng tư",
    loadError: "Không thể tải tuỳ chỉnh quyền riêng tư.",
    saving: "Đang lưu...",
    saved: "Đã lưu tuỳ chỉnh quyền riêng tư.",
    saveError: "Không thể lưu tuỳ chỉnh quyền riêng tư.",
    retry: "Thử lại",

    consultingSharing: "Chia sẻ dữ liệu với chuyên gia tư vấn",
    shareFarmPlots: "Chia sẻ thửa ruộng",
    shareFarmPlotsDesc: "Cho phép chuyên gia xem thửa ruộng và khu vực của bạn.",
    sharePlants: "Chia sẻ cây trồng",
    sharePlantsDesc: "Cho phép chuyên gia xem cây trồng của bạn.",
    sharePlantEvents: "Chia sẻ sự kiện cây trồng",
    sharePlantEventsDesc: "Cho phép chuyên gia xem và tạo sự kiện cho cây trồng của bạn.",
    sharePlans: "Chia sẻ kế hoạch điều trị",
    sharePlansDesc: "Cho phép chuyên gia xem kế hoạch điều trị của bạn.",
  },

  notification: {
    title: "Thông báo",
    loadError: "Không thể tải tuỳ chỉnh thông báo.",
    saving: "Đang lưu...",
    saved: "Đã lưu tuỳ chỉnh thông báo.",
    saveError: "Không thể lưu tuỳ chỉnh thông báo.",
    retry: "Thử lại",

    groups: {
      messages: "Tin nhắn",
      friendActivity: "Hoạt động bạn bè",
      inApp: "Trong ứng dụng"
    },

    directMessage: "Tin nhắn trực tiếp",
    directMessageDesc: "Nhận thông báo khi có tin nhắn mới.",
    previewMessage: "Xem trước tin nhắn",
    previewMessageDesc: "Hiển thị nội dung tin nhắn trong thông báo.",
    groupMessage: "Tin nhắn nhóm",
    groupMessageDesc: "Nhận thông báo từ các nhóm.",

    newPost: "Bài viết mới",
    newPostDesc: "Thông báo khi bạn bè đăng bài mới.",

    inAppNotice: "Thông báo trong app",
    inAppNoticeDesc: "Hiển thị thông báo khi đang dùng ứng dụng.",
  },

  certificate: {
    title: "Chứng chỉ chuyên gia",
    noHistory: "Bạn chưa có hồ sơ xác minh nào",
    verifiedBadge: "Chuyên gia đã xác minh",
    pendingBadge: "Hồ sơ đang được xem xét",
    rejectedBadge: "Hồ sơ bị từ chối",
    submitButton: "Nộp hồ sơ xác minh",
    viewHistory: "Xem lịch sử hồ sơ",
  },

  consulting: {
    title: "Yêu cầu tư vấn",
    subtitle: "Quản lý yêu cầu tư vấn và yêu cầu truy cập dữ liệu.",
    loadError: "Không tải được dữ liệu. Vui lòng thử lại.",

    accept: "Chấp nhận",
    reject: "Từ chối",
    approve: "Duyệt",
    deny: "Từ chối",

    consultation: {
      title: "Yêu cầu tư vấn",
      empty: "Không có yêu cầu tư vấn nào.",
      emptyDesc: "Khi có yêu cầu tư vấn mới, chúng sẽ xuất hiện tại đây.",
    },

    dataAccess: {
      title: "Yêu cầu truy cập dữ liệu",
      empty: "Không có yêu cầu truy cập nào.",
      emptyDesc: "Khi chuyên gia yêu cầu truy cập dữ liệu trang trại, chúng sẽ xuất hiện tại đây.",
    },
  },
} as const;
