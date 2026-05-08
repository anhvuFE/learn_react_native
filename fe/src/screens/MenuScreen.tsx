import { useMutation, useQuery } from "@apollo/client";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import React, { memo, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "../components/icons";
import { useAuth } from "../lib/auth-context";
import {
  CREATE_PAIRING_CODE,
  DELETE_MY_ACCOUNT,
  ME_QUERY,
  MY_FAMILY_QUERY,
  MY_PAIRING_CODES,
  RESTRICTED_APPS_QUERY,
} from "../lib/queries";
import { colors } from "../theme/styles";
import AboutScreen from "./AboutScreen";
import EditProfileScreen from "./EditProfileScreen";
import FamilyManageScreen from "./FamilyManageScreen";
import NotificationsScreen from "./NotificationsScreen";
import ParentalControlsScreen from "./ParentalControlsScreen";
import RestrictedAppsScreen from "./RestrictedAppsScreen";
import ScreenTimeSettingsScreen from "./ScreenTimeSettingsScreen";

const MenuScreen: React.FC = () => {
  const { signOut } = useAuth();
  const { data: meData } = useQuery<{
    me: {
      uid: string;
      name?: string;
      email?: string;
      role: "PARENT" | "CHILD";
      familyId?: string;
      photoDownloadUrl?: string;
    };
  }>(ME_QUERY, { fetchPolicy: "cache-and-network" });
  const me = meData?.me;
  const isParent = me?.role === "PARENT";

  const { data: famData } = useQuery<{
    myFamily: { id: string; childUids: string[] };
  }>(MY_FAMILY_QUERY, { fetchPolicy: "cache-and-network", skip: !me });

  const { data: appsData } = useQuery<{
    restrictedApps: { id: string; appId: string; name: string }[];
  }>(RESTRICTED_APPS_QUERY, { fetchPolicy: "cache-and-network", skip: !me });

  const { data: codesData, refetch: refetchCodes } = useQuery<{
    myPairingCodes: { code: string; expiresAt: string; childName: string }[];
  }>(MY_PAIRING_CODES, {
    fetchPolicy: "cache-and-network",
    skip: !isParent,
  });

  const [createPairingCode, { loading: generatingCode }] = useMutation(
    CREATE_PAIRING_CODE,
    { refetchQueries: [{ query: MY_PAIRING_CODES }] },
  );

  const displayName = me?.name ?? me?.email?.split("@")[0] ?? "Profile";
  const initial = (me?.name ?? me?.email ?? "?")[0]?.toUpperCase() ?? "?";
  const memberCount = (famData?.myFamily?.childUids?.length ?? 0) + 1;
  const activeCode = codesData?.myPairingCodes?.[0];
  const restrictedCount = appsData?.restrictedApps?.length ?? 0;

  const handleGenerateCode = async () => {
    try {
      await createPairingCode({ variables: { childName: "New device" } });
      await refetchCodes();
    } catch (e) {
      Alert.alert("Failed", (e as Error).message);
    }
  };

  const confirmSignOut = () =>
    Alert.alert("Sign out?", "You'll need to sign in again next time.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);

  const [deleteAccount] = useMutation(DELETE_MY_ACCOUNT);
  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete account?",
      isParent
        ? "This will permanently delete your family, all paired children, tasks, submissions, and rewards. Cannot be undone."
        : "This will permanently delete your account and remove you from your family. Cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              await signOut();
            } catch (e) {
              Alert.alert("Failed", (e as Error).message);
            }
          },
        },
      ],
    );
  };

  const copyCode = async () => {
    if (!activeCode) return;
    await Clipboard.setStringAsync(activeCode.code);
    Alert.alert(
      "Copied",
      `Pairing code "${activeCode.code}" copied to clipboard.`,
    );
  };

  const [familyOpen, setFamilyOpen] = useState(false);
  const [restrictedOpen, setRestrictedOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [stOpen, setStOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(12)).current;

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
  }, [heroOpacity, heroTranslate]);

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
        <Text style={iosCss.greetingTop}>MENU</Text>
        <Text style={iosCss.greetingName}>Settings</Text>
      </View>

      {/* Profile card */}
      <Animated.View
        style={{
          marginHorizontal: 18,
          marginBottom: 18,
          opacity: heroOpacity,
          transform: [{ translateY: heroTranslate }],
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "#5856D6",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
              overflow: "hidden",
            }}
          >
            {me?.photoDownloadUrl ? (
              <Image
                source={me.photoDownloadUrl}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 24,
                  fontWeight: "700",
                  letterSpacing: -0.4,
                }}
              >
                {initial}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
                letterSpacing: -0.3,
              }}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.muted,
                marginTop: 1,
              }}
              numberOfLines={1}
            >
              {me?.email ?? "—"}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 6,
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: "#34C759",
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#34C759",
                  letterSpacing: 0.2,
                }}
              >
                {isParent
                  ? `Parent · Family of ${memberCount}`
                  : "Child · Paired"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setEditOpen(true)}
            style={({ pressed }) => [
              {
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "rgba(120,120,128,0.12)",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="create-outline" size={16} color={colors.text} />
          </Pressable>
        </View>
      </Animated.View>

      {/* Pairing card (parent only) */}
      {isParent && (
        <View style={{ marginHorizontal: 18, marginBottom: 18 }}>
          <View
            style={{
              borderRadius: 18,
              padding: 18,
              backgroundColor: "#5856D6",
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
                backgroundColor: "#FFFFFF",
                opacity: 0.08,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 0.6,
                  }}
                >
                  {activeCode ? "ACTIVE PAIRING CODE" : "NO ACTIVE CODE"}
                </Text>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 32,
                    fontWeight: "700",
                    letterSpacing: 1.5,
                    marginTop: 4,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {activeCode
                    ? `${activeCode.code.slice(0, 3)}·${activeCode.code.slice(3)}`
                    : "—"}
                </Text>
              </View>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.18)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 12,
                }}
              >
                <Ionicons name="qr-code" size={28} color="#FFFFFF" />
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 14,
              }}
            >
              {activeCode && (
                <Pressable
                  onPress={copyCode}
                  style={({ pressed }) => [
                    {
                      backgroundColor: "rgba(255,255,255,0.2)",
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons name="copy" size={13} color="#FFFFFF" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    Copy
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleGenerateCode}
                disabled={generatingCode}
                style={({ pressed }) => [
                  {
                    backgroundColor: "#FFFFFF",
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    opacity: pressed || generatingCode ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={activeCode ? "refresh" : "add-circle"}
                  size={13}
                  color="#5856D6"
                />
                <Text
                  style={{
                    color: "#5856D6",
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {generatingCode
                    ? "Generating…"
                    : activeCode
                      ? "New code"
                      : "Generate code"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Family section */}
      <Section title="Family">
        <View style={iosCss.groupedCard}>
          <SettingsRow
            icon="people-outline"
            iconColor="#5856D6"
            iconBg="rgba(88,86,214,0.12)"
            label="Manage family"
            value={`${memberCount} ${memberCount === 1 ? "member" : "members"}`}
            onPress={() => setFamilyOpen(true)}
          />
          <Sep />
          <SettingsRow
            icon="shield-checkmark-outline"
            iconColor="#34C759"
            iconBg="rgba(52,199,89,0.12)"
            label="Parental controls"
            onPress={() => setControlsOpen(true)}
            isLast
          />
        </View>
      </Section>

      {/* App section */}
      <Section title="App">
        <View style={iosCss.groupedCard}>
          <SettingsRow
            icon="notifications-outline"
            iconColor="#FF3B30"
            iconBg="rgba(255,59,48,0.12)"
            label="Notifications"
            onPress={() => setNotifOpen(true)}
          />
          <Sep />
          <SettingsRow
            icon="lock-closed-outline"
            iconColor="#FF9500"
            iconBg="rgba(255,149,0,0.12)"
            label="Restricted apps"
            value={`${restrictedCount}`}
            onPress={() => setRestrictedOpen(true)}
          />
          <Sep />
          <SettingsRow
            icon="hourglass-outline"
            iconColor="#34C759"
            iconBg="rgba(52,199,89,0.12)"
            label="Screen time settings"
            onPress={() => setStOpen(true)}
          />
          <Sep />
          <SettingsRow
            icon="information-circle-outline"
            iconColor="#8E8E93"
            iconBg="rgba(142,142,147,0.12)"
            label="About ScreenMindr"
            onPress={() => setAboutOpen(true)}
            isLast
          />
        </View>
      </Section>

      {/* Account section */}
      <Section title="Account">
        <View style={iosCss.groupedCard}>
          <SettingsRow
            icon="log-out-outline"
            iconColor="#FF3B30"
            iconBg="rgba(255,59,48,0.12)"
            label="Sign out"
            destructive
            onPress={confirmSignOut}
          />
          <Sep />
          <SettingsRow
            icon="trash-outline"
            iconColor="#FF3B30"
            iconBg="rgba(255,59,48,0.12)"
            label="Delete account"
            destructive
            onPress={confirmDeleteAccount}
            isLast
          />
        </View>
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
        ScreenMindr · v1.0.0 · Demo build
      </Text>

      {/* Modals */}
      <Modal
        visible={restrictedOpen}
        animationType="slide"
        onRequestClose={() => setRestrictedOpen(false)}
        presentationStyle="pageSheet"
      >
        <RestrictedAppsScreen onClose={() => setRestrictedOpen(false)} />
      </Modal>
      <Modal
        visible={familyOpen}
        animationType="slide"
        onRequestClose={() => setFamilyOpen(false)}
        presentationStyle="pageSheet"
      >
        <FamilyManageScreen onClose={() => setFamilyOpen(false)} />
      </Modal>
      <Modal
        visible={controlsOpen}
        animationType="slide"
        onRequestClose={() => setControlsOpen(false)}
        presentationStyle="pageSheet"
      >
        <ParentalControlsScreen onClose={() => setControlsOpen(false)} />
      </Modal>
      <Modal
        visible={notifOpen}
        animationType="slide"
        onRequestClose={() => setNotifOpen(false)}
        presentationStyle="pageSheet"
      >
        <NotificationsScreen onClose={() => setNotifOpen(false)} />
      </Modal>
      <Modal
        visible={stOpen}
        animationType="slide"
        onRequestClose={() => setStOpen(false)}
        presentationStyle="pageSheet"
      >
        <ScreenTimeSettingsScreen onClose={() => setStOpen(false)} />
      </Modal>
      <Modal
        visible={aboutOpen}
        animationType="slide"
        onRequestClose={() => setAboutOpen(false)}
        presentationStyle="pageSheet"
      >
        <AboutScreen onClose={() => setAboutOpen(false)} />
      </Modal>
      <Modal
        visible={editOpen}
        animationType="slide"
        onRequestClose={() => setEditOpen(false)}
        presentationStyle="pageSheet"
      >
        <EditProfileScreen onClose={() => setEditOpen(false)} />
      </Modal>
    </ScrollView>
  );
};

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

const SettingsRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value?: string;
  destructive?: boolean;
  onPress?: () => void;
  isLast?: boolean;
}> = ({ icon, iconColor, iconBg, label, value, destructive, onPress }) => (
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
        color: destructive ? "#FF3B30" : colors.text,
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
    {!destructive && (
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

export default memo(MenuScreen);
