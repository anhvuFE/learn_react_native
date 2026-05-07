// Seed full ScreenMindr demo data into Firebase Auth + Firestore.
// Run: node scripts/seed-real-data.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('../firebase-service-account.json')),
});

const auth = admin.auth();
const db = admin.firestore();

const PARENTS = [
  {
    email: 'vuxuananh22@gmail.com',
    password: '123456',
    name: 'Vu Xuan Anh',
    childName: 'Alex',
    withHistory: true,
  },
  {
    email: 'vuxuananh23@gmail.com',
    password: '123456',
    name: 'Vu Xuan Anh 2',
    childName: 'Sam',
    withHistory: false,
  },
];

const DEFAULT_APPS = [
  { appId: 'tiktok', name: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
  { appId: 'instagram', name: 'Instagram', packageName: 'com.instagram.android' },
  { appId: 'youtube', name: 'YouTube', packageName: 'com.google.android.youtube' },
  { appId: 'roblox', name: 'Roblox', packageName: 'com.roblox.client' },
  { appId: 'snap', name: 'Snapchat', packageName: 'com.snapchat.android' },
];

const TASK_TEMPLATES = [
  {
    type: 'walk',
    title: 'Walk Adventure',
    description: 'Walk 20 steps to complete the mission',
    rewards: { screenTimeMin: 30, points: 50, cashUsd: 1.0 },
    walkTargetSeconds: 60,
    walkTargetSteps: 20,
  },
  {
    type: 'video_quiz',
    title: 'Quiz Challenge',
    description: 'Answer 3 questions about what you watched',
    rewards: { screenTimeMin: 20, points: 30, cashUsd: 0.75 },
    videoTitle: 'Staying Safe Online (2:14)',
    quizSecondsPerQuestion: 140,
    quiz: [
      {
        question: 'What was the speaker wearing halfway through the video?',
        options: ['Blue hat', 'Funny green hat', 'Red cap', 'Black glasses'],
        correctIndex: 1,
      },
      {
        question: 'Where did the video take place?',
        options: ['At the beach', 'In a classroom', 'In a restaurant', 'At the park'],
        correctIndex: 1,
      },
      {
        question: 'What was the main topic of the video?',
        options: ['Space', 'Recycling', 'Dinosaurs', 'Cooking'],
        correctIndex: 1,
      },
    ],
  },
  {
    type: 'photo',
    title: 'Room Reset',
    description: 'Take a photo of your clean room',
    rewards: { screenTimeMin: 25, points: 40, cashUsd: 1.25 },
  },
];

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateCode(len = 6) {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return s;
}

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}
function isoMinutesAgo(min) {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}
function isoMinutesFromNow(min) {
  return new Date(Date.now() + min * 60 * 1000).toISOString();
}

async function ensureAuthUser(email, password, displayName) {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password, displayName, email });
    console.log(`  ↻ updated auth user ${email} (${user.uid})`);
    return user;
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      const user = await auth.createUser({ email, password, displayName });
      console.log(`  ＋ created auth user ${email} (${user.uid})`);
      return user;
    }
    throw e;
  }
}

async function deleteTestParents() {
  // Iterate Auth, find emails starting with `test-parent-` and delete (incl. their data)
  let pageToken;
  const toDelete = [];
  do {
    const res = await auth.listUsers(1000, pageToken);
    for (const u of res.users) {
      if (u.email && u.email.startsWith('test-parent-')) toDelete.push(u);
      if (u.uid && u.uid.startsWith('test-parent-')) toDelete.push(u);
    }
    pageToken = res.pageToken;
  } while (pageToken);

  for (const u of toDelete) {
    try {
      await auth.deleteUser(u.uid);
    } catch {}
    await deleteFirestoreCascade(u.uid);
  }
  if (toDelete.length) {
    console.log(`  🗑  deleted ${toDelete.length} legacy test-parent users`);
  }
}

async function deleteFirestoreCascade(uid) {
  // Delete user doc
  await db.collection('users').doc(uid).delete().catch(() => {});

  // Delete families where parentUid == uid (and their child users)
  const fams = await db.collection('families').where('parentUid', '==', uid).get();
  for (const fam of fams.docs) {
    const data = fam.data();
    for (const childUid of data.childUids ?? []) {
      await auth.deleteUser(childUid).catch(() => {});
      await db.collection('users').doc(childUid).delete().catch(() => {});
    }
    await fam.ref.delete();

    // Delete tasks, submissions, rewards, restrictedApps for this family
    for (const col of ['tasks', 'submissions', 'rewards', 'restrictedApps', 'pairingCodes']) {
      const snap = await db
        .collection(col)
        .where('familyId', '==', fam.id)
        .get();
      for (const d of snap.docs) await d.ref.delete();
    }
  }
}

