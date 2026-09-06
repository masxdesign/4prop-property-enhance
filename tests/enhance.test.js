import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import enhancePropertyData, { parsePropertyAddressLine } from '../src/index.js';

const propertyTypes = [
  {
    id: 2,
    label: 'Office',
    alias: '',
    alias_: '',
    subtypes: [{ id: 10, label: 'Suite', alias: '', parentId: 2 }],
  },
];

const rawProperty = {
  pid: 190910125929,
  hideidentity: 0,
  centreestate: '',
  buildingnumber: '1',
  building: 'Test House',
  streetnumber: '',
  street: 'High Street',
  towncity: 'London',
  suburblocality: '',
  matchpostcode: 'SW1A 1AA',
  types: '2',
  pstids: '10',
  sizeunit: 0,
  sizemin: 1000,
  sizemax: 2000,
  sizeunitexternal: 0,
  minexternal: 0,
  maxexternal: 0,
  tenure: 1,
  price: 0,
  rent: 50000,
  rentperiod: '1',
  minintsqft: 0,
  maxintsqft: 0,
  pricemin: 0,
  pricemax: 0,
  rentmin: 0,
  rentmax: 0,
  description: '',
  locationdesc: '',
  amenities: '',
  images: '',
  cids: ',1,',
  dids: '',
  status: 0,
  dealswith: '123',
  latitude: '51.5',
  longitude: '-0.1',
};

describe('enhancePropertyData', () => {
  it('produces address and tenure text', () => {
    const enhanced = enhancePropertyData(rawProperty, propertyTypes, [], [], {
      omitUserContext: true,
    });
    assert.ok(enhanced);
    assert.match(enhanced.addressText, /High Street/);
    assert.equal(enhanced.typesText, 'Office');
    assert.ok(enhanced.tenureText.includes('£'));
    assert.equal(enhanced.grade, undefined);
    assert.equal(enhanced.hasEnquiry, undefined);
    assert.equal(enhanced.isSharedContact, undefined);
    assert.equal(enhanced.types, undefined);
    assert.equal(enhanced.subtypes, undefined);
    assert.deepEqual(enhanced.content, { teaser: '' });
    assert.equal(enhanced.content.description, undefined);
  });

  it('parsePropertyAddressLine matches enhance addressText', () => {
    const line = parsePropertyAddressLine(rawProperty);
    const enhanced = enhancePropertyData(rawProperty, propertyTypes, [], [], {
      omitUserContext: true,
    });
    assert.equal(enhanced.addressText, line);
  });

  it('uses propertyPhotosBaseUrl for picture URLs', () => {
    const withImages = {
      ...rawProperty,
      images: 'name|t.jpg||id|thumb|storage123*',
    };
    const enhanced = enhancePropertyData(withImages, propertyTypes, [], [], {
      omitUserContext: true,
      propertyPhotosBaseUrl: 'https://each.co.uk',
    });
    assert.ok(enhanced.thumbnail.startsWith('https://each.co.uk/JSON/NIDs/'));
    assert.ok(enhanced.pictures.previews[0].startsWith('https://each.co.uk/JSON/NIDs/'));
  });
});
