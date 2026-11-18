/**
 * A property's auction date, from EACH's `info2` column.
 *
 * EACH keeps it in the 5th backtick-separated field as YYMMDD with a 0-BASED month
 * (legacy 4prop added 1: Controller/Details.php, react-4prop yymmddDate.js). EACH has
 * nothing else about an auction: no time, venue, lot or separate end date.
 *
 * Read exactly as the 4prop mirror's rebuild reads it (property-pub
 * sql/abase/properties/002-p22-past-auction-sold.sql), which turns a past auction's
 * status into 9 (Sold): six digits, month 0-11, day 1-31, an overflowing day rolls
 * into the next month (DATEADD there, Date.UTC here).
 *
 * "Today" is the London calendar day, so the SPA, property-pub SSR and 4prop PHP (which
 * reads these fields from property-pub) agree whatever the viewer's clock says.
 *
 * Returns null when there is no (valid) auction date, else:
 *   date          'YYYY-MM-DD'
 *   dateText      'Thu 26 Nov 2026'
 *   shortDateText '26 Nov 2026' (the key facts strip)
 *   upcoming      true up to and including the auction day
 *   daysLeft      0 on the day, negative once past
 *   whenText      'in 8 days' | 'tomorrow' | 'today' | 'ended'
 */

const LONDON_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
});
// Fixed names, not Intl: engines disagree ("Sep" vs "Sept"), and the SPA's text must
// match what the server hands SSR and PHP.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_MS = 24 * 60 * 60 * 1000;

/** The 5th field, when it is exactly six digits. */
function rawAuctionField(info2) {
  if (typeof info2 !== 'string' || !info2) return null;
  const field = info2.split('`')[4];
  return /^\d{6}$/.test(field ?? '') ? field : null;
}

export function parseAuction(info2, { now = new Date() } = {}) {
  const raw = rawAuctionField(info2);
  if (!raw) return null;
  const yy = Number(raw.slice(0, 2));
  const mm = Number(raw.slice(2, 4)); // 0-based
  const dd = Number(raw.slice(4, 6));
  if (mm > 11 || dd < 1 || dd > 31) return null;

  const auctionUtc = Date.UTC(2000 + yy, mm, dd);
  const [ty, tm, td] = LONDON_DAY.format(now).split('-').map(Number);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  const daysLeft = Math.round((auctionUtc - todayUtc) / DAY_MS);

  let whenText = 'ended';
  if (daysLeft === 0) whenText = 'today';
  else if (daysLeft === 1) whenText = 'tomorrow';
  else if (daysLeft > 1) whenText = `in ${daysLeft} days`;

  const d = new Date(auctionUtc);
  const shortDateText = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return {
    date: d.toISOString().slice(0, 10),
    dateText: `${WEEKDAYS[d.getUTCDay()]} ${shortDateText}`,
    shortDateText,
    upcoming: daysLeft >= 0,
    daysLeft,
    whenText,
  };
}
