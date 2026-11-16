/**
 * EACH's "hide" switches on a property (`a_rpPropertyNewAll_p22.hideidentity`), and
 * each advertiser site's choice of which of them to honour
 * (`a_magAdvertisers.hide_identity_mask`, Website settings in the admin form).
 *
 * In EACH's property editor every Hide / Unhide button flips one bit of `hideidentity`
 * (EACH's field `H`). The values and labels below are EACH's own.
 *
 * A part is hidden on a site when BOTH say so:
 *
 *   hidden = property.hideidentity & site.hide_identity_mask
 *
 * A NULL site mask means DEFAULT_HIDE_IDENTITY_MASK: the five address parts, which is
 * what every site did before the setting existed (parsePropertyAddressLine has always
 * applied those). Pure: property-pub applies it server-side (see its
 * services/hideIdentity.js), the admin form renders the checkboxes from it.
 */

export const HIDE_IDENTITY_BITS = [
  { bit: 1, key: 'agents', label: 'Agents' },
  { bit: 2, key: 'street', label: 'Street' },
  { bit: 4, key: 'streetNumber', label: 'Street number' },
  { bit: 8, key: 'pics', label: 'Pics' },
  { bit: 32, key: 'centre', label: 'Centre / Estate' },
  { bit: 64, key: 'building', label: 'Building name' },
  { bit: 128, key: 'unit', label: 'Unit / Suite No' },
  { bit: 256, key: 'rentRates', label: 'Rent & Rates' },
  { bit: 512, key: 'price', label: 'Price' },
];

/** Every bit EACH defines (16 is unused there). */
export const HIDE_IDENTITY_ALL = HIDE_IDENTITY_BITS.reduce((m, b) => m | b.bit, 0);

/** Street, street number, centre / estate, building name, unit: 2 + 4 + 32 + 64 + 128. */
export const DEFAULT_HIDE_IDENTITY_MASK = 230;

/**
 * A stored / submitted mask → the bits it honours, or null for "use the default".
 * Unknown bits are dropped, so a typo can never hide something EACH doesn't define.
 * @param {unknown} value
 * @returns {number|null}
 */
export function normaliseHideIdentityMask(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return null;
  return n & HIDE_IDENTITY_ALL;
}

/** The mask a site actually applies (NULL → the default). */
export const effectiveSiteMask = (siteMask) => normaliseHideIdentityMask(siteMask) ?? DEFAULT_HIDE_IDENTITY_MASK;

/**
 * Which parts of one property are hidden on one site.
 * @param {unknown} propertyHide  the property's hideidentity
 * @param {unknown} siteMask      the advertiser's hide_identity_mask (null = default)
 * @returns {{ bits: number, agents: boolean, street: boolean, streetNumber: boolean, pics: boolean,
 *   centre: boolean, building: boolean, unit: boolean, rentRates: boolean, price: boolean }}
 */
export function hiddenParts(propertyHide, siteMask) {
  const bits = (Number(propertyHide) || 0) & effectiveSiteMask(siteMask);
  const out = { bits };
  for (const b of HIDE_IDENTITY_BITS) out[b.key] = (bits & b.bit) !== 0;
  return out;
}

// ---------------------------------------------------------------------------
// Masking raw property rows (shared by property-pub and bizchat). Pure: callers
// build the context (advertiser setting + viewer) with their own DB lookups.
// ---------------------------------------------------------------------------

const ROLE_ADMIN = 8;
const ROLE_EACH_AGENT = 32;

/** Placeholder cid the site-owner company is matched by (never a real company id). */
export const siteOwnerCid = (advertiserId) => `site${advertiserId}`;

const ADDRESS_COLUMNS = {
  street: 'street',
  streetNumber: 'streetnumber',
  centre: 'centreestate',
  building: 'building',
  unit: 'buildingnumber',
};
const ADDRESS_BITS = 2 | 4 | 32 | 64 | 128;

/**
 * Decimal places kept on latitude / longitude when any address part is hidden: 3 is
 * about 110 m north-south, enough for the map to show the area without pinning the
 * building. The postcode stays visible anyway.
 */
export const HIDDEN_ADDRESS_COORD_DP = 3;

/**
 * The request-scoped context for masking.
 * @param {{
 *   advertiserId: number|string,
 *   advertiser?: { name?: string, logo_url?: string, hide_identity_mask?: number|null, hide_identity_agents_see_all?: boolean } | null,
 *   user?: { role?: number, neg_id?: unknown } | null,
 *   viewerOrg?: { cid?: string, did?: string, nid?: string } | null,
 * }} input
 */
export function buildHideContext({ advertiserId, advertiser = null, user = null, viewerOrg = null }) {
  const role = Number(user?.role) || 0;
  const isAdmin = (role & ROLE_ADMIN) === ROLE_ADMIN;
  const isAgent = (role & ROLE_EACH_AGENT) === ROLE_EACH_AGENT || Boolean(user?.neg_id);
  const seeAll = isAdmin || Boolean(isAgent && advertiser?.hide_identity_agents_see_all);
  return {
    advertiserId: Number(advertiserId),
    siteName: advertiser?.name || 'This site',
    siteLogoUrl: advertiser?.logo_url || '',
    mask: advertiser?.hide_identity_mask ?? null,
    seeAll,
    viewerOrg: seeAll ? null : viewerOrg,
  };
}

