import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { SPRING } from "../../constants";
import type { Todo } from "../../types";
import { styles } from "./styles";

type Props = {
  item: Todo;
  index: number;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function TodoItem({ item, index, onToggle, onRemove }: Props) {
  const enter = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(item.done ? 1 : 0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 400,
      delay: index * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (item.done) {
      Animated.sequence([
        Animated.timing(checkScale, {
          toValue: 1.4,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.spring(checkScale, { toValue: 0, ...SPRING }).start();
    }
  }, [item.done]);

  const handlePressIn = () =>
    Animated.spring(cardScale, { toValue: 0.97, ...SPRING }).start();
  const handlePressOut = () =>
    Animated.spring(cardScale, { toValue: 1, ...SPRING }).start();

  const translateX = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateX }, { scale: cardScale }],
      }}
    >
      <Pressable
        onPress={() => onToggle(item.id)}
        onLongPress={() => onRemove(item.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.todoCard}
      >
        <View style={[styles.checkbox, item.done && styles.checkboxChecked]}>
          <Animated.Text
            style={[styles.checkMark, { transform: [{ scale: checkScale }] }]}
          >
            ✓
          </Animated.Text>
        </View>
        <Text
          style={[styles.todoText, item.done && styles.todoTextDone]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
