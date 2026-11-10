import {S,save,getHouse,invStatus,daysOver} from './store.js';
import {ic,ACT,IN,head,pill,tabs,form,ask,toast,refresh,empty} from './ui.js';
import {esc,uid,ymd,DAY,dowTh,fDate,fNum,sum,pad,startOfDay} from './util.js';
export const title='จองสระ / ฟิตเนส';
let fac='pool',day=ymd(Date.now());
const hh=h=>pad(h)+':00–'+pad(h+1)+':00';
const used=(f,d,h)=>sum(S.bookings.filter(b=>b.fac===f&&b.date===d&&b.hour===h),b=>b.seats);
const blocked=no=>S.invoices.filter(i=>i.no===no&&!i.paidAt&&daysOver(i)>60).length>0;
const myDay=(f,d,no)=>sum(S.bookings.filter(b=>b.fac===f&&b.date===d&&b.house===no),b=>b.seats);
export function render(){const F=S.settings.fac[fac],days=[...Array(7)].map((_,k)=>ymd(startOfDay(Date.now())+k*DAY));if(!days.includes(day))day=days[0];
  const hrs=[];for(let h=F.open;h<F.close;h++)hrs.push(h);const now=new Date(),today=ymd(now),nowH=now.getHours();
  const dayBk=S.bookings.filter(b=>b.fac===fac&&b.date===day),tot=sum(dayBk,b=>b.seats),capAll=hrs.filter(h=>!F.shut.includes(h)).length*F.cap;
  const peak=hrs.map(h=>[h,used(fac,day,h)]).sort((a,b)=>b[1]-a[1])[0];
  return`${head('จองสระว่ายน้ำ / ห้องฟิตเนส','จองล่วงหน้า 7 วัน · จองได้ไม่เกิน '+F.max+' ที่นั่ง/บ้าน/วัน · บ้านค้างชำระเกิน 60 วันจองไม่ได้',`<button class="btn pri" data-act="bkNew">${ic('plus')} จองให้ลูกบ้าน</button>`)}
  ${tabs(fac,[['pool','🏊 สระว่ายน้ำ'],['fit','🏋️ ฟิตเนส']],'bkFac')}
  <div class="chips">${days.map(d=>{const dt=new Date(d+'T00:00');return`<button class="chip${d===day?' on':''}" data-act="bkDay" data-v="${d}">${d===today?'วันนี้':dowTh(dt)+' '+dt.getDate()}</button>`}).join('')}</div>
  <div class="g kp"><div class="card"><div class="kl">ผู้จองวันนี้</div><div class="kv num">${fNum(tot)}</div><div class="mut" style="font-size:.8rem">จากความจุ ${fNum(capAll)} ที่</div></div>
  <div class="card"><div class="kl">ช่วงคนแน่นสุด</div><div class="kv num">${peak?hh(peak[0]).slice(0,5):'—'}</div><div class="mut" style="font-size:.8rem">${peak?peak[1]+'/'+F.cap+' ที่':''}</div></div>
  <div class="card"><div class="kl">เปิดให้บริการ</div><div class="kv num">${pad(F.open)}:00–${pad(F.close)}:00</div><div class="mut" style="font-size:.8rem">ปิดพัก ${F.shut.length?F.shut.map(h=>pad(h)+':00').join(', '):'—'}</div></div></div>
  <div class="card"><h2 class="h2">${esc(F.name)} · ${fDate(new Date(day+'T00:00'),true)}</h2>
  <div class="g g3" style="gap:10px">${hrs.map(h=>{const sh=F.shut.includes(h),u=used(fac,day,h),left=F.cap-u,past=day===today&&h<nowH,full=left<=0,low=!full&&left<=Math.ceil(F.cap*.25);
    const cls=sh?'shut':past?'full':full?'full':low?'low':'';return`<button class="slot ${cls}" ${sh||past||full?'disabled':''} data-act="bkSlot" data-h="${h}"><b>${hh(h)}</b><span>${sh?'ปิดพัก/ทำความสะอาด':past?'ผ่านไปแล้ว':full?'เต็ม':'ว่าง '+left+' / '+F.cap+' ที่'}</span></button>`}).join('')}</div></div>
  <div class="card"><h2 class="h2">รายการจองวันนี้ (${dayBk.length})</h2>${dayBk.length?`<div class="tbw"><table class="tb"><thead><tr><th>เวลา</th><th>บ้าน</th><th class="r">ที่นั่ง</th><th></th></tr></thead><tbody>${dayBk.sort((a,b)=>a.hour-b.hour).map(b=>`<tr><td>${hh(b.hour)}</td><td><a href="#/houses/${encodeURIComponent(b.house)}">${esc(b.house)}</a></td><td class="r num">${b.seats}</td><td class="r"><button class="btn sm bad" data-act="bkDel" data-id="${b.id}">ยกเลิก</button></td></tr>`).join('')}</tbody></table></div>`:empty('ยังไม่มีการจองในวันนี้')}</div>`}
async function book(h){const F=S.settings.fac[fac];
  const r=await form('จอง '+F.name+' · '+hh(h),[{k:'house',label:'บ้านเลขที่',type:'text',ph:'เช่น 12/34',value:''},{k:'seats',label:'จำนวนที่นั่ง',type:'number',value:1}],{note:'คงเหลือ '+(F.cap-used(fac,day,h))+' ที่ในช่วงเวลานี้'});
  if(!r)return;const no=r.house,hs=getHouse(no);if(!hs){toast('ไม่พบบ้านเลขที่นี้');return}
  if(blocked(hs.no)){toast('บ้านนี้ค้างชำระเกิน 60 วัน จองไม่ได้');return}
  const s=Math.max(1,r.seats||1);if(s>F.cap-used(fac,day,h)){toast('ที่นั่งไม่พอ');return}
  if(myDay(fac,day,hs.no)+s>F.max){toast('จองได้ไม่เกิน '+F.max+' ที่นั่ง/บ้าน/วัน');return}
  S.bookings.push({id:uid('b'),fac,date:day,hour:h,house:hs.no,seats:s,ts:Date.now()});save();toast('จองแล้ว');refresh()}
ACT.bkFac=el=>{fac=el.dataset.v;refresh()};ACT.bkDay=el=>{day=el.dataset.v;refresh()};
ACT.bkSlot=el=>book(+el.dataset.h);
ACT.bkNew=()=>{const F=S.settings.fac[fac];const h=[...Array(F.close-F.open)].map((_,k)=>F.open+k).find(h=>!F.shut.includes(h)&&F.cap-used(fac,day,h)>0&&!(day===ymd(Date.now())&&h<new Date().getHours()));if(h==null)return toast('วันนี้ไม่มีช่วงว่าง');book(h)};
ACT.bkDel=async el=>{if(!await ask('ยกเลิกการจอง','ต้องการยกเลิกรายการนี้หรือไม่','ยกเลิกการจอง','bad'))return;S.bookings=S.bookings.filter(b=>b.id!==el.dataset.id);save();toast('ยกเลิกแล้ว');refresh()};
