 
// ======================================
// ATTENDPRO - ATTENDANCE MANAGEMENT
// ======================================

// SUBJECTS
const subjects = [
    "Mathematics",
    "Physics",
    "Programming",
    "Electrical",
    "English"
];

// DATE HELPER
function localDate(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function currentMonth() {
    return localDate().slice(0, 7);
}

// STORAGE
let students = JSON.parse(
    localStorage.getItem("ap_students") || "[]"
);

let attendance = JSON.parse(
    localStorage.getItem("ap_attendance") || "{}"
);

function saveData() {
    localStorage.setItem("ap_students", JSON.stringify(students));
    localStorage.setItem("ap_attendance", JSON.stringify(attendance));
}

// ELEMENTS
const $ = id => document.getElementById(id);

let calendarDate = new Date();

// ======================================
// LOGIN SYSTEM
// ======================================

$("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = $("username").value.trim();
    const password = $("password").value;

    if (username === "admin" && password === "admin123") {
        $("loginPage").classList.add("hidden");
        $("app").classList.remove("hidden");

        $("loginError").textContent = "";

        initializeApp();
    } else {
        $("loginError").textContent =
            "Invalid username or password!";
    }
});

$("logoutBtn").addEventListener("click", function() {
    $("app").classList.add("hidden");
    $("loginPage").classList.remove("hidden");

    $("loginForm").reset();
});

// ======================================
// APPLICATION INITIALIZATION
// ======================================

function initializeApp() {

    $("attendanceDate").value = localDate();
    $("reportMonth").value = currentMonth();

    // Subject dropdowns
    $("subjectSelect").innerHTML = subjects.map(
        s => `<option value="${s}">${s}</option>`
    ).join("");

    $("reportSubject").innerHTML =
        `<option value="all">All Subjects</option>` +
        subjects.map(s =>
            `<option value="${s}">${s}</option>`
        ).join("");

    showPage("dashboard");

    displayStudents();
    displayAttendance();
    updateDashboard();
    generateReport();
    generateCalendar();
}

// ======================================
// NAVIGATION
// ======================================

document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", function() {
        showPage(this.dataset.page);
    });
});

function showPage(page) {

    document.querySelectorAll(".page").forEach(section => {
        section.classList.add("hidden");
    });

    $(page).classList.remove("hidden");

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    const titles = {
        dashboard: "Dashboard",
        students: "Student Management",
        attendance: "Attendance Management",
        reports: "Monthly Reports",
        calendar: "Attendance Calendar"
    };

    $("pageTitle").textContent = titles[page];

    if (page === "dashboard") updateDashboard();
    if (page === "students") displayStudents();
    if (page === "attendance") displayAttendance();
    if (page === "reports") generateReport();
    if (page === "calendar") generateCalendar();
}

// ======================================
// STUDENT MANAGEMENT
// ======================================

$("studentForm").addEventListener("submit", function(e) {

    e.preventDefault();

    const name = $("studentName").value.trim();
    const roll = $("rollNumber").value.trim();

    if (!name || !roll) return;

    if (students.some(s => s.roll.toLowerCase() === roll.toLowerCase())) {
        alert("This roll number already exists!");
        return;
    }

    students.push({
        name: name,
        roll: roll
    });

    saveData();

    this.reset();

    displayStudents();
    displayAttendance();
    updateDashboard();

    alert("Student added successfully!");
});

function displayStudents() {

    const search = $("studentSearch").value.toLowerCase();

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.roll.toLowerCase().includes(search)
    );

    $("studentTable").innerHTML = "";

    filtered.forEach(student => {

        const tr = document.createElement("tr");

        const rollCell = document.createElement("td");
        rollCell.textContent = student.roll;

        const nameCell = document.createElement("td");
        nameCell.textContent = student.name;

        const actionCell = document.createElement("td");

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", () => {
            deleteStudent(student.roll);
        });

        actionCell.appendChild(deleteBtn);

        tr.append(rollCell, nameCell, actionCell);

        $("studentTable").appendChild(tr);
    });

    if (filtered.length === 0) {
        $("studentTable").innerHTML =
            `<tr><td colspan="3">No students found.</td></tr>`;
    }
}

$("studentSearch").addEventListener("input", displayStudents);

function deleteStudent(roll) {

    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }

    students = students.filter(s => s.roll !== roll);

    // Remove this student's historical attendance
    Object.keys(attendance).forEach(date => {
        Object.keys(attendance[date]).forEach(subject => {
            delete attendance[date][subject][roll];
        });
    });

    saveData();

    displayStudents();
    displayAttendance();
    updateDashboard();
    generateReport();
    generateCalendar();
}

// ======================================
// ATTENDANCE MANAGEMENT
// ======================================

function getSelectedDate() {
    return $("attendanceDate").value;
}

function getSelectedSubject() {
    return $("subjectSelect").value;
}

