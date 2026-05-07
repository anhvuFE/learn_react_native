import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  SafeAreaView,
  UIManager,
  View,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import BottomNav from "./src/components/BottomNav";
import LockScreen from "./src/screens/LockScreen";
import MenuScreen from "./src/screens/MenuScreen";
import MissionComplete from "./src/screens/MissionComplete";
import ProgressScreen from "./src/screens/ProgressScreen";
import RewardsScreen from "./src/screens/RewardsScreen";
import TaskScreen from "./src/screens/TaskScreen";
import UnlockedScreen from "./src/screens/UnlockedScreen";
import { DEMO_REWARD_CAP_SECONDS, initialTasks } from "./src/data/mockData";
import { colors } from "./src/theme/styles";
import {
  CompletedMission,
  Modal,
  RewardType,
  Tab,
  Task,
} from "./src/types";

const TabContainer: React.FC<{
  tab: Tab;
  children: React.ReactNode;
}> = ({ tab, children }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(8);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tab, opacity, translateY]);

  return (
    <Animated.View
      style={{ flex: 1, opacity, transform: [{ translateY }] }}
    >
      {children}
    </Animated.View>
  );
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [tab, setTab] = useState<Tab>("home");
  const [modal, setModal] = useState<Modal>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [rewardEndsAt, setRewardEndsAt] = useState<number | null>(null);
  const [completedMission, setCompletedMission] =
    useState<CompletedMission | null>(null);
  const [pointsBank, setPointsBank] = useState(0);
  const [cashBank, setCashBank] = useState(0);
  const [history, setHistory] = useState<CompletedMission[]>([]);

  const activeTask =
    activeTaskId == null
      ? null
      : tasks.find((t) => t.id === activeTaskId) ?? null;

  const openTask = useCallback((task: Task) => {
    setActiveTaskId(task.id);
    setModal("task");
  }, []);

  const closeModal = useCallback(() => {
    setActiveTaskId(null);
    setModal(null);
  }, []);

  const completeTask = useCallback((task: Task, reward: RewardType) => {
    const mission: CompletedMission = {
      task,
      reward,
      completedAt: Date.now(),
    };
    setCompletedMission(mission);
    setHistory((prev) => [...prev, mission]);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: "approved" } : t,
      ),
    );
    setModal("mission-complete");
  }, []);

  function continueFromMission() {
    if (!completedMission) {
      closeModal();
      return;
    }
    const { reward, task } = completedMission;

    if (reward === "screen-time") {
      const realEnds = Date.now() + task.rewards.screenTimeMin * 60 * 1000;
      const demoEnds = Date.now() + DEMO_REWARD_CAP_SECONDS * 1000;
      setRewardEndsAt(Math.min(realEnds, demoEnds));
    } else if (reward === "points") {
      setPointsBank((p) => p + task.rewards.points);
    } else if (reward === "cash") {
      setCashBank((c) => c + task.rewards.cashUsd);
    }

    setCompletedMission(null);
    setActiveTaskId(null);
    setModal(null);
    setTab("home");
  }

  const expireReward = useCallback(() => {
    setRewardEndsAt(null);
    setTasks((prev) =>
      prev.map((t) =>
        t.status === "available" ? t : { ...t, status: "available" },
      ),
    );
  }, []);

  function renderHomeTab() {
    if (rewardEndsAt && rewardEndsAt > Date.now()) {
      return (
        <UnlockedScreen
          endsAt={rewardEndsAt}
          onExpire={expireReward}
          onLockNow={expireReward}
        />
      );
    }
    return <LockScreen tasks={tasks} onTaskPress={openTask} />;
  }

  const isModalOpen = modal !== null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        {!isModalOpen && (
          <TabContainer tab={tab}>
            {tab === "home" && renderHomeTab()}
            {tab === "progress" && (
              <ProgressScreen
                history={history}
                pointsBank={pointsBank}
                cashBank={cashBank}
              />
            )}
            {tab === "rewards" && (
              <RewardsScreen
                pointsBank={pointsBank}
                cashBank={cashBank}
                screenTimeMinutesAvailable={
                  rewardEndsAt && rewardEndsAt > Date.now()
                    ? Math.ceil((rewardEndsAt - Date.now()) / 60000)
                    : 0
                }
              />
            )}
            {tab === "menu" && <MenuScreen />}
          </TabContainer>
        )}

        {modal === "task" && activeTask && (
          <TaskScreen
            task={activeTask}
            onBack={closeModal}
            onComplete={completeTask}
            onCancel={closeModal}
          />
        )}

        {modal === "mission-complete" && completedMission && (
          <MissionComplete
            mission={completedMission}
            onContinue={continueFromMission}
          />
        )}
      </SafeAreaView>

      {!isModalOpen && <BottomNav active={tab} onChange={setTab} />}
    </View>
  );
}
