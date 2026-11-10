import {S,save,putPhoto,coverSrc,reset,exportJSON,importJSON} from './store.js';
import {ic,ACT,IN,head,pill,ask,toast,refresh} from './ui.js';
import {esc,cover169,download,fDT,debounce} from './util.js';
import {lookCard,lookActions,clearBg} from './look.js';
import {isOn,getCfg,getStatus,ping,connect,disconnect,syncNow,pendingCount} from './sync.js';
export const title='ตั้งค่า';
const get=(o,p)=>p.split('.').reduce((a,k)=>a?.[k],o);
const set=(o,p,v)=>{const ks=p.split('.'),l=ks.pop();ks.reduce((a,k)=>a[k]=a[k]||{},o)[l]=v};
const num=(l,p,u='')=>`<div class="ff"><label>${l}${u?' ('+u+')':''}</label><input class="fld" type="number" step="any" data-in="setv" data-k="${p}" data-t="n" value="${esc(get(S.settings,p))}"></div>`;
const txt=(l,p,full)=>`<div class="ff ${full?'full':''}"><label>${l}</label><input class="fld" data-in="setv" data-k="${p}" value="${esc(get(S.settings,p))}"></div>`;
const sec=(t,sub,body)=>`<div class="card"><h2 class="h2" style="margin-bottom:2px">${t}</h2>${sub?`<div class="mut" style="font-size:.85rem;margin-bottom:12px">${sub}</div>`:''}<div class="fg">${body}</div></div>`;
export function render(){const s=S.settings,th=s.theme||'auto',cfg=getCfg(),st=getStatus();
  const modeSeg=`<div class="seg">${[['auto','อัตโนมัติ'],['light','สว่าง'],['dark','มืด']].map(([v,t])=>`<button class="${th===v?'on':''}" data-act="setTheme" data-v="${v}" type="button">${t}</button>`).join('')}</div>`;
  return`${head('ตั้งค่า','ข้อมูลโครงการ อัตราค่าบริการ กติกา สีหน้าจอ และการเชื่อมต่อ Google Sheet')}
  <div class="card"><h2 class="h2">รูปปกโครงการ (มาตรฐาน 16:9)</h2><div class="g g2" style="align-items:center"><div class="cv" style="border-radius:14px;overflow:hidden"><img src="${esc(coverSrc())}" alt="ปก" style="width:100%;display:block;aspect-ratio:16/9;object-fit:cover"></div>
  <div><p class="mut" style="margin-top:0">ใช้รูปป้ายทางเข้าหรือภาพหน้าโครงการ แนวนอน ความละเอียดตั้งแต่ 1600×900 ให้เห็นป้ายชื่อและโลโก้ผู้พัฒนาชัด ระบบจะครอปกึ่งกลางเป็น 16:9 ให้อัตโนมัติ</p><div class="row"><label class="btn pri" style="cursor:pointer">${ic('camera')} เลือกรูปปก<input type="file" accept="image/*" hidden data-in="setCover"></label>${s.coverId?`<button class="btn" data-act="setCoverClr">ใช้รูปเดิมของระบบ</button>`:''}</div></div></div></div>
  ${sec('ข้อมูลโครงการ','แสดงที่หน้าภาพรวมและแถบเมนู',txt('ชื่อโครงการ','village')+txt('ที่ตั้ง','address')+txt('ผู้พัฒนาโครงการ (ตามป้ายทางเข้า)','developer')+txt('นิติบุคคลฯ / ผู้จัดการ','manager'))}
  ${sec('ค่าส่วนกลาง & ค่าขยะ','',num('ค่าส่วนกลาง บ้านมาตรฐาน','fee.std','บาท/เดือน')+num('ค่าส่วนกลาง บ้านใหญ่','fee.big','บาท/เดือน')+num('ค่าจัดเก็บขยะ','garbageFee','บาท/เดือน')+num('ครบกำหนดชำระวันที่','dueDay','ของเดือน')+num('เบี้ยปรับล่าช้า','lateRate','% ต่อเดือน'))}
  ${sec('อัตราน้ำ-ไฟ ส่วนกลาง','ใช้คำนวณค่าใช้จ่ายจากเลขมิเตอร์',num('ค่าน้ำ','rates.water','บาท/ลบ.ม.')+num('ค่าไฟ','rates.elec','บาท/kWh'))}
  ${sec('กติกาจอดริมถนน & ค่าปรับ','⚠ ต้องมีข้อบังคับหรือมติที่ประชุมใหญ่รองรับก่อนเก็บจริง',num('ครั้งที่ 2','pk.t2','บาท')+num('ครั้งที่ 3 ขึ้นไป','pk.t3','บาท')+num('จอดข้ามคืน','pk.night','บาท')+num('ขวางทางเข้า-ออก','pk.block','บาท')+num('ทับเส้นห้ามจอด','pk.line','บาท')+num('นับซ้ำภายใน','pk.window','วัน'))}
  ${sec('สระว่ายน้ำ','',txt('ชื่อ','fac.pool.name')+num('ความจุ','fac.pool.cap','ที่/ชั่วโมง')+num('เปิด (ชั่วโมง)','fac.pool.open')+num('ปิด (ชั่วโมง)','fac.pool.close')+num('จองได้สูงสุด','fac.pool.max','ที่/บ้าน/วัน'))}
  ${sec('ห้องฟิตเนส','',txt('ชื่อ','fac.fit.name')+num('ความจุ','fac.fit.cap','ที่/ชั่วโมง')+num('เปิด (ชั่วโมง)','fac.fit.open')+num('ปิด (ชั่วโมง)','fac.fit.close')+num('จองได้สูงสุด','fac.fit.max','ที่/บ้าน/วัน'))}
  ${sec('ยอดยกมา (สำหรับงบดุล)','ยอด ณ วันเริ่มใช้ระบบ — ระบบบวกรายการหลังจากนั้นให้เอง',num('เงินสด/เงินฝากธนาคาร','open.cash','บาท')+num('กองทุนสำรอง','open.reserve','บาท')+num('ทรัพย์สินถาวร','open.fixed','บาท')+num('เจ้าหนี้การค้า','open.ap','บาท')+num('ค่าส่วนกลางรับล่วงหน้า','open.prepaid','บาท')+num('เงินประกัน/มัดจำ','open.deposit','บาท'))}
  ${lookCard(0,modeSeg)}
  <div class="card"><h2 class="h2" style="margin-bottom:2px">เชื่อมต่อ Google Sheet</h2><div class="mut" style="font-size:.85rem;margin-bottom:12px">เก็บข้อมูลสำรองและใช้ร่วมกันหลายเครื่อง · ดูวิธีตั้งค่าในไฟล์ SETUP-GoogleSheet.md</div>
  ${cfg?`<div class="ln"><span>สถานะ</span><span>${pill(st.mode==='ok'?'เชื่อมต่อแล้ว':st.mode==='busy'?'กำลังซิงก์':st.mode==='offline'?'ออฟไลน์':st.msg||'ผิดพลาด',st.mode==='ok'?'ok':'wn')}</span></div><div class="ln"><span>รอส่งขึ้น Sheet</span><b>${pendingCount()} รายการ</b></div><div class="row" style="margin-top:12px"><button class="btn pri" data-act="syNow">ซิงก์ตอนนี้</button><button class="btn bad" data-act="syOff">ยกเลิกการเชื่อมต่อ</button></div>`
  :`<div class="fg"><div class="ff full"><label>Web app URL</label><input class="fld" id="syu" placeholder="https://script.google.com/macros/s/.../exec"></div><div class="ff full"><label>รหัสผ่าน (TOKEN)</label><input class="fld" id="syt" type="password"></div></div><div class="row" style="margin-top:12px"><button class="btn pri" data-act="syOn">ทดสอบและเชื่อมต่อ</button></div>`}</div>
  <div class="card"><h2 class="h2">สำรอง / ย้ายข้อมูล</h2><div class="row" style="flex-wrap:wrap"><button class="btn" data-act="bkExp">${ic('download')} ดาวน์โหลดข้อมูลสำรอง (.json)</button><label class="btn" style="cursor:pointer">${ic('up')} นำเข้าข้อมูลสำรอง<input type="file" accept=".json,application/json" hidden data-in="bkImp"></label></div>
  <hr style="border:0;border-top:1px solid var(--line);margin:16px 0"><div class="row" style="flex-wrap:wrap"><button class="btn" data-act="rsDemo">โหลดข้อมูลตัวอย่างใหม่</button><button class="btn bad" data-act="rsClear">ล้างข้อมูลทั้งหมด (เริ่มโครงการจริง)</button></div>${s.demo?'<p class="mut" style="font-size:.85rem;margin-bottom:0">ตอนนี้เป็นข้อมูลตัวอย่าง — เมื่อพร้อมใช้งานจริงให้กด “ล้างข้อมูลทั้งหมด” แล้วเพิ่มบ้านในหน้า ทะเบียนบ้าน</p>':''}</div>
  <div class="card" style="display:flex;gap:14px;align-items:center"><img src="assets/brand/logo-96.png" width="44" height="56" alt="CoreDash Technology"><div><b>CoreDash Village</b><div class="mut" style="font-size:.85rem">พัฒนาโดย CoreDash Technology · ข้อมูลเก็บในเครื่องของคุณ (และ Google Sheet หากเชื่อมต่อ)</div></div></div>`}
