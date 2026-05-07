import { useQuery } from "@apollo/client";
import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, ScrollView, Text, View } from "react-native";
import CountUp from "../components/CountUp";
import { Ionicons } from "../components/icons";
import { REWARD_META } from "../components/RewardPicker";
import { feRewardType, feTaskType } from "../lib/normalize";
import { MY_REWARDS_QUERY } from "../lib/queries";
import { colors, styles } from "../theme/styles";
import { RewardType } from "../types";

interface RewardRow {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  expiresAt?: string | null;
  taskId: string;
  task?: {
    id: string;
    type: string;
    title: string;
  } | null;
}

interface HistoryItem {
  id: string;
  reward: RewardType;
  amount: number;
  createdAt: string;
  taskTitle: string;
  taskType: "walk" | "video-quiz" | "photo";
}

const TASK_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  walk: "walk",
  "video-quiz": "school",
  photo: "camera",
};

const TASK_BG: Record<string, string> = {
  walk: colors.primarySoft,
  "video-quiz": colors.accentSoft,
  photo: colors.warningSoft,
};

const TASK_COLOR: Record<string, string> = {
  walk: colors.primary,
  "video-quiz": colors.accent,
  photo: colors.warning,
};

function formatTimeAgo(ts: number) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const FlameIcon: React.FC = () => {
  const flicker = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flicker]);
  const scale = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name="flame" size={28} color="#FBBF24" />
    </Animated.View>
  );
};

const HistoryRow = memo<{ item: HistoryItem; index: number }>(({
  item,
  index,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 7,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateX]);

  const m = REWARD_META[item.reward];
  const value =
    item.reward === "screen-time"
      ? `+${Math.round(item.amount)}m`
      : item.reward === "points"
        ? `+${Math.round(item.amount)}`
        : `+$${item.amount.toFixed(2)}`;

  return (
    <Animated.View
      style={[
        styles.historyRow,
        { opacity, transform: [{ translateX }] },
      ]}
    >
      <View
        style={[
          styles.historyIconWrap,
          { backgroundColor: TASK_BG[item.taskType] },
        ]}
      >
        <Ionicons
          name={TASK_ICON[item.taskType]}
          size={20}
          color={TASK_COLOR[item.taskType]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyTitle}>{item.taskTitle}</Text>
        <Text style={styles.historyMeta}>
          {formatTimeAgo(new Date(item.createdAt).getTime())}
        </Text>
      </View>
      <Text style={[styles.historyReward, { color: m.bg }]}>{value}</Text>
    </Animated.View>
  );
});
HistoryRow.displayName = "HistoryRow";

const ProgressScreen: React.FC = () => {
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

  // Real last-7-days bar chart, indexed by local day
  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const todayIdx = new Date().getDay();
  const orderedDayIndexes = Array.from({ length: 7 }, (_, i) => (todayIdx - 6 + i + 7) % 7);
  const dayBuckets: number[] = orderedDayIndexes.map(() => 0);
  const datesSet = new Set<string>();
  for (const h of history) {
    const d = new Date(h.createdAt);
    const ageDays = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (ageDays >= 0 && ageDays < 7) {
      const slot = 6 - ageDays;
      dayBuckets[slot]! += 1;
      datesSet.add(d.toDateString());
    }
  }
  const days = orderedDayIndexes.map((idx) => DAY_LABELS[idx]);
  const dayCounts = dayBuckets;
  const maxCount = Math.max(...dayCounts, 1);

  // Real streak: consecutive past days (incl. today) with at least one approved reward
  const datesWithReward = new Set(
    history.map((h) => new Date(h.createdAt).toDateString()),
  );
  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (datesWithReward.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroOpacity, heroScale]);

  return (
    <ScrollView
      style={styles.safeArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      scrollEventThrottle={16}
    >
      <View style={styles.brandRow}>
        <View style={styles.brandLogo}>
          <Ionicons name="stats-chart" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Progress</Text>
          <Text style={styles.brandSub}>Keep up the great work, Alex!</Text>
        </View>
        <FlameIcon />
      </View>

      <Animated.View
        style={[
          styles.tabHero,
          {
            backgroundColor: colors.accent,
            opacity: heroOpacity,
            transform: [{ scale: heroScale }],
          },
        ]}
      >
        <View
          style={[
            styles.heroGlow,
            { backgroundColor: "#FBBF24", top: -60, right: -30 },
          ]}
        />
        <View
          style={[
            styles.heroGlow,
            { backgroundColor: "#EC4899", bottom: -80, left: -50, opacity: 0.18 },
          ]}
        />
        <Text style={styles.tabHeroLabel}>Total missions</Text>
        <CountUp style={styles.tabHeroValue} value={history.length} />
        <Text style={styles.tabHeroSub}>
          {history.length === 0
            ? "Complete your first mission!"
            : `${streak}-day streak · ${totalScreenTime}m earned`}
        </Text>
      </Animated.View>

      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={22} color={colors.trophy} />
          <CountUp style={styles.statValue} value={history.length} />
          <Text style={styles.statLabel}>Missions</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={22} color={colors.danger} />
          <CountUp style={styles.statValue} value={streak} />
          <Text style={styles.statLabel}>Day streak</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={22} color={colors.screenTime} />
          <CountUp
            style={styles.statValue}
            value={totalScreenTime}
            format={(n) => `${Math.round(n)}m`}
          />
          <Text style={styles.statLabel}>Earned</Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 18,
          padding: 16,
          marginBottom: 22,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{ fontSize: 14, fontWeight: "700", color: colors.text }}
          >
            This week
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>
            {history.length} total
          </Text>
        </View>
        <View style={styles.chartRow}>
          {dayCounts.map((c, i) => {
            const height = `${(c / maxCount) * 100}%` as const;
            return (
              <View key={i} style={styles.chartBarWrap}>
                <View style={styles.chartBarTrack} />
                <Animated.View
                  style={[
                    styles.chartBar,
                    {
                      height,
                      backgroundColor:
                        i === days.length - 1 ? colors.primary : colors.accent,
                      opacity: c === 0 ? 0 : 1,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
        <View style={styles.chartLabels}>
          {days.map((d, i) => (
            <Text
              key={i}
              style={[
                styles.chartLabel,
                i === days.length - 1 && { color: colors.primary },
              ]}
            >
              {d}
            </Text>
          ))}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Recent missions</Text>

      {history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="rocket-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyText}>
            Complete your first mission to see it here.
          </Text>
        </View>
      ) : (
        history
          .slice()
          .reverse()
          .map((h, i) => <HistoryRow key={h.id} item={h} index={i} />)
      )}
    </ScrollView>
  );
};

export default memo(ProgressScreen);
