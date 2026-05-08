import { useMutation, useQuery } from "@apollo/client";
import * as Clipboard from "expo-clipboard";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "../components/icons";
import {
  CHILD_BANK_QUERY,
  CREATE_PAIRING_CODE,
  MY_FAMILY_QUERY,
  MY_PAIRING_CODES,
} from "../lib/queries";
import { colors, styles } from "../theme/styles";

interface Child {
  uid: string;
  name?: string;
  role: string;
  createdAt: string;
}

const FamilyManageScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data: famData, loading } = useQuery<{
    myFamily: {
      id: string;
      createdAt: string;
      children: Child[];
    };
  }>(MY_FAMILY_QUERY, { fetchPolicy: "cache-and-network" });

  const { data: codesData } = useQuery<{
    myPairingCodes: { code: string; expiresAt: string; childName: string }[];
  }>(MY_PAIRING_CODES, { fetchPolicy: "cache-and-network" });

  const [createCode, { loading: creating }] = useMutation(CREATE_PAIRING_CODE, {
    refetchQueries: [{ query: MY_PAIRING_CODES }],
  });

  const family = famData?.myFamily;
  const children = family?.children ?? [];
  const codes = codesData?.myPairingCodes ?? [];

  const handleGenerateCode = async () => {
    try {
      const r = await createCode({ variables: { childName: "New device" } });
      const code = (
        r.data as { createPairingCode?: { code: string } } | null
      )?.createPairingCode?.code;
      if (code) Alert.alert("Code created", code);
    } catch (e) {
      Alert.alert("Failed", (e as Error).message);
    }
  };

  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert("Copied", `${code} copied to clipboard`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.topBarBack}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Manage family</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && !family ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <View
              style={{
                backgroundColor: "#0F172A",
                borderRadius: 22,
                padding: 18,
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                Family
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: "700",
                  marginTop: 4,
                  letterSpacing: -0.4,
                }}
              >
                {children.length + 1}{" "}
                {children.length + 1 === 1 ? "person" : "people"}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 12,
                  marginTop: 6,
                  fontFamily: undefined,
                }}
              >
                Family ID: {family?.id?.slice(0, 8) ?? "—"}…
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                Created{" "}
                {family
                  ? new Date(family.createdAt).toLocaleDateString()
                  : "—"}
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 0 }]}>
              Members
            </Text>

            {/* Parent (current user) */}
            <View style={memberCardStyle}>
              <View
                style={[
                  memberAvatarStyle,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Ionicons name="person" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={memberName}>You (Parent)</Text>
                <Text style={memberMeta}>Manages tasks &amp; rewards</Text>
              </View>
              <View style={parentBadge}>
                <Text style={parentBadgeText}>Parent</Text>
              </View>
            </View>

            {children.map((c, i) => (
              <ChildMemberCard key={c.uid} child={c} index={i} />
            ))}

            {children.length === 0 && (
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
                <Ionicons
                  name="add-circle-outline"
                  size={40}
                  color={colors.muted}
                />
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.muted,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  Generate a code below to add your first child
                </Text>
              </View>
            )}

            <View style={[styles.sectionRow, { marginTop: 18 }]}>
              <Text style={styles.sectionLabel}>Pairing codes</Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.muted,
                  fontWeight: "700",
                }}
              >
                {codes.length} active
              </Text>
            </View>

            {codes.map((c) => (
              <Pressable
                key={c.code}
                onPress={() => copyCode(c.code)}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.primarySoft,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="key-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: colors.text,
                      letterSpacing: 4,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {c.code}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.muted,
                      marginTop: 2,
                    }}
                  >
                    For "{c.childName}" · expires{" "}
                    {new Date(c.expiresAt).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="copy-outline" size={16} color={colors.primary} />
              </Pressable>
            ))}

            <Pressable
              onPress={handleGenerateCode}
              disabled={creating}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                creating && { opacity: 0.6 },
                { marginTop: 8 },
              ]}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="add-circle"
                    size={18}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryButtonText}>
                    Generate new pairing code
                  </Text>
                </>
              )}
            </Pressable>

            <Text
              style={{
                fontSize: 11,
                color: colors.muted,
                textAlign: "center",
                marginTop: 12,
                lineHeight: 16,
              }}
            >
              Share a code with your child. They'll enter it in their app to
              link their device.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const ChildMemberCard: React.FC<{ child: Child; index: number }> = ({
  child,
  index,
}) => {
  const { data } = useQuery<{
    childBank: {
      points: number;
      cashUsd: number;
      screenTimeMinutesRemaining: number;
    };
  }>(CHILD_BANK_QUERY, {
    variables: { childUid: child.uid },
    fetchPolicy: "cache-and-network",
  });

  const bank = data?.childBank;
  const avatarColors = [
    colors.primary,
    colors.points,
    colors.cash,
    colors.screenTime,
  ];
  const bg = avatarColors[index % avatarColors.length];
  const initial = (child.name ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <View style={memberCardStyle}>
      <View style={[memberAvatarStyle, { backgroundColor: bg }]}>
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "700",
            letterSpacing: -0.3,
          }}
        >
          {initial}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={memberName}>{child.name ?? "Child"}</Text>
        <Text style={memberMeta}>
          {bank
            ? `${bank.points} pts · $${bank.cashUsd.toFixed(2)} · ${bank.screenTimeMinutesRemaining}m`
            : "Loading bank…"}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: colors.primarySoft,
        }}
      >
        <Text
          style={{
            color: colors.primaryDark,
            fontSize: 11,
            fontWeight: "700",
          }}
        >
          Child
        </Text>
      </View>
    </View>
  );
};

const memberCardStyle = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  backgroundColor: colors.surface,
  borderRadius: 16,
  paddingVertical: 12,
  paddingHorizontal: 14,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: colors.border,
};

const memberAvatarStyle = {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  marginRight: 12,
};

const memberName = {
  fontSize: 15,
  fontWeight: "700" as const,
  color: colors.text,
  letterSpacing: -0.2,
};

const memberMeta = {
  fontSize: 12,
  color: colors.muted,
  marginTop: 2,
};

const parentBadge = {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 999,
  backgroundColor: colors.accentSoft,
};

const parentBadgeText = {
  color: colors.accent,
  fontSize: 11,
  fontWeight: "700" as const,
};

export default FamilyManageScreen;
