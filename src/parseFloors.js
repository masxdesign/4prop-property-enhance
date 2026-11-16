/**
 * The property's floors (`a_rpPropertyNewAll_p22.floors`, edited in EACH) → the
 * rows of the detail page's Floors table. Built once by enhancePropertyData as
 * `floors`; React, property-pub SSR and 4prop's PHP all render that field.
 *
 * FORMAT. Floors are separated by `*`, fields within a floor by `|`:
 *
 *   3rd|Third Floor North|2|2560|0|5.28|12.00|18.50|1909`2210!221003200738!0||
 *
 *   0 level / sort key ("-1", "GF", "4th", "Indust")  not shown
 *   1 name                                            Floor column (trimmed)
 *   2 unit: 1 sq m, 2 sq ft, 4 acres                  Size column
 *   3 size ("4,096" happens)                          Size column; 0 = not offered
 *   4 status (property status codes)                  filter + label
 *   5 service charge, 6 rates, 7 rent                 not shown (see below)
 *   8 available from, YYMM, then optional change      Available column
 *     history entries after backticks
 *   9 rarely used                                     not shown
 *
 * - SIZE 0 = NOT PART OF THE LISTING. Agents list every level of the building and
 *   leave the ones not on offer at 0; those rows are dropped (the legacy PHP did
 *   the same).
 * - Only space on offer is listed: Available (0 or empty), plus Under Offer and
 *   Pre-let with a label. Withdrawn, Archive, Deleted, Unadvertised, Let and Sold
 *   floors are left out.
 * - Rent is NOT shown: its period isn't stored per floor, and the property's own
 *   `rentperiod` doesn't reliably describe it (a property with an annual period
 *   carries floor rents of 18.50, i.e. per sq ft).
 * - "Available": a past (or this) month reads "Now", a future one "Jun 2027". A
 *   month of 00 reads as the year alone.
 *
 * @param {string|null|undefined} raw
 * @param {{ now?: Date }} [options]
 * @returns {{ rows: FloorRow[], totalText: string|null, showAvailable: boolean } | null}
 *   null when there is nothing to show.
 *
 * @typedef {{ name: string, sizeText: string, statusLabel: string|null, availableText: string|null }} FloorRow
 */

const UNITS = { 1: 'sq m', 2: 'sq ft', 4: 'acres' };
const STATUS_SHOWN = { '': null, 0: null, 1: 'Under offer', 5: 'Pre-let' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatNumber = (n) => n.toLocaleString('en-GB', { maximumFractionDigits: 2 });

/** "2106" → "Jun 2021", or "Now" when not in the future; "2200" → "2022"; else null. */
export function floorAvailableText(value, now = new Date()) {
  const ym = String(value || '').split('`')[0].trim();
  if (!/^\d{4}$/.test(ym)) return null;
  const year = 2000 + Number(ym.slice(0, 2));
  const month = Number(ym.slice(2));
  if (month < 1 || month > 12) return String(year);
  const thisMonth = now.getFullYear() * 12 + now.getMonth();
  if (year * 12 + (month - 1) <= thisMonth) return 'Now';
  return `${MONTHS[month - 1]} ${year}`;
}

export function parseFloors(raw, { now = new Date() } = {}) {
  if (!raw || typeof raw !== 'string') return null;

  const rows = [];
  const totals = {};
  for (const floor of raw.split('*')) {
    const f = floor.split('|');
    const size = Number(String(f[3] ?? '').replace(/,/g, '').trim());
    if (!(size > 0)) continue;

    const status = String(f[4] ?? '').trim();
    if (!(status in STATUS_SHOWN)) continue;

    const unit = UNITS[String(f[2] ?? '').trim()] || UNITS[2];
    const name = String(f[1] ?? '').replace(/`/g, '').trim() || String(f[0] ?? '').trim() || 'Floor';

    rows.push({
      name,
      sizeText: `${formatNumber(size)} ${unit}`,
      statusLabel: STATUS_SHOWN[status],
      availableText: floorAvailableText(f[8], now),
    });
    totals[unit] = (totals[unit] || 0) + size;
  }

  if (!rows.length) return null;

  const units = Object.keys(totals);
  return {
    rows,
    totalText: rows.length > 1 && units.length === 1 ? `${formatNumber(totals[units[0]])} ${units[0]}` : null,
    showAvailable: rows.some((r) => r.availableText),
  };
}
