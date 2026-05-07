import "./src/lib/polyfills";
import { ApolloProvider, useMutation, useQuery } from "@apollo/client";
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
import { apolloClient } from "./src/lib/apollo";
import { AuthProvider, useAuth } from "./src/lib/auth-context";
import {
  getExpoPushToken,
  getPushPermissionStatus,
} from "./src/lib/notifications";
import { ME_QUERY, MY_BANK_QUERY, SET_PUSH_TOKEN } from "./src/lib/queries";
import AuthScreen from "./src/screens/AuthScreen";
import LockScreen from "./src/screens/LockScreen";
import MenuScreen from "./src/screens/MenuScreen";
import MissionComplete from "./src/screens/MissionComplete";
import ParentReviewScreen from "./src/screens/ParentReviewScreen";
import ProgressScreen from "./src/screens/ProgressScreen";
import RewardsScreen from "./src/screens/RewardsScreen";
import SplashScreen from "./src/screens/SplashScreen";
import TaskScreen from "./src/screens/TaskScreen";
import UnlockedScreen from "./src/screens/UnlockedScreen";
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

function MainApp() {
  const { data: meData } = useQuery<{
    me: { uid: string; role: "PARENT" | "CHILD"; familyId?: string };
  }>(ME_QUERY, { fetchPolicy: "cache-and-network" });
  const role = meData?.me?.role;
  const isParent = role === "PARENT";

  // Auto-register push token if user has already granted permission
  const [setPushToken] = useMutation(SET_PUSH_TOKEN);
  useEffect(() => {
    if (!meData?.me?.uid) return;
    (async () => {
      const status = await getPushPermissionStatus();
      if (status !== "granted") return;
      const token = await getExpoPushToken();
      if (token) {
        try {
          await setPushToken({ variables: { token } });
        } catch {}
      }
    })();
  }, [meData?.me?.uid, setPushToken]);

  const { data: bankData, refetch: refetchBank } = useQuery<{
    myBank: {
      uid: string;
      activeReward?: { id: string; expiresAt: string } | null;
    };
  }>(MY_BANK_QUERY, {
    fetchPolicy: "cache-and-network",
    pollInterval: 15000,
    skip: isParent,
  });

  const activeReward = bankData?.myBank?.activeReward ?? null;
  const expiresAtMs = activeReward?.expiresAt
    ? new Date(activeReward.expiresAt).getTime()
    : null;
  const isUnlocked = expiresAtMs !== null && expiresAtMs > Date.now();

  const [tab, setTab] = useState<Tab>("home");
  const [modal, setModal] = useState<Modal>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [completedMission, setCompletedMission] =
    useState<CompletedMission | null>(null);

  const openTask = useCallback((task: Task) => {
    setActiveTask(task);
    setModal("task");
  }, []);

  const closeModal = useCallback(() => {
    setActiveTask(null);
    setModal(null);
  }, []);

  const completeTask = useCallback((task: Task, reward: RewardType) => {
    setCompletedMission({ task, reward, completedAt: Date.now() });
    setModal("mission-complete");
  }, []);

  const continueFromMission = useCallback(() => {
    setCompletedMission(null);
    setActiveTask(null);
    setModal(null);
    setTab("home");
    refetchBank();
  }, [refetchBank]);

  const expireReward = useCallback(() => {
    refetchBank();
  }, [refetchBank]);

  const renderHomeTab = () => {
    if (isParent) {
      return <ParentReviewScreen />;
    }
    if (isUnlocked && expiresAtMs) {
      return (
        <UnlockedScreen
          endsAt={expiresAtMs}
          onExpire={expireReward}
          onLockNow={expireReward}
        />
      );
    }
    return <LockScreen onTaskPress={openTask} />;
  };

  const isModalOpen = modal !== null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        {!isModalOpen && (
          <TabContainer tab={tab}>
            {tab === "home" && renderHomeTab()}
            {tab === "progress" && <ProgressScreen />}
            {tab === "rewards" && <RewardsScreen />}
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

function Root() {
  const { user, initializing } = useAuth();
  if (initializing) return <SplashScreen />;
  if (!user)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <AuthScreen />
      </SafeAreaView>
    );
  return <MainApp />;
}

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <StatusBar style="dark" />
          <Root />
        </View>
      </AuthProvider>
    </ApolloProvider>
  );
}
