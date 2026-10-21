import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,analyze,audit,exact,numeric} from './engine.mjs';
const clone=()=>EXAMPLE.map(r=>({...r}));
const row=(group,a,n,b,m)=>({group,before_success:a,before_total:n,after_success:b,after_total:m});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);

test('synthetic reversal and exact decomposition identity',()=>{
  const r=analyze(EXAMPLE);assert.equal(exact(r.r00),'91/110');assert.equal(exact(r.r11),'31/100');
  assert.equal(exact(r.headline),'-569/1100');assert.equal(exact(r.within),'1/20');
  assert.equal(exact(r.mix),'-156/275');assert.equal(exact(r.residual),'0/1');
  assert.equal(r.reversal,'all_rise_aggregate_falls');
  const report=audit(r);assert.equal(report.causal_claim,false);assert.equal(report.significance_test,false);
  assert.equal(report.uncertainty_interval,false);assert.doesNotThrow(()=>JSON.stringify(report));
});
test('constant shares isolate rate changes; constant rates isolate mix changes',()=>{
  const r=analyze([row('A',1,10,3,10),row('B',8,10,9,10)]);
  assert.equal(exact(r.mix),'0/1');assert.equal(exact(r.headline),'3/20');
  const m=analyze([row('A',1,10,2,20),row('B',8,10,4,5)]);
  assert.equal(exact(m.within),'0/1');assert.equal(m.reversal,null);
});
test('both replacement orders can differ; symmetric split averages them',()=>{
  const r=analyze([row('A',1,2,3,4),row('B',1,4,0,2)]);
  const ratesFirst=numeric(r.r01)-numeric(r.r00),ratesSecond=numeric(r.r11)-numeric(r.r10);
  assert.ok(Math.abs(ratesFirst-ratesSecond)>0.1);assert.equal(exact(r.within),'0/1');
  close(numeric(r.within),(ratesFirst+ratesSecond)/2);
});
test('period exchange negates contributions and group order is invariant',()=>{
  const r=analyze(EXAMPLE),reordered=analyze([...EXAMPLE].reverse());
  const reversed=analyze(EXAMPLE.map(g=>row(g.group,g.after_success,g.after_total,g.before_success,g.before_total)));
  for(const key of ['within','mix','headline']){assert.equal(exact(r[key]),exact(reordered[key]));close(numeric(reversed[key]),-numeric(r[key]));}
  assert.equal(reversed.reversal,'all_fall_aggregate_rises');
});
test('splitting a group into identical-rate parts preserves the split',()=>{
  const r=analyze([row('A',2,4,6,8),row('B',2,8,2,4)]);
  const split=analyze([row('A1',1,2,3,4),row('A2',1,2,3,4),row('B',2,8,2,4)]);
  for(const k of ['within','mix','headline'])assert.equal(exact(r[k]),exact(split[k]));
});
test('ties and zero successes do not invent a reversal',()=>{
  const r=analyze([row('A',0,10,0,20),row('B',0,10,0,2)]);
  assert.equal(exact(r.headline),'0/1');assert.equal(r.reversal,null);
});
test('bad counts, undefined rates, duplicate names and malformed Unicode rejected',()=>{
  for(const value of ['-1','1.2','1e2','Infinity',NaN,Infinity,null,true,' 2','1000001']){
    const rows=clone();rows[0].before_success=value;assert.throws(()=>analyze(rows));
  }
  for(const [field,value] of [['before_total',0],['after_total',0],['before_success',101],['group','\ud800']]){
    const rows=clone();rows[0][field]=value;assert.throws(()=>analyze(rows));
  }
  const rows=clone();rows[1].group=' RETURNING ';assert.throws(()=>analyze(rows));
  const valid=clone();valid[0].group='Lab 🧪';assert.equal(analyze(valid).groups[0].group,'Lab 🧪');
});
test('group and aggregate count boundaries enforced',()=>{
  assert.throws(()=>analyze([EXAMPLE[0]]));assert.throws(()=>analyze(Array.from({length:13},(_,i)=>row('g'+i,0,1,0,1))));
  assert.equal(analyze(Array.from({length:12},(_,i)=>row('g'+i,0,1,0,1))).groups.length,12);
  assert.doesNotThrow(()=>analyze([row('A',999999,999999,999999,999999),row('B',0,1,0,1)]));
  assert.throws(()=>analyze([row('A',1000000,1000000,1,2),row('B',0,1,0,1)]));
});
test('6561 independent numeric two-order profiles agree with exact engine',()=>{
  const states=[];for(let n=1;n<=3;n++)for(let s=0;s<=n;s++)states.push([s,n]);
  const groups=[];for(const [a,n] of states)for(const [b,m] of states)groups.push([a,n,b,m]);
  let cases=0;
  for(const one of groups)for(const two of groups){
    const inputs=[row('A',...one),row('B',...two)],r=analyze(inputs);
    const n0=one[1]+two[1],n1=one[3]+two[3];
    const old=(one[0]+two[0])/n0,now=(one[2]+two[2])/n1;
    const ratesFirst=one[1]/n0*(one[2]/one[3])+two[1]/n0*(two[2]/two[3]);
    const mixFirst=one[3]/n1*(one[0]/one[1])+two[3]/n1*(two[0]/two[1]);
    close(numeric(r.within),((ratesFirst-old)+(now-mixFirst))/2);
    close(numeric(r.mix),((mixFirst-old)+(now-ratesFirst))/2);
    close(numeric(r.headline),now-old);assert.equal(exact(r.residual),'0/1');cases++;
  }
  assert.equal(cases,6561);
});
