import { useQuery } from "@apollo/client";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import CountUp from "../components/CountUp";
import { Ionicons } from "../components/icons";
import { RewardIcon } from "../components/RewardPicker";
import { feRewardType, feTaskType } from "../lib/normalize";
// ShopScreen removed from MVP
import {
  CHILD_BANK_QUERY,
  ME_QUERY,
  MY_BANK_QUERY,
  MY_FAMILY_QUERY,
  MY_REWARDS_QUERY,
} from "../lib/queries";
import { colors, styles } from "../theme/styles";

interface BankData {
  myBank: {
    uid: string;
    points: number;
    cashUsd: number;
    screenTimeMinutesRemaining: number;
    activeReward: { id: string; type: string; amount: number; expiresAt: string } | null;
  };
}

interface RecentReward {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  task?: { id: string; type: string; title: string } | null;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function timeAgo(iso: string) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

const TASK_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  walk: "walk-outline",
  "video-quiz": "school-outline",
  photo: "camera-outline",
};

const BankCard = memo<{
  label: string;
  bgColor: string;
  glowColor: string;
  reward: "screen-time" | "points" | "cash";
  value: number;
  format?: (n: number) => string;
  delay: number;
  onPress?: () => void;
}>(({ label, bgColor, glowColor, reward, value, format, delay, onPress }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        delay,
        useNativeDriver: true,
      }),
    ]).start();

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
      ]),
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, [opacity, translateY, shimmer, delay]);

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY }] }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.bankCard,
          {
            backgroundColor: bgColor,
            minHeight: 100,
          },
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
        ]}
      >
      {/* Shimmer */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: 80,
          backgroundColor: "rgba(255,255,255,0.18)",
          transform: [{ translateX: shimmerX }, { skewX: "-20deg" }],
        }}
      />
      {/* Floating glow */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -40,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: glowColor,
          opacity: 0.3,
        }}
      />

      <View style={styles.bankIconWrap}>
        <RewardIcon reward={reward} size={26} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.bankLabel}>{label}</Text>
        <CountUp
          style={styles.bankValue}
          value={value}
          format={format}
        />
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color="rgba(255,255,255,0.7)"
      />
      </Pressable>
    </Animated.View>
  );
});
BankCard.displayName = "BankCard";

const RewardsScreen: React.FC = () => {
  const { data: meData } = useQuery<{
    me: { uid: string; role: "PARENT" | "CHILD" };
  }>(ME_QUERY, { fetchPolicy: "cache-first" });
  const isParent = meData?.me?.role === "PARENT";

  if (isParent) return <ParentRewardsView />;
  return <ChildRewardsView />;
};

