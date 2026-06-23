import makeEnhancedCompanies from './makeEnhancedCompanies.js';
import { number_format, formatCurrency } from './mathsUtils.js';
import { determineTenureText } from './propertyNormalize.js';
import { escapetext } from './escapetext.js';
import { parsePropertyAddressLine } from './parsePropertyAddressLine.js';

const USER_CONTEXT_KEYS = [
  'grade',
  'grade_advertiser_id',
  'grade_advertiser_name',
  'grade_updated_at',
  'shortlist_ids',
  'shared_by_agent_nid',
  'shared_by_agent_name',
  'shared_by_agent_picture',
  'shared_at',
  'share_conversation_id',
  'has_unread_share',
  'isSharedContact',
  'hasEnquiry',
  'hasUnread',
];

const displayMinMax = (min, max, decimal = 0) => {
  const nf = (value) => {
    const num = Number(value);
    if (decimal === 2) {
      return formatCurrency(num);
    }
    return num > 10 ? number_format(value) : parseFloat(num.toFixed(decimal));
  };
  return `${min !== max && min > 0 ? `${nf(min)} - ` : ''}${nf(max)}`;
};

class Size {
  units = { 0: 'sqft', 1: 'sqm', 2: 'sqft', 4: 'acres', 8: 'ha' };

  constructor(min, max, unit) {
    this._min = Math.round(min * 100) / 100;
    this._max = Math.round(max * 100) / 100;
    this._unit = unit;
  }

  get unit() { return this.units[this._unit]; }
  get isDefined() { return Math.max(this._min, this._max) > 0; }
  get isRange() { return Math.min(this._min, this._max) > 0; }
  get nonRangeLabel() {
    if (!this.isDefined || this.isRange) return null;
    return (this._min > 0 ? `min ${this._min}` : `max ${this._max}`) + ` ${this.unit}`;
  }

  get size() {
    if (!this.isDefined) return null;
    return {
      min: Math.min(this._min, this._max),
      max: Math.max(this._min, this._max),
      unit: this.unit,
      nonRangeLabel: this.nonRangeLabel,
    };
  }
}

const displaySize = ({ min, max, unit, decimal }) => `${displayMinMax(min, max, decimal)} ${unit}`;
const displayTenure = ({ isRent, rent, isSale, price }) =>
  `${isRent ? `${rent}${isSale ? ' | ' : ''}` : ''}${isSale ? price : ''}`;

const strip_tags = (s) => String(s || '').replace(/<\/?[^>]+(>|$)/g, '');
const fallVals = (a, b, c) => (a || b || c || '');
const htmlEntities = (s) => escapetext(s);

const dsm = (a, op, b) => {
  const x = Number(a) || 0;
  const y = Number(b) || 0;
  if (op === '*') return Math.round((x * y) * 1e6) / 1e6;
  if (op === '/') return y === 0 ? 0 : Math.round((x / y) * 1e6) / 1e6;
  return 0;
};

const PROPERTY_STATUS_NAMES = {
  0: 'Available',
  1: 'Under Offer',
  2: 'Withdrawn',
  5: 'Pre-LET Available',
  7: 'Unadvertised',
  8: 'LET',
  9: 'SOLD',
  40: 'LET',
  41: 'SOLD',
};
const PROPERTY_STATUS_COLORS = {
  0: 'green',
  1: 'orange',
  2: 'red',
  5: 'sky',
  7: 'sky',
  8: 'red',
  9: 'red',
  40: 'sky',
  41: 'red',
};

export const parseContent = (property, contentArray = []) => {
  if (!property || typeof property !== 'object') {
    return { teaser: '', description: '', location: '', amenities: '' };
  }
  try {
    const { description = '', locationdesc = '', amenities = '' } = property;
    const [extraDesc = '', extraLocation = '', extraAmenities = ''] = contentArray;
    const finalDescription = extraDesc || description || '';
    const finalLocation = extraLocation || locationdesc || '';
    const finalAmenities = extraAmenities || amenities || '';
    let teaser = fallVals(finalDescription, finalLocation, finalAmenities);
    teaser = strip_tags(escapetext(teaser || ''));
    return {
      teaser: teaser.substr(0, 72),
      teaser_full: teaser,
      description: htmlEntities(finalDescription),
      location: htmlEntities(finalLocation),
      amenities: htmlEntities(finalAmenities),
    };
  } catch {
    return { teaser: '', description: '', location: '', amenities: '' };
  }
};

