import { gql } from "@apollo/client";

export const ME_QUERY = gql`
  query Me {
    me {
      uid
      email
      name
      role
      familyId
      parentUid
      createdAt
      autoApproveQuiz
      autoApproveWalk
      requirePhotoApproval
      notifyOnSubmit
      autoLock
      bedtimeMode
      dailyScreenTimeCapMin
      photoStoragePath
      photoDownloadUrl
    }
  }
`;

export const REQUEST_AVATAR_UPLOAD = gql`
  mutation RequestAvatarUpload($contentType: String!) {
    requestAvatarUpload(contentType: $contentType)
  }
`;

export const SET_WEB_PUSH_TOKEN = gql`
  mutation SetWebPushToken($token: String) {
    setWebPushToken(token: $token)
  }
`;

export const UPDATE_MY_PROFILE = gql`
  mutation UpdateMyProfile($input: UpdateProfileInput!) {
    updateMyProfile(input: $input) {
      uid
      name
    }
  }
`;

export const UPDATE_MY_SETTINGS = gql`
  mutation UpdateMySettings($input: UpdateSettingsInput!) {
    updateMySettings(input: $input) {
      uid
      autoApproveQuiz
      autoApproveWalk
      requirePhotoApproval
      notifyOnSubmit
      autoLock
      bedtimeMode
    }
  }
`;

export const CREATE_PAIRING_CODE = gql`
  mutation CreatePairingCode($childName: String!) {
    createPairingCode(childName: $childName) {
      code
      expiresAt
      childName
    }
  }
`;

const TASK_FIELDS = `
  id
  type
  title
  description
  status
  recurrence
  walkTargetSeconds
  walkTargetSteps
  videoTitle
  quizSecondsPerQuestion
  rewards { screenTimeMin points cashUsd }
  quiz { question options correctIndex }
`;

export const TASKS_QUERY = gql`
  query Tasks {
    tasks {
      ${TASK_FIELDS}
      assignedToChildUid
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      ${TASK_FIELDS}
      assignedToChildUid
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      ${TASK_FIELDS}
      assignedToChildUid
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

export const MY_FAMILY_QUERY = gql`
  query MyFamily {
    myFamily {
      id
      parentUid
      childUids
      createdAt
      children {
        uid
        name
        role
        email
      }
    }
  }
`;

export const MY_PAIRING_CODES = gql`
  query MyPairingCodes {
    myPairingCodes {
      code
      expiresAt
      childName
    }
  }
`;

export const PENDING_SUBMISSIONS = gql`
  query PendingSubmissions {
    pendingSubmissions {
      id
      taskId
      childUid
      familyId
      chosenReward
      status
      submittedAt
      timerSeconds
      quizScore
      photoStoragePath
      photoDownloadUrl
    }
  }
`;

export const APPROVE_SUBMISSION = gql`
  mutation ApproveSubmission($id: ID!) {
    approveSubmission(id: $id) {
      id
      status
      rewardId
    }
  }
`;

export const REJECT_SUBMISSION = gql`
  mutation RejectSubmission($input: RejectSubmissionInput!) {
    rejectSubmission(input: $input) {
      id
      status
      rejectionReason
    }
  }
`;

export const CHILD_BANK_QUERY = gql`
  query ChildBank($childUid: String!) {
    childBank(childUid: $childUid) {
      uid
      points
      cashUsd
      screenTimeMinutesRemaining
      activeReward {
        id
        type
        amount
        expiresAt
      }
    }
  }
`;

export const CHILD_REWARDS_QUERY = gql`
  query ChildRewards($childUid: String!) {
    childRewards(childUid: $childUid) {
      id
      type
      amount
      status
      createdAt
      expiresAt
    }
  }
`;

export const CANCEL_REWARD = gql`
  mutation CancelReward($id: ID!) {
    cancelReward(id: $id)
  }
`;

export const RESTRICTED_APPS_QUERY = gql`
  query RestrictedApps {
    restrictedApps {
      id
      appId
      name
      packageName
    }
  }
`;

export const ADD_RESTRICTED_APP = gql`
  mutation AddRestrictedApp($input: AddRestrictedAppInput!) {
    addRestrictedApp(input: $input) {
      id
      appId
      name
      packageName
    }
  }
`;

export const REMOVE_RESTRICTED_APP = gql`
  mutation RemoveRestrictedApp($id: ID!) {
    removeRestrictedApp(id: $id)
  }
`;

export const DELETE_MY_ACCOUNT = gql`
  mutation DeleteMyAccount {
    deleteMyAccount
  }
`;

export const REWARD_ITEMS_QUERY = gql`
  query RewardItems {
    rewardItems {
      id
      familyId
      name
      description
      emoji
      costPoints
      stock
      active
      createdAt
    }
  }
`;

export const CREATE_REWARD_ITEM = gql`
  mutation CreateRewardItem($input: CreateRewardItemInput!) {
    createRewardItem(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_REWARD_ITEM = gql`
  mutation UpdateRewardItem($id: ID!, $input: UpdateRewardItemInput!) {
    updateRewardItem(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_REWARD_ITEM = gql`
  mutation DeleteRewardItem($id: ID!) {
    deleteRewardItem(id: $id)
  }
`;

export const REDEMPTIONS_QUERY = gql`
  query Redemptions($childUid: String) {
    redemptions(childUid: $childUid) {
      id
      itemId
      itemName
      costPoints
      childUid
      status
      redeemedAt
      fulfilledAt
    }
  }
`;

export const FULFILL_REDEMPTION = gql`
  mutation FulfillRedemption($id: ID!) {
    fulfillRedemption(id: $id) {
      id
      status
    }
  }
`;

export const FAMILY_ACTIVITY = gql`
  query FamilyActivity($childUid: String, $limit: Int) {
    familyActivity(childUid: $childUid, limit: $limit) {
      id
      kind
      occurredAt
      childUid
      taskId
      taskTitle
      taskType
      rewardType
      rewardAmount
      rejectionReason
      quizScore
    }
  }
`;
