import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

export class ProtectionUnavailable extends Error {
  constructor() { super('Submission protection unavailable'); }
}
const CONTROL = /[\u0000-\u001f\u007f]/;
const required = (env, key) => {
  const value = env[key];
  if (typeof value !== 'string' || !value || CONTROL.test(value) || value !== value.trim()) throw new ProtectionUnavailable();
  return value;
};
const email = /^[A-Za-z0-9._%+'-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

// No defaults or database fallback: SMTP and both protection services must be configured.
export function submissionSettings(env = process.env) {
  if (env.NODE_TLS_REJECT_UNAUTHORIZED === '0') throw new ProtectionUnavailable();
  const origin = required(env, 'PUBLIC_SUBMISSION_ORIGIN');
  const site = new URL(origin);
  if (site.origin !== origin || site.username || site.password || (site.protocol !== 'https:' && !(env.NODE_ENV === 'development' && site.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(site.hostname)))) throw new ProtectionUnavailable();
  if (env.NODE_ENV !== 'development' && (site.port || ['localhost', '127.0.0.1', '[::1]'].includes(site.hostname))) throw new ProtectionUnavailable();
  const siteKey = required(env, 'NEXT_PUBLIC_TURNSTILE_SITE_KEY');
  const secret = required(env, 'TURNSTILE_SECRET_KEY');
  // Official dummy keys must never activate the production form.
  if (env.NODE_ENV !== 'development' && (/^[123]x0{5}/.test(siteKey) || /^[123]x0{5}/.test(secret))) throw new ProtectionUnavailable();
  const redisUrl = required(env, 'UPSTASH_REDIS_REST_URL');
  const redis = new URL(redisUrl);
  if (redis.protocol !== 'https:' || !/^[a-z0-9-]+\.upstash\.io$/.test(redis.hostname) || redis.port || redis.username || redis.password || redis.pathname !== '/' || redis.search || redis.hash) throw new ProtectionUnavailable();
  const redisToken = required(env, 'UPSTASH_REDIS_REST_TOKEN');
  const host = required(env, 'SMTP_HOST');
  const port = required(env, 'SMTP_PORT');
  const secure = required(env, 'SMTP_SECURE');
  if (!/^[a-z0-9.-]+$/i.test(host) || !((port === '465' && secure === 'true') || (port === '587' && secure === 'false'))) throw new ProtectionUnavailable();
  const to = required(env, 'OFFICE_EMAIL_TO');
  const from = required(env, 'SMTP_FROM');
  const fromAddress = from.match(/^(?:[^<>]{1,100} <)?([^<>\s]+@[^<>\s]+)>?$/)?.[1];
  if (!email.test(to) || !fromAddress || !email.test(fromAddress)) throw new ProtectionUnavailable();
  return {
    origin, hostname: site.hostname, siteKey, secret, redisUrl: redis.origin, redisToken,
    smtp: { host, port: Number(port), secure: secure === 'true', requireTLS: true,
      tls: { rejectUnauthorized: true, servername: host },
      auth: { user: required(env, 'SMTP_USER'), pass: required(env, 'SMTP_PASS') },
      connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 15000,
      disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false },
    to, from, vercel: env.VERCEL === '1',
  };
}

export function isAllowedOrigin(req, config) {
  return req.headers.get('origin') === config.origin &&
    (!req.headers.has('sec-fetch-site') || req.headers.get('sec-fetch-site') === 'same-origin');
}

// Only Vercel's overwritten header is trusted in production. Unidentifiable clients share a stricter budget.
export function submissionIp(req, config) {
  const raw = config.vercel ? req.headers.get('x-vercel-forwarded-for') : null;
  const ip = raw?.trim();
  if (!ip || !isIP(ip)) return 'unknown';
  if (isIP(ip) === 4) return ip;
  // URL canonicalization expands aliases consistently; group IPv6 by /64 to prevent suffix rotation.
  let v = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  const [a, b = ''] = v.split('::');
  const left = a ? a.split(':') : [], right = b ? b.split(':') : [];
  const groups = v.includes('::') ? [...left, ...Array(8-left.length-right.length).fill('0'), ...right] : left;
  if (groups.slice(0,5).every(x => parseInt(x,16) === 0) && groups[5] === 'ffff') {
    const hi = parseInt(groups[6],16), lo = parseInt(groups[7],16);
    return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  return `${groups.slice(0,4).map(x => parseInt(x,16).toString(16)).join(':')}::/64`;
}

// Check every budget before charging any. Redis executes EVAL atomically across serverless instances.
// Counters expire after at most one hour. No submitted content, names, emails or raw IPs are stored.
export const BUDGET_SCRIPT = `
local retry = 0
for i, key in ipairs(KEYS) do
  local count = tonumber(redis.call('GET', key) or '0')
  if count >= tonumber(ARGV[2*i-1]) then
    local ttl = redis.call('TTL', key)
    if ttl < 1 then ttl = tonumber(ARGV[2*i]) end
    retry = math.max(retry, ttl)
  end
end
if retry > 0 then return {0, retry} end
for i, key in ipairs(KEYS) do
  local count = redis.call('INCR', key)
  if count == 1 then redis.call('EXPIRE', key, tonumber(ARGV[2*i])) end
end
return {1, 0}`;

export function createSubmissionProtection(config, { fetcher = fetch } = {}) {
  const hash = value => createHmac('sha256', config.redisToken).update(value).digest('hex');
  const charge = async entries => {
    const keys = entries.map(([id]) => `public-form:v1:${hash(id)}`);
    try {
      const response = await fetcher(config.redisUrl, { method: 'POST', redirect: 'error', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.redisToken}` },
        body: JSON.stringify(['EVAL', BUDGET_SCRIPT, keys.length, ...keys, ...entries.flatMap(([, max, seconds]) => [max, seconds])]),
        signal: AbortSignal.timeout(4000) });
      if (!response.ok) throw new ProtectionUnavailable();
      const { result, error } = await response.json();
      if (error || !Array.isArray(result) || result.length !== 2 || ![0,1].includes(result[0]) || !Number.isInteger(result[1]) || (result[0] === 0 && (result[1] < 1 || result[1] > 3600)) || (result[0] === 1 && result[1] !== 0)) throw new ProtectionUnavailable();
      return { allowed: result[0] === 1, retryAfter: result[1] };
    } catch { throw new ProtectionUnavailable(); }
  };
  return {
    request: ip => charge([[`request:${ip}`, 60, 600], ['request:global', 600, 600]]),
    submission: ({ ip, email, fingerprint }) => charge([
      [`burst:${ip}`, 3, 600], [`hour:${ip}`, 10, 3600],
      [`email:${email.toLowerCase()}`, 5, 3600], ['submission:global', 120, 3600],
      [`duplicate:${fingerprint}`, 1, 600],
    ]),
    async verify(token) {
      if (typeof token !== 'string' || !token || token.length > 2048 || CONTROL.test(token)) return false;
      try {
        const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST', redirect: 'error', cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: config.secret, response: token }),
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new ProtectionUnavailable();
        const data = await response.json();
        if (data['error-codes']?.some(code => ['internal-error', 'invalid-input-secret', 'missing-input-secret'].includes(code))) throw new ProtectionUnavailable();
        return data.success === true && data.hostname === config.hostname && data.action === 'public_request';
      } catch { throw new ProtectionUnavailable(); }
    },
  };
}