/**
 * @param {object} originalProperty
 * @param {Array} propertyTypes
 * @param {Array} [contentArray]
 * @param {Array} [companiesArray]
 * @param {{ addressShowMore?: boolean, addressShowBuilding?: boolean, departments?: Array, omitUserContext?: boolean }} [settings]
 */
export default function enhancePropertyData(
  originalProperty,
  propertyTypes,
  contentArray = [],
  companiesArray = [],
  settings = { addressShowMore: true, addressShowBuilding: true },
) {
  if (!originalProperty || typeof originalProperty !== 'object' || !originalProperty.pid) {
    return null;
  }

  const omitUserContext = Boolean(settings?.omitUserContext);
  const companiesPool = makeEnhancedCompanies(companiesArray);
  const departmentsByDid = new Map(
    (settings?.departments ?? []).map((d) => [String(d.did), d]),
  );

  const parseTypes = (property, types) => {
    if (!property || !Array.isArray(types)) return { types: [], subtypes: [] };
    const { types: typeIdsStr = '', pstids = '' } = property;
    try {
      const typeMap = new Map();
      const subtypeMap = new Map();
      types.forEach((t) => {
        if (t && t.id != null) {
          typeMap.set(String(t.id), t);
          if (Array.isArray(t.subtypes)) {
            t.subtypes.forEach((s) => {
              if (s && s.id != null) subtypeMap.set(String(s.id), { ...s, parentType: t });
            });
          }
        }
      });
      const typeIds = typeIdsStr.split(',').map((x) => x.trim()).filter((x) => x && typeMap.has(x));
      const subtypeIds = pstids.split(',').map((x) => x.trim()).filter((x) => x && subtypeMap.has(x));
      return {
        types: typeIds.map((id) => typeMap.get(id)).filter(Boolean),
        subtypes: subtypeIds.map((id) => subtypeMap.get(id)).filter(Boolean),
      };
    } catch {
      return { types: [], subtypes: [] };
    }
  };

  const parseSize = (property) => {
    if (!property || typeof property !== 'object') return { isIn: false, isExt: false, land: null };
    try {
      const { sizeunit, sizemin, sizemax, sizeunitexternal, minexternal, maxexternal } = property;
      const size = new Size(sizemin, sizemax, sizeunit);
      const sizeExt = new Size(minexternal, maxexternal, sizeunitexternal);
      return {
        isExt: sizeExt.isDefined,
        land: sizeExt.isDefined ? sizeExt.size : null,
        isIn: size.isDefined,
        ...size.size,
      };
    } catch {
      return { isIn: false, isExt: false, land: null };
    }
  };

  const parseTenure = (property) => {
    if (!property || typeof property !== 'object') {
      return {
        rent: '', rentAlt: '', price: '', priceAlt: '', isSale: false, isRent: false,
        isSaleRent: false, value: 0, text: 'Unknown', extended: {},
      };
    }
    try {
      const {
        tenure = 0, price = 0, rent = 0, rentperiod = '1',
        minintsqft = 0, maxintsqft = 0, pricemin = 0, pricemax = 0, rentmin = 0, rentmax = 0,
      } = property;
      const period = { '-1': '/sqft', '-2': '/sqm', '1': 'pa', '2': 'monthly', '4': 'weekly' };

      const isRent = (tenure & 3) > 0;
      const isSale = (tenure & 12) > 0;
      const isLease = (tenure & 1) > 0;
      const isShortLease = (tenure & 2) > 0;
      const isFreehold = (tenure & 4) > 0;
      const isLongLeaseHold = (tenure & 8) > 0;

      const shortLabels = ['Lease', 'ShortLs', 'FHold', 'LongLs'];
      const rentCheckIndex = { 0: isLease, 1: isShortLease };
      const saleCheckIndex = { 2: isFreehold, 3: isLongLeaseHold };
      const combiner = (m, n) => Object.entries(m).filter(([, v]) => v).map(([i]) => n[i]);

      const priceMinMax = Math.max(pricemin, pricemax) < 1 ? '' : `£${displayMinMax(pricemin, pricemax, 2)}`;
      const rentMinMax = Math.max(rentmin, rentmax) < 1 ? '' : `£${displayMinMax(rentmin, rentmax, 2)} ${period[rentperiod]}`;

      const extended = {
        shortSaleText: `${combiner(saleCheckIndex, shortLabels).join('/')}  ${priceMinMax}`,
        shortRentText: `${combiner(rentCheckIndex, shortLabels).join('/')}  ${rentMinMax}`,
      };

      let formattedRent = '';
      let formattedPrice = '';
      let priceAlt = '';
      let rentAlt = '';

      const intsqft = Math.max(minintsqft, maxintsqft);

      if (intsqft > 0) {
        if (isRent && rent > 0) {
          rentAlt = '£';
          if (['-1', '-2'].includes(rentperiod)) {
            rentAlt += formatCurrency(('-1' === rentperiod ? 1 : 0.092903) * rent * intsqft) + ' pa';
          } else {
            let r = 1;
            if (rentperiod === '4') r = 52;
            if (rentperiod === '2') r = 12;
            const res = Math.ceil(dsm(dsm(rent, '*', r), '/', intsqft));
            rentAlt += formatCurrency(res) + ' /sqft';
          }
        }
        if (isSale && price > 0) {
          const res = Math.ceil(dsm(price, '/', intsqft));
          priceAlt = '£' + formatCurrency(res) + ' /sqft';
        }
      }

      if (isRent) {
        const formattedRentNum = formatCurrency(rent);
        formattedRent = formattedRentNum == 0 ? (isRent ? '£ROA' : '') : `£${formattedRentNum} ${period[rentperiod]}`;
      }

      if (isSale) {
        const formattedPriceNum = formatCurrency(price);
        formattedPrice = formattedPriceNum == 0 ? (isSale ? '£POA' : '') : `£${formattedPriceNum}`;
      }

      const text = determineTenureText(property.tenure, property.rentperiod);

      return {
        rent: formattedRent,
        rentAlt,
        price: formattedPrice,
        priceAlt,
        isSale,
        isRent,
        isSaleRent: isSale && isRent,
        value: tenure,
        text,
        extended,
      };
    } catch {
      return {
        rent: '', rentAlt: '', price: '', priceAlt: '', isSale: false, isRent: false,
        isSaleRent: false, value: 0, text: 'Unknown', extended: {},
      };
    }
  };

  const parsePictures = (property) => {
    if (!property || !property.images || typeof property.images !== 'string') {
      return { count: 0, previews: [], thumbs: [], full: [], captions: [] };
    }
    try {
      const { images } = property;
      const output = [];
      const captions = [];
      images.split('*').forEach((image) => {
        if (image !== '') {
          const im = image.split('|');
          if (im.length >= 6) {
            const z = (x) => (im[1].includes('.') ? im[1] : `${x}.${im[1]}`);
            output.push((x) => `https://www.4prop.com/JSON/NIDs/${im[5]}/${im[0] !== '' ? im[0] : im[3]}/${z(x)}`);
            captions.push(im[2] || '');
          }
        }
      });
      const render = (x) => output.map((k) => k(x));
      return { count: output.length, previews: render(3), thumbs: render('t'), full: render(0), captions };
    } catch {
      return { count: 0, previews: [], thumbs: [], full: [], captions: [] };
    }
  };

  const parseCompanies = (property) => {
    if (!property || !Array.isArray(companiesPool)) return [];
    try {
      const cids = omitUserContext
        ? String(property.cids || '')
        : (String(property.shared_contact_cids || '').trim() || String(property.cids || ''));

      const propertyDids = String(property.dids || '')
        .split(',').map((s) => s.trim()).filter(Boolean);
      const ownDeptByCid = new Map();
      for (const did of propertyDids) {
        const dept = departmentsByDid.get(did);
        if (dept && !ownDeptByCid.has(String(dept.cid))) {
          ownDeptByCid.set(String(dept.cid), dept);
        }
      }

      return companiesPool
        .filter((c) => c && String(cids).includes(`,${c.cid},`))
        .map((c) => {
          const own = ownDeptByCid.get(String(c.cid));
          if (!own) return c;
          return { ...c, branch: own.branch ?? c.branch, department: own.department ?? c.department };
        });
    } catch {
      return [];
    }
  };

  const { addressShowMore, addressShowBuilding } = settings;

  const parsedTypes = parseTypes(originalProperty, propertyTypes);
  const parsedTenure = parseTenure(originalProperty);
  const parsedAddress = parsePropertyAddressLine(originalProperty, {
    showMore: addressShowMore,
    showBuilding: addressShowBuilding,
    showPostcode: true,
  });
  const parsedSize = parseSize(originalProperty);
  const parsedContent = parseContent(originalProperty, contentArray);
  const parsedPictures = parsePictures(originalProperty);
  const parsedCompanies = parseCompanies(originalProperty);

  const sizeText = parsedSize.isIn ? displaySize({ ...parsedSize, decimal: 2 }) : null;
  const landText = parsedSize.land ? displaySize({ ...parsedSize.land, decimal: 2 }) : null;
  const typesText = parsedTypes.types.map((t) => t.label).filter(Boolean).join(', ') || '';
  const subtypesText = parsedTypes.subtypes.map((t) => t.label).filter(Boolean).join(', ') || '';

  const tenureText = displayTenure(parsedTenure);
  const title = `${typesText} ${parsedTenure.text || ''} in ${parsedAddress}`;

  const { status, dealswith = '', latitude, longitude } = originalProperty;
  const dealingAgents = [...new Set(String(dealswith).trim(',').split(',').filter(Boolean))];

  let agents = dealingAgents;
  let isSharedContact = false;

  if (!omitUserContext) {
    const sharedByAgentNid = originalProperty.shared_by_agent_nid != null
      ? String(originalProperty.shared_by_agent_nid).trim()
      : '';
    isSharedContact = Boolean(String(originalProperty.shared_contact_cids || '').trim());
    agents = isSharedContact && sharedByAgentNid
      ? [sharedByAgentNid]
      : dealingAgents;
  }

  const result = {
    pid: originalProperty.pid,
    id: originalProperty.pid,
    key: originalProperty.pid,

    title,

    typesText,
    subtypesText,
    addressText: parsedAddress,
    tenureText,
    sizeText,
    landText,

    types: parsedTypes.types,
    subtypes: parsedTypes.subtypes,
    firstSubtype: parsedTypes.subtypes[0]?.label || '',
    tenure: parsedTenure,
    size: parsedSize,
    content: parsedContent,
    pictures: parsedPictures,
    companies: parsedCompanies,
    agents,
    dealing_agents: dealingAgents,

    thumbnail: parsedPictures.thumbs[0] || null,
    statusText: PROPERTY_STATUS_NAMES?.[status] || 'Unknown',
    statusColor: PROPERTY_STATUS_COLORS?.[status] || 'gray',

    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,

    original: originalProperty,
  };

  if (!omitUserContext) {
    Object.assign(result, {
      isSharedContact,
      grade: originalProperty.grade ?? null,
      grade_advertiser_id: originalProperty.grade_advertiser_id ?? null,
      grade_advertiser_name: originalProperty.grade_advertiser_name ?? null,
      grade_updated_at: originalProperty.grade_updated_at ?? null,
      shortlist_ids: Array.isArray(originalProperty.shortlist_ids) ? originalProperty.shortlist_ids : [],
      shared_by_agent_nid: originalProperty.shared_by_agent_nid ?? null,
      shared_by_agent_name: originalProperty.shared_by_agent_name ?? null,
      shared_by_agent_picture: originalProperty.shared_by_agent_picture ?? null,
      shared_at: originalProperty.shared_at ?? null,
      share_conversation_id: originalProperty.share_conversation_id ?? null,
      has_unread_share: Boolean(originalProperty.has_unread_share),
      hasEnquiry: Boolean(originalProperty.hasEnquiry || originalProperty.has_enquiry),
      hasUnread: Boolean(originalProperty.hasUnread || originalProperty.has_unread),
    });
  } else {
    for (const key of USER_CONTEXT_KEYS) {
      if (key in result) delete result[key];
    }
    delete result.types;
    delete result.subtypes;
    result.content = { teaser: parsedContent.teaser ?? '' };
  }

  return result;
}
