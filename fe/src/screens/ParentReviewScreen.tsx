import { useMutation, useQuery } from "@apollo/client";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "../components/icons";
import { useAuth } from "../lib/auth-context";
import {
  APPROVE_SUBMISSION,
  CREATE_PAIRING_CODE,
  ME_QUERY,
  MY_BANK_QUERY,
  MY_FAMILY_QUERY,
  MY_PAIRING_CODES,
  MY_REWARDS_QUERY,
  PENDING_SUBMISSIONS,
  REJECT_SUBMISSION,
  TASKS_QUERY,
} from "../lib/queries";
import { colors, styles } from "../theme/styles";

interface PendingSub {
  id: string;
  taskId: string;
  childUid: string;
  chosenReward: string;
  status: string;
  submittedAt: string;
  timerSeconds?: number | null;
  quizScore?: number | null;
  photoStoragePath?: string | null;
  photoDownloadUrl?: string | null;
}

const REWARD_LABEL: Record<string, string> = {
  SCREEN_TIME: "Screen time",
  POINTS: "Points",
  CASH: "Cash",
};

const REWARD_COLOR: Record<string, string> = {
  SCREEN_TIME: colors.screenTime,
  POINTS: colors.points,
  CASH: colors.cash,
};

function timeAgo(iso: string) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function shortPath(p?: string | null) {
  if (!p) return "";
  const parts = p.split("/");
  return parts[parts.length - 1] ?? p;
}

