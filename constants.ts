import { Platform, StatusBar, UIManager } from "react-native";
import type { Todo } from "./types";

export const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 0;

export const SPRING = { friction: 6, tension: 80, useNativeDriver: true };

export const INITIAL_TODOS: Todo[] = [
  { id: "1", title: "Học React Native với Xuan Anh", done: true },
  { id: "2", title: "Build Todo app thật flex", done: false },
  { id: "3", title: "Push code lên GitHub", done: true },
  { id: "4", title: "Uống cà phê và code tiếp", done: false },
];

export function enableLayoutAnimationOnAndroid() {
  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
