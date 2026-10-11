import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const text = relative => readFile(path.join(root, relative), 'utf8');
const exists = async relative => stat(path.join(root, relative)).then(() => true, error => {
  if (error.code === 'ENOENT') return false;
  throw error;
});

test('release has no office, login, database, GIS, secret or migration files', async () => {
  for (const relative of ['app/office', 'app/employee', 'db', 'data', 'middleware.js', 'lib/session.js', 'lib/db.js', 'app/components/LoginModal.js']) {
    assert.equal(await exists(relative), false, relative);
  }
  for (const file of await readdir(root)) {
    assert.equal(/^\.env|\.(?:pem|key|p12|pfx|dump|zip)$/i.test(file), false, 'Private file in release');
  }
  assert.equal(await exists('public/office-forms'), false);
  assert.deepEqual(await readdir(path.join(root, 'app/api')), ['transaction']);
  assert.deepEqual(await readdir(path.join(root, 'app/api/transaction')), ['route.js']);
});

test('dependency graph contains no office database, document or GIS libraries', async () => {
  const pkg = JSON.parse(await text('package.json'));
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['next', 'nodemailer', 'react', 'react-dom']);
  const lock = JSON.parse(await text('package-lock.json'));
  for (const name of Object.keys(lock.packages)) {
    assert.equal(/(?:^|\/)node_modules\/(?:pg|pg-pool|bcryptjs|jose|jszip|mammoth|maplibre-gl)(?:\/|$)/.test(name), false, name);
  }
});

test('public content retains the approved design and clearly explains submission availability', async () => {
  const page = await text('app/page.js');
  for (const component of ['HeroSeal', 'AnnouncementPosts', 'OrgChartViewer', 'OfficeMapViewer', 'CitizensCharterViewer', 'PublicServices']) assert.ok(page.includes(`<${component}`), component);
  assert.ok(page.includes('Send a request directly to the office by email.'));
  assert.ok(page.includes('<TransactionModal'));
  assert.ok((await text('app/components/TransactionForm.js')).includes('public_request'));
  assert.ok((await text('app/components/TransactionForm.js')).includes('disabled={!token'));
  for (const relative of ['app/page.js', 'app/components/Navbar.js', 'app/components/PublicServices.js']) {
    const content = await text(relative);
    assert.doesNotMatch(content, /LoginModal|\/api\/auth|\/employee\/login/);
  }
});

test('actual build contains only the public page, protected public submission API and framework not-found page', async () => {
  const pages = JSON.parse(await text('.next/server/app-paths-manifest.json'));
  assert.deepEqual(Object.keys(pages).sort(), ['/_not-found/page', '/api/transaction/route', '/page']);
  const routes = JSON.parse(await text('.next/routes-manifest.json'));
  assert.equal(routes.dynamicRoutes.length, 0);
});

