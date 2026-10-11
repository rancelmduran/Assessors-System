import test from 'node:test';
import assert from 'node:assert/strict';
import { createSubmissionHandler, MAX_BODY_BYTES } from '../lib/public-submission-handler.mjs';
import { submissionSettings, submissionIp, createSubmissionProtection, ProtectionUnavailable, BUDGET_SCRIPT } from '../lib/public-submission-security.mjs';
import { inspectUpload, safeAttachmentName } from '../lib/upload-validation.js';

// Deliberately fake, nonfunctional settings. External connections are forbidden by the test preload.
const ENV = { NODE_ENV:'production', VERCEL:'1', PUBLIC_SUBMISSION_ORIGIN:'https://office.example.ph',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY:'offline-widget', TURNSTILE_SECRET_KEY:'offline-secret',
  UPSTASH_REDIS_REST_URL:'https://offline-example.upstash.io', UPSTASH_REDIS_REST_TOKEN:'offline-token',
  SMTP_HOST:'smtp.example.ph', SMTP_PORT:'465', SMTP_SECURE:'true', SMTP_USER:'offline-user', SMTP_PASS:'offline-password',
  OFFICE_EMAIL_TO:'office@example.ph', SMTP_FROM:'Assessor Web <no-reply@example.ph>',
};
const fields = { fullName:'María O’Connor-Dela Cruz', email:'maria@example.ph', phone:'+63 927 828 1263', address:'Centro Occidental, Polangui', purpose:'Certified true copy', details:'I need a certified tax declaration for a bank application.', website:'', 'cf-turnstile-response':'offline-token' };
function request(values = {}, { entries = [], headers = {}, file = null } = {}) {
  const body = new FormData();
  for (const [key,value] of Object.entries({...fields,...values})) if (value !== null) body.append(key,value);
  for (const [key,value] of entries) body.append(key,value);
  if (file) body.append('files',file,'invoice.pdf.exe');
  return new Request('https://internal.invalid/api/transaction', { method:'POST', headers:{origin:ENV.PUBLIC_SUBMISSION_ORIGIN, 'sec-fetch-site':'same-origin', 'x-vercel-forwarded-for':'198.51.100.7', ...headers}, body });
}
function fixture(options = {}) {
  const calls = [], messages = [], transports = [];
  const handler = createSubmissionHandler({ env: () => ({...ENV,...options.env}),
    protection: config => createSubmissionProtection(config, { fetcher:async (url, init) => {
      const body = JSON.parse(init.body); calls.push({url,init,body});
      if (url.includes('cloudflare')) {
        if (options.challengeThrow) throw new Error('PRIVATE_RAW_ERROR');
        return Response.json(options.challenge || {success:true,hostname:'office.example.ph',action:'public_request'});
      }
      const budgets = calls.filter(x => !x.url.includes('cloudflare'));
      return Response.json({result: options.deniedAt === budgets.length ? [0,600] : [1,0]});
    }}),
    createTransport: config => { transports.push(config); return { sendMail:async mail => { if (options.smtpError) throw new Error('PRIVATE_SMTP_ERROR'); messages.push(mail); }, close:() => calls.push({closed:true}) }; },
  });
  return { handler,calls,messages,transports };
}

