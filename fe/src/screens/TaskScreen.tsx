import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import TopBar from "../components/TopBar";
import PhotoTask from "../tasks/PhotoTask";
import QuizTask from "../tasks/QuizTask";
import WalkTask from "../tasks/WalkTask";
import { RewardType, Task } from "../types";

interface Props {
  task: Task;
  onBack: () => void;
  onComplete: (task: Task, reward: RewardType) => void;
  onCancel: () => void;
}

const TaskScreen: React.FC<Props> = ({ task, onBack, onComplete, onCancel }) => {
  const [reward, setReward] = useState<RewardType>("screen-time");

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <TopBar title={task.title} onBack={onBack} />

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        {task.type === "walk" && (
          <WalkTask
            task={task}
            reward={reward}
            onChangeReward={setReward}
            onComplete={(r) => onComplete(task, r)}
          />
        )}

        {task.type === "video-quiz" && (
          <QuizTask
            task={task}
            reward={reward}
            onChangeReward={setReward}
            onPass={(r) => onComplete(task, r)}
            onFail={onCancel}
          />
        )}

        {task.type === "photo" && (
          <PhotoTask
            task={task}
            reward={reward}
            onChangeReward={setReward}
            onApproved={(r) => onComplete(task, r)}
            onCancel={onCancel}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default TaskScreen;
