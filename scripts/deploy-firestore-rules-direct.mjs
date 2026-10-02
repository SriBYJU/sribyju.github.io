import { readFile } from 'node:fs/promises';
import { createSign } from 'node:crypto';

const projectId = process.env.FIREBASE_PROJECT_ID || 'gradescope-539dd';
const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!rawServiceAccount) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT is required');
}

const serviceAccount = JSON.parse(rawServiceAccount);
const rulesContent = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function makeJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));

  const unsigned = header + '.' + payload;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();

  const signature = signer
    .sign(serviceAccount.private_key)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return unsigned + '.' + signature;
}

async function getAccessToken() {
  const form = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: makeJwt()
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form
  });

  const json = await response.json();
  if (!response.ok || !json.access_token) {
    throw new Error('OAuth token request failed (' + response.status + '): ' + JSON.stringify(json));
  }
  return json.access_token;
}

const token = await getAccessToken();

async function rulesApi(method, path, body) {
  const response = await fetch('https://firebaserules.googleapis.com/v1' + path, {
    method,
    headers: {
      authorization: 'Bearer ' + token,
      'content-type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  return { ok: response.ok, status: response.status, json };
}

const source = {
  files: [{
    name: 'firestore.rules',
    content: rulesContent
  }]
};

const created = await rulesApi(
  'POST',
  '/projects/' + encodeURIComponent(projectId) + '/rulesets',
  { source }
);

if (!created.ok || !created.json || !created.json.name) {
  throw new Error('Ruleset creation failed (' + created.status + '): ' + JSON.stringify(created.json));
}

const rulesetName = created.json.name;
const releaseName = 'projects/' + projectId + '/releases/cloud.firestore';

const patched = await rulesApi(
  'PATCH',
  '/projects/' + encodeURIComponent(projectId) + '/releases/cloud.firestore',
  { release: { name: releaseName, rulesetName } }
);

if (!patched.ok) {
  const createdRelease = await rulesApi(
    'POST',
    '/projects/' + encodeURIComponent(projectId) + '/releases',
    { name: releaseName, rulesetName }
  );

  if (!createdRelease.ok) {
    throw new Error(
      'Ruleset created but release failed. PATCH ' +
      patched.status + ': ' + JSON.stringify(patched.json) +
      '; POST ' + createdRelease.status + ': ' + JSON.stringify(createdRelease.json)
    );
  }
}

console.log('Firestore rules deployed via Firebase Rules API: ' + rulesetName);
