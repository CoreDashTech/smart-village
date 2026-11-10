/* ซิงก์กับ Google Sheet (ผ่าน Google Apps Script Web App) — local-first: ใช้งานออฟไลน์ได้ แล้วซิงก์เมื่อมีเน็ต */
import {S,onChange,save,COLS as CL} from './store.js';
const tr=x=>x;
const CFG='cdv.cfg',ST='cdv.sst',PK='cdv.photo.';
const COLS=Object.fromEntries(CL.map(c=>[c,c]));
const KEY={houses:'no'};const keyOf=(c,r)=>r[KEY[c]||'id'];
const dt=t=>{const d=new Date(t),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())};
const DIR={in:'เข้า',out:'ออก'},TY={r:'ลูกบ้าน',v:'ผู้มาติดต่อ',c:'ผู้รับเหมา',u:'ไม่รู้จัก'},PKT={street:'จอดริมถนน',block:'ขวางทางเข้า-ออก',night:'จอดข้ามคืน',line:'ทับเส้นห้ามจอด'},PKS={warn:'เตือน',pending:'รอออกบิล',billed:'ออกบิลแล้ว',paid:'ชำระแล้ว'},TKS={new:'ใหม่',doing:'กำลังซ่อม',wait:'รออะไหล่',done:'เสร็จแล้ว'};
const HDR={houses:['บ้านเลขที่','เจ้าของ','โทร','ค่าส่วนกลาง','ทะเบียนรถ'],invoices:['เลขที่','บ้าน','เดือน','ยอดรวม','ครบกำหนด','ชำระเมื่อ','ช่องทาง','สถานะ'],bookings:['วันที่','ชั่วโมง','สถานที่','บ้าน','ที่นั่ง'],gate:['เวลา','ทะเบียน','จังหวัด','ทิศทาง','ประเภท','บ้าน','ความมั่นใจ %','ประตู'],passes:['รหัส','บ้าน','ชื่อ','ทะเบียน','เริ่ม','สิ้นสุด'],parking:['เวลา','ซอย','ทะเบียน','บ้าน','ประเภท','นาที','ค่าปรับ','สถานะ','หมายเหตุ'],ledger:['วันที่','ประเภท','หมวด','จำนวนเงิน','รายละเอียด'],readings:['เดือน','จุดมิเตอร์','ชนิด','เลขก่อน','เลขหลัง','หน่วย','ค่าใช้จ่าย'],notices:['เวลา','หัวข้อ','ประเภท','ปักหมุด','ข้อความ'],tickets:['เลขที่','เรื่อง','สถานที่','เวลา','สถานะ','เร่งด่วน'],jobs:['งาน','ความถี่','ผู้รับผิดชอบ','ครั้งถัดไป'],polls:['หัวข้อ','ปิดรับ','ผลโหวต'],pickups:['วันที่','โซน','เก็บเสร็จ'],settings:['หมู่บ้าน','ที่อยู่','ผู้พัฒนา','วันครบกำหนด','ปรับล่าช้า %']};
const cols={houses:r=>[r.no,r.owner,r.phone,r.fee,(r.plates||[]).join(', ')],invoices:r=>[r.id,r.no,r.month,r.total,dt(r.due),r.paidAt?dt(r.paidAt):'',r.method||'',r.paidAt?'ชำระแล้ว':'ค้าง'],bookings:r=>[r.date,r.hour,r.fac==='pool'?'สระว่ายน้ำ':'ห้องฟิตเนส',r.house,r.seats],gate:r=>[dt(r.ts),r.plate,r.prov||'',DIR[r.dir],TY[r.type],r.house||'',r.conf,r.gate],passes:r=>[r.code,r.house,r.name,r.plate,dt(r.from),dt(r.to)],parking:r=>[dt(r.ts),r.soi,r.plate,r.house||'',PKT[r.type],r.mins,r.fine,PKS[r.status],r.note||''],ledger:r=>[dt(r.ts),r.kind==='in'?'รายรับ':'รายจ่าย',r.cat,r.amt,r.note||''],readings:r=>[r.month,r.name,r.kind==='water'?'น้ำ':'ไฟ',r.prev,r.cur,r.units,r.cost],notices:r=>[dt(r.ts),r.title,r.cat,r.pinned?'ปักหมุด':'',r.body],tickets:r=>[r.no,r.title,r.where,dt(r.ts),TKS[r.status],r.urgent?'ด่วน':''],jobs:r=>[r.name,r.freq,r.owner,r.next],polls:r=>[r.q,r.closes,r.opts.map(o=>o.t+':'+o.votes.length).join(' | ')],pickups:r=>[r.date,r.zone,dt(r.doneAt)],settings:r=>[r.village,r.address,r.developer,r.dueDay,r.lateRate]};
const SKIPSET=['theme','demo','seq'];
const lsGet=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d}catch(e){return d}};
let cfg=lsGet(CFG,null),st=lsGet(ST,{last:0,snap:{},ph:{}}),busy=false,timer=null,poll=null,status={mode:cfg?'ok':'off',msg:'',last:st.last||0,pending:0};
const subs=new Set();export const onStatus=f=>{subs.add(f);return()=>subs.delete(f)};
const setStatus=o=>{Object.assign(status,o);subs.forEach(f=>f(status))};
export const getStatus=()=>status;export const getCfg=()=>cfg;export const isOn=()=>!!cfg;
const saveSt=()=>{try{localStorage.setItem(ST,JSON.stringify(st))}catch(e){}};
const hash=o=>{const s=JSON.stringify(o);let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return h.toString(36)+s.length};
const settingsRec=()=>{const o={...S.settings};SKIPSET.forEach(k=>delete o[k]);return o};
function* records(){for(const c in COLS)for(const r of S[c])yield[c,keyOf(c,r),r];yield['settings','main',settingsRec()]}
function pendingRows(){const out=[];for(const[c,k,r]of records()){if(st.snap[c+'|'+k]!==hash(r))out.push({c,k,r})}return out}
export function pendingCount(){return cfg?pendingRows().length:0}
async function call(body){const r=await fetch(cfg.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({token:cfg.token,...body})});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(!j.ok)throw new Error(j.error||'เซิร์ฟเวอร์ตอบกลับผิดพลาด');return j}
async function get(q){const u=new URL(cfg.url);u.searchParams.set('token',cfg.token);Object.entries(q).forEach(([k,v])=>u.searchParams.set(k,v));const r=await fetch(u);if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(!j.ok)throw new Error(j.error||'เซิร์ฟเวอร์ตอบกลับผิดพลาด');return j}
export async function ping(url,token){const old=cfg;cfg={url,token};try{return await get({action:'ping'})}finally{cfg=old}}
/* ---- ดึงข้อมูลจาก Sheet ---- */
async function pull(){const j=await get({action:'pull',since:st.last||0});let changed=false;
  for(const row of j.rows){let rec;try{rec=JSON.parse(row.j)}catch(e){continue}const c=row.c,k=row.k,sk=c+'|'+k;
    if(c==='settings'){const cur=settingsRec();if(st.snap[sk]&&st.snap[sk]!==hash(cur))continue;if(hash(rec)!==hash(cur)){Object.assign(S.settings,rec);changed=true}S.settings.demo=false;st.snap[sk]=hash(settingsRec());continue}
    const arr=S[c];if(!arr)continue;const i=arr.findIndex(x=>keyOf(c,x)===k);
    if(i<0){arr.push(rec);st.snap[sk]=hash(rec);changed=true}
    else{if(st.snap[sk]!==hash(arr[i]))continue; /* มีการแก้ไขในเครื่องที่ยังไม่ส่ง — ใช้ของเครื่องก่อน */
      if(hash(arr[i])!==hash(rec)){Object.keys(arr[i]).forEach(x=>delete arr[i][x]);Object.assign(arr[i],rec);changed=true}st.snap[sk]=hash(arr[i])}
    }
  st.last=j.now;saveSt();if(changed){S.settings.demo=false;save()}return changed}
