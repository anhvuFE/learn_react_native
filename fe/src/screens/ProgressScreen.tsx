import { useQuery } from "@apollo/client";
import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, ScrollView, Text, View } from "react-native";
import CountUp from "../components/CountUp";
import { Ionicons } from "../components/icons";
import { feRewardType, feTaskType } from "../lib/normalize";
import {
  FAMILY_ACTIVITY,
  ME_QUERY,
  MY_FAMILY_QUERY,
  MY_REWARDS_QUERY,
} from "../lib/queries";
import { colors } from "../theme/styles";
import { RewardType } from "../types";

interface RewardRow {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  expiresAt?: string | null;
  taskId: string;
  task?: { id: string; type: string; title: string } | null;
}

interface HistoryItem {
  id: string;
  reward: RewardType;
  amount: number;
  createdAt: string;
  taskTitle: string;
  taskType: "walk" | "video-quiz" | "photo";
}

const TASK_META: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  walk: { icon: "walk-outline", color: "#34C759", bg: "rgba(52,199,89,0.12)" },
  "video-quiz": {
    icon: "school-outline",
    color: "#5856D6",
    bg: "rgba(88,86,214,0.12)",
  },
  photo: {
    icon: "camera-outline",
    color: "#FF9500",
    bg: "rgba(255,149,0,0.12)",
  },
};

const REWARD_COLOR: Record<RewardType, string> = {
  "screen-time": "#34C759",
  points: "#FF9500",
  cash: "#34C759",
};

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ProgressScreen: React.FC = () => {
  const { data } = useQuery<{
    me: { uid: string; role: "PARENT" | "CHILD" };
  }>(ME_QUERY, { fetchPolicy: "cache-first" });
  if (data?.me?.role === "PARENT") return <ParentProgressView />;
  return <ChildProgressView />;
};

