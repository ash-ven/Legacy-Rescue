// CSV secondo l'RFC 4180: un campo con virgole, virgolette o a capo va tra virgolette,
// e le virgolette interne si raddoppiano.
function toCsvField(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const toCsvRow = (values) => values.map(toCsvField).join(',');

module.exports = { toCsvField, toCsvRow };
