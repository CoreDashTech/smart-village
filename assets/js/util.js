/* CoreDash Village — helpers */
export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const uid=(p='')=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
export const pad=(n,w=2)=>String(n).padStart(w,'0');
export const DAY=86400000;
export const startOfDay=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
const TH_M=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const TH_MF=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const TH_D=['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
export const dowTh=t=>TH_D[new Date(t).getDay()];
export const monthName=(m,full=false)=>(full?TH_MF:TH_M)[m];
export const fDate=(t,y=false)=>{const d=new Date(t);return d.getDate()+' '+TH_M[d.getMonth()]+(y?' '+(d.getFullYear()+543):'')};
export const fTime=t=>{const d=new Date(t);return pad(d.getHours())+':'+pad(d.getMinutes())};
export const fTimeS=t=>{const d=new Date(t);return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds())};
export const fDT=t=>fDate(t,true)+' · '+fTime(t);
export const fDTS=t=>pad(new Date(t).getDate())+'/'+pad(new Date(t).getMonth()+1)+'/'+String(new Date(t).getFullYear()+543).slice(2)+' '+fTimeS(t);
export const ymd=t=>{const d=new Date(t);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
export const ym=t=>{const d=new Date(t);return d.getFullYear()+'-'+pad(d.getMonth()+1)};
export const ymLabel=k=>{const [y,m]=k.split('-');return TH_M[+m-1]+' '+(+y+543)};
export const ymLabelFull=k=>{const [y,m]=k.split('-');return TH_MF[+m-1]+' '+(+y+543)};
export const ymAdd=(k,n)=>{const [y,m]=k.split('-').map(Number);const d=new Date(y,m-1+n,1);return d.getFullYear()+'-'+pad(d.getMonth()+1)};
export const ymStart=k=>{const [y,m]=k.split('-').map(Number);return new Date(y,m-1,1).getTime()};
export const fNum=(n,d=0)=>Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
export const baht=n=>'฿'+fNum(Math.round(n||0));
export const fPct=(a,b,d=1)=>b?fNum(a/b*100,d)+'%':'—';
export function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
export function debounce(f,ms=200){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}}
export function download(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
export function csv(rows){return '﻿'+rows.map(r=>r.map(v=>{v=v==null?'':String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(',')).join('\r\n')}
export const sum=(a,f=x=>x)=>a.reduce((x,y)=>x+(+f(y)||0),0);
export const normPlate=p=>String(p||'').replace(/[\s\-.]/g,'').toLowerCase();
/* ย่อรูป → dataURL (jpeg) */
export function shrink(file,maxW=1200,q=.8){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,maxW/im.width),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',q))};im.onerror=rej;im.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
/* ครอปรูปเป็น 16:9 (กึ่งกลาง) กว้างสูงสุด 1600 */
export function cover169(file,maxW=1600,q=.82){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{let sw=im.width,sh=sw*9/16;if(sh>im.height){sh=im.height;sw=sh*16/9}const sx=(im.width-sw)/2,sy=(im.height-sh)/2,w=Math.min(maxW,Math.round(sw)),h=Math.round(w*9/16),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,sx,sy,sw,sh,0,0,w,h);res(c.toDataURL('image/jpeg',q))};im.onerror=rej;im.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
