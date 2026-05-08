import { useMutation } from "@apollo/client";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Pressable, Text, View } from "react-native";
import { Ionicons } from "../components/icons";
import RewardPicker from "../components/RewardPicker";
import RewardsRow from "../components/RewardsRow";
import { beRewardType } from "../lib/normalize";
import { MY_BANK_QUERY, MY_REWARDS_QUERY, SUBMIT_QUIZ } from "../lib/queries";
import { colors, styles } from "../theme/styles";
import { RewardType, Task } from "../types";

type Stage = "intro" | "quiz" | "result";

interface Props {
  task: Task;
  reward: RewardType;
  onChangeReward: (r: RewardType) => void;
  onPass: (reward: RewardType) => void;
  onFail: () => void;
}

const LETTERS = ["A", "B", "C", "D"];

function format(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const QuizTask: React.FC<Props> = ({
  task,
  reward,
  onChangeReward,
  onPass,
  onFail,
}) => {
  const [submitQuiz] = useMutation(SUBMIT_QUIZ, {
    refetchQueries: [{ query: MY_BANK_QUERY }, { query: MY_REWARDS_QUERY }],
  });
  const quiz = task.quiz ?? [];
  const perQ = task.quizSecondsPerQuestion ?? 140;

  const [stage, setStage] = useState<Stage>("intro");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => quiz.map(() => null),
  );
  const [perQRemaining, setPerQRemaining] = useState(perQ);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (stage !== "quiz") return;
    setPerQRemaining(perQ);
    intervalRef.current = setInterval(() => {
      setPerQRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stage, qIdx, perQ]);

  useEffect(() => {
    if (stage !== "quiz") return;
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [qIdx, stage, slide]);

  const score = answers.reduce<number>(
    (acc, a, i) => (a === quiz[i].correctIndex ? acc + 1 : acc),
    0,
  );
  const percent =
    quiz.length === 0 ? 0 : Math.round((score / quiz.length) * 100);
  const passed = percent >= 80;

  function pick(optIdx: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
    setTimeout(() => {
      if (qIdx + 1 < quiz.length) {
        setQIdx(qIdx + 1);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setStage("result");
      }
    }, 250);
  }

  if (stage === "intro") {
    return (
      <View>
        <View
          style={[
            styles.illustrationBox,
            { backgroundColor: colors.accentSoft },
          ]}
        >
          <Ionicons name="school" size={88} color={colors.accent} />
        </View>
        <Text style={styles.taskHeadline}>
          Answer 3 questions{"\n"}about what you watched
        </Text>

        <RewardsRow rewards={task.rewards} />

        <Text style={styles.rewardChooseLabel}>Choose your reward</Text>
        <RewardPicker
          rewards={task.rewards}
          selected={reward}
          onChange={onChangeReward}
        />

        <Pressable
          onPress={() => setStage("quiz")}
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
          <Text style={styles.primaryButtonText}>Start challenge</Text>
        </Pressable>
      </View>
    );
  }

  if (stage === "quiz") {
    const q = quiz[qIdx];

    if (!q) {
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Ionicons
            name="alert-circle"
            size={40}
            color={colors.danger}
          />
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.text,
              marginTop: 10,
              textAlign: "center",
            }}
          >
            This quiz has no questions yet
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.muted,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            Ask your parent to set them up.
          </Text>
          <View style={{ height: 14 }} />
          <Pressable
            onPress={onFail}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Back</Text>
          </Pressable>
        </View>
      );
    }

    const slideX = slide.interpolate({
      inputRange: [0, 1],
      outputRange: [40, 0],
    });

    return (
      <View>
        <View style={styles.quizQuestionHeader}>
          <Text style={styles.quizQuestionCounter}>
            Question {qIdx + 1} of {quiz.length}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.muted}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.quizPerQuestionTimer}>
              {format(perQRemaining)}
            </Text>
          </View>
        </View>

        <Animated.View
          style={{
            opacity: slide,
            transform: [{ translateX: slideX }],
          }}
        >
          <Text style={styles.quizQuestionText}>{q.question}</Text>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            {q.options.map((opt, optIdx) => {
              const selected = answers[qIdx] === optIdx;
              const isLast = optIdx === q.options.length - 1;
              return (
                <Pressable
                  key={optIdx}
                  onPress={() => pick(optIdx)}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      backgroundColor: pressed
                        ? "rgba(0,0,0,0.04)"
                        : selected
                          ? "rgba(88,86,214,0.08)"
                          : "transparent",
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: selected
                        ? "#5856D6"
                        : "rgba(120,120,128,0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    {selected ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: colors.muted,
                        }}
                      >
                        {LETTERS[optIdx]}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: selected ? "600" : "500",
                      color: selected ? "#5856D6" : colors.text,
                      letterSpacing: -0.2,
                    }}
                  >
                    {opt}
                  </Text>
                  {!isLast && (
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 52,
                        right: 0,
                        height: 0.5,
                        backgroundColor: "rgba(60,60,67,0.18)",
                      }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <View style={styles.quizDots}>
          {quiz.map((_, i) => {
            const isActive = i === qIdx;
            const isDone = answers[i] !== null;
            return (
              <View
                key={i}
                style={[
                  styles.quizDot,
                  isDone && styles.quizDotDone,
                  isActive && styles.quizDotActive,
                ]}
              >
                {isDone && !isActive ? (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={colors.primaryDark}
                  />
                ) : (
                  <Text
                    style={[
                      styles.quizDotText,
                      isActive && styles.quizDotTextActive,
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  // Result
  return (
    <View>
      <View
        style={[
          styles.illustrationBox,
          {
            backgroundColor: passed ? colors.primarySoft : colors.dangerSoft,
          },
        ]}
      >
        <Ionicons
          name={passed ? "trophy" : "sad-outline"}
          size={88}
          color={passed ? colors.trophy : colors.danger}
        />
      </View>
      <Text style={styles.taskHeadline}>
        {passed ? "Great job!" : "So close!"}
      </Text>
      <Text
        style={{
          fontSize: 36,
          fontWeight: "800",
          color: passed ? colors.primary : colors.danger,
          textAlign: "center",
          marginBottom: 6,
        }}
      >
        {score} / {quiz.length}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: colors.muted,
          textAlign: "center",
          marginBottom: 18,
          letterSpacing: 1,
          textTransform: "uppercase",
          fontWeight: "700",
        }}
      >
        Correct
      </Text>

      <RewardsRow rewards={task.rewards} />

      <Pressable
        onPress={async () => {
          try {
            await submitQuiz({
              variables: {
                input: {
                  taskId: task.id,
                  chosenReward: beRewardType(reward),
                  quizScore: percent,
                },
              },
            });
            if (passed) onPass(reward);
            else onFail();
          } catch (e) {
            Alert.alert("Submit failed", (e as Error).message);
          }
        }}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>
          {passed ? "Continue" : "Back to missions"}
        </Text>
      </Pressable>
    </View>
  );
};

export default QuizTask;
