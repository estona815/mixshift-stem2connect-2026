import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCountTable,reviewedImport,applyReviewedImport} from './table-import.mjs';
import {analyze,exact} from './engine.mjs';
const text='Returning 90 100 19 20\nFirst-time 1 10 12 80';
test('reviewed OCR counts retain exact decomposition identity',()=>{
 const rows=applyReviewedImport(reviewedImport(text),text);
 assert.equal(exact(analyze(rows).residual),'0/1');
 assert.equal(rows[1].after_total,80);
});
test('headers, tabs, commas and CRLF are accepted without number guessing',()=>{
 assert.equal(parseCountTable('group,before_success,before_total,after_success,after_total\r\nA,1,2,2,3\r\nB\t2\t3\t3\t4').length,2);
});
test('OCR ambiguity and invalid count domains are rejected',()=>{
 for(const bad of ['9O','1e2','-1','10%','1.0','1/2','1000001'])
  assert.throws(()=>parseCountTable(text.replace('90',bad)),bad);
 for(const bad of ['A 2 1 1 2\nB 1 2 1 2','A 0 0 1 2\nB 1 2 1 2','A 1 2 1 2\na 1 2 1 2','A 1 2 1\nB 1 2 1 2'])
  assert.throws(()=>parseCountTable(bad));
});
test('text changes or tampered review cannot be applied',()=>{
 const review=reviewedImport(text);
 assert.throws(()=>applyReviewedImport(review,text.replace('90','89')));
 assert.throws(()=>applyReviewedImport({...review,rows:[]},text));
 assert.throws(()=>applyReviewedImport(null,text));
});
test('oversized input and markup labels fail before analysis',()=>{
 assert.throws(()=>parseCountTable('a'.repeat(16001)));
 assert.throws(()=>parseCountTable('<img> 1 2 1 2\nB 1 2 1 2'));
 assert.throws(()=>parseCountTable(text+'\u0000'));
});
