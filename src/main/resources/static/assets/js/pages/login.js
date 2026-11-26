import {getUser, setUser} from '../store.js';
import {
    renderHeader,
    params,
    toast
} from '../ui.js';

renderHeader();
// 프론트엔드 시연 전용 명단. 관리 권한은 로그인 화면에서 선택하지 않습니다.
// 실제 서비스에서는 Spring Boot 로그인 응답에 포함된 역할/소속 정보를 사용하세요.
const demoExecutives = {
    '22300253': {clubId: 'note', clubName: '노트동아리'}
};
const next = params().get('next');
const safeNext = next && /^(?:index|performance|seats|mypage|admin)\.html(?:\?[\w=&%-]*)?$/.test(next) ? next : null;
const current = getUser();
if (current) {
    document.querySelector('#username').value = current.name;
    document.querySelector('#student-id').value = current.studentId;
}

document.querySelector('#login-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = document.querySelector('#username').value.trim();
    const studentId = document.querySelector('#student-id').value.trim();
    if (!name || !/^\d{7,12}$/.test(studentId)) {
        toast('이름과 7~12자리 숫자 학번을 입력해 주세요.', 'error');
        return;
    }
    const executive = demoExecutives[studentId];
    const user = {
        id: studentId === '22300253' ? 'suho' : studentId,
        name, studentId,
        role: executive ? 'ADMIN' : 'USER',
        clubId: executive?.clubId ?? null,
        clubName: executive?.clubName ?? null
    };
    setUser(user);
    // 관리자 전용 URL을 일반 회원에게 전달하지 않습니다.
    location.href = safeNext?.startsWith('admin.html') && user.role !== 'ADMIN'
        ? 'mypage.html'
        : (safeNext || 'mypage.html');
});
