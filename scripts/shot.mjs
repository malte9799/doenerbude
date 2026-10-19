// Headless-Chrome screenshots of the single-file build – no server needed.
// Usage:
//   npx vite build --mode single
//   node scripts/shot.mjs '#/studio?m=pizza' /tmp/out            → /tmp/out-main.jpg
//   node scripts/shot.mjs '#/bestellen' /tmp/shop '[{"wait":3000,"shot":"top"}]'
//   node scripts/shot.mjs '#/studio' /tmp/x steps.json
// First arg: a hash route into dist-single/index.html, or a file path / URL.
// steps: [{ eval?: "js in page", wait?: ms, shot?: "name", clip?: {x,y,width,height} }]
// Prints console errors and page exceptions. Exit code 0 even on errors.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [target, prefix, stepsJson] = process.argv.slice(2);
const { resolve } = await import('node:path');
const url = target.startsWith('#')
  ? 'file://' + resolve('dist-single/index.html') + target
  : /^(file|https?):/.test(target)
    ? target
    : 'file://' + resolve(target);
import { readFileSync } from 'node:fs';
const steps = JSON.parse(stepsJson?.endsWith('.json') ? readFileSync(stepsJson, 'utf8') : stepsJson || '[{"wait":9000,"shot":"main"}]');
const port = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`,
  '--window-size=1500,950', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank',
], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let page;
for (let i = 0; i < 50 && !page; i++) {
  await sleep(200);
  try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {}
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pending = new Map(); const logs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method === 'Runtime.consoleAPICalled') logs.push(m.params.type + ': ' + m.params.args.map(a => a.value ?? a.description).join(' ')); else if (m.method === 'Runtime.exceptionThrown') logs.push('EXC: ' + JSON.stringify(m.params.exceptionDetails).slice(0, 400)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 950, deviceScaleFactor: 1.5, mobile: false });
await send('Page.navigate', { url });
for (const s of steps) {
  if (s.eval) { const r = await send('Runtime.evaluate', { expression: s.eval, awaitPromise: true }); if (r.result?.exceptionDetails) logs.push('EVAL ERR ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300)); }
  if (s.wait) await sleep(s.wait);
  if (s.shot) { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88, ...(s.clip ? { clip: { ...s.clip, scale: 1 } } : {}) }); writeFileSync(`${prefix}-${s.shot}.jpg`, Buffer.from(r.result.data, 'base64')); }
}
console.log(logs.join('\n'));
ws.close(); chrome.kill();
process.exit(0);
