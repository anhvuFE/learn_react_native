import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, View } from "react-native";

const COLORS = [
  "#16A34A",
  "#7C3AED",
  "#F59E0B",
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#EC4899",
];

interface PieceProps {
  delay: number;
  startX: number;
  drift: number;
  color: string;
  size: number;
  rotateTo: number;
  fallTo: number;
  duration: number;
}

const Piece: React.FC<PieceProps> = ({
  delay,
  startX,
  drift,
  color,
  size,
  rotateTo,
  fallTo,
  duration,
}) => {
  const translateY = useRef(new Animated.Value(-40)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: fallTo,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: drift,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: rotateTo,
          duration,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, drift, duration, fallTo, opacity, rotate, rotateTo, translateX, translateY]);

  const rotateStr = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: startX,
        width: size,
        height: size * 0.4,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [
          { translateY },
          { translateX },
          { rotate: rotateStr },
        ],
      }}
    />
  );
};

interface Props {
  count?: number;
}

const Confetti: React.FC<Props> = ({ count = 36 }) => {
  const { width, height } = Dimensions.get("window");
  const pieces = Array.from({ length: count }).map((_, i) => ({
    id: i,
    delay: Math.random() * 400,
    startX: Math.random() * width,
    drift: (Math.random() - 0.5) * 160,
    color: COLORS[i % COLORS.length],
    size: 8 + Math.random() * 8,
    rotateTo: 360 + Math.random() * 720,
    fallTo: height * (0.7 + Math.random() * 0.3),
    duration: 1800 + Math.random() * 1400,
  }));

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {pieces.map(({ id, ...rest }) => (
        <Piece key={id} {...rest} />
      ))}
    </View>
  );
};

export default Confetti;
