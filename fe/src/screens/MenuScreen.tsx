import { useMutation, useQuery } from "@apollo/client";
import * as Clipboard from "expo-clipboard";
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
import { colors, styles } from "../theme/styles";
import AboutScreen from "./AboutScreen";
import EditProfileScreen from "./EditProfileScreen";
import FamilyManageScreen from "./FamilyManageScreen";
import NotificationsScreen from "./NotificationsScreen";
import ParentalControlsScreen from "./ParentalControlsScreen";
import RestrictedAppsScreen from "./RestrictedAppsScreen";
import ScreenTimeSettingsScreen from "./ScreenTimeSettingsScreen";

const MenuRow = memo<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconBg?: string;
  iconColor?: string;
  value?: string;
  destructive?: boolean;
  index: number;
  onPress?: () => void;
}>(({ icon, label, iconBg, iconColor, value, destructive, index, onPress }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.menuRow,
          destructive && { borderColor: colors.dangerSoft },
          pressed && { opacity: 0.7, transform: [{ scale: 0.99 }] },
        ]}
      >
        <View
          style={[
            styles.menuRowIcon,
            iconBg ? { backgroundColor: iconBg } : null,
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={iconColor ?? colors.text}
          />
        </View>
        <Text
          style={[
            styles.menuRowLabel,
            destructive && { color: colors.danger },
          ]}
        >
          {label}
        </Text>
        {value && <Text style={styles.menuRowValue}>{value}</Text>}
        {!destructive && (
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        )}
      </Pressable>
    </Animated.View>
  );
});
MenuRow.displayName = "MenuRow";

const MenuScreen: React.FC = () => {
  const { signOut } = useAuth();
  const { data: meData } = useQuery<{
    me: { uid: string; name?: string; email?: string; role: "PARENT" | "CHILD"; familyId?: string };
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

  const displayName =
    me?.name ?? me?.email?.split("@")[0] ?? "Profile";
  const initial = (me?.name ?? me?.email ?? "?")[0]?.toUpperCase() ?? "?";
  const memberCount = (famData?.myFamily?.childUids?.length ?? 0) + 1;
  const activeCode = codesData?.myPairingCodes?.[0];

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

  const comingSoon = (label: string) =>
    Alert.alert(
      label,
      "This screen is on the roadmap — backend supports it, UI lands in the next milestone.",
      [{ text: "OK" }],
    );

  const copyCode = async () => {
    if (!activeCode) return;
    await Clipboard.setStringAsync(activeCode.code);
    Alert.alert("Copied", `Pairing code "${activeCode.code}" copied to clipboard.`);
  };

  const [familyOpen, setFamilyOpen] = useState(false);
  const showFamily = () => setFamilyOpen(true);

  const [restrictedOpen, setRestrictedOpen] = useState(false);
  const showRestrictedApps = () => setRestrictedOpen(true);

  const [controlsOpen, setControlsOpen] = useState(false);
  const showParentalControls = () => setControlsOpen(true);

  const [notifOpen, setNotifOpen] = useState(false);
  const showNotifications = () => setNotifOpen(true);

  const [stOpen, setStOpen] = useState(false);
  const showScreenTime = () => setStOpen(true);

  const [aboutOpen, setAboutOpen] = useState(false);
  const showAbout = () => setAboutOpen(true);

  const [editOpen, setEditOpen] = useState(false);
  const showEdit = () => setEditOpen(true);

  const profileScale = useRef(new Animated.Value(0.94)).current;
  const profileOpacity = useRef(new Animated.Value(0)).current;
  const avatarPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(profileOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.spring(profileScale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulse, {
          toValue: 1.05,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [profileOpacity, profileScale, avatarPulse]);

  return (
    <ScrollView
      style={styles.safeArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      scrollEventThrottle={16}
    >
      <View style={styles.brandRow}>
        <View style={[styles.brandLogo, { backgroundColor: colors.text }]}>
          <Ionicons name="menu" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Menu</Text>
          <Text style={styles.brandSub}>Family, settings, and more.</Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.profileBlock,
          { opacity: profileOpacity, transform: [{ scale: profileScale }] },
        ]}
      >
        <Animated.View
          style={[styles.avatar, { transform: [{ scale: avatarPulse }] }]}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileMeta}>
            {isParent
              ? `Family of ${memberCount}`
              : "Paired with parent"}
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
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
              }}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: colors.primary,
              }}
            >
              {isParent ? "Parent · Active" : "Child · Active"}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={showEdit}
          style={({ pressed }) => [
            {
              padding: 6,
              opacity: pressed ? 0.5 : 1,
            },
          ]}
        >
          <Ionicons name="pencil" size={18} color={colors.muted} />
        </Pressable>
      </Animated.View>

      {isParent && (
        <View style={styles.pairingCard}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text style={styles.pairingLabel}>
                {activeCode ? "Active pairing code" : "No active code"}
              </Text>
              <Text style={styles.pairingCode}>
                {activeCode
                  ? `${activeCode.code.slice(0, 3)} · ${activeCode.code.slice(3)}`
                  : "—"}
              </Text>
            </View>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                backgroundColor: colors.surfaceAlt,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="qr-code" size={36} color={colors.text} />
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: 18,
              marginTop: 12,
              alignItems: "center",
            }}
          >
            {activeCode && (
              <Pressable
                onPress={copyCode}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons name="copy" size={14} color={colors.primary} />
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  Copy code
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleGenerateCode}
              disabled={generatingCode}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  opacity: pressed || generatingCode ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons
                name={activeCode ? "refresh" : "add-circle"}
                size={14}
                color={colors.primary}
              />
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {generatingCode
                  ? "Generating…"
                  : activeCode
                    ? "Generate new"
                    : "Generate code"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>Family</Text>
      <MenuRow
        index={0}
        icon="people"
        iconBg={colors.accentSoft}
        iconColor={colors.accent}
        label="Manage family"
        value={`${memberCount} ${memberCount === 1 ? "member" : "members"}`}
        onPress={showFamily}
      />
      <MenuRow
        index={1}
        icon="shield-checkmark"
        iconBg={colors.primarySoft}
        iconColor={colors.primary}
        label="Parental controls"
        onPress={showParentalControls}
      />

      <Text style={styles.sectionLabel}>App</Text>
      <MenuRow
        index={2}
        icon="notifications"
        label="Notifications"
        onPress={showNotifications}
      />
      <MenuRow
        index={3}
        icon="lock-closed"
        label="Restricted apps"
        value={`${appsData?.restrictedApps?.length ?? 0}`}
        onPress={showRestrictedApps}
      />
      <MenuRow
        index={4}
        icon="time"
        iconBg={colors.screenTimeSoft}
        iconColor={colors.screenTime}
        label="Screen time settings"
        onPress={showScreenTime}
      />
      <MenuRow
        index={5}
        icon="information-circle"
        label="About ScreenMindr"
        onPress={showAbout}
      />

      <Text style={styles.sectionLabel}>Account</Text>
      <MenuRow
        index={6}
        icon="log-out"
        iconBg={colors.dangerSoft}
        iconColor={colors.danger}
        label="Sign out"
        destructive
        onPress={confirmSignOut}
      />
      <MenuRow
        index={7}
        icon="trash"
        iconBg={colors.dangerSoft}
        iconColor={colors.danger}
        label="Delete account"
        destructive
        onPress={confirmDeleteAccount}
      />

      <Text style={styles.footerNote}>ScreenMindr · v1.0.0 · Demo build</Text>

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

export default memo(MenuScreen);
