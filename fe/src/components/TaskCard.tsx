import React, { memo, useCallback, useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "./icons";
import { colors, styles } from "../theme/styles";
import { Task } from "../types";

interface Props {
  task: Task;
  index: number;
  onSelect: (task: Task) => void;
}

const TYPE_META: Record<
  Task["type"],
  { iconName: keyof typeof Ionicons.glyphMap; bg: string; color: string }
> = {
  "video-quiz": {
    iconName: "school",
    bg: colors.accentSoft,
    color: colors.accent,
  },
  photo: {
    iconName: "camera",
    bg: colors.warningSoft,
    color: colors.warning,
  },
  walk: {
    iconName: "walk",
    bg: colors.primarySoft,
    color: colors.primary,
  },
};

const TaskCard: React.FC<Props> = ({ task, index, onSelect }) => {
  const type = TYPE_META[task.type];

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  const handlePressIn = useCallback(() => {
    Animated.spring(press, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  }, [press]);

  const handlePressOut = useCallback(() => {
    Animated.spring(press, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [press]);

  const handlePress = useCallback(() => {
    onSelect(task);
  }, [onSelect, task]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }, { scale: press }],
      }}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.taskCard}
      >
        <View style={styles.taskHeaderRow}>
          <View style={[styles.taskTypeBadge, { backgroundColor: type.bg }]}>
            <Ionicons name={type.iconName} size={28} color={type.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {task.title}
            </Text>
            <Text style={styles.taskDesc} numberOfLines={1}>
              {task.description}
            </Text>
          </View>
          <View style={styles.taskFab}>
            <Ionicons
              name="play"
              size={18}
              color="#fff"
              style={{ marginLeft: 2 }}
            />
          </View>
        </View>

        <View style={styles.taskDividerThin} />

        <View style={styles.miniRewardRow}>
          <View
            style={[
              styles.miniRewardPill,
              { backgroundColor: colors.screenTimeSoft },
            ]}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={12}
              color={colors.screenTime}
            />
            <Text
              style={[
                styles.miniRewardPillText,
                { color: colors.screenTime },
              ]}
            >
              +{task.rewards.screenTimeMin}m
            </Text>
          </View>
          <View
            style={[
              styles.miniRewardPill,
              { backgroundColor: colors.pointsSoft },
            ]}
          >
            <Ionicons name="star-outline" size={12} color={colors.points} />
            <Text
              style={[styles.miniRewardPillText, { color: colors.points }]}
            >
              +{task.rewards.points}
            </Text>
          </View>
          <View
            style={[
              styles.miniRewardPill,
              { backgroundColor: colors.cashSoft },
            ]}
          >
            <MaterialCommunityIcons
              name="cash-multiple"
              size={12}
              color={colors.cash}
            />
            <Text style={[styles.miniRewardPillText, { color: colors.cash }]}>
              +${task.rewards.cashUsd.toFixed(2)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default memo(TaskCard);
