import { useMutation } from "@apollo/client";
import { Pedometer } from "expo-sensors";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Easing, Pressable, Text, View } from "react-native";
import CircularProgress from "../components/CircularProgress";
import { Ionicons } from "../components/icons";
import RewardPicker from "../components/RewardPicker";
import RewardsRow from "../components/RewardsRow";
import { beRewardType } from "../lib/normalize";
import { MY_BANK_QUERY, MY_REWARDS_QUERY, SUBMIT_TIMER } from "../lib/queries";
import { colors, styles } from "../theme/styles";
import { RewardType, Task } from "../types";

type Stage = "ready" | "checking" | "running" | "done";
type Mode = "real" | "mock";

interface Props {
  task: Task;
  reward: RewardType;
  onChangeReward: (r: RewardType) => void;
  onComplete: (reward: RewardType) => void;
}

function format(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const WalkScene: React.FC<{
  stage: Stage;
  bobY: Animated.AnimatedInterpolation<number>;
  progress: number;
}> = ({ stage, bobY, progress }) => {
  const cloud1 = useRef(new Animated.Value(0)).current;
  const cloud2 = useRef(new Animated.Value(0)).current;
  const sunSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const l1 = Animated.loop(
      Animated.sequence([
        Animated.timing(cloud1, {
          toValue: 1,
          duration: 7000,
          useNativeDriver: true,
        }),
        Animated.timing(cloud1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const l2 = Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(cloud2, {
          toValue: 1,
          duration: 9000,
          useNativeDriver: true,
        }),
        Animated.timing(cloud2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const l3 = Animated.loop(
      Animated.timing(sunSpin, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    l1.start();
    l2.start();
    l3.start();
    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, [cloud1, cloud2, sunSpin]);

  const cloud1X = cloud1.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 260],
  });
  const cloud2X = cloud2.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 280],
  });
  const sunRot = sunSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={{
        height: 280,
        backgroundColor: "#DCEEFE",
        borderRadius: 24,
        marginBottom: 18,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 14,
          right: 18,
          transform: [{ rotate: sunRot }],
        }}
      >
        <Ionicons name="sunny" size={36} color="#FBBF24" />
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          top: 30,
          transform: [{ translateX: cloud1X }],
        }}
      >
        <Ionicons name="cloud" size={28} color="rgba(255,255,255,0.9)" />
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          top: 60,
          transform: [{ translateX: cloud2X }],
        }}
      >
        <Ionicons name="cloud" size={20} color="rgba(255,255,255,0.7)" />
      </Animated.View>

      <View
        style={{
          position: "absolute",
          bottom: 30,
          left: 14,
          width: 0,
          height: 0,
          borderLeftWidth: 30,
          borderRightWidth: 30,
          borderBottomWidth: 50,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: "#94A3B8",
          opacity: 0.55,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 30,
          left: 60,
          width: 0,
          height: 0,
          borderLeftWidth: 40,
          borderRightWidth: 40,
          borderBottomWidth: 70,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: "#64748B",
          opacity: 0.7,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 30,
          right: 16,
          width: 0,
          height: 0,
          borderLeftWidth: 35,
          borderRightWidth: 35,
          borderBottomWidth: 60,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: "#94A3B8",
          opacity: 0.55,
        }}
      />

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 30,
          backgroundColor: "#86EFAC",
        }}
      />

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 24,
        }}
      >
        <CircularProgress
          size={196}
          progress={progress}
          color={colors.primary}
          trackColor="rgba(255,255,255,0.5)"
          ticks={56}
        >
          <View
            style={{
              width: 130,
              height: 130,
              borderRadius: 65,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Animated.View style={{ transform: [{ translateY: bobY }] }}>
              <Ionicons
                name={stage === "done" ? "flag" : "walk"}
                size={64}
                color={colors.primary}
              />
            </Animated.View>
          </View>
        </CircularProgress>
      </View>
    </View>
  );
};

