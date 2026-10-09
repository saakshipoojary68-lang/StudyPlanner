/* ==========================================
   STUDYPLANNER - JAVASCRIPT
   Task Management and Study Productivity
========================================== */


/* ==========================================
   1. DOM ELEMENTS
========================================== */

const taskForm = document.getElementById("task-form");

const taskTitle = document.getElementById("task-title");
const taskSubject = document.getElementById("task-subject");
const taskDate = document.getElementById("task-date");
const taskPriority = document.getElementById("task-priority");
const taskMinutes = document.getElementById("task-minutes");

const formMessage = document.getElementById("form-message");

const totalTasksElement = document.getElementById("total-tasks");
const completedTasksElement = document.getElementById("completed-tasks");
const pendingTasksElement = document.getElementById("pending-tasks");
const completionRateElement = document.getElementById("completion-rate");

const taskListContainer = document.getElementById("task-list-container");
const taskSearch = document.getElementById("task-search");
const taskFilter = document.getElementById("task-filter");
const subjectFilter = document.getElementById("subject-filter");

const calendarGrid = document.getElementById("calendar-grid");
const calendarMonth = document.getElementById("calendar-month");
const selectedDateTitle = document.getElementById("selected-date-title");
const selectedDayTasks = document.getElementById("selected-day-tasks");

const subjectProgressList = document.getElementById("subject-progress-list");
const achievementList = document.getElementById("achievement-list");

const themeToggle = document.getElementById("theme-toggle");

const todayDateElement = document.getElementById("today-date");
const greetingElement = document.getElementById("greeting");

const toast = document.getElementById("toast");


/* ==========================================
   2. APPLICATION STATE
========================================== */

let tasks = [];

try {
    const savedTasks = JSON.parse(
        localStorage.getItem("studyPlannerTasks")
    );

    tasks = Array.isArray(savedTasks) ? savedTasks : [];
} catch (error) {
    tasks = [];
}

let editingTaskId = null;

let calendarDate = new Date();

let selectedDate = formatDate(new Date());

let toastTimeout;

let timerInterval = null;
let timerRemaining = 25 * 60;
let timerDuration = 25 * 60;
let timerRunning = false;
let timerEndTime = null;
let timerMode = "Focus session";

let breakInterval = null;


/* ==========================================
   3. DATE UTILITIES
========================================== */

function formatDate(date) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function parseLocalDate(dateString) {
    const parts = dateString.split("-").map(Number);

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );
}


