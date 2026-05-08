import { useMutation } from "@apollo/client";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "../components/icons";
import {
  getExpoPushToken,
  getPushPermissionStatus,
  requestPushPermission,
  scheduleTestNotification,
} from "../lib/notifications";
import { SET_PUSH_TOKEN } from "../lib/queries";
import { colors, styles } from "../theme/styles";

const NotificationsScreen: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const [permission, setPermission] = useState<
    Notifications.PermissionStatus | "checking"
  >("checking");
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [setPushToken] = useMutation(SET_PUSH_TOKEN);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const status = await getPushPermissionStatus();
    setPermission(status);
    if (status === "granted") {
      const t = await getExpoPushToken();
      setToken(t);
      if (t) {
        try {
          await setPushToken({ variables: { token: t } });
        } catch {}
      }
    } else {
      setToken(null);
    }
  }

  async function enable() {
    setBusy(true);
    try {
      const status = await requestPushPermission();
      setPermission(status);
      if (status === "granted") {
        const t = await getExpoPushToken();
        setToken(t);
        if (t) {
          await setPushToken({ variables: { token: t } });
          Alert.alert("Notifications on", "You'll get pushes for new submissions and approvals.");
        }
      } else if (status === "denied") {
        Alert.alert(
          "Permission denied",
          "Open Settings → Notifications to enable.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ],
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    Alert.alert(
      "Disable notifications?",
      "You won't get pushes anymore. You can re-enable here.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await setPushToken({ variables: { token: null } });
              setToken(null);
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  async function sendTest() {
    if (permission !== "granted") {
      Alert.alert("Enable first", "Turn on notifications to receive tests.");
      return;
    }
    await scheduleTestNotification();
    Alert.alert("Scheduled", "A test notification will arrive in 1 second.");
  }

  const isGranted = permission === "granted";
  const isRegistered = isGranted && !!token;

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.topBarBack}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Notifications</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero */}
        <View
          style={{
            backgroundColor: isRegistered ? colors.primary : "#0F172A",
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
              top: -40,
              right: -40,
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: isRegistered ? "#FBBF24" : "#7C3AED",
              opacity: 0.25,
            }}
          />
          <Ionicons
            name={isRegistered ? "notifications" : "notifications-off-outline"}
            size={28}
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
            Status
          </Text>
          <Text
            style={{
              color: "#fff",
              fontSize: 24,
              fontWeight: "700",
              marginTop: 4,
              letterSpacing: -0.4,
            }}
          >
            {permission === "checking"
              ? "Checking…"
              : isRegistered
                ? "Notifications on"
                : isGranted
                  ? "Permission granted, no token"
                  : permission === "denied"
                    ? "Blocked in Settings"
                    : "Not enabled"}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 13,
              marginTop: 6,
              lineHeight: 18,
            }}
          >
            {isRegistered
              ? "You'll be notified when a child submits, when parent approves, or when reward expires."
              : "Enable to get pushes for submissions, approvals, and reward expiry."}
          </Text>
        </View>

        {/* Action buttons */}
        {!isGranted ? (
          <Pressable
            onPress={enable}
            disabled={busy}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
              busy && { opacity: 0.6 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="notifications"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryButtonText}>
                  Enable notifications
                </Text>
              </>
            )}
          </Pressable>
        ) : (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={sendTest}
              style={({ pressed }) => [
                styles.primaryButton,
                { flex: 1 },
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Ionicons
                name="send"
                size={16}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.primaryButtonText}>Send test</Text>
            </Pressable>
            <Pressable
              onPress={disable}
              disabled={busy}
              style={({ pressed }) => [
                styles.ghostButton,
                {
                  flex: 1,
                  borderColor: colors.danger,
                  opacity: busy ? 0.5 : 1,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[styles.ghostButtonText, { color: colors.danger }]}
              >
                Turn off
              </Text>
            </Pressable>
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 22 }]}>
          What you'll get
        </Text>
        <NotifInfo
          icon="time-outline"
          color={colors.warning}
          title="New submission to review"
          subtitle="When child submits photo or timer task"
        />
        <NotifInfo
          icon="checkmark-circle-outline"
          color={colors.primary}
          title="Mission approved 🎉"
          subtitle="When parent approves child's submission"
        />
        <NotifInfo
          icon="close-circle-outline"
          color={colors.danger}
          title="Mission needs another try"
          subtitle="When parent rejects child's submission"
        />
        <NotifInfo
          icon="alarm-outline"
          color={colors.screenTime}
          title="Reward expiring soon"
          subtitle="2 minutes before screen-time reward ends"
        />

        {token && (
          <View
            style={{
              marginTop: 18,
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: colors.muted,
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}
            >
              Your token (debug)
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.text,
                marginTop: 4,
                fontFamily: "Courier",
              }}
              numberOfLines={2}
            >
              {token}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const NotifInfo: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
}> = ({ icon, color, title, subtitle }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
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
        backgroundColor: color + "22",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
      }}
    >
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
          letterSpacing: -0.2,
        }}
      >
        {title}
      </Text>
      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
        {subtitle}
      </Text>
    </View>
  </View>
);

export default NotificationsScreen;