function getAttendance(date, subject) {

    if (!attendance[date]) attendance[date] = {};
    if (!attendance[date][subject]) attendance[date][subject] = {};

    return attendance[date][subject];
}

function displayAttendance() {

    const date = getSelectedDate();
    const subject = getSelectedSubject();

    if (!date || !subject) return;

    const records = attendance[date]?.[subject] || {};

    $("attendanceTable").innerHTML = "";

    students.forEach(student => {

        const status = records[student.roll] || "Not Marked";

        const tr = document.createElement("tr");

        const rollCell = document.createElement("td");
        rollCell.textContent = student.roll;

        const nameCell = document.createElement("td");
        nameCell.textContent = student.name;

        const statusCell = document.createElement("td");
        statusCell.textContent = status;
        statusCell.className =
            status === "Present" ? "status-present" :
            status === "Absent" ? "status-absent" :
            "status-unmarked";

        const actionCell = document.createElement("td");

        const presentBtn = document.createElement("button");
        presentBtn.textContent = "Present";
        presentBtn.className = "present-btn";

        presentBtn.addEventListener("click", () => {
            setStatus(student.roll, "Present");
        });

        const absentBtn = document.createElement("button");
        absentBtn.textContent = "Absent";
        absentBtn.className = "absent-btn";

        absentBtn.addEventListener("click", () => {
            setStatus(student.roll, "Absent");
        });

        actionCell.append(presentBtn, absentBtn);

        tr.append(rollCell, nameCell, statusCell, actionCell);

        $("attendanceTable").appendChild(tr);
    });

    if (students.length === 0) {
        $("attendanceTable").innerHTML =
            `<tr><td colspan="4">Add students first.</td></tr>`;
    }

    updateDashboard();
}

function setStatus(roll, status) {

    const records = getAttendance(
        getSelectedDate(),
        getSelectedSubject()
    );

    records[roll] = status;

    // Automatically save marked attendance
    saveData();

    displayAttendance();
    generateReport();
    generateCalendar();
}

$("attendanceDate").addEventListener("change", displayAttendance);

$("subjectSelect").addEventListener("change", displayAttendance);

$("saveAttendance").addEventListener("click", function() {

    saveData();

    alert("Attendance saved successfully!");

    updateDashboard();
    generateReport();
    generateCalendar();
});

// ======================================
// DASHBOARD
// ======================================

function updateDashboard() {

    const date = $("attendanceDate").value || localDate();
    const subject = $("subjectSelect").value || subjects[0];

    const records = attendance[date]?.[subject] || {};

    const total = students.length;

    const present = students.filter(
        s => records[s.roll] === "Present"
    ).length;

    const absent = students.filter(
        s => records[s.roll] === "Absent"
    ).length;

    const percentage = total
        ? Math.round((present / total) * 100)
        : 0;

    $("totalStudents").textContent = total;
    $("totalPresent").textContent = present;
    $("totalAbsent").textContent = absent;
    $("attendanceRate").textContent = percentage + "%";

    $("dashboardDate").textContent =
        "Date: " + date + " | Subject: " + subject;

    $("progressBar").style.width = percentage + "%";
    $("progressText").textContent = percentage + "% Attendance";

    showLowAlerts();
}

function showLowAlerts() {

    const month = $("reportMonth").value || currentMonth();

    const subject = $("reportSubject").value || "all";

    const lowStudents = students.filter(student => {

        const report = calculateStudentReport(
            student.roll, month, subject
        );

        return report.total > 0 && report.percentage < 75;
    });

    $("lowAlerts").innerHTML = "";

    if (lowStudents.length === 0) {
        $("lowAlerts").textContent =
            "No students below 75% attendance.";
        return;
    }

    lowStudents.forEach(student => {

        const p = document.createElement("p");

        const report = calculateStudentReport(
            student.roll, month, subject
        );

        p.className = "alert-low";

        p.textContent =
            `${student.name} (${student.roll}) - ${report.percentage}% attendance`;

        $("lowAlerts").appendChild(p);
    });
}

// ======================================
// MONTHLY REPORT
// ======================================

function calculateStudentReport(roll, month, subject) {

    let present = 0;
    let absent = 0;

    Object.keys(attendance).forEach(date => {

        if (!date.startsWith(month)) return;

        const subjectsForDate = attendance[date];

        const selectedSubjects = subject === "all"
            ? Object.keys(subjectsForDate)
            : [subject];

        selectedSubjects.forEach(sub => {

            const records = subjectsForDate[sub] || {};

            if (records[roll] === "Present") present++;
            if (records[roll] === "Absent") absent++;

        });
    });

    const total = present + absent;

    const percentage = total
        ? Math.round((present / total) * 100)
        : 0;

    return {
        present,
        absent,
        total,
        percentage
    };
}

