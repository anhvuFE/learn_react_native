import { useMutation, useQuery } from "@apollo/client";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { normalizeTask, type BeTask } from "../lib/normalize";
import {
  CREATE_TASK,
  ME_QUERY,
  RESTRICTED_APPS_QUERY,
  TASKS_QUERY,
} from "../lib/queries";
import { colors, styles } from "../theme/styles";
import { Task } from "../types";

interface BeRestrictedApp {
  id: string;
  appId: string;
  name: string;
  packageName?: string | null;
}

interface Props {
  onTaskPress: (task: Task) => void;
  parentRole?: boolean;
}

const MiniStatCard = memo<{
  icon: keyof typeof Ionicons.glyphMap;
  bgColor: string;
  glowColor?: string;
  value: string;
  label: string;
  index: number;
}>(({ icon, bgColor, glowColor, value, label, index }) => {
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
        {
          backgroundColor: bgColor,
          opacity,
          transform: [{ translateX }],
        },
      ]}
    >
      {glowColor && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: glowColor,
            opacity: 0.35,
          }}
        />
      )}
      <View style={styles.miniStatTopRow}>
        <Text style={styles.miniStatLabelInline} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name={icon} size={16} color="rgba(255,255,255,0.95)" />
      </View>
      <View>
        <Text style={styles.miniStatValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </Animated.View>
  );
});
MiniStatCard.displayName = "MiniStatCard";

const LockScreen: React.FC<Props> = ({ onTaskPress, parentRole }) => {
  const { data: meData } = useQuery<{
    me: { name?: string; email?: string };
  }>(ME_QUERY, { fetchPolicy: "cache-first" });
  const displayName =
    meData?.me?.name?.split(" ")[0] ??
    meData?.me?.email?.split("@")[0] ??
    "there";

  const { data, loading, error, refetch } = useQuery<{ tasks: BeTask[] }>(
    TASKS_QUERY,
    { fetchPolicy: "cache-and-network", pollInterval: 30000 },
  );
  const { data: appsData } = useQuery<{ restrictedApps: BeRestrictedApp[] }>(
    RESTRICTED_APPS_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const restrictedApps = useMemo(
    () => appsData?.restrictedApps ?? [],
    [appsData?.restrictedApps],
  );
  const tasks = useMemo<Task[]>(
    () => (data?.tasks ?? []).map(normalizeTask),
    [data?.tasks],
  );

  const [createTask, { loading: seeding }] = useMutation(CREATE_TASK, {
    refetchQueries: [{ query: TASKS_QUERY }],
  });

  const seedDemoTasks = async () => {
    try {
      await Promise.all([
        createTask({
          variables: {
            input: {
              type: "WALK",
              title: "Walk Adventure",
              description: "Walk 20 steps to complete the mission",
              rewards: { screenTimeMin: 30, points: 50, cashUsd: 1.0 },
              walkTargetSeconds: 60,
              walkTargetSteps: 20,
            },
          },
        }),
        createTask({
          variables: {
            input: {
              type: "VIDEO_QUIZ",
              title: "Quiz Challenge",
              description: "Answer 3 questions about what you watched",
              rewards: { screenTimeMin: 20, points: 30, cashUsd: 0.75 },
              videoTitle: "Staying Safe Online (2:14)",
              quizSecondsPerQuestion: 140,
              quiz: [
                {
                  question:
                    "What was the speaker wearing halfway through the video?",
                  options: ["Blue hat", "Funny green hat", "Red cap", "Black glasses"],
                  correctIndex: 1,
                },
                {
                  question: "Where did the video take place?",
                  options: [
                    "At the beach",
                    "In a classroom",
                    "In a restaurant",
                    "At the park",
                  ],
                  correctIndex: 1,
                },
                {
                  question: "What was the main topic of the video?",
                  options: ["Space", "Recycling", "Dinosaurs", "Cooking"],
                  correctIndex: 1,
                },
              ],
            },
          },
        }),
        createTask({
          variables: {
            input: {
              type: "PHOTO",
              title: "Room Reset",
              description: "Take a photo of your clean room",
              rewards: { screenTimeMin: 25, points: 40, cashUsd: 1.25 },
            },
          },
        }),
      ]);
    } catch (e) {
      Alert.alert("Failed to seed", (e as Error).message);
    }
  };

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
  const maxReward = tasks.length
    ? Math.max(...tasks.map((t) => t.rewards.cashUsd))
    : 0;

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
          <Text style={styles.greetingAvatarText}>
            {displayName[0]?.toUpperCase() ?? "?"}
          </Text>
          <View style={styles.greetingDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingHi}>Good day</Text>
          <Text style={styles.greetingName}>Hi, {displayName} 👋</Text>
        </View>
        <Pressable
          onPress={() =>
            Alert.alert(
              "Notifications",
              "FCM push notifications launch in the next milestone — backend FCM module is ready.",
            )
          }
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
        snapToInterval={108}
        snapToAlignment="start"
      >
        <MiniStatCard
          index={0}
          icon="rocket"
          bgColor={colors.primary}
          glowColor="#86EFAC"
          value={`${availableCount}`}
          label="Missions"
        />
        <MiniStatCard
          index={1}
          icon="cash"
          bgColor={colors.cash}
          glowColor="#FBBF24"
          value={`$${maxReward.toFixed(2)}`}
          label="Max reward"
        />
        <MiniStatCard
          index={2}
          icon="lock-closed"
          bgColor="#0F172A"
          glowColor="#7C3AED"
          value={`${restrictedApps.length}`}
          label="Locked"
        />
        <MiniStatCard
          index={3}
          icon="time"
          bgColor={colors.screenTime}
          glowColor="#FBBF24"
          value="0m"
          label="Earned"
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
          <AppTile key={app.id} id={app.appId} name={app.name} index={i} />
        ))}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>Available missions</Text>
        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "800" }}>
          {availableCount} ready
        </Text>
      </View>

      {loading && tasks.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View
          style={{
            backgroundColor: colors.dangerSoft,
            padding: 14,
            borderRadius: 14,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: colors.danger, fontWeight: "700" }}>
            Couldn't load tasks
          </Text>
          <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>
            {error.message}
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={{ marginTop: 8 }}
          >
            <Text style={{ color: colors.danger, fontWeight: "700" }}>
              Tap to retry
            </Text>
          </Pressable>
        </View>
      ) : tasks.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            padding: 22,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="rocket-outline" size={40} color={colors.muted} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.text,
              marginTop: 10,
            }}
          >
            No missions yet
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.muted,
              textAlign: "center",
              marginTop: 6,
              marginBottom: 14,
            }}
          >
            {parentRole
              ? "Seed 3 demo missions to test the flow"
              : "Ask your parent to add a mission"}
          </Text>
          {parentRole && (
            <Pressable
              onPress={seedDemoTasks}
              disabled={seeding}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                seeding && { opacity: 0.6 },
              ]}
            >
              {seeding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="sparkles"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryButtonText}>
                    Seed demo missions
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      ) : (
        tasks.map((task, i) => (
          <TaskCard
            key={task.id}
            task={task}
            index={i}
            onSelect={onTaskPress}
          />
        ))
      )}

      <Text style={styles.footerNote}>
        * Cash rewards require parent approval and payout setup.
      </Text>
    </ScrollView>
  );
};

export default LockScreen;