const ChildProgressView: React.FC = () => {
  const { data: meData } = useQuery<{ me: { name?: string; email?: string } }>(
    ME_QUERY,
    { fetchPolicy: "cache-first" },
  );
  const displayName =
    meData?.me?.name?.split(" ")[0] ??
    meData?.me?.email?.split("@")[0] ??
    "there";

  const { data: rewardsData } = useQuery<{ myRewards: RewardRow[] }>(
    MY_REWARDS_QUERY,
    { fetchPolicy: "cache-and-network", pollInterval: 60000 },
  );

  const history = useMemo<HistoryItem[]>(() => {
    return (rewardsData?.myRewards ?? []).map((r) => ({
      id: r.id,
      reward: feRewardType(r.type),
      amount: r.amount,
      createdAt: r.createdAt,
      taskTitle: r.task?.title ?? "Mission",
      taskType: r.task ? feTaskType(r.task.type) : "walk",
    }));
  }, [rewardsData?.myRewards]);

  const totalScreenTime = history
    .filter((h) => h.reward === "screen-time")
    .reduce((sum, h) => sum + h.amount, 0);
  const totalPoints = history
    .filter((h) => h.reward === "points")
    .reduce((sum, h) => sum + h.amount, 0);

  // Per-task-type breakdown of screen-time earned
  const minutesByTaskType: Record<HistoryItem["taskType"], number> = {
    walk: 0,
    "video-quiz": 0,
    photo: 0,
  };
  for (const h of history) {
    if (h.reward === "screen-time") {
      minutesByTaskType[h.taskType] += h.amount;
    }
  }
  const categoryTotal = Object.values(minutesByTaskType).reduce(
    (s, n) => s + n,
    0,
  );

  // 7-day buckets
  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const todayIdx = new Date().getDay();
  const orderedDayIndexes = Array.from(
    { length: 7 },
    (_, i) => (todayIdx - 6 + i + 7) % 7,
  );
  const dayBuckets: number[] = orderedDayIndexes.map(() => 0);
  for (const h of history) {
    const ageDays = Math.floor(
      (Date.now() - new Date(h.createdAt).getTime()) / 86400000,
    );
    if (ageDays >= 0 && ageDays < 7) {
      dayBuckets[6 - ageDays]! += 1;
    }
  }
  const maxCount = Math.max(...dayBuckets, 1);

  // Streak
  const dates = new Set(history.map((h) => new Date(h.createdAt).toDateString()));
  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (dates.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(12)).current;
  const flameAnim = useRef(new Animated.Value(0)).current;

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
        Animated.timing(flameAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [heroOpacity, heroTranslate, flameAnim]);
  const flameScale = flameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
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
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: 14,
        }}
      >
        <Text style={iosCss.greetingTop}>PROGRESS</Text>
        <Text style={iosCss.greetingName}>Keep going, {displayName}!</Text>
      </View>

      {/* Hero — total missions + streak */}
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
            backgroundColor: "#FF9500",
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#FF6B00",
              opacity: 0.35,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -50,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: "#FFD60A",
              opacity: 0.25,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: -70,
              left: -20,
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: "#FFFFFF",
              opacity: 0.1,
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
                transform: [{ scale: flameScale }],
              }}
            >
              <Ionicons name="flame" size={20} color="#FFFFFF" />
            </Animated.View>
            <Text
              style={{
                color: "rgba(255,255,255,0.78)",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.8,
                marginLeft: 10,
              }}
            >
              GREAT JOB, {displayName.toUpperCase()}
            </Text>
          </View>

          <CountUp
            style={{
              color: "#FFFFFF",
              fontSize: 56,
              fontWeight: "800",
              letterSpacing: -1.8,
              fontVariant: ["tabular-nums"],
              lineHeight: 60,
            }}
            value={history.length}
          />
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 14,
              marginTop: 4,
              letterSpacing: -0.1,
            }}
          >
            {history.length === 0
              ? "Complete your first mission to start a streak"
              : `${streak}-day streak · ${totalScreenTime}m earned`}
          </Text>

          {history.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                marginTop: 18,
                gap: 10,
              }}
            >
              <HeroChip
                icon="flame"
                label="Streak"
                value={`${streak}d`}
              />
              <HeroChip
                icon="time"
                label="Earned"
                value={`${Math.round(totalScreenTime)}m`}
              />
              <HeroChip
                icon="sparkles"
                label="Points"
                value={`${Math.round(totalPoints)}`}
              />
            </View>
          )}
        </View>
      </Animated.View>

      {/* Achievements — gamify child progress */}
      <Achievements
        missions={history.length}
        streak={streak}
        minutes={Math.round(totalScreenTime)}
      />

      {/* This week chart */}
      <Section title="This week" rightLabel={`${history.length} total`}>
        <View style={iosCss.groupedCard}>
          <View
            style={{
              padding: 18,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-between",
                height: 120,
              }}
            >
              {dayBuckets.map((c, i) => {
                const isToday = i === dayBuckets.length - 1;
                const ratio = c / maxCount;
                return (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "flex-end",
                      height: "100%",
                      paddingHorizontal: 4,
                    }}
                  >
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 8,
                        backgroundColor: "rgba(120,120,128,0.08)",
                        justifyContent: "flex-end",
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: "100%",
                          height: `${ratio * 100}%`,
                          backgroundColor: isToday
                            ? "#FF9500"
                            : "#5856D6",
                          opacity: c === 0 ? 0 : 1,
                          borderRadius: 8,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            <View
              style={{
                flexDirection: "row",
                marginTop: 8,
              }}
            >
              {orderedDayIndexes.map((dayIdx, i) => {
                const isToday = i === orderedDayIndexes.length - 1;
                return (
                  <View
                    key={i}
                    style={{ flex: 1, alignItems: "center" }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: isToday ? "700" : "600",
                        color: isToday ? "#FF9500" : colors.muted,
                        letterSpacing: 0.4,
                      }}
                    >
                      {DAY_LABELS[dayIdx]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Section>

      {/* Recent missions */}
      <Section title="Recent missions">
        {history.length === 0 ? (
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
              Ready for your first mission?
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.muted,
                textAlign: "center",
                marginTop: 6,
                lineHeight: 18,
              }}
            >
              Tap the Home tab below and pick a walk, quiz, or photo challenge
              to start earning ✨
            </Text>
          </View>
        ) : (
          <View style={iosCss.groupedCard}>
            {history
              .slice()
              .reverse()
              .slice(0, 12)
              .map((item, i, arr) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  isLast={i === arr.length - 1}
                  index={i}
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
          marginTop: 6,
          lineHeight: 17,
        }}
      >
        Last 30 days of approved missions.
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
        fontVariant: ["tabular-nums"] as ["tabular-nums"],
      }}
    >
      {value}
    </Text>
  </View>
);

const Section: React.FC<{
  title: string;
  rightLabel?: string;
  children: React.ReactNode;
}> = ({ title, rightLabel, children }) => (
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
            color: colors.muted,
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

const StatRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  isLast?: boolean;
}> = ({ icon, iconColor, iconBg, label, value }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
    }}
  >
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: iconBg,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
      }}
    >
      <Ionicons name={icon} size={17} color={iconColor} />
    </View>
    <Text
      style={{
        flex: 1,
        fontSize: 15,
        fontWeight: "500",
        color: colors.text,
        letterSpacing: -0.2,
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        fontSize: 15,
        fontWeight: "600",
        color: colors.text,
        fontVariant: ["tabular-nums"] as ["tabular-nums"],
      }}
    >
      {value}
    </Text>
  </View>
);

