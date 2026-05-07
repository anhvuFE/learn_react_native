import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      // Nav
      "nav.dashboard": "Dashboard",
      "nav.tasks": "Missions",
      "nav.submissions": "Submissions",
      "nav.activity": "Activity",
      "nav.children": "Children",
      "nav.apps": "Restricted apps",
      "nav.shop": "Reward shop",
      "nav.pairing": "Pairing",
      "nav.settings": "Settings",
      "nav.signOut": "Sign out",
      "nav.parentDashboard": "Parent dashboard",
      // Common
      "common.loading": "Loading…",
      "common.cancel": "Cancel",
      "common.save": "Save",
      "common.delete": "Delete",
      "common.edit": "Edit",
      "common.add": "Add",
      "common.confirm": "Confirm",
      "common.saved": "Saved",
      "common.signIn": "Sign in",
      "common.createAccount": "Create account",
      "common.email": "Email",
      "common.password": "Password",
      "common.displayName": "Display name",
      "common.forgotPassword": "Forgot password?",
      "common.points": "points",
      "common.minutes": "min",
      // Dashboard
      "dashboard.title": "Overview",
      "dashboard.subtitle":
        "Quick view of your family's screen time activity",
      "dashboard.children": "Children",
      "dashboard.pendingReview": "Pending review",
      "dashboard.activeMissions": "Active missions",
      "dashboard.appsLocked": "Apps locked",
      "dashboard.review": "Review",
      "dashboard.waiting_one": "{{count}} submission waiting for your review",
      "dashboard.waiting_other": "{{count}} submissions waiting for your review",
      "dashboard.waitingHint":
        "Approve or reject before kids can earn rewards",
      "dashboard.noChildren": "No children paired yet",
      "dashboard.noChildrenHint":
        "Generate a pairing code to invite your child's device",
      "dashboard.generateCode": "Generate code",
      "dashboard.quickActions": "Quick actions",
      "dashboard.addMission": "Add mission",
      "dashboard.addMissionHint": "Create a custom task with rewards",
      "dashboard.manageApps": "Manage apps",
      "dashboard.manageAppsHint":
        "Choose which apps require earned time",
      "dashboard.pairDevice": "Pair a device",
      "dashboard.pairDeviceHint":
        "Generate a 6-char code for a child phone",
      // Settings
      "settings.title": "Settings",
      "settings.subtitle": "Profile and approval preferences",
      "settings.profile": "Profile",
      "settings.webPush": "Web push notifications",
      "settings.approvalDefaults": "Approval defaults",
      "settings.behavior": "Behavior",
      "settings.dangerZone": "Danger zone",
      "settings.deleteAccount": "Delete account",
      "settings.deleteAccountHint":
        "Permanently removes your account, your family, all paired children, tasks, submissions, and rewards. This cannot be undone.",
      "settings.deleteMyAccount": "Delete my account",
      "settings.language": "Language",
      "settings.languageHint": "Display language for this dashboard",
    },
  },
  vi: {
    translation: {
      // Nav
      "nav.dashboard": "Tổng quan",
      "nav.tasks": "Nhiệm vụ",
      "nav.submissions": "Bài nộp",
      "nav.activity": "Hoạt động",
      "nav.children": "Con cái",
      "nav.apps": "Ứng dụng bị khóa",
      "nav.shop": "Cửa hàng đổi thưởng",
      "nav.pairing": "Ghép thiết bị",
      "nav.settings": "Cài đặt",
      "nav.signOut": "Đăng xuất",
      "nav.parentDashboard": "Bảng điều khiển phụ huynh",
      // Common
      "common.loading": "Đang tải…",
      "common.cancel": "Hủy",
      "common.save": "Lưu",
      "common.delete": "Xóa",
      "common.edit": "Sửa",
      "common.add": "Thêm",
      "common.confirm": "Xác nhận",
      "common.saved": "Đã lưu",
      "common.signIn": "Đăng nhập",
      "common.createAccount": "Tạo tài khoản",
      "common.email": "Email",
      "common.password": "Mật khẩu",
      "common.displayName": "Tên hiển thị",
      "common.forgotPassword": "Quên mật khẩu?",
      "common.points": "điểm",
      "common.minutes": "phút",
      // Dashboard
      "dashboard.title": "Tổng quan",
      "dashboard.subtitle":
        "Xem nhanh hoạt động thời gian dùng máy của gia đình",
      "dashboard.children": "Con",
      "dashboard.pendingReview": "Chờ duyệt",
      "dashboard.activeMissions": "Nhiệm vụ đang mở",
      "dashboard.appsLocked": "App bị khóa",
      "dashboard.review": "Xem ngay",
      "dashboard.waiting_one": "{{count}} bài nộp đang chờ bạn duyệt",
      "dashboard.waiting_other": "{{count}} bài nộp đang chờ bạn duyệt",
      "dashboard.waitingHint":
        "Duyệt hoặc từ chối trước khi con nhận thưởng",
      "dashboard.noChildren": "Chưa ghép cặp với con nào",
      "dashboard.noChildrenHint":
        "Tạo mã ghép cặp để mời máy của con vào",
      "dashboard.generateCode": "Tạo mã",
      "dashboard.quickActions": "Thao tác nhanh",
      "dashboard.addMission": "Thêm nhiệm vụ",
      "dashboard.addMissionHint": "Tạo nhiệm vụ mới với thưởng tùy chỉnh",
      "dashboard.manageApps": "Quản lý app",
      "dashboard.manageAppsHint":
        "Chọn app nào cần dùng thời gian kiếm được mới mở",
      "dashboard.pairDevice": "Ghép thiết bị",
      "dashboard.pairDeviceHint":
        "Tạo mã 6 ký tự để gắn vào điện thoại của con",
      // Settings
      "settings.title": "Cài đặt",
      "settings.subtitle": "Hồ sơ và tùy chọn duyệt",
      "settings.profile": "Hồ sơ",
      "settings.webPush": "Thông báo trên trình duyệt",
      "settings.approvalDefaults": "Mặc định duyệt",
      "settings.behavior": "Hành vi",
      "settings.dangerZone": "Vùng nguy hiểm",
      "settings.deleteAccount": "Xóa tài khoản",
      "settings.deleteAccountHint":
        "Xóa vĩnh viễn tài khoản, gia đình, tất cả con đã ghép, nhiệm vụ, bài nộp và thưởng. Không thể hoàn tác.",
      "settings.deleteMyAccount": "Xóa tài khoản của tôi",
      "settings.language": "Ngôn ngữ",
      "settings.languageHint": "Ngôn ngữ hiển thị của dashboard này",
    },
  },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "vi"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "screenmindr-lang",
      caches: ["localStorage"],
    },
  });

export default i18n;
