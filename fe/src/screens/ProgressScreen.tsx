import React, { memo, useEffect, useRef } from "react";
import { Animated, ScrollView, Text, View } from "react-native";
import CountUp from "../components/CountUp";
import { Ionicons } from "../components/icons";
import { REWARD_META } from "../components/RewardPicker";
import { colors, styles } from "../theme/styles";
import { CompletedMission } from "../types";

interface Props {
  history: CompletedMission[];
  pointsBank: number;
  cashBank: number;
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

const HistoryRow = memo<{ mission: CompletedMission; index: number }>(({
  mission,
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

  const m = REWARD_META[mission.reward];
  const value =
    mission.reward === "screen-time"
      ? `+${mission.task.rewards.screenTimeMin}m`
      : mission.reward === "points"
        ? `+${mission.task.rewards.points}`
        : `+$${mission.task.rewards.cashUsd.toFixed(2)}`;

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
          { backgroundColor: TASK_BG[mission.task.type] },
        ]}
      >
        <Ionicons
          name={TASK_ICON[mission.task.type]}
          size={20}
          color={TASK_COLOR[mission.task.type]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyTitle}>{mission.task.title}</Text>
        <Text style={styles.historyMeta}>
          {formatTimeAgo(mission.completedAt)}
        </Text>
      </View>
      <Text style={[styles.historyReward, { color: m.bg }]}>{value}</Text>
    </Animated.View>
  );
});
HistoryRow.displayName = "HistoryRow";

const ProgressScreen: React.FC<Props> = ({
  history,
  pointsBank,
  cashBank,
}) => {
  const totalScreenTime = history
    .filter((h) => h.reward === "screen-time")
    .reduce((sum, h) => sum + h.task.rewards.screenTimeMin, 0);

  const streak = Math.min(history.length, 7);

  // Mock weekly distribution: spread missions across last 7 days
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dayCounts = days.map((_, i) => {
    const target = Math.max(0, 5 - Math.abs(3 - i));
    return Math.min(history.length, target + (i === 6 ? history.length : 0));
  });
  const maxCount = Math.max(...dayCounts, 3);

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
          .map((h, i) => <HistoryRow key={i} mission={h} index={i} />)
      )}
    </ScrollView>
  );
};

export default ProgressScreen;
