import { useMutation, useQuery } from "@apollo/client";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  highlighted?: boolean;
  onApprove: () => void;
  onReject: () => void;
}> = ({
  submission: s,
  taskTitle,
  isActing,
  disabled,
  highlighted,
  onApprove,
  onReject,
}) => {
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
        borderWidth: highlighted ? 2 : 1,
        borderColor: highlighted ? colors.accent : colors.border,
        overflow: "hidden",
        ...(highlighted
          ? {
              shadowColor: colors.accent,
              shadowOpacity: 0.25,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }
          : null),
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
            source={s.photoDownloadUrl as string}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={120}
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

interface ParentReviewProps {
  focusedSubmissionId?: string | null;
  onFocusHandled?: () => void;
}

const ParentReviewScreen: React.FC<ParentReviewProps> = ({
  focusedSubmissionId,
  onFocusHandled,
}) => {
  const { signOut } = useAuth();

  useEffect(() => {
    if (!focusedSubmissionId) return;
    const t = setTimeout(() => onFocusHandled?.(), 4000);
    return () => clearTimeout(t);
  }, [focusedSubmissionId, onFocusHandled]);
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
    pollInterval: 30000,
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

  void signOut;
  const heroAccent = pending.length > 0 ? "#FF9500" : "#34C759";
  const heroAccentSoft = pending.length > 0 ? "#FFCC00" : "#30D158";

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
        <Text style={iosStyles.greetingTop}>PARENT REVIEW</Text>
        <Text style={iosStyles.greetingName}>Hi, {displayName}</Text>
      </View>

      {/* Hero — pending review badge */}
      <View
        style={{
          marginHorizontal: 18,
          marginBottom: 14,
        }}
      >
        <View
          style={{
            borderRadius: 22,
            padding: 22,
            overflow: "hidden",
            backgroundColor: heroAccent,
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: heroAccentSoft,
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
              <Ionicons
                name={pending.length > 0 ? "mail-unread" : "checkmark-done"}
                size={20}
                color="#FFFFFF"
              />
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
              {pending.length > 0 ? "WAITING FOR REVIEW" : "ALL CAUGHT UP"}
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
            {pending.length}
            <Text
              style={{
                fontSize: 22,
                fontWeight: "600",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: -0.4,
              }}
            >
              {" "}
              {pending.length === 1 ? "submission" : "submissions"}
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
            {pending.length > 0
              ? "Tap a card below to approve or reject"
              : "Kids will appear here when they submit a mission"}
          </Text>

          <View
            style={{
              flexDirection: "row",
              marginTop: 18,
              gap: 10,
            }}
          >
            <ParentHeroChip
              icon="people-outline"
              label="Kids"
              value={`${childCount}`}
            />
            <ParentHeroChip
              icon="rocket-outline"
              label="Tasks"
              value={`${tasksData?.tasks?.length ?? 0}`}
            />
            <ParentHeroChip
              icon="key-outline"
              label="Code"
              value={activeCode ? activeCode.code.slice(0, 4) : "—"}
            />
          </View>
        </View>
      </View>

      {/* Pairing shortcut */}
      <Section title="Quick actions">
        <View style={iosStyles.groupedCard}>
          <SimpleRow
            icon="qr-code-outline"
            iconColor="#5856D6"
            iconBg="rgba(88,86,214,0.12)"
            label={activeCode ? "Active pairing code" : "Generate pairing code"}
            value={activeCode ? activeCode.code : "Tap to create"}
            onPress={generateCode}
          />
        </View>
      </Section>

      {/* Pending list */}
      <Section
        title="Pending review"
        rightLabel={
          pending.length > 0
            ? `${pending.length} waiting`
            : undefined
        }
        rightLabelColor={pending.length > 0 ? "#FF9500" : undefined}
      >
        {loading && pending.length === 0 ? (
          <View
            style={{
              ...iosStyles.groupedCard,
              alignItems: "center",
              paddingVertical: 32,
            }}
          >
            <ActivityIndicator color="#5856D6" />
          </View>
        ) : error ? (
          <View
            style={{
              ...iosStyles.groupedCard,
              padding: 16,
            }}
          >
            <Text
              style={{ color: "#FF3B30", fontSize: 15, fontWeight: "600" }}
            >
              Couldn&apos;t load submissions
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
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
        ) : pending.length === 0 ? (
          <View
            style={{
              ...iosStyles.groupedCard,
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
                backgroundColor: "rgba(52,199,89,0.12)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="checkmark-done-outline" size={26} color="#34C759" />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.text,
                letterSpacing: -0.3,
              }}
            >
              All caught up
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
              No submissions waiting for review. Kids will appear here when
              they submit a mission.
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 18, gap: 10 }}>
            {pending.map((s) => (
              <PendingCard
                key={s.id}
                submission={s}
                taskTitle={tasksMap.get(s.taskId) ?? "Mission"}
                isActing={actingId === s.id}
                disabled={approving || rejecting}
                highlighted={focusedSubmissionId === s.id}
                onApprove={() => approve(s.id)}
                onReject={() => reject(s.id)}
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
        Auto-refreshes every 30s · sign out via Menu
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
            name={
              toast.color === colors.primary
                ? "checkmark-circle"
                : "close-circle"
            }
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

const SimpleRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value?: string;
  onPress?: () => void;
}> = ({ icon, iconColor, iconBg, label, value, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 13,
        backgroundColor: pressed ? "rgba(0,0,0,0.04)" : "transparent",
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
    {value && (
      <Text
        style={{
          fontSize: 14,
          color: colors.muted,
          marginRight: 6,
          fontVariant: ["tabular-nums"] as ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    )}
    <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
  </Pressable>
);

const iosStyles = {
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

export default ParentReviewScreen;