const ChildRewardsView: React.FC = () => {
  const { data } = useQuery<BankData>(MY_BANK_QUERY, {
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });
  const { data: meData } = useQuery<{
    me: { name?: string; email?: string };
  }>(ME_QUERY, { fetchPolicy: "cache-first" });
  const { data: rewardsData } = useQuery<{ myRewards: RecentReward[] }>(
    MY_REWARDS_QUERY,
    { fetchPolicy: "cache-and-network", pollInterval: 60000 },
  );

  const displayName =
    meData?.me?.name?.split(" ")[0] ??
    meData?.me?.email?.split("@")[0] ??
    "there";
  const pointsBank = data?.myBank?.points ?? 0;
  const screenTimeMinutesAvailable =
    data?.myBank?.screenTimeMinutesRemaining ?? 0;
  const activeReward = data?.myBank?.activeReward;

  // Live countdown
  const expiresAtMs = activeReward?.expiresAt
    ? new Date(activeReward.expiresAt).getTime()
    : 0;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!expiresAtMs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAtMs]);
  const remainingMs = expiresAtMs ? Math.max(0, expiresAtMs - now) : 0;
  const countdownStr = formatCountdown(remainingMs);
  const isUnlocked = !!(activeReward && remainingMs > 0);

  const recent = useMemo(
    () => (rewardsData?.myRewards ?? []).slice(0, 8),
    [rewardsData?.myRewards],
  );

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(12)).current;
  const heroPulse = useRef(new Animated.Value(0)).current;

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
        Animated.timing(heroPulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heroPulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [heroOpacity, heroTranslate, heroPulse]);
  const heroScale = heroPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  // iOS theme colors per state
  const heroBase = isUnlocked ? "#34C759" : "#FF9500";
  const heroOverlay = isUnlocked ? "#30D158" : "#FF6B00";
  const heroOrb = isUnlocked ? "#FFFFFF" : "#FFD60A";

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
        <Text style={iosCss.greetingTop}>REWARDS</Text>
        <Text style={iosCss.greetingName}>Your earnings, {displayName}</Text>
      </View>

      {/* Hero */}
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
            backgroundColor: heroBase,
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: heroOverlay,
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
              backgroundColor: heroOrb,
              opacity: 0.18,
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
                transform: [{ scale: heroScale }],
              }}
            >
              <Ionicons
                name={isUnlocked ? "lock-open" : "trophy"}
                size={20}
                color="#FFFFFF"
              />
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
              {isUnlocked ? "APPS UNLOCKED" : "AVAILABLE BALANCE"}
            </Text>
          </View>

          {isUnlocked ? (
            <>
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
                {countdownStr}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 14,
                  marginTop: 4,
                  letterSpacing: -0.1,
                }}
              >
                {Math.ceil(remainingMs / 60_000)} min remaining · auto-locks at
                0
              </Text>
            </>
          ) : (
            <>
              <CountUp
                style={{
                  color: "#FFFFFF",
                  fontSize: 56,
                  fontWeight: "800",
                  letterSpacing: -1.8,
                  fontVariant: ["tabular-nums"],
                  lineHeight: 60,
                }}
                value={pointsBank}
                format={(n) => `${Math.round(n)} pts`}
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 14,
                  marginTop: 4,
                  letterSpacing: -0.1,
                }}
              >
                {screenTimeMinutesAvailable > 0
                  ? `${screenTimeMinutesAvailable} min screen time available`
                  : "Complete a mission to earn screen time"}
              </Text>
            </>
          )}

          <View style={{ flexDirection: "row", marginTop: 18, gap: 10 }}>
            <HeroChip
              icon="time"
              label="Time"
              value={`${screenTimeMinutesAvailable}m`}
            />
            <HeroChip
              icon="sparkles"
              label="Points"
              value={`${pointsBank}`}
            />
            <HeroChip
              icon="trophy"
              label="Earned"
              value={`${recent.length}`}
            />
          </View>
        </View>
      </Animated.View>

      {/* Banks list */}
      <Section title="Your banks">
        <View style={iosCss.groupedCard}>
          <BankRow
            icon="time-outline"
            iconColor="#34C759"
            iconBg="rgba(52,199,89,0.12)"
            label="Screen time"
            value={`${screenTimeMinutesAvailable} min`}
            subtitle={
              isUnlocked
                ? "Active — auto-locks when timer hits 0"
                : "Complete a mission with the Screen Time reward"
            }
            onPress={() =>
              Alert.alert(
                "Screen time",
                screenTimeMinutesAvailable > 0
                  ? `${screenTimeMinutesAvailable} min remaining. Apps unlock automatically — see Home for live countdown.`
                  : "No active reward. Complete a mission with the Screen Time reward to unlock apps.",
              )
            }
          />
          <Sep />
          <BankRow
            icon="sparkles-outline"
            iconColor="#FF9500"
            iconBg="rgba(255,149,0,0.12)"
            label="Points"
            value={`${pointsBank}`}
            subtitle="Save up to redeem later"
            isLast
          />
        </View>
      </Section>

      {/* Recent rewards */}
      {recent.length > 0 && (
        <Section
          title="Recent rewards"
          rightLabel={`${recent.length} latest`}
        >
          <View style={iosCss.groupedCard}>
            {recent.map((r, i) => (
              <RecentRewardRow
                key={r.id}
                reward={r}
                isLast={i === recent.length - 1}
              />
            ))}
          </View>
        </Section>
      )}

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
        Complete missions to earn screen time and unlock blocked apps.
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

const BankRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  subtitle?: string;
  isLast?: boolean;
  onPress?: () => void;
}> = ({ icon, iconColor, iconBg, label, value, subtitle, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [
      {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 13,
        backgroundColor: pressed && onPress ? "rgba(0,0,0,0.04)" : "transparent",
      },
    ]}
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
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "500",
          color: colors.text,
          letterSpacing: -0.2,
        }}
      >
        {label}
      </Text>
      {subtitle && (
        <Text
          style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      )}
    </View>
    <Text
      style={{
        fontSize: 15,
        fontWeight: "600",
        color: colors.text,
        fontVariant: ["tabular-nums"] as ["tabular-nums"],
        marginRight: onPress ? 4 : 0,
      }}
    >
      {value}
    </Text>
    {onPress && (
      <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
    )}
  </Pressable>
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

const REWARD_COLOR = {
  "screen-time": "#34C759",
  points: "#FF9500",
  cash: "#34C759",
} as const;

const RecentRewardRow: React.FC<{ reward: RecentReward; isLast: boolean }> = ({
  reward,
  isLast,
}) => {
  const r = feRewardType(reward.type);
  const taskType = reward.task ? feTaskType(reward.task.type) : "walk";
  const value =
    r === "screen-time"
      ? `+${Math.round(reward.amount)}m`
      : r === "points"
        ? `+${Math.round(reward.amount)}`
        : `+$${reward.amount.toFixed(2)}`;

  const taskMeta: Record<
    string,
    { color: string; bg: string }
  > = {
    walk: { color: "#34C759", bg: "rgba(52,199,89,0.12)" },
    "video-quiz": { color: "#5856D6", bg: "rgba(88,86,214,0.12)" },
    photo: { color: "#FF9500", bg: "rgba(255,149,0,0.12)" },
  };
  const meta = taskMeta[taskType] ?? taskMeta.walk!;

  return (
    <View>
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
            name={TASK_ICON[taskType] ?? "trophy-outline"}
            size={17}
            color={meta.color}
          />
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
            {reward.task?.title ?? "Mission"}
          </Text>
          <Text
            style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}
          >
            {timeAgo(reward.createdAt)}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: REWARD_COLOR[r],
            fontVariant: ["tabular-nums"] as ["tabular-nums"],
          }}
        >
          {value}
        </Text>
      </View>
      {!isLast && <Sep />}
    </View>
  );
};

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

interface ChildProfile {
  uid: string;
  name?: string;
  role: string;
}

const ParentRewardsView: React.FC = () => {
  const { data: famData } = useQuery<{
    myFamily: {
      id: string;
      childUids: string[];
      children: ChildProfile[];
    };
  }>(MY_FAMILY_QUERY, {
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });
  const children = famData?.myFamily?.children ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F2F2F7" }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View
        style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14 }}
      >
        <Text style={iosCss.greetingTop}>FAMILY REWARDS</Text>
        <Text style={iosCss.greetingName}>
          {children.length} {children.length === 1 ? "child" : "children"} in
          your family
        </Text>
      </View>

      {/* Hero — family aggregate banks */}
      <View style={{ marginHorizontal: 18, marginBottom: 14 }}>
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
              opacity: 0.2,
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
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: "rgba(255, 255, 255, 0.18)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="gift" size={20} color="#FFFFFF" />
            </View>
            <Text
              style={{
                color: "rgba(255,255,255,0.78)",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.8,
                marginLeft: 10,
              }}
            >
              YOUR FAMILY
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
            {children.length}
            <Text
              style={{
                fontSize: 22,
                fontWeight: "600",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: -0.4,
              }}
            >
              {" "}
              {children.length === 1 ? "kid" : "kids"}
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
            {children.length === 0
              ? "Pair the first device from Home"
              : "Tap a child to see their bank balances"}
          </Text>
        </View>
      </View>

      {/* Per-child cards */}
      {children.length === 0 ? (
        <View style={iosCss.groupedCard}>
          <View
            style={{
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
              <Ionicons name="people-outline" size={26} color="#5856D6" />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.text,
                letterSpacing: -0.3,
              }}
            >
              No children paired
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
              Generate a pairing code from your Home tab to add the first child
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 18, gap: 10 }}>
          {children.map((c, i) => (
            <ChildBankCard key={c.uid} child={c} index={i} />
          ))}
        </View>
      )}

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
        Tap Cancel on a child&apos;s active reward to lock apps immediately.
      </Text>
    </ScrollView>
  );
};

