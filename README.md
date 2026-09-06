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

## Tests

```bash
npm test
```

Run from monorepo root after `npm install` so workspace links resolve.
