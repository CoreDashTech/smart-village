import {S,save,readingCost} from './store.js';
import {ic,ACT,head,pill,form,toast,refresh} from './ui.js';
import {esc,baht,fNum,ym,ymAdd,ymLabel,ymLabelFull,ymStart,sum,uid} from './util.js';
import {bars} from './charts.js';
export const title='น้ำ · ไฟ · ขยะ';
const PT=[['water','w1','สวนและภูมิทัศน์ส่วนกลาง'],['water','w2','สโมสรและสระว่ายน้ำ'],['water','w3','ล้างถนนและถังพักน้ำ'],['water','w4','ป้อมยามและสำนักงาน'],['elec','e1','ไฟถนนและทางเดิน'],['elec','e2','สโมสร สระ ฟิตเนส'],['elec','e3','ปั๊มน้ำ'],['elec','e4','ป้อมยามและกล้อง CCTV']];
let mon=null;
const latest=()=>{const ms=[...new Set(S.readings.map(r=>r.month))].sort();return ms.length?ms[ms.length-1]:ymAdd(ym(Date.now()),-1)};
const rd=(m,p)=>S.readings.find(r=>r.month===m&&r.point===p);
const dl=(a,b)=>b?(a-b)/b*100:0;
const dp=d=>pill((d>0?'+':'')+fNum(d,1)+'%',d>10?'bd':d>3?'wn':d<-1?'ok':'');
export function render(){const m=mon||(mon=latest()),pm=ymAdd(m,-1),months=[...Array(6)].map((_,k)=>ymAdd(m,k-5)),w=readingCost2(m,'water'),e=readingCost2(m,'elec'),wp=readingCost2(pm,'water'),ep=readingCost2(pm,'elec');
  const wU=sum(S.readings.filter(r=>r.month===m&&r.kind==='water'),r=>r.units),eU=sum(S.readings.filter(r=>r.month===m&&r.kind==='elec'),r=>r.units);
  const garbIn=S.houses.length*S.settings.garbageFee,garbOut=sum(S.ledger.filter(l=>l.kind==='out'&&l.cat==='garbage'&&l.ts>=ymStart(m)&&l.ts<ymStart(ymAdd(m,1))),l=>l.amt);
  const alerts=PT.map(([k,p,n])=>{const r=rd(m,p);if(!r)return null;const prev=[1,2,3].map(x=>rd(ymAdd(m,-x),p)).filter(Boolean);if(prev.length<2)return null;const avg=sum(prev,x=>x.units)/prev.length,d=dl(r.units,avg);return d>15?{n,d,u:r.units,avg:Math.round(avg),kind:k}:null}).filter(Boolean);
  const tbl=kind=>`<div class="tbw"><table class="tb" style="min-width:420px"><thead><tr><th>จุดมิเตอร์</th><th class="r">${kind==='water'?'ลบ.ม.':'kWh'}</th><th class="r">ค่าใช้จ่าย (฿)</th><th>เทียบเดือนก่อน</th><th></th></tr></thead><tbody>${PT.filter(x=>x[0]===kind).map(([k,p,n])=>{const r=rd(m,p),q=rd(pm,p);return`<tr><td>${esc(n)}</td><td class="r num">${r?fNum(r.units):'—'}</td><td class="r num">${r?fNum(r.cost):'—'}</td><td>${r&&q?dp(dl(r.units,q.units)):''}</td><td class="r"><button class="btn sm" data-act="rdEdit" data-p="${p}">${r?'แก้ไข':'บันทึก'}</button></td></tr>`}).join('')}</tbody></table></div>`;
  return`${head('น้ำ · ไฟ · ขยะ และสาธารณูปโภค','ค่าใช้จ่ายส่วนกลาง รอบใช้งาน '+ymLabelFull(m)+` · ค่าน้ำ ≈ ฿${S.settings.rates.water}/ลบ.ม. · ค่าไฟ ≈ ฿${S.settings.rates.elec}/kWh`,`<button class="btn pri" data-act="rdNext">บันทึกมิเตอร์ ${ymLabel(ymAdd(ym(Date.now()),-1))}</button>`)}
  <div class="chips">${[...Array(6)].map((_,k)=>ymAdd(latest(),k-4)).concat([ymAdd(ym(Date.now()),-1)]).filter((v,i,a)=>a.indexOf(v)===i).sort().slice(-6).map(k=>`<button class="chip${k===m?' on':''}" data-act="rdMonth" data-v="${k}">${ymLabel(k)}</button>`).join('')}</div>
  <div class="g kp"><div class="card"><div class="kl">ค่าน้ำประปาส่วนกลาง</div><div class="kv num">${baht(w)}</div>${dp(dl(w,wp))}<div class="mut num" style="font-size:.8rem;margin-top:6px">${fNum(wU)} ลบ.ม.</div></div>
  <div class="card"><div class="kl">ค่าไฟฟ้าส่วนกลาง</div><div class="kv num">${baht(e)}</div>${dp(dl(e,ep))}<div class="mut num" style="font-size:.8rem;margin-top:6px">${fNum(eU)} kWh</div></div>
  <div class="card"><div class="kl">ค่าจัดเก็บขยะ (รับ − จ่าย)</div><div class="kv num" style="color:${garbIn>=garbOut?'var(--ok)':'var(--bad)'}">${garbIn>=garbOut?'+':'−'}${baht(Math.abs(garbIn-garbOut))}</div><div class="mut" style="font-size:.8rem">รับ ${baht(garbIn)} · จ่ายผู้รับเหมา ${baht(garbOut)}</div></div>
  <div class="card"><div class="kl">น้ำ + ไฟ รวม</div><div class="kv num">${baht(w+e)}</div><div class="mut" style="font-size:.8rem">${S.houses.length?baht((w+e)/S.houses.length):''} ต่อหลัง</div></div></div>
  <div class="g g2"><div class="card"><h2 class="h2">ค่าน้ำ + ค่าไฟ 6 เดือน (พันบาท)</h2>${bars(months.map(k=>ymLabel(k).split(' ')[0]),[{name:'น้ำ',color:'#2b6cb0',vals:months.map(k=>Math.round(readingCost2(k,'water')/1000*10)/10)},{name:'ไฟ',color:'var(--gold)',vals:months.map(k=>Math.round(readingCost2(k,'elec')/1000*10)/10)}],{stack:true,fmt:v=>fNum(v,1),notes:months.map(k=>fNum((readingCost2(k,'water')+readingCost2(k,'elec'))/1000,1))})}</div>
  <div class="card"><h2 class="h2">แจ้งเตือนใช้ผิดปกติ</h2>${alerts.length?alerts.map(a=>`<div class="ln"><span>${pill('ผิดปกติ','bd')} <b>${esc(a.n)}</b><div class="mut" style="font-size:.8rem">ใช้ ${fNum(a.u)} ${a.kind==='water'?'ลบ.ม.':'kWh'} สูงกว่าค่าเฉลี่ย 3 เดือน (${fNum(a.avg)}) อยู่ ${fNum(a.d,0)}%</div></span><a class="btn sm" href="#/news">แจ้งซ่อม</a></div>`).join(''):'<div class="empty-s">ไม่พบจุดที่ใช้สูงผิดปกติ (เกิน 15% ของค่าเฉลี่ย 3 เดือน)</div>'}</div></div>
  <div class="g g2"><div class="card"><h2 class="h2">มิเตอร์น้ำประปา</h2>${tbl('water')}</div><div class="card"><h2 class="h2">มิเตอร์ไฟฟ้า</h2>${tbl('elec')}</div></div>`}
