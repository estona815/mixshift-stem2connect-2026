// OCR output is untrusted text. Never silently fix letters, percentages or totals.
import {validate} from './engine.mjs';
const header = 'group before_success before_total after_success after_total';
export function parseCountTable(text) {
  if (typeof text !== 'string' || text.length > 16000)
    throw new Error('Use a count table of at most 16,000 characters.');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text))
    throw new Error('Remove unsupported control characters.');
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim());
  const fields = line => line.trim().split(/[\t ,]+/);
  if (lines.length && fields(lines[0]).join(' ').toLowerCase() === header) lines.shift();
  if (lines.length < 2 || lines.length > 12) throw new Error('Use 2–12 rows, one group per line.');
  const rows = lines.map((line, i) => {
    const cells = fields(line);
    if (cells.length !== 5) throw new Error(`Row ${i+1}: use a single-word group label and four whole-number counts.`);
    const [group,before_success,before_total,after_success,after_total] = cells;
    if (!/^[\p{L}\p{N}_-]{1,40}$/u.test(group)) throw new Error(`Row ${i+1}: use letters, digits, hyphens or underscores in the group label.`);
    return {group,before_success,before_total,after_success,after_total};
  });
  return validate(rows).map(row => Object.freeze({...row}));
}

// Editing recognized text invalidates the review, even if it still parses.
// Only an explicit review of the exact current text yields rows for application.
export function reviewedImport(text) {
  const rows = parseCountTable(text);
  return Object.freeze({text, rows: Object.freeze(rows), source:'user-reviewed-table-text'});
}
export function applyReviewedImport(review, currentText) {
  if (!review || review.text !== currentText) throw new Error('Review the current table before applying it.');
  const rows = parseCountTable(currentText);
  if (JSON.stringify(rows) !== JSON.stringify(review.rows)) throw new Error('Reviewed rows changed. Review again.');
  return rows;
}
