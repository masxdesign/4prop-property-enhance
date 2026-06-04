/**
 * @param {Array} typesFullList
 * @param {Array|Object} subtypes
 * @param {Array|null} allowedTypes
 * @param {Array|null} allowedSubtypes
 */
export default function buildPropertyTypes(
  typesFullList,
  subtypes,
  allowedTypes = null,
  allowedSubtypes = null,
) {
  const isPlainObject = (value) =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const buildSubtypeMap = (subs) => {
    if (!subs) return {};
    if (!Array.isArray(subs)) return subs || {};
    return Object.fromEntries(
      subs.map(([id, label, alias, alias2, tid]) => {
        const normalizedAlias =
          alias === '' ? alias2 : (alias2 === '' ? alias : `${alias},${alias2}`);
        return [Number(id), [label, normalizedAlias, tid]];
      }),
    );
  };

  const subtypesIdMap = buildSubtypeMap(subtypes);

  const toNum = (v) => Number(v);
  const normalizeIdArray = (arr) =>
    [...new Set((arr ?? []).map((v) => toNum(v)).filter(Boolean))].filter((n) => !Number.isNaN(n));

  const normalizeAllowed = (arr, key) => {
    if (!arr || arr.length === 0) return [];
    if (isPlainObject(arr[0])) {
      return normalizeIdArray((arr ?? []).map((item) => item?.[key]).filter(Boolean));
    }
    return normalizeIdArray(arr);
  };

  const allowedTypeIds = normalizeIdArray(allowedTypes || []);
  const allowedSubtypeIds = normalizeAllowed(allowedSubtypes || [], 'subtypeId');
  const hasAllowedTypeFilter = allowedTypeIds.length > 0;
  const hasAllowedSubFilter = allowedSubtypeIds.length > 0;

  const allowedIsObjectList = !!(allowedSubtypes && isPlainObject(allowedSubtypes[0]));
  const typeLabelByTypeId = allowedIsObjectList
    ? allowedSubtypes.reduce((acc, it) => {
        const id = toNum(it?.typeId);
        if (!Number.isNaN(id) && it?.label) acc[id] = it.label;
        return acc;
      }, {})
    : {};

  const subtypeLabelById = allowedIsObjectList
    ? allowedSubtypes.reduce((acc, it) => {
        const id = toNum(it?.subtypeId);
        if (!Number.isNaN(id) && it?.label) acc[id] = it.label;
        return acc;
      }, {})
    : {};

  return (typesFullList ?? [])
    .map(([id, label, pstids, alias_, alias]) => {
      const typeId = toNum(id);

      if (hasAllowedTypeFilter && !allowedTypeIds.includes(typeId)) return null;

      const subtypesFullList = String(pstids || '')
        .split('.')
        .filter(Boolean)
        .map(toNum)
        .filter((n) => !Number.isNaN(n));

      const outsideAllowedCount = subtypesFullList.filter((pstid) => !allowedSubtypeIds.includes(pstid)).length;
      const overlapExists =
        hasAllowedSubFilter &&
        subtypesFullList.length > outsideAllowedCount;

      const allowedTypeLabel = typeLabelByTypeId[typeId];
      let typeAlias = alias || '';
      if (allowedTypeLabel) {
        typeAlias += `${typeAlias ? ',' : ''}${label}`;
      }

      return {
        id: typeId,
        label: allowedTypeLabel ?? label,
        alias: typeAlias,
        alias_,
        subtypes: subtypesFullList
          .map((pstid) => {
            if (overlapExists && hasAllowedSubFilter && !allowedSubtypeIds.includes(pstid)) {
              return null;
            }

            const [curr_label, curr_alias] = subtypesIdMap[pstid] || [];
            if (!curr_label) return null;

            const overrideLabel = subtypeLabelById[pstid];
            let aliasVal = curr_alias || '';

            if (
              overrideLabel &&
              overrideLabel.toLowerCase() !== String(curr_label).toLowerCase()
            ) {
              aliasVal += `${aliasVal ? ',' : ''}${curr_label}`;
              aliasVal = aliasVal.replace(/^,+/, '');
            }

            return {
              id: pstid,
              label: overrideLabel ?? curr_label,
              alias: aliasVal,
              parentId: typeId,
            };
          })
          .filter(Boolean),
      };
    })
    .filter(Boolean);
}