/* ---- ส่งขึ้น Sheet ---- */
async function push(){const rows=pendingRows();let n=0;
  for(let i=0;i<rows.length;i+=150){const part=rows.slice(i,i+150),hdr={};part.forEach(x=>hdr[x.c]=HDR[x.c].map(tr));
    await call({action:'push',hdr,rows:part.map(x=>({c:x.c,k:x.k,cols:cols[x.c](x.r),j:JSON.stringify(x.r)}))});part.forEach(x=>{st.snap[x.c+'|'+x.k]=hash(x.r)});n+=part.length;saveSt()}
  return n}
async function photos(){const ids=[...S.parking.map(v=>v.photo),S.settings.coverId].filter(Boolean);let up=0;
  for(const id of ids){if(st.ph[id])continue;const d=localStorage.getItem(PK+id);if(!d)continue;await call({action:'photo',id,data:d});st.ph[id]=1;if(++up>=6)break}
  let down=0;for(const id of ids){if(localStorage.getItem(PK+id)||st.ph[id]===2)continue;try{const j=await get({action:'getphoto',id});if(j.data){localStorage.setItem(PK+id,j.data);st.ph[id]=1}else st.ph[id]=2}catch(e){break}if(++down>=6)break}
  saveSt()}
export async function syncNow({quiet=false}={}){if(!cfg||busy)return;if(!navigator.onLine){setStatus({mode:'offline',msg:'ออฟไลน์ — จะซิงก์เมื่อมีอินเทอร์เน็ต',pending:pendingCount()});return}
  busy=true;setStatus({mode:'busy',msg:'กำลังซิงก์…'});
  try{const ch=await pull();const n=await push();await photos().catch(()=>{});st.last=st.last||Date.now();saveSt();setStatus({mode:'ok',msg:'ซิงก์แล้ว',last:Date.now(),pending:pendingCount()});if(ch)window.dispatchEvent(new Event('cdv-synced'));return{pulled:ch,pushed:n}}
  catch(e){console.warn('sync',e);setStatus({mode:'err',msg:'ซิงก์ไม่สำเร็จ: '+e.message,pending:pendingCount()});if(!quiet)throw e}
  finally{busy=false}}
export function schedule(ms=3500){if(!cfg)return;clearTimeout(timer);setStatus({pending:pendingCount()});timer=setTimeout(()=>syncNow({quiet:true}),ms)}
export function connect(url,token){cfg={url:url.trim(),token:token.trim()};localStorage.setItem(CFG,JSON.stringify(cfg));st={last:0,snap:{},ph:{}};saveSt();startPolling();setStatus({mode:'ok',msg:'เชื่อมต่อแล้ว'})}
export function disconnect(){cfg=null;localStorage.removeItem(CFG);localStorage.removeItem(ST);st={last:0,snap:{},ph:{}};clearInterval(poll);setStatus({mode:'off',msg:'',pending:0})}
function startPolling(){clearInterval(poll);poll=setInterval(()=>{if(document.visibilityState==='visible')syncNow({quiet:true})},45000)}
export function initSync(){onChange(()=>schedule());if(!cfg)return;window.addEventListener('online',()=>syncNow({quiet:true}));window.addEventListener('offline',()=>setStatus({mode:'offline',msg:'ออฟไลน์'}));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncNow({quiet:true})});startPolling();syncNow({quiet:true})}
