import { useQuery } from "@apollo/client";
import * as Application from "expo-application";
import * as Clipboard from "expo-clipboard";
import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "../components/icons";
import {
  ME_QUERY,
  MY_FAMILY_QUERY,
  MY_REWARDS_QUERY,
  RESTRICTED_APPS_QUERY,
  TASKS_QUERY,
} from "../lib/queries";
import { colors, styles } from "../theme/styles";

const AboutScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data: meData } = useQuery<{
    me: { uid: string; email?: string; role: string };
  }>(ME_QUERY, { fetchPolicy: "cache-first" });
  const { data: famData } = useQuery<{
    myFamily: { id: string; childUids: string[] };
  }>(MY_FAMILY_QUERY, { fetchPolicy: "cache-first" });
  const { data: tasksData } = useQuery<{ tasks: { id: string }[] }>(
    TASKS_QUERY,
    { fetchPolicy: "cache-first" },
  );
  const { data: rewardsData } = useQuery<{ myRewards: { id: string }[] }>(
    MY_REWARDS_QUERY,
    { fetchPolicy: "cache-first" },
  );
  const { data: appsData } = useQuery<{ restrictedApps: { id: string }[] }>(
    RESTRICTED_APPS_QUERY,
    { fetchPolicy: "cache-first" },
  );

  const me = meData?.me;
  const family = famData?.myFamily;

  const copyId = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    Alert.alert(label, "Copied to clipboard");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.topBarBack}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>About</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand hero */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: 24,
            marginBottom: 18,
          }}
        >
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Ionicons name="shield-checkmark" size={42} color="#fff" />
          </View>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "700",
              color: colors.text,
              marginTop: 14,
              letterSpacing: -0.5,
            }}
          >
            ScreenMindr
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.muted,
              marginTop: 4,
              fontWeight: "600",
            }}
          >
            v{Application.nativeApplicationVersion ?? "1.0.0"} ·{" "}
            {Application.nativeBuildVersion ?? "demo"}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.muted,
              marginTop: 16,
              textAlign: "center",
              paddingHorizontal: 20,
              lineHeight: 18,
            }}
          >
            A learning prototype that lets parents convert chores and quizzes
            into earned screen time, points, or cash for kids.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Your usage</Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 18,
          }}
        >
          <UsageTile
            value={`${tasksData?.tasks?.length ?? 0}`}
            label="Tasks"
            color={colors.primary}
            bg={colors.primarySoft}
            icon="rocket"
          />
          <UsageTile
            value={`${rewardsData?.myRewards?.length ?? 0}`}
            label="Rewards"
            color={colors.points}
            bg={colors.pointsSoft}
            icon="trophy"
          />
          <UsageTile
            value={`${appsData?.restrictedApps?.length ?? 0}`}
            label="Apps"
            color={colors.text}
            bg={colors.surfaceAlt}
            icon="lock-closed"
          />
          <UsageTile
            value={`${family?.childUids?.length ?? 0}`}
            label="Children"
            color={colors.accent}
            bg={colors.accentSoft}
            icon="people"
          />
        </View>

        <Text style={styles.sectionLabel}>Your account</Text>
        <DetailRow
          label="Email"
          value={me?.email ?? "—"}
          onPress={me?.email ? () => copyId("Email", me.email!) : undefined}
        />
        <DetailRow
          label="Role"
          value={me?.role ?? "—"}
        />
        <DetailRow
          label="User ID"
          value={me?.uid?.slice(0, 12) + "…"}
          onPress={me?.uid ? () => copyId("User ID", me.uid) : undefined}
        />
        <DetailRow
          label="Family ID"
          value={family?.id ? family.id.slice(0, 12) + "…" : "—"}
          onPress={
            family?.id ? () => copyId("Family ID", family.id) : undefined
          }
        />

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Stack</Text>
        <StackRow icon="phone-portrait" name="Expo SDK" version="54" />
        <StackRow icon="logo-react" name="React Native" version="0.81" />
        <StackRow icon="server" name="NestJS GraphQL" version="11" />
        <StackRow
          icon="flame"
          name="Firebase"
          version="Auth · Firestore · Storage"
        />
        <StackRow
          icon="rocket"
          name="Apollo Client"
          version="3.14"
        />

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Legal</Text>
        <Pressable
          onPress={() =>
            Linking.openURL("https://expo.dev/").catch(() => {})
          }
          style={({ pressed }) => [
            styles.menuRow,
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={styles.menuRowIcon}>
            <Ionicons name="globe" size={18} color={colors.text} />
          </View>
          <Text style={styles.menuRowLabel}>Built with Expo</Text>
          <Ionicons
            name="open-outline"
            size={18}
            color={colors.muted}
          />
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert(
              "Privacy",
              "Demo build — collects only your email, family pairing, and submission evidence. No analytics.",
            )
          }
          style={({ pressed }) => [
            styles.menuRow,
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={styles.menuRowIcon}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={colors.text}
            />
          </View>
          <Text style={styles.menuRowLabel}>Privacy</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.muted}
          />
        </Pressable>

        <Text style={[styles.footerNote, { marginTop: 22 }]}>
          ScreenMindr · Made with ❤ for families
        </Text>
      </ScrollView>
    </View>
  );
};

const UsageTile: React.FC<{
  value: string;
  label: string;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = ({ value, label, color, bg, icon }) => (
  <View
    style={{
      width: "48.5%",
      backgroundColor: bg,
      borderRadius: 16,
      padding: 14,
    }}
  >
    <Ionicons name={icon} size={18} color={color} />
    <Text
      style={{
        fontSize: 22,
        fontWeight: "700",
        color,
        marginTop: 6,
        letterSpacing: -0.5,
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        fontSize: 11,
        fontWeight: "700",
        color,
        opacity: 0.85,
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  </View>
);

const DetailRow: React.FC<{
  label: string;
  value: string;
  onPress?: () => void;
}> = ({ label, value, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [
      {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: colors.border,
      },
      pressed && onPress && { opacity: 0.7 },
    ]}
  >
    <Text
      style={{
        fontSize: 13,
        color: colors.muted,
        fontWeight: "600",
        flex: 1,
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        fontSize: 13,
        color: colors.text,
        fontWeight: "600",
        marginRight: onPress ? 8 : 0,
      }}
      numberOfLines={1}
    >
      {value}
    </Text>
    {onPress && <Ionicons name="copy" size={14} color={colors.muted} />}
  </Pressable>
);

const StackRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  version: string;
}> = ({ icon, name, version }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.border,
    }}
  >
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.surfaceAlt,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
      }}
    >
      <Ionicons name={icon} size={16} color={colors.text} />
    </View>
    <Text
      style={{
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: colors.text,
      }}
    >
      {name}
    </Text>
    <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>
      {version}
    </Text>
  </View>
);

export default AboutScreen;