const WalkTask: React.FC<Props> = ({
  task,
  reward,
  onChangeReward,
  onComplete,
}) => {
  const [submitTimer, { loading: submitting }] = useMutation(SUBMIT_TIMER, {
    refetchQueries: [{ query: MY_BANK_QUERY }, { query: MY_REWARDS_QUERY }],
  });

  const targetSteps = task.walkTargetSteps ?? 20;
  const totalSec = task.walkTargetSeconds ?? 60;

  const [stage, setStage] = useState<Stage>("ready");
  const [mode, setMode] = useState<Mode>("real");
  const [steps, setSteps] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const stepBaselineRef = useRef(0);
  const subRef = useRef<{ remove: () => void } | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const walkBob = useRef(new Animated.Value(0)).current;
  const donePulse = useRef(new Animated.Value(1)).current;

  const cleanup = () => {
    if (subRef.current) {
      subRef.current.remove();
      subRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  useEffect(() => {
    if (stage === "running") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(walkBob, {
            toValue: 1,
            duration: 360,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(walkBob, {
            toValue: 0,
            duration: 360,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    walkBob.setValue(0);
  }, [stage, walkBob]);

  useEffect(() => {
    if (stage === "done") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(donePulse, {
            toValue: 1.06,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(donePulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [stage, donePulse]);

  // Auto-complete when target reached
  useEffect(() => {
    if (stage === "running" && steps >= targetSteps) {
      cleanup();
      setStage("done");
    }
  }, [steps, targetSteps, stage]);

  // Time-out failsafe (max time)
  useEffect(() => {
    if (stage === "running" && elapsed >= totalSec * 4) {
      // Give 4x time before timing out
      cleanup();
    }
  }, [elapsed, totalSec, stage]);

  async function startMission() {
    setStage("checking");
    const available = await Pedometer.isAvailableAsync();

    if (available) {
      const perm = await Pedometer.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Motion permission needed",
          "We need motion access to count your steps.",
          [{ text: "OK", onPress: () => setStage("ready") }],
        );
        return;
      }
      setMode("real");
      setSteps(0);
      stepBaselineRef.current = 0;
      subRef.current = Pedometer.watchStepCount((result) => {
        setSteps(result.steps);
      });
    } else {
      // Fallback for emulators / devices without pedometer
      Alert.alert(
        "Pedometer unavailable",
        "Your device doesn't have a step counter. Demo will simulate steps so you can test the flow.",
        [{ text: "OK" }],
      );
      setMode("mock");
      setSteps(0);
      // Mock: increment ~1 step per second
      tickRef.current = setInterval(() => {
        setSteps((s) => s + 1);
      }, 1000);
    }

    // Universal time tracker (just for display)
    const start = Date.now();
    const timeTick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    // Store time tick alongside step tick if mock
    if (mode === "real") {
      // Replace tickRef with time-only tick
      tickRef.current = timeTick;
    } else {
      // Mock already has step tick; create separate timer
      const oldTick = tickRef.current;
      tickRef.current = {
        // proxy that clears both
        remove: () => {
          if (oldTick) clearInterval(oldTick);
          clearInterval(timeTick);
        },
      } as never;
    }

    setStage("running");
  }

  const progress = Math.min(1, steps / targetSteps);
  const status =
    stage === "ready"
      ? "Ready to walk"
      : stage === "checking"
        ? "Checking sensor…"
        : stage === "running"
          ? steps === 0
            ? "Start walking"
            : "Walking detected"
          : "Goal reached!";

  const bobY = walkBob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <Animated.View style={{ transform: [{ scale: donePulse }] }}>
      <WalkScene stage={stage} bobY={bobY} progress={progress} />

      <Text style={styles.walkTimer}>
        {steps}
        <Text style={{ color: colors.muted, fontSize: 22 }}>
          {" / "}
          {targetSteps}
        </Text>
      </Text>
      <Text style={styles.walkTimerSub}>
        {status}
        {mode === "mock" && stage === "running" ? " · Demo mode" : ""}
      </Text>

      <View style={styles.walkStatsRow}>
        <View style={styles.walkStatCol}>
          <Ionicons name="footsteps" size={18} color={colors.muted} />
          <Text style={[styles.walkStatLabel, { marginTop: 4 }]}>Steps</Text>
          <Text style={styles.walkStatValue}>{steps.toLocaleString()}</Text>
        </View>
        <View style={styles.walkStatCol}>
          <Ionicons name="time-outline" size={18} color={colors.muted} />
          <Text style={[styles.walkStatLabel, { marginTop: 4 }]}>Time</Text>
          <Text style={styles.walkStatValue}>{format(elapsed)}</Text>
        </View>
        <View style={styles.walkStatCol}>
          <Ionicons name="pulse" size={18} color={colors.muted} />
          <Text style={[styles.walkStatLabel, { marginTop: 4 }]}>Status</Text>
          <View style={styles.walkStatusPill}>
            {stage === "running" && steps > 0 && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.primaryDark}
                style={{ marginRight: 4 }}
              />
            )}
            <Text style={styles.walkStatusPillText}>
              {stage === "running" ? (steps > 0 ? "Active" : "Waiting") : "—"}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 18 }} />

      <RewardsRow rewards={task.rewards} />

      {stage === "ready" && (
        <>
          <Text style={styles.rewardChooseLabel}>Choose your reward</Text>
          <RewardPicker
            rewards={task.rewards}
            selected={reward}
            onChange={onChangeReward}
          />
          <Pressable
            onPress={startMission}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Ionicons
              name="play"
              size={16}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryButtonText}>Start mission</Text>
          </Pressable>
        </>
      )}

      {stage === "checking" && (
        <View
          style={[
            styles.primaryButton,
            { backgroundColor: colors.surfaceAlt },
          ]}
        >
          <Text
            style={[styles.primaryButtonText, { color: colors.muted }]}
          >
            Checking sensor…
          </Text>
        </View>
      )}

      {stage === "done" && (
        <Pressable
          disabled={submitting}
          onPress={async () => {
            try {
              await submitTimer({
                variables: {
                  input: {
                    taskId: task.id,
                    chosenReward: beRewardType(reward),
                    timerSeconds: elapsed,
                  },
                },
              });
              onComplete(reward);
            } catch (e) {
              Alert.alert("Submit failed", (e as Error).message);
            }
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            submitting && { opacity: 0.6 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </Pressable>
      )}
    </Animated.View>
  );
};

export default WalkTask;
