import { useQuery } from "@apollo/client";
import * as Application from "expo-application";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
            paddingTop: 18,
            paddingBottom: 22,
          }}
        >
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 20,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="shield-checkmark" size={38} color="#fff" />
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: colors.text,
              marginTop: 14,
              letterSpacing: -0.4,
            }}
          >
            ScreenMindr
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.muted,
              marginTop: 3,
              fontWeight: "500",
              letterSpacing: 0.1,
            }}
          >
            Version {Application.nativeApplicationVersion ?? "1.0.0"}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.muted,
              marginTop: 14,
              textAlign: "center",
              paddingHorizontal: 24,
              lineHeight: 19,
              letterSpacing: -0.1,
            }}
          >
            Turn chores and quizzes into earned screen time for kids.
          </Text>
        </View>

        {/* Stats strip — Apple-style horizontal */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: 14,
            marginBottom: 22,
          }}
        >
          <StatCell
            value={`${tasksData?.tasks?.length ?? 0}`}
            label="Tasks"
          />
          <StatDivider />
          <StatCell
            value={`${rewardsData?.myRewards?.length ?? 0}`}
            label="Rewards"
          />
          <StatDivider />
          <StatCell
            value={`${appsData?.restrictedApps?.length ?? 0}`}
            label="Apps"
          />
          <StatDivider />
          <StatCell
            value={`${family?.childUids?.length ?? 0}`}
            label={(family?.childUids?.length ?? 0) === 1 ? "Child" : "Kids"}
          />
        </View>

        <Text style={styles.sectionLabel}>{t("settings.language")}</Text>
        <LanguageRow />

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Your account</Text>
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

const StatCell: React.FC<{ value: string; label: string }> = ({
  value,
  label,
}) => (
  <View style={{ flex: 1, alignItems: "center" }}>
    <Text
      style={{
        fontSize: 22,
        fontWeight: "700",
        color: colors.text,
        letterSpacing: -0.5,
        fontVariant: ["tabular-nums"],
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        fontSize: 11,
        fontWeight: "600",
        color: colors.muted,
        marginTop: 2,
        letterSpacing: 0.2,
      }}
    >
      {label}
    </Text>
  </View>
);

const StatDivider: React.FC = () => (
  <View
    style={{
      width: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    }}
  />
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

const LanguageRow: React.FC = () => {
  const { i18n } = useTranslation();
  const langs = [
    { code: "en", label: "English" },
    { code: "vi", label: "Tiếng Việt" },
  ];
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        marginBottom: 6,
      }}
    >
      {langs.map((l) => {
        const active = i18n.resolvedLanguage === l.code;
        return (
          <Pressable
            key={l.code}
            onPress={() => i18n.changeLanguage(l.code)}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: active ? colors.text : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.text : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={{
                color: active ? "#fff" : colors.text,
                fontSize: 14,
                fontWeight: "700",
              }}
            >
              {l.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default AboutScreen;
