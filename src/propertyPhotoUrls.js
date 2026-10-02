export const DEFAULT_PROPERTY_PHOTOS_BASE_URL = 'https://www.4prop.com';

/**
 * Strip trailing slashes; fall back to the production 4prop host when unset.
 *
 * `null`/`undefined` means "not configured" -> the 4prop default, which keeps every
 * existing caller working. An explicit EMPTY STRING is different: it means
 * "same-origin, emit a RELATIVE /JSON/... URL", which is what property-pub's SPA
 * asks for now that property-pub serves /JSON/NIDs on every advertiser host. Without
 * that distinction there is no way to request relative URLs at all — empty collapsed
 * back to the absolute 4prop host.
 */
export function normalizePropertyPhotosBaseUrl(baseUrl) {
  if (baseUrl === '') return '';
  const raw = (baseUrl ?? '').trim();
  if (!raw) return DEFAULT_PROPERTY_PHOTOS_BASE_URL;
  return raw.replace(/\/+$/, '');
}

/**
 * Build filename for a property image size variant.
 * @param {string} rawExt - e.g. "t.jpg" or "jpg"
 * @param {string|number} sizePrefix - e.g. "t", 3, 0
 */
export function buildPropertyImageFilename(rawExt, sizePrefix) {
  if (!rawExt) return null;
  if (!rawExt.includes('.')) return `${sizePrefix}.${rawExt}`;
  const extension = rawExt.slice(rawExt.indexOf('.'));
  return `${sizePrefix}${extension}`;
}

/**
 * Build a full property photo URL from one pipe-delimited `images` record.
 * @param {string[]} parts - split of one image record (length >= 6)
 * @param {string|number} sizePrefix
 * @param {string} [baseUrl]
 */
export function buildPropertyPhotoUrlFromParts(parts, sizePrefix, baseUrl) {
  if (!parts || parts.length < 6) return null;
  const ext = buildPropertyImageFilename(parts[1], sizePrefix);
  if (!ext) return null;
  const name = parts[0] !== '' ? parts[0] : parts[3];
  const host = normalizePropertyPhotosBaseUrl(baseUrl);
  return `${host}/JSON/NIDs/${parts[5]}/${name}/${ext}`;
}

/**
 * Parse the raw `images` column into preview/thumb/full URL arrays.
 * @param {string} images
 * @param {string} [baseUrl]
 */
export function parsePropertyPictures(images, baseUrl) {
  if (!images || typeof images !== 'string') {
    return { count: 0, previews: [], thumbs: [], full: [], captions: [] };
  }
  try {
    const builders = [];
    const captions = [];
    images.split('*').forEach((image) => {
      if (image === '') return;
      const im = image.split('|');
      if (im.length < 6) return;
      const z = (x) => buildPropertyImageFilename(im[1], x);
      builders.push((x) => {
        const ext = z(x);
        if (!ext) return null;
        const name = im[0] !== '' ? im[0] : im[3];
        const host = normalizePropertyPhotosBaseUrl(baseUrl);
        return `${host}/JSON/NIDs/${im[5]}/${name}/${ext}`;
      });
      captions.push(im[2] || '');
    });
    const render = (x) => builders.map((k) => k(x)).filter(Boolean);
    return {
      count: builders.length,
      previews: render(3),
      thumbs: render('t'),
      full: render(0),
      captions,
    };
  } catch {
    return { count: 0, previews: [], thumbs: [], full: [], captions: [] };
  }
}