const theme=()=>window.dispatchEvent(new Event('cdv-theme'));
IN.setv=(el,e)=>{let v=el.value;if(el.dataset.t==='n')v=v===''?0:+v;set(S.settings,el.dataset.k,v);save();if(e.type==='change'&&/^(village|address|developer|manager)$/.test(el.dataset.k))window.dispatchEvent(new Event('cdv-shell'))};
IN.setCover=async el=>{const f=el.files[0];if(!f)return;try{const d=await cover169(f);const id='cover'+Date.now().toString(36);if(!putPhoto(id,d))return toast('พื้นที่เก็บรูปเต็ม ลองรูปที่เล็กลง');S.settings.coverId=id;save();window.dispatchEvent(new Event('cdv-shell'))}catch(e){toast('อ่านรูปไม่ได้')}};
ACT.setCoverClr=()=>{S.settings.coverId='';save();window.dispatchEvent(new Event('cdv-shell'))};
ACT.setTheme=el=>{clearBg();S.settings.theme=el.dataset.v;save();theme();refresh()};
for(const k of ['lookBg','lookAc','lookSb','lookReset'])ACT[k]=el=>{lookActions[k](el.dataset.v);theme();refresh()};
for(const k of ['lookBgC','lookAcC','lookSbC'])IN[k]=el=>{lookActions[k](el.value);theme()};
ACT.syOn=async()=>{const u=document.getElementById('syu').value.trim(),t=document.getElementById('syt').value.trim();if(!u||!t)return toast('กรอก URL และรหัสผ่าน');try{await ping(u,t);connect(u,t);toast('เชื่อมต่อแล้ว กำลังซิงก์…');await syncNow();refresh()}catch(e){toast('เชื่อมต่อไม่สำเร็จ: '+e.message,6000)}};
ACT.syNow=()=>syncNow().then(()=>{toast('ซิงก์แล้ว');refresh()}).catch(e=>toast(e.message,5000));
ACT.syOff=async()=>{if(!await ask('ยกเลิกการเชื่อมต่อ','ข้อมูลในเครื่องยังอยู่ แต่จะไม่ซิงก์กับ Sheet อีก','ยกเลิกเชื่อมต่อ','bad'))return;disconnect();refresh()};
ACT.bkExp=()=>download('coredash-village-'+new Date().toISOString().slice(0,10)+'.json',new Blob([exportJSON()],{type:'application/json'}));
IN.bkImp=async el=>{const f=el.files[0];if(!f)return;try{importJSON(await f.text());toast('นำเข้าแล้ว');window.dispatchEvent(new Event('cdv-shell'))}catch(e){toast(e.message,5000)}};
ACT.rsDemo=async()=>{if(!await ask('โหลดข้อมูลตัวอย่าง','ข้อมูลปัจจุบันจะถูกแทนที่ทั้งหมด','โหลดตัวอย่าง','bad'))return;reset(true);window.dispatchEvent(new Event('cdv-shell'))};
ACT.rsClear=async()=>{if(!await ask('ล้างข้อมูลทั้งหมด','ลบบ้าน ใบแจ้งหนี้ และรายการทั้งหมดในเครื่องนี้ (ควรดาวน์โหลดข้อมูลสำรองก่อน)','ล้างข้อมูล','bad'))return;reset(false);window.dispatchEvent(new Event('cdv-shell'))};
