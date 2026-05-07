import { useMutation, useQuery } from "@apollo/client";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "../components/icons";
import {
  MY_BANK_QUERY,
  MY_REDEMPTIONS,
  REDEEM_REWARD_ITEM,
  REWARD_ITEMS_QUERY,
} from "../lib/queries";
import { colors, styles } from "../theme/styles";

interface Item {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  costPoints: number;
  stock: number;
  active: boolean;
}

interface Redemption {
  id: string;
  itemName: string;
  costPoints: number;
  status: string;
  redeemedAt: string;
  fulfilledAt?: string;
}

const ShopScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data, loading } = useQuery<{ rewardItems: Item[] }>(
    REWARD_ITEMS_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const { data: bankData } = useQuery<{ myBank: { points: number } }>(
    MY_BANK_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const { data: redData } = useQuery<{ redemptions: Redemption[] }>(
    MY_REDEMPTIONS,
    { fetchPolicy: "cache-and-network" },
  );
  const [redeem, { loading: redeeming }] = useMutation(REDEEM_REWARD_ITEM, {
    refetchQueries: [
      { query: MY_BANK_QUERY },
      { query: REWARD_ITEMS_QUERY },
      { query: MY_REDEMPTIONS },
    ],
    awaitRefetchQueries: true,
  });

  const points = bankData?.myBank?.points ?? 0;
  const items = (data?.rewardItems ?? []).filter((i) => i.active);
  const recent = (redData?.redemptions ?? []).slice(0, 5);

  const [busyId, setBusyId] = useState<string | null>(null);

  const onRedeem = (item: Item) => {
    if (item.costPoints > points) {
      Alert.alert("Not enough points", `You need ${item.costPoints - points} more points`);
      return;
    }
    Alert.alert(
      `Redeem ${item.name}?`,
      `This will spend ${item.costPoints} points`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: async () => {
            try {
              setBusyId(item.id);
              await redeem({ variables: { id: item.id } });
              Alert.alert("Redeemed!", "Your parent will fulfill it soon");
            } catch (e) {
              Alert.alert("Failed", (e as Error).message);
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.topBarBack}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Reward shop</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: colors.points,
            borderRadius: 22,
            padding: 22,
            marginBottom: 18,
          }}
        >
          <Ionicons name="sparkles" size={26} color="#fff" />
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.6,
              textTransform: "uppercase",
              marginTop: 14,
            }}
          >
            You have
          </Text>
          <Text
            style={{
              color: "#fff",
              fontSize: 40,
              fontWeight: "700",
              letterSpacing: -1,
              fontVariant: ["tabular-nums"],
              marginTop: 2,
            }}
          >
            {points} pts
          </Text>
        </View>

        {loading && items.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 18,
              padding: 22,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="gift-outline" size={40} color={colors.muted} />
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.text,
                marginTop: 10,
              }}
            >
              Shop is empty
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.muted,
                textAlign: "center",
                marginTop: 6,
              }}
            >
              Ask your parent to add reward items
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const affordable = item.costPoints <= points;
            return (
              <Pressable
                key={item.id}
                onPress={() => onRedeem(item)}
                disabled={busyId === item.id || redeeming || !affordable}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    opacity: pressed ? 0.85 : !affordable ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: colors.pointsSoft,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{item.emoji ?? "🎁"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: colors.text,
                      letterSpacing: -0.2,
                    }}
                  >
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.muted,
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                  ) : null}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 6,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: colors.pointsSoft,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="sparkles" size={11} color={colors.points} />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: colors.points,
                          marginLeft: 4,
                        }}
                      >
                        {item.costPoints} pts
                      </Text>
                    </View>
                    {item.stock >= 0 && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.muted,
                          marginLeft: 8,
                        }}
                      >
                        {item.stock} left
                      </Text>
                    )}
                  </View>
                </View>
                {busyId === item.id ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Ionicons
                    name={affordable ? "chevron-forward" : "lock-closed"}
                    size={18}
                    color={colors.muted}
                  />
                )}
              </Pressable>
            );
          })
        )}

        {recent.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
              Your redemptions
            </Text>
            {recent.map((r) => (
              <View
                key={r.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor:
                      r.status === "fulfilled"
                        ? colors.primarySoft
                        : colors.pointsSoft,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name={
                      r.status === "fulfilled"
                        ? "checkmark-done"
                        : "hourglass"
                    }
                    size={18}
                    color={
                      r.status === "fulfilled"
                        ? colors.primary
                        : colors.points
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.text,
                    }}
                  >
                    {r.itemName}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}
                  >
                    {r.status === "fulfilled"
                      ? `Fulfilled ${new Date(r.fulfilledAt ?? r.redeemedAt).toLocaleString()}`
                      : `Pending parent · ${new Date(r.redeemedAt).toLocaleString()}`}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.points,
                  }}
                >
                  -{r.costPoints} pts
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default ShopScreen;
