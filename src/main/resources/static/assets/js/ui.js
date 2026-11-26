import {getUser,logout,getVenue,seatIds} from './store.js';

export function safe(value) {return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export const params=()=>new URLSearchParams(location.search);
export const go=url=>{location.href=url;};
export const icon=(name,size=19)=>{
 const shapes={
  ticket:'<path d="M2 9a3 3 0 0 0 0 6v4h20v-4a3 3 0 0 1 0-6V5H2v4Z"/><path d="M13 5v2m0 4v2m0 4v2"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chair:'<path d="M5 12V6a7 7 0 0 1 14 0v6M4 12h16v7H4zM7 19v3m10-3v3"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  arrow:'<path d="m5 12 14 0m-6-6 6 6-6 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  edit:'<path d="m16 5 3 3-11 11-4 1 1-4 11-11ZM14 7l3 3"/>',
  trash:'<path d="M4 7h16M9 4h6M6 7l1 14h10l1-14M10 11v6m4-6v6"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  logout:'<path d="M9 3H4v18h5M14 7l5 5-5 5m-9-5h14"/>',
  close:'<path d="M5 5l14 14M19 5 5 19"/>',
  music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
  shield:'<path d="M12 22S4 18 4 11V5l8-3 8 3v6c0 7-8 11-8 11Z"/><path d="m9 12 2 2 4-4"/>'
 };
 return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name]||shapes.ticket}</svg>`;
};

export function renderHeader(active='') {
 const user=getUser(), holder=document.querySelector('#site-header'); if(!holder) return;
 const profile=user ? `<span class="who">${icon('user',17)} ${safe(user.name)}${user.role==='ADMIN'?` <span class="admin-identity">(${safe(user.clubName)} 관리자)</span>`:''}</span>` : '';
 holder.innerHTML=`<header class="site-header"><div class="header-inner">
   <a class="wordmark" href="index.html" aria-label="핸동 클럽박스 메인">HANDONG<span>CLUBBOX</span><i></i></a>
   <span class="wordmark-description">한동대학교 동아리 공연 예매</span>
   <nav class="header-links" aria-label="주 메뉴">${user?`<a class="${active==='mypage'?'active':''}" href="mypage.html">내 예매 내역</a>`:''}${user?.role==='ADMIN'?`<a class="${active==='admin'?'active':''}" href="admin.html">공연 관리</a>`:''}</nav>
   <div class="header-actions">${profile}${user?`<button class="link-action" id="logout-btn">로그아웃</button>`:`<a class="link-action" href="login.html">로그인</a><a class="btn btn-primary btn-sm" href="login.html?mode=signup">회원가입</a>`}</div>
 </div></header>`;
 document.getElementById('logout-btn')?.addEventListener('click',()=>{logout();location.href='index.html';});
}
export function renderFooter(){ const f=document.querySelector('#site-footer');if(f)f.innerHTML=`<footer class="site-footer"><div class="container"><strong>HANDONG<span>CLUBBOX</span></strong><span>한동대학교 동아리 공연 예매 프론트엔드 데모 · 실제 예매 및 결제는 진행되지 않습니다.</span></div></footer>`; }
export function toast(message,type='info'){
 let node=document.querySelector('#toast');if(!node){node=document.createElement('div');node.id='toast';node.className='toast';node.setAttribute('role','status');document.body.append(node);}
 node.textContent=message;node.className=`toast show ${type}`;clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),3600);
}
export function confirmDialog(message,onYes,yesLabel='확인'){
 const wrap=document.createElement('div');wrap.className='modal-backdrop';wrap.innerHTML=`<div class="confirm-modal" role="dialog" aria-modal="true" aria-label="확인"><h2>확인해 주세요</h2><p>${safe(message)}</p><div class="modal-actions"><button class="btn btn-outline" data-no>취소</button><button class="btn btn-primary" data-yes>${safe(yesLabel)}</button></div></div>`;
 document.body.append(wrap);const close=()=>wrap.remove();wrap.querySelector('[data-no]').addEventListener('click',close);wrap.querySelector('[data-yes]').addEventListener('click',()=>{close();onYes();});wrap.addEventListener('click',e=>{if(e.target===wrap)close();});
}
/** Render a seat diagram and return rendered grid. drawAgain is called by the page after state updates. */
export function renderSeatMap(root,{venueId, blocked=[],booked=[],selected=[],clickable=true,toggleBlocked=false,onSeatClick=()=>{}}){
 const venue=getVenue(venueId),blockedSet=new Set(blocked),bookedSet=new Set(booked),selectedSet=new Set(selected);
 const rows=venue.rows.map(row=>`<div class="seat-row"><div class="seat-row-label">${row}</div><div class="seat-cells" style="--seat-cols:${venue.columns}">${Array.from({length:venue.columns},(_,i)=>{
  const id=`${row}${i+1}`,state=selectedSet.has(id)?'selected':(blockedSet.has(id)||bookedSet.has(id))?'unavailable':'available';
  const disabled=!clickable||bookedSet.has(id)||(!toggleBlocked&&blockedSet.has(id));
  return `<button type="button" class="seat ${state}" data-seat="${id}" aria-label="${id} ${state==='available'?'선택 가능':state==='selected'?'선택됨':'선택 불가'}" aria-pressed="${state==='selected'}" ${disabled?'disabled':''}>${i+1}</button>`;
 }).join('')}</div><div class="seat-row-label right">${row}</div></div>`).join('');
 root.innerHTML=`<div class="stage">STAGE</div><div class="seat-rows">${rows}</div>`;
 if(clickable) root.querySelectorAll('[data-seat]').forEach(el=>el.addEventListener('click',()=>onSeatClick(el.dataset.seat)));
}
export function requireUser(){let user=getUser(); if(!user){location.href=`../../../templates/login.html/').pop()+location.search)}`;return null;}return user;}