function generateReport() {

    const month = $("reportMonth").value || currentMonth();
    const subject = $("reportSubject").value || "all";

    $("reportTable").innerHTML = "";

    students.forEach(student => {

        const r = calculateStudentReport(
            student.roll, month, subject
        );

        const tr = document.createElement("tr");

        const values = [
            student.roll,
            student.name,
            r.present,
            r.absent,
            r.total,
            r.percentage + "%"
        ];

        values.forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });

        const alertCell = document.createElement("td");

        alertCell.textContent =
            r.total === 0 ? "No Data" :
            r.percentage < 75 ? "Below 75%" : "Good";

        alertCell.className =
            r.total > 0 && r.percentage < 75
                ? "alert-low"
                : "alert-good";

        tr.appendChild(alertCell);

        $("reportTable").appendChild(tr);
    });

    if (students.length === 0) {
        $("reportTable").innerHTML =
            `<tr><td colspan="7">No students available.</td></tr>`;
    }

    showLowAlerts();
}

$("reportMonth").addEventListener("change", () => {
    generateReport();
    updateDashboard();
});

$("reportSubject").addEventListener("change", () => {
    generateReport();
    updateDashboard();
});

// ======================================
// EXCEL CSV DOWNLOAD
// ======================================

$("exportBtn").addEventListener("click", function() {

    const month = $("reportMonth").value;
    const subject = $("reportSubject").value;

    const rows = [
        [
            "Roll Number",
            "Student Name",
            "Subject",
            "Present",
            "Absent",
            "Total Classes",
            "Percentage",
            "Alert"
        ]
    ];

    students.forEach(student => {

        const r = calculateStudentReport(
            student.roll, month, subject
        );

        rows.push([
            student.roll,
            student.name,
            subject === "all" ? "All Subjects" : subject,
            r.present,
            r.absent,
            r.total,
            r.percentage + "%",
            r.total === 0 ? "No Data" :
            r.percentage < 75 ? "Below 75%" : "Good"
        ]);
    });

    function escapeCSV(value) {
        return '"' + String(value).replace(/"/g, '""') + '"';
    }

    const csv = "\uFEFF" + rows.map(row =>
        row.map(escapeCSV).join(",")
    ).join("\r\n");

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `Attendance-${month}.csv`;

    link.click();

    URL.revokeObjectURL(url);
});

// ======================================
// DARK MODE
// ======================================

function applyTheme() {

    const dark = localStorage.getItem("ap_theme") === "dark";

    document.body.classList.toggle("dark", dark);

    $("themeBtn").textContent =
        dark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

$("themeBtn").addEventListener("click", function() {

    const isDark = document.body.classList.toggle("dark");

    localStorage.setItem(
        "ap_theme",
        isDark ? "dark" : "light"
    );

    applyTheme();
});

// ======================================
// ATTENDANCE CALENDAR
// ======================================

function generateCalendar() {

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const subject = $("subjectSelect").value || subjects[0];

    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();

    $("calendarTitle").textContent =
        calendarDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });

    const grid = $("calendarGrid");

    grid.innerHTML = "";

    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        .forEach(day => {

            const cell = document.createElement("div");

            cell.className = "calendar-cell day-name";
            cell.textContent = day;

            grid.appendChild(cell);
        });

    for (let i = 0; i < firstDay; i++) {

        const empty = document.createElement("div");
        empty.className = "calendar-cell";

        grid.appendChild(empty);
    }

    for (let day = 1; day <= days; day++) {

        const date = [
            year,
            String(month + 1).padStart(2, "0"),
            String(day).padStart(2, "0")
        ].join("-");

        const records = attendance[date]?.[subject] || {};

        const marked = students.filter(
            s => records[s.roll] === "Present" ||
                 records[s.roll] === "Absent"
        );

        const present = marked.filter(
            s => records[s.roll] === "Present"
        ).length;

        const absent = marked.filter(
            s => records[s.roll] === "Absent"
        ).length;

        const cell = document.createElement("div");

        cell.className = "calendar-cell";

        if (marked.length > 0) {

            if (present > 0 && absent === 0) {
                cell.classList.add("present-day");
            } else if (absent > 0 && present === 0) {
                cell.classList.add("absent-day");
            } else {
                cell.classList.add("present-day");
            }
        }

        const dayNumber = document.createElement("strong");
        dayNumber.textContent = day;

        const details = document.createElement("div");

        details.textContent = marked.length
            ? `${present}P / ${absent}A`
            : "No record";

        cell.append(dayNumber, details);

        cell.title = `${date}: ${present} Present, ${absent} Absent`;

        grid.appendChild(cell);
    }

    $("calendarInfo").textContent =
        `Showing ${subject} attendance. Each date displays present and absent counts.`;
}

$("prevMonth").addEventListener("click", function() {

    calendarDate.setMonth(calendarDate.getMonth() - 1);

    generateCalendar();
});

$("nextMonth").addEventListener("click", function() {

    calendarDate.setMonth(calendarDate.getMonth() + 1);

    generateCalendar();
});

// ======================================
// STARTUP
// ======================================

applyTheme();
