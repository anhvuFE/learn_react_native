import React, { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "./icons";
import { colors, styles } from "../theme/styles";
import { Rewards, RewardType } from "../types";

interface Props {
  rewards: Rewards;
  selected: RewardType;
  onChange: (r: RewardType) => void;
}

export const REWARD_META: Record<
  RewardType,
  {
    bg: string;
    soft: string;
    label: string;
    iconLib: "ion" | "mci";
    iconName: string;
  }
> = {
  "screen-time": {
    bg: colors.screenTime,
    soft: colors.screenTimeSoft,
    label: "Screen",
    iconLib: "ion",
    iconName: "phone-portrait-outline",
  },
  points: {
    bg: colors.points,
    soft: colors.pointsSoft,
    label: "Points",
    iconLib: "ion",
    iconName: "star",
  },
  cash: {
    bg: colors.cash,
    soft: colors.cashSoft,
    label: "Cash",
    iconLib: "mci",
    iconName: "cash-multiple",
  },
};

// Cash reward is hidden in UI for MVP (no payout flow). BE schema still supports it.
export const REWARD_ORDER: RewardType[] = ["screen-time", "points"];

export const RewardIcon: React.FC<{
  reward: RewardType;
  size?: number;
  color?: string;
}> = ({ reward, size = 22, color = "#fff" }) => {
  const m = REWARD_META[reward];
  if (m.iconLib === "ion") {
    return <Ionicons name={m.iconName as any} size={size} color={color} />;
  }
  return (
    <MaterialCommunityIcons name={m.iconName as any} size={size} color={color} />
  );
};

const PickerItem: React.FC<{
  reward: RewardType;
  selected: boolean;
  onPress: () => void;
}> = ({ reward, selected, onPress }) => {
  const scale = useRef(new Animated.Value(selected ? 1.04 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.04 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [selected, scale]);

  const m = REWARD_META[reward];

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        style={[
          styles.rewardPick,
          {
            borderColor: selected ? m.bg : colors.border,
            backgroundColor: selected ? m.soft : colors.surface,
          },
        ]}
      >
        <View style={[styles.rewardPickIconWrap, { backgroundColor: m.bg }]}>
          <RewardIcon reward={reward} size={20} color="#fff" />
        </View>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: selected ? m.bg : colors.muted,
            letterSpacing: 0.5,
          }}
        >
          {m.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const RewardPicker: React.FC<Props> = ({ selected, onChange }) => {
  return (
    <View style={styles.rewardPickerRow}>
      {REWARD_ORDER.map((key) => (
        <PickerItem
          key={key}
          reward={key}
          selected={selected === key}
          onPress={() => onChange(key)}
        />
      ))}
    </View>
  );
};

export default RewardPicker;
