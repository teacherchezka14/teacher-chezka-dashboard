// SUPABASE CONNECTION
const SUPABASE_URL = 'https://quskknnnzrwewgzunrgd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_J_cs_u7mkJsUnO1GUizi2w_Y5kUalMw';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ==========================================
// AUTHENTICATION
// ==========================================

const authScreen = document.getElementById('authScreen');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginMessage = document.getElementById('loginMessage');

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    if (authScreen) authScreen.style.display = 'none';
    await loadDashboardData();
  } else {
    if (authScreen) authScreen.style.display = 'flex';
  }
}

if (loginForm) {
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
      loginMessage.textContent = error.message;
      return;
    }

    loginMessage.textContent = '';
    authScreen.style.display = 'none';
    await loadDashboardData();
  });
}

supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    if (authScreen) authScreen.style.display = 'none';
  } else {
    if (authScreen) authScreen.style.display = 'flex';
  }
});


// ==========================================
// DASHBOARD STATE
// ==========================================

let state = {
  students: [],
  classes: []
};

let parsedImportRows = [];

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function lower(value) {
  return String(value ?? '').trim().toLowerCase();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}


// ==========================================
// NAVIGATION
// ==========================================

const pages = {
  dashboard: 'Dashboard',
  students: 'Students',
  schedule: 'Weekly Schedule',
  records: 'Class Records',
  contracts: 'Contracts',
  payments: 'Payments',
  reports: 'Reports',
  import: 'Import ClassIn',
  settings: 'Settings'
};

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

document.querySelectorAll('[data-jump]').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.jump));
});

function showPage(name) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === name);
  });

  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  const target = document.getElementById(name + 'Page');
  if (target) target.classList.add('active');

  const title = document.getElementById('pageTitle');
  if (title) title.textContent = pages[name] || 'Dashboard';
}


// ==========================================
// LOAD DATA FROM SUPABASE
// ==========================================

async function loadDashboardData() {
  const studentsResult = await supabaseClient
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });

  const classesResult = await supabaseClient
    .from('classes')
    .select('*, students(name)')
    .order('class_date', { ascending: true });

  if (studentsResult.error) {
    console.error(studentsResult.error);
    alert('Could not load students: ' + studentsResult.error.message);
    return;
  }

  if (classesResult.error) {
    console.error(classesResult.error);
    alert('Could not load classes: ' + classesResult.error.message);
    return;
  }

  state.students = studentsResult.data || [];
  state.classes = classesResult.data || [];

  renderAll();
}


// ==========================================
// STUDENTS
// ==========================================

const studentDialog = document.getElementById('studentDialog');
const studentForm = document.getElementById('studentForm');

['quickStudent', 'addStudentBtn'].forEach(id => {
  const button = document.getElementById(id);

  if (button) {
    button.addEventListener('click', () => {
      studentForm.reset();

      document.getElementById('sCountry').value = 'China';
      document.getElementById('sTimezone').value = 'Asia/Shanghai';
      document.getElementById('sDuration').value = '25';
      document.getElementById('sPayment').value = 'Contract';

      studentDialog.showModal();
    });
  }
});

if (studentForm) {
  studentForm.addEventListener('submit', async e => {
    e.preventDefault();

    const studentCode =
      'STU-' +
      Date.now().toString().slice(-8);

    const newStudent = {
      student_id: studentCode,
      name: document.getElementById('sName').value.trim(),
      age: document.getElementById('sAge').value
        ? Number(document.getElementById('sAge').value)
        : null,
      gender: document.getElementById('sGender').value || null,
      country: document.getElementById('sCountry').value.trim() || 'China',
      timezone: document.getElementById('sTimezone').value.trim() || 'Asia/Shanghai',
      class_duration: Number(document.getElementById('sDuration').value || 25),
      payment_type: document.getElementById('sPayment').value || 'Contract',
      amount_per_class: Number(document.getElementById('sAmount').value || 0),
      book: document.getElementById('sBook').value.trim() || null,
      start_date: todayISO(),
      status: 'Active'
    };

    const { error } = await supabaseClient
      .from('students')
      .insert(newStudent);

    if (error) {
      alert('Student was not saved: ' + error.message);
      return;
    }

    studentDialog.close();
    await loadDashboardData();
  });
}

