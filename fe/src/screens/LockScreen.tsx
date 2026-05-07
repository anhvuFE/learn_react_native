import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import AppTile from "../components/AppTile";
import { Ionicons } from "../components/icons";
import TaskCard from "../components/TaskCard";
import { restrictedApps } from "../data/mockData";
import { colors, styles } from "../theme/styles";
import { Task } from "../types";

interface Props {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
}

const MiniStatCard = memo<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
  index: number;
}>(({ icon, iconColor, iconBg, value, label, index }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay: 200 + index * 70,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 7,
        delay: 200 + index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateX]);

  return (
    <Animated.View
      style={[
        styles.miniStatCard,
        { opacity, transform: [{ translateX }] },
      ]}
    >
      <View style={[styles.miniStatIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </Animated.View>
  );
});
MiniStatCard.displayName = "MiniStatCard";

const LockScreen: React.FC<Props> = ({ tasks, onTaskPress }) => {
  const [expanded, setExpanded] = useState(false);

  const greetOpacity = useRef(new Animated.Value(0)).current;
  const statusOpacity = useRef(new Animated.Value(0)).current;
  const statusTranslate = useRef(new Animated.Value(8)).current;
  const lockPulse = useRef(new Animated.Value(0)).current;
  const lockGlow = useRef(new Animated.Value(0)).current;
  const chevronRot = useRef(new Animated.Value(0)).current;

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 280,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
    setExpanded((v) => {
      const next = !v;
      Animated.timing(chevronRot, {
        toValue: next ? 1 : 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
      return next;
    });
  }, [chevronRot]);

  const chevronDeg = chevronRot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  useEffect(() => {
    Animated.timing(greetOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
    Animated.parallel([
      Animated.timing(statusOpacity, {
        toValue: 1,
        duration: 320,
        delay: 80,
        useNativeDriver: true,
      }),
      Animated.spring(statusTranslate, {
        toValue: 0,
        friction: 7,
        delay: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lockPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(lockPulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lockGlow, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(lockGlow, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    glowLoop.start();

    return () => {
      pulseLoop.stop();
      glowLoop.stop();
    };
  }, [greetOpacity, statusOpacity, statusTranslate, lockPulse, lockGlow]);

  const lockScale = lockPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const glowScale = lockGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.6],
  });
  const glowOpacity = lockGlow.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.5, 0.3, 0],
  });

  const availableCount = tasks.filter((t) => t.status === "available").length;
  const maxReward = Math.max(...tasks.map((t) => t.rewards.cashUsd));

  return (
    <ScrollView
      style={styles.safeArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      scrollEventThrottle={16}
    >
      <Animated.View style={[styles.greetingRow, { opacity: greetOpacity }]}>
        <View style={styles.greetingAvatar}>
          <Text style={styles.greetingAvatarText}>A</Text>
          <View style={styles.greetingDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingHi}>Good day</Text>
          <Text style={styles.greetingName}>Hi, Alex 👋</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={colors.text}
          />
        </Pressable>
      </Animated.View>

      <Animated.View
        style={{
          opacity: statusOpacity,
          transform: [{ translateY: statusTranslate }],
        }}
      >
        <Pressable
          onPress={toggleExpanded}
          style={({ pressed }) => [
            styles.statusBar,
            { flexDirection: "column", alignItems: "stretch" },
            pressed && { opacity: 0.92 },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.statusBarIconWrap}>
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "#FBBF24",
                  opacity: glowOpacity,
                  transform: [{ scale: glowScale }],
                }}
              />
              <Animated.View style={{ transform: [{ scale: lockScale }] }}>
                <Ionicons name="lock-closed" size={22} color="#FBBF24" />
              </Animated.View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusBarLabel}>● Locked</Text>
              <Text style={styles.statusBarText}>0 minutes available</Text>
            </View>
            <View style={styles.statusBarChevron}>
              <Animated.View style={{ transform: [{ rotate: chevronDeg }] }}>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color="rgba(255,255,255,0.7)"
                />
              </Animated.View>
            </View>
          </View>

          {expanded && (
            <View style={styles.statusBarExpanded}>
              <View style={styles.statusDetailRow}>
                <View style={styles.statusDetailIcon}>
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color="rgba(255,255,255,0.7)"
                  />
                </View>
                <Text style={styles.statusDetailLabel}>Today's missions</Text>
                <Text style={styles.statusDetailValue}>
                  0 / {tasks.length}
                </Text>
              </View>
              <View style={styles.statusDetailRow}>
                <View style={styles.statusDetailIcon}>
                  <Ionicons
                    name="flame"
                    size={14}
                    color="rgba(255,255,255,0.7)"
                  />
                </View>
                <Text style={styles.statusDetailLabel}>Current streak</Text>
                <Text style={styles.statusDetailValue}>0 days</Text>
              </View>
              <View style={styles.statusDetailRow}>
                <View style={styles.statusDetailIcon}>
                  <Ionicons
                    name="time"
                    size={14}
                    color="rgba(255,255,255,0.7)"
                  />
                </View>
                <Text style={styles.statusDetailLabel}>Last reward</Text>
                <Text style={styles.statusDetailValue}>Never</Text>
              </View>
              <View style={styles.statusDetailRow}>
                <View style={styles.statusDetailIcon}>
                  <Ionicons
                    name="lock-closed"
                    size={14}
                    color="rgba(255,255,255,0.7)"
                  />
                </View>
                <Text style={styles.statusDetailLabel}>Apps locked</Text>
                <Text style={styles.statusDetailValue}>
                  {restrictedApps.length}
                </Text>
              </View>
              <Text style={styles.statusTip}>
                Tap a mission below to unlock screen time
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hScrollContent}
        style={styles.hScroll}
        decelerationRate="fast"
        snapToInterval={116}
        snapToAlignment="start"
      >
        <MiniStatCard
          index={0}
          icon="rocket"
          iconColor={colors.primary}
          iconBg={colors.primarySoft}
          value={`${availableCount}`}
          label="Missions ready"
        />
        <MiniStatCard
          index={1}
          icon="cash-outline"
          iconColor={colors.cash}
          iconBg={colors.cashSoft}
          value={`$${maxReward.toFixed(2)}`}
          label="Max reward"
        />
        <MiniStatCard
          index={2}
          icon="lock-closed"
          iconColor={colors.muted}
          iconBg={colors.surfaceAlt}
          value={`${restrictedApps.length}`}
          label="Apps locked"
        />
        <MiniStatCard
          index={3}
          icon="time-outline"
          iconColor={colors.screenTime}
          iconBg={colors.screenTimeSoft}
          value="0m"
          label="Earned today"
        />
      </ScrollView>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>Restricted apps</Text>
        <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "700" }}>
          {restrictedApps.length} locked
        </Text>
      </View>
      <View style={styles.appsGrid}>
        {restrictedApps.map((app, i) => (
          <AppTile key={app.id} id={app.id} name={app.name} index={i} />
        ))}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>Available missions</Text>
        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "800" }}>
          {availableCount} ready
        </Text>
      </View>
      {tasks.map((task, i) => (
        <TaskCard
          key={task.id}
          task={task}
          index={i}
          onSelect={onTaskPress}
        />
      ))}

      <Text style={styles.footerNote}>
        * Cash rewards require parent approval and payout setup.
      </Text>
    </ScrollView>
  );
};

export default LockScreen;
