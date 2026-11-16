import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPropertyHeadline, postcodeDistrict, propertyHeadline } from '../src/buildPropertyHeadline.js';

test('sale, rent, both', () => {
  assert.equal(buildPropertyHeadline({ typeLabel: 'Warehouse', isSale: true, place: 'London', postcode: 'N11' }), 'Warehouse for sale in London, N11');
  assert.equal(buildPropertyHeadline({ typeLabel: 'Office', isRent: true, place: 'Bermondsey', postcode: 'SE1 3AB' }), 'Office for rent in Bermondsey, SE1');
  assert.equal(buildPropertyHeadline({ typeLabel: 'Office', isSale: true, isRent: true, place: 'Peckham', postcode: 'se15' }), 'Office in Peckham, SE15');
});

test('missing parts', () => {
  assert.equal(buildPropertyHeadline({ isRent: true }), 'Property for rent');
  assert.equal(buildPropertyHeadline({ typeLabel: 'Shop', postcode: 'E1' }), 'Shop in E1');
  assert.equal(buildPropertyHeadline({ typeLabel: 'Shop', place: 'Leeds', postcode: 'nonsense' }), 'Shop in Leeds');
  assert.equal(postcodeDistrict('EC1N 8AA'), 'EC1N');
});

test('propertyHeadline falls back from the enhanced fields', () => {
  assert.equal(propertyHeadline({ headline: 'X' }), 'X');
  assert.equal(propertyHeadline({
    subtypes: [{ label: 'Warehouse' }], tenure: { isSale: true },
    original: { towncity: 'London', matchpostcode: 'N11' },
  }), 'Warehouse for sale in London, N11');
});
