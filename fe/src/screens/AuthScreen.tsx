import { useMutation } from "@apollo/client";
import {
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "../components/icons";
import { auth } from "../lib/firebase";
import { PAIR_CHILD } from "../lib/queries";
import { colors, styles } from "../theme/styles";

type Mode = "parent-login" | "parent-signup" | "child-pair";

const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>("parent-login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [pairChild] = useMutation<{
    pairChild: { customToken: string; child: { uid: string; name: string } };
  }>(PAIR_CHILD);

  async function handleParentSignIn() {
    if (!email.trim() || !password) {
      Alert.alert("Missing", "Email and password required");
      return;
    }
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      Alert.alert("Sign in failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleParentSignUp() {
    if (!email.trim() || !password) {
      Alert.alert("Missing", "Email and password required");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Password too short", "Minimum 6 characters");
      return;
    }
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      Alert.alert("Sign up failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleChildPair() {
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length < 4) {
      Alert.alert("Invalid code", "Enter the pairing code from your parent");
      return;
    }
    setBusy(true);
    try {
      const r = await pairChild({ variables: { code: cleaned } });
      const customToken = r.data?.pairChild?.customToken;
      if (!customToken) throw new Error("No custom token returned");
      await signInWithCustomToken(auth, customToken);
    } catch (e) {
      Alert.alert("Pairing failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const isParent = mode === "parent-login" || mode === "parent-signup";
  const isSignup = mode === "parent-signup";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.greetingRow, { marginTop: 20 }]}>
          <View style={[styles.brandLogo, { width: 56, height: 56, borderRadius: 14 }]}>
            <Ionicons name="shield-checkmark" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.brandTitle}>ScreenMindr</Text>
            <Text style={styles.brandSub}>
              {isParent ? "Sign in as a parent" : "Pair this device with your parent"}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 999,
            padding: 4,
            marginVertical: 18,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => setMode("parent-login")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 999,
              alignItems: "center",
              backgroundColor: isParent ? colors.primary : "transparent",
            }}
          >
            <Text
              style={{
                fontWeight: "800",
                color: isParent ? "#fff" : colors.muted,
                fontSize: 13,
                letterSpacing: 0.5,
              }}
            >
              PARENT
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("child-pair")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 999,
              alignItems: "center",
              backgroundColor: !isParent ? colors.primary : "transparent",
            }}
          >
            <Text
              style={{
                fontWeight: "800",
                color: !isParent ? "#fff" : colors.muted,
                fontSize: 13,
                letterSpacing: 0.5,
              }}
            >
              CHILD
            </Text>
          </Pressable>
        </View>

        {isParent ? (
          <View>
            <Text style={styles.rewardChooseLabel}>Email</Text>
            <TextInput
              style={authInputStyle}
              value={email}
              onChangeText={setEmail}
              placeholder="parent@example.com"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              editable={!busy}
            />

            <Text style={[styles.rewardChooseLabel, { marginTop: 14 }]}>
              Password
            </Text>
            <TextInput
              style={authInputStyle}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoCapitalize="none"
              editable={!busy}
            />

            <View style={{ height: 18 }} />

            <Pressable
              disabled={busy}
              onPress={isSignup ? handleParentSignUp : handleParentSignIn}
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
                    name={isSignup ? "person-add" : "log-in"}
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryButtonText}>
                    {isSignup ? "Sign up" : "Sign in"}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => setMode(isSignup ? "parent-login" : "parent-signup")}
              style={{ marginTop: 14, alignItems: "center" }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {isSignup
                  ? "Already have an account? Sign in"
                  : "New parent? Create an account"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <Text style={styles.rewardChooseLabel}>Pairing code</Text>
            <TextInput
              style={[
                authInputStyle,
                {
                  fontSize: 22,
                  letterSpacing: 6,
                  textAlign: "center",
                  fontWeight: "800",
                },
              ]}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="A1B2C3"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              editable={!busy}
            />

            <Text
              style={{
                fontSize: 12,
                color: colors.muted,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Ask your parent to generate a code from their account
            </Text>

            <View style={{ height: 18 }} />

            <Pressable
              disabled={busy}
              onPress={handleChildPair}
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
                    name="link"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryButtonText}>Pair this device</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        <Text style={[styles.footerNote, { marginTop: 32 }]}>
          Demo build · ScreenMindr
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const authInputStyle = {
  backgroundColor: colors.surface,
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  color: colors.text,
  borderWidth: 1,
  borderColor: colors.border,
};

export default AuthScreen;
