import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HIDE_IDENTITY_BITS,
  HIDE_IDENTITY_ALL,
  DEFAULT_HIDE_IDENTITY_MASK,
  normaliseHideIdentityMask,
  effectiveSiteMask,
  hiddenParts,
} from '../src/hideIdentity.js';

test("EACH's bits", () => {
  assert.deepEqual(HIDE_IDENTITY_BITS.map((b) => b.bit), [1, 2, 4, 8, 32, 64, 128, 256, 512]);
  assert.equal(HIDE_IDENTITY_ALL, 1007);
  assert.equal(DEFAULT_HIDE_IDENTITY_MASK, 2 + 4 + 32 + 64 + 128);
});

test('mask normalisation', () => {
  assert.equal(normaliseHideIdentityMask(null), null);
  assert.equal(normaliseHideIdentityMask(''), null);
  assert.equal(normaliseHideIdentityMask('abc'), null);
  assert.equal(normaliseHideIdentityMask(-1), null);
  assert.equal(normaliseHideIdentityMask(0), 0, '0 = honour nothing, not the default');
  assert.equal(normaliseHideIdentityMask(16 | 2), 2, 'unknown bits dropped');
  assert.equal(normaliseHideIdentityMask('9'), 9);
  assert.equal(effectiveSiteMask(null), DEFAULT_HIDE_IDENTITY_MASK);
  assert.equal(effectiveSiteMask(0), 0);
});

test('a part is hidden only when the property AND the site say so', () => {
  // EACH test property: price + rent & rates + building name + street number.
  const h = 836;
  assert.deepEqual(
    Object.entries(hiddenParts(h, null)).filter(([k, v]) => k !== 'bits' && v).map(([k]) => k),
    ['streetNumber', 'building'],
    'default site: address parts only',
  );
  const all = hiddenParts(h, HIDE_IDENTITY_ALL);
  assert.equal(all.price, true);
  assert.equal(all.rentRates, true);
  assert.equal(all.agents, false);
  assert.equal(hiddenParts(h, 0).bits, 0, 'a site honouring nothing hides nothing');
  assert.equal(hiddenParts(1 | 8, 1).agents, true);
  assert.equal(hiddenParts(1 | 8, 1).pics, false);
  assert.equal(hiddenParts(null, HIDE_IDENTITY_ALL).bits, 0);
});
