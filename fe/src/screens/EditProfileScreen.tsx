import { useMutation, useQuery } from "@apollo/client";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
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
import {
  ME_QUERY,
  REQUEST_AVATAR_UPLOAD,
  UPDATE_MY_PROFILE,
} from "../lib/queries";
import { colors, styles } from "../theme/styles";

const EditProfileScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data, refetch } = useQuery<{
    me: {
      uid: string;
      name?: string;
      email?: string;
      photoDownloadUrl?: string;
    };
  }>(ME_QUERY, { fetchPolicy: "cache-first" });
  const [updateProfile, { loading }] = useMutation(UPDATE_MY_PROFILE, {
    refetchQueries: [{ query: ME_QUERY }],
    awaitRefetchQueries: true,
  });
  const [requestAvatarUpload] = useMutation<{ requestAvatarUpload: string }>(
    REQUEST_AVATAR_UPLOAD,
  );

  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data?.me?.name) setName(data.me.name);
  }, [data?.me?.name]);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to set an avatar.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (r.canceled) return;
    const uri = r.assets?.[0]?.uri;
    if (!uri) return;
    try {
      setUploading(true);
      const contentType = uri.toLowerCase().endsWith(".png")
        ? "image/png"
        : "image/jpeg";
      const res = await requestAvatarUpload({ variables: { contentType } });
      const url = res.data?.requestAvatarUpload;
      if (!url) throw new Error("No upload URL");
      const upload = await FileSystem.uploadAsync(url, uri, {
        httpMethod: "PUT",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: { "Content-Type": contentType },
      });
      if (upload.status >= 300) {
        throw new Error(`Upload ${upload.status}`);
      }
      await refetch();
    } catch (e) {
      Alert.alert("Avatar upload failed", (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

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
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
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
          <Pressable
            onPress={pickAvatar}
            disabled={uploading}
            style={({ pressed }) => [
              {
                width: 92,
                height: 92,
                borderRadius: 46,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            {data?.me?.photoDownloadUrl ? (
              <Image
                source={data.me.photoDownloadUrl}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
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
            )}
            {uploading && (
              <View
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={pickAvatar}
            disabled={uploading}
            style={{ marginTop: 10 }}
          >
            <Text
              style={{
                fontSize: 12,
                color: colors.accent,
                fontWeight: "700",
              }}
            >
              {uploading ? "Uploading…" : "Change photo"}
            </Text>
          </Pressable>
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
