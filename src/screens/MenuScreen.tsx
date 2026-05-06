import React, { memo, useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "../components/icons";
import { colors, styles } from "../theme/styles";

const MenuRow = memo<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconBg?: string;
  iconColor?: string;
  value?: string;
  destructive?: boolean;
  index: number;
}>(({ icon, label, iconBg, iconColor, value, destructive, index }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={() => {}}
        style={({ pressed }) => [
          styles.menuRow,
          destructive && { borderColor: colors.dangerSoft },
          pressed && { opacity: 0.7, transform: [{ scale: 0.99 }] },
        ]}
      >
        <View
          style={[
            styles.menuRowIcon,
            iconBg ? { backgroundColor: iconBg } : null,
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={iconColor ?? colors.text}
          />
        </View>
        <Text
          style={[
            styles.menuRowLabel,
            destructive && { color: colors.danger },
          ]}
        >
          {label}
        </Text>
        {value && <Text style={styles.menuRowValue}>{value}</Text>}
        {!destructive && (
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        )}
      </Pressable>
    </Animated.View>
  );
});
MenuRow.displayName = "MenuRow";

const MenuScreen: React.FC = () => {
  const profileScale = useRef(new Animated.Value(0.94)).current;
  const profileOpacity = useRef(new Animated.Value(0)).current;
  const avatarPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(profileOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.spring(profileScale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulse, {
          toValue: 1.05,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [profileOpacity, profileScale, avatarPulse]);

  return (
    <ScrollView
      style={styles.safeArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      scrollEventThrottle={16}
    >
      <View style={styles.brandRow}>
        <View style={[styles.brandLogo, { backgroundColor: colors.text }]}>
          <Ionicons name="menu" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Menu</Text>
          <Text style={styles.brandSub}>Family, settings, and more.</Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.profileBlock,
          { opacity: profileOpacity, transform: [{ scale: profileScale }] },
        ]}
      >
        <Animated.View
          style={[styles.avatar, { transform: [{ scale: avatarPulse }] }]}
        >
          <Text style={styles.avatarText}>A</Text>
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>Alex Carter</Text>
          <Text style={styles.profileMeta}>Paired with Mom & Dad</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 6,
              gap: 6,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
              }}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: colors.primary,
              }}
            >
              Active · Level 3
            </Text>
          </View>
        </View>
        <Ionicons
          name="pencil"
          size={18}
          color={colors.muted}
        />
      </Animated.View>

      <View style={styles.pairingCard}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={styles.pairingLabel}>Pairing code</Text>
            <Text style={styles.pairingCode}>4F2A · 9K7Q</Text>
          </View>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              backgroundColor: colors.surfaceAlt,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="qr-code" size={36} color={colors.text} />
          </View>
        </View>
        <Pressable
          onPress={() => {}}
          style={({ pressed }) => [
            {
              marginTop: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons name="copy" size={14} color={colors.primary} />
          <Text
            style={{
              color: colors.primary,
              fontWeight: "700",
              fontSize: 13,
            }}
          >
            Copy code
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Family</Text>
      <MenuRow
        index={0}
        icon="people"
        iconBg={colors.accentSoft}
        iconColor={colors.accent}
        label="Manage family"
        value="3 members"
      />
      <MenuRow
        index={1}
        icon="shield-checkmark"
        iconBg={colors.primarySoft}
        iconColor={colors.primary}
        label="Parental controls"
      />

      <Text style={styles.sectionLabel}>App</Text>
      <MenuRow
        index={2}
        icon="notifications"
        label="Notifications"
        value="On"
      />
      <MenuRow
        index={3}
        icon="lock-closed"
        label="Restricted apps"
        value="5"
      />
      <MenuRow
        index={4}
        icon="time"
        iconBg={colors.screenTimeSoft}
        iconColor={colors.screenTime}
        label="Screen time settings"
      />
      <MenuRow
        index={5}
        icon="information-circle"
        label="About ScreenMindr"
      />

      <Text style={styles.sectionLabel}>Account</Text>
      <MenuRow
        index={6}
        icon="log-out"
        iconBg={colors.dangerSoft}
        iconColor={colors.danger}
        label="Sign out"
        destructive
      />

      <Text style={styles.footerNote}>ScreenMindr · v1.0.0 · Demo build</Text>
    </ScrollView>
  );
};

export default MenuScreen;
