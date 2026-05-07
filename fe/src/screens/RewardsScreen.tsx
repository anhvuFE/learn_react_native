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
import ShopScreen from "./ShopScreen";
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
  walk: "walk",
  "video-quiz": "school",
  photo: "camera",
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
  const [shopOpen, setShopOpen] = useState(false);
  const { data } = useQuery<BankData>(MY_BANK_QUERY, {
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });
  const { data: rewardsData } = useQuery<{ myRewards: RecentReward[] }>(
    MY_REWARDS_QUERY,
    { fetchPolicy: "cache-and-network", pollInterval: 60000 },
  );

  const pointsBank = data?.myBank?.points ?? 0;
  const cashBank = data?.myBank?.cashUsd ?? 0;
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

  const recent = useMemo(
    () => (rewardsData?.myRewards ?? []).slice(0, 5),
    [rewardsData?.myRewards],
  );

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
        <View
          style={[styles.brandLogo, { backgroundColor: colors.points }]}
        >
          <Ionicons name="gift" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Rewards</Text>
          <Text style={styles.brandSub}>Spend or save what you earn.</Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.tabHero,
          {
            backgroundColor: colors.points,
            opacity: heroOpacity,
            transform: [{ scale: heroScale }],
          },
        ]}
      >
        <View
          style={[
            styles.heroGlow,
            { backgroundColor: "#fff", top: -60, right: -30, opacity: 0.2 },
          ]}
        />
        <View
          style={[
            styles.heroGlow,
            {
              backgroundColor: "#EC4899",
              bottom: -80,
              left: -50,
              opacity: 0.16,
            },
          ]}
        />
        {activeReward && remainingMs > 0 ? (
          <>
            <Text style={styles.tabHeroLabel}>Screen time active</Text>
            <Text style={styles.tabHeroValue}>{countdownStr}</Text>
            <Text style={styles.tabHeroSub}>
              {Math.ceil(remainingMs / 60_000)} min remaining · auto-locks at 0
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.tabHeroLabel}>Cash on the way</Text>
            <CountUp
              style={styles.tabHeroValue}
              value={cashBank}
              format={(n) => `$${n.toFixed(2)}`}
            />
            <Text style={styles.tabHeroSub}>
              {pointsBank} pts · {screenTimeMinutesAvailable} min screen time
            </Text>
          </>
        )}
      </Animated.View>

      <Text style={styles.sectionLabel}>Your banks</Text>

      <BankCard
        label="Screen Time"
        bgColor={colors.screenTime}
        glowColor="#fff"
        reward="screen-time"
        value={screenTimeMinutesAvailable}
        format={(n) => `${Math.round(n)} min`}
        delay={50}
        onPress={() =>
          Alert.alert(
            "Screen time",
            screenTimeMinutesAvailable > 0
              ? `${screenTimeMinutesAvailable} min remaining. Apps unlock automatically — see Home tab for live countdown.`
              : "No active reward. Complete a mission with the Screen Time reward to unlock apps.",
          )
        }
      />
      <BankCard
        label="Points"
        bgColor={colors.points}
        glowColor="#FEF3C7"
        reward="points"
        value={pointsBank}
        delay={150}
        onPress={() => setShopOpen(true)}
      />
      <BankCard
        label="Cash (pending)"
        bgColor={colors.cash}
        glowColor="#fff"
        reward="cash"
        value={cashBank}
        format={(n) => `$${n.toFixed(2)}`}
        onPress={() =>
          Alert.alert(
            "Cash",
            `Pending: $${cashBank.toFixed(2)}.\n\nParent payout setup needed before withdrawal.`,
          )
        }
        delay={250}
      />

      <Text style={styles.sectionLabel}>Spend</Text>

      <Pressable
        onPress={() =>
          Alert.alert(
            "Reward shop",
            `You have ${pointsBank} points to spend.\n\nShop catalog launches in next milestone.`,
          )
        }
        style={({ pressed }) => [
          styles.menuRow,
          pressed && { opacity: 0.7 },
        ]}
      >
        <View
          style={[styles.menuRowIcon, { backgroundColor: colors.accentSoft }]}
        >
          <Ionicons name="storefront" size={20} color={colors.accent} />
        </View>
        <Text style={styles.menuRowLabel}>Reward shop</Text>
        <Text style={styles.menuRowValue}>Soon</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>

      <Pressable
        onPress={() =>
          Alert.alert(
            "Cash out",
            cashBank > 0
              ? `Pending: $${cashBank.toFixed(2)}\n\nParent payout setup needed before withdrawal.`
              : "No cash earned yet — complete a mission with the cash reward.",
          )
        }
        style={({ pressed }) => [
          styles.menuRow,
          pressed && { opacity: 0.7 },
        ]}
      >
        <View
          style={[styles.menuRowIcon, { backgroundColor: colors.cashSoft }]}
        >
          <Ionicons name="card" size={20} color={colors.cash} />
        </View>
        <Text style={styles.menuRowLabel}>Cash out to savings</Text>
        <Text style={styles.menuRowValue}>
          ${cashBank.toFixed(2)}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>

      <Pressable
        onPress={() =>
          screenTimeMinutesAvailable > 0
            ? Alert.alert(
                "Screen time active",
                `You have ${screenTimeMinutesAvailable} min remaining. Apps unlock automatically — go to Home to see countdown.`,
              )
            : Alert.alert(
                "No screen time",
                "Complete a mission and choose Screen Time as your reward to unlock apps.",
              )
        }
        style={({ pressed }) => [
          styles.menuRow,
          pressed && { opacity: 0.7 },
        ]}
      >
        <View
          style={[styles.menuRowIcon, { backgroundColor: colors.screenTimeSoft }]}
        >
          <Ionicons name="play-circle" size={20} color={colors.screenTime} />
        </View>
        <Text style={styles.menuRowLabel}>Use screen time now</Text>
        <Text style={styles.menuRowValue}>
          {screenTimeMinutesAvailable}m
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>

      {recent.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
            Recent rewards
          </Text>
          {recent.map((r) => {
            const reward = feRewardType(r.type);
            const taskType = r.task ? feTaskType(r.task.type) : "walk";
            const value =
              reward === "screen-time"
                ? `+${Math.round(r.amount)}m`
                : reward === "points"
                  ? `+${Math.round(r.amount)}`
                  : `+$${r.amount.toFixed(2)}`;
            const tint =
              reward === "screen-time"
                ? colors.screenTime
                : reward === "points"
                  ? colors.points
                  : colors.cash;
            return (
              <View
                key={r.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: tint + "22",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name={TASK_ICON[taskType] ?? "trophy"}
                    size={18}
                    color={tint}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: colors.text,
                    }}
                    numberOfLines={1}
                  >
                    {r.task?.title ?? "Mission"}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.muted,
                      marginTop: 2,
                    }}
                  >
                    {timeAgo(r.createdAt)}
                  </Text>
                </View>
                <Text
                  style={{ color: tint, fontWeight: "800", fontSize: 14 }}
                >
                  {value}
                </Text>
              </View>
            );
          })}
        </>
      )}

      <Text style={styles.footerNote}>
        * Cash payouts require parent approval and account setup.
      </Text>

      <Modal
        visible={shopOpen}
        animationType="slide"
        onRequestClose={() => setShopOpen(false)}
        presentationStyle="pageSheet"
      >
        <ShopScreen onClose={() => setShopOpen(false)} />
      </Modal>
    </ScrollView>
  );
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
      style={styles.safeArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      scrollEventThrottle={16}
    >
      <View style={styles.brandRow}>
        <View
          style={[styles.brandLogo, { backgroundColor: colors.points }]}
        >
          <Ionicons name="gift" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Family rewards</Text>
          <Text style={styles.brandSub}>
            {children.length} {children.length === 1 ? "child" : "children"}
          </Text>
        </View>
      </View>

      {children.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 22,
            padding: 28,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons
            name="people-outline"
            size={42}
            color={colors.muted}
          />
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.text,
              marginTop: 12,
            }}
          >
            No children yet
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.muted,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            Generate a pairing code from Home to add the first child.
          </Text>
        </View>
      ) : (
        children.map((c, i) => <ChildBankCard key={c.uid} child={c} index={i} />)
      )}
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