function formatReadableDate(dateString) {
    if (!dateString) {
        return "No date";
    }

    return parseLocalDate(dateString).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


function getToday() {
    return formatDate(new Date());
}


function isOverdue(task) {
    return !task.completed && task.date < getToday();
}


/* ==========================================
   4. SAVE TASKS
========================================== */

function saveTasks() {
    localStorage.setItem(
        "studyPlannerTasks",
        JSON.stringify(tasks)
    );
}


/* ==========================================
   5. TOAST MESSAGE
========================================== */

function showToast(message) {
    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* ==========================================
   6. HEADER AND GREETING
========================================== */

function updateHeader() {
    const now = new Date();

    const hour = now.getHours();

    let greeting = "Good evening 👋";

    if (hour < 12) {
        greeting = "Good morning 👋";
    } else if (hour < 17) {
        greeting = "Good afternoon 👋";
    }

    greetingElement.textContent = greeting;

    todayDateElement.textContent = now.toLocaleDateString(
        "en-IN",
        {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

    taskDate.min = getToday();
}


/* ==========================================
   7. DASHBOARD STATISTICS
========================================== */

function updateStatistics() {
    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const pending = total - completed;

    const completionRate = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    totalTasksElement.textContent = total;

    completedTasksElement.textContent = completed;

    pendingTasksElement.textContent = pending;

    completionRateElement.textContent =
        `${completionRate}%`;
}


/* ==========================================
   8. ADD NEW TASK
========================================== */

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = taskTitle.value.trim();

    const subject = taskSubject.value.trim();

    const date = taskDate.value;

    const priority = taskPriority.value;

    const minutes = Number(taskMinutes.value);

    if (!title || !subject || !date) {
        formMessage.textContent =
            "Please complete all required fields.";

        return;
    }

    if (!Number.isFinite(minutes) || minutes < 5 || minutes > 600) {
        formMessage.textContent =
            "Study time must be between 5 and 600 minutes.";

        return;
    }

    if (editingTaskId !== null) {
        const task = tasks.find(
            item => item.id === editingTaskId
        );

        if (task) {
            task.title = title;
            task.subject = subject;
            task.date = date;
            task.priority = priority;
            task.minutes = minutes;
        }

        editingTaskId = null;

        taskForm.querySelector(
            'button[type="submit"]'
        ).textContent = "＋ Add task";

        formMessage.textContent = "Task updated successfully!";

        showToast("Task updated successfully!");
    } else {
        const newTask = {
            id: Date.now().toString() +
                Math.random().toString(36).slice(2, 7),

            title: title,
            subject: subject,
            date: date,
            priority: priority,
            minutes: minutes,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);

        formMessage.textContent = "Task added successfully!";

        showToast("New study task added!");
    }

    saveTasks();

    taskForm.reset();

    taskMinutes.value = 30;

    taskDate.min = getToday();

    renderAll();

    setTimeout(() => {
        formMessage.textContent = "";
    }, 3000);
});


/* ==========================================
   9. RENDER TASK LIST
========================================== */

function renderTasks() {
    const searchText = taskSearch.value
        .trim()
        .toLowerCase();

    const filterValue = taskFilter.value;

    const subjectValue = subjectFilter.value;

    const today = getToday();

    const filteredTasks = tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchText) ||
            task.subject.toLowerCase().includes(searchText);

        const matchesSubject =
            subjectValue === "all" ||
            task.subject === subjectValue;

        let matchesStatus = true;

        if (filterValue === "pending") {
            matchesStatus = !task.completed;
        }

        if (filterValue === "completed") {
            matchesStatus = task.completed;
        }

        if (filterValue === "today") {
            matchesStatus =
                !task.completed && task.date === today;
        }

        if (filterValue === "overdue") {
            matchesStatus = isOverdue(task);
        }

        return (
            matchesSearch &&
            matchesSubject &&
            matchesStatus
        );
    });

    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        return a.date.localeCompare(b.date);
    });

    taskListContainer.innerHTML = "";

    if (filteredTasks.length === 0) {
        taskListContainer.innerHTML = `
            <p class="empty">
                No tasks found. Add a new task or change your filters.
            </p>
        `;

        return;
    }

    filteredTasks.forEach(task => {
        const taskElement = document.createElement("div");

        taskElement.className = "task-item";

        if (task.completed) {
            taskElement.classList.add("done");
        }

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.completed;
        checkbox.setAttribute(
            "aria-label",
            `Mark ${task.title} as completed`
        );

        checkbox.addEventListener("change", () => {
            toggleTask(task.id);
        });

        const content = document.createElement("div");

        const titleRow = document.createElement("div");

        titleRow.className = "task-title-row";

        const title = document.createElement("span");

        title.className = "task-title";
        title.textContent = task.title;

        const priority = document.createElement("span");

        priority.className = `priority ${task.priority}`;
        priority.textContent = task.priority;

        titleRow.append(title, priority);

        const metadata = document.createElement("div");

        metadata.className = "task-meta";

        const subject = document.createElement("span");

        subject.textContent = `📚 ${task.subject}`;

        const dueDate = document.createElement("span");

        dueDate.textContent =
            `📅 ${formatReadableDate(task.date)}`;

        if (isOverdue(task)) {
            dueDate.classList.add("overdue");
            dueDate.textContent += " • Overdue";
        }

        const duration = document.createElement("span");

        duration.textContent = `⏱ ${task.minutes} min`;

        metadata.append(subject, dueDate, duration);

        content.append(titleRow, metadata);

        const actions = document.createElement("div");

        actions.className = "task-actions";

        const editButton = document.createElement("button");

        editButton.className = "small-btn";
        editButton.textContent = "✎ Edit";
        editButton.setAttribute(
            "aria-label",
            `Edit ${task.title}`
        );

        editButton.addEventListener("click", () => {
            editTask(task.id);
        });

        const deleteButton = document.createElement("button");

        deleteButton.className = "small-btn";
        deleteButton.textContent = "✕ Delete";
        deleteButton.setAttribute(
            "aria-label",
            `Delete ${task.title}`
        );

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        actions.append(editButton, deleteButton);

        taskElement.append(
            checkbox,
            content,
            actions
        );

        taskListContainer.appendChild(taskElement);
    });
}


