import { useMutation, useQuery } from "@apollo/client";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import AppTile, { APP_BRAND_COLOR } from "../components/AppTile";
import { Ionicons } from "../components/icons";
import ScreenShield from "../../modules/expo-screen-shield";
import {
  ADD_RESTRICTED_APP,
  REMOVE_RESTRICTED_APP,
  RESTRICTED_APPS_QUERY,
} from "../lib/queries";
import { colors, styles } from "../theme/styles";

interface AppRow {
  id: string;
  appId: string;
  name: string;
  packageName?: string | null;
}

const RestrictedAppsScreen: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const { data, loading } = useQuery<{ restrictedApps: AppRow[] }>(
    RESTRICTED_APPS_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const [addApp, { loading: adding }] = useMutation(ADD_RESTRICTED_APP, {
    refetchQueries: [{ query: RESTRICTED_APPS_QUERY }],
  });
  const [removeApp] = useMutation(REMOVE_RESTRICTED_APP, {
    refetchQueries: [{ query: RESTRICTED_APPS_QUERY }],
  });

  const [showForm, setShowForm] = useState(false);
  const [appId, setAppId] = useState("");
  const [name, setName] = useState("");
  const [packageName, setPackageName] = useState("");

  const apps = data?.restrictedApps ?? [];

  async function handleAdd() {
    if (!appId.trim() || !name.trim()) {
      Alert.alert("Missing fields", "App ID and name are required");
      return;
    }
    try {
      await addApp({
        variables: {
          input: {
            appId: appId.trim().toLowerCase(),
            name: name.trim(),
            packageName: packageName.trim() || undefined,
          },
        },
      });
      setAppId("");
      setName("");
      setPackageName("");
      setShowForm(false);
    } catch (e) {
      Alert.alert("Failed", (e as Error).message);
    }
  }

  function confirmRemove(app: AppRow) {
    Alert.alert(`Remove ${app.name}?`, "Child will see it unblocked next sync.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeApp({ variables: { id: app.id } });
          } catch (e) {
            Alert.alert("Failed", (e as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.topBarBack}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Restricted apps</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 18,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        <NativeShieldSection />

        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: colors.muted,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          Family-shared list
        </Text>

        {loading && apps.length === 0 ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.appsGrid}>
            {apps.map((app, i) => (
              <Pressable
                key={app.id}
                onLongPress={() => confirmRemove(app)}
                onPress={() => confirmRemove(app)}
                style={({ pressed }) => [
                  pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                ]}
              >
                <AppTile id={app.appId} name={app.name} index={i} />
              </Pressable>
            ))}
          </View>
        )}

        <Text
          style={{
            fontSize: 12,
            color: colors.muted,
            textAlign: "center",
            marginTop: 6,
            marginBottom: 18,
          }}
        >
          Tap an app to remove
        </Text>

        {!showForm ? (
          <Pressable
            onPress={() => setShowForm(true)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Ionicons
              name="add-circle"
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryButtonText}>Add restricted app</Text>
          </Pressable>
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 12,
                letterSpacing: -0.3,
              }}
            >
              New app
            </Text>

            <Text style={fieldLabel}>App ID</Text>
            <TextInput
              style={fieldInput}
              value={appId}
              onChangeText={setAppId}
              placeholder="tiktok, instagram, …"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!adding}
            />

            <Text style={fieldLabel}>Display name</Text>
            <TextInput
              style={fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="TikTok"
              placeholderTextColor={colors.muted}
              editable={!adding}
            />

            <Text style={fieldLabel}>Package name (optional)</Text>
            <TextInput
              style={fieldInput}
              value={packageName}
              onChangeText={setPackageName}
              placeholder="com.example.app"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!adding}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={() => {
                  setShowForm(false);
                  setAppId("");
                  setName("");
                  setPackageName("");
                }}
                style={({ pressed }) => [
                  styles.ghostButton,
                  { flex: 1 },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.ghostButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                disabled={adding}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { flex: 1 },
                  pressed && styles.primaryButtonPressed,
                  adding && { opacity: 0.6 },
                ]}
              >
                {adding ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Add</Text>
                )}
              </Pressable>
            </View>

            <Text
              style={{
                fontSize: 11,
                color: colors.muted,
                marginTop: 12,
                lineHeight: 16,
              }}
            >
              Known brand IDs:{" "}
              {Object.keys(APP_BRAND_COLOR).join(", ")}. Other IDs use a
              default tile.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const fieldLabel = {
  fontSize: 12,
  fontWeight: "700" as const,
  color: colors.muted,
  marginTop: 12,
  marginBottom: 6,
  letterSpacing: 0.4,
  textTransform: "uppercase" as const,
};

