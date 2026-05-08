import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "../components/icons";
import { colors, styles } from "../theme/styles";

const STORAGE_KEY = "screenmindr-onboarded";

export async function hasOnboarded(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    return v === "1";
  } catch {
    return false;
  }
}

interface Slide {
  icon: keyof typeof import("../components/icons").Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: "shield-checkmark",
    iconBg: colors.accentSoft,
    iconColor: colors.accent,
    title: "Welcome to ScreenMindr",
    body: "Turn screen time into something kids earn. Parents define missions, kids complete them.",
  },
  {
    icon: "rocket",
    iconBg: colors.primarySoft,
    iconColor: colors.primary,
    title: "Pick your role",
    body: "Sign in as a parent (email + password) or pair this device using a 6-character code from your parent.",
  },
  {
    icon: "trophy",
    iconBg: colors.pointsSoft,
    iconColor: colors.points,
    title: "Earn rewards",
    body: "Walks, photos, and quizzes unlock screen time, points to spend in the shop, or pocket cash.",
  },
  {
    icon: "sparkles",
    iconBg: colors.warning + "22",
    iconColor: colors.warning,
    title: "You're all set",
    body: "Tap Get started to sign in or pair. You can always reset this from About.",
  },
];

const { width } = Dimensions.get("window");

const OnboardingScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const finish = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    onDone();
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      const ni = index + 1;
      setIndex(ni);
      scrollRef.current?.scrollTo({ x: ni * width, animated: true });
    } else {
      finish();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: 18,
          paddingTop: 12,
        }}
      >
        <Pressable onPress={finish} hitSlop={12}>
          <Text
            style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}
          >
            Skip
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View
            key={i}
            style={{
              width,
              padding: 28,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                backgroundColor: s.iconBg,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Ionicons name={s.icon} size={42} color={s.iconColor} />
            </View>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: colors.text,
                letterSpacing: -0.5,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {s.title}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.muted,
                textAlign: "center",
                lineHeight: 22,
                paddingHorizontal: 8,
              }}
            >
              {s.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Pager dots */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        {SLIDES.map((_, i) => {
          const opacity = scrollX.interpolate({
            inputRange: [
              (i - 1) * width,
              i * width,
              (i + 1) * width,
            ],
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });
          const w = scrollX.interpolate({
            inputRange: [
              (i - 1) * width,
              i * width,
              (i + 1) * width,
            ],
            outputRange: [8, 24, 8],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={i}
              style={{
                height: 8,
                width: w,
                backgroundColor: colors.text,
                borderRadius: 4,
                marginHorizontal: 4,
                opacity,
              }}
            />
          );
        })}
      </View>

      <View style={{ paddingHorizontal: 18, paddingBottom: 28 }}>
        <Pressable
          onPress={next}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {index === SLIDES.length - 1 ? "Get started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default OnboardingScreen;
