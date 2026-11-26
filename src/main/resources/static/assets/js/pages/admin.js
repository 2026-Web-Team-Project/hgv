import {
    getUser,
    getPerformances,
    getPerformance,
    getReservations,
    getVenue,
    seatIds,
    VENUES,
    savePerformance,
    deletePerformance,
    resetDemo,
    takenSeats,
    logout,
    niceDate
} from '../store.js';
import {
    icon,
    safe,
    renderSeatMap,
    toast,
    confirmDialog,
    go
} from '../ui.js';
const user = getUser();
if (!user) {
    go(`login.html?next=${encodeURIComponent('admin.html')}`);
} else if (user.role !== 'ADMIN') {
    go('mypage.html');
} else {
    document.querySelector('#admin-identity').innerHTML = `${icon('user', 19)} ${safe(user.name)} (${safe(user.clubName)} 관리자) <button class="link-action" id="admin-logout">로그아웃</button>`;
    document.querySelector('#admin-logout').addEventListener('click', () => {
        logout();
        go('index.html');
    });
    const rows = document.querySelector('#admin-rows'), search = document.querySelector('#performance-search'),
        filter = document.querySelector('#venue-filter');

    function myPerformances() {
        return getPerformances().filter(p => p.clubId === user.clubId);
    }

    function drawTable() {
        const term = search.value.trim().toLowerCase(), venueId = filter.value;
        const items = myPerformances().filter(p => p.title.toLowerCase().includes(term) && (!venueId || p.venueId === venueId));
        rows.innerHTML = items.map(p => {
            const total = p.dates.reduce((a, d) => a + d.sessions.length, 0),
                booked = getReservations().filter(r => r.performanceId === p.id && r.status === 'CONFIRMED').reduce((a, r) => a + r.seats.length, 0);
            return `<tr><td><div class="name-cell"><img class="mini-thumb" src="${safe(p.image)}" alt=""><strong>${safe(p.title)}</strong></div></td><td>${niceDate(p.dates[0].date)}</td><td>${safe(getVenue(p.venueId).name)}</td><td>총 ${total}회</td><td>${booked}석 예매</td><td><div class="table-actions"><button class="btn btn-outline btn-sm" data-edit="${safe(p.id)}">${icon('edit', 14)} 수정</button><button class="btn btn-danger btn-sm" data-delete="${safe(p.id)}">${icon('trash', 14)} 삭제</button></div></td></tr>`;
        }).join('') || '<tr><td colspan="6" style="text-align:center;padding:45px;color:#8893a4">해당하는 공연이 없습니다.</td></tr>';
        document.querySelector('#admin-count').textContent = `내 동아리 공연 ${items.length}건 · 다른 동아리 공연은 관리할 수 없습니다.`;
        rows.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEditor(getPerformance(btn.dataset.edit))));
        rows.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => confirmDialog('공연을 삭제하시겠습니까? 이미 예매된 공연은 삭제할 수 없습니다.', () => {
            try {
                deletePerformance(btn.dataset.delete);
                drawTable();
                toast('공연이 삭제되었습니다.');
            } catch (err) {
                toast(err.message, 'error');
            }
        }, '삭제')));
    }

    search.addEventListener('input', drawTable);
    filter.addEventListener('change', drawTable);
    document.querySelector('#new-performance').addEventListener('click', () => openEditor(null));
    document.querySelector('#reset-data').addEventListener('click', () => confirmDialog('샘플 공연 및 예매 데이터가 초기 상태로 돌아갑니다. 계속하시겠습니까?', () => {
        resetDemo();
        drawTable();
        toast('데모 데이터가 초기화되었습니다.');
    }, '초기화'));
    drawTable();
    if (new URLSearchParams(location.search).get('create') === '1') openEditor(null);

    function newSlot(id, i) {
        return {id: `${id}-s${i + 1}`, label: `${i + 1}공`, time: ['12:00', '14:30', '17:00', '19:00'][i], blocked: []};
    }

    function freshPerformance() {
        const id = `p-${Date.now()}`;
        const future = new Date();
        future.setDate(future.getDate() + 7);
        const local = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
        return {
            id,
            clubId: user.clubId,
            clubName: user.clubName,
            title: '',
            subtitle: user.clubName,
            type: '공연',
            venueId: 'chapel',
            description: '',
            price: 0,
            image: '',
            dates: [{date: local, sessions: [newSlot(`${id}-d1`, 0)]}]
        };
    }

    function openEditor(original) {
        const draft = original ? structuredClone(original) : freshPerformance();
        let dayIndex = 0, slotId = draft.dates[0]?.sessions[0]?.id;
        let sessionCount = Math.max(1, ...draft.dates.map(day => day.sessions.length));
        const existingBookings = getReservations().filter(r => r.performanceId === draft.id && r.status === 'CONFIRMED');
        const holder = document.querySelector('#admin-modal-holder');
        const venueOptions = Object.values(VENUES).map(v => `<option value="${v.id}" ${v.id === draft.venueId ? 'selected' : ''}>${safe(v.name)}</option>`).join('');
        holder.innerHTML = `<div class="modal-backdrop" id="editor-backdrop"><section class="admin-modal" role="dialog" aria-modal="true" aria-label="공연 ${original ? '수정' : '등록'}"><div class="admin-modal-head"><h2>${icon('ticket', 22)} 공연 ${original ? '수정' : '등록'}</h2><button class="icon-btn" id="editor-close" aria-label="닫기">${icon('close', 18)}</button></div><form class="admin-form" id="performance-form"><div class="form-grid">
    <div class="field wide"><label for="form-title">공연명 <span class="text-red">*</span></label><input class="input" id="form-title" maxlength="80" required value="${safe(draft.title)}" placeholder="예: 노트 정기공연"></div>
    <div class="field"><label for="form-price">공연 금액 (1석당, 원) <span class="text-red">*</span></label><input class="input" type="number" id="form-price" min="0" max="1000000" step="1" value="${Number(draft.price) || 0}" required><p class="form-hint">무료 공연은 0원을 입력하세요. 실제 결제 기능은 아직 없습니다.</p></div>
    <div class="field"><label for="form-venue">공연 장소 <span class="text-red">*</span></label><select class="select" id="form-venue">${venueOptions}</select></div>
    <div class="field"><label for="form-count">하루 공연 횟수 <span class="text-red">*</span></label><select class="select" id="form-count">${[1, 2, 3, 4].map(n => `<option value="${n}" ${sessionCount === n ? 'selected' : ''}>${n}공까지 (1공~${n}공)</option>`).join('')}</select><p class="form-hint">날짜마다 동일한 회차 수로 설정합니다.</p></div>
    <div class="field"><label for="form-type">공연 유형</label><select class="select" id="form-type">${['공연', '밴드', '연극', '무용', '합창', '기타'].map(t => `<option ${draft.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="field wide"><label for="form-description">공연 설명 <span class="text-red">*</span></label><textarea class="textarea" id="form-description" maxlength="500" required placeholder="공연 소개를 입력하세요.">${safe(draft.description)}</textarea></div>
    <div class="field wide"><label for="form-image">공연 포스터 <span class="text-red">*</span></label><div class="poster-upload"><div id="poster-preview" class="poster-preview">${draft.image ? `<img src="${safe(draft.image)}" alt="현재 공연 포스터">` : '<span>포스터 미등록</span>'}</div><div class="poster-upload-controls"><input class="input" type="file" id="form-image" accept="image/jpeg,image/png,image/webp"><p class="form-hint">JPG · PNG · WEBP, 최대 5MB. 화면 시연용으로 이미지가 압축되어 브라우저에 저장됩니다.</p></div></div></div>
    <div class="field wide"><label>관리 동아리</label><input class="input" value="${safe(user.clubName)}" disabled></div>
   </div>
   <div class="disabled-seat-area"><div class="seat-config-header"><h3>공연 날짜 및 회차 설정</h3><button type="button" class="btn btn-outline btn-sm" id="add-date">${icon('plus', 15)} 날짜 추가</button></div><p class="form-hint">위에서 선택한 회차 수에 따라 1공부터 자동 생성됩니다. 날짜별 시작 시간을 입력하세요.</p><div id="date-settings"></div><div id="session-settings" class="sessions-settings"></div></div>
   <div class="disabled-seat-area"><div class="seat-config-header"><h3>예매 불가 좌석 설정</h3><select class="select" id="slot-to-config" aria-label="좌석을 설정할 회차"></select></div><p class="form-hint">선택한 장소의 좌석 배치도에서 좌석을 클릭하면 회차별 예매 불가 좌석으로 표시됩니다. 다시 누르면 해제됩니다.</p><div class="admin-seat-box"><div class="legend" style="margin-bottom:18px"><span class="legend-item"><i class="legend-box"></i>예매 가능</span><span class="legend-item"><i class="legend-box unavailable"></i>예매 불가</span></div><div id="admin-seat-map"></div><div class="small-caption" id="seat-config-count" style="margin-top:12px;text-align:right"></div></div></div>
   <div class="admin-form-footer"><span class="text-note">공연장 좌석 수가 자동 반영되고, 차단 좌석은 해당 회차에서 예매할 수 없습니다.</span><div class="modal-actions"><button type="button" class="btn btn-outline" id="cancel-editor">취소</button><button type="submit" class="btn btn-primary">${icon('check', 16)} ${original ? '수정 저장' : '공연 등록'}</button></div></div>
 </form></section></div>`;
        const root = holder.querySelector('#editor-backdrop'), close = () => {
            holder.innerHTML = '';
        };
        root.querySelector('#editor-close').addEventListener('click', close);
        root.querySelector('#cancel-editor').addEventListener('click', close);
        root.addEventListener('click', e => {
            if (e.target === root) close();
        });

        async function compressPoster(file) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('JPG, PNG, WEBP 이미지 파일만 업로드할 수 있습니다.');
            if (file.size > 5 * 1024 * 1024) throw new Error('포스터는 5MB 이하 파일만 선택할 수 있습니다.');
            const src = URL.createObjectURL(file);
            try {
                const picture = new Image();
                await new Promise((resolve, reject) => {
                    picture.onload = resolve;
                    picture.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
                    picture.src = src;
                });
                const ratio = Math.min(1, 960 / Math.max(picture.naturalWidth, picture.naturalHeight));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(picture.naturalWidth * ratio);
                canvas.height = Math.round(picture.naturalHeight * ratio);
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(picture, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/jpeg', 0.78);
            } finally {
                URL.revokeObjectURL(src);
            }
        }

        root.querySelector('#form-image').addEventListener('change', async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const image = await compressPoster(file);
                if (!root.isConnected) return;
                draft.image = image;
                root.querySelector('#poster-preview').innerHTML = `<img src="${safe(image)}" alt="업로드한 포스터 미리보기">`;
            } catch (err) {
                e.target.value = '';
                toast(err.message, 'error');
            }
        });
        root.querySelector('#form-count').addEventListener('change', e => {
            const nextCount = Number(e.target.value);
            if (draft.dates.some(d => d.sessions.some(s => Number.parseInt(s.label, 10) > nextCount && existingBookings.some(r => r.sessionId === s.id)))) {
                e.target.value = String(sessionCount);
                toast('이미 예매된 회차는 줄일 수 없습니다.', 'error');
                return;
            }
            sessionCount = nextCount;
            draft.dates.forEach((day, i) => {
                day.sessions = day.sessions.filter(s => Number.parseInt(s.label, 10) <= sessionCount);
                for (let n = 1; n <= sessionCount; n++) {
                    if (!day.sessions.some(s => s.label === `${n}공`)) day.sessions.push(newSlot(`${draft.id}-d${i + 1}-${Date.now()}`, n - 1));
                }
                day.sessions.sort((a, b) => parseInt(a.label) - parseInt(b.label));
            });
            slotId = draft.dates[dayIndex]?.sessions[0]?.id;
            renderDates();
        });
        root.querySelector('#form-venue').addEventListener('change', e => {
            if (existingBookings.length) {
                e.target.value = draft.venueId;
                toast('이미 예매된 공연은 공연장을 변경할 수 없습니다.', 'error');
                return;
            }
            draft.venueId = e.target.value;
            draft.dates.forEach(d => d.sessions.forEach(s => s.blocked = []));
            renderBlockSeats();
        });
        root.querySelector('#add-date').addEventListener('click', () => {
            const last = draft.dates.at(-1)?.date || '2026-12-19';
            const dt = new Date(last + 'T12:00:00');
            dt.setDate(dt.getDate() + 1);
            const nextDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
            const index = draft.dates.length + 1;
            draft.dates.push({
                date: nextDate,
                sessions: Array.from({length: sessionCount}, (_, i) => newSlot(`${draft.id}-d${index}-${Date.now()}`, i))
            });
            dayIndex = draft.dates.length - 1;
            slotId = draft.dates[dayIndex].sessions[0].id;
            renderDates();
        });

        function renderDates() {
            const dateSettings = root.querySelector('#date-settings');
            dateSettings.innerHTML = `<div class="editor-date-list">${draft.dates.map((d, i) => `<div class="editor-date-item ${dayIndex === i ? 'selected-day' : ''}"><input type="date" value="${safe(d.date)}" aria-label="${i + 1}번째 공연 날짜" data-day-date="${i}"><button class="btn btn-outline btn-sm" type="button" data-day-select="${i}">${dayIndex === i ? '편집 중' : '회차 편집'}</button>${draft.dates.length > 1 ? `<button class="btn btn-outline btn-sm" type="button" data-day-remove="${i}" aria-label="날짜 삭제">×</button>` : ''}</div>`).join('')}</div>`;
            dateSettings.querySelectorAll('[data-day-date]').forEach(el => el.addEventListener('change', () => {
                draft.dates[Number(el.dataset.dayDate)].date = el.value;
            }));
            dateSettings.querySelectorAll('[data-day-select]').forEach(el => el.addEventListener('click', () => {
                dayIndex = Number(el.dataset.daySelect);
                slotId = draft.dates[dayIndex].sessions[0]?.id;
                renderDates();
            }));
            dateSettings.querySelectorAll('[data-day-remove]').forEach(el => el.addEventListener('click', () => {
                const idx = Number(el.dataset.dayRemove), ids = draft.dates[idx].sessions.map(s => s.id);
                if (existingBookings.some(r => ids.includes(r.sessionId))) {
                    toast('예매가 있는 날짜는 삭제할 수 없습니다.', 'error');
                    return;
                }
                draft.dates.splice(idx, 1);
                dayIndex = Math.min(dayIndex, draft.dates.length - 1);
                slotId = draft.dates[dayIndex].sessions[0]?.id;
                renderDates();
            }));
            renderSessionSettings();
        }

        function renderSessionSettings() {
            const day = draft.dates[dayIndex];
            if (!day) return;
            const sessionBox = root.querySelector('#session-settings');
            sessionBox.innerHTML = `<strong style="font-size:13px">${safe(day.date)} 회차별 시작 시간</strong>${day.sessions.map(s => `<div class="session-edit-row"><label>${safe(s.label)}</label><input type="time" data-time-session="${safe(s.id)}" value="${safe(s.time)}" required></div>`).join('')}`;
            sessionBox.querySelectorAll('[data-time-session]').forEach(el => el.addEventListener('change', () => {
                const s = day.sessions.find(x => x.id === el.dataset.timeSession);
                if (s) s.time = el.value;
                renderBlockSeats();
            }));
            renderBlockSeats();
        }

        function renderBlockSeats() {
            const day = draft.dates[dayIndex], select = root.querySelector('#slot-to-config');
            if (!day) return;
            const sCurrent = day.sessions.find(s => s.id === slotId);
            if (!sCurrent) slotId = day.sessions[0]?.id;
            select.innerHTML = day.sessions.map(s => `<option value="${safe(s.id)}" ${s.id === slotId ? 'selected' : ''}>${safe(s.label)} · ${safe(s.time)}</option>`).join('');
            select.disabled = day.sessions.length === 0;
            const target = root.querySelector('#admin-seat-map'), count = root.querySelector('#seat-config-count');
            const draw = () => {
                const slot = day.sessions.find(s => s.id === slotId);
                if (!slot) {
                    target.innerHTML = '<p class="muted">회차를 한 개 이상 활성화해 주세요.</p>';
                    count.textContent = '';
                    return;
                }
                const booked = takenSeats(draft.id, slotId);
                renderSeatMap(target, {
                    venueId: draft.venueId,
                    blocked: slot.blocked,
                    booked,
                    selected: [],
                    toggleBlocked: true,
                    onSeatClick(seat) {
                        if (slot.blocked.includes(seat)) slot.blocked = slot.blocked.filter(s => s !== seat);
                        else slot.blocked.push(seat);
                        draw();
                    }
                });
                count.textContent = `총 ${seatIds(draft.venueId).length}석 · 예매 불가 ${slot.blocked.length}석 · 현재 예매 ${booked.length}석`;
            };
            select.onchange = () => {
                slotId = select.value;
                draw();
            };
            draw();
        }

        root.querySelector('#performance-form').addEventListener('submit', e => {
            e.preventDefault();
            draft.title = root.querySelector('#form-title').value.trim();
            draft.type = root.querySelector('#form-type').value;
            draft.description = root.querySelector('#form-description').value.trim();
            draft.price = Number(root.querySelector('#form-price').value);
            if (!draft.title) {
                toast('공연명을 입력해 주세요.', 'error');
                return;
            }
            if (!Number.isSafeInteger(draft.price) || draft.price < 0 || draft.price > 1000000) {
                toast('공연 금액을 확인해 주세요.', 'error');
                return;
            }
            if (!draft.description) {
                toast('공연 설명을 입력해 주세요.', 'error');
                return;
            }
            if (!draft.image) {
                toast('공연 포스터를 업로드해 주세요.', 'error');
                return;
            }
            if (draft.dates.some(d => !d.date || !d.sessions.length)) {
                toast('각 날짜에 유효한 날짜와 회차가 1개 이상 필요합니다.', 'error');
                return;
            }
            if (new Set(draft.dates.map(d => d.date)).size !== draft.dates.length) {
                toast('동일한 날짜가 중복되어 있습니다.', 'error');
                return;
            }
            const validSessions = new Set(draft.dates.flatMap(d => d.sessions.map(s => s.id)));
            if (existingBookings.some(r => !validSessions.has(r.sessionId))) {
                toast('예매가 있는 회차는 삭제할 수 없습니다.', 'error');
                return;
            }
            if (draft.dates.some(d => d.sessions.some(s => !s.time))) {
                toast('공연 회차 시간을 입력해 주세요.', 'error');
                return;
            }
            if (draft.dates.some(d => d.sessions.some(s => s.blocked.some(seat => takenSeats(draft.id, s.id).includes(seat))))) {
                toast('이미 예매된 좌석을 예매 불가로 변경할 수 없습니다.', 'error');
                return;
            }
            try {
                draft.dates.sort((a, b) => a.date.localeCompare(b.date));
                savePerformance(draft);
                close();
                drawTable();
                toast(original ? '공연 정보가 수정되었습니다.' : '새 공연이 등록되었습니다.');
            } catch (err) {
                toast('저장에 실패했습니다. 브라우저 저장 공간 또는 파일 크기를 확인해 주세요.', 'error');
            }
        });
        renderDates();
    }
}
