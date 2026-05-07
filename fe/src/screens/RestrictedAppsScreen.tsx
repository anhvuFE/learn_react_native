import { useMutation, useQuery } from "@apollo/client";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import AppTile, { APP_BRAND_COLOR } from "../components/AppTile";
import { Ionicons } from "../components/icons";
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

export default RestrictedAppsScreen;
