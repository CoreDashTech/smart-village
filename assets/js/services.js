import {S,save} from './store.js';
import {ic,ACT,head,pill,form,ask,toast,refresh,empty} from './ui.js';
import {esc,uid,ymd,DAY,fDate,fDT,startOfDay,ym,ymAdd,ymLabelFull,monthName} from './util.js';
import {GZ} from './overview.js';
export const title='รถขยะ & งานส่วนกลาง';
const DW=['จ.','อ.','พ.','พฤ.','ศ.','ส.','อา.'],wi=d=>(new Date(d).getDay()+6)%7;
let cm=null;
const cats=['งานประจำ','ความปลอดภัย','สระ/ฟิตเนส','ซ่อมบำรุง','อื่นๆ'];
const done=(date,z)=>S.pickups.find(p=>p.date===date&&p.zone===z&&p.doneAt);
export function render(){const m=cm||(cm=ym(Date.now())),[y,mo]=m.split('-').map(Number),first=new Date(y,mo-1,1),nd=new Date(y,mo,0).getDate(),off=wi(first),today=ymd(Date.now()),zs=Object.keys(S.settings.zones);
  const cells=[...Array(off)].map(()=>'<div class="cd no"></div>');
  for(let d=1;d<=nd;d++){const dt=new Date(y,mo-1,d),ds=ymd(dt),ev=S.jobs.filter(j=>j.next===ds),g=zs.map(z=>[z,S.settings.garb[z][wi(dt)]]).filter(x=>x[1]);
    cells.push(`<div class="cd${ev.length?' ev':''}${ds===today?' td':''}"><b>${d}</b>${g.length?`<small class="mut">🗑 ${g.map(x=>x[0]+(x[1]===2?'♻':'')).join(' ')}</small>`:''}${ev.slice(0,2).map(j=>`<span>${esc(j.name.slice(0,14))}</span>`).join('')}</div>`)}
  const jobs=[...S.jobs].sort((a,b)=>a.next<b.next?-1:1);
  return`${head('ตารางรถขยะ & งานส่วนกลาง','รอบเก็บขยะรายโซน · งานประจำของนิติบุคคล',`<button class="btn pri" data-act="jobNew">${ic('plus')} เพิ่มงาน</button>`)}
  <div class="card"><h2 class="h2">รอบเก็บขยะประจำสัปดาห์</h2><div class="tbw"><table class="tb" style="min-width:520px"><thead><tr><th>โซน</th>${DW.map(d=>`<th class="c">${d}</th>`).join('')}<th></th></tr></thead><tbody>${zs.map(z=>`<tr><td><b>${z}</b><div class="mut" style="font-size:.78rem">${esc(S.settings.zones[z])}</div></td>${S.settings.garb[z].map((t,i)=>`<td class="c"><button class="chip${t?' on':''}" style="min-width:34px" data-act="gbTog" data-z="${z}" data-i="${i}" title="กดเพื่อเปลี่ยน">${t===1?'🗑':t===2?'♻':'–'}</button></td>`).join('')}<td class="r">${done(today,z)?pill('วันนี้เก็บแล้ว','ok'):S.settings.garb[z][wi(Date.now())]?`<button class="btn sm" data-act="gbDone" data-z="${z}">บันทึกเก็บแล้ว</button>`:''}</td></tr>`).join('')}</tbody></table></div><div class="mut" style="font-size:.8rem;margin-top:8px">🗑 ขยะทั่วไป · ♻ รีไซเคิล · กดช่องเพื่อสลับ (ว่าง → ทั่วไป → รีไซเคิล)</div></div>
  <div class="g g2"><div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h2 class="h2" style="margin:0">${monthName(mo-1,true)} ${y+543}</h2><span class="row"><button class="btn sm" data-act="svM" data-v="-1">‹</button><button class="btn sm" data-act="svM" data-v="1">›</button></span></div>
  <div class="cal" style="margin-bottom:6px">${DW.map(d=>`<div class="mut c" style="font-size:.75rem">${d}</div>`).join('')}</div><div class="cal">${cells.join('')}</div></div>
  <div class="card"><h2 class="h2">งานส่วนกลาง (${jobs.length})</h2>${jobs.length?jobs.map(j=>{const n=Math.round((new Date(j.next+'T00:00')-startOfDay(Date.now()))/DAY);return`<div class="ln"><span><b>${esc(j.name)}</b><div class="mut" style="font-size:.8rem">${esc(j.freq)} · ${esc(j.owner)} · ถัดไป ${fDate(new Date(j.next+'T00:00'))} ${n<0?pill('เลยกำหนด','bd'):n===0?pill('วันนี้','wn'):''}</div></span><span class="row"><button class="btn sm" data-act="jobDone" data-id="${j.id}">เสร็จ</button><button class="btn sm" data-act="jobEdit" data-id="${j.id}">${ic('edit')}</button><button class="btn sm bad" data-act="jobDel" data-id="${j.id}">${ic('trash')}</button></span></div>`}).join(''):empty('ยังไม่มีงาน')}</div></div>`}
