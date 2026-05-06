import React, { memo, useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { APP_BRAND_COLOR } from "../data/mockData";
import { colors, styles } from "../theme/styles";
import { AppBrandIcon, Ionicons } from "./icons";

interface Props {
  id: string;
  name: string;
  index: number;
  unlocked?: boolean;
}

const InstagramGradient: React.FC = () => (
  <>
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -10,
        right: -10,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#FBAA47",
      }}
    />
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -4,
        right: -4,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FD1D1D",
        opacity: 0.85,
      }}
    />
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        bottom: -14,
        left: -10,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#833AB4",
      }}
    />
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        bottom: -2,
        left: -2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#5851DB",
        opacity: 0.7,
      }}
    />
  </>
);

const AppTile = memo<Props>(({ id, name, index, unlocked }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay: 120 + index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 6,
        delay: 120 + index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        delay: 120 + index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY, scale]);

  const brand = APP_BRAND_COLOR[id] ?? {
    bg: colors.surfaceAlt,
    iconColor: colors.text,
  };

  const isInstagram = id === "instagram";

  return (
    <Animated.View
      style={[
        styles.appTile,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <View>
        <View
          style={[
            styles.appTileIconWrap,
            {
              backgroundColor: brand.bg,
              shadowColor: brand.bg,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 4,
              overflow: "hidden",
            },
          ]}
        >
          {isInstagram && <InstagramGradient />}
          <AppBrandIcon name={id} size={30} color={brand.iconColor} />
          {!unlocked && <View style={styles.appTileLockedOverlay} />}
        </View>

        <View
          style={
            unlocked ? styles.appTileUnlockBadge : styles.appTileLockBadge
          }
        >
          <Ionicons
            name={unlocked ? "checkmark" : "lock-closed"}
            size={11}
            color="#fff"
          />
        </View>
      </View>

      <Text
        style={[
          styles.appTileLabel,
          !unlocked && styles.appTileLabelLocked,
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </Animated.View>
  );
});
AppTile.displayName = "AppTile";

export default AppTile;
