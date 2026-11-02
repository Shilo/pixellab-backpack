import { afterEach, expect, test, vi } from 'vitest';

// src/main.ts's agent block (npm run dev:agent) runs only when DEV and MODE 'agent', and never over a key already held.
const h = vi.hoisted(() => ({ hasKey: false, revision: 0, agentKey: vi.fn(async (): Promise<string | null> => 'agent-key'), connect: vi.fn(async () => 'ok') }));
vi.mock('svelte', () => ({ mount: vi.fn() }));
vi.mock('../../src/App.svelte', () => ({ default: {} }));
vi.mock('../../src/lib/api/http', () => ({ agentKey: h.agentKey, getKeyRevision: () => h.revision }));
vi.mock('../../src/lib/data/library.svelte', () => ({ library: { get hasKey() { return h.hasKey; }, connect: h.connect } }));

async function boot(env: { MODE: string; DEV?: boolean }, hasKey = false, framed = false) {
  vi.resetModules();
  h.agentKey.mockClear();
  h.connect.mockClear();
  h.hasKey = hasKey;
  h.revision = 0;
  vi.stubGlobal('document', { getElementById: () => ({ replaceChildren: vi.fn() }), createElement: () => ({}) });
  vi.stubGlobal('location', { href: 'https://example.test/backpack/' });
  const win: { top?: unknown } = {};
  win.top = framed ? {} : win;
  vi.stubGlobal('window', win);
  vi.stubEnv('MODE', env.MODE);
  vi.stubEnv('DEV', env.DEV ?? true);
  await import('../../src/main');
  await new Promise((r) => setTimeout(r));
}

afterEach(() => {
  h.agentKey.mockReset().mockResolvedValue('agent-key');
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

test.each(['manual replacement', 'Forget while keyless', 'connect then Forget'])('a late agent response cannot undo %s', async action => {
  let reply!: (key: string) => void;
  h.agentKey.mockImplementationOnce(() => new Promise(resolve => { reply = resolve; }));
  await boot({ MODE: 'agent' });
  h.revision++;
  if (action === 'connect then Forget') h.revision++;
  h.hasKey = action === 'manual replacement';
  reply('synthetic-agent-token');
  await new Promise<void>(resolve => setImmediate(resolve));
  expect(h.connect).not.toHaveBeenCalled();
});