const fieldInput = {
  backgroundColor: colors.surfaceAlt,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
  color: colors.text,
  borderWidth: 1,
  borderColor: colors.border,
};

const NativeShieldSection: React.FC = () => {
  const [authorized, setAuthorized] = useState(false);
  const [shielded, setShielded] = useState(false);
  const [count, setCount] = useState(0);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const a = await ScreenShield.isAuthorized();
      const s = await ScreenShield.isShielded();
      const c = await ScreenShield.selectedAppsCount();
      const e = await ScreenShield.getUnshieldEndsAt();
      setAuthorized(a);
      setShielded(s);
      setCount(c);
      setEndsAt(e);
    } catch {}
  };

  useEffect(() => {
    refresh();
  }, []);

  if (Platform.OS !== "ios") {
    return (
      <View
        style={{
          backgroundColor: colors.surfaceAlt,
          borderRadius: 14,
          padding: 14,
          marginBottom: 4,
        }}
      >
        <Text style={{ fontSize: 12, color: colors.muted }}>
          Device-level shield is iOS-only. Android uses Accessibility Service
          (coming).
        </Text>
      </View>
    );
  }

  const requestAuth = async () => {
    setBusy(true);
    try {
      const ok = await ScreenShield.requestAuthorization();
      if (!ok) {
        Alert.alert(
          "Family Controls denied",
          "Open Settings → Screen Time and grant access for ScreenMindr.",
        );
      }
      await refresh();
    } catch (e) {
      Alert.alert("Auth failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pick = async () => {
    setBusy(true);
    try {
      await ScreenShield.presentPicker();
      await refresh();
    } catch (e) {
      Alert.alert("Picker failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const lockNow = async () => {
    setBusy(true);
    try {
      await ScreenShield.shieldNow();
      await refresh();
    } catch (e) {
      Alert.alert("Shield failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const minutesLeft = endsAt
    ? Math.max(
        0,
        Math.round((new Date(endsAt).getTime() - Date.now()) / 60000),
      )
    : 0;

  return (
    <View
      style={{
        backgroundColor: colors.text,
        borderRadius: 18,
        padding: 18,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Ionicons name="shield-checkmark" size={20} color="#fff" />
        <Text
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 0.6,
            textTransform: "uppercase",
            marginLeft: 6,
          }}
        >
          Device-level shield (iOS)
        </Text>
      </View>

      <Text
        style={{
          color: "#fff",
          fontSize: 14,
          fontWeight: "600",
          marginBottom: 4,
        }}
      >
        {!authorized
          ? "Not authorized yet"
          : count === 0
            ? "No apps picked"
            : shielded
              ? `${count} app(s) blocked`
              : `${count} app(s) — unlocked${minutesLeft > 0 ? ` for ${minutesLeft} min` : ""}`}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 14 }}>
        {!authorized
          ? "Grant Family Controls so ScreenMindr can block selected apps at the OS level."
          : count === 0
            ? "Pick which apps stay locked until your child earns screen time."
            : shielded
              ? "Apps will unlock automatically when reward is granted."
              : "Apps will lock again when timer ends."}
      </Text>

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {!authorized ? (
          <Pressable
            disabled={busy}
            onPress={requestAuth}
            style={{
              backgroundColor: colors.accent,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 999,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons name="key" size={14} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginLeft: 6 }}>
              Authorize
            </Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              disabled={busy}
              onPress={pick}
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 999,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="apps" size={14} color="#fff" />
              <Text
                style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginLeft: 6 }}
              >
                {count > 0 ? "Re-pick apps" : "Pick apps"}
              </Text>
            </Pressable>
            {count > 0 && (
              <Pressable
                disabled={busy}
                onPress={lockNow}
                style={{
                  backgroundColor: shielded ? "rgba(255,255,255,0.08)" : "#FBBF24",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={shielded ? "checkmark" : "lock-closed"}
                  size={14}
                  color={shielded ? "rgba(255,255,255,0.7)" : "#000"}
                />
                <Text
                  style={{
                    color: shielded ? "rgba(255,255,255,0.7)" : "#000",
                    fontSize: 13,
                    fontWeight: "700",
                    marginLeft: 6,
                  }}
                >
                  {shielded ? "Locked" : "Lock now"}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default RestrictedAppsScreen;
