import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFloors, floorAvailableText } from '../src/parseFloors.js';

const NOW = new Date('2026-11-16T12:00:00Z');

test('office floors: names, sizes, total, past dates read "Now"', () => {
  // pid 1908260912261 (dev DB)
  const raw = '3rd|Third Floor North|2|2560||||39.5|1909||*1|Second Floor North|2|2457||||39.5|1909||*4th|Fourth Floor North|2|2336||||39.5|1909||';
  assert.deepEqual(parseFloors(raw, { now: NOW }), {
    rows: [
      { name: 'Third Floor North', sizeText: '2,560 sq ft', statusLabel: null, availableText: 'Now' },
      { name: 'Second Floor North', sizeText: '2,457 sq ft', statusLabel: null, availableText: 'Now' },
      { name: 'Fourth Floor North', sizeText: '2,336 sq ft', statusLabel: null, availableText: 'Now' },
    ],
    totalText: '7,353 sq ft',
    showAvailable: true,
  });
});

test('placeholder floors (size 0) and withdrawn / unadvertised / let floors are dropped', () => {
  // pid 220809150811 (dev DB): every level listed, most at 0, status 2 = Withdrawn
  const raw = 'LG|LG|2|877|2|0|0|0|`2301!123075!0|*7|7|2|0|2|0|0|0||*4th|4th|2|1617|2|0|0|0||*3rd|3rd|2|1617|0|0|0|0||*0|0 GF|2|0|2|0|0|0||*-1|Store|2|500|7|0|0|0||*2|2nd|2|900|8|0|0|0||';
  const f = parseFloors(raw, { now: NOW });
  assert.deepEqual(f.rows.map((r) => r.name), ['3rd']);
  assert.equal(f.totalText, null, 'no total for a single floor');
  assert.equal(f.showAvailable, false);
});

test('under offer and pre-let are kept with a label', () => {
  const f = parseFloors('1|First|2|1000|1|||||*2|Second|2|2000|5|||||', { now: NOW });
  assert.deepEqual(f.rows.map((r) => [r.name, r.statusLabel]), [['First', 'Under offer'], ['Second', 'Pre-let']]);
});

test('names: trimmed, stray backtick removed, falls back to the level', () => {
  const f = parseFloors('| 1st Suite C|2|3220|0|||48300||*1|Unit 8`|2|1030|0|0|0|12||*GF||2|500|0||||', { now: NOW });
  assert.deepEqual(f.rows.map((r) => r.name), ['1st Suite C', 'Unit 8', 'GF']);
});

test('units, comma sizes, mixed units have no total', () => {
  const f = parseFloors('a|A|2|4,096|0||||*b|B|1|120.5|0||||*c|C|4|2.25|0||||', { now: NOW });
  assert.deepEqual(f.rows.map((r) => r.sizeText), ['4,096 sq ft', '120.5 sq m', '2.25 acres']);
  assert.equal(f.totalText, null);
});

test('nothing to show', () => {
  assert.equal(parseFloors('', { now: NOW }), null);
  assert.equal(parseFloors(null), null);
  assert.equal(parseFloors('7|7|2|0|0|||||*6|6|2|0|0|||||', { now: NOW }), null);
});

test('available date', () => {
  assert.equal(floorAvailableText('2106', NOW), 'Now');
  assert.equal(floorAvailableText('2611', NOW), 'Now', 'this month');
  assert.equal(floorAvailableText('2706`2210!221003200738!0', NOW), 'Jun 2027', 'history after the backtick ignored');
  assert.equal(floorAvailableText('2700', NOW), '2027', 'month 00 = the year');
  assert.equal(floorAvailableText('`2306!10292!0', NOW), null, 'history only, no date');
  assert.equal(floorAvailableText('', NOW), null);
});
