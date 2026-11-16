# @4prop/property-enhance

Isomorphic port of property-pub-react `makeEnhancedPropertyData` — turns raw MSSQL/API property rows into display-ready objects (`addressText`, `tenureText`, `sizeText`, `landText`, `tenure`, `pictures`, `companies`, `content`, etc.).

## Usage

```js
import enhancePropertyData, { buildPropertyTypes, normalizePropertyData } from '@4prop/property-enhance';

const enhanced = enhancePropertyData(
  normalizePropertyData(rawRow),
  propertyTypesCatalog,
  contentArray,      // optional [desc, location, amenities]
  companiesArray,      // raw negotiator/company rows
  { omitUserContext: true, propertyPhotosBaseUrl: 'https://example.test' }, // photos host override optional
);
```

## Batch / bizchat

- Load `propertyTypes` via fourprop `versions.json` + `types*.json` + `subtypes*.json` (see `loadPropertyTypesCatalog.mjs` in bizchat).
- Set `FOURPROP_BASE_URL` for property content (`/api/each?reqPropContentByIds=...`).
- Use `omitUserContext: true` for static JSON (latest-shuffled, etc.).

## Detail page heading: singular subtype labels

`headline` ("Shop for rent in Bermondsey, SE1") uses the SINGULAR of the first subtype,
from `src/subtypeSingularLabels.js` (`SUBTYPE_SINGULAR_LABELS`, one line per subtype id).
4prop's catalog labels are plural ("Shops"), and a "drop the s" rule gets real ones wrong.

**Adding or renaming a subtype in 4prop's `seo/variables/subtypes.json`? Add / update its
line in that map.** `npm test` reads the live catalog (the sibling `4prop` checkout, or
`$FOURPROP_VARIABLES_DIR`, else seo-enhance's fixture copy) and fails until every subtype
has an entry, printing the missing lines ready to paste. Until then the heading shows the
catalog label as it is; nothing breaks. Only the heading uses the map.

## Tests

```bash
npm test
```

Run from monorepo root after `npm install` so workspace links resolve.
