import { Platform, requireNativeModule } from "expo-modules-core";

interface ScreenShieldModuleType {
  /** Request authorization for Family Controls. Resolves true if granted. */
  requestAuthorization(): Promise<boolean>;

  /** Whether authorization has been granted. */
  isAuthorized(): Promise<boolean>;

  /** Show the FamilyActivitySelection picker so parent picks apps. Resolves count of selected apps. */
  presentPicker(): Promise<number>;

  /** Apply shield using the previously-picked selection. */
  shieldNow(): Promise<void>;

  /** Clear shield for `minutes` minutes. After expiry, call shieldNow() to re-apply. */
  unshieldFor(minutes: number): Promise<void>;

  /** Clear shield permanently (until next shieldNow). */
  clearShield(): Promise<void>;

  /** Returns ISO timestamp of when current unshield window ends, or null. */
  getUnshieldEndsAt(): Promise<string | null>;

  /** Whether shield is currently active (apps blocked). */
  isShielded(): Promise<boolean>;

  /** Number of apps currently in the selection (0 if none picked). */
  selectedAppsCount(): Promise<number>;
}

const Stub: ScreenShieldModuleType = {
  requestAuthorization: async () => false,
  isAuthorized: async () => false,
  presentPicker: async () => 0,
  shieldNow: async () => {},
  unshieldFor: async () => {},
  clearShield: async () => {},
  getUnshieldEndsAt: async () => null,
  isShielded: async () => false,
  selectedAppsCount: async () => 0,
};

let nativeModule: ScreenShieldModuleType;

if (Platform.OS === "ios") {
  try {
    nativeModule = requireNativeModule("ScreenShieldModule");
  } catch {
    nativeModule = Stub;
  }
} else {
  nativeModule = Stub;
}

export default nativeModule;
export const isAvailable = Platform.OS === "ios";