const Sep: React.FC = () => (
  <View
    style={{
      height: 0.5,
      backgroundColor: "rgba(60,60,67,0.18)",
      marginLeft: 58,
    }}
  />
);

const HistoryRow = memo<{
  item: HistoryItem;
  isLast: boolean;
  index: number;
}>(({ item, isLast, index }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 7,
        delay: index * 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateX]);

  const meta = TASK_META[item.taskType] ?? TASK_META.walk!;
  const value =
    item.reward === "screen-time"
      ? `+${Math.round(item.amount)}m`
      : item.reward === "points"
        ? `+${Math.round(item.amount)}`
        : `+$${item.amount.toFixed(2)}`;

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateX }],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: meta.bg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name={meta.icon} size={17} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "500",
              color: colors.text,
              letterSpacing: -0.2,
            }}
            numberOfLines={1}
          >
            {item.taskTitle}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.muted,
              marginTop: 1,
            }}
          >
            {timeAgo(new Date(item.createdAt).getTime())}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: REWARD_COLOR[item.reward],
            fontVariant: ["tabular-nums"] as ["tabular-nums"],
          }}
        >
          {value}
        </Text>
      </View>
      {!isLast && <Sep />}
    </Animated.View>
  );
});
HistoryRow.displayName = "HistoryRow";

interface Badge {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  color: string;
  bg: string;
  earned: boolean;
}