const CHILD_AVATAR_BG = [
  colors.accent,
  colors.primary,
  colors.points,
  colors.cash,
  colors.screenTime,
];

const ChildBankCard: React.FC<{
  child: ChildProfile;
  index: number;
}> = ({ child, index }) => {
  const { data } = useQuery<{
    childBank: {
      uid: string;
      points: number;
      cashUsd: number;
      screenTimeMinutesRemaining: number;
      activeReward: { expiresAt: string } | null;
    };
  }>(CHILD_BANK_QUERY, {
    variables: { childUid: child.uid },
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });

  const bank = data?.childBank;
  const expiresAtMs = bank?.activeReward?.expiresAt
    ? new Date(bank.activeReward.expiresAt).getTime()
    : 0;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!expiresAtMs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAtMs]);
  const remainingMs = expiresAtMs ? Math.max(0, expiresAtMs - now) : 0;
  const isUnlocked = remainingMs > 0;

  const displayName = child.name ?? "Child";
  const initial = displayName[0]?.toUpperCase() ?? "?";
  const avatarBg = CHILD_AVATAR_BG[index % CHILD_AVATAR_BG.length];

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 22,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        ...({
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 2,
        } as object),
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: avatarBg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
              fontSize: 20,
              letterSpacing: -0.3,
            }}
          >
            {initial}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: colors.text,
              letterSpacing: -0.3,
            }}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 4,
              gap: 6,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: isUnlocked ? colors.primary : colors.muted,
              }}
            />
            <Text
              style={{
                fontSize: 12,
                color: colors.muted,
                fontWeight: "600",
              }}
            >
              {isUnlocked
                ? `Unlocked · ${formatCountdown(remainingMs)}`
                : "Apps locked"}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: colors.border,
          marginVertical: 14,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: colors.screenTime,
              letterSpacing: -0.5,
            }}
          >
            {bank?.screenTimeMinutesRemaining ?? 0}
            <Text style={{ fontSize: 14, fontWeight: "600" }}>m</Text>
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: colors.muted,
              fontWeight: "600",
              marginTop: 2,
            }}
          >
            Screen time
          </Text>
        </View>

        <View
          style={{ width: 1, height: 36, backgroundColor: colors.border }}
        />

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: colors.points,
              letterSpacing: -0.5,
            }}
          >
            {bank?.points ?? 0}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: colors.muted,
              fontWeight: "600",
              marginTop: 2,
            }}
          >
            Points
          </Text>
        </View>

        <View
          style={{ width: 1, height: 36, backgroundColor: colors.border }}
        />

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: colors.cash,
              letterSpacing: -0.5,
            }}
          >
            ${(bank?.cashUsd ?? 0).toFixed(2)}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: colors.muted,
              fontWeight: "600",
              marginTop: 2,
            }}
          >
            Cash
          </Text>
        </View>
      </View>
    </View>
  );
};

export default memo(RewardsScreen);
