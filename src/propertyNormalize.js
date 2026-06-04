/**
 * @param {number} tenure
 * @param {string|number} [rentperiod]
 * @returns {string|null}
 */
export function determineTenureText(tenure = 0, rentperiod = '1') {
  const tenureNum = Number(tenure) || 0;
  const rentperiodNum = Number(rentperiod) || 1;

  const hasLeaseTypes = (tenureNum & 1) > 0 || (tenureNum & 2) > 0;
  const hasSaleTypes = (tenureNum & 4) > 0 || (tenureNum & 8) > 0;

  const isRent = hasLeaseTypes && rentperiodNum > 0;
  const isSale = hasSaleTypes || (hasLeaseTypes && rentperiodNum <= 0);

  if (isRent && isSale) {
    return null;
  }
  if (isRent) {
    return 'to Rent';
  }
  if (isSale) {
    return 'for Sale';
  }
  return null;
}

/**
 * @param {object} property
 * @returns {boolean}
 */
export function validatePropertyData(property) {
  if (!property || typeof property !== 'object') {
    return false;
  }
  return property.pid !== undefined && property.pid !== null;
}

/**
 * @param {object} property
 * @returns {object}
 */
export function normalizePropertyData(property) {
  try {
    return Object.fromEntries(
      Object.entries(property).map(([key, value]) => [key.toLowerCase(), value]),
    );
  } catch {
    return property;
  }
}

/**
 * @param {Array} rawPropertiesArray
 * @returns {Array}
 */
export function normalizeProperties(rawPropertiesArray) {
  if (!Array.isArray(rawPropertiesArray) || rawPropertiesArray.length === 0) {
    return [];
  }

  return rawPropertiesArray
    .map((prop) => {
      if (!validatePropertyData(prop)) {
        return null;
      }
      return normalizePropertyData(prop);
    })
    .filter(Boolean);
}
