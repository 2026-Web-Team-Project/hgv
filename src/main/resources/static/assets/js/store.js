/**
 * FRONTEND DEMO DATA LAYER
 * Temporary localStorage repository. Replace exported functions with fetch() REST API calls later.
 * NOT authentication, NOT a database, and NOT safe for concurrent ticket reservations.
 */
const K = { performances: 'clubbox_v1_performances', reservations: 'clubbox_v1_reservations', user: 'clubbox_v1_user' };
const asset = path => `assets/images/${path}`;

export const VENUES = {
  chapel: { id:'chapel', name:'효암채플', rows:'ABCDEFGH'.split(''), columns:14 },
  auditorium: { id:'auditorium', name:'오석관 대강당', rows:'ABCDEFG'.split(''), columns:12 },
  theater: { id:'theater', name:'학생회관 소극장', rows:'ABCDEF'.split(''), columns:10 }
};

const times = ['12:00', '14:30', '17:00', '19:00'];
function sessions(prefix, blocked = [], count = 4) {
  return times.slice(0, count).map((time, i) => ({
    id: `${prefix}-s${i+1}`, label: `${i+1}공`, time,
    blocked: i === 0 ? [...blocked] : [...blocked.slice(0, Math.ceil(blocked.length / 2))]
  }));
}
const demoPerformances = [
  {
    id:'echo', clubId:'note', clubName:'노트', title:'Echo 정기공연', subtitle:'밴드 동아리 노트',
    type:'밴드', venueId:'chapel', image:asset('echo.png'),
    description:'한동대학교 밴드 동아리가 준비한 라이브 공연입니다. 익숙한 멜로디와 새로운 사운드가 만나는 무대에 여러분을 초대합니다.',
    dates:[{date:'2026-11-28',sessions:sessions('echo-1128',['A5','A6','A7','A8','C6','C7','F11'])},{date:'2026-11-29',sessions:sessions('echo-1129',['B6','B7','D6','D7'])}]
  },
  {
    id:'dance', clubId:'raon', clubName:'라온', title:'Part of Us 정기공연', subtitle:'무용 동아리 라온',
    type:'무용', venueId:'auditorium', image:asset('dance.png'),
    description:'움직임으로 전하는 우리의 이야기. 다양한 장르의 무용과 함께 특별한 밤을 경험해 보세요.',
    dates:[{date:'2026-12-05',sessions:sessions('dance-1205',['A1','A2','A3','D5'],3)},{date:'2026-12-06',sessions:sessions('dance-1206',[],2)}]
  },
  {
    id:'choir', clubId:'harmonia', clubName:'하모니아', title:'Harmonia 정기연주회', subtitle:'합창 동아리 하모니아',
    type:'합창', venueId:'chapel', image:asset('choir.png'),
    description:'서로 다른 목소리가 하나의 하모니로 이어지는 시간. 캠퍼스에 울려 퍼지는 따뜻한 선율을 전합니다.',
    dates:[{date:'2026-12-12',sessions:sessions('choir-1212',['A1','A2','H13','H14'],2)}]
  }
];
const demoReservations = [
  {id:'RSV-DEMO-01', userId:'suho', performanceId:'dance', sessionId:'dance-1205-s2', date:'2026-12-05', seats:['B7'], status:'CONFIRMED', createdAt:'2026-11-25T10:00:00'}
];

const parse = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
const put = (key, value) => localStorage.setItem(key, JSON.stringify(value));
export function initialize() {
  if (!localStorage.getItem(K.performances)) put(K.performances, demoPerformances);
  if (!localStorage.getItem(K.reservations)) put(K.reservations, demoReservations);
}
export function resetDemo() { put(K.performances,demoPerformances); put(K.reservations,demoReservations); }
export function getPerformances() { initialize(); return parse(K.performances,[]); }
export function getPerformance(id) { return getPerformances().find(p=>p.id===id); }
export function savePerformance(item) {
  const items = getPerformances(); const idx = items.findIndex(p=>p.id===item.id);
  if (idx < 0) items.unshift(item); else items[idx]=item;
  put(K.performances, items); return item;
}
export function deletePerformance(id) {
  const hasReservations = getReservations().some(r=>r.performanceId===id && r.status==='CONFIRMED');
  if (hasReservations) throw new Error('예매 내역이 있는 공연은 삭제할 수 없습니다.');
  put(K.performances, getPerformances().filter(p=>p.id!==id));
}
export function getReservations() { initialize(); return parse(K.reservations,[]); }
export function getUser() { return parse(K.user,null); }
export function setUser(user) { put(K.user,user); }
export function logout() { localStorage.removeItem(K.user); }
export function getVenue(id) { return VENUES[id]||VENUES.chapel; }
export function seatIds(venueId) {
  const v=getVenue(venueId); return v.rows.flatMap(row=>Array.from({length:v.columns},(_,i)=>`${row}${i+1}`));
}
export function locateSession(performance, sessionId) {
  if (!performance) return null;
  for (const day of performance.dates) for (const session of day.sessions) if (session.id===sessionId) return {date:day.date,session};
  return null;
}
export function takenSeats(performanceId, sessionId) {
  return getReservations().filter(r=>r.performanceId===performanceId && r.sessionId===sessionId && r.status==='CONFIRMED').flatMap(r=>r.seats);
}
export function remainingSeats(performance, sessionId) {
  const slot=locateSession(performance,sessionId); if (!slot) return 0;
  const invalid=new Set([...(slot.session.blocked||[]),...takenSeats(performance.id,sessionId)]);
  return seatIds(performance.venueId).filter(id=>!invalid.has(id)).length;
}
export function reserveSeats({performanceId,sessionId,seats,userId}) {
  const p=getPerformance(performanceId), slot=locateSession(p,sessionId);
  if (!p || !slot) throw new Error('해당 공연 회차를 찾을 수 없습니다.');
  if (!Array.isArray(seats)||!seats.length) throw new Error('좌석을 한 개 이상 선택해 주세요.');
  if (seats.length>6) throw new Error('한 번에 최대 6석까지 예매할 수 있습니다.');
  const valid=new Set(seatIds(p.venueId));
  const blocked=new Set([...(slot.session.blocked||[]),...takenSeats(performanceId,sessionId)]);
  if (new Set(seats).size!==seats.length || seats.some(s=>!valid.has(s)||blocked.has(s))) throw new Error('이미 예매되었거나 선택할 수 없는 좌석이 포함되어 있습니다.');
  const item={id:`RSV-${Date.now()}-${Math.floor(Math.random()*1000)}`,userId,performanceId,sessionId,date:slot.date,seats:[...seats],status:'CONFIRMED',createdAt:new Date().toISOString()};
  put(K.reservations,[item,...getReservations()]); return item;
}
export function cancelReservation(id,userId) {
  const items=getReservations(); const item=items.find(r=>r.id===id);
  if (!item || item.userId!==userId) throw new Error('취소할 수 없는 예매입니다.');
  if (item.status==='CANCELLED') throw new Error('이미 취소된 예매입니다.');
  item.status='CANCELLED'; put(K.reservations,items);
}
export function niceDate(date) {
  const [y,m,d]=date.split('-').map(Number); const weekdays=['일','월','화','수','목','금','토'];
  return `${y}.${String(m).padStart(2,'0')}.${String(d).padStart(2,'0')} (${weekdays[new Date(y,m-1,d).getDay()]})`;
}
export const shortDate = date => date.slice(5).replace('-','.');
export function getFirstSession(p) { const day=p?.dates?.[0]; return day?.sessions?.[0] ? {date:day.date, session:day.sessions[0]} : null; }
