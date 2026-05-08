import { useMutation, useQuery } from "@apollo/client";
import { Image } from "expo-image";
import React, {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import AppTile from "../components/AppTile";
import { Ionicons } from "../components/icons";
import { normalizeTask, type BeTask } from "../lib/normalize";
import {
  CREATE_TASK,
  ME_QUERY,
  RESTRICTED_APPS_QUERY,
  TASKS_QUERY,
} from "../lib/queries";
import { colors } from "../theme/styles";
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

const TASK_TYPE_META: Record<
  string,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bg: string;
    label: string;
  }
> = {
  walk: {
    icon: "walk",
    color: "#34C759",
    bg: "rgba(52, 199, 89, 0.12)",
    label: "Walk",
  },
  "video-quiz": {
    icon: "school",
    color: "#5856D6",
    bg: "rgba(88, 86, 214, 0.12)",
    label: "Quiz",
  },
  photo: {
    icon: "camera",
    color: "#FF9500",
    bg: "rgba(255, 149, 0, 0.12)",
    label: "Photo",
  },
};

const LockScreen: React.FC<Props> = ({ onTaskPress, parentRole }) => {
  const { data: meData } = useQuery<{
    me: { name?: string; email?: string; photoDownloadUrl?: string };
  }>(ME_QUERY, { fetchPolicy: "cache-first" });
  const displayName =
    meData?.me?.name?.split(" ")[0] ??
    meData?.me?.email?.split("@")[0] ??
    "there";
  const photoUrl = meData?.me?.photoDownloadUrl;

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
  const availableTasks = tasks.filter((t) => t.status === "available");

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
              rewards: { screenTimeMin: 30, points: 50, cashUsd: 0 },
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
              rewards: { screenTimeMin: 20, points: 30, cashUsd: 0 },
              videoTitle: "Staying Safe Online (2:14)",
              quizSecondsPerQuestion: 140,
              quiz: [
                {
                  question:
                    "What was the speaker wearing halfway through the video?",
                  options: [
                    "Blue hat",
                    "Funny green hat",
                    "Red cap",
                    "Black glasses",
                  ],
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
              rewards: { screenTimeMin: 25, points: 40, cashUsd: 0 },
            },
          },
        }),
      ]);
    } catch (e) {
      Alert.alert("Failed to seed", (e as Error).message);
    }
  };

  // Entrance animations
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(12)).current;
  const lockPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.spring(heroTranslate, {
        toValue: 0,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lockPulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(lockPulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [heroOpacity, heroTranslate, lockPulse]);

  const lockScale = lockPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F2F2F7" }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: 14,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "#5856D6",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            overflow: "hidden",
          }}
        >
          {photoUrl ? (
            <Image
              source={photoUrl}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              {displayName[0]?.toUpperCase() ?? "?"}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={iosCss.greetingTop}>HELLO</Text>
          <Text style={iosCss.greetingName}>{displayName}</Text>
        </View>
      </View>

      {/* Hero — Screen Time card */}
      <Animated.View
        style={{
          marginHorizontal: 18,
          marginBottom: 14,
          opacity: heroOpacity,
          transform: [{ translateY: heroTranslate }],
        }}
      >
        <View
          style={{
            borderRadius: 22,
            padding: 22,
            overflow: "hidden",
            backgroundColor: "#5856D6",
          }}
        >
          {/* Layered overlays simulate gradient depth without native module */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#5E5CE6",
              opacity: 0.4,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -60,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: "#FFFFFF",
              opacity: 0.1,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: -80,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: "#FFD60A",
              opacity: 0.18,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <Animated.View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: "rgba(255, 255, 255, 0.18)",
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: lockScale }],
              }}
            >
              <Ionicons name="hourglass" size={20} color="#fff" />
            </Animated.View>
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.8,
                marginLeft: 10,
              }}
            >
              SCREEN TIME
            </Text>
          </View>

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 56,
              fontWeight: "800",
              letterSpacing: -1.8,
              fontVariant: ["tabular-nums"],
              lineHeight: 60,
            }}
          >
            0
            <Text
              style={{
                fontSize: 22,
                fontWeight: "600",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: -0.4,
              }}
            >
              {" "}
              min
            </Text>
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 14,
              marginTop: 4,
              letterSpacing: -0.1,
            }}
          >
            Apps locked. Earn time by completing missions.
          </Text>

          <View
            style={{
              flexDirection: "row",
              marginTop: 18,
              gap: 10,
            }}
          >
            <HeroChip
              icon="rocket"
              label="Missions"
              value={`${availableTasks.length}`}
            />
            <HeroChip
              icon="lock-closed"
              label="Locked"
              value={`${restrictedApps.length}`}
            />
            <HeroChip
              icon="sparkles"
              label="Top reward"
              value={`${
                tasks.length
                  ? Math.max(...tasks.map((t) => t.rewards.screenTimeMin))
                  : 0
              }m`}
            />
          </View>
        </View>
      </Animated.View>

      {/* Restricted apps */}
      {restrictedApps.length > 0 && (
        <Section
          title="Will unlock"
          rightLabel={`${restrictedApps.length} app${
            restrictedApps.length === 1 ? "" : "s"
          }`}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 18, gap: 10 }}
          >
            {restrictedApps.map((app, i) => (
              <View key={app.id} style={{ alignItems: "center" }}>
                <AppTile id={app.appId} name={app.name} index={i} />
              </View>
            ))}
          </ScrollView>
        </Section>
      )}

      {/* Missions list */}
      <Section
        title="Missions"
        rightLabel={
          availableTasks.length > 0 ? `${availableTasks.length} ready` : undefined
        }
        rightLabelColor="#34C759"
      >
        {loading && tasks.length === 0 ? (
          <View
            style={{
              ...iosCss.groupedCard,
              alignItems: "center",
              paddingVertical: 32,
            }}
          >
            <ActivityIndicator color="#5856D6" />
          </View>
        ) : error ? (
          <View
            style={{
              ...iosCss.groupedCard,
              padding: 16,
            }}
          >
            <Text style={{ color: "#FF3B30", fontSize: 15, fontWeight: "600" }}>
              Couldn&apos;t load missions
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
              {error.message}
            </Text>
            <Pressable onPress={() => refetch()} style={{ marginTop: 8 }}>
              <Text
                style={{ color: "#5856D6", fontWeight: "600", fontSize: 14 }}
              >
                Tap to retry
              </Text>
            </Pressable>
          </View>
        ) : availableTasks.length === 0 ? (
          <View
            style={{
              ...iosCss.groupedCard,
              alignItems: "center",
              paddingVertical: 32,
              paddingHorizontal: 22,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: "rgba(88, 86, 214, 0.12)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="rocket-outline" size={26} color="#5856D6" />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.text,
                letterSpacing: -0.3,
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
                lineHeight: 18,
              }}
            >
              {parentRole
                ? "Seed 3 demo missions to test the flow"
                : "Ask your parent to add missions in the dashboard"}
            </Text>
            {parentRole && (
              <Pressable
                onPress={seedDemoTasks}
                disabled={seeding}
                style={({ pressed }) => [
                  {
                    backgroundColor: "#5856D6",
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 999,
                    flexDirection: "row",
                    alignItems: "center",
                    opacity: pressed ? 0.85 : seeding ? 0.6 : 1,
                  },
                ]}
              >
                {seeding ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="sparkles"
                      size={14}
                      color="#fff"
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
                    >
                      Seed demo missions
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        ) : (
          <View style={iosCss.groupedCard}>
            {availableTasks.map((task, i) => (
              <MissionRow
                key={task.id}
                task={task}
                isLast={i === availableTasks.length - 1}
                onPress={() => onTaskPress(task)}
              />
            ))}
          </View>
        )}
      </Section>

      <Text
        style={{
          fontSize: 12,
          color: colors.muted,
          textAlign: "center",
          paddingHorizontal: 22,
          marginTop: 18,
          lineHeight: 17,
        }}
      >
        Complete a mission to unlock blocked apps for a limited time.
      </Text>
    </ScrollView>
  );
};

const HeroChip: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: "rgba(255, 255, 255, 0.16)",
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 12,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Ionicons name={icon} size={11} color="rgba(255,255,255,0.8)" />
      <Text
        style={{
          fontSize: 9,
          fontWeight: "700",
          color: "rgba(255,255,255,0.7)",
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
    <Text
      style={{
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: -0.3,
        marginTop: 2,
        fontVariant: ["tabular-nums"],
      }}
    >
      {value}
    </Text>
  </View>
);

const Section: React.FC<{
  title: string;
  rightLabel?: string;
  rightLabelColor?: string;
  children: React.ReactNode;
}> = ({ title, rightLabel, rightLabelColor, children }) => (
  <View style={{ marginBottom: 18 }}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 22,
        marginBottom: 7,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: colors.muted,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
      {rightLabel ? (
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: rightLabelColor ?? colors.muted,
            letterSpacing: 0.2,
          }}
        >
          {rightLabel}
        </Text>
      ) : null}
    </View>
    {children}
  </View>
);

