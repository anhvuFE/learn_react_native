import { sendEmailVerification } from "firebase/auth";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useAuth } from "../lib/auth-context";
import { colors } from "../theme/styles";
import { Ionicons } from "./icons";

const EmailVerificationBanner: React.FC = () => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || !user.email || user.emailVerified || dismissed) return null;

  const resend = async () => {
    setBusy(true);
    try {
      await sendEmailVerification(user);
      Alert.alert(
        "Verification email sent",
        `Check ${user.email} for a confirmation link.`,
      );
    } catch (e) {
      Alert.alert("Failed to send", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.warning,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Ionicons name="mail-unread" size={16} color="#fff" />
      <Text
        style={{
          color: "#fff",
          fontSize: 12,
          fontWeight: "600",
          flex: 1,
          marginLeft: 8,
        }}
        numberOfLines={2}
      >
        Verify your email — open the link sent to {user.email}
      </Text>
      <Pressable
        disabled={busy}
        onPress={resend}
        style={{
          backgroundColor: "rgba(255,255,255,0.22)",
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          marginLeft: 8,
        }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
            Resend
          </Text>
        )}
      </Pressable>
      <Pressable
        onPress={() => setDismissed(true)}
        style={{ marginLeft: 6, padding: 4 }}
      >
        <Ionicons name="close" size={14} color="rgba(255,255,255,0.85)" />
      </Pressable>
    </View>
  );
};

export default EmailVerificationBanner;