/* ==========================================
   10. COMPLETE OR UNCOMPLETE TASK
========================================== */

function toggleTask(id) {
    const task = tasks.find(
        item => item.id === id
    );

    if (!task) {
        return;
    }

    task.completed = !task.completed;

    saveTasks();

    renderAll();

    showToast(
        task.completed
            ? "Great work! Task completed 🎉"
            : "Task marked as pending."
    );
}


/* ==========================================
   11. EDIT TASK
========================================== */

function editTask(id) {
    const task = tasks.find(
        item => item.id === id
    );

    if (!task) {
        return;
    }

    editingTaskId = id;

    taskTitle.value = task.title;

    taskSubject.value = task.subject;

    taskDate.value = task.date;

    taskPriority.value = task.priority;

    taskMinutes.value = task.minutes;

    taskForm.querySelector(
        'button[type="submit"]'
    ).textContent = "Save changes";

    formMessage.textContent =
        "Editing task. Update the fields and save.";

    document.getElementById("add-task").scrollIntoView({
        behavior: "smooth"
    });

    taskTitle.focus();
}


/* ==========================================
   12. DELETE TASK
========================================== */

function deleteTask(id) {
    const task = tasks.find(
        item => item.id === id
    );

    if (!task) {
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) {
        return;
    }

    tasks = tasks.filter(
        item => item.id !== id
    );

    if (editingTaskId === id) {
        editingTaskId = null;

        taskForm.reset();

        taskMinutes.value = 30;

        taskForm.querySelector(
            'button[type="submit"]'
        ).textContent = "＋ Add task";
    }

    saveTasks();

    renderAll();

    showToast("Task deleted.");
}


/* ==========================================
   13. UPDATE SUBJECT FILTER
========================================== */

function updateSubjectFilter() {
    const currentValue = subjectFilter.value;

    const subjects = [
        ...new Set(
            tasks.map(task => task.subject)
        )
    ].sort((a, b) => a.localeCompare(b));

    subjectFilter.innerHTML =
        '<option value="all">All subjects</option>';

    subjects.forEach(subject => {
        const option = document.createElement("option");

        option.value = subject;

        option.textContent = subject;

        subjectFilter.appendChild(option);
    });

    if (subjects.includes(currentValue)) {
        subjectFilter.value = currentValue;
    } else {
        subjectFilter.value = "all";
    }
}


/* ==========================================
   14. SEARCH AND FILTER EVENTS
========================================== */

taskSearch.addEventListener("input", renderTasks);

taskFilter.addEventListener("change", renderTasks);

subjectFilter.addEventListener("change", renderTasks);


/* ==========================================
   15. STUDY CALENDAR
========================================== */

