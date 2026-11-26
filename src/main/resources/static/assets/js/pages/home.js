import {getPerformances,getFirstSession,getVenue,niceDate} from '../store.js';
import {renderHeader,renderFooter,icon,safe} from '../ui.js';
renderHeader('home');renderFooter();
const list=document.querySelector('#performance-list'),performances=getPerformances();
if(!performances.length) list.innerHTML='<div class="empty-box">등록된 공연이 없습니다.</div>';
else list.innerHTML=performances.map(p=>{
 const first=getFirstSession(p),venue=getVenue(p.venueId);
 return `<article class="performance-card"><a href="performance.html?id=${encodeURIComponent(p.id)}"><img class="poster" src="${safe(p.image)}" alt="${safe(p.title)} 포스터"></a><div class="performance-card-body"><h3>${safe(p.title)}</h3><div class="club">${safe(p.subtitle||p.clubName)}</div><div class="meta-line">${icon('calendar',17)}<span>${first?niceDate(first.date)+' '+safe(first.session.time):'일정 미정'}</span></div><div class="meta-line">${icon('pin',17)}<span>한동대학교 ${safe(venue.name)}</span></div><a class="btn btn-primary btn-block" href="performance.html?id=${encodeURIComponent(p.id)}">${icon('ticket',18)} 예매하기</a></div></article>`;
}).join('');
