import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { Ionicons } from "../components/icons";
import RewardPicker from "../components/RewardPicker";
import RewardsRow from "../components/RewardsRow";
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

          {q.options.map((opt, optIdx) => {
            const selected = answers[qIdx] === optIdx;
            return (
              <Pressable
                key={optIdx}
                onPress={() => pick(optIdx)}
                style={({ pressed }) => [
                  styles.optionRow,
                  selected && styles.optionRowSelected,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <View
                  style={[
                    styles.optionLetter,
                    selected && styles.optionLetterSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLetterText,
                      selected && styles.optionLetterTextSelected,
                    ]}
                  >
                    {LETTERS[optIdx]}
                  </Text>
                </View>
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            );
          })}
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
        onPress={() => (passed ? onPass(reward) : onFail())}
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