function renderCalendar() {
    calendarGrid.innerHTML = "";

    const year = calendarDate.getFullYear();

    const month = calendarDate.getMonth();

    calendarMonth.textContent = new Date(
        year,
        month,
        1
    ).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    });

    const weekdays = [
        "Sun", "Mon", "Tue", "Wed",
        "Thu", "Fri", "Sat"
    ];

    weekdays.forEach(day => {
        const weekday = document.createElement("div");

        weekday.className = "weekday";

        weekday.textContent = day;

        calendarGrid.appendChild(weekday);
    });

    const firstDay = new Date(
        year,
        month,
        1
    ).getDay();

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    const previousMonthDays = new Date(
        year,
        month,
        0
    ).getDate();

    const totalCells = Math.ceil(
        (firstDay + daysInMonth) / 7
    ) * 7;

    for (let i = 0; i < totalCells; i++) {
        let dayNumber;

        let cellDate;

        let outside = false;

        if (i < firstDay) {
            dayNumber = previousMonthDays - firstDay + i + 1;

            cellDate = new Date(
                year,
                month - 1,
                dayNumber
            );

            outside = true;
        } else if (i >= firstDay + daysInMonth) {
            dayNumber = i - firstDay - daysInMonth + 1;

            cellDate = new Date(
                year,
                month + 1,
                dayNumber
            );

            outside = true;
        } else {
            dayNumber = i - firstDay + 1;

            cellDate = new Date(
                year,
                month,
                dayNumber
            );
        }

        const dateString = formatDate(cellDate);

        const dayButton = document.createElement("button");

        dayButton.type = "button";

        dayButton.className = "calendar-day";

        dayButton.textContent = dayNumber;

        if (outside) {
            dayButton.classList.add("outside");
        }

        if (dateString === getToday()) {
            dayButton.classList.add("today");
        }

        if (dateString === selectedDate) {
            dayButton.classList.add("selected");
        }

        const hasTasks = tasks.some(
            task => task.date === dateString
        );

        if (hasTasks) {
            const dot = document.createElement("span");

            dot.className = "dot";

            dayButton.appendChild(dot);
        }

        dayButton.addEventListener("click", () => {
            selectedDate = dateString;

            calendarDate = new Date(
                cellDate.getFullYear(),
                cellDate.getMonth(),
                1
            );

            renderCalendar();

            renderSelectedDayTasks();
        });

        calendarGrid.appendChild(dayButton);
    }

    renderSelectedDayTasks();
}


/* ==========================================
   16. SELECTED CALENDAR DATE TASKS
========================================== */

function renderSelectedDayTasks() {
    selectedDateTitle.textContent =
        parseLocalDate(selectedDate).toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        );

    selectedDayTasks.innerHTML = "";

    const dayTasks = tasks.filter(
        task => task.date === selectedDate
    );

    if (dayTasks.length === 0) {
        selectedDayTasks.innerHTML = `
            <p class="empty">
                No study tasks scheduled for this date.
            </p>
        `;

        return;
    }

    dayTasks.forEach(task => {
        const item = document.createElement("div");

        item.className = "day-task";

        const title = document.createElement("b");

        title.textContent =
            `${task.completed ? "✓ " : ""}${task.title}`;

        const details = document.createElement("small");

        details.textContent =
            `${task.subject} • ${task.minutes} min • ${task.priority}`;

        item.append(title, details);

        selectedDayTasks.appendChild(item);
    });
}


/* Calendar Month Navigation */

document.getElementById("prev-month").addEventListener(
    "click",
    () => {
        calendarDate.setMonth(
            calendarDate.getMonth() - 1
        );

        renderCalendar();
    }
);


document.getElementById("next-month").addEventListener(
    "click",
    () => {
        calendarDate.setMonth(
            calendarDate.getMonth() + 1
        );

        renderCalendar();
    }
);


/* ==========================================
   17. SUBJECT-WISE PROGRESS
========================================== */

function renderSubjectProgress() {
    subjectProgressList.innerHTML = "";

    const subjects = [
        ...new Set(
            tasks.map(task => task.subject)
        )
    ].sort((a, b) => a.localeCompare(b));

    if (subjects.length === 0) {
        subjectProgressList.innerHTML = `
            <p class="empty">
                Add study tasks to see your subject-wise progress.
            </p>
        `;

        return;
    }

    subjects.forEach(subject => {
        const subjectTasks = tasks.filter(
            task => task.subject === subject
        );

        const completed = subjectTasks.filter(
            task => task.completed
        ).length;

        const total = subjectTasks.length;

        const percentage = Math.round(
            (completed / total) * 100
        );

        const item = document.createElement("div");

        const head = document.createElement("div");

        head.className = "progress-head";

        const name = document.createElement("b");

        name.textContent = subject;

        const score = document.createElement("span");

        score.textContent =
            `${completed}/${total} completed • ${percentage}%`;

        head.append(name, score);

        const track = document.createElement("div");

        track.className = "track";

        const fill = document.createElement("div");

        fill.className = "fill";

        fill.style.width = `${percentage}%`;

        track.appendChild(fill);

        item.append(head, track);

        subjectProgressList.appendChild(item);
    });
}


