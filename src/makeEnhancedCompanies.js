const getCompanyLogoPath = (sourcePath, type = '', identifier = '', baseUrl = '') => {
  if (!sourcePath) return null;

  const parseSourcePath = (path) => {
    const [queryPart] = path.split('?');
    if (!queryPart) return null;

    const parts = queryPart.split('~');
    if (parts.length === 0) return null;

    const [pathComponent, , extension = 'jpg'] = parts;
    return { pathComponent, extension };
  };

  const extractPathInfo = (pathComponent, typePrefix, id) => {
    const domainParts = pathComponent.split('d');
    const hasDomain = domainParts.length > 1;

    if (hasDomain) {
      const [domain, path] = domainParts;
      return { domain, path };
    }
    return { domain: `${typePrefix}${id}`, path: pathComponent };
  };

  const parsedPath = parseSourcePath(sourcePath);
  if (!parsedPath) return null;

  const { pathComponent, extension } = parsedPath;
  const { domain, path } = extractPathInfo(pathComponent, type, identifier);

  return (size) => `${baseUrl}/JSON/NIDs/DIDs/${domain}/${path}/${size}.${extension}`;
};

const getBrandLogoPaths = (company, baseUrl = '') => {
  if (!company) return null;

  const brandTypes = [
    { key: 'a', sizeIndex: '', domainKey: 'd' },
    { key: 'p', sizeIndex: 1, domainKey: 'b' },
    { key: 's', sizeIndex: 2, domainKey: 'c' },
  ];

  const availableBrand = brandTypes.find(({ key }) => company[key]);

  if (!availableBrand) {
    return { original: '', default: '', thumb: '' };
  }

  const { key, sizeIndex, domainKey } = availableBrand;
  const logoPathGenerator = getCompanyLogoPath(
    company[key],
    sizeIndex,
    company[domainKey],
    // DEFAULTS to relative (same-origin): property-pub serves /JSON/NIDs on every
    // advertiser host, so logos load from whatever host the page is on rather
    // than pinning every advertiser site to www.4prop.com being reachable.
    //
    // Overridable because logos live on the SAME share as property photos — a
    // deployment where that share is absent (local dev has no `json` mount) must
    // be able to point both at an absolute host, or logos 404 while photos load.
    baseUrl,
  );

  if (!logoPathGenerator) {
    return { original: '', default: '', thumb: '' };
  }

  return {
    original: logoPathGenerator(1) || '',
    default: logoPathGenerator(3) || '',
    thumb: logoPathGenerator(2) || '',
  };
};

const transformCompany = (company, baseUrl = '') => {
  if (!company) return null;

  const logoUrls = getBrandLogoPaths(company, baseUrl);

  return {
    cid: company.c,
    bid: company.b,
    // The department behind `branch`/`department` below. Exposed so a consumer
    // can scope a link to this office (/company/:cid?did=…) instead of the whole
    // company — the backend already selects it as `d`.
    did: company.d,
    branch: company.branch,
    department: company.department,
    logoThumb: logoUrls.thumb,
    logo: logoUrls.default,
    logoOriginal: logoUrls.original,
    name: company.name,
    phone: company.phone,
    original: company,
  };
};

/**
 * @param {object|object[]} input
 * @param {string} [baseUrl]  host for the /JSON/NIDs logo URLs. Empty (default)
 *   means RELATIVE/same-origin. See getBrandLogoPaths for why this is overridable.
 */
export default function makeEnhancedCompanies(input, baseUrl = '') {
  if (!input) return null;

  if (Array.isArray(input)) {
    // Arrow, not a bare reference: `map` passes (item, INDEX, array), so
    // `.map(transformCompany)` would hand the index in as baseUrl and every logo
    // URL after the first would be prefixed with a number.
    return input.map((company) => transformCompany(company, baseUrl)).filter(Boolean);
  }

  return transformCompany(input, baseUrl);
}
