/* CoreDash Village — data store (local-first, localStorage) */
import {uid,rng,pad,DAY,startOfDay,ym,ymAdd,ymStart,ymd,normPlate} from './util.js';
const KEY='cdv.v1',PKEY='cdv.photo.';
export const COLS=['houses','invoices','bookings','gate','passes','parking','ledger','readings','notices','tickets','jobs','polls','pickups'];
export const S={settings:{}};COLS.forEach(c=>S[c]=[]);
const subs=new Set();export const onChange=f=>{subs.add(f);return()=>subs.delete(f)};
let timer;export function save(){clearTimeout(timer);timer=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){window.dispatchEvent(new CustomEvent('cdv-error',{detail:'พื้นที่จัดเก็บเต็ม — ส่งออกสำรองข้อมูลแล้วลบรูปเก่า'}))}subs.forEach(f=>f())},250)}
export function load(){try{const j=JSON.parse(localStorage.getItem(KEY)||'null');if(j&&j.houses){Object.assign(S,j);return true}}catch(e){}return false}
export const defaults=()=>({village:'Life Bangkok Boulevard',address:'พระราม 5',developer:'SC Asset',manager:'นิติบุคคลหมู่บ้านจัดสรร',coverId:'',dueDay:15,lateRate:1.5,garbageFee:60,fee:{std:1800,big:2400},rates:{water:8.5,elec:4.1},
 pk:{warnMin:30,t2:200,t3:500,night:300,block:500,line:200,window:90},
 fac:{pool:{name:'สระว่ายน้ำ',cap:12,open:6,close:20,shut:[12],max:2},fit:{name:'ห้องฟิตเนส',cap:15,open:6,close:21,shut:[],max:2}},
 zones:{A:'ซอย 1–6',B:'ซอย 7–12',C:'ซอย 13–18',D:'ซอย 19–24'},
 garb:{A:[0,1,0,1,0,1,2],B:[0,1,0,1,0,1,2],C:[1,0,1,0,1,0,2],D:[1,0,1,0,1,0,2]},
 open:{cash:700000,reserve:2400000,fixed:760000,ap:142300,prepaid:96800,deposit:118000,asOf:0},demo:true});
export const nextSeq=k=>{S.settings.seq=S.settings.seq||{};S.settings.seq[k]=(S.settings.seq[k]||0)+1;return S.settings.seq[k]};
export const getHouse=no=>S.houses.find(h=>h.no===no);
export const houseByPlate=p=>{p=normPlate(p);if(!p)return null;return S.houses.find(h=>(h.plates||[]).some(x=>normPlate(x)===p))};
export const soiOf=no=>+(String(no).split('/')[1]||0);
export const zoneOf=no=>{const s=soiOf(no);return s<=6?'A':s<=12?'B':s<=18?'C':'D'};
export const getPhoto=id=>{try{return localStorage.getItem(PKEY+id)}catch(e){return null}};
export const putPhoto=(id,d)=>{try{localStorage.setItem(PKEY+id,d);return true}catch(e){return false}};
export const THEME_KEYS=[];
/* ---------- ใบแจ้งหนี้ ---------- */
export const invStatus=(i,now=Date.now())=>i.paidAt?'paid':(i.due<startOfDay(now)?'overdue':'pending');
export const daysOver=(i,now=Date.now())=>Math.max(0,Math.floor((startOfDay(now)-i.due)/DAY));
export const lateFee=(i,now=Date.now())=>{if(i.paidAt)return i.lateFee||0;const d=daysOver(i,now);if(!d)return 0;const base=(i.items||[]).filter(x=>x.k!=='fine').reduce((a,x)=>a+x.a,0);return Math.round(base*S.settings.lateRate/100*Math.ceil(d/30))};
export const invTotal=i=>(i.items||[]).reduce((a,x)=>a+x.a,0);
export function newInvoices(month,now=Date.now()){let n=0;const st=S.settings;
  S.houses.forEach(h=>{if(S.invoices.some(i=>i.no===h.no&&i.month===month))return;
    const items=[{k:'fee',a:h.fee||st.fee.std},{k:'garb',a:st.garbageFee}];
    S.parking.filter(v=>v.house===h.no&&v.status==='pending'&&v.fine>0).forEach(v=>items.push({k:'fine',a:v.fine,ref:v.id}));
    const inv={id:'INV-'+month.replace('-','')+'-'+pad(S.invoices.filter(x=>x.month===month).length+1,3),no:h.no,month,items,due:ymStart(month)+(st.dueDay-1)*DAY,paidAt:null,method:'',lateFee:0,total:0};inv.total=invTotal(inv);
    S.parking.forEach(v=>{if(items.some(x=>x.ref===v.id)){v.status='billed';v.invoiceId=inv.id}});S.invoices.push(inv);n++});
  save();return n}
