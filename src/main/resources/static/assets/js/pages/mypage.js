import {
    getUser,
    setUser,
    getReservations,
    getPerformance,
    getVenue,
    locateSession,
    niceDate,
    cancelReservation
} from '../store.js';
import {
    renderHeader,
    renderFooter,
    requireUser,
    icon,
    safe,
    toast,
    confirmDialog,
    params
} from '../ui.js';

const user = requireUser();
if (user) {
    renderHeader('mypage');
    renderFooter();
    const profile = document.querySelector('#profile'), list = document.querySelector('#reservation-list');

    function drawProfile() {
        profile.innerHTML = `<section class="panel profile"><div class="avatar">${icon('user', 34)}</div><div><h2>${safe(user.name)}</h2><p>${safe(user.studentId)} · 한동대학교${user.role === 'ADMIN' ? ` · ${safe(user.clubName)} 관리자` : ''}</p></div><button class="btn btn-outline btn-sm" id="edit-profile">${icon('edit', 16)} 회원정보 수정</button></section>${user.role === 'ADMIN' ? `<section class="panel admin-quick-actions"><div><span class="pill">${safe(user.clubName)} 관리자</span><h3>공연을 관리해 보세요</h3><p>관리자로 등록된 계정에서만 공연 등록과 수정·삭제를 이용할 수 있습니다.</p></div><div class="admin-quick-buttons"><a class="btn btn-primary" href="admin.html?create=1">${icon('plus', 17)} 공연 등록하기</a><a class="btn btn-outline" href="admin.html">공연 관리</a></div></section>` : ''}`;
        document.querySelector('#edit-profile').addEventListener('click', () => {
            const revised = prompt('변경할 이름을 입력하세요.', user.name);
            if (revised === null) return;
            const clean = revised.trim();
            if (!clean) {
                toast('이름을 입력해 주세요.', 'error');
                return;
            }
            user.name = clean;
            setUser(user);
            drawProfile();
            renderHeader('mypage');
            toast('회원정보가 수정되었습니다.');
        });
    }

    function drawReservations() {
        const mine = getReservations().filter(r => r.userId === user.id);
        list.innerHTML = mine.length ? mine.map(r => {
            const p = getPerformance(r.performanceId);
            if (!p) return '';
            const s = locateSession(p, r.sessionId), venue = getVenue(p.venueId), cancelled = r.status === 'CANCELLED';
            return `<article class="panel reservation-card"><img class="thumb" src="${safe(p.image)}" alt="${safe(p.title)} 포스터"><div class="reservation-main"><h3>${safe(p.title)}</h3><div class="reservation-meta">${icon('calendar', 16)} ${niceDate(r.date)} · ${s ? safe(s.session.label) + ' ' + safe(s.session.time) : '지난 회차'}</div><div class="reservation-meta">${icon('pin', 16)} 한동대학교 ${safe(venue.name)}</div><div class="reservation-meta">${icon('chair', 16)} ${r.seats.map(safe).join(', ')} (${r.seats.length}석)</div></div><div class="reservation-actions"><span class="status ${cancelled ? 'cancelled' : 'confirmed'}">${cancelled ? '예매 취소' : '예매 완료'}</span><a class="btn btn-outline btn-sm" href="performance.html?id=${encodeURIComponent(p.id)}">공연 상세</a>${cancelled ? '' : `<button class="btn btn-outline btn-sm" data-cancel="${safe(r.id)}">취소하기</button>`}</div></article>`;
        }).join('') : '<div class="empty-box">아직 예매한 공연이 없습니다.<br><a class="btn btn-primary" href="index.html" style="margin-top:18px">공연 보러 가기</a></div>';
        list.querySelectorAll('[data-cancel]').forEach(b => b.addEventListener('click', () => confirmDialog('이 예매를 취소하시겠습니까? 취소하면 선택 좌석을 다시 예매할 수 있습니다.', () => {
            try {
                cancelReservation(b.dataset.cancel, user.id);
                drawReservations();
                toast('예매가 취소되었습니다.');
            } catch (err) {
                toast(err.message, 'error');
            }
        }, '예매 취소')));
    }

    drawProfile();
    drawReservations();
    if (params().get('booked')) {
        toast('예매가 완료되었습니다. 내 예매 내역에서 확인하세요.');
        history.replaceState({}, '', 'mypage.html');
    }
}
