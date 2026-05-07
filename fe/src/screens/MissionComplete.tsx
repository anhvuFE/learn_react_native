import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Confetti from "../components/Confetti";
import { Ionicons } from "../components/icons";
import { REWARD_META, RewardIcon } from "../components/RewardPicker";
import { colors, styles } from "../theme/styles";
import { CompletedMission } from "../types";

interface Props {
  mission: CompletedMission;
  onContinue: () => void;
}

const HaloRing: React.FC<{ delay: number; color: string; size: number }> = ({
  delay,
  color,
  size,
}) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.6,
            duration: 1800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scale, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
};

const Sparkle: React.FC<{
  top: number;
  left: number;
  size: number;
  delay: number;
}> = ({ top, left, size, delay }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.6,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(700),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity, rotate, delay]);

  const rot = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top,
        left,
        opacity,
        transform: [{ scale }, { rotate: rot }],
      }}
    >
      <Ionicons name="sparkles" size={size} color="#FBBF24" />
    </Animated.View>
  );
};

const MissionComplete: React.FC<Props> = ({ mission, onContinue }) => {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(28)).current;
  const trophyScale = useRef(new Animated.Value(0.4)).current;
  const trophyTilt = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const rowOpacity = useRef(new Animated.Value(0)).current;
  const rowTranslate = useRef(new Animated.Value(16)).current;
  const chosenScale = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslate, {
          toValue: 0,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(trophyScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(rowOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(rowTranslate, {
          toValue: 0,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(chosenScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const tiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(trophyTilt, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(trophyTilt, {
          toValue: -1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(trophyTilt, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    tiltLoop.start();
    return () => {
      tiltLoop.stop();
    };
  }, [
    cardOpacity,
    cardTranslate,
    trophyScale,
    trophyTilt,
    titleOpacity,
    rowOpacity,
    rowTranslate,
    chosenScale,
    buttonOpacity,
  ]);

  const tiltDeg = trophyTilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-8deg", "0deg", "8deg"],
  });

  const meta = REWARD_META[mission.reward];
  const r = mission.task.rewards;

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      {/* Soft radial glow background using stacked colored circles */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 80,
          alignSelf: "center",
          width: 380,
          height: 380,
          borderRadius: 190,
          backgroundColor: "#7C3AED",
          opacity: 0.18,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 140,
          alignSelf: "center",
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: "#F59E0B",
          opacity: 0.16,
        }}
      />

      <Confetti count={32} />
      <ScrollView
        contentContainerStyle={styles.missionContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.missionCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslate }],
            },
          ]}
        >
          <Animated.Text
            style={[styles.missionTitle, { opacity: titleOpacity }]}
          >
            Mission Complete!
          </Animated.Text>

          <View style={[styles.trophyWrap, { width: 180, height: 180 }]}>
            {/* Halo rings */}
            <HaloRing delay={0} color="#FBBF24" size={170} />
            <HaloRing delay={600} color="#7C3AED" size={170} />
            <HaloRing delay={1200} color="#16A34A" size={170} />

            {/* Sparkles */}
            <Sparkle top={4} left={20} size={20} delay={300} />
            <Sparkle top={20} left={150} size={16} delay={800} />
            <Sparkle top={80} left={6} size={14} delay={1400} />
            <Sparkle top={100} left={155} size={18} delay={500} />
            <Sparkle top={140} left={30} size={14} delay={1100} />

            {/* Trophy */}
            <Animated.View
              style={{
                transform: [
                  { scale: trophyScale },
                  { rotate: tiltDeg },
                ],
              }}
            >
              <Ionicons name="trophy" size={120} color={colors.trophy} />
            </Animated.View>
          </View>

          <Text style={styles.earnedLabel}>You earned</Text>
          <Animated.View
            style={[
              styles.earnedRow,
              {
                opacity: rowOpacity,
                transform: [{ translateY: rowTranslate }],
              },
            ]}
          >
            <View style={styles.earnedCol}>
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color={colors.screenTime}
              />
              <Text
                style={[
                  styles.earnedColValue,
                  { color: colors.screenTime, marginTop: 4 },
                ]}
              >
                +{r.screenTimeMin}m
              </Text>
              <Text style={styles.earnedColLabel}>Screen Time</Text>
            </View>
            <View style={styles.earnedCol}>
              <Ionicons name="star" size={20} color={colors.points} />
              <Text
                style={[
                  styles.earnedColValue,
                  { color: colors.points, marginTop: 4 },
                ]}
              >
                +{r.points}
              </Text>
              <Text style={styles.earnedColLabel}>Points</Text>
            </View>
            <View style={styles.earnedCol}>
              <Ionicons name="cash" size={20} color={colors.cash} />
              <Text
                style={[
                  styles.earnedColValue,
                  { color: colors.cash, marginTop: 4 },
                ]}
              >
                +${r.cashUsd.toFixed(2)}
              </Text>
              <Text style={styles.earnedColLabel}>Cash*</Text>
            </View>
          </Animated.View>

          <Text style={styles.rewardChosenLabel}>Reward chosen</Text>
          <Animated.View
            style={[
              styles.rewardChosenChip,
              { backgroundColor: meta.bg, transform: [{ scale: chosenScale }] },
            ]}
          >
            <RewardIcon reward={mission.reward} size={28} color="#fff" />
          </Animated.View>
        </Animated.View>

        <View style={{ height: 24 }} />

        <Animated.View style={{ opacity: buttonOpacity }}>
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [
              styles.accentButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default MissionComplete;
