import {getPerformance, getVenue, niceDate, remainingSeats} from '../store.js';
import {
    params,
    renderHeader,
    renderFooter,
    icon,
    safe,
    toast
} from '../ui.js';

renderHeader();
renderFooter();
const id = params().get('id') || 'echo', p = getPerformance(id), root = document.querySelector('#performance-detail');
if (!p) {
    root.innerHTML = '<div class="empty-box">공연을 찾을 수 없습니다. <a href="index.html">공연 목록으로</a></div>';
} else {
    let dateIdx = 0, sessionId = p.dates[0]?.sessions?.[0]?.id;
    const venue = getVenue(p.venueId);
    root.innerHTML = `<section class="detail-content"><div class="detail-info"><img class="detail-poster" src="${safe(p.image)}" alt="${safe(p.title)} 포스터"><div class="detail-description"><span class="pill">${safe(p.type)} 공연</span><h1>${safe(p.title)}</h1><p class="detail-subtitle">${safe(p.subtitle || p.clubName)}</p><div class="details-list"><div class="meta-line">${icon('pin')}<b>공연 장소</b><span>한동대학교 ${safe(venue.name)}</span></div><div class="meta-line">${icon('calendar')}<b>공연 기간</b><span>${niceDate(p.dates[0].date)} ~ ${niceDate(p.dates.at(-1).date)}</span></div><div class="meta-line">${icon('music')}<b>공연 회차</b><span>1공 ~ 최대 ${Math.max(...p.dates.map(d => d.sessions.length))}공</span></div><div class="meta-line">${icon('ticket')}<b>공연 금액</b><span>${Number(p.price) ? Number(p.price).toLocaleString('ko-KR') + '원 / 석' : '무료'}</span></div></div><h3>공연 소개</h3><p class="detail-long">${safe(p.description)}</p></div></div><aside class="panel booking-panel"><h2>날짜 선택</h2><div class="date-grid" id="date-options"></div><div class="divider"></div><h2>회차 선택</h2><div class="session-grid" id="session-options"></div><div class="summary-box" id="booking-summary"></div><button class="btn btn-primary btn-block" id="go-seats">${icon('chair', 20)} 좌석 선택하기 ${icon('arrow', 17)}</button></aside></section>`;
    const dateOptions = document.querySelector('#date-options'),
        sessionOptions = document.querySelector('#session-options');

    function draw() {
        dateOptions.innerHTML = p.dates.map((day, i) => `<button class="choice ${i === dateIdx ? 'active' : ''}" data-date="${i}" aria-pressed="${i === dateIdx}">${niceDate(day.date).slice(5)}</button>`).join('');
        const day = p.dates[dateIdx];
        if (!day.sessions.some(s => s.id === sessionId)) sessionId = day.sessions[0]?.id;
        sessionOptions.innerHTML = day.sessions.map(s => {
            const remaining = remainingSeats(p, s.id);
            return `<button class="choice ${s.id === sessionId ? 'active' : ''}" data-session="${safe(s.id)}" aria-pressed="${s.id === sessionId}" ${remaining === 0 ? 'disabled' : ''}><strong>${safe(s.label)}</strong><span class="sub">잔여 ${remaining}석</span></button>`;
        }).join('');
        const s = day.sessions.find(x => x.id === sessionId), available = s ? remainingSeats(p, s.id) : 0;
        document.querySelector('#booking-summary').innerHTML = `<h3>${icon('ticket', 17)} 선택한 공연 정보</h3><div class="summary-line"><span>선택한 날짜</span><strong>${niceDate(day.date)}</strong></div><div class="summary-line"><span>선택한 회차</span><strong>${s ? safe(s.label) + ' · ' + safe(s.time) : '없음'}</strong></div><div class="summary-line"><span>공연 장소</span><strong>${safe(venue.name)}</strong></div><div class="summary-line"><span>잔여 좌석</span><strong class="summary-highlight">${available}석</strong></div><div class="summary-line"><span>1석 금액</span><strong>${Number(p.price) ? Number(p.price).toLocaleString('ko-KR') + '원' : '무료'}</strong></div>`;
        dateOptions.querySelectorAll('[data-date]').forEach(b => b.addEventListener('click', () => {
            dateIdx = Number(b.dataset.date);
            sessionId = null;
            draw();
        }));
        sessionOptions.querySelectorAll('[data-session]').forEach(b => b.addEventListener('click', () => {
            sessionId = b.dataset.session;
            draw();
        }));
        document.querySelector('#go-seats').disabled = !s || !available;
    }

    draw();
    document.querySelector('#go-seats').addEventListener('click', () => {
        if (!sessionId) {
            toast('회차를 선택해 주세요', 'error');
            return;
        }
        location.href = `seats.html?id=${encodeURIComponent(p.id)}&session=${encodeURIComponent(sessionId)}`;
    });
}
