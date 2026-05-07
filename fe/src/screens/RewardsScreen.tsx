import React, { memo, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import CountUp from "../components/CountUp";
import { Ionicons } from "../components/icons";
import { RewardIcon } from "../components/RewardPicker";
import { colors, styles } from "../theme/styles";

interface Props {
  pointsBank: number;
  cashBank: number;
  screenTimeMinutesAvailable: number;
}

const BankCard = memo<{
  label: string;
  bgColor: string;
  glowColor: string;
  reward: "screen-time" | "points" | "cash";
  value: number;
  format?: (n: number) => string;
  delay: number;
}>(({ label, bgColor, glowColor, reward, value, format, delay }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        delay,
        useNativeDriver: true,
      }),
    ]).start();

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
      ]),
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, [opacity, translateY, shimmer, delay]);

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <Animated.View
      style={[
        styles.bankCard,
        {
          backgroundColor: bgColor,
          opacity,
          transform: [{ translateY }],
          minHeight: 100,
        },
      ]}
    >
      {/* Shimmer */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: 80,
          backgroundColor: "rgba(255,255,255,0.18)",
          transform: [{ translateX: shimmerX }, { skewX: "-20deg" }],
        }}
      />
      {/* Floating glow */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -40,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: glowColor,
          opacity: 0.3,
        }}
      />

      <View style={styles.bankIconWrap}>
        <RewardIcon reward={reward} size={26} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.bankLabel}>{label}</Text>
        <CountUp
          style={styles.bankValue}
          value={value}
          format={format}
        />
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color="rgba(255,255,255,0.7)"
      />
    </Animated.View>
  );
});
BankCard.displayName = "BankCard";

const RewardsScreen: React.FC<Props> = ({
  pointsBank,
  cashBank,
  screenTimeMinutesAvailable,
}) => {
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroOpacity, heroScale]);

  const totalEarned = pointsBank + Math.round(cashBank * 100);

  return (
    <ScrollView
      style={styles.safeArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      scrollEventThrottle={16}
    >
      <View style={styles.brandRow}>
        <View
          style={[styles.brandLogo, { backgroundColor: colors.points }]}
        >
          <Ionicons name="gift" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Rewards</Text>
          <Text style={styles.brandSub}>Spend or save what you earn.</Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.tabHero,
          {
            backgroundColor: colors.points,
            opacity: heroOpacity,
            transform: [{ scale: heroScale }],
          },
        ]}
      >
        <View
          style={[
            styles.heroGlow,
            { backgroundColor: "#fff", top: -60, right: -30, opacity: 0.2 },
          ]}
        />
        <View
          style={[
            styles.heroGlow,
            {
              backgroundColor: "#EC4899",
              bottom: -80,
              left: -50,
              opacity: 0.16,
            },
          ]}
        />
        <Text style={styles.tabHeroLabel}>Cash on the way</Text>
        <CountUp
          style={styles.tabHeroValue}
          value={cashBank}
          format={(n) => `$${n.toFixed(2)}`}
        />
        <Text style={styles.tabHeroSub}>
          {pointsBank} pts · {screenTimeMinutesAvailable} min screen time
        </Text>
      </Animated.View>

      <Text style={styles.sectionLabel}>Your banks</Text>

      <BankCard
        label="Screen Time"
        bgColor={colors.screenTime}
        glowColor="#fff"
        reward="screen-time"
        value={screenTimeMinutesAvailable}
        format={(n) => `${Math.round(n)} min`}
        delay={50}
      />
      <BankCard
        label="Points"
        bgColor={colors.points}
        glowColor="#FEF3C7"
        reward="points"
        value={pointsBank}
        delay={150}
      />
      <BankCard
        label="Cash (pending)"
        bgColor={colors.cash}
        glowColor="#fff"
        reward="cash"
        value={cashBank}
        format={(n) => `$${n.toFixed(2)}`}
        delay={250}
      />

      <Text style={styles.sectionLabel}>Spend</Text>

      <Pressable
        onPress={() => {}}
        style={({ pressed }) => [
          styles.menuRow,
          pressed && { opacity: 0.7 },
        ]}
      >
        <View
          style={[styles.menuRowIcon, { backgroundColor: colors.accentSoft }]}
        >
          <Ionicons name="storefront" size={20} color={colors.accent} />
        </View>
        <Text style={styles.menuRowLabel}>Reward shop</Text>
        <Text style={styles.menuRowValue}>Soon</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>

      <Pressable
        onPress={() => {}}
        style={({ pressed }) => [
          styles.menuRow,
          pressed && { opacity: 0.7 },
        ]}
      >
        <View
          style={[styles.menuRowIcon, { backgroundColor: colors.cashSoft }]}
        >
          <Ionicons name="card" size={20} color={colors.cash} />
        </View>
        <Text style={styles.menuRowLabel}>Cash out to savings</Text>
        <Text style={styles.menuRowValue}>Soon</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>

      <Pressable
        onPress={() => {}}
        style={({ pressed }) => [
          styles.menuRow,
          pressed && { opacity: 0.7 },
        ]}
      >
        <View
          style={[styles.menuRowIcon, { backgroundColor: colors.screenTimeSoft }]}
        >
          <Ionicons name="play-circle" size={20} color={colors.screenTime} />
        </View>
        <Text style={styles.menuRowLabel}>Use screen time now</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>

      <Text style={styles.footerNote}>
        * Cash payouts require parent approval and account setup.
      </Text>
    </ScrollView>
  );
};

export default RewardsScreen;
