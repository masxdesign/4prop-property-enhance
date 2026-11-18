import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAuction } from '../src/parseAuction.js';

const NOW = new Date('2026-11-18T12:00:00Z');

test('5th field, 0-based month: 261026 is Thu 26 Nov 2026, 8 days away', () => {
  assert.deepEqual(parseAuction('````261026````', { now: NOW }), {
    date: '2026-11-26',
    dateText: 'Thu 26 Nov 2026',
    shortDateText: '26 Nov 2026',
    upcoming: true,
    daysLeft: 8,
    whenText: 'in 8 days',
  });
});

test('field at the very end, other fields filled (real prod shape)', () => {
  // PID 260005393624 on prod: 770````260330 = 30 Apr 2026
  const a = parseAuction('770````260330', { now: NOW });
  assert.equal(a.date, '2026-04-30');
  assert.equal(a.upcoming, false);
  assert.equal(a.whenText, 'ended');
});

test('today and tomorrow, on the London calendar day', () => {
  assert.equal(parseAuction('````261018', { now: NOW }).whenText, 'today');
  assert.equal(parseAuction('````261018', { now: NOW }).upcoming, true);
  assert.equal(parseAuction('````261019', { now: NOW }).whenText, 'tomorrow');
  // 23:30 UTC on 30 Jun is already 1 Jul in London (BST)
  assert.equal(parseAuction('````260601', { now: new Date('2026-06-30T23:30:00Z') }).whenText, 'today');
});

test('no auction: empty, too short, not digits, month 12+, day 0', () => {
  for (const info2 of [null, '', '````', '````2610`', '````26102x', '`a`b`c`d`', '````261201', '````261000', '2610261````']) {
    assert.equal(parseAuction(info2, { now: NOW }), null, String(info2));
  }
});

test('September is "Sep" on every engine', () => {
  assert.equal(parseAuction('````230821', { now: NOW }).dateText, 'Thu 21 Sep 2023');
});

test('an overflowing day rolls over, as the SQL rule does (31 Feb -> 3 Mar 2026)', () => {
  assert.equal(parseAuction('````260131', { now: NOW }).date, '2026-03-03');
});
