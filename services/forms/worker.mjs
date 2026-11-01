import {teaserConsent, teaserConsentVersion} from '../../src/teaser.mjs';
const PREFIX = '/api/watra';
const MAX_BODY = 16000;
const TYPES = ['customer', 'manufacturer', 'business', 'technical', 'launch_notification', 'project_update'];
const MODELS = ['undecided', 'IRIKON', 'IRIKON +e'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const consentText = {
  cs: 'Souhlasím se zasláním zprávy o zahájení prodeje e-mailem a s kontaktováním e-mailem nebo telefonicky ohledně mého zájmu o kamna WATRA.',
  en: 'I agree to receive a sales launch notification by email and to be contacted by email or phone about my interest in WATRA sauna heaters.'
};
const headers = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer'};
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {status, headers: {...headers, ...extra}});
const failure = (code, status = 400) => json({ok: false, error: code}, status);
const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
const origins = env => (env.ALLOWED_ORIGINS || 'https://watra.cz').split(',').map(value => value.trim());
const field = (data, name, max, required = false) => {
  const value = data[name] ?? '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw Error('invalid-fields');
  return value.trim();
};

export function validateSubmission(data) {
  if (!data || Array.isArray(data) || typeof data !== 'object') throw Error('invalid-fields');
  if (field(data, '_gotcha', 200)) throw Error('invalid-fields');
  const type = field(data, 'lead_type', 32, true), language = field(data, 'language', 2, true);
  if (!TYPES.includes(type) || !['cs', 'en'].includes(language)) throw Error('invalid-fields');
  const project = type === 'project_update';
  const launch = type === 'launch_notification' || project;
  const email = field(data, 'email', 254, true).toLowerCase();
  const phone = field(data, 'phone', 40, true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(email)) throw Error('invalid-fields');
  const digits = phone.replace(/\D/g, '');
  if (!/^[+()\d\s./-]+$/.test(phone) || digits.length < 7 || digits.length > 15) throw Error('invalid-fields');
  const model = field(data, 'model', 32) || 'undecided';
  if (!MODELS.includes(model)) throw Error('invalid-fields');
  const source = field(data, 'source_page', 100, true);
  if (!new RegExp('^/' + language + '/(?:' + (language === 'cs' ? 'kontakt/' : 'contact/') + ')?$').test(source)) throw Error('invalid-fields');
  const payload = {lead_type: type, language, source_page: source, name: field(data, 'name', 100, !launch), email, phone, model,
    country: field(data, 'country', 80), company: field(data, 'company', 120), website: field(data, 'website', 250), message: field(data, 'message', 3000)};
  if (launch) {
    const version = project ? teaserConsentVersion : 'launch-2026-10-19';
    const text = project ? teaserConsent[language] : consentText[language];
    if (data.contact_consent !== 'yes' || data.consent_version !== version || data.consent_text !== text) throw Error('invalid-consent');
    Object.assign(payload, {contact_consent: 'yes', consent_version: version, consent_text: text});
  }
  const requestId = field(data, '_request_id', 36) || crypto.randomUUID();
  if (!UUID.test(requestId)) throw Error('invalid-fields');
  return {requestId, payload, token: field(data, 'cf-turnstile-response', 2048, true)};
}

async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  if (!/^(application\/json|application\/x-www-form-urlencoded|multipart\/form-data)(?:;|$)/i.test(type)) throw Error('unsupported-content');
  const reader = request.body?.getReader();
  if (!reader) throw Error('invalid-fields');
  let size = 0;
  const chunks = [];
  for (;;) {
    const {value, done} = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BODY) {await reader.cancel(); throw Error('body-too-large');}
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.length;}
  const parsed = new Response(bytes, {headers: {'Content-Type': type}});
  if (type.toLowerCase().startsWith('application/json')) return parsed.json();
  const form = await parsed.formData(), data = {};
  for (const [name, value] of form) {
    if (Object.hasOwn(data, name) || typeof value !== 'string') throw Error('invalid-fields');
    data[name] = value;
  }
  return data;
}

