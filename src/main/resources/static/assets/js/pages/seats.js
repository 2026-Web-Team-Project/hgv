import {
    getPerformance,
    getVenue,
    locateSession,
    remainingSeats,
    takenSeats,
    reserveSeats,
    niceDate,
    getUser
} from '../store.js';
import {
    params,
    renderHeader,
    renderFooter,
    renderSeatMap,
    icon,
    safe,
    toast,
    go
} from '../ui.js';

renderHeader();
renderFooter();
const id = params().get('id') || 'echo', p = getPerformance(id),
    sessionId = params().get('session') || p?.dates?.[0]?.sessions?.[0]?.id, slot = locateSession(p, sessionId),
    root = document.querySelector('#seats-content');
if (!p || !slot) root.innerHTML = '<div class="empty-box">공연 회차를 찾을 수 없습니다. <a href="index.html">공연 목록으로</a></div>';
else {
    const venue = getVenue(p.venueId);
    let selected = [];
    root.innerHTML = `<div class="panel selected-event"><img src="${safe(p.image)}" alt="${safe(p.title)} 포스터"><div><span class="pill">${safe(slot.session.label)}</span><h1>${safe(p.title)}</h1><div class="muted">${safe(p.clubName)} · 한동대학교 ${safe(venue.name)}</div></div><div class="event-side-meta"><div><div class="muted">공연일</div><b>${niceDate(slot.date)}</b></div><div><div class="muted">회차 / 시간</div><b>${safe(slot.session.label)} · ${safe(slot.session.time)}</b></div></div></div>
 <div class="seats-layout"><section class="panel seat-panel"><div class="panel-head"><h2>${icon('chair', 22)} 좌석 선택</h2><div class="legend"><span class="legend-item"><i class="legend-box"></i>선택 가능</span><span class="legend-item"><i class="legend-box selected"></i>선택한 좌석</span><span class="legend-item"><i class="legend-box unavailable"></i>선택 불가 / 예약됨</span></div></div><div id="seat-map"></div><p class="small-caption" id="remaining-count" style="text-align:right;margin:14px 0 0"></p></section>
 <aside class="panel checkout-panel"><h2>예매 정보</h2><div class="checkout-item"><span>공연명</span><strong>${safe(p.title)}</strong></div><div class="checkout-item"><span>날짜 / 회차</span><strong>${niceDate(slot.date)}<br>${safe(slot.session.label)} · ${safe(slot.session.time)}</strong></div><div class="checkout-item"><span>선택 좌석</span><div class="seat-tags" id="chosen-seats"><span class="muted">선택한 좌석이 없습니다.</span></div></div><div class="checkout-item"><span>선택 좌석 수</span><strong id="seat-count">0석</strong></div><div class="checkout-item"><span>1석 금액</span><strong>${Number(p.price) ? Number(p.price).toLocaleString('ko-KR') + '원' : '무료'}</strong></div><div class="checkout-total"><span>예매 금액</span><strong id="booking-total">0원</strong></div><button class="btn btn-primary btn-block" id="book-btn" disabled>${icon('ticket', 19)} 예매 확정</button><p class="text-note">원하는 좌석을 직접 선택하세요. 최대 6석까지 가능합니다.<br>현재는 프론트엔드 데모로 예매 내역만 저장되며, 실제 결제는 진행되지 않습니다.</p></aside></div>`;
    const map = document.querySelector('#seat-map'), chosen = document.querySelector('#chosen-seats'),
        count = document.querySelector('#seat-count'), btn = document.querySelector('#book-btn');

    function draw() {
        const taken = takenSeats(p.id, sessionId);
        selected = selected.filter(s => !taken.includes(s));
        renderSeatMap(map, {
            venueId: p.venueId, blocked: slot.session.blocked || [], booked: taken, selected, onSeatClick(seat) {
                if (selected.includes(seat)) selected = selected.filter(s => s !== seat);
                else if (selected.length >= 6) {
                    toast('한 번에 최대 6석까지만 선택할 수 있어요.', 'error');
                    return;
                } else selected = [...selected, seat];
                draw();
            }
        });
        chosen.innerHTML = selected.length ? selected.map(s => `<span class="seat-tag">${safe(s)} <button data-remove="${safe(s)}" aria-label="${safe(s)} 좌석 선택 해제">×</button></span>`).join('') : '<span class="muted">선택한 좌석이 없습니다.</span>';
        chosen.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
            selected = selected.filter(s => s !== b.dataset.remove);
            draw();
        }));
        count.textContent = `${selected.length}석`;
        btn.disabled = selected.length === 0;
        document.querySelector('#booking-total').textContent = selected.length * Number(p.price || 0) ? (selected.length * Number(p.price || 0)).toLocaleString('ko-KR') + '원' : '무료';
        document.querySelector('#remaining-count').textContent = `남은 좌석 ${remainingSeats(p, sessionId)}석`;
    }

    draw();
    btn.addEventListener('click', () => {
        if (!selected.length) return;
        const user = getUser();
        if (!user) {
            go(`login.html?next=${encodeURIComponent(`seats.html?id=${p.id}&session=${sessionId}`)}`);
            return;
        }
        try {
            const r = reserveSeats({performanceId: p.id, sessionId, seats: selected, userId: user.id});
            go(`mypage.html?booked=${encodeURIComponent(r.id)}`);
        } catch (err) {
            toast(err.message, 'error');
            draw();
        }
    });
}
