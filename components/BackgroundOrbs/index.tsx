import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { styles } from "./styles";

export default function BackgroundOrbs() {
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = (val: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

    float(orb1, 4500);
    float(orb2, 6000);
  }, []);

  const y1 = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });
  const x1 = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, 50] });
  const y2 = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, -90] });
  const x2 = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, -40] });

  return (
    <>
      <Animated.View
        style={[
          styles.orb,
          styles.purple,
          { transform: [{ translateY: y1 }, { translateX: x1 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.pink,
          { transform: [{ translateY: y2 }, { translateX: x2 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.cyan,
          { transform: [{ translateY: y1 }, { translateX: x2 }] },
        ]}
      />
    </>
  );
}
