import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const STORAGE_KEY = "screenmindr-lang";

const resources = {
  en: {
    translation: {
      "menu.title": "Menu",
      "menu.profile": "Profile",
      "menu.editProfile": "Edit profile",
      "menu.familyMembers": "Family members",
      "menu.parentalControls": "Parental controls",
      "menu.notifications": "Notifications",
      "menu.restrictedApps": "Restricted apps",
      "menu.screenTime": "Screen time settings",
      "menu.about": "About ScreenMindr",
      "menu.signOut": "Sign out",
      "menu.deleteAccount": "Delete account",
      "menu.section.account": "Account",
      "menu.section.controls": "Controls",
      "menu.section.app": "App",
      "lock.greeting": "Good day",
      "lock.locked": "Locked",
      "lock.minutesAvailable_one": "{{count}} minute available",
      "lock.minutesAvailable_other": "{{count}} minutes available",
      "lock.tapMission": "Tap a mission below to unlock screen time",
      "lock.availableMissions": "Available missions",
      "lock.restrictedApps": "Restricted apps",
      "lock.noMissions": "No missions yet",
      "lock.noMissionsHint": "Ask your parent to add a mission",
      "shop.title": "Reward shop",
      "shop.youHave": "You have",
      "shop.empty": "Shop is empty",
      "shop.emptyHint": "Ask your parent to add reward items",
      "shop.notEnoughPoints": "Not enough points",
      "shop.redeemed": "Redeemed!",
      "shop.redeemedHint": "Your parent will fulfill it soon",
      "settings.language": "Language",
      "settings.languageHint": "Display language for the app",
    },
  },
  vi: {
    translation: {
      "menu.title": "Menu",
      "menu.profile": "Hồ sơ",
      "menu.editProfile": "Sửa hồ sơ",
      "menu.familyMembers": "Thành viên gia đình",
      "menu.parentalControls": "Kiểm soát phụ huynh",
      "menu.notifications": "Thông báo",
      "menu.restrictedApps": "Ứng dụng bị khóa",
      "menu.screenTime": "Cài đặt thời gian dùng máy",
      "menu.about": "Về ScreenMindr",
      "menu.signOut": "Đăng xuất",
      "menu.deleteAccount": "Xóa tài khoản",
      "menu.section.account": "Tài khoản",
      "menu.section.controls": "Kiểm soát",
      "menu.section.app": "Ứng dụng",
      "lock.greeting": "Xin chào",
      "lock.locked": "Đã khóa",
      "lock.minutesAvailable_one": "Còn {{count}} phút",
      "lock.minutesAvailable_other": "Còn {{count}} phút",
      "lock.tapMission": "Bấm vào nhiệm vụ bên dưới để mở khóa thời gian",
      "lock.availableMissions": "Nhiệm vụ hiện có",
      "lock.restrictedApps": "Ứng dụng bị khóa",
      "lock.noMissions": "Chưa có nhiệm vụ nào",
      "lock.noMissionsHint": "Nhờ bố mẹ thêm nhiệm vụ giúp bạn nhé",
      "shop.title": "Cửa hàng đổi thưởng",
      "shop.youHave": "Bạn đang có",
      "shop.empty": "Cửa hàng trống",
      "shop.emptyHint": "Nhờ bố mẹ thêm phần thưởng nhé",
      "shop.notEnoughPoints": "Không đủ điểm",
      "shop.redeemed": "Đã đổi!",
      "shop.redeemedHint": "Bố mẹ sẽ trao thưởng sớm",
      "settings.language": "Ngôn ngữ",
      "settings.languageHint": "Ngôn ngữ hiển thị trong app",
    },
  },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

void (async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && saved !== i18n.language) {
      await i18n.changeLanguage(saved);
    }
  } catch {}
})();

i18n.on("languageChanged", (lng) => {
  void AsyncStorage.setItem(STORAGE_KEY, lng).catch(() => {});
});

export default i18n;
