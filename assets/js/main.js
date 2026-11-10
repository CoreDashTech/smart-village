import {applyLook,clearBg} from './look.js';
import {S,init,onChange,save,coverSrc,getHouse,houseByPlate} from './store.js';
import {ACT,IN,ic,setRefresh,go,toast,closeModal} from './ui.js';
import {esc} from './util.js';
import {initSync,onStatus,isOn,syncNow,getStatus} from './sync.js';
import * as overview from './overview.js';import * as fees from './fees.js';import * as utilities from './utilities.js';import * as facilities from './facilities.js';import * as services from './services.js';import * as gate from './gate.js';import * as parking from './parking.js';import * as finance from './finance.js';import * as news from './news.js';import * as houses from './houses.js';import * as settings from './settings.js';
const R={overview,fees,utilities,facilities,services,gate,parking,finance,news,houses,settings};
export const NAV=[['overview','home','ภาพรวม'],['fees','wallet','ค่าส่วนกลาง'],['utilities','bolt','น้ำ · ไฟ · ขยะ'],['facilities','cal','จองสระ / ฟิตเนส'],['services','truck','รถขยะ & งานส่วนกลาง'],['gate','car','รถเข้า-ออก'],['parking','park','จอดริมถนน & ค่าปรับ'],['finance','chart','การเงิน & งบดุล'],['news','mega','ประกาศ & แจ้งซ่อม'],['houses','users','ทะเบียนบ้าน'],['settings','gear','ตั้งค่า']];
let deferred=null;
function theme(){const t=S.settings.theme||'auto';document.documentElement.dataset.theme=t==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;applyLook()}
function shell(){const app=document.getElementById('app');
  app.innerHTML=`<aside class="side"><a class="brand" href="#/overview"><img src="assets/brand/logo-96.png" alt="CoreDash Technology"><div><b>CoreDash</b><small>Village</small></div></a>
  <a class="vp" href="#/settings" aria-label="รูปโครงการ"><img id="vpi" src="${esc(coverSrc())}" alt="ป้ายโครงการ"><div>${esc(S.settings.village)} · ${esc(S.settings.address)}</div></a>
  <nav class="nav" aria-label="เมนูหลัก">${NAV.map(([k,i,t])=>`<a href="#/${k}" data-nav="${k}">${ic(i)}<span>${t}</span></a>`).join('')}</nav><div class="sp"></div>
  <div class="plant"><b>${esc(S.settings.village)}</b><small>${S.houses.length} หลัง · ${esc(S.settings.manager)}</small></div><button class="btn sm" id="inst" style="display:none;margin:8px 0">${ic('download')} ติดตั้งแอป</button></aside>
  <div class="main"><header class="top"><img class="mlogo" src="assets/brand/logo-96.png" alt="CoreDash" width="27" height="34"><span class="crumb"><b id="crumb"></b></span><span class="sp"></span>
  <form class="gs" id="gsf" role="search">${ic('search')}<input id="gs" placeholder="ค้นหาบ้านเลขที่ / ทะเบียน / ชื่อ" autocomplete="off" aria-label="ค้นหา"></form>
  <button class="ib" id="cld" aria-label="ซิงก์" style="position:relative">${ic('up')}<i id="cdot" style="position:absolute;right:8px;top:8px;width:9px;height:9px;border-radius:50%;background:var(--mut);border:2px solid var(--surface)"></i></button>
  <button class="ib" id="thm" aria-label="สลับธีม">${ic('moon')}</button><a class="ib" href="#/settings" aria-label="ตั้งค่า">${ic('gear')}</a></header><main id="view" tabindex="-1"></main></div>
  <nav class="bnav" aria-label="เมนู">${NAV.map(([k,i,t])=>`<a href="#/${k}" data-nav="${k}">${ic(i)}<span>${t.split(' ')[0]}</span></a>`).join('')}</nav>`;
  document.getElementById('gsf').onsubmit=e=>{e.preventDefault();const v=document.getElementById('gs').value.trim();if(!v)return;document.getElementById('gs').value='';
    const h=getHouse(v)||houseByPlate(v)||S.houses.find(h=>h.owner.includes(v)||h.no.startsWith(v+'/'));go(h?'/houses/'+encodeURIComponent(h.no):'/gate/'+encodeURIComponent(v))};
  document.getElementById('thm').onclick=()=>{const d=document.documentElement.dataset.theme==='dark';clearBg();S.settings.theme=d?'light':'dark';save();theme()};
  document.getElementById('cld').onclick=()=>{if(isOn())syncNow().then(()=>toast('ซิงก์แล้ว')).catch(e=>toast(e.message,5000));else go('/settings')};paintCloud();
  const ib=document.getElementById('inst');ib.onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;ib.style.display='none'};if(deferred)ib.style.display=''}
function paintCloud(){const b=document.getElementById('cld'),d=document.getElementById('cdot');if(!b)return;const s=getStatus();
  const c=!isOn()?['var(--line)','ยังไม่เชื่อมต่อ Google Sheet']:s.mode==='ok'?['var(--ok)','ซิงก์แล้ว']:s.mode==='busy'?['var(--info)','กำลังซิงก์…']:s.mode==='offline'?['var(--warn)','ออฟไลน์']:['var(--bad)',s.msg||'ซิงก์ไม่สำเร็จ'];
  d.style.background=c[0];b.title=c[1];b.setAttribute('aria-label',c[1]);b.classList.toggle('spin',s.mode==='busy')}
function parts(){const h=location.hash.replace(/^#\/?/,'')||'overview';return h.split('/').map(decodeURIComponent)}
function paint(keepScroll){const p=parts(),k=R[p[0]]?p[0]:'overview',v=R[k],view=document.getElementById('view'),y=window.scrollY;
  try{view.innerHTML=v.render(p.slice(1));if(v.mount)v.mount(p.slice(1))}catch(e){console.error(e);view.innerHTML=`<div class="card empty-s"><h2>แสดงผลไม่สำเร็จ</h2><p class="mut">${esc(e.message)}</p><a class="btn pri" href="#/overview">กลับหน้าแรก</a></div>`}
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('on',a.dataset.nav===k));document.getElementById('crumb').textContent=v.title;document.title=v.title+' · '+S.settings.village;
  window.scrollTo(0,keepScroll?y:0)}
const route=()=>{closeModal();paint(false)};
function start(){init();theme();shell();setRefresh(()=>paint(true));onStatus(paintCloud);initSync();
  window.addEventListener('cdv-synced',()=>{if(document.getElementById('modal')||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||''))return;paint(true)});
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',theme);
  window.addEventListener('cdv-theme',()=>theme());window.addEventListener('cdv-shell',()=>{shell();paint(true)});
  window.addEventListener('cdv-error',e=>toast(e.detail,5000));window.addEventListener('hashchange',route);
  document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(a&&ACT[a.dataset.act]){e.preventDefault();ACT[a.dataset.act](a,e);return}
    const g=e.target.closest('[data-go]');if(g&&!e.target.closest('a,button,input,select,label')){location.hash=g.dataset.go.replace(/^#/,'')}});
  const hin=e=>{const t=e.target.closest('[data-in]');if(t&&IN[t.dataset.in])IN[t.dataset.in](t,e)};
  document.addEventListener('input',e=>{const t=e.target;if(t.type==='file'||t.tagName==='SELECT')return;hin(e)});document.addEventListener('change',hin);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;const b=document.getElementById('inst');if(b)b.style.display=''});
  if(!location.hash)location.hash='/overview';route();
  if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{})}
let started=false;const boot=()=>{if(started)return;started=true;start()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