test('offline harness blocks remote services', async () => {
  await assert.rejects(async () => fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify'), /OFFLINE_EXTERNAL/);
});
test('valid real multipart submission reaches mail only after every protection', async () => {
  const f = fixture(); const response = await f.handler(request());
  assert.equal(response.status,200); assert.equal(f.messages.length,1);
  assert.deepEqual(f.calls.slice(0,3).map(x => x.url.includes('cloudflare')?'challenge':x.body[2]===2?'request-budget':'submission-budget'),['request-budget','challenge','submission-budget']);
  assert.equal(f.messages[0].to,ENV.OFFICE_EMAIL_TO); assert.equal(f.messages[0].from,ENV.SMTP_FROM);
  assert.equal(f.messages[0].replyTo,fields.email); assert.equal(f.messages[0].html,undefined);
  assert.ok(f.messages[0].text.includes(fields.fullName));
  assert.equal(f.transports[0].requireTLS,true); assert.equal(f.transports[0].tls.rejectUnauthorized,true);
  assert.equal(f.transports[0].tls.servername,ENV.SMTP_HOST);
  assert.equal(f.transports[0].disableFileAccess,true); assert.equal(f.transports[0].disableUrlAccess,true);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(f.calls.at(-1).closed,true);
});
for (const key of Object.keys(ENV).filter(k => !['NODE_ENV','VERCEL'].includes(k))) test(`missing ${key} blocks before any external service`,async () => {
  const f=fixture({env:{[key]:''}}); assert.equal((await f.handler(request())).status,503); assert.equal(f.calls.length,0); assert.equal(f.messages.length,0);
});
for (const [key,value] of [
  ['PUBLIC_SUBMISSION_ORIGIN','https://office.example.ph/'], ['PUBLIC_SUBMISSION_ORIGIN','http://office.example.ph'],
  ['PUBLIC_SUBMISSION_ORIGIN','https://user:password@office.example.ph'], ['PUBLIC_SUBMISSION_ORIGIN','https://localhost'],
  ['UPSTASH_REDIS_REST_URL','http://offline-example.upstash.io'], ['UPSTASH_REDIS_REST_URL','https://upstash.io.evil.example'],
  ['UPSTASH_REDIS_REST_URL','https://user:password@offline-example.upstash.io'], ['UPSTASH_REDIS_REST_URL','https://offline-example.upstash.io/path'],
  ['UPSTASH_REDIS_REST_URL','https://offline-example.upstash.io?token=private'], ['UPSTASH_REDIS_REST_URL','https://offline-example.upstash.io:5432'],
  ['SMTP_PORT','25'], ['SMTP_SECURE','false'], ['SMTP_FROM','Office\r\nBcc: attacker@example.ph'],
  ['OFFICE_EMAIL_TO','one@example.ph,two@example.ph'], ['NEXT_PUBLIC_TURNSTILE_SITE_KEY','1x00000000000000000000AA'],
  ['TURNSTILE_SECRET_KEY','1x0000000000000000000000000000000AA'], ['TURNSTILE_SECRET_KEY','secret\n'],
  ['NODE_TLS_REJECT_UNAUTHORIZED','0'],
]) test(`unsafe setting ${key}: ${JSON.stringify(value)} fails closed`,async () => {
  const f=fixture({env:{[key]:value}}); assert.equal((await f.handler(request())).status,503); assert.equal(f.calls.length,0);
});
for (const origin of ['https://evil.example','null','','https://office.example.ph.evil.example','https://office.example.ph/']) test(`origin ${origin || '(absent)'} blocked`,async () => {
  const f=fixture(); const req=request({}, {headers:{origin}}); if (!origin) req.headers.delete('origin');
  assert.equal((await f.handler(req)).status,403); assert.equal(f.calls.length,0);
});
test('cross-site Fetch Metadata blocks even a matching Origin',async () => {
  const f=fixture(); assert.equal((await f.handler(request({}, {headers:{'sec-fetch-site':'cross-site'}}))).status,403); assert.equal(f.calls.length,0);
});
for (const name of ['Juan Dela Cruz','José Dela Peña','Anne-Marie O\'Neill','李明','A. Cruz']) test(`legitimate name ${name} accepted`,async () => {
  const f=fixture(); assert.equal((await f.handler(request({fullName:name}))).status,200);
});
for (const [key,value] of [
  ['fullName','https://spam.example'], ['fullName','12345'], ['fullName','<script>alert(1)</script>'], ['fullName','A'],
  ['fullName','Juan\nBcc: spam@example.ph'], ['purpose','Transfer\r\nBcc: spam@example.ph'], ['email','one@example.ph\nBcc: spam@example.ph'],
  ['phone','visit https://spam.example'], ['address','bad\u202evalue'], ['details','bad\u0000value'], ['details','a'.repeat(3001)],
]) test(`invalid ${key} rejected without mail`,async () => {
  const f=fixture(); const response=await f.handler(request({[key]:value})); assert.equal(response.status,400); assert.equal(f.messages.length,0); assert.equal(f.calls.length,1);
});
for (const entries of [[['fullName','Another name']],[['to','attacker@example.ph']],[['cf-turnstile-response','another token']],[['files','not a file']]]) test(`repeated or unexpected field ${entries[0][0]} rejected`,async () => {
  const f=fixture(); assert.equal((await f.handler(request({}, {entries}))).status,400); assert.equal(f.messages.length,0);
});
test('honeypot silently succeeds without challenge or SMTP',async () => {
  const f=fixture(); assert.equal((await f.handler(request({website:'https://spam.example'}))).status,200); assert.equal(f.messages.length,0); assert.equal(f.calls.length,1);
});
for (const challenge of [{success:false}, {success:true,hostname:'evil.example',action:'public_request'}, {success:true,hostname:'office.example.ph',action:'login'}, {success:'true',hostname:'office.example.ph',action:'public_request'}, {}]) test(`challenge response ${JSON.stringify(challenge)} blocks mail`,async () => {
  const f=fixture({challenge}); assert.equal((await f.handler(request())).status,403); assert.equal(f.messages.length,0);
});
test('replayed token denial blocks a second otherwise identical submission',async () => {
  const f=fixture({challenge:{success:false,'error-codes':['timeout-or-duplicate']}}); assert.equal((await f.handler(request())).status,403); assert.equal(f.messages.length,0);
});
test('missing token is rejected before a Cloudflare request',async () => {
  const f=fixture(); assert.equal((await f.handler(request({'cf-turnstile-response':null}))).status,403); assert.equal(f.calls.length,1);
});
for (const options of [{challengeThrow:true}, {challenge:{success:false,'error-codes':['internal-error']}}, {challenge:{success:false,'error-codes':['invalid-input-secret']}}]) test(`challenge service failure ${JSON.stringify(options)} fails closed`,async () => {
  const f=fixture(options); const response=await f.handler(request()); assert.equal(response.status,503); assert.equal(f.messages.length,0); assert.doesNotMatch(await response.text(), /PRIVATE|secret|password|token/);
});
for (const deniedAt of [1,2]) test(`shared budget stage ${deniedAt} denies mail with Retry-After`,async () => {
  const f=fixture({deniedAt}); const response=await f.handler(request()); assert.equal(response.status,429); assert.equal(response.headers.get('retry-after'),'600'); assert.equal(f.messages.length,0);
});
test('SMTP errors are sanitized, never retried or refunded',async () => {
  const f=fixture({smtpError:true}); const response=await f.handler(request()); assert.equal(response.status,502); assert.doesNotMatch(await response.text(),/PRIVATE_SMTP|password/);
  assert.equal(f.transports.length,1); assert.equal(f.calls.filter(x=>x.body?.[0]==='EVAL').length,2); assert.equal(f.calls.at(-1).closed,true);
});
test('declared oversize body rejected before parsing or challenge',async () => {
  const f=fixture(); const response=await f.handler(request({}, {headers:{'content-length':String(MAX_BODY_BYTES+1)}})); assert.equal(response.status,413); assert.equal(f.calls.length,1);
});
test('streamed oversize body without Content-Length is bounded and canceled',async () => {
  let canceled=false;
  const body=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(MAX_BODY_BYTES+1));},cancel(){canceled=true;}});
  const req=new Request('https://office.example.ph/api/transaction',{method:'POST',duplex:'half',headers:{origin:ENV.PUBLIC_SUBMISSION_ORIGIN,'content-type':'multipart/form-data; boundary=offline'},body});
  const f=fixture(); assert.equal((await f.handler(req)).status,413); assert.equal(canceled,true); assert.equal(f.messages.length,0);
});
test('JSON cannot substitute for reviewed multipart fields',async () => {
  const f=fixture(); const req=new Request('https://office.example.ph/api/transaction',{method:'POST',headers:{origin:ENV.PUBLIC_SUBMISSION_ORIGIN,'content-type':'application/json'},body:'{}'});
  assert.equal((await f.handler(req)).status,415); assert.equal(f.calls.length,0);
});
test('fake PDF MIME is rejected; valid PDF is an in-memory safe-named attachment',async () => {
  const f=fixture(); assert.equal((await f.handler(request({}, {file:new Blob(['<script>evil</script>'],{type:'application/pdf'})}))).status,400); assert.equal(f.messages.length,0);
  const g=fixture(); assert.equal((await g.handler(request({}, {file:new Blob(['%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF'],{type:'application/pdf'})}))).status,200);
  assert.equal(g.messages[0].attachments[0].filename,'invoice_pdf.pdf'); assert.ok(Buffer.isBuffer(g.messages[0].attachments[0].content)); assert.equal(g.messages[0].attachments[0].path,undefined);
});
test('active PDF actions and MIME mismatches are rejected',() => {
  for (const action of ['/JavaScript','/JS','/#4A#53','/Launch','/EmbeddedFiles','/SubmitForm']) assert.equal(inspectUpload(Buffer.from(`%PDF-1.4\n<< ${action} (payload) >>\n%%EOF`),'application/pdf').ok,false);
  assert.equal(inspectUpload(Buffer.from('%PDF-1.4\n<<>>\n%%EOF'),'image/png').ok,false);
  assert.equal(safeAttachmentName('../../file.pdf.exe','pdf',0),'file_pdf.pdf');
});
test('IPv6 aliases and suffix rotation share the same /64; spoofed fallback headers ignored',() => {
  const config=submissionSettings(ENV);
  const ip=value=>submissionIp(request({}, {headers:{'x-vercel-forwarded-for':value}}),config);
  assert.equal(ip('2001:db8::1'),ip('2001:0db8:0:0:ffff::2'));
  assert.equal(ip('::ffff:198.51.100.7'),'198.51.100.7');
  assert.equal(submissionIp(request({}, {headers:{'x-vercel-forwarded-for':'invalid','x-forwarded-for':'198.51.100.8'}}),config),'unknown');
});
test('actual REST commands use expiring HMAC keys, atomic budgets and no raw submitted content',async () => {
  const f=fixture(); await f.handler(request());
  const commands=f.calls.filter(x=>x.body?.[0]==='EVAL');
  assert.equal(commands.length,2);
  const submit=commands[1]; assert.equal(submit.body[1],BUDGET_SCRIPT); assert.equal(submit.body[2],5);
  assert.deepEqual(submit.body.slice(8),[3,600,10,3600,5,3600,120,3600,1,600]);
  for (const c of commands) {
    assert.equal(c.init.redirect,'error'); assert.equal(c.init.cache,'no-store'); assert.ok(c.init.signal);
    assert.doesNotMatch(c.init.body,/198\.51\.100|maria@example|María|certified tax/);
    for (const key of c.body.slice(3,3+c.body[2])) assert.match(key,/^public-form:v1:[a-f0-9]{64}$/);
  }
  assert.ok(BUDGET_SCRIPT.indexOf('if retry > 0 then return')<BUDGET_SCRIPT.indexOf("redis.call('INCR'"));
  assert.ok(BUDGET_SCRIPT.includes("redis.call('EXPIRE'"));
});
for (const result of [null,{},[1],['1',0],[0,0],[0,4000],[1,1],[2,0]]) test(`invalid Redis result ${JSON.stringify(result)} fails closed`,async () => {
  const p=createSubmissionProtection(submissionSettings(ENV),{fetcher:async()=>Response.json({result})});
  await assert.rejects(()=>p.request('198.51.100.1'),ProtectionUnavailable);
});
test('Redis failure and credential-bearing raw response never reach SMTP or public errors',async () => {
  const h=createSubmissionHandler({env:()=>ENV,protection:config=>createSubmissionProtection(config,{fetcher:async()=>{throw new Error('private credentials');}}),createTransport:()=>{throw new Error('SMTP must not be reached');}});
  const response=await h(request()); assert.equal(response.status,503); assert.doesNotMatch(await response.text(),/private credentials|offline-token/);
});
