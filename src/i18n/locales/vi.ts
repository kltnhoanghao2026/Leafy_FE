/**
 * Vietnamese locale — source of truth for all i18n keys.
 * Add keys here first; the English locale is type-checked against this shape.
 */
import { settingsVi } from "../../features/settings/locales/vi";

export const vi = {
  common: {
    loading: "Đang tải...",
    saving: "Đang lưu...",
    retry: "Thử lại",
    error: "Đã xảy ra lỗi",
    success: "Thành công",
    cancel: "Hủy",
    confirm: "Xác nhận",
    close: "Đóng",
    viewAll: "Xem tất cả",
    noData: "Không có dữ liệu",
    back: "Quay lại",
    save: "Lưu",
    edit: "Chỉnh sửa",
    delete: "Xóa",
    search: "Tìm kiếm",
    unknown: "Không xác định",
  },

  auth: {
    login: "Đăng nhập",
    register: "Đăng ký",
    logout: "Đăng xuất",
    verifyEmail: "Xác thực email",
    email: "Email",
    password: "Mật khẩu",
    phoneNumber: "Số điện thoại",
    forgotPassword: "Quên mật khẩu?",
    alreadyHaveAccount: "Đã có tài khoản?",
    dontHaveAccount: "Chưa có tài khoản?",
  },

  nav: {
    dashboard: "Tổng quan",
    community: "Cộng đồng",
    search: "Tìm kiếm",
    chat: "Tin nhắn",
    profile: "Hồ sơ",
    settings: "Cài đặt",
    experts: "Chuyên gia",
    alerts: "Cảnh báo",
    plants: "Cây trồng",
    devices: "Thiết bị",
    admin: "Quản trị",
    home: "Trang chủ",
    diseaseSearch: "Tra cứu bệnh",
    diseasePrediction: "Chẩn đoán hình ảnh",
    monitor: "Theo dõi",
    alertRules: "Quy tắc",
    agricultureOverview: "Tổng quan",
    plans: "Kế hoạch",
    plantEventsCalendar: "Lịch chăm sóc",
    diseaseDiagnosis: "Chẩn đoán",
    ragPanel: "Trợ lý ảo AI",
    sectionAgriculture: "Nông nghiệp thông minh",
    sectionOther: "Khác",
    systemMonitor: "Hệ thống giám sát",
    loadingUser: "Đang tải...",
  },

  pageLoader: {
    loading: "Đang tải trang...",
  },

  settings: settingsVi,

  chat: {
    emptyStateTitle: "Leafy Chat",
    emptyStateDescription:
      "Chọn một cuộc trò chuyện từ danh sách hoặc bắt đầu một cuộc trò chuyện mới để kết nối.",
    revokedMessage: "Tin nhắn đã bị thu hồi",
    deletedByAdmin: "Tin nhắn đã bị xóa bởi quản trị viên",
    disbandedBanner: "🔒 Nhóm này đã bị giải tán và không thể gửi tin nhắn mới.",
    disbandedSubtitle: "🔒 Nhóm đã giải tán",
    memberCount: (count: number) => `${count} thành viên`,
    dmSubtitle: "Nhắn tin",
    groupInfo: "Thông tin nhóm",
    conversationInfo: "Thông tin hội thoại",
    inputPlaceholder: "Nhập tin nhắn…",
    disbandedPlaceholder: "Nhóm đã giải tán",
    sendFile: "Đính kèm tệp",
    sendImage: "Gửi ảnh / video",
    edited: "đã sửa",
    unknownUser: "Người dùng",
    attachment: "[Đính kèm]",
    noConversation: "Chưa có cuộc trò chuyện nào",
    newConversation: "Cuộc trò chuyện mới",
    searchConversations: "Tìm cuộc trò chuyện...",
  },

  community: {
    feed: "Bảng tin",
    createPost: "Bạn đang nghĩ gì?",
    noPostsYet: "Chưa có bài đăng nào.",
    suggestedExperts: "Chuyên gia đề xuất",
    comment: "Bình luận",
    like: "Thích",
    share: "Chia sẻ",
    viewAllComments: "Xem tất cả bình luận",
  },

  profile: {
    myProfile: "Hồ sơ của tôi",
    editProfile: "Chỉnh sửa hồ sơ",
    followers: "Người theo dõi",
    following: "Đang theo dõi",
    posts: "Bài đăng",
    follow: "Theo dõi",
    unfollow: "Bỏ theo dõi",
    verified: "Đã xác minh",
    role: {
      FARMER: "Nông dân",
      EXPERT: "Chuyên gia",
    },
  },
} as const;
