/* shared UI helpers */
import {esc} from './util.js';
const P={home:'<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
wallet:'<path d="M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 0V6a2 2 0 012-2h11M16 14h2"/>',
bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
cal:'<path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"/>',
truck:'<path d="M2 6h11v9H2zM13 9h4l4 3v3h-8M6 16.5v.01M17 16.5v.01"/>',
car:'<path d="M3 13l2-6h14l2 6M3 13v5h3v-2h12v2h3v-5M3 13h18M7 15h.01M17 15h.01"/>',
park:'<path d="M8 20V4h5a4 4 0 010 8H8"/>',
chart:'<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',
mega:'<path d="M3 11v3l12 5V6L3 11zM15 8a4 4 0 010 8M6 15l1 5h3l-1-4"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
camera:'<path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.5"/>',
download:'<path d="M12 3v12m0 0l-4-4m4 4l4-4M4 20h16"/>',check:'<path d="M5 12.5l4.5 4.5L19 7"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',
alert:'<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18.5v.1"/>',moon:'<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
up:'<path d="M12 19V5m0 0l-5 5m5-5l5 5"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
qr:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.1M14 21h3M21 17v4"/>',
chev:'<path d="M9 6l6 6-6 6"/>',pin:'<path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
send:'<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/>',img:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.7"/><path d="M21 16l-5-5-8 8"/>'};
export const ic=n=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${P[n]||''}</svg>`;
export const ACT={},IN={};
export let refresh=()=>{};export const setRefresh=f=>{refresh=f};
export const go=h=>{if(location.hash==='#'+h)refresh();else location.hash=h};
let tt;export function toast(msg,ms=2600){let t=document.querySelector('.toast');if(t)t.remove();t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);clearTimeout(tt);tt=setTimeout(()=>t.remove(),ms)}
export function modal(html,{wide=false}={}){closeModal();const m=document.createElement('div');m.className='mod';m.id='modal';m.innerHTML=`<div class="box" role="dialog" aria-modal="true" ${wide?'style="width:min(760px,100%)"':''}>${html}</div>`;m.addEventListener('mousedown',e=>{if(e.target===m)closeModal()});document.body.appendChild(m);const f=m.querySelector('[autofocus]');if(f)setTimeout(()=>f.focus(),40);return m}
export const closeModal=()=>{const m=document.getElementById('modal');if(m)m.remove()};
export function ask(title,msg,okLabel='ตกลง',cls='pri'){return new Promise(res=>{modal(`<h2>${esc(title)}</h2><p class="mut" style="margin:0">${esc(msg)}</p><div class="acts"><button class="btn" data-x="0">ยกเลิก</button><button class="btn ${cls}" data-x="1">${esc(okLabel)}</button></div>`);document.getElementById('modal').addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(b){closeModal();res(b.dataset.x==='1')}})})}
/* ฟอร์มใน modal: fields=[{k,label,type,value,opts,ph,full}] → Promise<object|null> */
export function form(title,fields,{ok='บันทึก',note=''}={}){return new Promise(res=>{
  const fld=f=>{const id='f_'+f.k,v=f.value??'';let c;
    if(f.type==='select')c=`<select id="${id}" class="fld">${f.opts.map(o=>{const [a,b]=Array.isArray(o)?o:[o,o];return`<option value="${esc(a)}" ${String(a)===String(v)?'selected':''}>${esc(b)}</option>`}).join('')}</select>`;
    else if(f.type==='textarea')c=`<textarea id="${id}" class="fld" rows="3" placeholder="${esc(f.ph||'')}">${esc(v)}</textarea>`;
    else if(f.type==='check')c=`<label class="chk"><input id="${id}" type="checkbox" ${v?'checked':''}> ${esc(f.hint||'')}</label>`;
    else c=`<input id="${id}" class="fld" type="${f.type||'text'}" value="${esc(v)}" placeholder="${esc(f.ph||'')}" ${f.step?`step="${f.step}"`:''} ${f.list?`list="${f.list}"`:''} autocomplete="off">`;
    return`<div class="ff ${f.full?'full':''}"><label for="${id}">${esc(f.label)}</label>${c}</div>`};
  const m=modal(`<h2>${esc(title)}</h2>${note?`<p class="mut" style="margin:0 0 12px;font-size:.9rem">${note}</p>`:''}<form id="mf"><div class="fg">${fields.map(fld).join('')}</div><div class="acts"><button type="button" class="btn" data-x="0">ยกเลิก</button><button class="btn pri" type="submit">${esc(ok)}</button></div></form>`);
  const f0=m.querySelector('input,select,textarea');if(f0&&f0.type!=='checkbox')setTimeout(()=>f0.focus(),50);
  m.querySelector('[data-x="0"]').onclick=()=>{closeModal();res(null)};
  m.querySelector('#mf').onsubmit=e=>{e.preventDefault();const o={};fields.forEach(f=>{const el=m.querySelector('#f_'+f.k);o[f.k]=f.type==='check'?el.checked:f.type==='number'?(el.value===''?null:+el.value):el.value.trim()});closeModal();res(o)}})}
export const pill=(t,c='')=>`<span class="pill ${c}">${esc(t)}</span>`;
export const plate=p=>`<span class="pl">${esc(p)}</span>`;
export function tabs(cur,list,act){return`<div class="chips">${list.map(([k,l])=>`<button type="button" class="chip${cur===k?' on':''}" data-act="${act}" data-v="${esc(k)}">${esc(l)}</button>`).join('')}</div>`}
export const empty=(t)=>`<div class="empty-s">${esc(t)}</div>`;
export const head=(t,s='',a='')=>`<div class="hd"><div><h1 class="h1">${esc(t)}</h1>${s?`<div class="sub">${s}</div>`:''}</div><div class="row">${a}</div></div>`;