/* ==========================================
   18. ACHIEVEMENT BADGES
========================================== */

function renderAchievements() {
    achievementList.innerHTML = "";

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const totalMinutes = tasks
        .filter(task => task.completed)
        .reduce(
            (sum, task) => sum + task.minutes,
            0
        );

    const badges = [
        {
            icon: "🌱",
            title: "Getting Started",
            description: "Add your first study task.",
            unlocked: tasks.length >= 1
        },
        {
            icon: "⭐",
            title: "First Win",
            description: "Complete your first task.",
            unlocked: completed >= 1
        },
        {
            icon: "🔥",
            title: "On a Roll",
            description: "Complete 5 study tasks.",
            unlocked: completed >= 5
        },
        {
            icon: "🏆",
            title: "Study Champion",
            description: "Complete 10 study tasks.",
            unlocked: completed >= 10
        },
        {
            icon: "📚",
            title: "Bookworm",
            description: "Create 5 study tasks.",
            unlocked: tasks.length >= 5
        },
        {
            icon: "⏱️",
            title: "Time Investor",
            description: "Complete 120 minutes of study tasks.",
            unlocked: totalMinutes >= 120
        },
        {
            icon: "💯",
            title: "Halfway Hero",
            description: "Complete 50% of your tasks.",
            unlocked: tasks.length > 0 &&
                completed / tasks.length >= 0.5
        },
        {
            icon: "🎯",
            title: "Perfect Score",
            description: "Complete all your tasks.",
            unlocked: tasks.length > 0 &&
                completed === tasks.length
        }
    ];

    badges.forEach(badge => {
        const item = document.createElement("div");

        item.className = "badge";

        if (!badge.unlocked) {
            item.classList.add("locked");
        }

        const icon = document.createElement("span");

        icon.textContent = badge.icon;

        const title = document.createElement("b");

        title.textContent = badge.title;

        const description = document.createElement("p");

        description.textContent = badge.unlocked
            ? `Unlocked! ${badge.description}`
            : badge.description;

        item.append(
            icon,
            title,
            description
        );

        achievementList.appendChild(item);
    });
}


/* ==========================================
   19. DARK MODE
========================================== */

const savedTheme = localStorage.getItem("studyPlannerTheme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
}

function updateThemeButton() {
    themeToggle.textContent =
        document.body.classList.contains("dark")
            ? "☀ Toggle light mode"
            : "☾ Toggle dark mode";
}

updateThemeButton();

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const darkMode = document.body.classList.contains("dark");

    localStorage.setItem(
        "studyPlannerTheme",
        darkMode ? "dark" : "light"
    );

    updateThemeButton();

    showToast(
        darkMode
            ? "Dark mode enabled."
            : "Light mode enabled."
    );
});


/* ==========================================
   20. POMODORO TIMER
========================================== */

const timerDisplay = document.getElementById("timer-display");

const timerModeElement = document.getElementById("timer-mode");

const timerStartButton = document.getElementById("timer-start");

const timerResetButton = document.getElementById("timer-reset");

const timerStatus = document.getElementById("timer-status");

const presetButtons = document.querySelectorAll(".preset");


function updateTimerDisplay() {
    const minutes = Math.floor(
        timerRemaining / 60
    );

    const seconds = timerRemaining % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;

    timerModeElement.textContent = timerMode;

    timerStartButton.textContent = timerRunning
        ? "❚❚ Pause"
        : "▶ Start";
}


function stopTimerInterval() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);

        timerInterval = null;
    }
}