export function payInvoice(id,{method='โอน',ts=Date.now()}={}){const i=S.invoices.find(x=>x.id===id);if(!i||i.paidAt)return;i.lateFee=lateFee(i,ts);i.paidAt=ts;i.method=method;
  S.parking.forEach(v=>{if(v.invoiceId===i.id){v.status='paid';v.paidAt=ts}});save()}
/* ---------- ค่าปรับจอดริมถนน ---------- */
export function calcFine(house,type,ts=Date.now(),ignoreId=null){const p=S.settings.pk;if(type==='night')return{fine:p.night,warn:false,count:0};if(type==='block')return{fine:p.block,warn:false,count:0};
  const since=ts-p.window*DAY,prev=S.parking.filter(v=>v.house===house&&v.id!==ignoreId&&v.ts>=since&&v.ts<ts).length;
  if(prev===0)return{fine:0,warn:true,count:0};return{fine:prev===1?p.t2:p.t3,warn:false,count:prev}}
export const PK_TYPES={street:'จอดริมถนน',block:'ขวางทางเข้า-ออก',night:'จอดข้ามคืน',line:'ทับเส้นห้ามจอด'};
export function addViolation({soi,spot,plate,type,mins,note,photo,ts=Date.now()}){const h=houseByPlate(plate);const c=h?calcFine(h.no,type,ts):{fine:type==='night'?S.settings.pk.night:S.settings.pk.t2,warn:false};
  const fine=type==='line'&&!c.warn?S.settings.pk.line:c.fine;
  const v={id:uid('v'),ts,soi:+soi,spot:spot||'',plate,house:h?h.no:'',type,mins:+mins||0,fine,status:fine>0?'pending':'warn',note:note||'',photo:null,x:Math.round(8+Math.random()*84)};
  if(photo){v.photo='p'+v.id;if(!putPhoto(v.photo,photo))v.photo=null}S.parking.push(v);save();return v}
/* ---------- สรุปการเงิน ---------- */
export const CAT_IN={fee:'ค่าส่วนกลาง',garb:'ค่าจัดเก็บขยะ',rent:'ค่าใช้สระ ฟิตเนส ห้องประชุม',fines:'ค่าปรับ (ล่าช้า · จอดริมถนน)',other:'รายได้อื่น'};
export const CAT_OUT={payroll:'ค่าจ้าง รปภ. และแม่บ้าน',util:'ค่าน้ำ ค่าไฟส่วนกลาง',garbage:'ค่ากำจัดขยะ',repair:'ซ่อมบำรุงและภูมิทัศน์',admin:'ประกัน ภาษี ธุรการ',reserve:'สมทบกองทุนสำรอง'};
export function readingCost(m){return S.readings.filter(r=>r.month===m).reduce((a,r)=>a+r.cost,0)}
/* รายการเงินทั้งหมดในช่วง [a,b) → {inc:{cat:amt}, out:{cat:amt}} */
export function flows(a,b){const inc={fee:0,garb:0,rent:0,fines:0,other:0},out={payroll:0,util:0,garbage:0,repair:0,admin:0,reserve:0};
  S.invoices.forEach(i=>{if(i.paidAt&&i.paidAt>=a&&i.paidAt<b){i.items.forEach(x=>{if(x.k==='fee')inc.fee+=x.a;else if(x.k==='garb')inc.garb+=x.a});inc.fines+=i.lateFee||0}});
  S.parking.forEach(v=>{if(v.status==='paid'&&v.paidAt>=a&&v.paidAt<b)inc.fines+=v.fine});
  S.ledger.forEach(l=>{if(l.ts>=a&&l.ts<b){if(l.kind==='in'){inc[l.cat]=(inc[l.cat]||0)+l.amt}else out[l.cat]=(out[l.cat]||0)+l.amt}});
  for(let m=ym(a);ymStart(m)<b;m=ymAdd(m,1))out.util+=readingCost(ymAdd(m,-1));
  return{inc,out}}
