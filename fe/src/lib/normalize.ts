import type { Task, TaskStatus, TaskType, RewardType } from "../types";

// BE uses uppercase GraphQL enum keys (WALK, VIDEO_QUIZ, …)
// FE uses kebab/lowercase strings ('walk', 'video-quiz', …)

export function feTaskType(beType: string): TaskType {
  if (beType === "VIDEO_QUIZ") return "video-quiz";
  return beType.toLowerCase() as TaskType;
}

export function beTaskType(feType: TaskType): string {
  if (feType === "video-quiz") return "VIDEO_QUIZ";
  return feType.toUpperCase();
}

export function feTaskStatus(beStatus: string): TaskStatus {
  if (beStatus === "PENDING_APPROVAL") return "pending-approval";
  return beStatus.toLowerCase() as TaskStatus;
}

export function beRewardType(feType: RewardType): string {
  if (feType === "screen-time") return "SCREEN_TIME";
  return feType.toUpperCase();
}

export function feRewardType(beType: string): RewardType {
  if (beType === "SCREEN_TIME") return "screen-time";
  return beType.toLowerCase() as RewardType;
}

export interface BeTask {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  walkTargetSeconds?: number | null;
  walkTargetSteps?: number | null;
  videoTitle?: string | null;
  quizSecondsPerQuestion?: number | null;
  rewards: { screenTimeMin: number; points: number; cashUsd: number };
  quiz?:
    | {
        question: string;
        options: string[];
        correctIndex: number;
      }[]
    | null;
}

export function normalizeTask(t: BeTask): Task {
  return {
    id: t.id,
    type: feTaskType(t.type),
    title: t.title,
    description: t.description,
    status: feTaskStatus(t.status),
    rewards: t.rewards,
    walkTargetSeconds: t.walkTargetSeconds ?? undefined,
    walkTargetSteps: t.walkTargetSteps ?? undefined,
    videoTitle: t.videoTitle ?? undefined,
    quizSecondsPerQuestion: t.quizSecondsPerQuestion ?? undefined,
    quiz: t.quiz ?? undefined,
  };
}
