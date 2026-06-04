export function number_format(number, decimals, dec_point, thousands_sep) {
  if (number < 1000) return number;
  number = (parseFloat(number) + '').replace(/[^0-9+\-Ee.]/g, '');
  const n = !isFinite(+number) ? 0 : +number;
  const prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
  const sep = typeof thousands_sep === 'undefined' ? ',' : thousands_sep;
  const dec = typeof dec_point === 'undefined' ? '.' : dec_point;
  const toFixedFix = (num, p) => '' + Math.round(num * Math.pow(10, p)) / Math.pow(10, p);
  let s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
  if (s[0].length > 3) s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
  if ((s[1] || '').length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1).join('0');
  }
  return s.join(dec);
}

/**
 * @param {number} amount
 * @param {boolean} [forceDecimals]
 * @returns {string}
 */
export function formatCurrency(amount, forceDecimals = false) {
  const num = parseFloat(amount) || 0;
  const hasDecimals = num % 1 !== 0;

  if (hasDecimals || forceDecimals) {
    if (num < 1000) {
      return num.toFixed(2);
    }
    return number_format(num, 2);
  }
  if (num < 1000) {
    return num.toString();
  }
  return number_format(num, 0);
}
