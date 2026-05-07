import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "./icons";
import { colors, styles } from "../theme/styles";

interface Props {
  title: string;
  onBack: () => void;
}

const TopBar: React.FC<Props> = ({ title, onBack }) => {
  return (
    <View style={styles.topBar}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.topBarBack,
          pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
        ]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.topBarTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.topBarRight} />
    </View>
  );
};

export default TopBar;
