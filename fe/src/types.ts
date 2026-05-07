export type TaskType = "video-quiz" | "photo" | "walk";

export type TaskStatus =
  | "available"
  | "pending-approval"
  | "approved"
  | "rejected";

export type RewardType = "screen-time" | "points" | "cash";

export interface Rewards {
  screenTimeMin: number;
  points: number;
  cashUsd: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  rewards: Rewards;
  status: TaskStatus;
  videoTitle?: string;
  quiz?: QuizQuestion[];
  quizSecondsPerQuestion?: number;
  walkTargetSeconds?: number;
  walkTargetSteps?: number;
}

export interface RestrictedApp {
  id: string;
  name: string;
  icon: string;
}

export type Tab = "home" | "progress" | "rewards" | "menu";

export type Modal = "task" | "mission-complete" | null;

export interface CompletedMission {
  task: Task;
  reward: RewardType;
  completedAt: number;
}
