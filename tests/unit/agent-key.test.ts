import type { IncomingHttpHeaders } from 'node:http';
import { expect, test } from 'vitest';
import { localSameOrigin } from '../../agent-key';

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
