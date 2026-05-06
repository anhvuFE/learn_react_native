import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import AppTile from "../components/AppTile";
import { Ionicons } from "../components/icons";
import { restrictedApps } from "../data/mockData";
import { colors, styles } from "../theme/styles";

interface Props {
  endsAt: number;
  onExpire: () => void;
  onLockNow: () => void;
}

function format(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const UnlockedScreen: React.FC<Props> = ({ endsAt, onExpire, onLockNow }) => {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)),
  );
  const expiredRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const r = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endsAt, onExpire]);

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <ScrollView
      style={styles.safeArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      scrollEventThrottle={16}
    >
      <View style={styles.brandRow}>
        <View style={styles.brandLogo}>
          <Ionicons name="shield-checkmark" size={22} color="#fff" />
        </View>
        <View>
          <Text style={styles.brandTitle}>ScreenMindr</Text>
          <Text style={styles.brandSub}>Reward active</Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.hero,
          styles.heroUnlocked,
          { transform: [{ scale: pulse }] },
        ]}
      >
        <View
          style={[
            styles.heroGlow,
            { backgroundColor: "#FBBF24", top: -60, right: -40 },
          ]}
        />
        <View
          style={[
            styles.heroGlow,
            {
              backgroundColor: "#10B981",
              bottom: -80,
              left: -60,
              opacity: 0.3,
            },
          ]}
        />
        <Text style={styles.heroLabel}>Reward time</Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <Ionicons name="lock-open" size={28} color="#fff" />
          <Text style={[styles.heroTitle, { marginLeft: 10, marginBottom: 0 }]}>
            Apps unlocked
          </Text>
        </View>
        <Text style={styles.heroSub}>Auto-locks when timer ends.</Text>
        <Text style={styles.heroCountdown}>{format(remaining)}</Text>
      </Animated.View>

      <Text style={styles.sectionLabel}>Apps available now</Text>
      <View style={styles.appsGrid}>
        {restrictedApps.map((app, i) => (
          <AppTile
            key={app.id}
            id={app.id}
            name={app.name}
            index={i}
            unlocked
          />
        ))}
      </View>

      <View style={{ marginTop: 18 }}>
        <Pressable
          onPress={onLockNow}
          style={({ pressed }) => [
            styles.ghostButton,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.ghostButtonText}>Lock now</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default UnlockedScreen;