const PendingCard: React.FC<{
  submission: PendingSub;
  taskTitle: string;
  isActing: boolean;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}> = ({ submission: s, taskTitle, isActing, disabled, onApprove, onReject }) => {
  const [imageBroken, setImageBroken] = useState(false);

  const isPhoto = !!s.photoStoragePath;
  const isWalk = s.timerSeconds != null;
  const isQuiz = s.quizScore != null;

  const accent = isPhoto
    ? colors.warning
    : isWalk
      ? colors.primary
      : colors.accent;
  const accentSoft = isPhoto
    ? colors.warningSoft
    : isWalk
      ? colors.primarySoft
      : colors.accentSoft;
  const taskIcon: keyof typeof Ionicons.glyphMap = isPhoto
    ? "camera"
    : isWalk
      ? "walk"
      : "school";

  const showPhoto = isPhoto && !!s.photoDownloadUrl && !imageBroken;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 22,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {/* Hero region: photo if available, otherwise illustrated visual */}
      <View
        style={{
          aspectRatio: 16 / 10,
          backgroundColor: accentSoft,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {showPhoto ? (
          <Image
            source={{ uri: s.photoDownloadUrl as string }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            onError={() => setImageBroken(true)}
          />
        ) : (
          <>
            <Ionicons name={taskIcon} size={64} color={accent} />
            {isPhoto && imageBroken && (
              <Text
                style={{
                  position: "absolute",
                  bottom: 12,
                  fontSize: 11,
                  color: colors.muted,
                  fontWeight: "600",
                }}
              >
                Photo unavailable
              </Text>
            )}
            {isWalk && (
              <Text
                style={{
                  position: "absolute",
                  bottom: 12,
                  fontSize: 13,
                  color: accent,
                  fontWeight: "800",
                }}
              >
                {s.timerSeconds}s walked
              </Text>
            )}
            {isQuiz && (
              <Text
                style={{
                  position: "absolute",
                  bottom: 12,
                  fontSize: 13,
                  color: accent,
                  fontWeight: "800",
                }}
              >
                Score {(s.quizScore ?? 0).toFixed(0)}%
              </Text>
            )}
          </>
        )}

        {/* Reward chip overlay */}
        <View
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: REWARD_COLOR[s.chosenReward] ?? colors.muted,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>
            {REWARD_LABEL[s.chosenReward] ?? s.chosenReward}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={{ padding: 14 }}>
        <Text
          style={{ fontSize: 16, fontWeight: "800", color: colors.text }}
          numberOfLines={1}
        >
          {taskTitle}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 4,
            gap: 6,
          }}
        >
          <Ionicons name="time-outline" size={12} color={colors.muted} />
          <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>
            {timeAgo(s.submittedAt)}
          </Text>
          {showPhoto && (
            <>
              <Text style={{ color: colors.muted, fontSize: 11 }}>·</Text>
              <Text
                style={{ fontSize: 11, color: colors.muted }}
                numberOfLines={1}
              >
                {shortPath(s.photoStoragePath)}
              </Text>
            </>
          )}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <Pressable
            disabled={isActing || disabled}
            onPress={onReject}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                backgroundColor: colors.dangerSoft,
                opacity: isActing || disabled ? 0.5 : 1,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons
              name="close"
              size={16}
              color={colors.danger}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                color: colors.danger,
                fontWeight: "800",
                fontSize: 14,
              }}
            >
              Reject
            </Text>
          </Pressable>
          <Pressable
            disabled={isActing || disabled}
            onPress={onApprove}
            style={({ pressed }) => [
              {
                flex: 1.5,
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                backgroundColor: colors.primary,
                opacity: isActing || disabled ? 0.5 : 1,
              },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            {isActing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}
                >
                  Approve
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const ParentReviewScreen: React.FC = () => {
  const { signOut } = useAuth();
  const { data: meData } = useQuery<{
    me: { name?: string; email?: string };
  }>(ME_QUERY, { fetchPolicy: "cache-first" });
  const displayName = meData?.me?.name?.split(" ")[0] ?? "Parent";

  const { data: famData } = useQuery<{
    myFamily: { id: string; childUids: string[] };
  }>(MY_FAMILY_QUERY, { fetchPolicy: "cache-and-network" });

  const { data: tasksData } = useQuery<{ tasks: { id: string; title: string }[] }>(
    TASKS_QUERY,
    { fetchPolicy: "cache-and-network" },
  );

  const { data: codesData } = useQuery<{
    myPairingCodes: { code: string; expiresAt: string }[];
  }>(MY_PAIRING_CODES, { fetchPolicy: "cache-and-network" });

  const { data, loading, error, refetch } = useQuery<{
    pendingSubmissions: PendingSub[];
  }>(PENDING_SUBMISSIONS, {
    fetchPolicy: "cache-and-network",
    pollInterval: 15000,
  });

  const [approveMut, { loading: approving }] = useMutation(APPROVE_SUBMISSION, {
    refetchQueries: [
      { query: PENDING_SUBMISSIONS },
      { query: MY_BANK_QUERY },
      { query: MY_REWARDS_QUERY },
    ],
    awaitRefetchQueries: true,
  });
  const [rejectMut, { loading: rejecting }] = useMutation(REJECT_SUBMISSION, {
    refetchQueries: [{ query: PENDING_SUBMISSIONS }],
    awaitRefetchQueries: true,
  });
  const [toast, setToast] = useState<{
    text: string;
    color: string;
  } | null>(null);

  function showToast(text: string, color: string) {
    setToast({ text, color });
    setTimeout(() => setToast(null), 2200);
  }
  const [createCodeMut] = useMutation(CREATE_PAIRING_CODE, {
    refetchQueries: [{ query: MY_PAIRING_CODES }],
  });

  const [actingId, setActingId] = useState<string | null>(null);

  const tasksMap = new Map((tasksData?.tasks ?? []).map((t) => [t.id, t.title]));
  const pending = data?.pendingSubmissions ?? [];
  const childCount = famData?.myFamily?.childUids?.length ?? 0;
  const activeCode = codesData?.myPairingCodes?.[0];

  async function approve(id: string) {
    setActingId(id);
    try {
      await approveMut({ variables: { id } });
      showToast("Approved · reward issued", colors.primary);
    } catch (e) {
      Alert.alert("Failed", (e as Error).message);
    } finally {
      setActingId(null);
    }
  }

  function reject(id: string) {
    Alert.alert("Reject submission?", "Reason will help your child improve.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          setActingId(id);
          try {
            await rejectMut({
              variables: {
                input: { id, reason: "Please try again with a clearer photo" },
              },
            });
            showToast("Rejected", colors.danger);
          } catch (e) {
            Alert.alert("Failed", (e as Error).message);
          } finally {
            setActingId(null);
          }
        },
      },
    ]);
  }

  async function generateCode() {
    try {
      const r = await createCodeMut({
        variables: { childName: "New device" },
      });
      const code = (
        r.data as { createPairingCode?: { code: string } } | null
      )?.createPairingCode?.code;
      if (code) {
        Alert.alert("Code generated", `Share with child: ${code}`);
      }
    } catch (e) {
      Alert.alert("Failed", (e as Error).message);
    }
  }

  return (
    <ScrollView
      style={styles.safeArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      scrollEventThrottle={16}
    >
      <View style={styles.greetingRow}>
        <View style={styles.greetingAvatar}>
          <Text style={styles.greetingAvatarText}>
            {displayName[0]?.toUpperCase() ?? "P"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingHi}>Parent</Text>
          <Text style={styles.greetingName}>Hi, {displayName}</Text>
        </View>
        <Pressable
          onPress={() => signOut()}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Quick stats strip */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <View
          style={[
            styles.miniStatCard,
            {
              flex: 1,
              backgroundColor: colors.warning,
              height: 84,
              padding: 12,
            },
          ]}
        >
          <Text style={styles.miniStatLabelInline}>To review</Text>
          <Text style={styles.miniStatValue}>{pending.length}</Text>
        </View>
        <View
          style={[
            styles.miniStatCard,
            {
              flex: 1,
              backgroundColor: colors.accent,
              height: 84,
              padding: 12,
            },
          ]}
        >
          <Text style={styles.miniStatLabelInline}>Children</Text>
          <Text style={styles.miniStatValue}>{childCount}</Text>
        </View>
        <View
          style={[
            styles.miniStatCard,
            {
              flex: 1,
              backgroundColor: colors.primary,
              height: 84,
              padding: 12,
            },
          ]}
        >
          <Text style={styles.miniStatLabelInline}>Tasks</Text>
          <Text style={styles.miniStatValue}>{tasksData?.tasks?.length ?? 0}</Text>
        </View>
      </View>

      {/* Pairing code shortcut */}
      <Pressable
        onPress={generateCode}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#0F172A",
            borderRadius: 16,
            padding: 14,
            marginBottom: 18,
          },
          pressed && { opacity: 0.9 },
        ]}
      >
        <Ionicons name="qr-code" size={26} color="#FBBF24" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 11,
              fontWeight: "800",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Pairing code
          </Text>
          <Text
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "800",
              letterSpacing: 3,
              fontVariant: ["tabular-nums"],
              marginTop: 2,
            }}
          >
            {activeCode ? activeCode.code : "Tap to generate"}
          </Text>
        </View>
        <Ionicons
          name={activeCode ? "refresh" : "add-circle"}
          size={22}
          color="rgba(255,255,255,0.7)"
        />
      </Pressable>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>Pending review</Text>
        <Text
          style={{
            fontSize: 12,
            color: pending.length > 0 ? colors.warning : colors.muted,
            fontWeight: "800",
          }}
        >
          {pending.length} waiting
        </Text>
      </View>

      {loading && pending.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View
          style={{
            backgroundColor: colors.dangerSoft,
            padding: 14,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: colors.danger, fontWeight: "700" }}>
            {error.message}
          </Text>
          <Pressable onPress={() => refetch()}>
            <Text
              style={{
                color: colors.danger,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              Retry
            </Text>
          </Pressable>
        </View>
      ) : pending.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            padding: 24,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="checkmark-done" size={42} color={colors.primary} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.text,
              marginTop: 10,
            }}
          >
            All caught up
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.muted,
              marginTop: 4,
              textAlign: "center",
            }}
          >
            No submissions waiting for review.
          </Text>
        </View>
      ) : (
        pending.map((s) => (
          <PendingCard
            key={s.id}
            submission={s}
            taskTitle={tasksMap.get(s.taskId) ?? "Mission"}
            isActing={actingId === s.id}
            disabled={approving || rejecting}
            onApprove={() => approve(s.id)}
            onReject={() => reject(s.id)}
          />
        ))
      )}

      <Text style={[styles.footerNote, { marginTop: 18 }]}>
        Auto-refreshes every 15s · pull child app to submit
      </Text>
      {toast && (
        <View
          style={{
            position: "absolute",
            bottom: 24,
            left: 18,
            right: 18,
            backgroundColor: toast.color,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: toast.color,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Ionicons
            name={toast.color === colors.primary ? "checkmark-circle" : "close-circle"}
            size={18}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
            {toast.text}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default ParentReviewScreen;