function finishTimer() {
    stopTimerInterval();

    timerRunning = false;

    timerRemaining = 0;

    timerEndTime = null;

    updateTimerDisplay();

    timerStatus.textContent =
        `${timerMode} finished! Time for your next step.`;

    showToast(`${timerMode} finished! 🎉`);

    if ("Notification" in window &&
        Notification.permission === "granted") {
        new Notification("StudyPlanner", {
            body: `${timerMode} finished!`
        });
    }
}


function tickTimer() {
    if (!timerRunning || timerEndTime === null) {
        return;
    }

    timerRemaining = Math.max(
        0,
        Math.ceil(
            (timerEndTime - Date.now()) / 1000
        )
    );

    updateTimerDisplay();

    if (timerRemaining <= 0) {
        finishTimer();
    }
}


function startTimer() {
    if (timerRunning) {
        timerRemaining = Math.max(
            0,
            Math.ceil(
                (timerEndTime - Date.now()) / 1000
            )
        );

        stopTimerInterval();

        timerRunning = false;

        timerEndTime = null;

        timerStatus.textContent = "Timer paused.";

        updateTimerDisplay();

        return;
    }

    if (timerRemaining <= 0) {
        timerRemaining = timerDuration;
    }

    timerRunning = true;

    timerEndTime =
        Date.now() + timerRemaining * 1000;

    timerStatus.textContent = "Stay focused. You've got this!";

    timerInterval = setInterval(
        tickTimer,
        250
    );

    updateTimerDisplay();
}


function resetTimer() {
    stopTimerInterval();

    timerRunning = false;

    timerEndTime = null;

    timerRemaining = timerDuration;

    timerStatus.textContent = "Timer reset. Ready when you are.";

    updateTimerDisplay();
}


timerStartButton.addEventListener("click", startTimer);

timerResetButton.addEventListener("click", resetTimer);


presetButtons.forEach(button => {
    button.addEventListener("click", () => {
        stopTimerInterval();

        timerRunning = false;

        timerEndTime = null;

        timerDuration =
            Number(button.dataset.minutes) * 60;

        timerRemaining = timerDuration;

        timerMode = button.dataset.mode;

        presetButtons.forEach(preset => {
            preset.classList.remove("active");
        });

        button.classList.add("active");

        timerStatus.textContent =
            `${timerMode} selected. Ready when you are.`;

        updateTimerDisplay();
    });
});


updateTimerDisplay();


/* ==========================================
   21. BROWSER NOTIFICATIONS
========================================== */

const notificationStatus =
    document.getElementById("notification-status");

const notificationMessage =
    document.getElementById("notification-message");

const enableNotificationsButton =
    document.getElementById("enable-notifications");

const checkDeadlinesButton =
    document.getElementById("check-deadlines");


function updateNotificationStatus() {
    if (!("Notification" in window)) {
        notificationStatus.textContent =
            "Browser notifications are not supported.";

        enableNotificationsButton.disabled = true;

        return;
    }

    if (Notification.permission === "granted") {
        notificationStatus.textContent =
            "Browser notifications are enabled.";

        enableNotificationsButton.textContent =
            "Notifications enabled";

        enableNotificationsButton.disabled = true;
    } else if (Notification.permission === "denied") {
        notificationStatus.textContent =
            "Notifications are blocked in browser settings.";

        enableNotificationsButton.textContent =
            "Notifications blocked";

        enableNotificationsButton.disabled = true;
    } else {
        notificationStatus.textContent =
            "Notifications are not enabled.";

        enableNotificationsButton.disabled = false;
    }
}


enableNotificationsButton.addEventListener("click", async () => {
    if (!("Notification" in window)) {
        notificationMessage.textContent =
            "Your browser does not support notifications.";

        return;
    }

    try {
        const permission = await Notification.requestPermission();

        updateNotificationStatus();

        if (permission === "granted") {
            notificationMessage.textContent =
                "Notifications enabled successfully!";

            showToast("Notifications enabled.");
        } else {
            notificationMessage.textContent =
                "Notification permission was not granted.";
        }
    } catch (error) {
        notificationMessage.textContent =
            "Could not request notification permission.";
    }
});


