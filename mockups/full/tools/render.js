// Renders mockup frames with headless Edge (DevTools protocol, own fresh profile), twice per frame:
//   <id>-desktop.png  1440x900  @2x
//   <id>-mobile.png    390x844  @3x, mobile + touch emulation
// Usage: node render.js <folder> <port> [frame-id ...]
//   <folder>  the mockup folder holding index.html (PNGs go to <folder>/shots/)
//   <port>    a DevTools port nobody else uses (each designer picks their own)
//   no ids    renders every id registered in window.FRAMES
// Prints one line per PNG: ok / NOT READY / MISSING, plus page errors. Exit code 1 if any frame failed.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const [folder, port, ...ids] = process.argv.slice(2);
if (!folder || !+port) { console.error('Usage: node render.js <folder> <port> [frame-id ...]'); process.exit(2); }
const DIR = path.resolve(folder), OUT = path.join(DIR, 'shots'), PROF = path.join(__dirname, `edge-prof-${port}-${Date.now()}`);
const PAGE = 'file:///' + path.join(DIR, 'index.html').replace(/\\/g, '/');
const SIZES = [['desktop', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false }, false],
  ['mobile', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, true]];
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(f => fs.existsSync(f));
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  let failed = 0;
  spawn(EDGE, ['--headless=new', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--allow-file-access-from-files', `--remote-debugging-port=${port}`, `--user-data-dir=${PROF}`, 'about:blank'], { stdio: 'ignore' });
  try {
    let list; for (let i = 0; i < 60; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (list.some(t => t.type === 'page')) break; } catch (e) {} await sleep(200); }
    const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    let id = 0; const pend = new Map(), errs = [];
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
      else if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); };
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evalv = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result.result?.value;
    const load = async hash => {
      await send('Page.navigate', { url: 'about:blank' }); await sleep(100);
      await send('Page.navigate', { url: `${PAGE}#${hash}` });
      let ok; for (let i = 0; i < 80 && !ok; i++) { await sleep(100); ok = await evalv('document.documentElement.dataset.ready'); }
      return ok;
    };
    await send('Runtime.enable');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });   // headless pages are unfocused: keep focus rings
    await send('Emulation.setDeviceMetricsOverride', SIZES[0][1]);
    const frames = ids.length ? ids : (await load('01-home'), await evalv('Object.keys(window.FRAMES || {})'));
    for (const [size, metrics, touch] of SIZES) {
      await send('Emulation.setDeviceMetricsOverride', metrics);
      await send('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: touch ? 5 : 1 });
      for (const f of frames) {
        errs.length = 0;
        const ok = await load(f);
        await sleep(400);
        const file = path.join(OUT, `${f}-${size}.png`);
        if (ok === '1') fs.writeFileSync(file, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
        else failed++;
        console.log(`${f}-${size}.png`, ok === '1' ? 'ok' : ok === 'missing' ? 'MISSING (no such frame id)' : 'NOT READY', errs.join(' | '));
      }
    }
    ws.close();
  } finally {
    // Kill only the Edge processes that use this run's profile.
    spawnSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | ? { $_.CommandLine -like '*${path.basename(PROF)}*' } | % { Stop-Process -Id $_.ProcessId -Force -EA SilentlyContinue }`]);
    await sleep(500); try { fs.rmSync(PROF, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch (e) {}
  }
  process.exitCode = failed ? 1 : 0;
})();
