import he from 'he';

function decodeHTMLEntities(text) {
  return he.decode(String(text || ''));
}

/** HTML decode + legacy xR0/xR1 markers (shared with listing address/content parsing). */
export function escapetext(s) {
  const decoded = decodeHTMLEntities(String(s || ''));
  return decoded
    .replace(/xR0/g, '<br/>')
    .replace(/<br>/g, ' <br/>')
    .replace(/xR1/g, "'");
}

/** @param {unknown} value */
export function decodeLegacyPropertyText(value) {
  if (value == null || value === '') return null;
  const decoded = escapetext(String(value)).trim();
  return decoded || null;
}
