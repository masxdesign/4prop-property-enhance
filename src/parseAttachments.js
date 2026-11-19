/**
 * A property's attachments (the agent's brochure, EPC, floor plans) from EACH's
 * `a_rpPropertyNewAll_p22.Attachments`: entries split by `*`, fields by `|`:
 *   folder | name.ext (or just ext) | label | file id | size KB | owner nid (or 'p') | nid
 *   e.g. `|pdf|`4|231022183734|578|60252*`
 * The label is text, empty ("Brochure N"), or "`<bits>" (4 Brochure, 1 EPC, 2 Floor plan).
 * A port of 4prop PHP `createAttachments()` (seo/functions.php). Used by property-pub
 * (the detail page's files, services/propertyAttachments.js) and bizchat (the info pack
 * automatic reply). Pure: no I/O.
 */

const BIT_LABELS = [[4, 'Brochure'], [1, 'EPC'], [2, 'Floor plan']];

/** @returns {{ label: string, url: string, ext: string, sizeKb: number|null }[]} */
export function parseAttachments(raw) {
  const out = [];
  let brochureN = 1;
  for (const item of String(raw || '').split('*')) {
    const a = item.split('|');
    if (a.length <= 5) continue;
    // `pdf.each.co.uk` (owner 'p') no longer answers: a link there would be dead.
    if (a[5] === 'p') continue;

    let label;
    if (!a[2]) {
      label = `Brochure ${brochureN}`;
      brochureN += 1;
    } else if (a[2].includes('`')) {
      const bits = Number(a[2].split('`')[1]) || 0;
      label = BIT_LABELS.find(([bit]) => (bits & bit) > 0)?.[1] || 'File';
    } else {
      label = a[2].trim();
    }

    const name = a[1] || '';
    const ext = (name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : name).toLowerCase();
    if (!ext || !/^[a-z0-9]{1,5}$/.test(ext)) continue;
    const base = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : '';
    const path = a[0] ? `${a[0]}/${base || '0'}.${ext}` : `${a[3]}.${ext}`;
    // Only safe path characters: the parts come from EACH and end up in an href.
    if (!/^[\w./-]+$/.test(path) || !/^\w+$/.test(a[5])) continue;

    const size = Number.parseInt(a[4], 10);
    out.push({
      label,
      url: `https://www.each.co.uk/f/${a[5]}/p/${path}`,
      ext,
      sizeKb: Number.isFinite(size) && size > 0 ? size : null,
    });
  }
  return out;
}
