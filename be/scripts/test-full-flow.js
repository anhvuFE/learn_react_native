// Full E2E: parent → pair child → child submits → parent approves → reward issued → bank
// Run: node scripts/test-full-flow.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('../firebase-service-account.json')),
});

const API_KEY = process.env.FIREBASE_WEB_API_KEY;
if (!API_KEY) {
  console.error('FIREBASE_WEB_API_KEY missing in be/.env');
  process.exit(1);
}
const BE = process.env.BE_URL || 'http://localhost:3000/graphql';

async function ct2id(token) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, returnSecureToken: true }),
    },
  );
  const j = await r.json();
  if (!r.ok) throw new Error(`signIn failed: ${JSON.stringify(j)}`);
  return j.idToken;
}

async function gql(query, variables, idToken) {
  const r = await fetch(BE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) {
    console.error('GraphQL errors:', JSON.stringify(j.errors, null, 2));
    throw new Error(j.errors[0].message);
  }
  return j.data;
}

function log(step, label, data) {
  console.log(`\n[${step}] ${label}`);
  console.log(JSON.stringify(data, null, 2));
}

(async () => {
  // ============ 1. Provision parent ============
  const parentUid = `test-parent-${Date.now()}`;
  await admin
    .auth()
    .createUser({ uid: parentUid, email: `${parentUid}@example.com`, displayName: 'Parent' });
  const parentCT = await admin.auth().createCustomToken(parentUid);
  const parentToken = await ct2id(parentCT);
  log(1, 'Parent signed in', { uid: parentUid });

  // ============ 2. Parent creates 2 tasks (quiz + timer) ============
  const quizTask = await gql(
    `mutation Create($input: CreateTaskInput!) { createTask(input: $input) { id title type } }`,
    {
      input: {
        type: 'VIDEO_QUIZ',
        title: 'Safety Quiz',
        description: 'Pass with ≥80%',
        rewards: { screenTimeMin: 20, points: 30, cashUsd: 0.5 },
      },
    },
    parentToken,
  );
  log(2, 'Created quiz task', quizTask.createTask);

  const timerTask = await gql(
    `mutation Create($input: CreateTaskInput!) { createTask(input: $input) { id title type } }`,
    {
      input: {
        type: 'WALK',
        title: 'Walk 60s',
        description: 'Walk',
        rewards: { screenTimeMin: 30, points: 50, cashUsd: 1.0 },
        walkTargetSeconds: 60,
        walkTargetSteps: 20,
      },
    },
    parentToken,
  );
  log(2, 'Created timer task', timerTask.createTask);

  // ============ 3. Parent generates pairing code ============
  const { createPairingCode } = await gql(
    `mutation { createPairingCode(childName: "Alex") { code expiresAt } }`,
    {},
    parentToken,
  );
  log(3, 'Pairing code', createPairingCode);

  // ============ 4. Child pairs ============
  const { pairChild } = await gql(
    `mutation { pairChild(code: "${createPairingCode.code}") { customToken child { uid name role familyId } } }`,
  );
  const childToken = await ct2id(pairChild.customToken);
  log(4, 'Child paired + signed in', pairChild.child);

  // ============ 5. Child submits QUIZ (auto-approves) ============
  const quizPass = await gql(
    `mutation Submit($input: SubmitQuizTaskInput!) {
       submitQuizTask(input: $input) { id status quizScore rewardId }
     }`,
    {
      input: { taskId: quizTask.createTask.id, chosenReward: 'POINTS', quizScore: 100 },
    },
    childToken,
  );
  log(5, 'Quiz submission (100% → auto-approve POINTS)', quizPass.submitQuizTask);

  const quizFail = await gql(
    `mutation Submit($input: SubmitQuizTaskInput!) {
       submitQuizTask(input: $input) { id status quizScore rejectionReason }
     }`,
    {
      input: { taskId: quizTask.createTask.id, chosenReward: 'SCREEN_TIME', quizScore: 50 },
    },
    childToken,
  );
  log(5, 'Quiz submission (50% → auto-reject)', quizFail.submitQuizTask);

  // ============ 6. Child submits TIMER (pending) ============
  const timerSub = await gql(
    `mutation Submit($input: SubmitTimerTaskInput!) {
       submitTimerTask(input: $input) { id status timerSeconds chosenReward }
     }`,
    {
      input: { taskId: timerTask.createTask.id, chosenReward: 'SCREEN_TIME', timerSeconds: 65 },
    },
    childToken,
  );
  log(6, 'Timer submission pending', timerSub.submitTimerTask);

  // ============ 7. Parent sees pending submissions ============
  const pending = await gql(
    `{ pendingSubmissions { id taskId status timerSeconds chosenReward } }`,
    {},
    parentToken,
  );
  log(7, 'Parent pending list', pending.pendingSubmissions);

  // ============ 8. Parent approves timer ============
  const approved = await gql(
    `mutation Approve($id: ID!) {
       approveSubmission(id: $id) { id status reviewerUid rewardId }
     }`,
    { id: timerSub.submitTimerTask.id },
    parentToken,
  );
  log(8, 'Parent approved timer', approved.approveSubmission);

  // ============ 9. Child checks bank ============
  const bank = await gql(
    `{ myBank { uid points cashUsd screenTimeMinutesRemaining activeReward { id type amount expiresAt } } }`,
    {},
    childToken,
  );
  log(9, 'Child bank', bank.myBank);

  // ============ 10. Reward history ============
  const history = await gql(
    `{ myRewards { id type amount status createdAt } }`,
    {},
    childToken,
  );
  log(10, 'Reward history', history.myRewards);

  console.log('\n✓ Full flow OK');
  process.exit(0);
})().catch((e) => {
  console.error('\n✗ FAIL:', e.message);
  process.exit(1);
});
