import { gql } from "@apollo/client";

export const SET_PUSH_TOKEN = gql`
  mutation SetPushToken($token: String) {
    setPushToken(token: $token)
  }
`;

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

export const PAIR_CHILD = gql`
  mutation PairChild($code: String!) {
    pairChild(code: $code) {
      customToken
      child {
        uid
        name
        role
        familyId
        parentUid
      }
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
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      ${TASK_FIELDS}
    }
  }
`;

const SUBMISSION_FIELDS = `
  id
  taskId
  status
  chosenReward
  rewardId
  rejectionReason
  submittedAt
  reviewedAt
`;

export const SUBMIT_TIMER = gql`
  mutation SubmitTimer($input: SubmitTimerTaskInput!) {
    submitTimerTask(input: $input) {
      ${SUBMISSION_FIELDS}
    }
  }
`;

export const SUBMIT_QUIZ = gql`
  mutation SubmitQuiz($input: SubmitQuizTaskInput!) {
    submitQuizTask(input: $input) {
      ${SUBMISSION_FIELDS}
      quizScore
    }
  }
`;

export const SUBMIT_PHOTO = gql`
  mutation SubmitPhoto($input: SubmitPhotoTaskInput!) {
    submitPhotoTask(input: $input) {
      ${SUBMISSION_FIELDS}
      photoStoragePath
    }
  }
`;

export const REQUEST_PHOTO_UPLOAD = gql`
  mutation RequestPhotoUpload($input: RequestPhotoUploadInput!) {
    requestPhotoUpload(input: $input) {
      storagePath
      uploadUrl
      contentType
    }
  }
`;

export const MY_BANK_QUERY = gql`
  query MyBank {
    myBank {
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

export const MY_REWARDS_QUERY = gql`
  query MyRewards {
    myRewards {
      id
      type
      amount
      status
      createdAt
      expiresAt
      taskId
      task {
        id
        type
        title
      }
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

export const MY_SUBMISSIONS_QUERY = gql`
  query MySubmissions {
    mySubmissions {
      ${SUBMISSION_FIELDS}
      photoDownloadUrl
    }
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

export const DELETE_MY_ACCOUNT = gql`
  mutation DeleteMyAccount {
    deleteMyAccount
  }
`;

export const REWARD_ITEMS_QUERY = gql`
  query RewardItems {
    rewardItems {
      id
      name
      description
      emoji
      costPoints
      stock
      active
    }
  }
`;

export const REDEEM_REWARD_ITEM = gql`
  mutation RedeemRewardItem($id: ID!) {
    redeemRewardItem(id: $id) {
      id
      itemName
      costPoints
      status
      redeemedAt
    }
  }
`;

export const MY_REDEMPTIONS = gql`
  query Redemptions {
    redemptions {
      id
      itemName
      costPoints
      status
      redeemedAt
      fulfilledAt
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
