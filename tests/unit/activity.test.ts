import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';

vi.mock('../../src/lib/data/library.svelte', () => ({ library: { openCheck: vi.fn() } }));

import Activity, { estimatePreflights, formatLog, resultName, size, statusName } from '../../src/lib/ui/Activity.svelte';
import MoreMenu from '../../src/lib/ui/MoreMenu.svelte';

const at = new Date(2026, 9, 20, 9, 5, 7).getTime();
const entry = (o = {}) => ({ time: at, label: 'Characters · first page', source: 'api' as const, result: 'ok' as const, status: 200, bytes: 2048, ms: 120, ...o });
const counters = { sessionApi: 7, todayApi: 9, dailyCap: 1000, imageHost: 3, status: 'ok' };

describe('Activity text', () => {
  it('names results, sizes and statuses', () => {
    expect(resultName(entry())).toBe('OK');
    expect(resultName(entry({ result: 'error', status: 401 }))).toBe('Wrong key (401)');
    expect(resultName(entry({ result: 'error', status: 429 }))).toBe('Too many requests (429)');
    expect(resultName(entry({ result: 'error', status: undefined }))).toBe('Network error');
    expect(resultName(entry({ result: 'cap' }))).toBe('Blocked by daily cap');
    expect(size(undefined)).toBe('-');
    expect(size(2048)).toBe('2.0 KB');
    expect(statusName('key-lost')).toBe('Key lost');
  });

  it('estimates hidden permission checks: one per kind of request per 10 minutes, API only', () => {
    const list = [entry(), entry({ time: at + 1000 }), entry({ label: 'Objects · first page' }), entry({ time: at + 11 * 60_000 }), entry({ source: 'image', label: 'Picture' })];
    expect(estimatePreflights(list)).toBe(3);
  });

  it('copies a plain-text log with counters and one line per request', () => {
    const text = formatLog([entry()], counters);
    expect(text).toContain('API requests today: 9 of 1000');
    expect(text).toContain('Status: OK');
    expect(text.split('\n').at(-1)).toBe('09:05:07 | Characters · first page | PixelLab API | OK | 2.0 KB | 120 ms');
  });
});

describe('panels', () => {
  const html = (c: unknown, props: Record<string, unknown>) => (render(c as never, { props: props as never }) as { body: string }).body;

  it('render nothing when closed', () => {
    expect(html(Activity, { open: false, onClose() {} })).not.toContain('Activity');
    expect(html(MoreMenu, { open: false, onClose() {}, onActivity() {} })).not.toContain('Refresh');
  });

  it('Activity shows counters, the estimate note and Copy log', () => {
    const body = html(Activity, { open: true, onClose() {} });
    for (const s of ['API requests this session', 'API requests today', 'Image-host loads', 'Status', 'Copy log', 'hidden permission check']) expect(body).toContain(s);
  });

  it('the menu has exactly two items: Refresh and Activity', () => {
    const body = html(MoreMenu, { open: true, onClose() {}, onActivity() {} });
    expect(body.match(/role="menuitem"/g)).toHaveLength(2);
    expect(body).toContain('Refresh');
    expect(body).toContain('Activity');
  });
});