checkDeadlinesButton.addEventListener("click", () => {
    const today = getToday();

    const dueTasks = tasks.filter(
        task => !task.completed && task.date <= today
    );

    if (dueTasks.length === 0) {
        notificationMessage.textContent =
            "No pending tasks are due today or overdue.";

        showToast("No deadlines to report.");

        return;
    }

    const overdueCount = dueTasks.filter(
        task => task.date < today
    ).length;

    const todayCount = dueTasks.filter(
        task => task.date === today
    ).length;

    notificationMessage.textContent =
        `${todayCount} task(s) due today and ` +
        `${overdueCount} overdue task(s).`;

    if ("Notification" in window &&
        Notification.permission === "granted") {
        new Notification("StudyPlanner deadlines", {
            body:
                `${todayCount} due today; ` +
                `${overdueCount} overdue.`
        });
    }

    showToast("Deadline check completed.");
});


updateNotificationStatus();


/* ==========================================
   22. STUDY BREAK REMINDERS
========================================== */

const breakIntervalSelect =
    document.getElementById("break-interval");

const breakToggleButton =
    document.getElementById("break-toggle");

const breakStatus =
    document.getElementById("break-status");


function stopBreakReminders() {
    if (breakInterval !== null) {
        clearInterval(breakInterval);

        breakInterval = null;
    }

    breakToggleButton.textContent = "Start reminders";

    breakStatus.textContent = "Reminders are off.";
}


function startBreakReminders() {
    const minutes = Number(
        breakIntervalSelect.value
    );

    if (breakInterval !== null) {
        stopBreakReminders();

        return;
    }

    breakInterval = setInterval(() => {
        showToast("Time for a study break! Stretch and hydrate. ☕");

        breakStatus.textContent =
            "Break reminder triggered. Next reminder scheduled.";

        if ("Notification" in window &&
            Notification.permission === "granted") {
            new Notification("StudyPlanner break reminder", {
                body:
                    "Take a short break, stretch, and drink some water."
            });
        }
    }, minutes * 60 * 1000);

    breakToggleButton.textContent = "Stop reminders";

    breakStatus.textContent =
        `Reminders are on every ${minutes} minutes.`;

    showToast("Study break reminders started.");
}


breakToggleButton.addEventListener("click", () => {
    startBreakReminders();
});


breakIntervalSelect.addEventListener("change", () => {
    if (breakInterval !== null) {
        stopBreakReminders();

        startBreakReminders();
    }
});


/* ==========================================
   23. EXPORT TASKS TO CSV
========================================== */

document.getElementById("export-csv").addEventListener(
    "click",
    () => {
        if (tasks.length === 0) {
            showToast("There are no tasks to export.");

            return;
        }

        const headers = [
            "Title",
            "Subject",
            "Due Date",
            "Priority",
            "Minutes",
            "Status"
        ];

        const rows = tasks.map(task => [
            task.title,
            task.subject,
            task.date,
            task.priority,
            task.minutes,
            task.completed ? "Completed" : "Pending"
        ]);

        function escapeCSV(value) {
            let text = String(value ?? "");

            // Prevent spreadsheet formula injection.
            if (/^[\s]*[=+\-@]/.test(text)) {
                text = "'" + text;
            }

            return `"${text.replace(/"/g, '""')}"`;
        }

        const csvContent = [
            headers,
            ...rows
        ]
            .map(row => row.map(escapeCSV).join(","))
            .join("\r\n");

        const blob = new Blob(
            ["\uFEFF" + csvContent],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = "studyplanner-tasks.csv";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

        showToast("Tasks exported successfully!");
    }
);


/* ==========================================
   24. RENDER EVERYTHING
========================================== */

function renderAll() {
    updateStatistics();

    updateSubjectFilter();

    renderTasks();

    renderCalendar();

    renderSubjectProgress();

    renderAchievements();
}


/* ==========================================
   25. INITIALIZE APPLICATION
========================================== */

updateHeader();

renderAll();