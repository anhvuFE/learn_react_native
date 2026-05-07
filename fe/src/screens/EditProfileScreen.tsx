import { useMutation, useQuery } from "@apollo/client";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "../components/icons";
import { ME_QUERY, UPDATE_MY_PROFILE } from "../lib/queries";
import { colors, styles } from "../theme/styles";

const EditProfileScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data } = useQuery<{
    me: { uid: string; name?: string; email?: string };
  }>(ME_QUERY, { fetchPolicy: "cache-first" });
  const [updateProfile, { loading }] = useMutation(UPDATE_MY_PROFILE, {
    refetchQueries: [{ query: ME_QUERY }],
    awaitRefetchQueries: true,
  });

  const [name, setName] = useState("");

  useEffect(() => {
    if (data?.me?.name) setName(data.me.name);
  }, [data?.me?.name]);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter your display name");
      return;
    }
    try {
      await updateProfile({ variables: { input: { name: trimmed } } });
      onClose();
    } catch (e) {
      Alert.alert("Failed", (e as Error).message);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.topBarBack}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Edit profile</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginBottom: 22 }}>
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 36,
                fontWeight: "700",
                letterSpacing: -0.5,
              }}
            >
              {(name || data?.me?.email || "?")[0]?.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: colors.muted,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Display name
        </Text>
        <TextInput
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
          editable={!loading}
          autoFocus
        />

        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: colors.muted,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            marginTop: 16,
            marginBottom: 6,
          }}
        >
          Email (read-only)
        </Text>
        <View
          style={{
            backgroundColor: colors.surfaceAlt,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 15, color: colors.muted }}>
            {data?.me?.email ?? "—"}
          </Text>
        </View>

        <View style={{ height: 22 }} />

        <Pressable
          onPress={save}
          disabled={loading}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            loading && { opacity: 0.6 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="save"
                size={16}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryButtonText}>Save</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default EditProfileScreen;
