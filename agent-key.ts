import type { IncomingHttpHeaders } from 'node:http';
import { parseEnv } from 'node:util';

/** Resolve the agent-only .env entry without loading secrets into Vite's environment. */
export function resolveAgentKey(source: string, env: NodeJS.ProcessEnv): string {
  const value = parseEnv(source).PIXELLAB_API_KEY_AGENT_DEV?.trim() ?? '';
  if (!value.startsWith('${')) return value;
  // ponytail: one whole-value reference only, not interpolation, recursion, defaults or shell evaluation.
  const reference = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/.exec(value);
  if (!reference) throw new Error('Agent token reference must use ${VARIABLE_NAME}.');
  const key = Object.hasOwn(env, reference[1]) ? env[reference[1]]?.trim() : undefined;
  if (!key) throw new Error('The referenced agent token environment variable is missing or blank.');
  return key;
}

// Request guard for the agent dev server's /__dev/pixellab-key (vite.config.ts; tested in tests/unit/agent-key.test.ts):
// same-origin requests from this machine only. Loopback socket, Host = localhost, Sec-Fetch-Site = same-origin, and no proxy
// headers (HTTP-aware proxies and tunnels add them). A raw TCP forward (ssh -L/-R, socat) looks exactly like a local request,
// so the real rule is in AGENTS.md: never expose the agent server beyond localhost.
export const localSameOrigin = (req: { headers: IncomingHttpHeaders; socket: { remoteAddress?: string } }) =>
  ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '') &&
  /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host ?? '') &&
  req.headers['sec-fetch-site'] === 'same-origin' &&
  !Object.keys(req.headers).some((h) => h === 'forwarded' || h === 'via' || h.startsWith('x-forwarded-'));
