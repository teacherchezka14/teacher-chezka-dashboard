// SUPABASE CONNECTION
const SUPABASE_URL = 'https://quskknnnzrwewgzunrgd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_J_cs_u7mkJsUnO1GUizi2w_Y5kUalMw';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
// AUTHENTICATION
const authScreen = document.getElementById('authScreen');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginMessage = document.getElementById('loginMessage');

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    authScreen.style.display = 'none';
  } else {
    authScreen.style.display = 'flex';
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  loginMessage.style.color = '#777';
  loginMessage.textContent = 'Signing in...';

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: loginEmail.value.trim(),
    password: loginPassword.value
  });

  if (error) {
    loginMessage.style.color = '#b94a48';
    loginMessage.textContent = 'Incorrect email or password.';
    return;
  }

  loginMessage.textContent = '';
  authScreen.style.display = 'none';
});

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    authScreen.style.display = 'none';
  } else {
    authScreen.style.display = 'flex';
  }
});

checkSession();
const STORE_KEY='teacherChezkaDashboardV1';
let state=loadState();
let parsedImportRows=[];

function emptyState(){return{students:[],classes:[],settings:{}}}
function loadState(){try{return JSON.parse(localStorage.getItem(STORE_KEY))||emptyState()}catch{return emptyState()}}
function saveState(){localStorage.setItem(STORE_KEY,JSON.stringify(state));renderAll()}
function uid(prefix){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}
function esc(v){return String(v??'').replace(/[&<>'"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]))}
function norm(s){return String(s??'').trim()}
function lower(s){return norm(s).toLowerCase()}

const pages={dashboard:'Dashboard',students:'Students',schedule:'Weekly Schedule',records:'Class Records',contracts:'Contracts',payments:'Payments',reports:'Reports',import:'Import ClassIn',settings:'Settings'};
document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>showPage(btn.dataset.page)));
document.querySelectorAll('[data-jump]').forEach(btn=>btn.addEventListener('click',()=>showPage(btn.dataset.jump)));
function showPage(name){document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===name));document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(name+'Page').classList.add('active');document.getElementById('pageTitle').textContent=pages[name];document.getElementById('pageSubtitle').textContent=name==='dashboard'?'Your private ESL teaching overview':'Teacher Chezka Dashboard';}

const studentDialog=document.getElementById('studentDialog');
const classDialog=document.getElementById('classDialog');
['quickStudent','addStudentBtn'].forEach(id=>document.getElementById(id).addEventListener('click',()=>studentDialog.showModal()));
['quickClass','addClassBtn'].forEach(id=>document.getElementById(id).addEventListener('click',openClassDialog));
function openClassDialog(){fillStudentSelect();if(!state.students.length){alert('Please add a student first.');studentDialog.showModal();return}document.getElementById('cDate').value ||= new Date().toISOString().slice(0,10);classDialog.showModal()}

studentForm.addEventListener('submit',e=>{e.preventDefault();const name=norm(sName.value);if(!name)return;state.students.push({id:'STU-'+String(state.students.length+1).padStart(4,'0'),name,age:norm(sAge.value),gender:sGender.value,country:norm(sCountry.value)||'China',timezone:norm(sTimezone.value)||'Asia/Shanghai',duration:+sDuration.value,payment:sPayment.value,amount:+sAmount.value||0,book:norm(sBook.value),createdAt:new Date().toISOString()});studentForm.reset();sCountry.value='China';sTimezone.value='Asia/Shanghai';studentDialog.close();saveState()});

classForm.addEventListener('submit',e=>{e.preventDefault();const student=state.students.find(s=>s.id===cStudent.value);if(!student)return;state.classes.push({id:uid('CLS'),date:cDate.value,time:cTime.value,studentId:student.id,studentName:student.name,duration:+cDuration.value,status:cStatus.value,notes:norm(cNotes.value),source:'Manual',createdAt:new Date().toISOString()});classForm.reset();classDialog.close();saveState()});

