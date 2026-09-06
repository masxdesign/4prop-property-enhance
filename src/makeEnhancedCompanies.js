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

const getBrandLogoPaths = (company) => {
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
    'https://www.4prop.com',
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

const transformCompany = (company) => {
  if (!company) return null;

  const logoUrls = getBrandLogoPaths(company);

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

export default function makeEnhancedCompanies(input) {
  if (!input) return null;

  if (Array.isArray(input)) {
    return input.map(transformCompany).filter(Boolean);
  }

  return transformCompany(input);
}
