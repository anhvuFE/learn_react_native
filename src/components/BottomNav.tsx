import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "./icons";
import { colors, styles } from "../theme/styles";

type Tab = "home" | "progress" | "rewards" | "menu";

interface Props {
  active?: Tab;
  onChange?: (t: Tab) => void;
}

const TABS: {
  key: Tab;
  iconName: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
}[] = [
  { key: "home", iconName: "home-outline", iconActive: "home", label: "Home" },
  {
    key: "progress",
    iconName: "stats-chart-outline",
    iconActive: "stats-chart",
    label: "Progress",
  },
  {
    key: "rewards",
    iconName: "gift-outline",
    iconActive: "gift",
    label: "Rewards",
  },
  {
    key: "menu",
    iconName: "menu-outline",
    iconActive: "menu",
    label: "Menu",
  },
];

const BottomNav: React.FC<Props> = ({ active = "home", onChange }) => {
  return (
    <View style={styles.bottomNav}>
      {TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange?.(t.key)}
            style={({ pressed }) => [
              styles.navItem,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons
              name={isActive ? t.iconActive : t.iconName}
              size={22}
              color={isActive ? colors.primary : colors.navInactive}
            />
            <Text
              style={[styles.navLabel, isActive && styles.navLabelActive]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default BottomNav;
