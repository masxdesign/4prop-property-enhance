/**
 * Singular label for every 4prop subtype, for the property detail page's heading
 * ("Shop for rent in Bermondsey, SE1", not "Shops for rent …"). See
 * buildPropertyHeadline.js.
 *
 * WHY A MAP. 4prop's subtype labels (`4prop/code/seo/variables/subtypes.json`,
 * column 1) are written as category names, mostly plural ("Shops", "Bars/Pubs",
 * "Light Industrial units"). A rule that strips an "s" gets real labels wrong
 * ("Sporting Rights", "Watersports", "Theatres & Cinemas"), so each one is
 * spelled out here. Only the HEADING uses this: filters, listing pages and SEO
 * slugs keep the catalog label untouched.
 *
 * ⚠ ADDING OR RENAMING A SUBTYPE IN subtypes.json? Add / update its line here.
 *   `npm test` in this package checks every subtype in the 4prop catalog has an
 *   entry and prints the missing ones ready to paste. Until it is added, the
 *   heading falls back to the catalog label as it is (plural), nothing breaks.
 *
 * Keyed by subtype id (string). Entries identical to the catalog label are kept
 * on purpose, so "every id is listed" is the rule the test checks.
 */
export const SUBTYPE_SINGULAR_LABELS = {
  // Rural (1)
  1: 'Arable',
  2: 'Equestrian',
  3: 'Fruit Farm',
  4: 'Livestock',
  5: 'Garden Nursery',
  6: 'Sporting Rights',
  7: 'Vineyard',
  8: 'Woodland',
  101: 'Pasture Land',
  102: 'Amenity Land & Lake',

  // Retail (2)
  9: 'Retail Warehouse',
  10: 'Shop',
  11: 'Showroom',
  12: 'Retail Office',
  13: 'Restaurant',
  14: 'Bar/Pub',
  15: 'Roadside Unit',
  16: 'Garden Centre',
  17: 'Nightclub / Club / Banqueting',
  18: 'Pod / Kiosk / Concession',
  19: 'PopUp opportunity',
  69: 'Take Away',
  90: 'Food Court',
  91: 'Drive-in Restaurant',
  121: 'Travel Retail unit',

  // Hotel (3)
  20: 'Guest House',
  21: 'Hotel',
  22: 'Motel',
  86: 'Hostel',
  88: 'Inn',

  // Industrial (4)
  23: 'Industrial Design & Build',
  24: 'Light Industrial unit',
  25: 'General Industrial unit',
  26: 'Warehouse',
  27: 'Data Centre',
  28: 'Food Production / Chilled storage',
  29: 'Research & Development unit / Laboratory',
  30: 'Media Studio',
  31: 'Open Storage',
  32: 'Railway Arch',
  33: 'Garage',
  72: 'Trade Counter unit',
  87: 'Lock up storage',
  92: 'Distribution unit',
  106: 'Business Unit',
  107: 'Storage',

  // Investment (5)
  34: 'Ground Rent',
  61: 'Student & Buy to Let Property',
  74: 'Office Investment',
  75: 'Retail Investment',
  76: 'Industrial Investment',
  77: 'Mixed Portfolio Investment',
  78: 'Residential Investment',
  79: 'Shopping Centre Investment',
  80: 'Retail Warehouse Investment',
  81: 'Office Portfolio Investment',
  82: 'Industrial Portfolio Investment',
  84: 'Leisure & Hotel Investment',
  85: 'Training & Welfare Investment',
  103: 'Assured Shorthold Tenancy',
  104: 'Regulated Residential Tenancy',

  // Development (6)
  39: 'Land for Excavation',
  67: 'Wind / Solar / Telecom / Billboard site',
  70: 'Development - Residential',
  93: 'Office Development Land',
  94: 'Retail Development Land',
  95: 'Industrial Development Land',
  96: 'Leisure Development Land',
  97: 'Hotel Development Land',
  98: 'Roadside Development Land',
  99: 'Welfare Development Land',
  110: 'Landfill Site',

  // Auto Trade (0)
  40: 'Commercial Car Park',
  41: 'Car Space / Car Storage',
  42: 'Car Wash Property',
  43: 'Car Showroom',
  44: 'Petrol Station / EV Rapid Charge Station',
  45: 'Air / Boat / Track',

  // Leisure (7)
  46: 'Casino',
  47: 'Golf Course',
  48: 'Dance & Gym Club',
  49: 'Sports Club WITH LAND',
  50: 'Theatre / Cinema',
  51: 'Holiday Park / Camping / Fishing',
  52: 'Track Sport venue',
  89: 'Watersports',

  // Office (8)
  53: 'Office',
  55: 'Office with Showroom',
  56: 'Serviced Office',
  57: 'Office Storage',
  71: 'Call Centre',
  83: 'Disaster Recovery',
  108: 'WorkStation / Office Suite',

  // Welfare (9)
  58: 'Hospital',
  59: 'Care Home',
  60: 'Residential Training Centre/ Residential Conference Centre',
  62: 'Church / Community Hall',
  63: 'Day Centre',
  64: 'Museum / Exhibition Hall',
  65: 'Medical Clinic',
  66: 'School / Training Centre',
  100: 'Social Housing',
  109: 'Kennels / Cattery',

  // Residential (11)
  111: 'Flat',
  112: 'Detached House',
  113: 'Semi Detached House',
  114: 'Terraced House',
  115: 'Mews House',
  116: 'Barn Conversion',
  117: 'Apartment',
  118: 'Flat in Commercial',
  119: 'Bungalow',
  120: 'Embassy & Diplomatic Property',

  // Venue for hire (12)
  133: 'Academic venue for hire',
  134: 'Church venue for hire',
  135: 'Country Estate / Club venue for hire',
  136: 'Historic venue for hire',
  137: 'Industrial venue for hire',
  138: 'Medical venue for hire',
  139: 'Museum venue for hire',
  140: 'Office venue for hire',
  141: "Outdoor ' 5* views / artistic venue for hire",
  142: 'Retail venue for hire',
  143: 'Sporting venue for hire',
  144: 'Theatre venue for hire',
  145: 'Waterside venue for hire',

  // Commercial (500), Unspecified (50)
  1000: 'Commercial Property',
  129: 'Unspecified',
};

/**
 * Singular label for a subtype, falling back to its catalog label.
 * @param {{ id?: number|string, label?: string } | null | undefined} subtype
 * @returns {string}
 */
export function singularSubtypeLabel(subtype) {
  if (!subtype) return '';
  return SUBTYPE_SINGULAR_LABELS[String(subtype.id)] || subtype.label || '';
}
