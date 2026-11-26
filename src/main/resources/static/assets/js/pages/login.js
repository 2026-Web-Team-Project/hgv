import {getUser,setUser} from '../store.js';
import {renderHeader,toast,params} from '../ui.js';
renderHeader();
let role='USER';document.querySelectorAll('[data-role]').forEach(b=>b.addEventListener('click',()=>{
 role=b.dataset.role;document.querySelectorAll('[data-role]').forEach(x=>x.classList.toggle('active',x===b));
}));
const next=params().get('next');
// Restrict demo redirects to a same-directory HTML page, never arbitrary external URLs.
const safeNext=next && /^(?:index|performance|seats|mypage|admin)\.html(?:\?[\w=&%-]*)?$/.test(next)?next:null;
document.querySelector('#login-submit').addEventListener('click',()=>{
 const name=document.querySelector('#username').value.trim(),studentId=document.querySelector('#student-id').value.trim();
 if(!name||!/^\d{7,12}$/.test(studentId)){toast('이름과 7~12자리 숫자 학번을 입력해 주세요.','error');return;}
 setUser({id:studentId==='22300253'?'suho':studentId,name,studentId,role,clubId:role==='ADMIN'?'note':null,clubName:role==='ADMIN'?'노트동아리':null});
 location.href=safeNext|| (role==='ADMIN'?'admin.html':'index.html');
});
const current=getUser();if(current){document.querySelector('#username').value=current.name;document.querySelector('#student-id').value=current.studentId;}
