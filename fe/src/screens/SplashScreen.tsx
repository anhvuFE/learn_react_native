import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Ionicons } from "../components/icons";
import { colors } from "../theme/styles";

const SplashScreen: React.FC = () => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
        <Ionicons name="shield-checkmark" size={30} color="#fff" />
      </View>
      <Text
        style={{ fontSize: 22, fontWeight: "800", color: colors.text }}
      >
        ScreenMindr
      </Text>
      <ActivityIndicator
        color={colors.primary}
        style={{ marginTop: 18 }}
      />
    </View>
  );
};

export default SplashScreen;