const MissionRow = memo<{
  task: Task;
  isLast: boolean;
  onPress: () => void;
}>(({ task, isLast, onPress }) => {
  const meta =
    TASK_TYPE_META[task.type] ?? {
      icon: "checkmark-done",
      color: "#8E8E93",
      bg: "rgba(142,142,147,0.12)",
      label: task.type,
    };
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: pressed ? "rgba(0,0,0,0.04)" : "transparent",
        },
        !isLast && {
          borderBottomWidth: 0.5,
          borderBottomColor: "rgba(60,60,67,0.18)",
        },
      ]}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: meta.bg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text
          style={{
            fontSize: 9,
            fontWeight: "700",
            color: meta.color,
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          {meta.label}
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
            letterSpacing: -0.3,
            marginTop: 1,
          }}
        >
          {task.title}
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginTop: 4,
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Ionicons name="time-outline" size={11} color="#34C759" />
            <Text style={iosCss.rewardChip}>{task.rewards.screenTimeMin}m</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Ionicons name="sparkles-outline" size={11} color="#FF9500" />
            <Text style={iosCss.rewardChip}>{task.rewards.points} pts</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
    </Pressable>
  );
});
MissionRow.displayName = "MissionRow";

const iosCss = {
  greetingTop: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.muted,
    letterSpacing: 0.6,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.text,
    letterSpacing: -0.4,
    marginTop: 1,
  },
  groupedCard: {
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden" as const,
  },
  rewardChip: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.muted,
    fontVariant: ["tabular-nums"] as ["tabular-nums"],
  },
};

export default memo(LockScreen);