async function authenticate(request, env) {
  const expected = env.CRM_SYNC_SECRET;
  if (!expected || expected.length < 32) return false;
  const supplied = request.headers.get('authorization') || '';
  if (supplied.length > 256) return false;
  const [a, b] = await Promise.all([digest(supplied), digest('Bearer ' + expected)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

async function submit(request, env, dependencies) {
  if (env.PUBLIC_ENABLED !== 'true' || !env.DB || !env.TURNSTILE_SECRET || !env.RATE_SALT) return failure('unavailable', 503);
  if (!origins(env).includes(request.headers.get('origin'))) return failure('origin', 403);
  if (request.headers.get('sec-fetch-site') === 'cross-site') return failure('origin', 403);
  let submission;
  try {submission = validateSubmission(await readBody(request));}
  catch (error) {return failure(error.message === 'body-too-large' ? 'body-too-large' : error.message === 'unsupported-content' ? 'unsupported-content' : 'invalid-fields', error.message === 'body-too-large' ? 413 : error.message === 'unsupported-content' ? 415 : 400);}
  const {requestId, payload, token} = submission;
  const fingerprint = await digest(JSON.stringify(payload));
  const stored = await env.DB.prepare('SELECT fingerprint FROM enquiries WHERE request_id = ?').bind(requestId).first();
  if (stored) return stored.fingerprint === fingerprint ? json({ok: true, request_id: requestId, duplicate: true}) : failure('request-conflict', 409);
  const verify = await (dependencies.fetch || fetch)('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body: new URLSearchParams({secret: env.TURNSTILE_SECRET, response: token, ...(request.headers.get('cf-connecting-ip') ? {remoteip: request.headers.get('cf-connecting-ip')} : {}), idempotency_key: crypto.randomUUID()})
  });
  if (!verify.ok) return failure('verification-unavailable', 503);
  const challenge = await verify.json();
  if (!challenge.success || !origins(env).some(origin => new URL(origin).hostname === challenge.hostname) || challenge.action !== 'enquiry') return failure('verification', 403);
  const now = new Date().toISOString();
  const timeBucket = Math.floor(Date.now() / 600000);
  const ip = request.headers.get('cf-connecting-ip') || 'unavailable';
  const bucket = await digest(env.RATE_SALT + ':' + timeBucket + ':' + ip);
  const rate = await env.DB.prepare('INSERT INTO rate_limits (bucket, hits, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET hits = hits + 1 RETURNING hits')
    .bind(bucket, new Date(Date.now() + 86400000).toISOString()).first();
  if (rate.hits > Number(env.MAX_PER_TEN_MINUTES || 30)) return failure('rate-limit', 429);
  if (payload.contact_consent) payload.consent_at = now;
  await env.DB.prepare('INSERT INTO enquiries (request_id, fingerprint, received_at, payload) VALUES (?, ?, ?, ?) ON CONFLICT(request_id) DO NOTHING')
    .bind(requestId, fingerprint, now, JSON.stringify(payload)).run();
  const confirmed = await env.DB.prepare('SELECT fingerprint FROM enquiries WHERE request_id = ?').bind(requestId).first();
  if (!confirmed || confirmed.fingerprint !== fingerprint) return failure('request-conflict', 409);
  if (!(request.headers.get('accept') || '').includes('application/json')) {
    return new Response(null, {status: 303, headers: {'Location': (env.THANKS_ORIGIN || 'https://watra.cz') + (payload.language === 'cs' ? '/cs/dekujeme/' : '/en/thank-you/'), 'Cache-Control': 'no-store'}});
  }
  return json({ok: true, request_id: requestId});
}

async function bridge(request, env, path) {
  if (!await authenticate(request, env)) return failure('unauthorized', 401);
  if (!env.DB) return failure('unavailable', 503);
  if (path === PREFIX + '/crm/health' && request.method === 'GET') {
    const counts = await env.DB.prepare("SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN crm_synced_at IS NULL THEN 1 ELSE 0 END), 0) AS pending, COALESCE(SUM(CASE WHEN notification_state = 'uncertain' THEN 1 ELSE 0 END), 0) AS uncertain FROM enquiries").first();
    return json({ok: true, ...counts});
  }
  if (path === PREFIX + '/crm/pending' && request.method === 'GET') {
    const result = await env.DB.prepare("SELECT request_id, received_at, payload, crm_synced_at, notification_state FROM enquiries WHERE crm_synced_at IS NULL OR notification_state = 'pending' ORDER BY received_at, request_id LIMIT 25").all();
    return json({ok: true, enquiries: result.results.map(row => ({...row, payload: JSON.parse(row.payload)}))});
  }
  if (path === PREFIX + '/crm/ack' && request.method === 'POST') {
    let data;
    try {data = await readBody(request);} catch {return failure('invalid-fields');}
    if (!UUID.test(data.request_id || '') || !['sent', 'uncertain', 'pending'].includes(data.notification_state)) return failure('invalid-fields');
    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE enquiries SET crm_synced_at = COALESCE(crm_synced_at, ?), notification_state = CASE WHEN notification_state = 'sent' THEN 'sent' ELSE ? END, notified_at = CASE WHEN ? = 'sent' THEN COALESCE(notified_at, ?) ELSE notified_at END WHERE request_id = ?")
      .bind(now, data.notification_state, data.notification_state, now, data.request_id).run();
    return json({ok: true});
  }
  return failure('not-found', 404);
}

export async function handleRequest(request, env, dependencies = {}) {
  try {
    const path = new URL(request.url).pathname;
    if (path.startsWith(PREFIX + '/crm/')) return await bridge(request, env, path);
    if (path === PREFIX + '/health' && request.method === 'GET') return json({ok: true, service: 'watra-forms', enabled: env.PUBLIC_ENABLED === 'true'});
    if (path !== PREFIX + '/enquiries') return failure('not-found', 404);
    if (request.method !== 'POST') return failure('method', 405);
    return await submit(request, env, dependencies);
  } catch {
    console.error('watra-forms: request failed');
    return failure('unavailable', 503);
  }
}

export default {fetch: handleRequest};
