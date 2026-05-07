import { useMutation, useQuery } from "@apollo/client";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Ionicons } from "../components/icons";
import { feRewardType } from "../lib/normalize";
import {
  ME_QUERY,
  MY_BANK_QUERY,
  MY_REWARDS_QUERY,
  RESTRICTED_APPS_QUERY,
  UPDATE_MY_SETTINGS,
} from "../lib/queries";
import { colors, styles } from "../theme/styles";

interface BankData {
  myBank: {
    points: number;
    cashUsd: number;
    screenTimeMinutesRemaining: number;
    activeReward: { expiresAt: string; amount: number } | null;
  };
}

interface Reward {
  id: string;
  type: string;
  amount: number;
  createdAt: string;
}

function format(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const ScreenTimeSettingsScreen: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const { data: bankData } = useQuery<BankData>(MY_BANK_QUERY, {
    fetchPolicy: "cache-and-network",
    pollInterval: 15000,
  });
  const { data: rewardsData } = useQuery<{ myRewards: Reward[] }>(
    MY_REWARDS_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const { data: appsData } = useQuery<{
    restrictedApps: { id: string; name: string }[];
  }>(RESTRICTED_APPS_QUERY, { fetchPolicy: "cache-and-network" });

  const { data: meData } = useQuery<{
    me: { autoLock?: boolean; bedtimeMode?: boolean };
  }>(ME_QUERY, { fetchPolicy: "cache-and-network" });
  const [updateSettings] = useMutation(UPDATE_MY_SETTINGS, {
    refetchQueries: [{ query: ME_QUERY }],
  });

  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [bedtimeMode, setBedtimeMode] = useState(false);

  useEffect(() => {
    const me = meData?.me;
    if (!me) return;
    setAutoLockEnabled(me.autoLock ?? true);
    setBedtimeMode(me.bedtimeMode ?? false);
  }, [meData?.me]);

  const onAutoLock = (v: boolean) => {
    setAutoLockEnabled(v);
    updateSettings({ variables: { input: { autoLock: v } } }).catch(() => {});
  };
  const onBedtime = (v: boolean) => {
    setBedtimeMode(v);
    updateSettings({ variables: { input: { bedtimeMode: v } } }).catch(() => {});
  };

  const bank = bankData?.myBank;
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
  const remainingSec = Math.floor(remainingMs / 1000);

  // Last 7 days screen-time earned (in minutes)
  const todayMs = Date.now();
  const earnedLast7 = (rewardsData?.myRewards ?? [])
    .filter(
      (r) =>
        feRewardType(r.type) === "screen-time" &&
        todayMs - new Date(r.createdAt).getTime() < 7 * 86400000,
    )
    .reduce((sum, r) => sum + r.amount, 0);

  const recentScreenTime = (rewardsData?.myRewards ?? [])
    .filter((r) => feRewardType(r.type) === "screen-time")
    .slice(0, 4);

  const appsCount = appsData?.restrictedApps?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.topBarBack}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Screen time</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Active reward hero */}
        <View
          style={{
            backgroundColor:
              remainingMs > 0 ? colors.primary : "#0F172A",
            borderRadius: 22,
            padding: 22,
            marginBottom: 18,
            overflow: "hidden",
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -50,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: remainingMs > 0 ? "#FBBF24" : "#7C3AED",
              opacity: 0.25,
            }}
          />
          <Ionicons
            name={remainingMs > 0 ? "lock-open" : "lock-closed"}
            size={26}
            color="#fff"
          />
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.6,
              textTransform: "uppercase",
              marginTop: 14,
            }}
          >
            {remainingMs > 0 ? "Apps unlocked" : "Apps locked"}
          </Text>
          <Text
            style={{
              color: "#fff",
              fontSize: 36,
              fontWeight: "700",
              marginTop: 4,
              letterSpacing: -0.8,
              fontVariant: ["tabular-nums"],
            }}
          >
            {remainingMs > 0 ? format(remainingSec) : "0:00"}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 13,
              marginTop: 6,
            }}
          >
            {remainingMs > 0
              ? "Auto-locks when timer ends."
              : "Earn screen time by completing a mission."}
          </Text>
        </View>

        {/* Today / week stats */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
          <StatTile
            label="Earned · 7 days"
            value={`${Math.round(earnedLast7)}m`}
            color={colors.screenTime}
            bg={colors.screenTimeSoft}
            icon="time"
          />
          <StatTile
            label="Apps locked"
            value={`${appsCount}`}
            color={colors.text}
            bg={colors.surfaceAlt}
            icon="lock-closed"
          />
        </View>

        <Text style={styles.sectionLabel}>Behavior</Text>

        <SettingRow
          icon="lock-closed"
          iconColor={colors.primary}
          iconBg={colors.primarySoft}
          title="Auto-lock when reward ends"
          subtitle="Apps re-block when your screen time reaches zero"
          value={autoLockEnabled}
          onValueChange={onAutoLock}
        />

        <SettingRow
          icon="moon"
          iconColor={colors.accent}
          iconBg={colors.accentSoft}
          title="Bedtime mode"
          subtitle="Lock all apps from 9 PM to 7 AM (server enforcement coming soon)"
          value={bedtimeMode}
          onValueChange={onBedtime}
        />

        {recentScreenTime.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
              Recent screen-time rewards
            </Text>
            {recentScreenTime.map((r) => (
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
                    backgroundColor: colors.screenTimeSoft,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name="time"
                    size={18}
                    color={colors.screenTime}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.text,
                    }}
                  >
                    +{Math.round(r.amount)} min unlocked
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.muted,
                      marginTop: 2,
                    }}
                  >
                    {new Date(r.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: colors.surfaceAlt,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: colors.muted,
                    }}
                  >
                    Used
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        <Text
          style={{
            fontSize: 11,
            color: colors.muted,
            textAlign: "center",
            marginTop: 18,
            lineHeight: 16,
          }}
        >
          Daily limits, weekly schedules, and app shaping launch with the
          device-restriction integration milestone.
        </Text>
      </ScrollView>
    </View>
  );
};

const StatTile: React.FC<{
  label: string;
  value: string;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = ({ label, value, color, bg, icon }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: bg,
      borderRadius: 16,
      padding: 14,
    }}
  >
    <Ionicons name={icon} size={18} color={color} />
    <Text
      style={{
        fontSize: 22,
        fontWeight: "700",
        color,
        marginTop: 8,
        letterSpacing: -0.5,
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        fontSize: 11,
        fontWeight: "700",
        color,
        marginTop: 2,
        opacity: 0.85,
      }}
    >
      {label}
    </Text>
  </View>
);

const SettingRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}> = ({ icon, iconColor, iconBg, title, subtitle, value, onValueChange }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 14,
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
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: iconBg,
        marginRight: 12,
      }}
    >
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={{ flex: 1, marginRight: 12 }}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
          letterSpacing: -0.2,
        }}
      >
        {title}
      </Text>
      <Text
        style={{ fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 16 }}
      >
        {subtitle}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor="#fff"
    />
  </View>
);

export default ScreenTimeSettingsScreen;
