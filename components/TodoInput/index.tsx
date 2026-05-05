import { useRef } from "react";
import { Animated, Easing, Pressable, TextInput, View } from "react-native";
import { styles } from "./styles";

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
};

export default function TodoInput({ value, onChange, onSubmit }: Props) {
  const addRotate = useRef(new Animated.Value(0)).current;

  const handleSubmit = () => {
    if (!value.trim()) return;
    Animated.sequence([
      Animated.timing(addRotate, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(addRotate, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    onSubmit();
  };

  const rotateDeg = addRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "135deg"],
  });

  return (
    <View style={styles.inputRow}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Thêm một task mới..."
        placeholderTextColor="#9ca3af"
        style={styles.input}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />
      <Pressable
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.addBtn,
          pressed && styles.addBtnPressed,
        ]}
      >
        <Animated.Text
          style={[styles.addBtnText, { transform: [{ rotate: rotateDeg }] }]}
        >
          +
        </Animated.Text>
      </Pressable>
    </View>
  );
}
