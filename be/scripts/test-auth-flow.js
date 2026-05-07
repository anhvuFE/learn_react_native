// E2E test: parent sign-in → me → pairing → child sign-in → me as child
// Run after `npm run start:dev` is up.

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
const BE_URL = process.env.BE_URL || 'http://localhost:3000/graphql';

async function customTokenToIdToken(customToken) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const j = await r.json();
  if (!r.ok) throw new Error(`signInWithCustomToken failed: ${JSON.stringify(j)}`);
  return j.idToken;
}

async function gql(query, idToken) {
  const r = await fetch(BE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ query }),
  });
  return r.json();
}

function log(step, label, data) {
  console.log(`\n[${step}] ${label}`);
  console.log(JSON.stringify(data, null, 2));
}

(async () => {
  const parentUid = `test-parent-${Date.now()}`;
  const parentEmail = `${parentUid}@example.com`;

  // 1. Create parent Firebase user + custom token (no claims = parent default)
  await admin.auth().createUser({
    uid: parentUid,
    email: parentEmail,
    displayName: 'Test Parent',
  });
  const parentCT = await admin.auth().createCustomToken(parentUid);
  const parentIdToken = await customTokenToIdToken(parentCT);
  log(1, 'Parent ID token issued', { uid: parentUid, email: parentEmail });

  // 2. me — expect auto-created profile + family
  const meRes = await gql(
    '{ me { uid email name role familyId parentUid createdAt } }',
    parentIdToken,
  );
  log(2, 'parent me query', meRes);

  // 3. myFamily
  const famRes = await gql(
    '{ myFamily { id parentUid childUids createdAt } }',
    parentIdToken,
  );
  log(3, 'parent myFamily', famRes);

  // 4. createPairingCode
  const pcRes = await gql(
    'mutation { createPairingCode(childName: "Alex") { code expiresAt childName } }',
    parentIdToken,
  );
  log(4, 'createPairingCode', pcRes);
  const code = pcRes.data?.createPairingCode?.code;
  if (!code) throw new Error('No pairing code returned');

  // 5. pairChild (no auth)
  const pairRes = await gql(
    `mutation { pairChild(code: "${code}") { customToken child { uid name role familyId parentUid } } }`,
  );
  log(5, 'pairChild', { customToken: '[redacted]', child: pairRes.data?.pairChild?.child });
  const childCT = pairRes.data?.pairChild?.customToken;
  if (!childCT) throw new Error('No custom token from pairChild');

  // 6. Convert child custom token → ID token, call me as child
  const childIdToken = await customTokenToIdToken(childCT);
  const childMeRes = await gql(
    '{ me { uid name role familyId parentUid createdAt } }',
    childIdToken,
  );
  log(6, 'child me query', childMeRes);

  // 7. Verify family.childUids updated
  const fam2Res = await gql(
    '{ myFamily { id childUids } }',
    parentIdToken,
  );
  log(7, 'parent myFamily after pair', fam2Res);

  console.log('\n✓ E2E auth flow OK');
  process.exit(0);
})().catch((e) => {
  console.error('\n✗ FAIL:', e);
  process.exit(1);
});
