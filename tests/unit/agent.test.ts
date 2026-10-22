import { afterEach, expect, test, vi } from 'vitest';

// src/main.ts's agent block (npm run dev:agent) runs only when DEV and MODE 'agent', and never over a key already held.
const h = vi.hoisted(() => ({ hasKey: false, agentKey: vi.fn(async () => 'agent-key'), connect: vi.fn(async () => 'ok') }));
vi.mock('svelte', () => ({ mount: vi.fn() }));
vi.mock('../../src/App.svelte', () => ({ default: {} }));
vi.mock('../../src/lib/api/http', () => ({ agentKey: h.agentKey }));
vi.mock('../../src/lib/data/library.svelte', () => ({ library: { get hasKey() { return h.hasKey; }, connect: h.connect } }));

async function boot(env: { MODE: string; DEV?: boolean }, hasKey = false, framed = false) {
  vi.resetModules();
  h.agentKey.mockClear();
  h.connect.mockClear();
  h.hasKey = hasKey;
  vi.stubGlobal('document', { getElementById: () => ({}) });
  const win: { top?: unknown } = {};
  win.top = framed ? {} : win;
  vi.stubGlobal('window', win);
  vi.stubEnv('MODE', env.MODE);
  vi.stubEnv('DEV', env.DEV ?? true);
  await import('../../src/main');
  await new Promise((r) => setTimeout(r));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test('outside MODE agent, or in a build, the agent block never asks for the key', async () => {
  for (const MODE of ['development', 'production', 'test']) {
    await boot({ MODE });
    expect(h.agentKey, MODE).not.toHaveBeenCalled();
  }
  await boot({ MODE: 'agent', DEV: false });
  expect(h.agentKey).not.toHaveBeenCalled();
});

test('in MODE agent the key takes the human verify-then-keep path in memory only, unless a key is already held', async () => {
  await boot({ MODE: 'agent' });
  expect(h.connect).toHaveBeenCalledWith('agent-key', { memoryOnly: true });
  await boot({ MODE: 'agent' }, true);
  expect(h.agentKey).not.toHaveBeenCalled();
});

test('in MODE agent a framed app never asks for the key (another page could embed and clickjack it)', async () => {
  await boot({ MODE: 'agent' }, false, true);
  expect(h.agentKey).not.toHaveBeenCalled();
});
