/**
 * Every subtype in 4prop's catalog must have a singular label for the detail page
 * heading (src/subtypeSingularLabels.js).
 *
 * Reads the LIVE catalog, 4prop/code/seo/variables/subtypes.json (sibling repo,
 * or $FOURPROP_VARIABLES_DIR), so adding a subtype there fails this test until
 * its line is added. Without the 4prop checkout it uses seo-enhance's verbatim
 * fixture copy instead.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUBTYPE_SINGULAR_LABELS, singularSubtypeLabel } from '../src/subtypeSingularLabels.js';
import { propertyHeadline } from '../src/buildPropertyHeadline.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATES = [
  process.env.FOURPROP_VARIABLES_DIR && path.join(process.env.FOURPROP_VARIABLES_DIR, 'subtypes.json'),
  path.resolve(here, '../../../../../4prop/code/seo/variables/subtypes.json'),
  path.resolve(here, '../../seo-enhance/src/__fixtures__/subtypes.json'),
].filter(Boolean);
const catalogPath = CANDIDATES.find((p) => existsSync(p));
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));

test(`every subtype in the catalog has a singular label (${path.relative(process.cwd(), catalogPath)})`, () => {
  const missing = catalog.filter(([id]) => !SUBTYPE_SINGULAR_LABELS[String(id)]);
  assert.equal(
    missing.length,
    0,
    'Add these to src/subtypeSingularLabels.js (singular form of the label):\n'
      + missing.map(([id, label]) => `  ${id}: '${label}',`).join('\n'),
  );
});

test('no stale entries for subtypes the catalog no longer has', () => {
  const ids = new Set(catalog.map(([id]) => String(id)));
  const stale = Object.keys(SUBTYPE_SINGULAR_LABELS).filter((id) => !ids.has(id));
  assert.deepEqual(stale, [], 'Remove (or check the id of) these entries in src/subtypeSingularLabels.js');
});

test('singular labels', () => {
  assert.equal(singularSubtypeLabel({ id: 10, label: 'Shops' }), 'Shop');
  assert.equal(singularSubtypeLabel({ id: '14', label: 'Bars/Pubs' }), 'Bar/Pub');
  assert.equal(singularSubtypeLabel({ id: 89, label: 'Watersports' }), 'Watersports');
  // Unknown id: the catalog label as it is.
  assert.equal(singularSubtypeLabel({ id: 9999, label: 'New Things' }), 'New Things');
  assert.equal(singularSubtypeLabel(null), '');
});

test('the heading uses the singular label', () => {
  assert.equal(
    propertyHeadline({
      subtypes: [{ id: 10, label: 'Shops' }], tenure: { isRent: true },
      original: { suburblocality: 'Bermondsey', matchpostcode: 'SE1 3AB' },
    }),
    'Shop for rent in Bermondsey, SE1',
  );
});