test('built release serves public assets, fails closed without spam protection and rejects internal APIs', async t => {
  const reservation = createServer();
  await new Promise((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolve);
  });
  const port = reservation.address().port;
  await new Promise((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
  const child = spawn(process.execPath, ['--import=./tests/forbid-external-services.mjs', 'node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd:root, windowsHide:true, stdio:['ignore', 'pipe', 'pipe'],
    env:{PATH:process.env.PATH, SystemRoot:process.env.SystemRoot, TEMP:process.env.TEMP, TMP:process.env.TMP, NODE_ENV:'production', NEXT_TELEMETRY_DISABLED:'1'},
  });
  child.stdout.resume();
  child.stderr.resume();
  const stopped = once(child, 'exit');
  let spawnFailed = false;
  child.on('error', () => { spawnFailed = true; });
  const request = (relative, options = {}) => fetch(`http://127.0.0.1:${port}${relative}`, {redirect:'manual', signal:AbortSignal.timeout(5000), ...options});
  try {
    let ready = false;
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline && child.exitCode === null && !spawnFailed) {
      try {
        const response = await request('/');
        await response.arrayBuffer();
        if (response.status === 200) { ready = true; break; }
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    assert.ok(ready, 'Public production server did not become ready');
    const home = await request('/');
    const html = await home.text();
    await t.test('homepage content, contact details, security headers and removed controls', () => {
      assert.equal(home.status, 200);
      assert.ok(html.includes('Municipal Assessor'));
      assert.ok(html.includes('Send a request directly to the office by email.'));
      assert.ok(html.includes('0927-828-1263'));
      assert.ok(html.includes('Monday to Thursday'));
      assert.doesNotMatch(html, /Employee \/ Admin login|<form|type="file"|\/employee\/login/);
      assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(home.headers.get('x-frame-options'), 'SAMEORIGIN');
      assert.match(home.headers.get('content-security-policy'), /frame-ancestors 'self'/);
      assert.ok(home.headers.has('strict-transport-security'));
      assert.equal(home.headers.has('x-powered-by'), false);
    });
    const internal = [
      '/office', '/office/mapping', '/office/frontdesk', '/office/files', '/office/document-test', '/employee/login',
      '/api/auth/login', '/api/auth/logout', '/api/mapping', '/api/mapping/search', '/api/mapping/parcels/anything',
      '/api/frontdesk/documents', '/api/frontdesk/documents/anything', '/api/editor-documents', '/api/editor-documents/anything', '/api/profile', '/api/profile/avatar', '/api/notifications',
      '/.env.local', '/db/schema.sql', '/data/mapping/manifest.json', '/office-forms/office-template.docx', '/scripts/initialize-supabase.mjs', '/%6fffice/mapping',
    ];
    for (const relative of internal) await t.test(`GET ${relative} is unavailable`, async () => {
      const response = await request(relative);
      await response.arrayBuffer();
      assert.equal(response.status, 404);
    });
    for (const relative of internal.filter(relative => relative.startsWith('/api/'))) await t.test(`POST ${relative} cannot execute an API`, async () => {
      const response = await request(relative, {method:'POST', headers:{'content-type':'application/json'}, body:'{}'});
      await response.arrayBuffer();
      assert.ok([404, 405].includes(response.status), `Unexpected status ${response.status}`);
    });
    await t.test('public submission API refuses unconfigured email/protection and unsupported GET', async () => {
      const get = await request('/api/transaction'); await get.arrayBuffer(); assert.equal(get.status, 405);
      const response = await request('/api/transaction', {method:'POST',headers:{origin:'https://assessors-system.vercel.app','content-type':'application/json'},body:'{}'});
      assert.equal(response.status,503); assert.equal(response.headers.get('cache-control'),'no-store');
      assert.doesNotMatch(await response.text(),/SMTP_PASS|UPSTASH|TURNSTILE_SECRET|password/i);
    });
    const assets = [
      '/favicon.png', '/masso-logo.png', '/org-chart.png', '/citizens-charter/Citizen_Charter_Assessor_s_Office.pdf',
      ...['Annotation_of_Tax_Declaration', 'Cancellation_of_Assessment', 'Correction_Updating_of_Entry', 'Issuance_of_Certified_True_Copy_of_Tax_Declaration', 'New_Assessment_Reclassification', 'Segragation_Consolidation_of_Lot', 'Transfer_of_Ownership_Tax_Declaration'].map(name => `/requirements/${name}.pdf`),
      ...Array.from({length:8}, (_, index) => `/announcements/proposed-smv/smv-page-0${index + 73}.jpg`),
    ];
    for (const relative of assets) await t.test(`public asset ${relative}`, async () => {
      const response = await request(relative);
      const bytes = new Uint8Array(await response.arrayBuffer());
      assert.equal(response.status, 200);
      assert.ok(bytes.length > 100);
      if (relative.endsWith('.pdf')) assert.equal(Buffer.from(bytes.subarray(0,4)).toString(), '%PDF');
    });
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]);
    for (const relative of scripts) await t.test(`public JavaScript asset ${relative}`, async () => {
      assert.ok(relative.startsWith('/_next/static/'));
      const response = await request(relative);
      const body = await response.text();
      assert.equal(response.status, 200);
      assert.doesNotMatch(body, /\/api\/(?:auth\/login|mapping)|Employee \/ Admin login/);
    });
  } finally {
    if (child.exitCode === null) child.kill();
    await stopped;
  }
});