function fillStudentSelect(){cStudent.innerHTML=state.students.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}
function renderStudents(){const q=lower(studentSearch.value);const rows=state.students.filter(s=>!q||lower([s.id,s.name,s.country,s.book].join(' ')).includes(q));studentsTable.innerHTML=rows.length?rows.map(s=>`<tr><td>${esc(s.id)}</td><td><strong>${esc(s.name)}</strong></td><td>${esc(s.age)}</td><td>${esc(s.country)}</td><td>${esc(s.book)}</td><td>${esc(s.payment)}</td><td>${s.amount?esc(s.amount)+' RMB':'—'}</td><td><button class="table-action" onclick="deleteStudent('${s.id}')">Delete</button></td></tr>`).join(''):`<tr><td colspan="8" class="muted">No students found.</td></tr>`}
window.deleteStudent=id=>{if(!confirm('Delete this student? Existing class records will remain.'))return;state.students=state.students.filter(s=>s.id!==id);saveState()}
studentSearch.addEventListener('input',renderStudents);

function sortedClasses(){return [...state.classes].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))}
function renderSchedule(){const f=scheduleDateFilter.value;const rows=sortedClasses().filter(c=>!f||c.date===f);scheduleTable.innerHTML=rows.length?rows.map(c=>`<tr><td>${esc(c.date)}</td><td>${esc(c.time)}</td><td><strong>${esc(c.studentName)}</strong></td><td>${esc(c.duration)} min</td><td><span class="status-pill">${esc(c.status)}</span></td><td>${esc(c.notes)}</td><td><button class="table-action" onclick="deleteClass('${c.id}')">Delete</button></td></tr>`).join(''):`<tr><td colspan="7" class="muted">No classes scheduled.</td></tr>`}
window.deleteClass=id=>{if(!confirm('Delete this class record?'))return;state.classes=state.classes.filter(c=>c.id!==id);saveState()}
scheduleDateFilter.addEventListener('change',renderSchedule);

function renderRecords(){const q=lower(recordSearch.value);const rows=sortedClasses().filter(c=>!q||lower([c.date,c.time,c.studentName,c.status,c.source].join(' ')).includes(q));recordsTable.innerHTML=rows.length?rows.map((c,i)=>`<tr><td>${i+1}</td><td>${esc(c.date)}</td><td>${esc(c.time)}</td><td>${esc(c.studentName)}</td><td>${esc(c.duration||'')} min</td><td>${esc(c.status)}</td><td>${esc(c.source)}</td></tr>`).join(''):`<tr><td colspan="7" class="muted">No class records.</td></tr>`}
recordSearch.addEventListener('input',renderRecords);
clearRecordsBtn.addEventListener('click',()=>{if(confirm('Delete ALL class records?')){state.classes=[];saveState()}});

function renderDashboard(){const today=new Date().toISOString().slice(0,10);const month=today.slice(0,7);statStudents.textContent=state.students.length;statToday.textContent=state.classes.filter(c=>c.date===today).length;statMonth.textContent=state.classes.filter(c=>String(c.date).startsWith(month)).length;statRecords.textContent=state.classes.length;const upcoming=[...state.classes].filter(c=>(c.date+'T'+(c.time||'00:00'))>=today+'T00:00').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,6);upcomingList.innerHTML=upcoming.length?upcoming.map(c=>`<div class="mini-row"><span><strong>${esc(c.studentName)}</strong><br><small>${esc(c.date)} · ${esc(c.time)}</small></span><span>${esc(c.duration)} min</span></div>`).join(''):'No upcoming classes yet.';const recent=[...state.students].reverse().slice(0,6);recentStudents.innerHTML=recent.length?recent.map(s=>`<div class="mini-row"><span><strong>${esc(s.name)}</strong><br><small>${esc(s.book||'No book assigned')}</small></span><span>${esc(s.payment)}</span></div>`).join(''):'No students yet.';reportImported.textContent=state.classes.filter(c=>c.source==='ClassIn Import').length;reportScheduled.textContent=state.classes.filter(c=>lower(c.status)==='scheduled').length;reportPresent.textContent=state.classes.filter(c=>lower(c.status)==='present').length;reportOther.textContent=state.classes.filter(c=>['cancelled','absent','student absent notified','teacher absent notified'].includes(lower(c.status))).length}