const fields=j=>[{k:'name',label:'ชื่องาน',value:j?.name||'',full:true},{k:'freq',label:'ความถี่ / เวลา',value:j?.freq||'',ph:'เช่น ทุกจันทร์ 09:00'},{k:'owner',label:'ผู้รับผิดชอบ',value:j?.owner||''},{k:'next',label:'ครั้งถัดไป',type:'date',value:j?.next||ymd(Date.now())},{k:'cat',label:'หมวด',type:'select',opts:cats,value:j?.cat||cats[0]}];
const step=(f)=>{const t=f.toLowerCase(),m=f.match(/ทุก\s*(\d+)\s*วัน/);if(m)return +m[1];if(/รายสัปดาห์|ทุกสัปดาห์|ทุก(จันทร์|อังคาร|พุธ|พฤหัส|ศุกร์|เสาร์|อาทิตย์)/.test(f))return 7;if(/รายเดือน|ทุกเดือน/.test(f))return 30;if(/รายไตรมาส/.test(f))return 91;if(/รายปี|ทุกปี/.test(f))return 365;return 0};
ACT.svM=el=>{cm=ymAdd(cm,+el.dataset.v);refresh()};
ACT.gbTog=el=>{const a=S.settings.garb[el.dataset.z],i=+el.dataset.i;a[i]=(a[i]+1)%3;save();refresh()};
ACT.gbDone=el=>{const z=el.dataset.z,d=ymd(Date.now());S.pickups.push({id:uid('k'),date:d,zone:z,doneAt:Date.now()});save();toast('บันทึกแล้ว: โซน '+z+' เก็บเรียบร้อย');refresh()};
ACT.jobNew=async()=>{const r=await form('เพิ่มงานส่วนกลาง',fields());if(!r||!r.name)return;S.jobs.push({id:uid('j'),name:r.name,freq:r.freq,owner:r.owner,next:r.next,cat:r.cat});save();refresh()};
ACT.jobEdit=async el=>{const j=S.jobs.find(x=>x.id===el.dataset.id);if(!j)return;const r=await form('แก้ไขงาน',fields(j));if(!r||!r.name)return;Object.assign(j,r);save();refresh()};
ACT.jobDel=async el=>{if(!await ask('ลบงาน','ต้องการลบงานนี้หรือไม่','ลบ','bad'))return;S.jobs=S.jobs.filter(x=>x.id!==el.dataset.id);save();refresh()};
ACT.jobDone=el=>{const j=S.jobs.find(x=>x.id===el.dataset.id);if(!j)return;const n=step(j.freq);if(n){j.next=ymd(new Date(j.next+'T00:00').getTime()+n*DAY);toast('เสร็จแล้ว · นัดครั้งถัดไป '+fDate(new Date(j.next+'T00:00')))}else{S.jobs=S.jobs.filter(x=>x.id!==j.id);toast('เสร็จแล้ว · นำออกจากรายการ')}save();refresh()};