function renderStudents() {
  const tbody = document.getElementById('studentsTable');
  const search = lower(document.getElementById('studentSearch')?.value);

  if (!tbody) return;

  const students = state.students.filter(student => {
    if (!search) return true;

    return (
      lower(student.name).includes(search) ||
      lower(student.student_id).includes(search) ||
      lower(student.book).includes(search)
    );
  });

  if (!students.length) {
    tbody.innerHTML =
      '<tr><td colspan="8">No students yet.</td></tr>';
    return;
  }

  tbody.innerHTML = students.map(student => `
    <tr>
      <td>${esc(student.student_id || student.id)}</td>
      <td><strong>${esc(student.name)}</strong></td>
      <td>${esc(student.age || '')}</td>
      <td>${esc(student.country || '')}</td>
      <td>${esc(student.book || '')}</td>
      <td>${esc(student.payment_type || '')}</td>
      <td>${Number(student.amount_per_class || 0).toFixed(2)} RMB</td>
      <td>
        <button
          class="text-btn"
          onclick="deleteStudent(${student.id})">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

window.deleteStudent = async function(id) {
  if (!confirm('Delete this student? Their class records will also be deleted.')) {
    return;
  }

  const { error } = await supabaseClient
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadDashboardData();
};

document.getElementById('studentSearch')
  ?.addEventListener('input', renderStudents);


// ==========================================
// CLASS SCHEDULING
// ==========================================

const classDialog = document.getElementById('classDialog');
const classForm = document.getElementById('classForm');

['quickClass', 'addClassBtn'].forEach(id => {
  const button = document.getElementById(id);

  if (button) {
    button.addEventListener('click', () => {
      if (!state.students.length) {
        alert('Please add a student first.');
        return;
      }

      classForm.reset();
      fillStudentSelect();

      document.getElementById('cDate').value = todayISO();
      document.getElementById('cDuration').value = '25';
      document.getElementById('cStatus').value = 'Scheduled';

      classDialog.showModal();
    });
  }
});

function fillStudentSelect() {
  const select = document.getElementById('cStudent');

  if (!select) return;

  select.innerHTML = state.students
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(student =>
      `<option value="${student.id}">${esc(student.name)}</option>`
    )
    .join('');
}

if (classForm) {
  classForm.addEventListener('submit', async e => {
    e.preventDefault();

    const newClass = {
      student_id: Number(document.getElementById('cStudent').value),
      class_date: document.getElementById('cDate').value,
      class_time: document.getElementById('cTime').value,
      duration: Number(document.getElementById('cDuration').value || 25),
      status: document.getElementById('cStatus').value,
      notes: document.getElementById('cNotes').value.trim() || null,
      source: 'Manual'
    };

    const { error } = await supabaseClient
      .from('classes')
      .insert(newClass);

    if (error) {
      alert('Class was not saved: ' + error.message);
      return;
    }

    classDialog.close();
    await loadDashboardData();
  });
}

function studentNameForClass(item) {
  if (item.students?.name) return item.students.name;

  const student = state.students.find(
    s => Number(s.id) === Number(item.student_id)
  );

  return student?.name || 'Unknown Student';
}

function renderSchedule() {
  const tbody = document.getElementById('scheduleTable');
  if (!tbody) return;

  const filter = document.getElementById('scheduleDateFilter')?.value;

  const rows = state.classes
    .filter(item => !filter || item.class_date === filter)
    .sort((a, b) =>
      `${a.class_date} ${a.class_time || ''}`
        .localeCompare(`${b.class_date} ${b.class_time || ''}`)
    );

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="7">No scheduled classes.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(item => `
    <tr>
      <td>${esc(item.class_date)}</td>
      <td>${esc((item.class_time || '').slice(0, 5))}</td>
      <td><strong>${esc(studentNameForClass(item))}</strong></td>
      <td>${esc(item.duration)} min</td>
      <td>${esc(item.status)}</td>
      <td>${esc(item.notes || '')}</td>
      <td>
        <button
          class="text-btn"
          onclick="deleteClass(${item.id})">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

window.deleteClass = async function(id) {
  if (!confirm('Delete this class record?')) return;

  const { error } = await supabaseClient
    .from('classes')
    .delete()
    .eq('id', id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadDashboardData();
};

document.getElementById('scheduleDateFilter')
  ?.addEventListener('change', renderSchedule);


// ==========================================
// CLASS RECORDS
// ==========================================

function renderRecords() {
  const tbody = document.getElementById('recordsTable');
  const query = lower(document.getElementById('recordSearch')?.value);

  if (!tbody) return;

  const rows = state.classes
    .slice()
    .sort((a, b) =>
      `${b.class_date} ${b.class_time || ''}`
        .localeCompare(`${a.class_date} ${a.class_time || ''}`)
    )
    .filter(item => {
      if (!query) return true;

      return (
        lower(studentNameForClass(item)).includes(query) ||
        lower(item.status).includes(query) ||
        lower(item.source).includes(query)
      );
    });

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="7">No class records yet.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${esc(item.class_date)}</td>
      <td>${esc((item.class_time || '').slice(0, 5))}</td>
      <td>${esc(studentNameForClass(item))}</td>
      <td>${esc(item.duration)} min</td>
      <td>${esc(item.status)}</td>
      <td>${esc(item.source || 'Manual')}</td>
    </tr>
  `).join('');
}

document.getElementById('recordSearch')
  ?.addEventListener('input', renderRecords);

document.getElementById('clearRecordsBtn')
  ?.addEventListener('click', async () => {
    if (!confirm('Delete ALL class records?')) return;

    const { error } = await supabaseClient
      .from('classes')
      .delete()
      .gt('id', 0);

    if (error) {
      alert(error.message);
      return;
    }

    await loadDashboardData();
  });


// ==========================================
// DASHBOARD
// ==========================================

function renderDashboard() {
  const today = todayISO();
  const month = today.slice(0, 7);

  document.getElementById('statStudents').textContent =
    state.students.filter(s => s.status !== 'Inactive').length;

  document.getElementById('statToday').textContent =
    state.classes.filter(c => c.class_date === today).length;

  document.getElementById('statMonth').textContent =
    state.classes.filter(c =>
      String(c.class_date || '').startsWith(month)
    ).length;

  document.getElementById('statRecords').textContent =
    state.classes.length;

  const upcoming = state.classes
    .filter(c => c.class_date >= today)
    .sort((a, b) =>
      `${a.class_date} ${a.class_time || ''}`
        .localeCompare(`${b.class_date} ${b.class_time || ''}`)
    )
    .slice(0, 5);

  const upcomingList = document.getElementById('upcomingList');

  if (upcomingList) {
    upcomingList.innerHTML = upcoming.length
      ? upcoming.map(c => `
          <div style="
            display:flex;
            justify-content:space-between;
            padding:10px 0;
            border-bottom:1px solid #eee;
          ">
            <div>
              <strong>${esc(studentNameForClass(c))}</strong><br>
              <small>
                ${esc(c.class_date)}
                ·
                ${esc((c.class_time || '').slice(0,5))}
              </small>
            </div>
            <span>${esc(c.duration)} min</span>
          </div>
        `).join('')
      : 'No upcoming classes yet.';
  }

  const recent = state.students.slice(0, 5);
  const recentStudents = document.getElementById('recentStudents');

  if (recentStudents) {
    recentStudents.innerHTML = recent.length
      ? recent.map(s => `
          <div style="
            display:flex;
            justify-content:space-between;
            padding:10px 0;
            border-bottom:1px solid #eee;
          ">
            <div>
              <strong>${esc(s.name)}</strong><br>
              <small>${esc(s.book || 'No book')}</small>
            </div>
            <span>${esc(s.payment_type || '')}</span>
          </div>
        `).join('')
      : 'No students yet.';
  }
}


// ==========================================
// REPORTS
// ==========================================

function renderReports() {
  const imported = state.classes.filter(
    c => lower(c.source) === 'classin'
  ).length;

  const scheduled = state.classes.filter(
    c => lower(c.status) === 'scheduled'
  ).length;

  const present = state.classes.filter(
    c => lower(c.status) === 'present'
  ).length;

  const other = state.classes.filter(c => {
    const status = lower(c.status);

    return (
      status.includes('cancel') ||
      status.includes('absent')
    );
  }).length;

  document.getElementById('reportImported').textContent = imported;
  document.getElementById('reportScheduled').textContent = scheduled;
  document.getElementById('reportPresent').textContent = present;
  document.getElementById('reportOther').textContent = other;
}


// ==========================================
// CLASSIN FILE READING
// ==========================================

const fileInput = document.getElementById('fileInput');

if (fileInput) {
  fileInput.addEventListener('change', async e => {
    parsedImportRows = [];

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();

        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true
        });

        parsedImportRows = parsed.data || [];
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        parsedImportRows = XLSX.utils.sheet_to_json(sheet, {
          defval: ''
        });
      }

      showImportStatus(
        `Ready to import ${parsedImportRows.length} rows.`
      );
    } catch (error) {
      showImportStatus(
        'Could not read the file: ' + error.message
      );
    }
  });
}

function findField(row, candidates) {
  const keys = Object.keys(row || {});

  for (const candidate of candidates) {
    const found = keys.find(
      key => lower(key) === lower(candidate)
    );

    if (found) return row[found];
  }

  return '';
}

function normalizeDate(value) {
  if (!value) return '';

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2,'0')}-${String(parsed.d).padStart(2,'0')}`;
    }
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  return '';
}

function normalizeTime(value) {
  if (!value) return '';

  const text = String(value).trim();

  const match = text.match(/(\d{1,2}):(\d{2})/);

  if (match) {
    return `${String(match[1]).padStart(2,'0')}:${match[2]}`;
  }

  return '';
}

function showImportStatus(message) {
  const box = document.getElementById('importStatus');

  if (!box) return;

  box.classList.remove('hidden');
  box.textContent = message;
}


// ==========================================
// IMPORT CLASSIN TO SUPABASE
// ==========================================

document.getElementById('importBtn')
  ?.addEventListener('click', async () => {

    if (!parsedImportRows.length) {
      alert('Choose a CSV or Excel file first.');
      return;
    }

    showImportStatus(
      `Processing ${parsedImportRows.length} rows...`
    );

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of parsedImportRows) {
      try {
        const studentName = String(
          findField(row, [
            'Student',
            'Student Name',
            'student_name',
            'Name',
            'Learner'
          ]) || ''
        ).trim();

        const classDate = normalizeDate(
          findField(row, [
            'Date',
            'Class Date',
            'class_date',
            'Start Date'
          ])
        );

        const classTime = normalizeTime(
          findField(row, [
            'Time',
            'Class Time',
            'class_time',
            'Start Time'
          ])
        );

        if (!studentName || !classDate) {
          skipped++;
          continue;
        }

        let student = state.students.find(
          s => lower(s.name) === lower(studentName)
        );

        if (!student) {
          if (!document.getElementById('autoStudents')?.checked) {
            skipped++;
            continue;
          }

          const { data, error } = await supabaseClient
            .from('students')
            .insert({
              student_id:
                'STU-' + Date.now().toString().slice(-8) +
                Math.floor(Math.random() * 99),
              name: studentName,
              country: 'China',
              timezone: 'Asia/Shanghai',
              class_duration: 25,
              payment_type: 'Contract',
              status: 'Active',
              start_date: classDate
            })
            .select()
            .single();

          if (error) throw error;

          student = data;
          state.students.push(student);
        }

        const duplicate = state.classes.some(c =>
          Number(c.student_id) === Number(student.id) &&
          c.class_date === classDate &&
          (c.class_time || '').slice(0,5) === classTime
        );

        if (
          duplicate &&
          document.getElementById('skipDuplicates')?.checked
        ) {
          skipped++;
          continue;
        }

        const duration = Number(
          findField(row, [
            'Duration',
            'Class Duration',
            'Minutes'
          ]) || 25
        );

        const status =
          String(
            findField(row, [
              'Status',
              'Class Status'
            ]) || 'Present'
          ).trim();

        const { error } = await supabaseClient
          .from('classes')
          .insert({
            student_id: student.id,
            class_date: classDate,
            class_time: classTime || null,
            duration: Number.isFinite(duration)
              ? duration
              : 25,
            status: status || 'Present',
            source: 'ClassIn'
          });

        if (error) throw error;

        imported++;

      } catch (error) {
        console.error(error);
        failed++;
      }
    }

    await loadDashboardData();

    showImportStatus(
      `Finished. ${imported} imported, ${skipped} skipped, ${failed} failed.`
    );
  });


// ==========================================
// BACKUP / RESET
// ==========================================

document.getElementById('exportBtn')
  ?.addEventListener('click', () => {
    const backup = {
      exported_at: new Date().toISOString(),
      students: state.students,
      classes: state.classes
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download =
      `teacher-chezka-backup-${todayISO()}.json`;

    link.click();
    URL.revokeObjectURL(url);
  });

document.getElementById('resetBtn')
  ?.addEventListener('click', async () => {
    if (
      !confirm(
        'Delete ALL students, classes, contracts and payments from Supabase?'
      )
    ) return;

    const tables = [
      'classes',
      'payments',
      'contracts'
    ];

    for (const table of tables) {
      const { error } = await supabaseClient
        .from(table)
        .delete()
        .gt('id', 0);

      if (error) {
        alert(`Could not clear ${table}: ${error.message}`);
        return;
      }
    }

    const { error } = await supabaseClient
      .from('students')
      .delete()
      .gt('id', 0);

    if (error) {
      alert(error.message);
      return;
    }

    await loadDashboardData();
  });


// ==========================================
// RENDER EVERYTHING
// ==========================================

function renderAll() {
  fillStudentSelect();
  renderStudents();
  renderSchedule();
  renderRecords();
  renderDashboard();
  renderReports();
}

checkSession();
