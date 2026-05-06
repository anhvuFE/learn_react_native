import React from "react";
import { Text, View } from "react-native";
import { RewardIcon } from "./RewardPicker";
import { colors, styles } from "../theme/styles";
import { Rewards } from "../types";

interface Props {
  rewards: Rewards;
}

const RewardsRow: React.FC<Props> = ({ rewards }) => {
  return (
    <View style={styles.rewardsRow}>
      <View style={styles.rewardCol}>
        <RewardIcon reward="screen-time" color={colors.screenTime} size={18} />
        <Text style={[styles.rewardColValue, styles.rewardColScreen, { marginTop: 4 }]}>
          +{rewards.screenTimeMin} min
        </Text>
        <Text style={styles.rewardColLabel}>Screen Time</Text>
      </View>
      <View style={styles.rewardCol}>
        <RewardIcon reward="points" color={colors.points} size={18} />
        <Text style={[styles.rewardColValue, styles.rewardColPoints, { marginTop: 4 }]}>
          +{rewards.points} pts
        </Text>
        <Text style={styles.rewardColLabel}>Points</Text>
      </View>
      <View style={styles.rewardCol}>
        <RewardIcon reward="cash" color={colors.cash} size={18} />
        <Text style={[styles.rewardColValue, styles.rewardColCash, { marginTop: 4 }]}>
          +${rewards.cashUsd.toFixed(2)}
        </Text>
        <Text style={styles.rewardColLabel}>Cash*</Text>
      </View>
    </View>
  );
};

export default RewardsRow;
