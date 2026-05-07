import { RestrictedApp, Task } from "../types";

export const restrictedApps: RestrictedApp[] = [
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "youtube", name: "YouTube", icon: "📺" },
  { id: "roblox", name: "Roblox", icon: "🎮" },
  { id: "snap", name: "Snapchat", icon: "👻" },
];

export const APP_BRAND_COLOR: Record<
  string,
  {
    bg: string;
    iconColor: string;
    gradientTop?: string;
    gradientBottom?: string;
  }
> = {
  tiktok: { bg: "#000000", iconColor: "#FFFFFF" },
  instagram: {
    bg: "#E4405F",
    iconColor: "#FFFFFF",
    gradientTop: "#FBAA47",
    gradientBottom: "#833AB4",
  },
  youtube: { bg: "#FF0000", iconColor: "#FFFFFF" },
  roblox: { bg: "#1F2126", iconColor: "#FFFFFF" },
  snap: { bg: "#FFFC00", iconColor: "#FFFFFF" },
};

export const initialTasks: Task[] = [
  {
    id: "t-walk-1",
    type: "walk",
    title: "Walk Adventure",
    description: "Walk 20 steps to complete the mission",
    rewards: { screenTimeMin: 30, points: 50, cashUsd: 1.0 },
    status: "available",
    walkTargetSeconds: 60,
    walkTargetSteps: 20,
  },
  {
    id: "t-quiz-1",
    type: "video-quiz",
    title: "Quiz Challenge",
    description: "Answer 3 questions about what you watched",
    rewards: { screenTimeMin: 20, points: 30, cashUsd: 0.75 },
    status: "available",
    videoTitle: "Staying Safe Online (2:14)",
    quizSecondsPerQuestion: 140,
    quiz: [
      {
        question: "What was the speaker wearing halfway through the video?",
        options: ["Blue hat", "Funny green hat", "Red cap", "Black glasses"],
        correctIndex: 1,
      },
      {
        question: "Where did the video take place?",
        options: ["At the beach", "In a classroom", "In a restaurant", "At the park"],
        correctIndex: 1,
      },
      {
        question: "What was the main topic of the video?",
        options: ["Space", "Recycling", "Dinosaurs", "Cooking"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "t-photo-1",
    type: "photo",
    title: "Room Reset",
    description: "Take a photo of your clean room",
    rewards: { screenTimeMin: 25, points: 40, cashUsd: 1.25 },
    status: "available",
  },
];

export const PARENT_APPROVAL_DELAY_MS = 2500;
export const DEMO_REWARD_CAP_SECONDS = 60;