fileInput.addEventListener('change',async e=>{parsedImportRows=[];const file=e.target.files[0];if(!file)return;importStatus.classList.remove('hidden');importStatus.textContent='Reading file…';try{if(file.name.toLowerCase().endsWith('.csv')){const text=await file.text();const res=Papa.parse(text,{header:true,skipEmptyLines:true});parsedImportRows=res.data}else{const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];parsedImportRows=XLSX.utils.sheet_to_json(ws,{defval:''})}importStatus.textContent=`Detected ${parsedImportRows.length.toLocaleString()} rows. Ready to import.`}catch(err){importStatus.textContent='Could not read file: '+err.message}});

function findField(row,candidates){const keys=Object.keys(row);for(const c of candidates){const key=keys.find(k=>lower(k)===lower(c)||lower(k).includes(lower(c)));if(key!==undefined&&norm(row[key]))return row[key]}return''}
function normalizeDate(v){if(!v)return'';if(typeof v==='number'&&window.XLSX){const d=XLSX.SSF.parse_date_code(v);if(d)return`${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;}const s=norm(v);const dt=new Date(s);if(!isNaN(dt))return dt.toISOString().slice(0,10);const m=s.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);return m?`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`:s}
function normalizeTime(v){const s=norm(v);const m=s.match(/(\d{1,2}):(\d{2})/);return m?`${m[1].padStart(2,'0')}:${m[2]}`:s}

importBtn.addEventListener('click',()=>{if(!parsedImportRows.length){alert('Please choose a CSV or Excel file first.');return}let imported=0,dupes=0,studentsAdded=0;const existing=new Set(state.classes.map(c=>[lower(c.studentName),c.date,c.time].join('|')));for(const row of parsedImportRows){const studentName=norm(findField(row,['student','student name','nickname','name','class student','user name']))||'Unknown Student';const date=normalizeDate(findField(row,['date','class date','lesson date','start date','start time']));const time=normalizeTime(findField(row,['time','class time','lesson time','start time']));const durationRaw=findField(row,['duration','class duration','lesson duration','minutes']);const duration=parseInt(String(durationRaw).match(/\d+/)?.[0]||'25',10);const status=norm(findField(row,['status','class status','attendance','lesson status']))||'Present';const key=[lower(studentName),date,time].join('|');if(skipDuplicates.checked&&existing.has(key)){dupes++;continue}let student=state.students.find(s=>lower(s.name)===lower(studentName));if(!student&&autoStudents.checked){student={id:'STU-'+String(state.students.length+1).padStart(4,'0'),name:studentName,age:'',gender:'',country:'China',timezone:'Asia/Shanghai',duration:25,payment:'Contract',amount:0,book:'',createdAt:new Date().toISOString()};state.students.push(student);studentsAdded++}state.classes.push({id:uid('CLS'),date,time,studentId:student?.id||'',studentName,duration,status,notes:'',source:'ClassIn Import',createdAt:new Date().toISOString(),raw:row});existing.add(key);imported++}localStorage.setItem(STORE_KEY,JSON.stringify(state));renderAll();importStatus.textContent=`Import complete: ${imported.toLocaleString()} rows imported, ${dupes.toLocaleString()} duplicates skipped, ${studentsAdded.toLocaleString()} new students created.`});

exportBtn.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='teacher-chezka-dashboard-backup.json';a.click();URL.revokeObjectURL(a.href)});
backupInput.addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.students)||!Array.isArray(data.classes))throw new Error('Invalid backup');state=data;saveState();alert('Backup imported successfully.')}catch(err){alert('Could not import backup: '+err.message)}});
resetBtn.addEventListener('click',()=>{if(confirm('Reset ALL students and classes? This cannot be undone unless you exported a backup.')){state=emptyState();saveState()}});

function renderAll(){renderStudents();renderSchedule();renderRecords();renderDashboard();fillStudentSelect()}
renderAll();
