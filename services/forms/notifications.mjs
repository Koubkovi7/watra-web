const RECIPIENT = 'richard@watra.cz';
const MAX_ATTEMPTS = 5;
const SAFE_CODES = new Set(['E_SENDER_NOT_VERIFIED', 'E_RECIPIENT_NOT_ALLOWED', 'E_RECIPIENT_SUPPRESSED', 'E_ACCOUNT_SUSPENDED', 'E_SENDER_DOMAIN_NOT_AVAILABLE', 'E_DELIVERY_FAILED', 'E_RATE_LIMIT_EXCEEDED', 'E_DAILY_LIMIT_EXCEEDED', 'E_INTERNAL_SERVER_ERROR']);

export function notificationMessage(row, env) {
  const p = JSON.parse(row.payload);
  const lines = [
    'Nový kontakt z webu WATRA', '',
    `E-mail: ${p.email}`, `Telefon: ${p.phone}`,
    `Jazyk: ${p.language === 'cs' ? 'čeština' : 'angličtina'}`,
    `Přijato: ${new Date(row.received_at).toLocaleString('cs-CZ', {timeZone: 'Europe/Prague'})} (Praha)`,
    `Stránka: https://watra.cz${p.source_page}`, `ID kontaktu: ${row.request_id}`
  ];
  for (const [key, label] of [['name', 'Jméno'], ['company', 'Firma'], ['message', 'Zpráva']]) {
    if (p[key]) lines.push(`${label}: ${p[key]}`);
  }
  if (p.contact_consent === 'yes') lines.push('', `Souhlas: ${p.consent_text}`, `Verze souhlasu: ${p.consent_version}`);
  lines.push('', 'Kontakt zůstává uložený v soukromém úložišti WATRA. Odpověď na tento e-mail bude adresována zájemci.');
  return {to: RECIPIENT, from: {email: env.NOTIFY_FROM || 'formular@watra.cz', name: 'WATRA – webový formulář'}, replyTo: p.email,
    subject: `WATRA – nový kontakt z webu [${row.request_id.slice(0, 8)}]`, text: lines.join('\n')};
}

export async function notifyEnquiry(requestId, env) {
  if (env.EMAIL_NOTIFICATIONS_ENABLED !== 'true' || !env.NOTIFY_EMAIL) return {status: 'disabled'};
  const now = new Date().toISOString();
  // Atomic lease prevents a form retry and the scheduled retry from sending at once.
  const row = await env.DB.prepare(`UPDATE enquiries SET notification_claim_until = ?, notification_attempts = notification_attempts + 1
    WHERE request_id = ? AND notification_state = 'pending'
    AND (notification_claim_until IS NULL OR notification_claim_until < ?)
    AND (notification_next_at IS NULL OR notification_next_at <= ?)
    RETURNING request_id, received_at, payload, notification_attempts`)
    .bind(new Date(Date.now() + 120000).toISOString(), requestId, now, now).first();
  if (!row) return {status: 'skipped'};
  let result;
  try { result = await env.NOTIFY_EMAIL.send(notificationMessage(row, env)); }
  catch (error) {
    const state = row.notification_attempts >= MAX_ATTEMPTS ? 'uncertain' : 'pending';
    const next = new Date(Date.now() + Math.min(3600000, 300000 * 2 ** (row.notification_attempts - 1))).toISOString();
    const code = SAFE_CODES.has(error?.code) ? error.code : 'E_SEND_FAILED';
    await env.DB.prepare('UPDATE enquiries SET notification_state = ?, notification_claim_until = NULL, notification_next_at = ?, notification_error_code = ? WHERE request_id = ?')
      .bind(state, next, code, requestId).run();
    return {status: state, error: code};
  }
  // A resolved send confirms provider acceptance, not arrival in the inbox.
  const messageId = typeof result?.messageId === 'string' ? result.messageId : null;
  await env.DB.prepare(`UPDATE enquiries SET notification_state = ?, notified_at = ?, notification_message_id = ?,
    notification_claim_until = NULL, notification_next_at = NULL, notification_error_code = ? WHERE request_id = ?`)
    .bind(messageId ? 'sent' : 'uncertain', new Date().toISOString(), messageId, messageId ? null : 'E_UNCONFIRMED_SEND', requestId).run();
  return {status: messageId ? 'sent' : 'uncertain'};
}

export async function dispatchPendingNotifications(env) {
  if (env.EMAIL_NOTIFICATIONS_ENABLED !== 'true' || !env.NOTIFY_EMAIL) return;
  const now = new Date().toISOString();
  const rows = await env.DB.prepare(`SELECT request_id FROM enquiries WHERE notification_state = 'pending'
    AND (notification_claim_until IS NULL OR notification_claim_until < ?)
    AND (notification_next_at IS NULL OR notification_next_at <= ?) ORDER BY received_at LIMIT 10`).bind(now, now).all();
  for (const row of rows.results) await notifyEnquiry(row.request_id, env);
}

export function scheduleNotification(requestId, env, waitUntil) {
  if (typeof waitUntil !== 'function') return;
  waitUntil(notifyEnquiry(requestId, env).catch(() => {console.error('watra-forms: notification processing failed');}));
}
