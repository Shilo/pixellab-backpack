import type { IncomingHttpHeaders } from 'node:http';
import { expect, test } from 'vitest';
import { localSameOrigin, resolveAgentKey } from '../../agent-key';

test.each(['PIXELLAB_SECRET', 'CUSTOM_TOKEN_2', 'lowercase_token'])('an explicit reference can use any valid environment name: %s', name => {
  const env = { [name]: ' synthetic-token ' };
  expect(resolveAgentKey('PIXELLAB_API_KEY_AGENT_DEV=${'+name+'}\r\n', env)).toBe('synthetic-token');
  expect(env[name]).toBe(' synthetic-token ');
});

test.each(['${CUSTOM_TOKEN}', '"${CUSTOM_TOKEN}"', "'${CUSTOM_TOKEN}'"])('Node dotenv parsing supports spacing, quotes and comments: %s', value => {
  expect(resolveAgentKey('export PIXELLAB_API_KEY_AGENT_DEV = '+value+' # agent only\n', { CUSTOM_TOKEN: 'synthetic-token' })).toBe('synthetic-token');
});

test.each([{}, { CUSTOM_TOKEN: '' }, { CUSTOM_TOKEN: '  ' }])('a missing or blank referenced variable fails without a literal fallback', env => {
  expect(() => resolveAgentKey('PIXELLAB_API_KEY_AGENT_DEV=${CUSTOM_TOKEN}', env)).toThrow('missing or blank');
});

test.each(['${}', '${1BAD}', '${BAD-NAME}', '${CUSTOM_TOKEN', '${CUSTOM_TOKEN}suffix', '${CUSTOM_TOKEN:-fallback}'])('malformed or unsupported references fail clearly: %s', value => {
  expect(() => resolveAgentKey('PIXELLAB_API_KEY_AGENT_DEV='+value, {})).toThrow('must use');
});

test.each(['synthetic-old-token', 'pixl_synthetic-new-token', 'PIXELLAB_SECRET', '$(untrusted-command)'])('literal token values do not trigger environment lookup: %s', token => {
  expect(resolveAgentKey('PIXELLAB_API_KEY_AGENT_DEV="'+token+'"', { PIXELLAB_SECRET: 'different-token' })).toBe(token);
});

test('missing entries never acquire a key, and references never load sibling dotenv values or inherited properties', () => {
  for(const source of ['', 'OTHER=${CUSTOM_TOKEN}', 'PIXELLAB_API_KEY_AGENT_DEV=']) expect(resolveAgentKey(source, { CUSTOM_TOKEN: 'synthetic-token' })).toBe('');
  expect(() => resolveAgentKey('CUSTOM_TOKEN=synthetic-token\nPIXELLAB_API_KEY_AGENT_DEV=${CUSTOM_TOKEN}', {})).toThrow('missing or blank');
  expect(() => resolveAgentKey('PIXELLAB_API_KEY_AGENT_DEV=${constructor}', {})).toThrow('missing or blank');
});

test.each(['0123456789abcdef0123456789abcdef', 'pixl_0123456789abcdef0123456789abcdef', 'CUSTOM_TOKEN', 'prefix${CUSTOM_TOKEN}'])('unquoted opaque literals are preserved, including a colliding environment name: %s', token => {
  expect(resolveAgentKey('PIXELLAB_API_KEY_AGENT_DEV='+token, { CUSTOM_TOKEN: 'different-synthetic-token' })).toBe(token);
});

// The agent dev server's key endpoint answers only same-origin requests from this machine, never through a proxy.
const host = 'localhost:5281';
const ok = { host, 'sec-fetch-site': 'same-origin' };
const allowed = (headers: IncomingHttpHeaders, remoteAddress = '::1') => localSameOrigin({ headers, socket: { remoteAddress } });

test('a same-origin request from a loopback socket is allowed', () => {
  expect(allowed(ok)).toBe(true);
  expect(allowed(ok, '127.0.0.1')).toBe(true);
  expect(allowed(ok, '::ffff:127.0.0.1')).toBe(true);
});

test('any other Sec-Fetch-Site, or none, is rejected', () => {
  for (const site of ['same-site', 'cross-site', 'none']) expect(allowed({ ...ok, 'sec-fetch-site': site }), site).toBe(false);
  expect(allowed({ host })).toBe(false);
});

test('a foreign or missing Host is rejected (DNS rebinding)', () => {
  for (const h of ['evil.example', 'localhost.evil.example']) expect(allowed({ ...ok, host: h }), h).toBe(false);
  expect(allowed({ 'sec-fetch-site': 'same-origin' })).toBe(false);
});

test('a non-loopback socket is rejected', () => {
  expect(allowed(ok, '192.168.1.5')).toBe(false);
});

test('proxy headers are rejected (a tunnel or proxy in front of the agent server)', () => {
  for (const h of ['forwarded', 'via', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto']) expect(allowed({ ...ok, [h]: 'x' }), h).toBe(false);
});