function readingCost2(m,k){return sum(S.readings.filter(r=>r.month===m&&r.kind===k),r=>r.cost)}
ACT.rdMonth=el=>{mon=el.dataset.v;refresh()};ACT.rdNext=()=>{mon=ymAdd(ym(Date.now()),-1);refresh()};
ACT.rdEdit=async el=>{const p=el.dataset.p,[kind,,name]=PT.find(x=>x[1]===p),m=mon,ex=rd(m,p),last=S.readings.filter(r=>r.point===p&&r.month<m).sort((a,b)=>a.month<b.month?1:-1)[0];
  const r=await form((ex?'แก้ไข':'บันทึก')+'มิเตอร์ '+name+' · '+ymLabel(m),[{k:'prev',label:'เลขมิเตอร์ครั้งก่อน',type:'number',value:ex?ex.prev:last?last.cur:0},{k:'cur',label:'เลขมิเตอร์ล่าสุด',type:'number',value:ex?ex.cur:'',ph:'กรอกเลขที่อ่านได้'}],{note:'ระบบคำนวณหน่วยและค่าใช้จ่ายให้ตามอัตราที่ตั้งไว้'});
  if(!r||r.cur==null)return;if(r.cur<r.prev){toast('เลขล่าสุดต้องไม่น้อยกว่าเลขครั้งก่อน');return}const u=r.cur-r.prev,rate=kind==='water'?S.settings.rates.water:S.settings.rates.elec;
  if(ex){Object.assign(ex,{prev:r.prev,cur:r.cur,units:u,cost:Math.round(u*rate)})}else S.readings.push({id:uid('R'),month:m,point:p,kind,name,prev:r.prev,cur:r.cur,units:u,cost:Math.round(u*rate)});save();toast('บันทึกแล้ว');refresh()};
