import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { styles } from "./styles";

type Props = {
  total: number;
  completed: number;
  progress: number;
};

export default function Header({ total, completed, progress }: Props) {
  const headerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(sparkleRotate, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const headerTranslate = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  const sparkleDeg = sparkleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const shimmerLeft = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-30%", "100%"],
  });

  return (
    <Animated.View
      style={[
        styles.header,
        { opacity: headerAnim, transform: [{ translateY: headerTranslate }] },
      ]}
    >
      <View style={styles.greetRow}>
        <Text style={styles.greeting}>Hi, Xuan Anh</Text>
        <Animated.Text
          style={[styles.sparkle, { transform: [{ rotate: sparkleDeg }] }]}
        >
          ✦
        </Animated.Text>
      </View>
      <Text style={styles.subGreeting}>Hôm nay bạn cần làm gì?</Text>

      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statsLabel}>Tiến độ hôm nay</Text>
            <Text style={styles.statsValue}>
              {completed}/{total} task
            </Text>
          </View>
          <Animated.View
            style={[
              styles.percentBadge,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Text style={styles.percentText}>
              {Math.round(progress * 100)}%
            </Text>
          </Animated.View>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
          <Animated.View
            style={[styles.progressGlow, { width: progressWidth }]}
          />
          <Animated.View style={[styles.shimmer, { left: shimmerLeft }]} />
        </View>
      </View>
    </Animated.View>
  );
}