export const monthFlows=m=>flows(ymStart(m),ymStart(ymAdd(m,1)));
export const tot=o=>Object.values(o).reduce((a,b)=>a+b,0);
/* ---------- ข้อมูลตัวอย่าง ---------- */
const FN=['สมชาย','วิภา','อนุชา','ประเสริฐ','มาลี','กิตติ','นภา','ธนากร','รัตนา','วีระ','จิราพร','สุเทพ','พรทิพย์','ชัยวัฒน์','อรทัย','ณรงค์','สุดา','พิชัย','กัลยา','ธีรพงษ์','ปิยะ','วรรณา','สมหมาย','เบญจา'];
const LN=['ใจดี','รักงาน','มั่นคง','ศรีสุข','แก้วใส','เพชรดี','ทองคำ','พูนผล','สุขใจ','บุญมา','ดวงดี','มีทรัพย์','รุ่งเรือง','วงศ์ใหญ่','เจริญสุข','ทรัพย์มาก','สมบูรณ์','ประเสริฐศักดิ์'];
const CS='กขคงจฉชซญดตถทนบปผพฟมยรลวสหอฮ',PV=['กรุงเทพฯ','นนทบุรี','ปทุมธานี','สมุทรปราการ','ชลบุรี','นครปฐม','สมุทรสาคร'];
export function seed(){const R=rng(20261110),pick=a=>a[Math.floor(R()*a.length)],now=Date.now(),cm=ym(now);
  const st=S.settings=defaults();COLS.forEach(c=>S[c]=[]);
  const plate=()=>(R()<.3?Math.ceil(R()*9):'')+pick([...CS])+pick([...CS])+' '+pad(Math.floor(R()*9999)+1,4);
  for(let s=1;s<=24;s++)for(let j=1;j<=9;j++){const n=(s-1)*9+j,no=n+'/'+s,big=n%5===0;S.houses.push({no,owner:pick(FN)+' '+pick(LN),phone:'08'+pad(Math.floor(R()*1e8),8),area:big?80:50,fee:big?st.fee.big:st.fee.std,plates:R()<.5?[plate()]:[plate(),plate()],note:''})}
  st.open.asOf=ymStart(ymAdd(cm,-10));
  /* ใบแจ้งหนี้ 3 เดือน */
  const hs=S.houses,badA=new Set(hs.slice(5,8).map(h=>h.no)),badB=new Set(hs.slice(40,43).map(h=>h.no)),badC=new Set(hs.slice(90,95).map(h=>h.no)),late=new Set(hs.filter((_,i)=>i%7===3).map(h=>h.no));
  for(const m of [ymAdd(cm,-2),ymAdd(cm,-1),cm]){const isCur=m===cm;hs.forEach((h,i)=>{
    const items=[{k:'fee',a:h.fee},{k:'garb',a:st.garbageFee}],due=ymStart(m)+(st.dueDay-1)*DAY;let paid=true;
    if(badA.has(h.no))paid=false;else if(badB.has(h.no)&&m!==ymAdd(cm,-2))paid=false;else if(badC.has(h.no)&&m===ymAdd(cm,-1))paid=false;
    else if(isCur&&late.has(h.no))paid=false;else if(isCur&&R()<.45)paid=false;
    const inv={id:'INV-'+m.replace('-','')+'-'+pad(i+1,3),no:h.no,month:m,items,due,paidAt:null,method:'',lateFee:0,total:h.fee+st.garbageFee};
    if(paid){const day=ymStart(m)+Math.floor(R()*(isCur?Math.min(9,new Date(now).getDate()-1):st.dueDay))*DAY+36e5*Math.floor(8+R()*9);inv.paidAt=Math.min(day,now);inv.method=pick(['QR พร้อมเพย์','QR พร้อมเพย์','QR พร้อมเพย์','โอนธนาคาร','เงินสด']);inv.lateFee=0}
    S.invoices.push(inv)})}
  /* รายการเงิน (ledger) 11 เดือน */
  for(let k=10;k>=0;k--){const m=ymAdd(cm,-k),t0=ymStart(m),dt=d=>Math.min(t0+d*DAY+36e5*10,now),L=(kind,cat,amt,d,note)=>{const ts=dt(d);if(ts<=now&&(m!==cm||d<=new Date(now).getDate()))S.ledger.push({id:uid('g'),ts,kind,cat,amt:Math.round(amt/10)*10,note})};
    const jit=(b,p)=>b*(1+(R()-.5)*p);
    L('out','payroll',jit(168000,.03),24,'เงินเดือน รปภ./แม่บ้าน');L('out','garbage',12600,25,'ค่ารถเก็บขยะ');L('out','repair',jit(58000,.35),18,'ซ่อมบำรุง/ภูมิทัศน์');L('out','admin',jit(22600,.12),12,'ประกัน/ภาษี/ธุรการ');L('out','reserve',30000,27,'สมทบกองทุนสำรอง');
    L('in','rent',jit(34000,.25),20,'ค่าใช้สระ/ห้องประชุม/เช่า');L('in','other',jit(36000,.3),22,'บัตรผ่านรถ/ค่าโอน/อื่นๆ');
    if(k>=3){L('in','fee',jit(318000,.04),15,'ค่าส่วนกลาง (สรุปยอดเดือน)');L('in','garb',12960,15,'ค่าจัดเก็บขยะ (สรุป)');L('in','fines',jit(14000,.4),16,'ค่าปรับ (สรุป)')}}
  /* มิเตอร์ 7 เดือน */
  const PT=[['water','w1','สวนและภูมิทัศน์ส่วนกลาง',2310],['water','w2','สโมสรและสระว่ายน้ำ',1420],['water','w3','ล้างถนนและถังพักน้ำ',815],['water','w4','ป้อมยามและสำนักงาน',380],['elec','e1','ไฟถนนและทางเดิน',3980],['elec','e2','สโมสร สระ ฟิตเนส',2310],['elec','e3','ปั๊มน้ำ',860],['elec','e4','ป้อมยามและกล้อง CCTV',640]];
  PT.forEach(([kind,p,name,base])=>{let cur=Math.round(base*40*(1+R()));for(let k=7;k>=1;k--){const m=ymAdd(cm,-k),u=Math.round(base*(1+(R()-.5)*.14)*(kind==='elec'&&k===1&&p==='e3'?1.18:1)),rate=kind==='water'?st.rates.water:st.rates.elec;S.readings.push({id:'R'+m+p,month:m,point:p,kind,name,prev:cur,cur:cur+u,units:u,cost:Math.round(u*rate)});cur+=u}});
  /* ข้อมูลรถผ่านประตู 7 วัน */
  const gates=['ประตูหลัก','ประตูหลัก','ประตูรอง'];
  for(let d=6;d>=0;d--){const day=startOfDay(now-d*DAY),n=Math.round(26+R()*8);for(let i=0;i<n;i++){const hr=6+R()*16,ts=day+Math.floor(hr*36e5+R()*36e5/2);if(ts>now)continue;const x=R();
    if(x<.72){const h=pick(hs),p=pick(h.plates);S.gate.push({id:uid('t'),ts,plate:p,prov:pick(PV),dir:R()<.52?'in':'out',type:'r',house:h.no,conf:Math.round(95+R()*4.5),gate:pick(gates)})}
    else if(x<.92){const h=pick(hs),p=plate(),stay=(1+R()*2)*36e5;S.gate.push({id:uid('t'),ts,plate:p,prov:pick(PV),dir:'in',type:'v',house:h.no,conf:Math.round(90+R()*8),gate:'ประตูหลัก'});if(ts+stay<now)S.gate.push({id:uid('t'),ts:ts+stay,plate:p,prov:'',dir:'out',type:'v',house:h.no,conf:Math.round(92+R()*6),gate:'ประตูหลัก'})}
    else if(x<.97){const p=plate();S.gate.push({id:uid('t'),ts,plate:p,prov:pick(PV),dir:'in',type:'c',house:'ซ่อมไฟถนน',conf:96,gate:'ประตูหลัก'});if(ts+36e5*3<now)S.gate.push({id:uid('t'),ts:ts+36e5*3,plate:p,prov:'',dir:'out',type:'c',house:'ซ่อมไฟถนน',conf:96,gate:'ประตูหลัก'})}
    else S.gate.push({id:uid('t'),ts,plate:plate(),prov:pick(PV),dir:'in',type:'u',house:'',conf:Math.round(85+R()*8),gate:'ประตูหลัก'})}}
  S.gate.sort((a,b)=>a.ts-b.ts);
  S.passes.push({id:uid('e'),house:hs[10].no,name:'แขกของบ้าน',plate:'7กน 3392',from:now-36e5,to:now+8*36e5,code:'EP'+Math.floor(R()*9e5+1e5),used:0},{id:uid('e'),house:hs[22].no,name:'ช่างแอร์',plate:'1ขฐ 5502',from:now+14*36e5,to:now+20*36e5,code:'EP'+Math.floor(R()*9e5+1e5),used:0});
  /* จองสระ/ฟิตเนส 7 วัน */
  const base={pool:[1,2,3,2,1,2,4,5,3,2,5,8,10,9,6],fit:[4,3,2,1,2,2,3,4,4,5,9,11,12,8,5]};
  for(const fac of ['pool','fit']){const f=st.fac[fac];for(let d=0;d<7;d++){const date=ymd(now+d*DAY);for(let h=f.open;h<f.close;h++){if(f.shut.includes(h))continue;let tgt=Math.min(f.cap-(R()<.8?1:0),Math.round((base[fac][h-6]||2)*.55+(d%3)*.5)),u=0,guard=0;while(u<tgt&&guard++<8){const s=Math.min(1+Math.floor(R()*3),tgt-u);S.bookings.push({id:uid('b'),fac,date,hour:h,house:pick(hs).no,seats:s,ts:now});u+=s}}}}
  /* ค่าปรับจอดริมถนน */
  const T=['street','street','street','night','block','line'];
  for(let i=0;i<26;i++){const ts=now-Math.floor(R()*55)*DAY-Math.floor(R()*20)*36e5,h=i<5?hs[30+i%3]:pick(hs),type=pick(T);const c=calcFine(h.no,type,ts),fine=type==='line'&&!c.warn?st.pk.line:c.fine;
    const age=(now-ts)/DAY,paid=fine>0&&age>20&&R()<.8,v={id:uid('v'),ts,soi:soiOf(h.no),spot:'',plate:h.plates[0],house:h.no,type,mins:type==='night'?480:Math.round(35+R()*150),fine,status:fine>0?(paid?'paid':'pending'):'warn',note:'',photo:null,x:Math.round(8+R()*84)};
    if(paid)v.paidAt=ts+4*DAY;S.parking.push(v)}
  S.parking.sort((a,b)=>a.ts-b.ts);
  /* ผูกค่าปรับที่ค้างเข้าบิลเดือนปัจจุบัน */
  S.parking.forEach(v=>{if(v.status==='pending'&&v.ts<ymStart(cm)){const inv=S.invoices.find(i=>i.no===v.house&&i.month===cm&&!i.paidAt);if(inv){inv.items.push({k:'fine',a:v.fine,ref:v.id});inv.total=invTotal(inv);v.status='billed';v.invoiceId=inv.id}}});
  const d0=ymd(now);
  S.notices.push({id:uid('n'),ts:now-3600e3,title:'งดจ่ายน้ำประปา เวลา 09:00–13:00 (วันพุธ)',body:'ล้างถังพักน้ำส่วนกลาง ขอให้สำรองน้ำไว้ใช้ตามความจำเป็น',cat:'สำคัญ',pinned:true},{id:uid('n'),ts:now-2*DAY,title:'ครบกำหนดชำระค่าส่วนกลางวันที่ '+st.dueDay+' ของเดือน',body:'ชำระผ่าน QR พร้อมเพย์ได้ที่นิติบุคคลหรือโอนเข้าบัญชีหมู่บ้าน',cat:'การเงิน',pinned:false},{id:uid('n'),ts:now-4*DAY,title:'กิจกรรมวันเด็กที่สโมสร',body:'ลงชื่อล่วงหน้าที่ป้อมยาม มีมุมกิจกรรมสำหรับเด็ก',cat:'กิจกรรม',pinned:false},{id:uid('n'),ts:now-7*DAY,title:'เปลี่ยนหลอดไฟถนน LED ทุกซอย',body:'ใช้เวลา 2 วัน อาจมีการปิดช่องจราจรชั่วคราวช่วงบ่าย',cat:'งานซ่อมบำรุง',pinned:false});
  const TK=[['ไฟถนนดับ','หน้าบ้านเลขที่ 7/1','new',true],['ท่อระบายน้ำอุดตัน',hs[22].no,'doing',false],['ประตูห้องฟิตเนสปิดไม่สนิท','สโมสร','wait',false],['ต้นไม้ล้มขวางทางเดิน','ซอย 15','done',false],['ปั๊มน้ำมีเสียงดัง','ห้องปั๊มน้ำ','new',true],['สายไฟห้อยต่ำ','ซอย 9','doing',false]];
  TK.forEach(([t,w,s,u],i)=>S.tickets.push({id:uid('k'),no:'#'+(1076+i),title:t,where:w,ts:now-i*DAY*.8,status:s,urgent:u}));
  const nx=n=>ymd(now+n*DAY);
  S.jobs.push({id:uid('j'),name:'ตัดหญ้าและดูแลสวนส่วนกลาง',freq:'จันทร์ · พฤหัส 09:00',owner:'ทีมภูมิทัศน์ (4 คน)',next:nx(2),cat:'งานประจำ'},{id:uid('j'),name:'ทำความสะอาดสโมสร / สระ',freq:'ทุกวัน 05:30 และ 12:00',owner:'แม่บ้าน (3 คน)',next:nx(1),cat:'งานประจำ'},{id:uid('j'),name:'ตรวจปั๊มน้ำและถังพัก',freq:'วันที่ 1 และ 15',owner:'ช่างเทคนิค',next:nx(5),cat:'งานประจำ'},{id:uid('j'),name:'พ่นยุง ควบคุมสัตว์พาหะ',freq:'วันที่ 5 ของเดือน',owner:'ผู้รับเหมา',next:nx(26),cat:'งานประจำ'},{id:uid('j'),name:'เวร รปภ. 3 กะ',freq:'06–14 · 14–22 · 22–06',owner:'บริษัทรักษาความปลอดภัย',next:nx(0),cat:'งานประจำ'},{id:uid('j'),name:'ประชุมคณะกรรมการ',freq:'อังคารที่ 2 ของเดือน 19:00',owner:'ประธานคณะกรรมการ',next:nx(0),cat:'ประชุม'},{id:uid('j'),name:'ตรวจถังดับเพลิง',freq:'ทุก 6 เดือน',owner:'ผู้รับเหมา',next:nx(16),cat:'ความปลอดภัย'});
  S.polls.push({id:uid('p'),q:'ติดตั้งโซลาร์เซลล์บนหลังคาสโมสร',closes:nx(10),opts:[{t:'เห็นด้วย',votes:hs.slice(0,96).map(h=>h.no)},{t:'ไม่เห็นด้วย',votes:hs.slice(96,128).map(h=>h.no)}]});
  st.demo=true}
export function init(){if(!load()){seed();save()}}
export function reset(withDemo=true){Object.keys(localStorage).filter(k=>k.startsWith(PKEY)).forEach(k=>localStorage.removeItem(k));if(withDemo)seed();else{const d=defaults();S.settings=d;COLS.forEach(c=>S[c]=[]);d.demo=false}save()}
export const exportJSON=()=>JSON.stringify({app:'coredash-village',v:1,at:Date.now(),data:S});
export function importJSON(t){const j=JSON.parse(t);if(j.app!=='coredash-village')throw new Error('ไฟล์ไม่ใช่ข้อมูล CoreDash Village');Object.assign(S,j.data);save()}
export const coverSrc=()=>(S.settings.coverId&&getPhoto(S.settings.coverId))||'assets/brand/village-cover.jpg';
