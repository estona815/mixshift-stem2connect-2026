// Exact two-factor symmetric rate decomposition. No input execution or I/O.
const abs = n => n < 0n ? -n : n;
const gcd = (a, b) => { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a || 1n; };
export function fraction(n, d = 1n) {
  n = BigInt(n); d = BigInt(d);
  if (!d) throw new Error('Undefined fraction: denominator is zero.');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d); return Object.freeze({n: n / g, d: d / g});
}
export const add = (a, b) => fraction(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => fraction(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => fraction(a.n * b.n, a.d * b.d);
export const exact = a => `${a.n}/${a.d}`;
export const numeric = a => Number(a.n) / Number(a.d);
const zero = fraction(0), half = fraction(1, 2);
const sum = values => values.reduce(add, zero);
export const EXAMPLE = Object.freeze([
  Object.freeze({group:'Returning', before_success:'90', before_total:'100', after_success:'19', after_total:'20'}),
  Object.freeze({group:'First-time', before_success:'1', before_total:'10', after_success:'12', after_total:'80'})
]);
function fail(message, row = null, field = null) {
  const e = new Error(message); e.row = row; e.field = field; throw e;
}
export function validate(rows) {
  if (!Array.isArray(rows) || rows.length < 2 || rows.length > 12) fail('Use 2–12 matched groups.');
  const names = new Set();
  const parsed = rows.map((row, index) => {
    if (!row || typeof row !== 'object' || typeof row.group !== 'string') fail('Enter a group name.', index, 'group');
    const group = row.group.trim();
    if (!group || group.length > 40 || /[\u0000-\u001f\u007f]/u.test(group)
        || [...group].some(c => { const n = c.codePointAt(0); return n >= 0xd800 && n <= 0xdfff; }))
      fail('Group names need 1–40 valid characters; no control characters.', index, 'group');
    const key = group.normalize('NFKC').toLowerCase();
    if (names.has(key)) fail('Group names must be unique after normalization.', index, 'group');
    names.add(key);
    const result = {group};
    for (const field of ['before_success','before_total','after_success','after_total']) {
      const raw = row[field];
      if (!['string','number'].includes(typeof raw) || !/^\d{1,7}$/.test(String(raw)))
        fail('Use whole-number counts, without signs or decimals.', index, field);
      const value = Number(raw);
      if (!Number.isSafeInteger(value) || value > 1000000) fail('Counts cannot exceed 1,000,000.', index, field);
      result[field] = value;
    }
    for (const period of ['before','after']) {
      if (!result[period+'_total']) fail('A zero total gives an undefined rate; provide matched positive totals.', index, period+'_total');
      if (result[period+'_success'] > result[period+'_total']) fail('Successes cannot exceed the total.', index, period+'_success');
    }
    return result;
  });
  for (const period of ['before','after'])
    if (parsed.reduce((n, row) => n + row[period+'_total'], 0) > 1000000)
      fail('Combined totals must be at most 1,000,000 per period.');
  return parsed;
}
export function analyze(input) {
  const rows = validate(input);
  const totals = p => rows.reduce((n, r) => n + r[p+'_total'], 0);
  const n0 = totals('before'), n1 = totals('after');
  const groups = rows.map(r => {
    const w0 = fraction(r.before_total,n0), w1 = fraction(r.after_total,n1);
    const r0 = fraction(r.before_success,r.before_total), r1 = fraction(r.after_success,r.after_total);
    return {...r, w0, w1, r0, r1,
      within:mul(mul(half,add(w0,w1)),sub(r1,r0)),
      mix:mul(mul(half,add(r0,r1)),sub(w1,w0))};
  });
  const r00 = sum(groups.map(g => mul(g.w0,g.r0)));
  const r01 = sum(groups.map(g => mul(g.w0,g.r1)));
  const r10 = sum(groups.map(g => mul(g.w1,g.r0)));
  const r11 = sum(groups.map(g => mul(g.w1,g.r1)));
  const within = sum(groups.map(g => g.within)), mix = sum(groups.map(g => g.mix));
  const headline = sub(r11,r00), residual = sub(headline,add(within,mix));
  if (residual.n !== 0n) throw new Error('Internal decomposition identity failed.');
  const changes = groups.map(g => sub(g.r1,g.r0).n);
  const reversal = changes.every(n => n > 0n) && headline.n < 0n ? 'all_rise_aggregate_falls'
    : changes.every(n => n < 0n) && headline.n > 0n ? 'all_fall_aggregate_rises' : null;
  return {groups, r00,r01,r10,r11,within,mix,headline,residual,reversal};
}
export function audit(result) {
  const vector = o => Object.fromEntries(Object.entries(o).map(([k,v]) => [k,exact(v)]));
  return {schema:'mixshift/audit-v1', model:'two-factor symmetric arithmetic decomposition',
    raw_counts:result.groups.map(({group,before_success,before_total,after_success,after_total}) => ({group,before_success,before_total,after_success,after_total})),
    exact_rates_and_contributions:vector(Object.fromEntries(['r00','r01','r10','r11','within','mix','headline','residual'].map(k => [k,result[k]]))),
    groups:result.groups.map(g => ({group:g.group,...vector(Object.fromEntries(['w0','w1','r0','r1','within','mix'].map(k => [k,g[k]])))})),
    reversal:result.reversal, identity_verified:result.residual.n === 0n,
    assumptions:['Matched group definitions across periods','Positive denominators','Counts and group definitions supplied by the user; not independently verified'],
    causal_claim:false, significance_test:false, uncertainty_interval:false,
    limits:'Descriptive arithmetic only. No claim that all confounders are measured. Review group labels and counts before sharing; the export contains all inputs.'};
}
