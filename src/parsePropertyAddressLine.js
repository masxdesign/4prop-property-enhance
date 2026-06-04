import { escapetext } from './escapetext.js';

const hasValue = (value) => value != null && value !== '';

export const PROPERTY_ADDRESS_UNAVAILABLE = 'Address unavailable';

/**
 * @param {object | null | undefined} property
 * @param {{ showMore?: boolean, showBuilding?: boolean, showPostcode?: boolean }} [options]
 * @returns {string}
 */
export function parsePropertyAddressLine(
  property,
  { showMore = true, showBuilding = true, showPostcode = true } = {},
) {
  if (!property || typeof property !== 'object') return PROPERTY_ADDRESS_UNAVAILABLE;
  const {
    hideidentity = 0,
    centreestate = '',
    buildingnumber = '',
    building = '',
    streetnumber = '',
    street = '',
    towncity = '',
    suburblocality = '',
    matchpostcode = '',
  } = property;
  const hasStreet = hasValue(street) && (hideidentity & 2) === 0;
  let title = '';

  try {
    if (showMore && showBuilding) {
      const hasBuildingNumber = hasValue(buildingnumber) && (hideidentity & 128) === 0;
      const hasBuilding = hasValue(building) && (hideidentity & 64) === 0;
      if (hasBuildingNumber) title += buildingnumber + (hasBuilding ? ' ' : ', ');
      if (hasBuilding) title += `${building}, `;
    }
    if ((hideidentity & 32) < 1 && hasValue(centreestate)) title += `${centreestate}, `;
    if (showMore && (hideidentity & 4) < 1 && hasValue(streetnumber)) {
      title += streetnumber + (hasStreet ? ' ' : ', ');
    }
    if (hasStreet) title += `${street}, `;
    if (hasValue(suburblocality)) title += `${suburblocality}, `;
    if (hasValue(towncity)) title += `${towncity}, `;
    if (showPostcode && hasValue(matchpostcode)) title += matchpostcode;
    return escapetext(title.trim().replace(/,$/, '')) || PROPERTY_ADDRESS_UNAVAILABLE;
  } catch {
    return PROPERTY_ADDRESS_UNAVAILABLE;
  }
}