/** Does the viewer need their agency looked up (agents only, and only if not seeing all)? */
export const needsViewerOrg = (ctx, user) => !ctx.seeAll && Boolean(user?.userId && user?.neg_id);

const listHas = (csv, id) => Boolean(id) && `,${String(csv ?? '')},`.replace(/\s+/g, '').includes(`,${id},`);

/** The viewer's own agency lists this property (company, department or negotiator). */
export function isOwnListing(row, org) {
  if (!org) return false;
  return listHas(row.cids, org.cid) || listHas(row.dids, org.did) || listHas(row.dealswith, org.nid);
}

/** Blank fields 5–7 (service charge, rates, rent) of every floor. */
function stripFloorMoney(floors) {
  if (!floors || typeof floors !== 'string') return floors;
  return floors.split('*').map((floor) => {
    const f = floor.split('|');
    for (const i of [5, 6, 7]) if (f.length > i) f[i] = '';
    return f.join('|');
  }).join('*');
}

const roundCoord = (v) => {
  const n = Number(v);
  if (v === null || v === undefined || v === '' || !Number.isFinite(n)) return v;
  const f = 10 ** HIDDEN_ADDRESS_COORD_DP;
  return Math.round(n * f) / f;
};

/**
 * Mask one raw property row in place (a_rpPropertyNewAll_p22 column names, lowercase).
 * Returns the hidden parts applied (`bits` 0 = none).
 *
 *   address parts   their column blanked; latitude / longitude rounded
 *   pics            images
 *   price           price
 *   rent & rates    rent, and each floor's service charge / rates / rent
 *   agents          cids → the site-owner placeholder; dids, bids, dealswith blanked
 */
export function maskPropertyRow(row, ctx) {
  if (!row || !ctx || ctx.seeAll) return { bits: 0 };
  const parts = hiddenParts(row.hideidentity, ctx.mask);
  if (!parts.bits || isOwnListing(row, ctx.viewerOrg)) return { bits: 0 };

  for (const [part, col] of Object.entries(ADDRESS_COLUMNS)) {
    if (parts[part] && col in row) row[col] = '';
  }
  if (parts.bits & ADDRESS_BITS) {
    if ('latitude' in row) row.latitude = roundCoord(row.latitude);
    if ('longitude' in row) row.longitude = roundCoord(row.longitude);
  }
  if (parts.pics && 'images' in row) row.images = '';
  if (parts.price && 'price' in row) row.price = 0;
  if (parts.rentRates) {
    if ('rent' in row) row.rent = 0;
    if ('floors' in row) row.floors = stripFloorMoney(row.floors);
  }
  if (parts.agents) {
    const placeholder = `,${siteOwnerCid(ctx.advertiserId)},`;
    row.cids = placeholder;
    if ('shared_contact_cids' in row) row.shared_contact_cids = placeholder;
    for (const c of ['dids', 'bids', 'dealswith']) if (c in row) row[c] = '';
    row.agents_hidden = true;
  }
  return parts;
}

/** Mask many rows; true when any had its agents hidden. */
export function maskPropertyRows(rows, ctx) {
  let agentsHidden = false;
  for (const row of rows || []) if (maskPropertyRow(row, ctx).agents) agentsHidden = true;
  return agentsHidden;
}

/** The site itself as a raw company row (the brand-row shape getCompanies returns). */
export function siteOwnerCompanyRow(ctx) {
  return {
    c: siteOwnerCid(ctx.advertiserId),
    name: ctx.siteName,
    phone: '',
    a: '', p: '', s: '', d: '', b: '',
    branch: '', department: '',
    logo_url: ctx.siteLogoUrl,
    site_owner: true,
  };
}

const idsOf = (rows, fields) => {
  const set = new Set();
  for (const r of rows || []) {
    for (const f of fields) for (const id of String(r?.[f] ?? '').split(',')) if (id.trim()) set.add(id.trim());
  }
  return set;
};

/**
 * After masking: keep only companies / departments some row still references (so a
 * hidden agency's name doesn't ride along in the payload), plus the site-owner company
 * when any row had its agents hidden.
 */
export function pruneCompanies({ rows, companies = [], departments = [], agentsHidden, ctx }) {
  const keep = idsOf(rows, ['cids', 'shared_contact_cids']);
  const keptDids = idsOf(rows, ['dids']);
  const outCompanies = (companies || []).filter((c) => keep.has(String(c?.c ?? c?.cid ?? '')));
  if (agentsHidden) outCompanies.push(siteOwnerCompanyRow(ctx));
  const outDepartments = (departments || []).filter((d) => keptDids.has(String(d?.did ?? '')));
  return { companies: outCompanies, departments: outDepartments };
}
