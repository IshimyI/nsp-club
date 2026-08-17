export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);
}

export function csvEscape(value) {
  let s = String(value ?? "");
  // Formula/CSV injection guard: a cell starting with =, +, -, @, or a tab
  // can be interpreted as a formula by Excel/Sheets when the CSV is
  // opened — this data comes straight from the public, unauthenticated
  // order form, so it has to be neutralized before an admin ever opens
  // the export. Prefixing with a straight quote is the standard mitigation.
  if (/^[=+\-@\t]/.test(s)) {
    s = `'${s}`;
  }
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
