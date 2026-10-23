import {reviewedImport,applyReviewedImport} from './table-import.mjs';
export function mountOcrInput(applyRows) {
  const $=id=>document.getElementById(id);
  let review=null, busy=false, previewUrl=null;
  const reset=()=>{review=null;$('ocr-apply').disabled=true;$('ocr-preview').textContent='';};
  $('ocr-text').addEventListener('input',reset);
  $('ocr-file').addEventListener('change',()=>{
    reset();$('ocr-text').value='';$('ocr-status').textContent='';
    if(previewUrl)URL.revokeObjectURL(previewUrl);
    previewUrl=null;$('ocr-image').hidden=true;$('ocr-image').removeAttribute('src');
    const file=$('ocr-file').files[0];
    if(file&&['image/png','image/jpeg','image/webp'].includes(file.type)&&file.size<=5*1024*1024){
      previewUrl=URL.createObjectURL(file);$('ocr-image').src=previewUrl;$('ocr-image').hidden=false;
    }
  });
  $('ocr-review').addEventListener('click',()=>{
    reset();
    try {review=reviewedImport($('ocr-text').value);$('ocr-preview').textContent=review.rows.map(r=>`${r.group}: ${r.before_success}/${r.before_total} → ${r.after_success}/${r.after_total}`).join('\n');$('ocr-apply').disabled=false;$('ocr-status').textContent='Check every label and count against the image, then apply.';}
    catch(e){$('ocr-status').textContent=e.message;}
  });
  $('ocr-apply').addEventListener('click',()=>{
    try {applyRows(applyReviewedImport(review,$('ocr-text').value));reset();$('ocr-status').textContent='Counts applied. Select Analyze change to calculate a new audit.';}
    catch(e){reset();$('ocr-status').textContent=e.message;}
  });
  $('ocr-run').addEventListener('click',async()=>{
    if(busy)return;
    const file=$('ocr-file').files[0];
    if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){$('ocr-status').textContent='Choose a PNG, JPEG or WebP image up to 5 MB.';return;}
    busy=true;reset();$('ocr-run').disabled=true;$('ocr-review').disabled=true;$('ocr-text').disabled=true;$('ocr-file').disabled=true;
    let worker,bitmap;
    try {
      bitmap=await createImageBitmap(file);
      if(bitmap.width*bitmap.height>10000000||Math.max(bitmap.width,bitmap.height)>4096)throw new Error('Use an image up to 10 megapixels and 4096 pixels per side.');
      const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d').drawImage(bitmap,0,0);
      $('ocr-status').textContent='Loading the OCR runtime and English model. The image stays in this browser.';
      const {default:{createWorker}}=await import('https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.esm.min.js');
      worker=await createWorker('eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0',langPath:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int',logger:m=>{$('ocr-status').textContent=`OCR: ${m.status}${typeof m.progress==='number'?' '+Math.round(m.progress*100)+'%':''}`;}});
      const {data}=await worker.recognize(canvas);
      $('ocr-text').value=data.text;
      $('ocr-status').textContent='Recognition complete. Correct the text, review the rows, then apply. Recognition is not data verification.';
    }catch(e){$('ocr-status').textContent=`Could not read image: ${e.message}. You can enter the table text manually.`;}
    finally{bitmap?.close();try{await worker?.terminate();}finally{busy=false;$('ocr-run').disabled=false;$('ocr-review').disabled=false;$('ocr-text').disabled=false;$('ocr-file').disabled=false;}}
  });
}