const Achievements: React.FC<{
  missions: number;
  streak: number;
  minutes: number;
}> = ({ missions, streak, minutes }) => {
  const badges: Badge[] = [
    {
      id: "first",
      icon: "rocket-outline",
      label: "First mission",
      desc: "Complete 1",
      color: "#5856D6",
      bg: "rgba(88,86,214,0.12)",
      earned: missions >= 1,
    },
    {
      id: "streak3",
      icon: "flame-outline",
      label: "On fire",
      desc: "3-day streak",
      color: "#FF3B30",
      bg: "rgba(255,59,48,0.12)",
      earned: streak >= 3,
    },
    {
      id: "streak7",
      icon: "trophy-outline",
      label: "Week strong",
      desc: "7-day streak",
      color: "#FF9500",
      bg: "rgba(255,149,0,0.12)",
      earned: streak >= 7,
    },
    {
      id: "ten",
      icon: "star-outline",
      label: "Ten times",
      desc: "10 missions",
      color: "#FFCC00",
      bg: "rgba(255,204,0,0.16)",
      earned: missions >= 10,
    },
    {
      id: "hundred",
      icon: "time-outline",
      label: "Two hours",
      desc: "100 min earned",
      color: "#34C759",
      bg: "rgba(52,199,89,0.12)",
      earned: minutes >= 100,
    },
  ];

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
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
          Achievements
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: "#FF9500",
            letterSpacing: 0.2,
          }}
        >
          {earnedCount} / {badges.length}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, gap: 10 }}
      >
        {badges.map((b) => (
          <View
            key={b.id}
            style={{
              width: 116,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 14,
              alignItems: "center",
              opacity: b.earned ? 1 : 0.55,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: b.earned ? b.bg : "rgba(120,120,128,0.1)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <Ionicons
                name={b.earned ? b.icon : "lock-closed"}
                size={22}
                color={b.earned ? b.color : "#8E8E93"}
              />
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: colors.text,
                letterSpacing: -0.1,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {b.label}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: colors.muted,
                marginTop: 2,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {b.desc}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

interface ActivityEvent {
  id: string;
  kind: string;
  occurredAt: string;
  childUid: string;
  taskId?: string;
  taskTitle?: string;
  taskType?: string;
  rewardType?: string;
  rewardAmount?: number;
}

interface ChildProfile {
  uid: string;
  name?: string;
  email?: string;
}

const ParentProgressView: React.FC = () => {
  const { data: famData } = useQuery<{
    myFamily: { children: ChildProfile[] };
  }>(MY_FAMILY_QUERY, { fetchPolicy: "cache-and-network" });

  const { data: actData } = useQuery<{ familyActivity: ActivityEvent[] }>(
    FAMILY_ACTIVITY,
    {
      variables: { limit: 200 },
      fetchPolicy: "cache-and-network",
      pollInterval: 60000,
    },
  );

  const children = famData?.myFamily?.children ?? [];
  const events = useMemo(
    () => actData?.familyActivity ?? [],
    [actData?.familyActivity],
  );

  // Aggregate stats
  const rewardEvents = events.filter((e) => e.kind === "reward_granted");
  const totalMissions = events.filter(
    (e) => e.kind === "approved" || e.kind === "reward_granted",
  ).length;
  const screenTimeRewards = rewardEvents.filter(
    (e) => e.rewardType === "screen-time",
  );
  const familyMinutesEarned = screenTimeRewards.reduce(
    (s, e) => s + (e.rewardAmount ?? 0),
    0,
  );
  const familyPoints = rewardEvents
    .filter((e) => e.rewardType === "points")
    .reduce((s, e) => s + (e.rewardAmount ?? 0), 0);

  // Family streak — consecutive days with at least one reward
  const dates = new Set(
    rewardEvents.map((e) => new Date(e.occurredAt).toDateString()),
  );
  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (dates.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }

  // 7-day buckets
  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const todayIdx = new Date().getDay();
  const orderedDayIndexes = Array.from(
    { length: 7 },
    (_, i) => (todayIdx - 6 + i + 7) % 7,
  );
  const dayBuckets: number[] = orderedDayIndexes.map(() => 0);
  for (const e of rewardEvents) {
    const ageDays = Math.floor(
      (Date.now() - new Date(e.occurredAt).getTime()) / 86400000,
    );
    if (ageDays >= 0 && ageDays < 7) dayBuckets[6 - ageDays]! += 1;
  }
  const maxCount = Math.max(...dayBuckets, 1);

  // Per-child breakdown
  const perChild = children.map((c) => {
    const cEvents = rewardEvents.filter((e) => e.childUid === c.uid);
    const minutes = cEvents
      .filter((e) => e.rewardType === "screen-time")
      .reduce((s, e) => s + (e.rewardAmount ?? 0), 0);
    const missions = cEvents.length;
    const cDates = new Set(
      cEvents.map((e) => new Date(e.occurredAt).toDateString()),
    );
    let cStreak = 0;
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (cDates.has(d.toDateString())) cStreak++;
      else if (i > 0) break;
    }
    return { ...c, minutes, missions, streak: cStreak };
  });

  // Recent events for feed (only approved/reward_granted)
  const recent = events
    .filter((e) => e.kind === "reward_granted" || e.kind === "approved")
    .slice(0, 10);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(12)).current;
  const flameAnim = useRef(new Animated.Value(0)).current;

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
        Animated.timing(flameAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [heroOpacity, heroTranslate, flameAnim]);
  const flameScale = flameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });

  const childNameById = new Map(
    children.map((c) => [c.uid, c.name ?? c.email?.split("@")[0] ?? "Child"]),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F2F2F7" }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14 }}
      >
        <Text style={iosCss.greetingTop}>FAMILY PROGRESS</Text>
        <Text style={iosCss.greetingName}>Everyone&apos;s doing great</Text>
      </View>

      {/* Hero — family aggregate */}
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
              top: -50,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: "#FFD60A",
              opacity: 0.18,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: -70,
              left: -20,
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: "#FFFFFF",
              opacity: 0.1,
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
                transform: [{ scale: flameScale }],
              }}
            >
              <Ionicons name="people" size={20} color="#FFFFFF" />
            </Animated.View>
            <Text
              style={{
                color: "rgba(255,255,255,0.78)",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.8,
                marginLeft: 10,
              }}
            >
              FAMILY MISSIONS
            </Text>
          </View>

          <CountUp
            style={{
              color: "#FFFFFF",
              fontSize: 56,
              fontWeight: "800",
              letterSpacing: -1.8,
              fontVariant: ["tabular-nums"],
              lineHeight: 60,
            }}
            value={totalMissions}
          />
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 14,
              marginTop: 4,
              letterSpacing: -0.1,
            }}
          >
            {totalMissions === 0
              ? "Kids haven't completed missions yet"
              : `${streak}-day family streak · ${Math.round(familyMinutesEarned)}m earned`}
          </Text>

          <View
            style={{
              flexDirection: "row",
              marginTop: 18,
              gap: 10,
            }}
          >
            <ParentHeroChip
              icon="people"
              label="Kids"
              value={`${children.length}`}
            />
            <ParentHeroChip
              icon="flame"
              label="Streak"
              value={`${streak}d`}
            />
            <ParentHeroChip
              icon="time"
              label="Earned"
              value={`${Math.round(familyMinutesEarned)}m`}
            />
          </View>
        </View>
      </Animated.View>

      {/* This week chart */}
      <Section title="This week" rightLabel={`${rewardEvents.length} rewards`}>
        <View style={iosCss.groupedCard}>
          <View style={{ padding: 18 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-between",
                height: 120,
              }}
            >
              {dayBuckets.map((c, i) => {
                const isToday = i === dayBuckets.length - 1;
                const ratio = c / maxCount;
                return (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "flex-end",
                      height: "100%",
                      paddingHorizontal: 4,
                    }}
                  >
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 8,
                        backgroundColor: "rgba(120,120,128,0.08)",
                        justifyContent: "flex-end",
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: "100%",
                          height: `${ratio * 100}%`,
                          backgroundColor: isToday ? "#FF9500" : "#5856D6",
                          opacity: c === 0 ? 0 : 1,
                          borderRadius: 8,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              {orderedDayIndexes.map((dayIdx, i) => {
                const isToday = i === orderedDayIndexes.length - 1;
                return (
                  <View key={i} style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: isToday ? "700" : "600",
                        color: isToday ? "#FF9500" : colors.muted,
                        letterSpacing: 0.4,
                      }}
                    >
                      {DAY_LABELS[dayIdx]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Section>

      {/* Per-child cards */}
      {perChild.length > 0 && (
        <Section
          title="Per child"
          rightLabel={`${perChild.length} ${perChild.length === 1 ? "kid" : "kids"}`}
        >
          <View style={iosCss.groupedCard}>
            {perChild.map((c, i) => (
              <View key={c.uid}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: ["#5856D6", "#34C759", "#FF9500"][i % 3],
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      {(c.name ?? c.email ?? "?")[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: colors.text,
                        letterSpacing: -0.2,
                      }}
                      numberOfLines={1}
                    >
                      {c.name ?? c.email?.split("@")[0] ?? "Child"}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        marginTop: 3,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Ionicons name="trophy-outline" size={11} color="#FF9500" />
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.muted,
                            fontVariant: ["tabular-nums"] as ["tabular-nums"],
                          }}
                        >
                          {c.missions}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Ionicons name="flame-outline" size={11} color="#FF3B30" />
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.muted,
                            fontVariant: ["tabular-nums"] as ["tabular-nums"],
                          }}
                        >
                          {c.streak}d
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Ionicons name="time-outline" size={11} color="#34C759" />
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.muted,
                            fontVariant: ["tabular-nums"] as ["tabular-nums"],
                          }}
                        >
                          {Math.round(c.minutes)}m
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                {i < perChild.length - 1 && <Sep />}
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Family totals */}
      <Section title="Family totals">
        <View style={iosCss.groupedCard}>
          <StatRow
            icon="trophy-outline"
            iconColor="#FF9500"
            iconBg="rgba(255,149,0,0.12)"
            label="Missions completed"
            value={`${totalMissions}`}
          />
          <Sep />
          <StatRow
            icon="flame-outline"
            iconColor="#FF3B30"
            iconBg="rgba(255,59,48,0.12)"
            label="Family streak"
            value={`${streak} day${streak === 1 ? "" : "s"}`}
          />
          <Sep />
          <StatRow
            icon="time-outline"
            iconColor="#34C759"
            iconBg="rgba(52,199,89,0.12)"
            label="Screen time earned"
            value={`${Math.round(familyMinutesEarned)} min`}
          />
          <Sep />
          <StatRow
            icon="sparkles-outline"
            iconColor="#FFCC00"
            iconBg="rgba(255,204,0,0.16)"
            label="Points earned"
            value={`${Math.round(familyPoints)}`}
            isLast
          />
        </View>
      </Section>

      {/* Recent across family */}
      <Section title="Recent across family">
        {recent.length === 0 ? (
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
              No activity yet
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.muted,
                textAlign: "center",
                marginTop: 6,
              }}
            >
              Once kids complete missions, you&apos;ll see them here
            </Text>
          </View>
        ) : (
          <View style={iosCss.groupedCard}>
            {recent.map((e, i) => {
              const childName = childNameById.get(e.childUid) ?? "Child";
              const meta = TASK_META[e.taskType ?? "walk"] ?? TASK_META.walk!;
              const isReward = e.kind === "reward_granted";
              return (
                <View key={e.id}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        backgroundColor: meta.bg,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name={meta.icon}
                        size={17}
                        color={meta.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.text,
                          letterSpacing: -0.2,
                        }}
                        numberOfLines={1}
                      >
                        <Text style={{ fontWeight: "700" }}>{childName}</Text>
                        <Text style={{ color: colors.muted }}>
                          {isReward ? " earned " : " completed "}
                        </Text>
                        {e.taskTitle ?? "a mission"}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.muted,
                          marginTop: 1,
                        }}
                      >
                        {timeAgoIso(e.occurredAt)}
                      </Text>
                    </View>
                    {isReward && e.rewardAmount !== undefined && (
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color:
                            e.rewardType === "screen-time"
                              ? "#34C759"
                              : "#FF9500",
                          fontVariant: ["tabular-nums"] as ["tabular-nums"],
                        }}
                      >
                        +{Math.round(e.rewardAmount)}
                        {e.rewardType === "screen-time" ? "m" : ""}
                      </Text>
                    )}
                  </View>
                  {i < recent.length - 1 && <Sep />}
                </View>
              );
            })}
          </View>
        )}
      </Section>

      <Text
        style={{
          fontSize: 12,
          color: colors.muted,
          textAlign: "center",
          paddingHorizontal: 22,
          marginTop: 6,
          lineHeight: 17,
        }}
      >
        Updates every minute.
      </Text>
    </ScrollView>
  );
};

const ParentHeroChip: React.FC<{
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
        fontVariant: ["tabular-nums"] as ["tabular-nums"],
      }}
    >
      {value}
    </Text>
  </View>
);

function timeAgoIso(iso: string): string {
  const ts = new Date(iso).getTime();
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

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
};

export default memo(ProgressScreen);