async function clearParentData(parentUid) {
  const fams = await db
    .collection('families')
    .where('parentUid', '==', parentUid)
    .get();
  for (const fam of fams.docs) {
    const data = fam.data();
    for (const childUid of data.childUids ?? []) {
      await auth.deleteUser(childUid).catch(() => {});
      await db.collection('users').doc(childUid).delete().catch(() => {});
    }
    await fam.ref.delete();
    for (const col of ['tasks', 'submissions', 'rewards', 'restrictedApps', 'pairingCodes']) {
      const snap = await db
        .collection(col)
        .where('familyId', '==', fam.id)
        .get();
      for (const d of snap.docs) await d.ref.delete();
    }
  }
  await db.collection('users').doc(parentUid).delete().catch(() => {});
}

async function seedParent({ email, password, name, childName, withHistory }) {
  console.log(`\n=== Seeding ${email} ===`);

  const parent = await ensureAuthUser(email, password, name);
  await clearParentData(parent.uid);

  // Family
  const familyRef = await db.collection('families').add({
    parentUid: parent.uid,
    childUids: [],
    createdAt: isoDaysAgo(7),
  });
  const familyId = familyRef.id;
  console.log(`  ＋ family ${familyId}`);

  // Parent profile
  await db.collection('users').doc(parent.uid).set({
    email,
    name,
    role: 'parent',
    familyId,
    parentUid: null,
    createdAt: isoDaysAgo(7),
  });

  // Restricted apps
  const batch = db.batch();
  for (const app of DEFAULT_APPS) {
    const ref = db.collection('restrictedApps').doc();
    batch.set(ref, {
      familyId,
      ...app,
      createdAt: isoDaysAgo(7),
    });
  }
  await batch.commit();
  console.log(`  ＋ ${DEFAULT_APPS.length} restricted apps`);

  // Tasks
  const taskIds = {};
  for (const tpl of TASK_TEMPLATES) {
    const ref = await db.collection('tasks').add({
      ...tpl,
      familyId,
      status: 'available',
      createdAt: isoDaysAgo(5),
    });
    taskIds[tpl.type] = ref.id;
  }
  console.log(`  ＋ ${TASK_TEMPLATES.length} tasks`);

  // Child user (paired)
  const childAuth = await auth.createUser({ displayName: childName });
  await db.collection('users').doc(childAuth.uid).set({
    email: null,
    name: childName,
    role: 'child',
    familyId,
    parentUid: parent.uid,
    createdAt: isoDaysAgo(6),
  });
  await familyRef.update({
    childUids: admin.firestore.FieldValue.arrayUnion(childAuth.uid),
  });
  console.log(`  ＋ child ${childName} (${childAuth.uid})`);

  // Active pairing code (parent can use this to pair another device immediately)
  const code = generateCode();
  await db
    .collection('pairingCodes')
    .doc(code)
    .set({
      code,
      parentUid: parent.uid,
      familyId,
      childName: 'New Device',
      used: false,
      expiresAt: isoMinutesFromNow(60 * 23),
      createdAt: isoMinutesAgo(60),
    });
  console.log(`  ＋ active pairing code ${code} (expires in ~23h)`);

  // Used (consumed) pairing code — historical
  const usedCode = generateCode();
  await db
    .collection('pairingCodes')
    .doc(usedCode)
    .set({
      code: usedCode,
      parentUid: parent.uid,
      familyId,
      childName,
      used: true,
      usedAt: isoDaysAgo(6),
      childUid: childAuth.uid,
      expiresAt: isoDaysAgo(5),
      createdAt: isoDaysAgo(7),
    });

  if (!withHistory) return { parent, familyId, child: childAuth };

  // Second child for richer family demo
  const secondChildName = 'Mia';
  const secondChildAuth = await auth.createUser({ displayName: secondChildName });
  await db.collection('users').doc(secondChildAuth.uid).set({
    email: null,
    name: secondChildName,
    role: 'child',
    familyId,
    parentUid: parent.uid,
    createdAt: isoDaysAgo(4),
  });
  await familyRef.update({
    childUids: admin.firestore.FieldValue.arrayUnion(secondChildAuth.uid),
  });
  console.log(`  ＋ child ${secondChildName} (${secondChildAuth.uid})`);

  // Pending submissions waiting for parent review
  const pendingPhoto = await db.collection('submissions').add({
    taskId: taskIds.photo,
    childUid: childAuth.uid,
    familyId,
    chosenReward: 'screen-time',
    status: 'pending',
    submittedAt: isoMinutesAgo(15),
    photoStoragePath: `submissions/${familyId}/${taskIds.photo}/pending-${Date.now()}.jpg`,
  });
  const pendingTimer = await db.collection('submissions').add({
    taskId: taskIds.walk,
    childUid: secondChildAuth.uid,
    familyId,
    chosenReward: 'cash',
    status: 'pending',
    submittedAt: isoMinutesAgo(40),
    timerSeconds: 70,
  });
  console.log(`  ＋ 2 pending submissions (${pendingPhoto.id}, ${pendingTimer.id})`);

  // Rejected submission (historical)
  const rejected = await db.collection('submissions').add({
    taskId: taskIds.video_quiz,
    childUid: childAuth.uid,
    familyId,
    chosenReward: 'points',
    status: 'rejected',
    quizScore: 50,
    submittedAt: isoDaysAgo(2),
    reviewedAt: isoDaysAgo(2),
    reviewerUid: 'system:auto-quiz',
    rejectionReason: 'Score 50% below pass threshold 80%',
  });
  console.log(`  ＋ 1 rejected submission (${rejected.id})`);

  // History: 5 completed submissions across last 6 days
  const history = [
    {
      taskKey: 'walk',
      reward: 'screen-time',
      daysAgo: 5,
      timerSeconds: 62,
      autoApprove: true,
    },
    {
      taskKey: 'video_quiz',
      reward: 'points',
      daysAgo: 4,
      quizScore: 100,
      autoApprove: true,
    },
    {
      taskKey: 'photo',
      reward: 'cash',
      daysAgo: 3,
      photo: true,
      autoApprove: true,
    },
    {
      taskKey: 'walk',
      reward: 'points',
      daysAgo: 2,
      timerSeconds: 65,
      autoApprove: true,
    },
    {
      taskKey: 'video_quiz',
      reward: 'screen-time',
      daysAgo: 1,
      quizScore: 100,
      autoApprove: true,
      activeReward: true,
    },
  ];

  for (const h of history) {
    const tpl = TASK_TEMPLATES.find((t) => t.type === h.taskKey);
    const subAt = isoDaysAgo(h.daysAgo);
    const reviewAt = new Date(
      new Date(subAt).getTime() + 30 * 1000,
    ).toISOString();

    const subRef = await db.collection('submissions').add({
      taskId: taskIds[h.taskKey],
      childUid: childAuth.uid,
      familyId,
      chosenReward: h.reward,
      status: 'approved',
      submittedAt: subAt,
      reviewedAt: reviewAt,
      reviewerUid: h.autoApprove ? 'system:seed' : parent.uid,
      ...(h.timerSeconds ? { timerSeconds: h.timerSeconds } : {}),
      ...(h.quizScore ? { quizScore: h.quizScore } : {}),
      ...(h.photo
        ? {
            photoStoragePath: `submissions/${familyId}/${taskIds[h.taskKey]}/seed.jpg`,
          }
        : {}),
    });

    const amount =
      h.reward === 'screen-time'
        ? tpl.rewards.screenTimeMin
        : h.reward === 'points'
          ? tpl.rewards.points
          : tpl.rewards.cashUsd;

    const isActive = h.activeReward === true;
    const rewardData = {
      childUid: childAuth.uid,
      familyId,
      taskId: taskIds[h.taskKey],
      submissionId: subRef.id,
      type: h.reward,
      amount,
      status:
        h.reward === 'screen-time'
          ? isActive
            ? 'active'
            : 'expired'
          : 'claimed',
      createdAt: reviewAt,
    };
    if (h.reward === 'screen-time') {
      rewardData.startedAt = reviewAt;
      rewardData.expiresAt = isActive
        ? isoMinutesFromNow(20)
        : new Date(
            new Date(reviewAt).getTime() + tpl.rewards.screenTimeMin * 60 * 1000,
          ).toISOString();
    }
    const rewardRef = await db.collection('rewards').add(rewardData);
    await subRef.update({ rewardId: rewardRef.id });
  }
  console.log(`  ＋ ${history.length} historical submissions + rewards`);

  return { parent, familyId, child: childAuth };
}

(async () => {
  console.log('Cleaning legacy test data…');
  await deleteTestParents();

  for (const cfg of PARENTS) {
    await seedParent(cfg);
  }

  console.log('\n✓ Seed complete');
  console.log('Sign in (FE) with:');
  for (const p of PARENTS) {
    console.log(`  • ${p.email} / ${p.password}`);
  }
  process.exit(0);
})().catch((e) => {
  console.error('\n✗ FAIL:', e);
  process.exit(1);
});
