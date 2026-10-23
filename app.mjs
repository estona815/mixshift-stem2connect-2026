import {mountOcrInput} from './ocr-input.mjs';
import {EXAMPLE,analyze,audit,numeric,exact,sub} from './engine.mjs';
const $ = id => document.getElementById(id);
const fields = ['group','before_success','before_total','after_success','after_total'];
const labels = ['Group','Before success','Before total','After success','After total'];
let result = null;
const text = (tag,value) => { const e=document.createElement(tag); e.textContent=value; return e; };
function labelRows(){[...$('group-rows').children].forEach((tr,index)=>tr.querySelectorAll('input').forEach((input,fieldIndex)=>input.setAttribute('aria-label',`${labels[fieldIndex]}, group ${index+1}`)));}
function clearAnalysis(){
  result=null; $('results').hidden=true; $('export').disabled=true;
  $('audit-panel').hidden=true; $('audit-panel').open=false;
  for(const id of ['orders','identity','group-audit'])$(id).replaceChildren();
}
function invalidate() {
  clearAnalysis();
  $('status').hidden=false; $('status').textContent='Inputs changed. Analyze again to create a current audit.';
  $('example-label').textContent='Local input'; $('headline-title').textContent='A headline is only part of the story.';
  document.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'));
}
function addRow(row={group:'',before_success:'',before_total:'',after_success:'',after_total:''}) {
  const tr=document.createElement('tr');
  fields.forEach((field,index)=>{
    const td=document.createElement('td'), input=document.createElement('input');
    input.type='text'; input.value=String(row[field]); input.dataset.field=field;
    input.setAttribute('aria-label',`${labels[index]}, group ${$('group-rows').children.length+1}`);
    input.maxLength=index===0?40:7; if(index===0)input.className='name'; else input.inputMode='numeric';
    input.addEventListener('input',invalidate); td.append(input); tr.append(td);
  });
  if($('group-rows').children.length>=2){
    const remove=text('button','Remove group'); remove.type='button'; remove.className='remove';
    remove.addEventListener('click',()=>{tr.remove(); labelRows(); invalidate(); $('add').disabled=false;});
    tr.firstElementChild.append(remove);
  }
  $('group-rows').append(tr); labelRows(); $('add').disabled=$('group-rows').children.length>=12;
}
function values(){return [...$('group-rows').children].map(tr=>Object.fromEntries([...tr.querySelectorAll('input')].map(e=>[e.dataset.field,e.value])));}
const pct = f => `${(100*numeric(f)).toFixed(2)}%`;
const pp = f => {const n=100*numeric(f);return `${n>0?'+':n<0?'−':''}${Math.abs(n).toFixed(2)}pp`;};
function signed(id,f){const e=$(id);e.textContent=pp(f);e.className=f.n<0n?'negative':f.n>0n?'positive':'';}
function show(){
  $('before').textContent=pct(result.r00); $('after').textContent=pct(result.r11);
  signed('headline',result.headline); signed('within',result.within); signed('mix',result.mix); signed('total-change',result.headline);
  $('interpretation').textContent=result.reversal==='all_rise_aggregate_falls'?'Both group rates rose; the aggregate fell.':result.reversal==='all_fall_aggregate_rises'?'Every group rate fell; the aggregate rose.':'Inspect both the group rates and their shares before interpreting the headline.';
  if(result.groups.length>2&&result.reversal==='all_rise_aggregate_falls')$('interpretation').textContent='Every group rate rose; the aggregate fell.';
  $('orders').replaceChildren();
  for(const [label,value] of [['Rates first: rate contribution',sub(result.r01,result.r00)],['Rates first: mix contribution',sub(result.r11,result.r01)],['Mix first: mix contribution',sub(result.r10,result.r00)],['Mix first: rate contribution',sub(result.r11,result.r10)]])$('orders').append(text('dt',label),text('dd',`${pp(value)} [${exact(value)} of a proportion]`));
  $('identity').textContent=`${exact(result.within)} + (${exact(result.mix)}) = ${exact(result.headline)}; exact residual ${exact(result.residual)}. Displayed percentage points are rounded.`;
  $('group-audit').replaceChildren();
  result.groups.forEach(g=>{const tr=document.createElement('tr');for(const value of [g.group,pct(g.r0),pct(g.r1),pp(g.within),pp(g.mix)])tr.append(text('td',value));$('group-audit').append(tr);});
  $('results').hidden=false; $('audit-panel').hidden=false; $('export').disabled=false; $('status').hidden=true;
}
function compute(event){
  event?.preventDefault(); clearAnalysis();
  document.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'));
  try{result=analyze(values());show();}
  catch(e){$('status').hidden=false;$('status').textContent=`Cannot analyze: ${e.message}`;
    if(e.row!==null&&e.row!==undefined&&e.field){const input=$('group-rows').children[e.row]?.querySelector(`[data-field="${e.field}"]`);input?.setAttribute('aria-invalid','true');input?.focus();}}
}
function example(){ $('group-rows').replaceChildren(); EXAMPLE.forEach(addRow); $('example-label').textContent='Synthetic example';$('headline-title').textContent='A falling headline. Two rising groups.';compute(); }
$('editor').addEventListener('submit',compute); $('example').addEventListener('click',example);
$('add').addEventListener('click',()=>{if($('group-rows').children.length>=12)return;addRow();invalidate();$('group-rows').lastElementChild.querySelector('input').focus();});
$('export').addEventListener('click',()=>{if(!result)return;const blob=new Blob([JSON.stringify(audit(result),null,2)+'\n'],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mixshift-audit.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
example();

mountOcrInput(rows=>{ $("group-rows").replaceChildren();rows.forEach(addRow);invalidate(); });
