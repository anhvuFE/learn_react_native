import { useMutation } from "@apollo/client";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
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
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      try {
        await sendEmailVerification(cred.user);
      } catch {}
    } catch (e) {
      Alert.alert("Sign up failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert("Email required", "Enter your email above first");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Reset link sent",
        "Check your inbox for the password reset email.",
      );
    } catch (e) {
      Alert.alert("Failed", (e as Error).message);
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
      style={{ flex: 1, backgroundColor: "#F2F2F7" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand hero */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: 28,
            paddingHorizontal: 22,
          }}
        >
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              backgroundColor: "#5856D6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Ionicons name="shield-checkmark" size={42} color="#fff" />
          </View>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "700",
              color: "#0A0A0F",
              letterSpacing: -0.5,
            }}
          >
            ScreenMindr
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: "#6E6E73",
              marginTop: 4,
              textAlign: "center",
            }}
          >
            {isParent
              ? "Manage your kid's screen time"
              : "Pair this device with a parent"}
          </Text>
        </View>

        {/* Role segmented control */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "rgba(120,120,128,0.16)",
            borderRadius: 9,
            padding: 2,
            marginHorizontal: 18,
            marginBottom: 14,
          }}
        >
          {(["parent-login", "child-pair"] as const).map((m) => {
            const active =
              (m === "parent-login" && isParent) ||
              (m === "child-pair" && !isParent);
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 7,
                  alignItems: "center",
                  backgroundColor: active ? "#FFFFFF" : "transparent",
                  ...(active && {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }),
                }}
              >
                <Text
                  style={{
                    fontWeight: active ? "600" : "500",
                    color: active ? "#0A0A0F" : "#6E6E73",
                    fontSize: 14,
                    letterSpacing: -0.1,
                  }}
                >
                  {m === "parent-login" ? "Parent" : "Child"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Form section */}
        <View style={{ marginHorizontal: 18 }}>
          <Text style={iosSectionLabel}>
            {isParent
              ? isSignup
                ? "CREATE PARENT ACCOUNT"
                : "PARENT SIGN IN"
              : "PAIRING CODE"}
          </Text>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {isParent ? (
              <>
                <View style={iosFieldRow}>
                  <Ionicons
                    name="mail-outline"
                    size={17}
                    color="#5856D6"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    style={iosFieldInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="parent@example.com"
                    placeholderTextColor="#C7C7CC"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    editable={!busy}
                  />
                </View>
                <View style={iosFieldSep} />
                <View style={iosFieldRow}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={17}
                    color="#5856D6"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    style={iosFieldInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#C7C7CC"
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!busy}
                  />
                </View>
              </>
            ) : (
              <View style={iosFieldRow}>
                <Ionicons
                  name="key-outline"
                  size={17}
                  color="#5856D6"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={[
                    iosFieldInput,
                    {
                      fontSize: 22,
                      letterSpacing: 6,
                      textAlign: "center",
                      fontWeight: "700",
                    },
                  ]}
                  value={code}
                  onChangeText={(t) => setCode(t.toUpperCase())}
                  placeholder="A1B2C3"
                  placeholderTextColor="#C7C7CC"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                  editable={!busy}
                />
              </View>
            )}
          </View>

          {isParent && !isSignup && (
            <Pressable
              onPress={handleForgotPassword}
              style={{ marginTop: 8, alignSelf: "flex-end" }}
            >
              <Text
                style={{
                  color: "#5856D6",
                  fontSize: 13,
                  fontWeight: "500",
                }}
              >
                Forgot password?
              </Text>
            </Pressable>
          )}

          {!isParent && (
            <Text
              style={{
                fontSize: 12,
                color: "#6E6E73",
                marginTop: 8,
                marginLeft: 4,
                lineHeight: 17,
              }}
            >
              Ask your parent to generate a code from their dashboard.
            </Text>
          )}

          <View style={{ height: 22 }} />

          {/* Submit button */}
          <Pressable
            disabled={busy}
            onPress={
              isParent
                ? isSignup
                  ? handleParentSignUp
                  : handleParentSignIn
                : handleChildPair
            }
            style={({ pressed }) => [
              {
                backgroundColor: "#5856D6",
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                opacity: pressed || busy ? 0.85 : 1,
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={
                    isParent ? (isSignup ? "person-add" : "log-in") : "link"
                  }
                  size={16}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "600",
                    letterSpacing: -0.2,
                  }}
                >
                  {isParent
                    ? isSignup
                      ? "Create account"
                      : "Sign in"
                    : "Pair this device"}
                </Text>
              </>
            )}
          </Pressable>

          {isParent && (
            <Pressable
              onPress={() =>
                setMode(isSignup ? "parent-login" : "parent-signup")
              }
              style={{ marginTop: 14, alignItems: "center" }}
            >
              <Text
                style={{
                  color: "#5856D6",
                  fontWeight: "500",
                  fontSize: 14,
                }}
              >
                {isSignup
                  ? "Already have an account? Sign in"
                  : "New here? Create an account"}
              </Text>
            </Pressable>
          )}
        </View>

        <Text
          style={{
            fontSize: 12,
            color: "#6E6E73",
            textAlign: "center",
            marginTop: 32,
            paddingHorizontal: 22,
            lineHeight: 17,
          }}
        >
          ScreenMindr · Demo build · v1.0
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const iosSectionLabel = {
  fontSize: 12,
  fontWeight: "500" as const,
  color: "#6E6E73",
  letterSpacing: 0.4,
  textTransform: "uppercase" as const,
  marginLeft: 18,
  marginBottom: 6,
};

const iosFieldRow = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  paddingHorizontal: 14,
  paddingVertical: 12,
};

const iosFieldSep = {
  height: 0.5,
  backgroundColor: "rgba(60,60,67,0.18)",
  marginLeft: 41,
};

const iosFieldInput = {
  flex: 1,
  fontSize: 16,
  color: "#0A0A0F",
};

export default AuthScreen;
