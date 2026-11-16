import { decodeLegacyPropertyText } from './escapetext.js';
import { singularSubtypeLabel } from './subtypeSingularLabels.js';

/**
 * The property detail page's HEADING: what it is, for sale or rent, and roughly
 * where. Shown above the gallery on all three renderings of the page (the React
 * SPA, property-pub's SSR and 4prop's PHP); the full address sits under the
 * gallery instead.
 *
 *   Warehouse for sale in London, N11
 *   Office for rent in Bermondsey, SE1
 *   Office in Peckham, SE15            ← for sale AND rent: the tenure is left out
 *
 * - WHAT: the first subtype ("Warehouse"), else the first type ("Industrial"),
 *   else "Property". The subtype is SINGULAR ("Shop", not the catalog's "Shops"),
 *   from subtypeSingularLabels.js: a new subtype in 4prop's subtypes.json needs
 *   its line there. One label, never a list: a property tagged with four types
 *   would otherwise produce a sentence, not a heading.
 * - TENURE: "for sale" / "for rent" only when it is one or the other.
 * - WHERE: the locality (suburb) if there is one, else the town, then the postcode
 *   DISTRICT (outward code only: "SE1", never the full unit postcode).
 *
 * Built by enhancePropertyData as `headline`, so all three pages get the same
 * string; 4prop's PHP reads that field rather than porting this.
 *
 * @param {{ typeLabel?: string, isSale?: boolean, isRent?: boolean, place?: string, postcode?: string }} parts
 * @returns {string}
 */
export function buildPropertyHeadline({ typeLabel, isSale, isRent, place, postcode } = {}) {
  const what = String(typeLabel || '').trim() || 'Property';
  const tenure = isSale && !isRent ? ' for sale' : isRent && !isSale ? ' for rent' : '';
  const district = postcodeDistrict(postcode);
  const where = [String(place || '').trim(), district].filter(Boolean).join(', ');
  return `${what}${tenure}${where ? ` in ${where}` : ''}`;
}

/** "SE1 3AB" / "se1" → "SE1". Empty when it doesn't look like a UK postcode. */
export function postcodeDistrict(postcode) {
  const outward = String(postcode || '').trim().split(/\s+/)[0]?.toUpperCase() || '';
  return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(outward) ? outward : '';
}

/**
 * The headline for an ENHANCED property (enhancePropertyData's output). Uses the
 * `headline` field when present, else builds it from the same fields, so a cached
 * property enhanced before the field existed still gets one.
 *
 * @param {object} property
 * @returns {string}
 */
export function propertyHeadline(property) {
  if (!property) return '';
  if (property.headline) return property.headline;
  const original = property.original || {};
  return buildPropertyHeadline({
    typeLabel: singularSubtypeLabel(property.subtypes?.[0]) || property.types?.[0]?.label || property.firstSubtype,
    isSale: Boolean(property.tenure?.isSale),
    isRent: Boolean(property.tenure?.isRent),
    place: decodeLegacyPropertyText(original.suburblocality) || decodeLegacyPropertyText(original.towncity) || '',
    postcode: original.matchpostcode,
  });
}
