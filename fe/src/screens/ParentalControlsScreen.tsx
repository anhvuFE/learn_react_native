import { useMutation, useQuery } from "@apollo/client";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Ionicons } from "../components/icons";
import { ME_QUERY, UPDATE_MY_SETTINGS } from "../lib/queries";
import { colors, styles } from "../theme/styles";

interface MeData {
  me: {
    uid: string;
    autoApproveQuiz?: boolean;
    autoApproveWalk?: boolean;
    requirePhotoApproval?: boolean;
    notifyOnSubmit?: boolean;
  };
}

const ParentalControlsScreen: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const { data } = useQuery<MeData>(ME_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [updateSettings] = useMutation(UPDATE_MY_SETTINGS, {
    refetchQueries: [{ query: ME_QUERY }],
  });

  const [autoApproveQuiz, setAutoApproveQuiz] = useState(true);
  const [autoApproveWalk, setAutoApproveWalk] = useState(true);
  const [requirePhotoApproval, setRequirePhotoApproval] = useState(true);
  const [notifyOnSubmit, setNotifyOnSubmit] = useState(true);

  // Load from BE
  useEffect(() => {
    const me = data?.me;
    if (!me) return;
    setAutoApproveQuiz(me.autoApproveQuiz ?? true);
    setAutoApproveWalk(me.autoApproveWalk ?? true);
    setRequirePhotoApproval(me.requirePhotoApproval ?? true);
    setNotifyOnSubmit(me.notifyOnSubmit ?? true);
  }, [data?.me]);

  // Save on toggle
  const persist = (patch: Record<string, boolean>) => {
    updateSettings({ variables: { input: patch } }).catch(() => {});
  };

  const onAutoQuiz = (v: boolean) => {
    setAutoApproveQuiz(v);
    persist({ autoApproveQuiz: v });
  };
  const onAutoWalk = (v: boolean) => {
    setAutoApproveWalk(v);
    persist({ autoApproveWalk: v });
  };
  const onPhoto = (v: boolean) => {
    setRequirePhotoApproval(v);
    persist({ requirePhotoApproval: v });
  };
  const onNotify = (v: boolean) => {
    setNotifyOnSubmit(v);
    persist({ notifyOnSubmit: v });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.topBarBack}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Parental controls</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: colors.primarySoft,
            borderRadius: 18,
            padding: 16,
            marginBottom: 18,
            flexDirection: "row",
            gap: 12,
          }}
        >
          <Ionicons
            name="shield-checkmark"
            size={22}
            color={colors.primary}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              color: colors.primaryDark,
              lineHeight: 19,
            }}
          >
            Toggles save to your profile in real time. Server enforces these on
            new submissions.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Approval rules</Text>

        <SettingRow
          icon="school"
          iconColor={colors.accent}
          iconBg={colors.accentSoft}
          title="Auto-approve quiz"
          subtitle="Pass with score ≥ 80% → reward issued automatically"
          value={autoApproveQuiz}
          onValueChange={onAutoQuiz}
        />

        <SettingRow
          icon="walk"
          iconColor={colors.primary}
          iconBg={colors.primarySoft}
          title="Auto-approve walk"
          subtitle="Pedometer hits target → reward issued automatically"
          value={autoApproveWalk}
          onValueChange={onAutoWalk}
        />

        <SettingRow
          icon="camera"
          iconColor={colors.warning}
          iconBg={colors.warningSoft}
          title="Photo requires approval"
          subtitle="Always wait for parent to approve photo evidence"
          value={requirePhotoApproval}
          onValueChange={onPhoto}
        />

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
          Notifications
        </Text>

        <SettingRow
          icon="notifications"
          iconColor={colors.text}
          iconBg={colors.surfaceAlt}
          title="Notify when child submits"
          subtitle="Push notification sent to parent device"
          value={notifyOnSubmit}
          onValueChange={onNotify}
        />

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Limits</Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.muted,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            Quiz pass threshold
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.text,
              marginTop: 4,
              letterSpacing: -0.5,
            }}
          >
            80%
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            Server constant · adjustable via env in production
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.muted,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            Pairing code TTL
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.text,
              marginTop: 4,
              letterSpacing: -0.5,
            }}
          >
            24 hours
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            Codes auto-expire after 24h
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const SettingRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}> = ({ icon, iconColor, iconBg, title, subtitle, value, onValueChange }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 14,
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
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: iconBg,
        marginRight: 12,
      }}
    >
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={{ flex: 1, marginRight: 12 }}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
          letterSpacing: -0.2,
        }}
      >
        {title}
      </Text>
      <Text
        style={{ fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 16 }}
      >
        {subtitle}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor="#fff"
    />
  </View>
);

export default ParentalControlsScreen;
