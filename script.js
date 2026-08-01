const STORAGE_KEY = "offline-work-setup-schedule-v4";
const BACKUP_KEY = `${STORAGE_KEY}-backup`;
const AUTH_STORAGE_KEY = "offline-work-setup-auth-v1";
const USER_STORAGE_PREFIX = "offline-work-setup-user-v1";
const ADMIN_USER_ID = "admin-account";
const ADMIN_DEFAULT_USERNAME = "Joddy Boy";
const ADMIN_DEFAULT_PASSWORD = "Joddy Boy";
const DEFAULT_EMPLOYEE_COLOR = "#2563eb";
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const GUIDE_STEPS = [
    {
        title: "Start on the Schedule",
        body: "This is the main workspace and the guide will always move in order from here. Do not skip ahead. First inspect the filters and the rows, then use only the highlighted control for the current step. If you click something else by mistake, return here and continue with the next step.",
        selector: ".topbar",
        placement: "bottom",
    },
    {
        title: "Use the Filters",
        body: "Change Year, Month, and Week one by one. Pick a month that has sample rows, then check whether the table updates after every change. This filter order matters because the schedule, summary, credits, and report all follow the active period.",
        selector: ".topbar-controls",
        placement: "bottom",
    },
    {
        title: "Open Settings",
        body: "Click Settings now. Inside the settings window you will test account access, theme colors, the quick guide, employee names, and hard reset later. For this step, only open the main Settings window and wait for the next step before clicking anything else.",
        selector: "#settingsBtn",
        placement: "left",
        beforeEnter: () => {
            closeAllSettingsWindows();
            setActiveView("schedule");
            closeGuideMenu();
        },
    },
    {
        title: "Employee Names",
        body: "Open Employee Names and look at the full row layout. This is where you can add an employee, rename an employee, hide a tab, reopen it, and remove a specific employee. Keep the guide order and do not jump to other settings yet.",
        selector: "#employeeNamesSettingsModal",
        placement: "right",
        beforeEnter: () => {
            openSettings();
            openSettingsDetailModal("employeeNamesSettingsModal");
        },
    },
    {
        title: "Add or Reopen an Employee",
        body: "Click Add Employee, type a sample name like 'Demo Employee', then confirm it appears as a new tab. After that, close one existing employee tab using Close Tab and look back at Employee Names to verify the button changes to Open Tab. This step proves the tab visibility and the settings list stay synced.",
        selector: "#employeeSettingsList",
        placement: "right",
        beforeEnter: () => {
            openSettings();
            openSettingsDetailModal("employeeNamesSettingsModal");
        },
    },
    {
        title: "Add a Schedule Row",
        body: "Go back to the Schedule view and click Add Schedule Row. This creates a new row for the active employee tab. Use Sequence only if you want to re-order the current month dates after adding rows.",
        selector: ".table-actions-right",
        placement: "bottom",
        beforeEnter: () => {
            closeAllSettingsWindows();
            setActiveView("schedule");
            closeGuideMenu();
        },
    },
    {
        title: "Schedule Tabs",
        body: "Switch between ALL and each employee tab to review a single person or the whole team. Use this step to confirm the plus button adds employees, the close button hides tabs, and the Open Tab button can bring them back. If you click the wrong tab, just return to the highlighted one and continue in sequence.",
        selector: "#tabs",
        placement: "bottom",
    },
    {
        title: "Make a WFH Result",
        body: "Pick a row such as July 2. Enter a processing time that meets the target and set Accuracy to No Error. When you do this correctly, the same weekday next week should reflect WFH. Hover the WFH badge to check the specific reason before moving on.",
        selector: "#scheduleBody",
        placement: "top",
        beforeEnter: () => {
            closeAllSettingsWindows();
            setActiveView("schedule");
        },
    },
    {
        title: "Apply WFO Waive",
        body: "On a reflected WFO Ongoing row, open the WFO Waive dropdown and try Justified or Use WFH Credit. After selecting one, confirm the row changes back to WFH and the hover reason still shows the correct chain.",
        selector: "#scheduleBody",
        placement: "top",
        beforeEnter: () => {
            closeAllSettingsWindows();
            setActiveView("schedule");
        },
    },
    {
        title: "Manual WFO",
        body: "On a WFH row, click Manual WFO from the Actions column. A popup window will ask for remarks. Enter a reason, apply it, and confirm the row becomes WFO Ongoing with the same remark shown on hover.",
        selector: "#scheduleBody",
        placement: "top",
        beforeEnter: () => {
            closeAllSettingsWindows();
            setActiveView("schedule");
        },
    },
    {
        title: "Manual WFH",
        body: "On a WFO Ongoing row, click Manual WFH from Actions. Enter a reason in the popup, then apply it. The row should switch back to WFH and the hover tooltip should show your manual reason.",
        selector: "#scheduleBody",
        placement: "top",
        beforeEnter: () => {
            closeAllSettingsWindows();
            setActiveView("schedule");
        },
    },
    {
        title: "WFO Summary",
        body: "Open WFO Summary and check the row details. The summary should show the real reason chain, including Accuracy: With Error, Processing Time values, and Change Schedule details when they apply.",
        selector: "#summaryContent",
        placement: "top",
        beforeEnter: () => {
            closeGuideMenu();
            setActiveView("summary");
        },
    },
    {
        title: "WFH Credits",
        body: "Open WFH Credits and verify the earned credit count per employee. This uses the WFH occurrences required in a week setting, so it is a good place to test whether WFH rows are counted correctly.",
        selector: "#creditsContent",
        placement: "top",
        beforeEnter: () => setActiveView("credits"),
    },
    {
        title: "Dashboard",
        body: "Go to Dashboard to review the WFH, WFO Pending, and WFO Done counts together. Try switching chart style or scope so you can confirm the visualization still matches the filtered rows.",
        selector: "#dashboardContent",
        placement: "top",
        beforeEnter: () => setActiveView("dashboard"),
    },
    {
        title: "Generate Report",
        body: "Open Generate Report, select employees and a date range, then preview the rows before downloading CSV. This is the best place to verify that the same Work Setup logic also appears in exported data.",
        selector: ".report-preview-section",
        placement: "top",
        beforeEnter: () => {
            populateReportScope();
            const reportModal = document.getElementById("reportModal");
            if (reportModal) {
                reportModal.classList.remove("hidden");
                reportModal.setAttribute("aria-hidden", "false");
            }
        },
    },
    {
        title: "Trash Bin",
        body: "Open Trash Bin to verify that deleted rows, deleted employees, and deleted manual credit logs can still be restored or deleted forever. This confirms the app keeps recovery options after remove actions.",
        selector: "#trashContent",
        placement: "top",
        beforeEnter: () => setActiveView("trash"),
    },
    {
        title: "Hard Reset",
        body: "This is the last step in the loop. If you are revisiting the guide and already have existing data, you can click Cancel safely to keep everything. If you want to fully start over with a blank account, click Reset Current Account, then type the password in the next window. After a real reset, the tour starts again from the beginning so you can test the whole tool from scratch.",
        selector: "#hardResetSettingsModal",
        placement: "right",
        beforeEnter: () => {
            openSettings();
            openSettingsDetailModal("hardResetSettingsModal");
        },
    },
];
const SETTINGS_DETAIL_MODAL_IDS = [
    "activeAccountSettingsModal",
    "themeSettingsModal",
    "subtradeTargetsSettingsModal",
    "quickGuideSettingsModal",
    "viewScopeSettingsModal",
    "employeeNamesSettingsModal",
    "hardResetSettingsModal",
    "addEmployeeTabModal",
    "manualWfhCreditOptionsModal",
];
let manualCreditActiveEmployeeFilter = "all";
let manualCreditSearchQuery = "";
let manualCreditFilterYear = "all";
let manualCreditFilterMonth = "all";
let manualCreditFilterWeek = "all";
let manualWfoPendingEmployeeId = "";
let manualWfoPendingRowId = "";
let manualWfhPendingEmployeeId = "";
let manualWfhPendingRowId = "";
const WFH_CREDIT_LEAVE_OPTIONS = ["OFF", "ML", "PL", "TL", "VL"];
const WFH_UNAPPROVED_LEAVE_VALUES = new Set(WFH_CREDIT_LEAVE_OPTIONS);
const DASHBOARD_METRIC_DEFINITIONS = [
    { key: "wfh", label: "WFH", color: "#14b8a6", tone: "good" },
    { key: "wfoOngoing", label: "WFO Ongoing", color: "#dc2626", tone: "risk" },
    { key: "wfoDone", label: "WFO Done", color: "#2563eb", tone: "info" },
    { key: "accuracyWithError", label: "Accuracy (With Error)", color: "#f59e0b", tone: "warn" },
    { key: "accuracyNoError", label: "Accuracy (No Error)", color: "#16a34a", tone: "good" },
    { key: "notTargetProcessingTime", label: "Not Target Processing Time", color: "#b91c1c", tone: "risk" },
    { key: "targetProcessingTime", label: "Target Processing Time", color: "#16a34a", tone: "good" },
    { key: "unapprovedLeavesWith", label: "Unapproved Leaves (With)", color: "#f97316", tone: "warn" },
    { key: "unapprovedLeavesNo", label: "Unapproved Leaves (No)", color: "#0f766e", tone: "good" },
    { key: "changeSchedule", label: "Change Schedule", color: "#7c3aed", tone: "info" },
    { key: "wfhCreditsAvailed", label: "WFH Credits Availed", color: "#64748b", tone: "neutral" },
    { key: "wfhCreditStatus", label: "WFH Credit Status", color: "#0f766e", tone: "good" },
];
let pendingHardResetUserId = "";

function normalizeDashboardMetricFilterKeys(values) {
    const validKeys = new Set(DASHBOARD_METRIC_DEFINITIONS.map((entry) => entry.key));
    const legacyKeyMap = {
        accuracy: "accuracyWithError",
        unapprovedLeaves: "unapprovedLeavesWith",
    };
    if (!Array.isArray(values)) {
        return [];
    }
    return Array.from(new Set(values
        .map((value) => legacyKeyMap[`${value || ""}`.trim()] || `${value || ""}`.trim())
        .filter((value) => validKeys.has(value))));
}

function normalizeDashboardContributorEmployeeIds(values) {
    if (!Array.isArray(values)) {
        return [];
    }
    return Array.from(new Set(values
        .map((value) => `${value || ""}`.trim())
        .filter((value) => Boolean(value))));
}

function normalizeDashboardSectionState(values, defaults) {
    const normalized = { ...(defaults || {}) };
    if (values && typeof values === "object") {
        Object.keys(normalized).forEach((key) => {
            normalized[key] = Boolean(values[key]);
        });
    }
    return normalized;
}

function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createAdminAccount(overrides = {}) {
    const username = `${overrides.username || ADMIN_DEFAULT_USERNAME}`.trim() || ADMIN_DEFAULT_USERNAME;
    const password = typeof overrides.password === "string" && overrides.password.trim()
        ? overrides.password
        : ADMIN_DEFAULT_PASSWORD;
    return {
        id: ADMIN_USER_ID,
        username,
        usernameKey: normalizeUsername(username),
        password,
        role: "admin",
        guideDisabled: Boolean(overrides.guideDisabled),
        ...overrides,
    };
}

function createRow(dateValue, defaults = {}) {
    return {
        id: createId(),
        dateValue,
        processingTime: "",
        wfoWave: "",
        workSetup: "",
        accuracy: "",
        unapprovedLeave: "",
        changeScheduleMonth: "",
        changeScheduleDate: "",
        creditUsed: false,
        wfoDone: false,
        manualWfo: false,
        manualWfoRemarks: "",
        manualWfh: false,
        manualWfhRemarks: "",
        manualOverrideBackup: null,
        notes: "",
        generatedByRowId: "",
        ...defaults,
    };
}

function createEmployee(name = "", defaults = {}) {
    const subtrade = `${defaults.subtrade || ""}`.trim() || "Uncategorized";
    return {
        ...defaults,
        id: createId(),
        name: `${name || ""}`.trim() || "Unnamed Employee",
        subtrade,
        employeeColor: normalizeEmployeeColor(defaults.employeeColor),
        rows: [],
        isHidden: false,
    };
}

function createDefaultState() {
    return {
        headerName: "Work Setup Schedule",
        subtradeProcessingTargets: [],
        manualWfhCreditRules: [],
        lastUpdatedAt: "",
        selectedYear: 2026,
        selectedMonth: 8,
        selectedWeek: "all",
        selectedMonths: [],
        selectedWeeks: [],
        selectedDays: [],
        rememberedWeeksByMonthKey: {},
        selectedSubtrade: "all",
        dashboardChartStyle: "pie",
        dashboardChartScope: "overview",
        dashboardMetricFilterKeys: [],
        dashboardContributorEmployeeIds: [],
        dashboardSectionOpen: {
            overview: false,
            status: false,
            tracking: false,
            contributorMetrics: false,
        },
        dashboardSectionMaximized: {
            tracking: false,
            contributorMetrics: false,
        },
        theme: {
            accent: "#2563eb",
            background: "#f3f6fb",
            surface: "#ffffff",
            text: "#172033",
        },
        deleted: {
            rows: [],
            employees: [],
            manualCreditRules: [],
            taskTargets: [],
        },
        employees: [],
    };
}

function createDefaultAuthState() {
    return {
        currentUserId: "",
        legacyMigrated: false,
        users: [createAdminAccount()],
    };
}

function normalizeChangeScheduleFields(row) {
    const wave = `${row.wfoWave || ""}`.trim();
    if (wave !== "Change Schedule") {
        return {
            changeScheduleMonth: "",
            changeScheduleDate: "",
        };
    }
    return {
        changeScheduleMonth: `${row.changeScheduleMonth || ""}`.trim(),
        changeScheduleDate: `${row.changeScheduleDate || ""}`.trim(),
    };
}

function isSeededDemoEmployees(employees) {
    if (!Array.isArray(employees) || employees.length !== 3) {
        return false;
    }
    const names = employees.map((employee) => `${employee.name || ""}`.trim().toLowerCase()).sort();
    return names.join("|") === "ariel|mina|rico";
}

function cloneState(value) {
    return JSON.parse(JSON.stringify(value));
}

function normalizeUsername(value) {
    return `${value || ""}`.trim().toLowerCase();
}

function ensureAdminAccount(users) {
    const normalizedUsers = Array.isArray(users) ? [...users] : [];
    const adminIndex = normalizedUsers.findIndex((user) => user.id === ADMIN_USER_ID || user.role === "admin");

    if (adminIndex >= 0) {
        normalizedUsers[adminIndex] = createAdminAccount(normalizedUsers[adminIndex]);
        return normalizedUsers;
    }

    normalizedUsers.unshift(createAdminAccount());
    return normalizedUsers;
}

function isAdminUser(user) {
    return Boolean(user && user.role === "admin");
}

function openGuideMenu() {
    const sideNav = document.getElementById("sideNav");
    const menuButton = document.getElementById("menuBtn");
    if (!sideNav || !menuButton) {
        return;
    }
    sideNav.classList.add("open");
    menuButton.classList.add("open");
}

function closeGuideMenu() {
    const sideNav = document.getElementById("sideNav");
    const menuButton = document.getElementById("menuBtn");
    if (!sideNav || !menuButton) {
        return;
    }
    sideNav.classList.remove("open");
    menuButton.classList.remove("open");
}

function getUserStorageKey(userId) {
    return `${USER_STORAGE_PREFIX}-${userId}`;
}

function getUserBackupKey(userId) {
    return `${getUserStorageKey(userId)}-backup`;
}

function parseDateValue(dateValue) {
    if (!dateValue) {
        return new Date();
    }
    const [year, month, day] = `${dateValue}`.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDateValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addDays(dateValue, days) {
    const date = parseDateValue(dateValue);
    date.setDate(date.getDate() + days);
    return formatDateValue(date);
}

function parseDurationToSeconds(value) {
    const text = `${value || ""}`.trim();
    if (!text) {
        return 0;
    }
    if (/^\d+$/.test(text)) {
        return Number(text);
    }
    const parts = text.split(":").map((part) => Number(part));
    if (parts.length === 3 && parts.every((part) => !Number.isNaN(part))) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2 && parts.every((part) => !Number.isNaN(part))) {
        return parts[0] * 3600 + parts[1] * 60;
    }
    return 0;
}

function parseMonthValue(input) {
    const text = `${input || ""}`.trim().toLowerCase();
    if (!text) {
        return null;
    }
    const numeric = Number(text);
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 12) {
        return numeric - 1;
    }
    const monthIndex = monthNames.findIndex((name) => name.toLowerCase() === text);
    if (monthIndex >= 0) {
        return monthIndex;
    }
    return null;
}

function buildDateValue(year, monthIndex, day) {
    const safeMonth = Math.max(0, Math.min(11, monthIndex));
    const lastDay = new Date(year, safeMonth + 1, 0).getDate();
    const safeDay = Math.max(1, Math.min(lastDay, Number(day) || 1));
    return formatDateValue(new Date(year, safeMonth, safeDay));
}

function getDaysInMonth(year, monthIndex) {
    const safeMonth = Math.max(0, Math.min(11, Number(monthIndex) || 0));
    return new Date(Number(year), safeMonth + 1, 0).getDate();
}

function appendMonthOptions(selectElement, selectedMonthIndex) {
    monthNames.forEach((monthName, index) => {
        const option = document.createElement("option");
        option.value = String(index + 1);
        option.textContent = monthName;
        option.selected = index === selectedMonthIndex;
        selectElement.appendChild(option);
    });
}

function appendDayOptions(selectElement, totalDays, selectedDay) {
    for (let day = 1; day <= totalDays; day += 1) {
        const option = document.createElement("option");
        option.value = String(day);
        option.textContent = String(day);
        option.selected = day === Number(selectedDay);
        selectElement.appendChild(option);
    }
}

function getWeekNumber(dateValue) {
    const current = parseDateValue(dateValue);
    const yearStart = new Date(current.getFullYear(), 0, 1);
    const days = Math.floor((current - yearStart) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + yearStart.getDay() + 1) / 7);
}

function getWeekLabel(dateValue) {
    return `Week ${getWeekNumber(dateValue)}`;
}

function getDisplayDate(dateValue) {
    const date = parseDateValue(dateValue);
    return {
        month: monthNames[date.getMonth()],
        date: date.getDate(),
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
    };
}

function loadAuthState() {
    try {
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!saved) {
            return cloneState(createDefaultAuthState());
        }
        return normalizeAuthState(JSON.parse(saved));
    } catch (error) {
        console.warn("Unable to load auth state", error);
        return cloneState(createDefaultAuthState());
    }
}

function normalizeAuthState(saved) {
    const fallback = createDefaultAuthState();
    const users = ensureAdminAccount(Array.isArray(saved?.users)
        ? saved.users.map((user) => ({
            id: user.id || createId(),
            username: `${user.username || ""}`.trim() || "User",
            usernameKey: normalizeUsername(user.usernameKey || user.username),
            password: typeof user.password === "string" ? user.password : "",
            role: user.role === "admin" || user.id === ADMIN_USER_ID ? "admin" : "user",
            guideDisabled: Boolean(user.guideDisabled),
            updatedAt: typeof user.updatedAt === "string" ? user.updatedAt : "",
        })).filter((user) => user.usernameKey)
        : fallback.users);
    const currentUserId = users.some((user) => user.id === saved?.currentUserId) ? saved.currentUserId : fallback.currentUserId;

    return {
        currentUserId,
        legacyMigrated: Boolean(saved?.legacyMigrated),
        users,
    };
}

function saveAuthState() {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function touchUserRecord(userId) {
    const user = auth.users.find((entry) => entry.id === userId);
    if (!user) {
        return;
    }
    user.updatedAt = new Date().toISOString();
}

function formatTimestamp(value) {
    if (!value) {
        return "Not updated yet";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "Not updated yet";
    }
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function getCurrentUser() {
    return auth.users.find((user) => user.id === auth.currentUserId) || null;
}

function findUserByUsername(username) {
    const usernameKey = normalizeUsername(username);
    return auth.users.find((user) => user.usernameKey === usernameKey) || null;
}

function loadLegacyState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const backup = localStorage.getItem(BACKUP_KEY);
        const source = saved || backup;
        return source ? normalizeState(JSON.parse(source)) : null;
    } catch (error) {
        console.warn("Unable to load legacy state", error);
        return null;
    }
}

let auth = loadAuthState();
let pendingMigrationState = null;
let state = loadState();
let activeTab = "all";
let activeView = "schedule";
let pendingDeleteAccountId = "";
let guideStepIndex = -1;
let editingSubtradeTargetId = "";
let shouldScrollToEditingSubtradeTarget = false;

function loadState() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return cloneState(createDefaultState());
    }
    return loadStateForUserId(currentUser.id);
}

function loadStateForUserId(userId) {
    if (!userId) {
        return cloneState(createDefaultState());
    }
    try {
        const saved = localStorage.getItem(getUserStorageKey(userId));
        const backup = localStorage.getItem(getUserBackupKey(userId));
        const source = saved || backup;
        if (!source) {
            return cloneState(createDefaultState());
        }
        return normalizeState(JSON.parse(source));
    } catch (error) {
        console.warn("Unable to load saved state", error);
        return cloneState(createDefaultState());
    }
}

function normalizeState(saved) {
    saved = saved || {};
    const fallback = createDefaultState();
    const defaultDateValue = `${Math.max(2026, Number(saved.selectedYear) || fallback.selectedYear)}-${String(Number(saved.selectedMonth) || fallback.selectedMonth).padStart(2, "0")}-01`;
    const savedEmployees = isSeededDemoEmployees(saved.employees) ? [] : saved.employees;
    const employees = Array.isArray(savedEmployees) && savedEmployees.length
        ? savedEmployees.map((employee) => ({
            id: employee.id || createId(),
            name: employee.name || "Unnamed Employee",
            subtrade: typeof employee.subtrade === "string" && employee.subtrade.trim() ? employee.subtrade.trim() : "Uncategorized",
            employeeColor: normalizeEmployeeColor(employee.employeeColor),
            isHidden: Boolean(employee.isHidden),
            rows: Array.isArray(employee.rows) && employee.rows.length
                ? employee.rows.map((row) => {
                    const normalizedChangeSchedule = normalizeChangeScheduleFields(row);
                    const normalizedRow = {
                        id: row.id || createId(),
                        dateValue: row.dateValue || defaultDateValue,
                        processingTime: typeof row.processingTime === "string" ? row.processingTime : "",
                        wfoWave: row.wfoWave || "",
                        workSetup: typeof row.workSetup === "string" ? row.workSetup : "",
                        accuracy: typeof row.accuracy === "string" ? row.accuracy : "",
                        unapprovedLeave: typeof row.unapprovedLeave === "string" ? row.unapprovedLeave : "",
                        changeScheduleMonth: normalizedChangeSchedule.changeScheduleMonth,
                        changeScheduleDate: normalizedChangeSchedule.changeScheduleDate,
                        creditUsed: Boolean(row.creditUsed),
                        wfoDone: Boolean(row.wfoDone),
                        manualWfo: Boolean(row.manualWfo),
                        manualWfoRemarks: typeof row.manualWfoRemarks === "string" ? row.manualWfoRemarks : "",
                        manualWfh: Boolean(row.manualWfh),
                        manualWfhRemarks: typeof row.manualWfhRemarks === "string" ? row.manualWfhRemarks : "",
                        manualOverrideBackup: row.manualOverrideBackup && typeof row.manualOverrideBackup === "object"
                            ? {
                                wfoWave: typeof row.manualOverrideBackup.wfoWave === "string" ? row.manualOverrideBackup.wfoWave : "",
                                creditUsed: Boolean(row.manualOverrideBackup.creditUsed),
                                changeScheduleMonth: typeof row.manualOverrideBackup.changeScheduleMonth === "string" ? row.manualOverrideBackup.changeScheduleMonth : "",
                                changeScheduleDate: typeof row.manualOverrideBackup.changeScheduleDate === "string" ? row.manualOverrideBackup.changeScheduleDate : "",
                                workSetup: typeof row.manualOverrideBackup.workSetup === "string" ? row.manualOverrideBackup.workSetup : "",
                                wfoDone: Boolean(row.manualOverrideBackup.wfoDone),
                            }
                            : null,
                        notes: row.notes || "",
                        generatedByRowId: typeof row.generatedByRowId === "string" ? row.generatedByRowId : "",
                    };
                    clearPerformanceInputsIfDisabled(normalizedRow);
                    return normalizedRow;
                })
                : [],
        }))
        : fallback.employees;

    const deletedRows = Array.isArray(saved.deleted?.rows)
        ? saved.deleted.rows.map((entry) => ({
            id: entry.id || createId(),
            employeeId: entry.employeeId || "",
            employeeName: entry.employeeName || "Unknown Employee",
            deletedAt: entry.deletedAt || new Date().toISOString(),
            row: {
                ...createRow(defaultDateValue),
                ...(entry.row || {}),
                id: entry.row?.id || createId(),
            },
        }))
        : [];

    const deletedEmployees = Array.isArray(saved.deleted?.employees)
        ? saved.deleted.employees.map((entry) => ({
            id: entry.id || createId(),
            deletedAt: entry.deletedAt || new Date().toISOString(),
            employee: {
                id: entry.employee?.id || createId(),
                name: entry.employee?.name || "Unnamed Employee",
                subtrade: typeof entry.employee?.subtrade === "string" && entry.employee.subtrade.trim() ? entry.employee.subtrade.trim() : "Uncategorized",
                employeeColor: normalizeEmployeeColor(entry.employee?.employeeColor),
                isHidden: Boolean(entry.employee?.isHidden),
                rows: Array.isArray(entry.employee?.rows)
                    ? entry.employee.rows.map((row) => ({
                        ...createRow(defaultDateValue),
                        ...row,
                        id: row.id || createId(),
                    }))
                    : [],
            },
        }))
        : [];

    const deletedManualCreditRules = Array.isArray(saved.deleted?.manualCreditRules)
        ? saved.deleted.manualCreditRules.map((entry) => ({
            id: entry.id || createId(),
            deletedAt: entry.deletedAt || new Date().toISOString(),
            rule: {
                id: entry.rule?.id || createId(),
                employeeId: `${entry.rule?.employeeId || ""}`,
                occurrencesRequired: Math.max(1, Number(entry.rule?.occurrencesRequired) || 1),
                years: Array.from(new Set((Array.isArray(entry.rule?.years) ? entry.rule.years : [])
                    .map((value) => Number(value))
                    .filter((value) => Number.isFinite(value) && value >= 2026))),
                months: Array.from(new Set((Array.isArray(entry.rule?.months) ? entry.rule.months : [])
                    .map((value) => Number(value))
                    .filter((value) => value >= 1 && value <= 12))),
                weeks: Array.from(new Set((Array.isArray(entry.rule?.weeks) ? entry.rule.weeks : [])
                    .map((value) => `${value}`.trim())
                    .filter((value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 53))),
                createdAt: typeof entry.rule?.createdAt === "string" ? entry.rule.createdAt : new Date().toISOString(),
            },
        }))
            .filter((entry) => entry.rule.employeeId && entry.rule.years.length && entry.rule.months.length && entry.rule.weeks.length)
        : [];

    const deletedTaskTargets = Array.isArray(saved.deleted?.taskTargets)
        ? saved.deleted.taskTargets.map((entry) => ({
            id: entry.id || createId(),
            deletedAt: entry.deletedAt || new Date().toISOString(),
            target: {
                id: entry.target?.id || createId(),
                subtrade: `${entry.target?.subtrade || ""}`.trim(),
                targetProcessingTime: `${entry.target?.targetProcessingTime || ""}`.trim(),
                weeklyWfhCreditTarget: `${entry.target?.weeklyWfhCreditTarget || ""}`.trim(),
                countLeaveTowardWfhCreditValues: normalizeCountableLeaveValues(
                    entry.target?.countLeaveTowardWfhCreditValues,
                    entry.target?.countLeaveTowardWfhCredit,
                ),
                taskColor: `${entry.target?.taskColor || ""}`.trim(),
                createdAt: typeof entry.target?.createdAt === "string" ? entry.target.createdAt : new Date().toISOString(),
            },
        })).filter((entry) => entry.target.subtrade)
        : [];

    const normalizedSelectedMonths = Array.isArray(saved.selectedMonths)
        ? Array.from(new Set(saved.selectedMonths.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)))
        : [];

    let normalizedSelectedWeeks = Array.isArray(saved.selectedWeeks)
        ? Array.from(new Set(saved.selectedWeeks.map((value) => `${value}`.trim()).filter((value) => value === "all" || /^\d+$/.test(value))))
        : (`${saved.selectedWeek || ""}`.trim() ? [`${saved.selectedWeek}`.trim()] : []);
    if (normalizedSelectedWeeks.includes("all")) {
        normalizedSelectedWeeks = ["all"];
    }

    const manualWfhCreditRules = Array.isArray(saved.manualWfhCreditRules)
        ? saved.manualWfhCreditRules.map((rule) => ({
            id: rule.id || createId(),
            employeeId: `${rule.employeeId || ""}`,
            occurrencesRequired: Math.max(1, Number(rule.occurrencesRequired) || 1),
            years: Array.from(new Set((Array.isArray(rule.years) ? rule.years : [])
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value) && value >= 2026))),
            months: Array.from(new Set((Array.isArray(rule.months) ? rule.months : [])
                .map((value) => Number(value))
                .filter((value) => value >= 1 && value <= 12))),
            weeks: Array.from(new Set((Array.isArray(rule.weeks) ? rule.weeks : [])
                .map((value) => `${value}`.trim())
                .filter((value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 53))),
            createdAt: typeof rule.createdAt === "string" ? rule.createdAt : new Date().toISOString(),
        }))
            .filter((rule) => rule.employeeId && rule.years.length && rule.months.length && rule.weeks.length)
        : [];

    const subtradeProcessingTargets = Array.isArray(saved.subtradeProcessingTargets)
        ? saved.subtradeProcessingTargets
            .map((entry) => ({
                id: entry.id || createId(),
                subtrade: `${entry.subtrade || ""}`.trim(),
                targetProcessingTime: `${entry.targetProcessingTime || ""}`.trim(),
                weeklyWfhCreditTarget: `${entry.weeklyWfhCreditTarget || ""}`.trim(),
                countLeaveTowardWfhCreditValues: normalizeCountableLeaveValues(
                    entry.countLeaveTowardWfhCreditValues,
                    entry.countLeaveTowardWfhCredit,
                ),
                taskColor: `${entry.taskColor || ""}`.trim(),
                createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
            }))
            .filter((entry) => entry.subtrade)
        : [];

    const selectedSubtrade = typeof saved.selectedSubtrade === "string" && saved.selectedSubtrade.trim()
        ? saved.selectedSubtrade.trim()
        : fallback.selectedSubtrade;
    const dashboardMetricFilterKeys = Array.isArray(saved.dashboardMetricFilterKeys)
        ? normalizeDashboardMetricFilterKeys(saved.dashboardMetricFilterKeys)
        : [];
    const dashboardContributorEmployeeIds = Array.isArray(saved.dashboardContributorEmployeeIds)
        ? normalizeDashboardContributorEmployeeIds(saved.dashboardContributorEmployeeIds)
        : [];
    const selectedDays = Object.prototype.hasOwnProperty.call(saved, "selectedDays")
        ? (Array.isArray(saved.selectedDays)
            ? Array.from(new Set(saved.selectedDays.map((value) => `${value || ""}`.trim()).filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))))
            : [])
        : [];
    const rememberedWeeksByMonthKey = saved.rememberedWeeksByMonthKey && typeof saved.rememberedWeeksByMonthKey === "object"
        ? Object.fromEntries(Object.entries(saved.rememberedWeeksByMonthKey).map(([key, values]) => [
            `${key}`,
            Array.isArray(values)
                ? Array.from(new Set(values.map((value) => `${value || ""}`.trim()).filter((value) => value === "all" || /^\d+$/.test(value))))
                : [],
        ]))
        : {};
    const dashboardSectionOpen = normalizeDashboardSectionState(saved.dashboardSectionOpen, fallback.dashboardSectionOpen);
    const dashboardSectionMaximized = normalizeDashboardSectionState(saved.dashboardSectionMaximized, fallback.dashboardSectionMaximized);

    return {
        headerName: saved.headerName || fallback.headerName,
        subtradeProcessingTargets,
        manualWfhCreditRules,
        lastUpdatedAt: typeof saved.lastUpdatedAt === "string" ? saved.lastUpdatedAt : fallback.lastUpdatedAt,
        selectedYear: Math.max(2026, Number(saved.selectedYear) || fallback.selectedYear),
        selectedMonth: normalizedSelectedMonths[0] || fallback.selectedMonth,
        selectedWeek: normalizedSelectedWeeks[0] || fallback.selectedWeek,
        selectedMonths: normalizedSelectedMonths,
        selectedWeeks: normalizedSelectedWeeks,
        selectedDays,
        selectedSubtrade,
        dashboardChartStyle: saved.dashboardChartStyle || fallback.dashboardChartStyle,
        dashboardChartScope: saved.dashboardChartScope || fallback.dashboardChartScope,
        dashboardMetricFilterKeys,
        dashboardContributorEmployeeIds,
        rememberedWeeksByMonthKey,
        dashboardSectionOpen,
        dashboardSectionMaximized,
        theme: {
            accent: saved.theme?.accent || fallback.theme.accent,
            background: saved.theme?.background || fallback.theme.background,
            surface: saved.theme?.surface || fallback.theme.surface,
            text: saved.theme?.text || fallback.theme.text,
        },
        deleted: {
            rows: deletedRows,
            employees: deletedEmployees,
            manualCreditRules: deletedManualCreditRules,
            taskTargets: deletedTaskTargets,
        },
        employees,
    };
}

pendingMigrationState = loadLegacyState();

function normalizeSubtradeValue(value) {
    return `${value || ""}`.trim().toLowerCase();
}

function normalizeEmployeeColor(value) {
    return normalizeTaskColor(value) || DEFAULT_EMPLOYEE_COLOR;
}

function normalizeTaskColor(value) {
    const color = `${value || ""}`.trim();
    return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : "";
}

function normalizeCountableLeaveValues(values, legacyToggle = false) {
    let candidates = [];
    if (Array.isArray(values)) {
        candidates = values;
    } else if (values && typeof values === "object") {
        candidates = Object.keys(values).filter((key) => Boolean(values[key]));
    }

    const normalized = Array.from(new Set(candidates
        .map((value) => `${value || ""}`.trim().toUpperCase())
        .filter((value) => WFH_UNAPPROVED_LEAVE_VALUES.has(value))));

    if (!normalized.length && legacyToggle) {
        return [...WFH_CREDIT_LEAVE_OPTIONS];
    }
    return normalized;
}

function getTaskTargetEntry(subtrade) {
    const normalizedSubtrade = normalizeSubtradeValue(subtrade);
    if (!normalizedSubtrade || !Array.isArray(state.subtradeProcessingTargets)) {
        return null;
    }
    return state.subtradeProcessingTargets
        .slice()
        .sort((left, right) => (Date.parse(right.createdAt || "") || 0) - (Date.parse(left.createdAt || "") || 0))
        .find((entry) => normalizeSubtradeValue(entry.subtrade) === normalizedSubtrade) || null;
}

function getTaskColor(subtrade) {
    return normalizeTaskColor(getTaskTargetEntry(subtrade)?.taskColor || "");
}

function shouldCountRowTowardWfhCredit(employee, row) {
    if (getDisplayWorkSetup(row, employee) !== "WFH") {
        return false;
    }
    const targetOutcome = getOutcomeForTargetRow(employee, row);
    const leaveReferenceRow = targetOutcome?.sourceRow || row;
    const leaveValue = `${leaveReferenceRow?.unapprovedLeave || ""}`.trim();
    if (!WFH_UNAPPROVED_LEAVE_VALUES.has(leaveValue)) {
        return true;
    }
    const taskTargetEntry = getTaskTargetEntry(employee?.subtrade || "");
    const selectedLeaves = normalizeCountableLeaveValues(
        taskTargetEntry?.countLeaveTowardWfhCreditValues,
        taskTargetEntry?.countLeaveTowardWfhCredit,
    );
    return !selectedLeaves.includes(leaveValue);
}

function shouldDisableProcessingInput(row) {
    const leaveValue = `${row?.unapprovedLeave || ""}`.trim();
    return ["SL", "EL"].includes(leaveValue) || WFH_UNAPPROVED_LEAVE_VALUES.has(leaveValue);
}

function shouldDisableAccuracyInput(row) {
    return false;
}

function shouldDisablePerformanceInputs(row) {
    return shouldDisableProcessingInput(row) && shouldDisableAccuracyInput(row);
}

function clearPerformanceInputsIfDisabled(row) {
    if (!row) {
        return false;
    }
    let cleared = false;
    if (shouldDisableProcessingInput(row) && `${row.processingTime || ""}`.trim()) {
        row.processingTime = "";
        cleared = true;
    }
    if (shouldDisableAccuracyInput(row) && `${row.accuracy || ""}`.trim()) {
        row.accuracy = "";
        cleared = true;
    }
    return cleared;
}

function getReadableTextColor(hexColor) {
    const color = normalizeTaskColor(hexColor);
    if (!color) {
        return "#ffffff";
    }
    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);
    const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);
    return luminance >= 155 ? "#172033" : "#ffffff";
}

function getSubtradeTargetProcessingTime(subtrade) {
    return getTaskTargetEntry(subtrade)?.targetProcessingTime || "";
}

function getTargetProcessingTimeForEmployee(employee) {
    const subtradeTarget = getSubtradeTargetProcessingTime(employee?.subtrade || "");
    return `${subtradeTarget}`.trim();
}

function getTargetProcessingTimeForRow(row, employee) {
    if (employee) {
        return getTargetProcessingTimeForEmployee(employee);
    }
    if (row?.employeeId) {
        const foundEmployee = state.employees.find((entry) => entry.id === row.employeeId);
        return getTargetProcessingTimeForEmployee(foundEmployee || null);
    }
    return "";
}

function isProcessingTimeOffTarget(row, employee) {
    const target = getTargetProcessingTimeForRow(row, employee);
    if (!target) {
        return false;
    }
    return parseDurationToSeconds(row?.processingTime) > parseDurationToSeconds(target);
}

function isProcessingTimeOnTarget(row, employee) {
    const target = getTargetProcessingTimeForRow(row, employee);
    const hasProcessingValue = Boolean(`${row?.processingTime || ""}`.trim());
    if (!target || !hasProcessingValue) {
        return false;
    }
    return parseDurationToSeconds(row.processingTime) <= parseDurationToSeconds(target);
}

function getSubtradeWeeklyCreditTargetNumber(subtrade) {
    const target = Number(getTaskTargetEntry(subtrade)?.weeklyWfhCreditTarget || 0);
    return Number.isFinite(target) && target > 0 ? target : 0;
}

function getManualCreditTargetForRow(employee, row) {
    if (!employee || !row?.dateValue || !Array.isArray(state.manualWfhCreditRules)) {
        return 0;
    }
    const targetOutcome = getOutcomeForTargetRow(employee, row);
    const creditReferenceDateValue = targetOutcome?.sourceRow?.dateValue || row.dateValue;
    const date = parseDateValue(creditReferenceDateValue);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const week = `${getWeekNumber(creditReferenceDateValue)}`;

    const matchingRules = state.manualWfhCreditRules
        .filter((rule) => rule.employeeId === employee.id
            && Array.isArray(rule.years)
            && Array.isArray(rule.months)
            && Array.isArray(rule.weeks)
            && rule.years.includes(year)
            && rule.months.includes(month)
            && rule.weeks.includes(week))
        .sort((left, right) => (Date.parse(right.createdAt || "") || 0) - (Date.parse(left.createdAt || "") || 0));

    const target = Number(matchingRules[0]?.occurrencesRequired || 0);
    return Number.isFinite(target) && target > 0 ? target : 0;
}

function getEffectiveCreditTargetForRow(employee, row) {
    const manualTarget = getManualCreditTargetForRow(employee, row);
    if (manualTarget > 0) {
        return manualTarget;
    }
    const subtradeTarget = getSubtradeWeeklyCreditTargetNumber(employee?.subtrade || "");
    return subtradeTarget > 0 ? subtradeTarget : 0;
}

function getManualCreditRuleEmployeeName(employeeId) {
    const employee = state.employees.find((entry) => entry.id === employeeId);
    return employee?.name || "Unknown Employee";
}

function requireLoggedInUser() {
    if (getCurrentUser()) {
        return true;
    }
    openAuthModal();
    setAuthFeedback("Log in first to manage the schedule.", "error");
    return false;
}

function getYearOptions() {
    const minYear = 2026;
    let maxYear = Math.max(minYear, Number(state.selectedYear) || minYear);
    state.employees.forEach((employee) => {
        employee.rows.forEach((row) => {
            const year = parseDateValue(row.dateValue).getFullYear();
            if (!Number.isNaN(year)) {
                maxYear = Math.max(maxYear, year);
            }
        });
    });
    const years = [];
    for (let year = minYear; year <= maxYear; year += 1) {
        years.push(year);
    }
    return years;
}

function getSubtradeOptions() {
    return getTaskTargetOptions();
}

function getTaskTargetOptions() {
    const set = new Set();
    (state.subtradeProcessingTargets || []).forEach((entry) => {
        const task = `${entry.subtrade || ""}`.trim();
        if (task) {
            set.add(task);
        }
    });
    return Array.from(set).sort((left, right) => left.localeCompare(right));
}

function getAvailableWeekValues(year, months) {
    const validMonths = Array.isArray(months) && months.length
        ? months.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
        : [];
    if (!validMonths.length) {
        return [];
    }
    const weekSet = new Set();

    state.employees.forEach((employee) => {
        employee.rows.forEach((row) => {
            const date = parseDateValue(row.dateValue);
            if (date.getFullYear() !== Number(year)) {
                return;
            }
            const month = date.getMonth() + 1;
            if (validMonths.length && !validMonths.includes(month)) {
                return;
            }
            weekSet.add(String(getWeekNumber(row.dateValue)));
        });
    });

    return Array.from(weekSet).sort((left, right) => Number(left) - Number(right));
}

function getMonthSelectionKey(months) {
    return Array.isArray(months) && months.length
        ? Array.from(new Set(months.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12))).sort((left, right) => left - right).join(",")
        : "none";
}

function getRememberedWeeksForMonths(months) {
    const key = getMonthSelectionKey(months);
    const remembered = state.rememberedWeeksByMonthKey && typeof state.rememberedWeeksByMonthKey === "object"
        ? state.rememberedWeeksByMonthKey[key]
        : [];
    return Array.isArray(remembered) ? remembered : [];
}

function rememberWeeksForMonths(months, weeks) {
    const key = getMonthSelectionKey(months);
    if (!key) {
        return;
    }
    if (!state.rememberedWeeksByMonthKey || typeof state.rememberedWeeksByMonthKey !== "object") {
        state.rememberedWeeksByMonthKey = {};
    }
    state.rememberedWeeksByMonthKey[key] = Array.isArray(weeks)
        ? Array.from(new Set(weeks.map((value) => `${value}`.trim()).filter((value) => value === "all" || /^\d+$/.test(value))))
        : [];
}

function getSelectedBaseFilters() {
    const selectedMonths = Array.isArray(state.selectedMonths)
        ? state.selectedMonths.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
        : [];

    const availableWeeks = getAvailableWeekValues(Number(state.selectedYear) || 2026, selectedMonths);

    const selectedWeeks = Array.isArray(state.selectedWeeks)
        ? state.selectedWeeks.map((value) => `${value}`).filter((week) => week === "all" || availableWeeks.includes(week))
        : [];

    return {
        year: Number(state.selectedYear) || 2026,
        months: selectedMonths,
        weeks: selectedWeeks,
        subtrade: `${state.selectedSubtrade || "all"}`.trim() || "all",
    };
}

function isRowInBaseFilters(row, employee) {
    const { year, months, weeks, subtrade } = getSelectedBaseFilters();
    const date = parseDateValue(row.dateValue);
    if (date.getFullYear() !== year) {
        return false;
    }
    if (!months.length || !months.includes(date.getMonth() + 1)) {
        return false;
    }
    if (!weeks.length) {
        return false;
    }
    if (!weeks.includes("all") && !weeks.includes(String(getWeekNumber(row.dateValue)))) {
        return false;
    }
    if (subtrade !== "all") {
        const employeeSubtrade = normalizeSubtradeValue(employee?.subtrade || "");
        if (employeeSubtrade !== normalizeSubtradeValue(subtrade)) {
            return false;
        }
    }
    return true;
}

function getAvailableDayValues(year, months, weeks, subtrade) {
    const validMonths = Array.isArray(months) && months.length
        ? months.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
        : [];
    const validWeeks = Array.isArray(weeks) && weeks.length
        ? weeks.map((value) => `${value}`)
        : [];
    if (!validMonths.length || !validWeeks.length) {
        return [];
    }
    const selectedSubtrade = `${subtrade || "all"}`.trim() || "all";
    const dateValues = new Set();

    getVisibleEmployees().forEach((employee) => {
        employee.rows.forEach((row) => {
            const date = parseDateValue(row.dateValue);
            if (date.getFullYear() !== Number(year)) {
                return;
            }
            if (validMonths.length && !validMonths.includes(date.getMonth() + 1)) {
                return;
            }
            if (!validWeeks.includes("all") && !validWeeks.includes(String(getWeekNumber(row.dateValue)))) {
                return;
            }
            if (selectedSubtrade !== "all" && normalizeSubtradeValue(employee?.subtrade || "") !== normalizeSubtradeValue(selectedSubtrade)) {
                return;
            }
            dateValues.add(row.dateValue);
        });
    });

    return Array.from(dateValues).sort((left, right) => parseDateValue(left) - parseDateValue(right));
}

function includeDateInActiveFilters(dateValue) {
    if (!dateValue) {
        return;
    }
    const date = parseDateValue(dateValue);
    const selectedYear = Number(state.selectedYear) || 2026;
    if (date.getFullYear() !== selectedYear) {
        return;
    }

    const monthValue = date.getMonth() + 1;
    const selectedMonths = Array.isArray(state.selectedMonths)
        ? state.selectedMonths.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
        : [];
    if (!selectedMonths.includes(monthValue)) {
        selectedMonths.push(monthValue);
        selectedMonths.sort((left, right) => left - right);
        state.selectedMonths = selectedMonths;
    }

    const availableWeeks = getAvailableWeekValues(selectedYear, state.selectedMonths);
    const weekValue = `${getWeekNumber(dateValue)}`;
    const selectedWeeks = Array.isArray(state.selectedWeeks)
        ? state.selectedWeeks.map((value) => `${value}`).filter((value) => value === "all" || availableWeeks.includes(value))
        : [];
    if (!selectedWeeks.includes("all") && !selectedWeeks.includes(weekValue) && availableWeeks.includes(weekValue)) {
        selectedWeeks.push(weekValue);
    }
    state.selectedWeeks = selectedWeeks;
    state.selectedWeek = state.selectedWeeks[0] || "all";

    const availableDays = getAvailableDayValues(selectedYear, state.selectedMonths, state.selectedWeeks, state.selectedSubtrade);
    const selectedDays = Array.isArray(state.selectedDays)
        ? state.selectedDays.map((value) => `${value || ""}`.trim()).filter((value) => Boolean(value))
        : [];
    if (availableDays.includes(dateValue) && !selectedDays.includes(dateValue)) {
        selectedDays.push(dateValue);
        selectedDays.sort((left, right) => parseDateValue(left) - parseDateValue(right));
    }
    state.selectedDays = selectedDays.filter((value) => availableDays.includes(value));
}

function formatDayFilterLabel(dateValue) {
    const date = getDisplayDate(dateValue);
    return `${date.month} ${date.date} ${date.day}`;
}

function setDashboardSectionOpen(sectionKey) {
    state.dashboardSectionOpen = normalizeDashboardSectionState(state.dashboardSectionOpen, createDefaultState().dashboardSectionOpen);
    state.dashboardSectionOpen[sectionKey] = !state.dashboardSectionOpen[sectionKey];
    saveState();
    renderDashboard();
}

function setDashboardSectionMaximized(sectionKey) {
    state.dashboardSectionMaximized = normalizeDashboardSectionState(state.dashboardSectionMaximized, createDefaultState().dashboardSectionMaximized);
    state.dashboardSectionMaximized[sectionKey] = !state.dashboardSectionMaximized[sectionKey];
    saveState();
    renderDashboard();
}

function getUniqueDateValue(employee, preferredDateValue) {
    const taken = new Set(employee.rows.map((row) => row.dateValue));
    if (!taken.has(preferredDateValue)) {
        return preferredDateValue;
    }
    let candidate = preferredDateValue;
    while (taken.has(candidate)) {
        candidate = addDays(candidate, 1);
    }
    return candidate;
}

function restoreDeletedRow(trashRowId) {
    const index = state.deleted.rows.findIndex((entry) => entry.id === trashRowId);
    if (index < 0) {
        return;
    }
    const record = state.deleted.rows[index];
    let employee = state.employees.find((entry) => entry.id === record.employeeId);
    if (!employee) {
        employee = {
            id: record.employeeId || createId(),
            name: record.employeeName || "Restored Employee",
            subtrade: "Uncategorized",
            rows: [],
            isHidden: false,
        };
        state.employees.push(employee);
    }

    const restoredRow = {
        ...createRow(record.row?.dateValue || `${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}-01`),
        ...(record.row || {}),
    };
    restoredRow.id = createId();
    restoredRow.dateValue = getUniqueDateValue(employee, restoredRow.dateValue);
    employee.rows.push(restoredRow);
    state.deleted.rows.splice(index, 1);
    saveState();
    render();
}

function deleteRowForever(trashRowId) {
    state.deleted.rows = state.deleted.rows.filter((entry) => entry.id !== trashRowId);
    saveState();
    render();
}

function restoreDeletedEmployee(trashEmployeeId) {
    const index = state.deleted.employees.findIndex((entry) => entry.id === trashEmployeeId);
    if (index < 0) {
        return;
    }
    const record = state.deleted.employees[index];
    const restored = {
        id: state.employees.some((employee) => employee.id === record.employee.id) ? createId() : record.employee.id,
        name: record.employee.name || "Restored Employee",
        subtrade: typeof record.employee.subtrade === "string" && record.employee.subtrade.trim() ? record.employee.subtrade.trim() : "Uncategorized",
        isHidden: false,
        rows: Array.isArray(record.employee.rows)
            ? record.employee.rows.map((row) => ({
                ...createRow(row.dateValue || `${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}-01`),
                ...row,
                id: createId(),
            }))
            : [],
    };

    state.employees.push(restored);
    state.deleted.employees.splice(index, 1);
    saveState();
    render();
}

function deleteEmployeeForever(trashEmployeeId) {
    state.deleted.employees = state.deleted.employees.filter((entry) => entry.id !== trashEmployeeId);
    saveState();
    render();
}

function hideEmployeeTab(employeeId) {
    if (!requireLoggedInUser()) {
        return;
    }
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return;
    }
    employee.isHidden = true;
    if (activeTab === employeeId) {
        activeTab = "all";
    }
    saveState();
    renderEmployeeNamesSettingsList();
    render();
}

function setEmployeeTabVisibility(employeeId, visible) {
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return;
    }
    employee.isHidden = !visible;
    saveState();
    renderEmployeeNamesSettingsList();
    render();
    openSettingsDetailModal("employeeNamesSettingsModal");
}

function addEmployeeFromTabs() {
    openAddEmployeeTabModal();
}

function renderEmployeeNamesSettingsList() {
    const employeeList = document.getElementById("employeeSettingsList");
    const addEmployeeButton = document.getElementById("addEmployeeBtn");
    const adminPanel = document.getElementById("adminPanel");
    const accountUsernameInput = document.getElementById("accountUsernameInput");
    const accountPasswordInput = document.getElementById("accountPasswordInput");
    const accountFeedback = document.getElementById("accountFeedback");
    const currentUser = getCurrentUser();

    if (!employeeList) {
        return;
    }

    if (accountUsernameInput) {
        accountUsernameInput.value = currentUser?.username || "";
    }
    if (accountPasswordInput) {
        accountPasswordInput.value = currentUser?.password || "";
    }
    if (accountFeedback) {
        accountFeedback.textContent = "";
        delete accountFeedback.dataset.tone;
    }
    if (adminPanel) {
        const showAdminPanel = isAdminUser(currentUser);
        adminPanel.hidden = !showAdminPanel;
        adminPanel.classList.toggle("hidden", !showAdminPanel);
    }

    const taskOptions = getTaskTargetOptions();
    if (addEmployeeButton) {
        const hasTasks = taskOptions.length > 0;
        addEmployeeButton.disabled = !hasTasks;
        addEmployeeButton.title = hasTasks
            ? "Add a new employee"
            : "Please add at least one Task in Task Target Processing Time first.";
    }
    employeeList.innerHTML = "";
    state.employees.forEach((employee) => {
        const row = document.createElement("div");
        row.className = "settings-row";

        const fields = document.createElement("div");
        fields.className = "settings-row-fields";

        const nameInput = document.createElement("input");
        nameInput.className = "input-field";
        nameInput.type = "text";
        nameInput.placeholder = "Employee name";
        nameInput.value = employee.name;
        nameInput.dataset.employeeId = employee.id;
        nameInput.dataset.field = "name";
        nameInput.addEventListener("input", (event) => {
            const targetEmployee = state.employees.find((entry) => entry.id === employee.id);
            if (targetEmployee) {
                targetEmployee.name = event.target.value.trim() || "Unnamed Employee";
                renderTabs();
            }
        });

        const subtradeInput = document.createElement("select");
        subtradeInput.className = "select-field";
        subtradeInput.dataset.employeeId = employee.id;
        subtradeInput.dataset.field = "subtrade";
        const currentTask = `${employee.subtrade || "Uncategorized"}`.trim() || "Uncategorized";
        const options = taskOptions.includes(currentTask) ? taskOptions : [currentTask, ...taskOptions];
        options.forEach((task) => {
            const option = document.createElement("option");
            option.value = task;
            option.textContent = task;
            subtradeInput.appendChild(option);
        });
        subtradeInput.value = currentTask;
        subtradeInput.addEventListener("change", (event) => {
            const targetEmployee = state.employees.find((entry) => entry.id === employee.id);
            if (targetEmployee) {
                targetEmployee.subtrade = event.target.value.trim();
            }
        });

        const colorInput = document.createElement("input");
        colorInput.className = "input-field employee-color-input";
        colorInput.type = "color";
        colorInput.value = normalizeEmployeeColor(employee.employeeColor);
        colorInput.title = "Employee color";
        colorInput.dataset.employeeId = employee.id;
        colorInput.dataset.field = "employeeColor";
        colorInput.addEventListener("input", (event) => {
            const targetEmployee = state.employees.find((entry) => entry.id === employee.id);
            if (targetEmployee) {
                targetEmployee.employeeColor = normalizeEmployeeColor(event.target.value);
                renderTabs();
                render();
            }
        });

        fields.appendChild(nameInput);
        fields.appendChild(subtradeInput);
        fields.appendChild(colorInput);

        const actionGroup = document.createElement("div");
        actionGroup.className = "settings-row-actions";

        const toggleVisibilityButton = document.createElement("button");
        toggleVisibilityButton.className = "secondary-btn";
        toggleVisibilityButton.type = "button";
        toggleVisibilityButton.textContent = employee.isHidden ? "Open Tab" : "Close Tab";
        toggleVisibilityButton.addEventListener("click", () => {
            setEmployeeTabVisibility(employee.id, employee.isHidden);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "icon-btn";
        deleteButton.type = "button";
        deleteButton.textContent = "Remove";
        deleteButton.addEventListener("click", () => {
            deleteEmployee(employee.id);
            openSettingsDetailModal("employeeNamesSettingsModal");
        });

        actionGroup.appendChild(toggleVisibilityButton);
        actionGroup.appendChild(deleteButton);
        row.appendChild(fields);
        row.appendChild(actionGroup);
        employeeList.appendChild(row);
    });
}

function setAddEmployeeTabFeedback(message, tone = "info") {
    const feedback = document.getElementById("addEmployeeTabFeedback");
    if (!feedback) {
        return;
    }
    feedback.textContent = message;
    if (tone === "info") {
        delete feedback.dataset.tone;
        return;
    }
    feedback.dataset.tone = tone;
}

function openAddEmployeeTabModal() {
    if (!requireLoggedInUser()) {
        return;
    }
    const modal = document.getElementById("addEmployeeTabModal");
    const input = document.getElementById("addEmployeeTabNameInput");
    const subtradeInput = document.getElementById("addEmployeeTabSubtradeInput");
    const colorInput = document.getElementById("addEmployeeTabColorInput");
    if (!modal || !input || !subtradeInput || !colorInput) {
        return;
    }

    const taskOptions = getTaskTargetOptions();
    if (!taskOptions.length) {
        window.alert("Please add at least one Task in Task Target Processing Time before adding an employee.");
        return;
    }

    input.value = "";
    subtradeInput.innerHTML = "";
    taskOptions.forEach((task) => {
        const option = document.createElement("option");
        option.value = task;
        option.textContent = task;
        subtradeInput.appendChild(option);
    });
    subtradeInput.value = taskOptions[0];
    colorInput.value = DEFAULT_EMPLOYEE_COLOR;
    setAddEmployeeTabFeedback("Enter employee name and select a task.");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    input.focus();
}

function closeAddEmployeeTabModal() {
    const modal = document.getElementById("addEmployeeTabModal");
    const input = document.getElementById("addEmployeeTabNameInput");
    const subtradeInput = document.getElementById("addEmployeeTabSubtradeInput");
    const colorInput = document.getElementById("addEmployeeTabColorInput");
    if (input) {
        input.value = "";
    }
    if (subtradeInput) {
        subtradeInput.innerHTML = "";
    }
    if (colorInput) {
        colorInput.value = DEFAULT_EMPLOYEE_COLOR;
    }
    setAddEmployeeTabFeedback("Enter employee name and select a task.");
    if (!modal) {
        return;
    }
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
}

function confirmAddEmployeeFromTabs() {
    if (!requireLoggedInUser()) {
        return;
    }
    const input = document.getElementById("addEmployeeTabNameInput");
    const subtradeInput = document.getElementById("addEmployeeTabSubtradeInput");
    const colorInput = document.getElementById("addEmployeeTabColorInput");
    if (!input || !subtradeInput || !colorInput) {
        return;
    }
    if (!getTaskTargetOptions().length) {
        window.alert("Please add at least one Task in Task Target Processing Time before adding an employee.");
        return;
    }
    const name = input.value.trim();
    const subtrade = subtradeInput.value.trim();
    const employeeColor = normalizeEmployeeColor(colorInput.value);
    if (!name) {
        setAddEmployeeTabFeedback("Employee name is required.", "error");
        input.focus();
        return;
    }
    if (!subtrade) {
        setAddEmployeeTabFeedback("Task is required.", "error");
        subtradeInput.focus();
        return;
    }
    const newEmployee = createEmployee(name, { subtrade, employeeColor });
    state.employees.push(newEmployee);
    activeTab = newEmployee.id;
    saveState();
    render();
    closeAddEmployeeTabModal();
}

function setSubtradeTargetFeedback(message, tone = "info") {
    const feedback = document.getElementById("subtradeTargetFeedback");
    if (!feedback) {
        return;
    }
    feedback.textContent = message;
    if (tone === "info") {
        delete feedback.dataset.tone;
        return;
    }
    feedback.dataset.tone = tone;
}

function setSubtradeTargetFormMode(isEditing) {
    const addButton = document.getElementById("addSubtradeTargetBtn");
    const cancelButton = document.getElementById("cancelSubtradeTargetEditBtn");
    if (addButton) {
        addButton.textContent = isEditing ? "Update" : "Add";
        addButton.title = isEditing ? "Save task target changes" : "Add task target";
    }
    if (cancelButton) {
        cancelButton.hidden = !isEditing;
        cancelButton.classList.toggle("hidden", !isEditing);
    }
}

function resetSubtradeTargetForm() {
    const subtradeInput = document.getElementById("subtradeTargetNameInput");
    const targetInput = document.getElementById("subtradeTargetValueInput");
    const weeklyCreditInput = document.getElementById("subtradeTargetWeeklyCreditInput");
    const colorInput = document.getElementById("subtradeTargetColorInput");

    editingSubtradeTargetId = "";
    shouldScrollToEditingSubtradeTarget = false;
    setSubtradeTargetFormMode(false);

    if (subtradeInput) {
        subtradeInput.value = "";
    }
    if (targetInput) {
        targetInput.value = "";
    }
    if (weeklyCreditInput) {
        weeklyCreditInput.value = "";
    }
    setSelectedSubtradeTargetLeaveValues([]);
    if (colorInput) {
        colorInput.value = "#2563eb";
    }
}

function getSubtradeTargetLeaveToggleInputs() {
    return WFH_CREDIT_LEAVE_OPTIONS
        .map((leaveValue) => document.getElementById(`subtradeTargetCountLeave${leaveValue}Input`))
        .filter((input) => Boolean(input));
}

function getSelectedSubtradeTargetLeaveValues() {
    return getSubtradeTargetLeaveToggleInputs()
        .filter((input) => input.checked)
        .map((input) => `${input.value || ""}`.trim().toUpperCase())
        .filter((value) => WFH_UNAPPROVED_LEAVE_VALUES.has(value));
}

function setSelectedSubtradeTargetLeaveValues(values) {
    const selectedValues = new Set(normalizeCountableLeaveValues(values));
    getSubtradeTargetLeaveToggleInputs().forEach((input) => {
        const value = `${input.value || ""}`.trim().toUpperCase();
        input.checked = selectedValues.has(value);
    });
}

function editSubtradeTarget(targetId) {
    const entry = (state.subtradeProcessingTargets || []).find((item) => item.id === targetId);
    if (!entry) {
        return;
    }

    const subtradeInput = document.getElementById("subtradeTargetNameInput");
    const targetInput = document.getElementById("subtradeTargetValueInput");
    const weeklyCreditInput = document.getElementById("subtradeTargetWeeklyCreditInput");
    const colorInput = document.getElementById("subtradeTargetColorInput");
    if (!subtradeInput || !targetInput || !weeklyCreditInput || !colorInput) {
        return;
    }

    subtradeInput.value = `${entry.subtrade || ""}`.trim();
    targetInput.value = `${entry.targetProcessingTime || ""}`.trim();
    weeklyCreditInput.value = `${entry.weeklyWfhCreditTarget || ""}`.trim();
    setSelectedSubtradeTargetLeaveValues(normalizeCountableLeaveValues(
        entry.countLeaveTowardWfhCreditValues,
        entry.countLeaveTowardWfhCredit,
    ));
    colorInput.value = normalizeTaskColor(entry.taskColor) || "#2563eb";

    editingSubtradeTargetId = entry.id;
    shouldScrollToEditingSubtradeTarget = true;
    setSubtradeTargetFormMode(true);
    renderSubtradeTargetList();
    setSubtradeTargetFeedback(`Editing task ${entry.subtrade}. Click Update to save changes.`);
    subtradeInput.focus();
}

function cancelSubtradeTargetEdit() {
    resetSubtradeTargetForm();
    setSubtradeTargetFeedback("Add task-specific target processing time and WFH credit rule.");
}

function renderSubtradeTargetList() {
    const list = document.getElementById("subtradeTargetList");
    if (!list) {
        return;
    }
    list.innerHTML = "";

    const entries = Array.isArray(state.subtradeProcessingTargets)
        ? [...state.subtradeProcessingTargets].sort((left, right) => (Date.parse(right.createdAt || "") || 0) - (Date.parse(left.createdAt || "") || 0))
        : [];

    if (!entries.length) {
        list.innerHTML = '<p class="help-text">No task target processing times yet.</p>';
        return;
    }

    let editingRow = null;

    entries.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "subtrade-target-item";
        if (editingSubtradeTargetId === entry.id) {
            row.classList.add("is-editing");
            editingRow = row;
        }

        const info = document.createElement("div");
        info.className = "subtrade-target-info";
        const title = document.createElement("strong");
        title.textContent = entry.subtrade;
        if (editingSubtradeTargetId === entry.id) {
            const editingBadge = document.createElement("span");
            editingBadge.className = "subtrade-target-editing-badge";
            editingBadge.textContent = "Editing";
            title.appendChild(document.createTextNode(" "));
            title.appendChild(editingBadge);
        }
        const detail = document.createElement("span");
        detail.textContent = `Target: ${entry.targetProcessingTime}`;
        const weeklyCreditDetail = document.createElement("span");
        weeklyCreditDetail.textContent = `WFH occurrences/week for 1 credit: ${entry.weeklyWfhCreditTarget || "Not set"}`;
        const leaveDetail = document.createElement("span");
        const selectedLeaves = normalizeCountableLeaveValues(
            entry.countLeaveTowardWfhCreditValues,
            entry.countLeaveTowardWfhCredit,
        );
        leaveDetail.textContent = `Count toward WFH Credit: ${selectedLeaves.length ? selectedLeaves.join(" / ") : "None"}`;
        const colorDetail = document.createElement("span");
        const colorValue = normalizeTaskColor(entry.taskColor);
        colorDetail.innerHTML = colorValue
            ? `Color: <span class="task-color-swatch" style="background:${colorValue}"></span> ${colorValue}`
            : "Color: Not set";
        info.appendChild(title);
        info.appendChild(detail);
        info.appendChild(weeklyCreditDetail);
        info.appendChild(leaveDetail);
        info.appendChild(colorDetail);

        const actionButtons = document.createElement("div");
        actionButtons.className = "subtrade-target-item-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "secondary-btn";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            editSubtradeTarget(entry.id);
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "danger-btn";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => {
            const confirmed = window.confirm("Are you sure you want to remove this Task?");
            if (!confirmed) {
                return;
            }

            state.deleted = state.deleted || {};
            state.deleted.taskTargets = state.deleted.taskTargets || [];
            state.deleted.taskTargets.push({
                id: createId(),
                deletedAt: new Date().toISOString(),
                target: cloneState(entry),
            });

            state.subtradeProcessingTargets = (state.subtradeProcessingTargets || []).filter((item) => item.id !== entry.id);
            if (editingSubtradeTargetId === entry.id) {
                resetSubtradeTargetForm();
            }
            saveState();
            renderSubtradeTargetList();
            render();
            setSubtradeTargetFeedback(`Removed target for task ${entry.subtrade}.`, "success");
        });

        row.appendChild(info);
        actionButtons.appendChild(editButton);
        actionButtons.appendChild(removeButton);
        row.appendChild(actionButtons);
        list.appendChild(row);
    });

    if (editingRow && shouldScrollToEditingSubtradeTarget) {
        shouldScrollToEditingSubtradeTarget = false;
        requestAnimationFrame(() => {
            editingRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
    }
}

function addSubtradeProcessingTarget() {
    if (!requireLoggedInUser()) {
        return;
    }
    const subtradeInput = document.getElementById("subtradeTargetNameInput");
    const targetInput = document.getElementById("subtradeTargetValueInput");
    const weeklyCreditInput = document.getElementById("subtradeTargetWeeklyCreditInput");
    const colorInput = document.getElementById("subtradeTargetColorInput");
    if (!subtradeInput || !targetInput || !weeklyCreditInput || !colorInput) {
        return;
    }

    const subtrade = subtradeInput.value.trim();
    const targetProcessingTime = targetInput.value.trim();
    const weeklyWfhCreditTarget = weeklyCreditInput.value.trim();
    const countLeaveTowardWfhCreditValues = normalizeCountableLeaveValues(getSelectedSubtradeTargetLeaveValues());
    const taskColor = normalizeTaskColor(colorInput.value) || "#2563eb";

    if (!subtrade) {
        setSubtradeTargetFeedback("Task is required.", "error");
        subtradeInput.focus();
        return;
    }
    if (!targetProcessingTime) {
        setSubtradeTargetFeedback("Target processing time is required.", "error");
        targetInput.focus();
        return;
    }
    const weeklyCreditValue = Number(weeklyWfhCreditTarget);
    if (!weeklyWfhCreditTarget || !Number.isFinite(weeklyCreditValue) || weeklyCreditValue < 1) {
        setSubtradeTargetFeedback("WFH occurrences required per week must be at least 1.", "error");
        weeklyCreditInput.focus();
        return;
    }

    state.subtradeProcessingTargets = state.subtradeProcessingTargets || [];
    let editingEntry = null;
    if (editingSubtradeTargetId) {
        editingEntry = state.subtradeProcessingTargets.find((entry) => entry.id === editingSubtradeTargetId) || null;
        if (!editingEntry) {
            editingSubtradeTargetId = "";
            setSubtradeTargetFormMode(false);
        }
    }

    if (editingEntry) {
        const conflictingEntry = state.subtradeProcessingTargets.find((entry) => entry.id !== editingEntry.id
            && normalizeSubtradeValue(entry.subtrade) === normalizeSubtradeValue(subtrade));
        if (conflictingEntry) {
            setSubtradeTargetFeedback(`Task ${subtrade} already exists. Please use a different task name.`, "error");
            subtradeInput.focus();
            return;
        }

        editingEntry.targetProcessingTime = targetProcessingTime;
        editingEntry.weeklyWfhCreditTarget = String(Math.floor(weeklyCreditValue));
        editingEntry.countLeaveTowardWfhCreditValues = [...countLeaveTowardWfhCreditValues];
        editingEntry.taskColor = taskColor;
        editingEntry.subtrade = subtrade;
        editingEntry.createdAt = new Date().toISOString();
        setSubtradeTargetFeedback(`Updated target and WFH credit rule for task ${subtrade}.`, "success");
    } else {
        const existing = state.subtradeProcessingTargets.find((entry) => normalizeSubtradeValue(entry.subtrade) === normalizeSubtradeValue(subtrade));
        if (existing) {
            existing.targetProcessingTime = targetProcessingTime;
            existing.weeklyWfhCreditTarget = String(Math.floor(weeklyCreditValue));
            existing.countLeaveTowardWfhCreditValues = [...countLeaveTowardWfhCreditValues];
            existing.taskColor = taskColor;
            existing.subtrade = subtrade;
            existing.createdAt = new Date().toISOString();
            setSubtradeTargetFeedback(`Updated target and WFH credit rule for task ${subtrade}.`, "success");
        } else {
            state.subtradeProcessingTargets.push({
                id: createId(),
                subtrade,
                targetProcessingTime,
                weeklyWfhCreditTarget: String(Math.floor(weeklyCreditValue)),
                countLeaveTowardWfhCreditValues: [...countLeaveTowardWfhCreditValues],
                taskColor,
                createdAt: new Date().toISOString(),
            });
            setSubtradeTargetFeedback(`Added target and WFH credit rule for task ${subtrade}.`, "success");
        }
    }

    resetSubtradeTargetForm();
    saveState();
    renderSubtradeTargetList();
    render();
}

function restoreDeletedTaskTarget(trashTargetId) {
    const list = state.deleted?.taskTargets || [];
    const index = list.findIndex((entry) => entry.id === trashTargetId);
    if (index < 0) {
        return;
    }

    const record = list[index];
    const restoredTarget = {
        id: createId(),
        subtrade: `${record.target?.subtrade || ""}`.trim(),
        targetProcessingTime: `${record.target?.targetProcessingTime || ""}`.trim(),
        weeklyWfhCreditTarget: `${record.target?.weeklyWfhCreditTarget || ""}`.trim(),
        countLeaveTowardWfhCreditValues: normalizeCountableLeaveValues(
            record.target?.countLeaveTowardWfhCreditValues,
            record.target?.countLeaveTowardWfhCredit,
        ),
        taskColor: normalizeTaskColor(record.target?.taskColor) || "#2563eb",
        createdAt: new Date().toISOString(),
    };
    if (!restoredTarget.subtrade) {
        return;
    }

    state.subtradeProcessingTargets = state.subtradeProcessingTargets || [];
    const existing = state.subtradeProcessingTargets.find((entry) => normalizeSubtradeValue(entry.subtrade) === normalizeSubtradeValue(restoredTarget.subtrade));
    if (existing) {
        existing.targetProcessingTime = restoredTarget.targetProcessingTime;
        existing.weeklyWfhCreditTarget = restoredTarget.weeklyWfhCreditTarget;
        existing.countLeaveTowardWfhCreditValues = [...restoredTarget.countLeaveTowardWfhCreditValues];
        existing.taskColor = restoredTarget.taskColor;
        existing.createdAt = restoredTarget.createdAt;
    } else {
        state.subtradeProcessingTargets.push(restoredTarget);
    }

    list.splice(index, 1);
    saveState();
    render();
}

function deleteTaskTargetForever(trashTargetId) {
    state.deleted = state.deleted || {};
    state.deleted.taskTargets = (state.deleted.taskTargets || []).filter((entry) => entry.id !== trashTargetId);
    saveState();
    render();
}

function setManualCreditFeedback(message, tone = "info") {
    const feedback = document.getElementById("manualCreditFeedback");
    if (!feedback) {
        return;
    }
    feedback.textContent = message;
    if (tone === "info") {
        delete feedback.dataset.tone;
        return;
    }
    feedback.dataset.tone = tone;
}

function getCheckedValuesFromList(containerId, castToNumber = false) {
    const values = Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map((input) => input.value);
    if (!castToNumber) {
        return values;
    }
    return values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
}

function renderManualCreditEmployeeSelect() {
    const select = document.getElementById("manualCreditEmployeeSelect");
    if (!select) {
        return;
    }
    const previousValue = select.value;
    select.innerHTML = "";
    state.employees.forEach((employee) => {
        const option = document.createElement("option");
        option.value = employee.id;
        option.textContent = employee.name;
        select.appendChild(option);
    });
    if (previousValue && state.employees.some((employee) => employee.id === previousValue)) {
        select.value = previousValue;
    }
}

function buildSelectionCheckbox(labelText, value, checked = false) {
    const label = document.createElement("label");
    label.className = "checkbox-row";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = String(value);
    checkbox.checked = checked;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(labelText));
    return label;
}

function renderManualCreditScopeSelections() {
    const yearList = document.getElementById("manualCreditYearList");
    const monthList = document.getElementById("manualCreditMonthList");
    const weekList = document.getElementById("manualCreditWeekList");
    if (!yearList || !monthList || !weekList) {
        return;
    }

    const selectedYear = Number(state.selectedYear) || 2026;
    const years = Array.from(new Set([selectedYear, ...getYearOptions()])).sort((a, b) => a - b);
    yearList.innerHTML = "";
    years.forEach((year) => {
        yearList.appendChild(buildSelectionCheckbox(`${year}`, year, year === selectedYear));
    });

    monthList.innerHTML = "";
    monthNames.forEach((monthName, index) => {
        const monthNumber = index + 1;
        const isChecked = Array.isArray(state.selectedMonths) && state.selectedMonths.includes(monthNumber);
        monthList.appendChild(buildSelectionCheckbox(monthName, monthNumber, isChecked));
    });

    weekList.innerHTML = "";
    const selectedWeeks = Array.isArray(state.selectedWeeks) ? state.selectedWeeks.filter((value) => value !== "all") : [];
    for (let week = 1; week <= 53; week += 1) {
        weekList.appendChild(buildSelectionCheckbox(`Week ${week}`, week, selectedWeeks.includes(String(week))));
    }
}

function formatRuleScope(rule) {
    const years = (rule.years || []).join(", ");
    const months = (rule.months || []).map((value) => monthNames[value - 1] || value).join(", ");
    const weeks = (rule.weeks || []).map((value) => `Week ${value}`).join(", ");
    return `Years: ${years || "-"} | Months: ${months || "-"} | Weeks: ${weeks || "-"}`;
}

function populateManualCreditLogFilters() {
    const yearSelect = document.getElementById("manualCreditFilterYear");
    const monthSelect = document.getElementById("manualCreditFilterMonth");
    const weekSelect = document.getElementById("manualCreditFilterWeek");
    const searchInput = document.getElementById("manualCreditSearchInput");
    if (!yearSelect || !monthSelect || !weekSelect || !searchInput) {
        return;
    }

    const rules = state.manualWfhCreditRules || [];
    const years = Array.from(new Set(rules.flatMap((rule) => rule.years || []))).sort((a, b) => a - b);
    const months = Array.from(new Set(rules.flatMap((rule) => rule.months || []))).sort((a, b) => a - b);
    const weeks = Array.from(new Set(rules.flatMap((rule) => (rule.weeks || []).map((value) => Number(value))))).sort((a, b) => a - b);

    yearSelect.innerHTML = '<option value="all">All Years</option>';
    years.forEach((year) => {
        const option = document.createElement("option");
        option.value = String(year);
        option.textContent = String(year);
        yearSelect.appendChild(option);
    });

    monthSelect.innerHTML = '<option value="all">All Months</option>';
    months.forEach((monthNumber) => {
        const option = document.createElement("option");
        option.value = String(monthNumber);
        option.textContent = monthNames[monthNumber - 1] || String(monthNumber);
        monthSelect.appendChild(option);
    });

    weekSelect.innerHTML = '<option value="all">All Weeks</option>';
    weeks.forEach((weekNumber) => {
        const option = document.createElement("option");
        option.value = String(weekNumber);
        option.textContent = `Week ${weekNumber}`;
        weekSelect.appendChild(option);
    });

    yearSelect.value = years.includes(Number(manualCreditFilterYear)) ? manualCreditFilterYear : "all";
    monthSelect.value = months.includes(Number(manualCreditFilterMonth)) ? manualCreditFilterMonth : "all";
    weekSelect.value = weeks.includes(Number(manualCreditFilterWeek)) ? manualCreditFilterWeek : "all";
    searchInput.value = manualCreditSearchQuery;

    manualCreditFilterYear = yearSelect.value;
    manualCreditFilterMonth = monthSelect.value;
    manualCreditFilterWeek = weekSelect.value;
}

function clearManualCreditLogFilters() {
    manualCreditSearchQuery = "";
    manualCreditFilterYear = "all";
    manualCreditFilterMonth = "all";
    manualCreditFilterWeek = "all";
    populateManualCreditLogFilters();
    renderManualCreditRuleList();
}

function renderManualCreditEmployeeTabs() {
    const tabs = document.getElementById("manualCreditEmployeeTabs");
    if (!tabs) {
        return;
    }
    tabs.innerHTML = "";

    const allTab = document.createElement("button");
    allTab.type = "button";
    allTab.className = `tab-btn ${manualCreditActiveEmployeeFilter === "all" ? "active" : ""}`;
    allTab.textContent = "All";
    allTab.addEventListener("click", () => {
        manualCreditActiveEmployeeFilter = "all";
        renderManualCreditRuleList();
        renderManualCreditEmployeeTabs();
    });
    tabs.appendChild(allTab);

    const employeeIds = Array.from(new Set((state.manualWfhCreditRules || []).map((rule) => rule.employeeId)));
    employeeIds.forEach((employeeId) => {
        const employeeName = getManualCreditRuleEmployeeName(employeeId);
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = `tab-btn ${manualCreditActiveEmployeeFilter === employeeId ? "active" : ""}`;
        tab.textContent = employeeName;
        tab.addEventListener("click", () => {
            manualCreditActiveEmployeeFilter = employeeId;
            renderManualCreditRuleList();
            renderManualCreditEmployeeTabs();
        });
        tabs.appendChild(tab);
    });
}

function deleteManualCreditRule(ruleId) {
    const rule = (state.manualWfhCreditRules || []).find((entry) => entry.id === ruleId);
    if (!rule) {
        return;
    }
    const confirmed = window.confirm("Are you sure you want to delete this row?");
    if (!confirmed) {
        return;
    }
    state.deleted.manualCreditRules = state.deleted.manualCreditRules || [];
    state.deleted.manualCreditRules.push({
        id: createId(),
        deletedAt: new Date().toISOString(),
        rule: cloneState(rule),
    });
    state.manualWfhCreditRules = (state.manualWfhCreditRules || []).filter((entry) => entry.id !== ruleId);
    saveState();
    render();
    renderManualCreditEmployeeTabs();
    renderManualCreditRuleList();
}

function restoreDeletedManualCreditRule(trashRuleId) {
    const list = state.deleted.manualCreditRules || [];
    const index = list.findIndex((entry) => entry.id === trashRuleId);
    if (index < 0) {
        return;
    }
    const record = list[index];
    state.manualWfhCreditRules = state.manualWfhCreditRules || [];
    state.manualWfhCreditRules.push({
        ...cloneState(record.rule),
        id: createId(),
        createdAt: new Date().toISOString(),
    });
    list.splice(index, 1);
    saveState();
    render();
}

function deleteManualCreditRuleForever(trashRuleId) {
    state.deleted.manualCreditRules = (state.deleted.manualCreditRules || []).filter((entry) => entry.id !== trashRuleId);
    saveState();
    render();
}

function renderManualCreditRuleList() {
    const list = document.getElementById("manualCreditRuleList");
    if (!list) {
        return;
    }
    list.innerHTML = "";

    populateManualCreditLogFilters();

    const rules = (state.manualWfhCreditRules || [])
        .filter((rule) => manualCreditActiveEmployeeFilter === "all" || rule.employeeId === manualCreditActiveEmployeeFilter)
        .filter((rule) => {
            if (manualCreditFilterYear !== "all" && !(rule.years || []).includes(Number(manualCreditFilterYear))) {
                return false;
            }
            if (manualCreditFilterMonth !== "all" && !(rule.months || []).includes(Number(manualCreditFilterMonth))) {
                return false;
            }
            if (manualCreditFilterWeek !== "all" && !(rule.weeks || []).includes(String(manualCreditFilterWeek))) {
                return false;
            }
            if (!manualCreditSearchQuery.trim()) {
                return true;
            }
            const employeeName = getManualCreditRuleEmployeeName(rule.employeeId);
            const searchable = [
                employeeName,
                `${rule.occurrencesRequired}`,
                (rule.years || []).join(" "),
                (rule.months || []).map((value) => monthNames[value - 1] || value).join(" "),
                (rule.weeks || []).map((value) => `Week ${value}`).join(" "),
            ].join(" ").toLowerCase();
            return searchable.includes(manualCreditSearchQuery.trim().toLowerCase());
        })
        .sort((left, right) => (Date.parse(right.createdAt || "") || 0) - (Date.parse(left.createdAt || "") || 0));

    if (!rules.length) {
        list.innerHTML = '<p class="help-text">No manual WFH credit logs yet.</p>';
        return;
    }

    rules.forEach((rule) => {
        const card = document.createElement("div");
        card.className = "manual-credit-log-item";

        const info = document.createElement("div");
        info.className = "manual-credit-log-info";
        const employeeName = getManualCreditRuleEmployeeName(rule.employeeId);
        info.innerHTML = `<strong>${employeeName}</strong><span>${rule.occurrencesRequired} occurrence(s) required for 1 credit</span><span>${formatRuleScope(rule)}</span>`;

        const removeButton = document.createElement("button");
        removeButton.className = "danger-btn";
        removeButton.type = "button";
        removeButton.textContent = "Delete Log";
        removeButton.addEventListener("click", () => {
            deleteManualCreditRule(rule.id);
        });

        card.appendChild(info);
        card.appendChild(removeButton);
        list.appendChild(card);
    });
}

function openManualWfhCreditOptionsModal() {
    if (!requireLoggedInUser()) {
        return;
    }
    const modal = document.getElementById("manualWfhCreditOptionsModal");
    const occurrenceInput = document.getElementById("manualCreditOccurrenceInput");
    if (!modal || !occurrenceInput) {
        return;
    }
    renderManualCreditEmployeeSelect();
    renderManualCreditScopeSelections();
    manualCreditActiveEmployeeFilter = "all";
    manualCreditSearchQuery = "";
    manualCreditFilterYear = "all";
    manualCreditFilterMonth = "all";
    manualCreditFilterWeek = "all";
    populateManualCreditLogFilters();
    renderManualCreditEmployeeTabs();
    renderManualCreditRuleList();
    occurrenceInput.value = "";
    setManualCreditFeedback("Add a log to override the general WFH credit rule for selected employee and time scope.");
    closeSettingsDetailModals();
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

function closeManualWfhCreditOptionsModal() {
    const modal = document.getElementById("manualWfhCreditOptionsModal");
    if (!modal) {
        return;
    }
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
}

function addManualWfhCreditRule() {
    if (!requireLoggedInUser()) {
        return;
    }
    const employeeSelect = document.getElementById("manualCreditEmployeeSelect");
    const occurrenceInput = document.getElementById("manualCreditOccurrenceInput");
    if (!employeeSelect || !occurrenceInput) {
        return;
    }

    const employeeId = employeeSelect.value;
    const occurrencesRequired = Number(occurrenceInput.value);
    const years = getCheckedValuesFromList("manualCreditYearList", true);
    const months = getCheckedValuesFromList("manualCreditMonthList", true);
    const weeks = getCheckedValuesFromList("manualCreditWeekList", false);

    if (!employeeId) {
        setManualCreditFeedback("Select a specific employee.", "error");
        return;
    }
    if (!Number.isFinite(occurrencesRequired) || occurrencesRequired < 1) {
        setManualCreditFeedback("Manual WFH credit occurrence must be at least 1.", "error");
        occurrenceInput.focus();
        return;
    }
    if (!years.length || !months.length || !weeks.length) {
        setManualCreditFeedback("Select at least one year, month, and week.", "error");
        return;
    }

    state.manualWfhCreditRules = state.manualWfhCreditRules || [];
    state.manualWfhCreditRules.push({
        id: createId(),
        employeeId,
        occurrencesRequired,
        years,
        months,
        weeks,
        createdAt: new Date().toISOString(),
    });

    const targetEmployee = state.employees.find((entry) => entry.id === employeeId) || null;
    const invalidatedDates = reconcileUsedCreditsAfterEligibilityChange(targetEmployee);

    saveState();
    render();
    manualCreditActiveEmployeeFilter = employeeId;
    renderManualCreditEmployeeTabs();
    renderManualCreditRuleList();
    occurrenceInput.value = "";
    setManualCreditFeedback("Manual WFH credit log added.", "success");

    if (invalidatedDates.length) {
        const dateList = invalidatedDates.join(", ");
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.alert(`The previous "Use WFH Credit" for ${dateList} has been invalidated because your WFH Credit point is no longer available.`);
            });
        });
    }
}

function saveState() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return;
    }
    state.lastUpdatedAt = new Date().toISOString();
    touchUserRecord(currentUser.id);
    saveAuthState();
    const serialized = JSON.stringify(state);
    localStorage.setItem(getUserStorageKey(currentUser.id), serialized);
    localStorage.setItem(getUserBackupKey(currentUser.id), serialized);
}

function applyTheme() {
    document.documentElement.style.setProperty("--primary", state.theme.accent);
    document.documentElement.style.setProperty("--primary-soft", `${state.theme.accent}18`);
    document.documentElement.style.setProperty("--app-bg", state.theme.background);
    document.documentElement.style.setProperty("--surface", state.theme.surface);
    document.documentElement.style.setProperty("--text", state.theme.text);
}

function getSelectedFilters() {
    const baseFilters = getSelectedBaseFilters();

    return {
        ...baseFilters,
        days: Array.isArray(state.selectedDays) ? state.selectedDays.map((value) => `${value || ""}`.trim()).filter((value) => Boolean(value)) : null,
    };
}

function isRowInFilters(row, employee) {
    const { days } = getSelectedFilters();
    if (!isRowInBaseFilters(row, employee)) {
        return false;
    }
    if (Array.isArray(days) && !days.length) {
        return false;
    }
    if (Array.isArray(days) && days.length && !days.includes(row.dateValue)) {
        return false;
    }
    return true;
}

function getFilteredRows(employee) {
    return employee.rows.filter((row) => isRowInFilters(row, employee));
}

function getVisibleEmployees() {
    return state.employees.filter((employee) => !employee.isHidden);
}

function getVisibleRows() {
    const rows = getVisibleEmployees().flatMap((employee) =>
        getFilteredRows(employee).map((row) => ({ ...row, employeeId: employee.id, employeeName: employee.name }))
    );
    return activeTab === "all" ? rows : rows.filter((row) => row.employeeId === activeTab);
}

function getAllRows() {
    return state.employees.flatMap((employee) =>
        getFilteredRows(employee).map((row) => ({ ...row, employeeId: employee.id, employeeName: employee.name }))
    );
}

function getWfoReasons(row, employee) {
    const reasons = [];
    const leaveValue = `${row.unapprovedLeave || ""}`.trim();
    if (isProcessingTimeOffTarget(row, employee)) {
        reasons.push("Processing Time");
    }
    if (row.accuracy === "With Error") {
        reasons.push("Accuracy");
    }
    if (['SL', 'EL'].includes(leaveValue)) {
        reasons.push("Unapproved Leave");
    }
    if (row.wfoWave === "Change Schedule" || row.wfoWave === "Justified" || row.wfoWave === "Use WFH Credit") {
        reasons.push("WFO Waive");
    }
    if ((row.changeScheduleMonth || "").trim() || (row.changeScheduleDate || "").trim()) {
        reasons.push("Change Schedule");
    }
    return reasons;
}

function hasWfoReason(row) {
    return getWfoReasons(row).length > 0;
}

function hasWaveSelection(row) {
    return ["Justified", "Change Schedule", "Use WFH Credit"].includes(`${row.wfoWave || ""}`.trim());
}

function hasProjectionDriver(row, employee) {
    return getProjectedOutcomesFromSourceRow(row, employee).length > 0;
}

function getProjectedDateForSourceRow(row, employee) {
    const [firstProjection] = getProjectedOutcomesFromSourceRow(row, employee);
    return firstProjection?.targetDate || "";
}

function getProjectedOutcomeFromSourceRow(row, employee) {
    const [firstProjection] = getProjectedOutcomesFromSourceRow(row, employee);
    return firstProjection?.outcome || null;
}

function getBaseProjectedOutcomeFromSourceRow(row, employee) {
    if (!hasSetupInput(row)) {
        return null;
    }
    const reasons = getWfoReasons(row, employee).filter((reason) => reason !== "WFO Waive" && reason !== "Change Schedule");
    if (reasons.length) {
        return { setup: "WFO", reasons };
    }

    return { setup: "WFH", reasons: ["Eligible"] };
}

function getProjectedOutcomesFromSourceRow(row, employee) {
    const projections = [];
    const baseOutcome = getBaseProjectedOutcomeFromSourceRow(row, employee);
    if (baseOutcome) {
        projections.push({
            targetDate: addDays(row.dateValue, 7),
            source: "base",
            outcome: baseOutcome,
        });
    }

    if (row.wfoWave === "Change Schedule") {
        const monthIndex = parseMonthValue(row.changeScheduleMonth);
        if (monthIndex !== null && row.changeScheduleDate) {
            projections.push({
                targetDate: buildDateValue(Number(state.selectedYear), monthIndex, row.changeScheduleDate),
                source: "change",
                outcome: { setup: "WFO", reasons: ["Change Schedule"] },
            });
        }
    }

    const dedupedByDate = new Map();
    projections.forEach((entry) => {
        const existing = dedupedByDate.get(entry.targetDate);
        if (!existing || (existing.outcome.setup !== "WFO" && entry.outcome.setup === "WFO")) {
            dedupedByDate.set(entry.targetDate, entry);
        }
    });

    return Array.from(dedupedByDate.values());
}

function getOutcomeForTargetRow(employee, row) {
    if (!employee || !row?.dateValue) {
        return null;
    }
    const matches = employee.rows
        .filter((sourceRow) => sourceRow.id !== row.id)
        .flatMap((sourceRow) => getProjectedOutcomesFromSourceRow(sourceRow, employee)
            .map((projection) => ({
                sourceRow,
                targetDate: projection.targetDate,
                outcome: projection.outcome,
            })))
        .filter((entry) => entry.targetDate === row.dateValue && entry.outcome);

    if (!matches.length) {
        return null;
    }

    matches.sort((left, right) => {
        if (left.outcome.setup === right.outcome.setup) {
            return parseDateValue(right.sourceRow.dateValue) - parseDateValue(left.sourceRow.dateValue);
        }
        return left.outcome.setup === "WFO" ? -1 : 1;
    });

    return matches[0];
}

function ensureProjectedResultRow(employee, row) {
    const projections = getProjectedOutcomesFromSourceRow(row, employee);
    if (!projections.length) {
        return;
    }

    projections.forEach((projection) => {
        const existingTargetRow = employee.rows.find((entry) => entry.id !== row.id && entry.dateValue === projection.targetDate);
        if (existingTargetRow) {
            if (!existingTargetRow.generatedByRowId) {
                existingTargetRow.generatedByRowId = row.id;
            }
            return;
        }
        employee.rows.push(createRow(projection.targetDate, { generatedByRowId: row.id }));
        includeDateInActiveFilters(projection.targetDate);
    });
}

function clearProjectedResultFromSource(employee, sourceRowId) {
    employee.rows.forEach((entry) => {
        if (entry.generatedByRowId === sourceRowId) {
            entry.generatedByRowId = "";
        }
    });
}

function getEffectiveDate(row) {
    const projectedDate = getProjectedDateForSourceRow(row, null);
    if (projectedDate) {
        return projectedDate;
    }
    return row.dateValue;
}

function hasAnySetupSelection(row) {
    return Boolean(
        `${row.processingTime || ""}`.trim()
        || `${row.accuracy || ""}`.trim()
        || `${row.unapprovedLeave || ""}`.trim()
        || `${row.wfoWave || ""}`.trim()
        || `${row.changeScheduleMonth || ""}`.trim()
        || `${row.changeScheduleDate || ""}`.trim()
    );
}

function getDisplayWorkSetup(row, employee) {
    if (row.manualWfh) {
        return "WFH";
    }
    if (row.manualWfo) {
        return "WFO";
    }

    const targetOutcome = getOutcomeForTargetRow(employee, row);
    if (targetOutcome?.outcome?.setup) {
        if (targetOutcome.outcome.setup === "WFO" && (row.wfoWave === "Justified" || row.wfoWave === "Use WFH Credit")) {
            return "WFH";
        }
        return targetOutcome.outcome.setup;
    }

    return "";
}

function getWorkSetupClass(row, employee) {
    if (row.manualWfo) {
        return "setup-badge reflected-wfo";
    }

    const targetOutcome = getOutcomeForTargetRow(employee, row);
    if (targetOutcome?.outcome?.setup === "WFO") {
        if (row.wfoWave === "Justified" || row.wfoWave === "Use WFH Credit") {
            return "setup-badge";
        }
        if (row.wfoWave === "Change Schedule") {
            return "setup-badge wfo-waived";
        }
        return "setup-badge reflected-wfo";
    }
    if (targetOutcome?.outcome?.setup === "WFH") {
        return "setup-badge";
    }

    return "";
}

function getWfoReasonTooltip(row, employee) {
    if (row.manualWfo) {
        return row.manualWfoRemarks ? `Manual WFO remarks: ${row.manualWfoRemarks}` : "Manual WFO";
    }

    const targetOutcome = getOutcomeForTargetRow(employee, row);
    if (targetOutcome?.outcome?.setup !== "WFO") {
        return "";
    }

    function mapReasonLabels(sourceRow, reasons) {
        const labels = [];
        const leaveCode = `${sourceRow?.unapprovedLeave || ""}`.trim();
        const combinedAccuracyLabel = leaveCode && reasons.includes("Accuracy") ? `${leaveCode} + With Error` : "with error";
        if (reasons.includes("Processing Time")) {
            labels.push("not on target processing time");
        }
        if (reasons.includes("Accuracy")) {
            labels.push(combinedAccuracyLabel);
        }
        if (reasons.includes("Unapproved Leave") && !reasons.includes("Accuracy")) {
            const leaveCode = `${sourceRow?.unapprovedLeave || ""}`.trim();
            labels.push(leaveCode === "SL" || leaveCode === "EL" ? leaveCode : "SL/EL");
        }
        if (reasons.includes("Change Schedule")) {
            labels.push("change schedule");
        }
        return labels;
    }

    function joinReasonLabels(labels) {
        if (!labels.length) {
            return "WFO";
        }
        if (labels.length === 1) {
            return labels[0];
        }
        if (labels.length === 2) {
            return `${labels[0]} and ${labels[1]}`;
        }
        return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
    }

    const reasons = targetOutcome.outcome.reasons || [];
    const sourceDisplay = getDisplayDate(targetOutcome.sourceRow.dateValue);
    const sourceReasonText = joinReasonLabels(mapReasonLabels(targetOutcome.sourceRow, reasons));

    // If this WFO came from a change schedule projection, include its reflected root cause chain.
    if (reasons.includes("Change Schedule")) {
        const rootOutcome = getOutcomeForTargetRow(employee, targetOutcome.sourceRow);
        const targetDisplay = getDisplayDate(row.dateValue);
        const sourceLine = `${sourceDisplay.month} ${sourceDisplay.date} ${sourceDisplay.day}: changed schedule to ${targetDisplay.month} ${targetDisplay.date} ${targetDisplay.day}`;

        if (rootOutcome?.outcome?.setup === "WFO") {
            const rootSourceDisplay = getDisplayDate(rootOutcome.sourceRow.dateValue);
            const rootReasons = rootOutcome.outcome.reasons || [];
            const rootReasonText = joinReasonLabels(mapReasonLabels(rootOutcome.sourceRow, rootReasons));
            const reflectedLine = `${rootSourceDisplay.month} ${rootSourceDisplay.date} ${rootSourceDisplay.day}: ${rootReasonText} reflected to ${sourceDisplay.month} ${sourceDisplay.date} ${sourceDisplay.day}`;

            const sourcePerformanceReasons = getPerformanceTriggeredWfoReasons(targetOutcome.sourceRow, employee);
            const sourceExtraReasonText = sourcePerformanceReasons.length
                ? ` | ${sourceDisplay.month} ${sourceDisplay.date} ${sourceDisplay.day}: ${joinReasonLabels(mapReasonLabels(targetOutcome.sourceRow, sourcePerformanceReasons))}`
                : "";

            return `${reflectedLine}${sourceExtraReasonText} | ${sourceLine}`;
        }

        return `${sourceLine} | reason: ${sourceReasonText}`;
    }

    return `${sourceDisplay.month} ${sourceDisplay.date} ${sourceDisplay.day}: ${sourceReasonText}`;
}

function getWfhReasonTooltip(row, employee) {
    if (!employee) {
        return "";
    }

    function getPositiveWfhReasons(sourceRow, sourceEmployee) {
        const reasons = [];
        const metTarget = isProcessingTimeOnTarget(sourceRow, sourceEmployee || employee);
        if (metTarget) {
            reasons.push("Met the Target Processing Time");
        }
        if ((sourceRow?.accuracy || "") === "No Error") {
            reasons.push("No Error");
        }
        return reasons;
    }

    function joinReasonLabels(reasons) {
        if (!reasons.length) {
            return "";
        }
        if (reasons.length === 1) {
            return reasons[0];
        }
        if (reasons.length === 2) {
            return `${reasons[0]} and ${reasons[1]}`;
        }
        return `${reasons.slice(0, -1).join(", ")}, and ${reasons[reasons.length - 1]}`;
    }

    if (row.manualWfh) {
        return row.manualWfhRemarks ? `Manual WFH remarks: ${row.manualWfhRemarks}` : "Manual WFH";
    }

    const targetOutcome = getOutcomeForTargetRow(employee, row);
    if (targetOutcome?.outcome?.setup === "WFO") {
        const sourceDisplay = getDisplayDate(targetOutcome.sourceRow.dateValue);
        if (row.wfoWave === "Justified") {
            return `${sourceDisplay.month} ${sourceDisplay.date} ${sourceDisplay.day}: reflected WFO waived by Justified`;
        }
        if (row.wfoWave === "Use WFH Credit") {
            return `${sourceDisplay.month} ${sourceDisplay.date} ${sourceDisplay.day}: reflected WFO waived by Use WFH Credit`;
        }
    }

    if (targetOutcome?.outcome?.setup === "WFH") {
        const sourceDisplay = getDisplayDate(targetOutcome.sourceRow.dateValue);
        const positiveReasons = getPositiveWfhReasons(targetOutcome.sourceRow, employee);
        if (positiveReasons.length) {
            return `${sourceDisplay.month} ${sourceDisplay.date} ${sourceDisplay.day}: ${joinReasonLabels(positiveReasons)}`;
        }
        return `${sourceDisplay.month} ${sourceDisplay.date} ${sourceDisplay.day}: no WFO trigger, reflected as WFH`;
    }

    if (!hasAnySetupSelection(row)) {
        return "";
    }

    if (row.wfoWave === "Justified") {
        return "WFH due to WFO Waive: Justified";
    }
    if (row.wfoWave === "Use WFH Credit") {
        return "WFH due to WFO Waive: Use WFH Credit";
    }

    const performanceReasons = getPerformanceTriggeredWfoReasons(row, employee);
    if (performanceReasons.length) {
        return "No Reference";
    }

    const positiveReasons = getPositiveWfhReasons(row, employee);
    if (positiveReasons.length) {
        return `WFH because ${joinReasonLabels(positiveReasons)}.`;
    }

    const leaveValue = `${row.unapprovedLeave || ""}`.trim();
    if (WFH_UNAPPROVED_LEAVE_VALUES.has(leaveValue)) {
        return `WFH due to leave type: ${leaveValue}.`;
    }

    return "No WFO trigger on this row, so Work Setup is WFH.";
}

function getPerformanceTriggeredWfoReasons(row, employee) {
    const reasons = [];
    if (isProcessingTimeOffTarget(row, employee)) {
        reasons.push("Processing Time");
    }
    if (row.accuracy === "With Error") {
        reasons.push("Accuracy");
    }
    if (["SL", "EL"].includes((row.unapprovedLeave || "").trim())) {
        reasons.push("Unapproved Leave");
    }
    return reasons;
}

function getChangeScheduleTargetDate(row) {
    if (row.wfoWave !== "Change Schedule") {
        return "";
    }
    const monthIndex = parseMonthValue(row.changeScheduleMonth);
    if (monthIndex === null || !row.changeScheduleDate) {
        return "";
    }
    return buildDateValue(Number(state.selectedYear), monthIndex, row.changeScheduleDate);
}

function recalculateRowWorkSetup(row) {
    if (!hasAnySetupSelection(row)) {
        row.workSetup = "";
    } else if (row.wfoWave === "Change Schedule") {
        row.workSetup = "WFO";
    } else {
        row.workSetup = "WFH";
    }
}

function resolveChangeScheduleConflictsForBaseWfo(employee, baseSourceRow) {
    const performanceReasons = getPerformanceTriggeredWfoReasons(baseSourceRow, employee);
    if (!performanceReasons.length) {
        return [];
    }

    const targetDateValue = addDays(baseSourceRow.dateValue, 7);
    const conflicts = employee.rows.filter((entry) =>
        entry.id !== baseSourceRow.id
        && getChangeScheduleTargetDate(entry) === targetDateValue);

    conflicts.forEach((conflictRow) => {
        conflictRow.wfoWave = "";
        conflictRow.changeScheduleMonth = "";
        conflictRow.changeScheduleDate = "";
        clearProjectedResultFromSource(employee, conflictRow.id);
        recalculateRowWorkSetup(conflictRow);
    });

    return conflicts;
}

function formatRescheduleConflictReasons(performanceReasons) {
    const reasons = [];
    if (performanceReasons.includes("Processing Time")) {
        reasons.push("Processing Time");
    }
    if (performanceReasons.includes("Accuracy")) {
        reasons.push("Accuracy (With Error)");
    }
    if (performanceReasons.includes("Unapproved Leave")) {
        reasons.push("SL or EL");
    }

    if (!reasons.length) {
        return "Processing Time, Accuracy (With Error), or SL or EL";
    }
    if (reasons.length === 1) {
        return reasons[0];
    }
    if (reasons.length === 2) {
        return `${reasons[0]} and ${reasons[1]}`;
    }
    return `${reasons.slice(0, -1).join(", ")}, and ${reasons[reasons.length - 1]}`;
}

function hasSetupInput(row) {
    const processingValue = `${row.processingTime || ""}`.trim();
    const accuracyValue = `${row.accuracy || ""}`.trim();
    const leaveValue = `${row.unapprovedLeave || ""}`.trim();

    const hasAccuracySignal = accuracyValue && accuracyValue !== "No Error";
    const hasLeaveSignal = leaveValue && leaveValue !== "N/A";

    return Boolean(
        processingValue
        || hasAccuracySignal
        || hasLeaveSignal
    );
}

function isTrackedWfoRow(row, employee) {
    return getDisplayWorkSetup(row, employee) === "WFO";
}

function syncEmployeeWfoDoneFlags(employee) {
    employee.rows.forEach((entry) => {
        if (!isTrackedWfoRow(entry, employee)) {
            entry.wfoDone = false;
        }
    });
}

function setRowWfoDone(employeeId, rowId, done) {
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return;
    }
    const row = employee.rows.find((entry) => entry.id === rowId);
    if (!row || !isTrackedWfoRow(row, employee)) {
        return;
    }
    row.wfoDone = Boolean(done);
    saveState();
    render();
}

function openManualWfoModal(employeeId, rowId) {
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return;
    }
    const row = employee.rows.find((entry) => entry.id === rowId);
    if (!row) {
        return;
    }

    const modal = document.getElementById("manualWfoModal");
    const input = document.getElementById("manualWfoRemarksInput");
    const feedback = document.getElementById("manualWfoFeedback");
    const title = document.getElementById("manualWfoPromptTitle");
    if (!modal || !input || !feedback || !title) {
        return;
    }

    const displaySetup = getDisplayWorkSetup(row, employee);
    if (displaySetup !== "WFH") {
        window.alert("Manual WFO is available for WFH rows only.");
        return;
    }

    manualWfoPendingEmployeeId = employeeId;
    manualWfoPendingRowId = rowId;
    const date = getDisplayDate(row.dateValue);
    title.textContent = `${employee.name} • ${date.month} ${date.date} ${date.day}`;
    input.value = row.manualWfoRemarks || "";
    feedback.textContent = "Add a reason why this specific row should be tagged as WFO Ongoing.";
    delete feedback.dataset.tone;

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    input.focus();
}

function closeManualWfoModal() {
    const modal = document.getElementById("manualWfoModal");
    const input = document.getElementById("manualWfoRemarksInput");
    const feedback = document.getElementById("manualWfoFeedback");
    if (!modal || !input || !feedback) {
        return;
    }

    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    manualWfoPendingEmployeeId = "";
    manualWfoPendingRowId = "";
    input.value = "";
    feedback.textContent = "Add a reason why this specific row should be tagged as WFO Ongoing.";
    delete feedback.dataset.tone;
}

function setManualWfo(employeeId, rowId, remarks) {
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return false;
    }
    const row = employee.rows.find((entry) => entry.id === rowId);
    if (!row) {
        return false;
    }

    const remarksText = `${remarks || ""}`.trim();
    if (!remarksText) {
        return false;
    }

    if (!row.manualOverrideBackup) {
        row.manualOverrideBackup = {
            wfoWave: row.wfoWave || "",
            creditUsed: Boolean(row.creditUsed),
            changeScheduleMonth: row.changeScheduleMonth || "",
            changeScheduleDate: row.changeScheduleDate || "",
            workSetup: row.workSetup || "",
            wfoDone: Boolean(row.wfoDone),
        };
    }

    row.manualWfo = true;
    row.manualWfoRemarks = remarksText;
    row.manualWfh = false;
    row.manualWfhRemarks = "";
    row.wfoDone = false;
    row.wfoWave = "";
    row.creditUsed = false;
    row.changeScheduleMonth = "";
    row.changeScheduleDate = "";
    row.workSetup = "WFO";

    syncEmployeeWfoDoneFlags(employee);
    saveState();
    render();
    return true;
}

function openManualWfhModal(employeeId, rowId) {
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return;
    }
    const row = employee.rows.find((entry) => entry.id === rowId);
    if (!row) {
        return;
    }

    const modal = document.getElementById("manualWfhModal");
    const input = document.getElementById("manualWfhRemarksInput");
    const feedback = document.getElementById("manualWfhFeedback");
    const title = document.getElementById("manualWfhPromptTitle");
    if (!modal || !input || !feedback || !title) {
        return;
    }

    const displaySetup = getDisplayWorkSetup(row, employee);
    if (!(displaySetup === "WFO" && !row.wfoDone)) {
        window.alert("Manual WFH is available for WFO Ongoing rows only.");
        return;
    }

    manualWfhPendingEmployeeId = employeeId;
    manualWfhPendingRowId = rowId;
    const date = getDisplayDate(row.dateValue);
    title.textContent = `${employee.name} • ${date.month} ${date.date} ${date.day}`;
    input.value = row.manualWfhRemarks || "";
    feedback.textContent = "Add a reason why this specific row should be tagged as WFH.";
    delete feedback.dataset.tone;

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    input.focus();
}

function closeManualWfhModal() {
    const modal = document.getElementById("manualWfhModal");
    const input = document.getElementById("manualWfhRemarksInput");
    const feedback = document.getElementById("manualWfhFeedback");
    if (!modal || !input || !feedback) {
        return;
    }

    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    manualWfhPendingEmployeeId = "";
    manualWfhPendingRowId = "";
    input.value = "";
    feedback.textContent = "Add a reason why this specific row should be tagged as WFH.";
    delete feedback.dataset.tone;
}

function setManualWfh(employeeId, rowId, remarks) {
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return false;
    }
    const row = employee.rows.find((entry) => entry.id === rowId);
    if (!row) {
        return false;
    }

    const remarksText = `${remarks || ""}`.trim();
    if (!remarksText) {
        return false;
    }

    if (!row.manualOverrideBackup) {
        row.manualOverrideBackup = {
            wfoWave: row.wfoWave || "",
            creditUsed: Boolean(row.creditUsed),
            changeScheduleMonth: row.changeScheduleMonth || "",
            changeScheduleDate: row.changeScheduleDate || "",
            workSetup: row.workSetup || "",
            wfoDone: Boolean(row.wfoDone),
        };
    }

    row.manualWfh = true;
    row.manualWfhRemarks = remarksText;
    row.manualWfo = false;
    row.manualWfoRemarks = "";
    row.wfoDone = false;
    row.wfoWave = "";
    row.creditUsed = false;
    row.changeScheduleMonth = "";
    row.changeScheduleDate = "";
    row.workSetup = "WFH";

    syncEmployeeWfoDoneFlags(employee);
    saveState();
    render();
    return true;
}

function undoManualOverride(employeeId, rowId) {
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return;
    }
    const row = employee.rows.find((entry) => entry.id === rowId);
    if (!row) {
        return;
    }

    const backup = row.manualOverrideBackup;
    row.manualWfo = false;
    row.manualWfoRemarks = "";
    row.manualWfh = false;
    row.manualWfhRemarks = "";

    if (backup) {
        row.wfoWave = backup.wfoWave || "";
        row.creditUsed = Boolean(backup.creditUsed);
        row.changeScheduleMonth = backup.changeScheduleMonth || "";
        row.changeScheduleDate = backup.changeScheduleDate || "";
        row.workSetup = backup.workSetup || "";
        row.wfoDone = Boolean(backup.wfoDone);
    } else {
        row.wfoWave = "";
        row.creditUsed = false;
        row.changeScheduleMonth = "";
        row.changeScheduleDate = "";
        recalculateRowWorkSetup(row);
    }

    row.manualOverrideBackup = null;

    if (!hasProjectionDriver(row, employee)) {
        clearProjectedResultFromSource(employee, row.id);
    }
    ensureProjectedResultRow(employee, row);
    syncEmployeeWfoDoneFlags(employee);
    saveState();
    render();
}

function confirmManualWfh() {
    const feedback = document.getElementById("manualWfhFeedback");
    const input = document.getElementById("manualWfhRemarksInput");
    if (!feedback || !input) {
        return;
    }

    const remarks = input.value.trim();
    if (!remarks) {
        feedback.textContent = "Reason is required before tagging this row as Manual WFH.";
        feedback.dataset.tone = "error";
        input.focus();
        return;
    }

    const isApplied = setManualWfh(manualWfhPendingEmployeeId, manualWfhPendingRowId, remarks);
    if (!isApplied) {
        feedback.textContent = "Unable to apply Manual WFH. Please try again.";
        feedback.dataset.tone = "error";
        return;
    }

    closeManualWfhModal();
}

function confirmManualWfo() {
    const feedback = document.getElementById("manualWfoFeedback");
    const input = document.getElementById("manualWfoRemarksInput");
    if (!feedback || !input) {
        return;
    }

    const remarks = input.value.trim();
    if (!remarks) {
        feedback.textContent = "Reason is required before tagging this row as Manual WFO.";
        feedback.dataset.tone = "error";
        input.focus();
        return;
    }

    const isApplied = setManualWfo(manualWfoPendingEmployeeId, manualWfoPendingRowId, remarks);
    if (!isApplied) {
        feedback.textContent = "Unable to apply Manual WFO. Please try again.";
        feedback.dataset.tone = "error";
        return;
    }

    closeManualWfoModal();
}

function getWfoStatusLabel(row) {
    return row.wfoDone ? "Done" : "Ongoing";
}

function getEmployeeCreditBalance(employee) {
    const weeklyGroups = {};
    const hasManualRules = Array.isArray(state.manualWfhCreditRules) && state.manualWfhCreditRules.length > 0;
    const hasTaskCreditTargets = Array.isArray(state.subtradeProcessingTargets)
        && state.subtradeProcessingTargets.some((entry) => Number(entry?.weeklyWfhCreditTarget) > 0);
    if (!hasManualRules && !hasTaskCreditTargets) {
        return 0;
    }

    getFilteredRows(employee).forEach((row) => {
        if (!row.dateValue || row.creditUsed || row.wfoWave === "Use WFH Credit") {
            return;
        }
        if (shouldCountRowTowardWfhCredit(employee, row)) {
            const date = parseDateValue(row.dateValue);
            const weekKey = `${date.getFullYear()}-${date.getMonth() + 1}-${getWeekNumber(row.dateValue)}`;
            if (!weeklyGroups[weekKey]) {
                weeklyGroups[weekKey] = {
                    count: 0,
                    target: getEffectiveCreditTargetForRow(employee, row),
                };
            }
            weeklyGroups[weekKey].count += 1;
        }
    });

    const earned = Object.values(weeklyGroups).reduce((sum, entry) => {
        const target = Number(entry.target);
        if (!target || target < 1) {
            return sum;
        }
        return sum + Math.floor(entry.count / target);
    }, 0);
    const used = getFilteredRows(employee).filter((row) => row.creditUsed).length;
    return earned - used;
}

function reconcileUsedCreditsAfterEligibilityChange(employee) {
    if (!employee) {
        return [];
    }

    const weeklyGroups = {};
    getFilteredRows(employee).forEach((row) => {
        if (!row.dateValue || row.creditUsed || row.wfoWave === "Use WFH Credit") {
            return;
        }
        if (shouldCountRowTowardWfhCredit(employee, row)) {
            const date = parseDateValue(row.dateValue);
            const weekKey = `${date.getFullYear()}-${date.getMonth() + 1}-${getWeekNumber(row.dateValue)}`;
            if (!weeklyGroups[weekKey]) {
                weeklyGroups[weekKey] = {
                    count: 0,
                    target: getEffectiveCreditTargetForRow(employee, row),
                };
            }
            weeklyGroups[weekKey].count += 1;
        }
    });

    const earned = Object.values(weeklyGroups).reduce((sum, entry) => {
        const target = Number(entry.target);
        if (!target || target < 1) {
            return sum;
        }
        return sum + Math.floor(entry.count / target);
    }, 0);

    const usedRows = getFilteredRows(employee)
        .filter((row) => row.creditUsed || row.wfoWave === "Use WFH Credit")
        .sort((left, right) => parseDateValue(right.dateValue) - parseDateValue(left.dateValue));

    const overflowCount = Math.max(0, usedRows.length - earned);
    if (!overflowCount) {
        return [];
    }

    const invalidatedDates = [];
    for (let index = 0; index < overflowCount; index += 1) {
        const row = usedRows[index];
        if (!row) {
            continue;
        }
        row.creditUsed = false;
        if (row.wfoWave === "Use WFH Credit") {
            row.wfoWave = "";
        }
        recalculateRowWorkSetup(row);
        const date = getDisplayDate(row.dateValue);
        invalidatedDates.push(`${date.month} ${date.date}`);
    }

    return invalidatedDates;
}

function getMonthRows(employee) {
    const year = Number(state.selectedYear);
    const monthIndex = Number(state.selectedMonth) - 1;
    return employee.rows.filter((row) => {
        const date = parseDateValue(row.dateValue);
        return date.getFullYear() === year && date.getMonth() === monthIndex;
    });
}

function ensureDateSequence(employee) {
    const year = Number(state.selectedYear);
    const monthIndex = Number(state.selectedMonth) - 1;
    const monthRows = employee.rows.filter((row) => {
        const date = parseDateValue(row.dateValue);
        return date.getFullYear() === year && date.getMonth() === monthIndex;
    });
    const sortedRows = [...monthRows].sort((left, right) => parseDateValue(left.dateValue) - parseDateValue(right.dateValue));

    const seenDates = new Set();
    const duplicates = [];
    sortedRows.forEach((row) => {
        if (seenDates.has(row.dateValue)) {
            duplicates.push(row.dateValue);
        }
        seenDates.add(row.dateValue);
    });
    if (duplicates.length) {
        window.alert("Date already exists.");
        return false;
    }

    return true;
}

function getNextDateValue(employee) {
    const year = Number(state.selectedYear);
    const monthIndex = Number(state.selectedMonth) - 1;
    const monthRows = getMonthRows(employee);
    const existingDates = new Set(monthRows.map((row) => row.dateValue));
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    let cursor = new Date(firstDay);
    while (cursor <= lastDay) {
        const dateValue = formatDateValue(cursor);
        if (!existingDates.has(dateValue)) {
            return dateValue;
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    const allDates = employee.rows
        .map((row) => parseDateValue(row.dateValue))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((left, right) => left - right);

    if (!allDates.length) {
        return formatDateValue(firstDay);
    }
    return formatDateValue(new Date(allDates[allDates.length - 1].getTime() + (24 * 60 * 60 * 1000)));
}

function updateRow(employeeId, rowId, field, value) {
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return;
    }
    const row = employee.rows.find((entry) => entry.id === rowId);
    if (!row) {
        return;
    }

    if (field === "processingTime") {
        if (shouldDisableProcessingInput(row)) {
            clearPerformanceInputsIfDisabled(row);
        } else {
            row.processingTime = value;
        }
    } else if (field === "wfoWave") {
        const isWfoWaiver = value === "Justified" || value === "Use WFH Credit";
        if (isWfoWaiver) {
            const reflectedOutcome = getOutcomeForTargetRow(employee, row)?.outcome?.setup;
            const projectedOutcome = getBaseProjectedOutcomeFromSourceRow(row, employee)?.setup;
            const isApplicableToWfo = reflectedOutcome === "WFO" || projectedOutcome === "WFO";
            if (!isApplicableToWfo) {
                row.wfoWave = "";
                row.creditUsed = false;
                saveState();
                render();
                window.alert(`${value} waive is applicable for WFO Setup only.`);
                return;
            }
        }

        if (value === "Use WFH Credit") {
            const balance = getEmployeeCreditBalance(employee);
            if (balance <= 0) {
                row.wfoWave = "";
                row.creditUsed = false;
                saveState();
                render();
                window.alert("No WFH Credit(s) available");
                return;
            }
            row.creditUsed = true;
            row.wfoWave = value;
            row.workSetup = "WFH";
        } else {
            row.wfoWave = value;
            row.creditUsed = false;
            if (value === "Change Schedule") {
                row.workSetup = "WFO";
            } else {
                row.workSetup = "WFH";
            }
        }
    } else if (field === "accuracy") {
        if (shouldDisableAccuracyInput(row)) {
            clearPerformanceInputsIfDisabled(row);
        } else {
            row.accuracy = value;
        }
    } else if (field === "unapprovedLeave") {
        row.unapprovedLeave = value;
        clearPerformanceInputsIfDisabled(row);
    } else if (field === "changeScheduleMonth") {
        row.changeScheduleMonth = value;
    } else if (field === "changeScheduleDate") {
        row.changeScheduleDate = value;
    }

    recalculateRowWorkSetup(row);

    if (row.wfoWave !== "Change Schedule") {
        row.changeScheduleMonth = "";
        row.changeScheduleDate = "";
    }

    if (field === "processingTime" || field === "accuracy" || field === "unapprovedLeave") {
        if (!hasAnySetupSelection(row)) {
            row.workSetup = "";
        } else if (row.wfoWave === "Change Schedule") {
            row.workSetup = "WFO";
        } else {
            row.workSetup = "WFH";
        }

        const performanceReasons = getPerformanceTriggeredWfoReasons(row, employee);
        const conflictRows = resolveChangeScheduleConflictsForBaseWfo(employee, row);
        if (conflictRows.length) {
            const sourceList = conflictRows
                .map((conflictRow) => {
                    const display = getDisplayDate(conflictRow.dateValue);
                    return `${display.month} ${display.date} ${display.day}`;
                })
                .join(", ");
            const reasonText = formatRescheduleConflictReasons(performanceReasons);
            const targetDisplayDate = getDisplayDate(addDays(row.dateValue, 7));
            window.alert(`Please reschedule the Change request from ${sourceList}. ${targetDisplayDate.month} ${targetDisplayDate.date} ${targetDisplayDate.day} is already WFO due to ${reasonText}.`);
        }
    }

    if (!hasProjectionDriver(row, employee)) {
        clearProjectedResultFromSource(employee, row.id);
    }

    ensureProjectedResultRow(employee, row);
    syncEmployeeWfoDoneFlags(employee);

    if (field === "processingTime" || field === "accuracy" || field === "unapprovedLeave") {
        const invalidatedDates = reconcileUsedCreditsAfterEligibilityChange(employee);
        if (invalidatedDates.length) {
            const dateList = invalidatedDates.join(", ");
            window.alert(`The previous "Use WFH Credit" for ${dateList} has been invalidated because your WFH Credit point is no longer available.`);
            syncEmployeeWfoDoneFlags(employee);
        }
    }

    saveState();
    render();
}

function updateDateRow(employeeId, rowId, monthText, dayText) {
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return;
    }
    const row = employee.rows.find((entry) => entry.id === rowId);
    if (!row) {
        return;
    }

    const monthIndex = parseMonthValue(monthText);
    if (monthIndex === null) {
        return;
    }

    const nextDateValue = buildDateValue(Number(state.selectedYear), monthIndex, dayText);
    const duplicateRow = employee.rows.find((entry) => entry.id !== row.id && entry.dateValue === nextDateValue);
    if (duplicateRow) {
        window.alert("Date already exists.");
        return;
    }

    row.dateValue = nextDateValue;
    ensureDateSequence(employee);
    ensureProjectedResultRow(employee, row);
    syncEmployeeWfoDoneFlags(employee);
    saveState();
    render();
}

function clearChangeScheduleSelection(employee, row, options = {}) {
    if (!options.keepMonth) {
        row.changeScheduleMonth = "";
    }
    row.changeScheduleDate = "";
    clearProjectedResultFromSource(employee, row.id);
}

function isDateTaggedAsWfo(employee, sourceRowId, targetDateValue) {
    const targetRow = employee.rows.find((entry) => entry.id !== sourceRowId && entry.dateValue === targetDateValue);
    if (!targetRow) {
        return false;
    }

    const matches = employee.rows
        .filter((sourceRow) => sourceRow.id !== targetRow.id && sourceRow.id !== sourceRowId)
        .flatMap((sourceRow) => getProjectedOutcomesFromSourceRow(sourceRow, employee)
            .map((projection) => ({
                sourceRow,
                targetDate: projection.targetDate,
                outcome: projection.outcome,
            })))
        .filter((entry) => entry.targetDate === targetRow.dateValue && entry.outcome);

    if (!matches.length) {
        return false;
    }

    matches.sort((left, right) => {
        if (left.outcome.setup === right.outcome.setup) {
            return parseDateValue(right.sourceRow.dateValue) - parseDateValue(left.sourceRow.dateValue);
        }
        return left.outcome.setup === "WFO" ? -1 : 1;
    });

    return matches[0].outcome.setup === "WFO";
}

function applyChangeScheduleUpdate(employeeId, rowId, monthText, dayText) {
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return;
    }
    const row = employee.rows.find((entry) => entry.id === rowId);
    if (!row) {
        return;
    }

    const monthIndex = parseMonthValue(monthText);
    if (monthIndex === null) {
        return;
    }

    row.changeScheduleMonth = monthText;
    row.changeScheduleDate = dayText;
    if (monthText && dayText) {
        const targetDateValue = buildDateValue(Number(state.selectedYear), monthIndex, dayText);
        const defaultTargetDate = addDays(row.dateValue, 7);
        const performanceReasons = getPerformanceTriggeredWfoReasons(row, employee);
        const isConflictingWithBaseWfo = Boolean(performanceReasons.length && targetDateValue === defaultTargetDate);
        if (isConflictingWithBaseWfo) {
            row.changeScheduleDate = "";
            clearProjectedResultFromSource(employee, row.id);
            ensureProjectedResultRow(employee, row);
            syncEmployeeWfoDoneFlags(employee);
            saveState();
            render();
            const sourceDate = getDisplayDate(row.dateValue);
            window.alert(`Please reschedule the Change request of WFO from ${sourceDate.month} ${sourceDate.date} ${sourceDate.day}`);
            return;
        }
        if (isDateTaggedAsWfo(employee, row.id, targetDateValue)) {
            clearChangeScheduleSelection(employee, row, { keepMonth: true });
            syncEmployeeWfoDoneFlags(employee);
            saveState();
            render();
            window.alert("This date is already tagged as WFO");
            return;
        }
        const existingTargetRow = employee.rows.find((entry) => entry.id !== row.id && entry.dateValue === targetDateValue);
        if (existingTargetRow) {
            if (!existingTargetRow.generatedByRowId) {
                existingTargetRow.generatedByRowId = row.id;
            }
        } else {
            employee.rows.push(createRow(targetDateValue, {
                processingTime: "",
                workSetup: "",
                accuracy: "",
                unapprovedLeave: "",
                wfoWave: "",
                changeScheduleMonth: "",
                changeScheduleDate: "",
                generatedByRowId: row.id,
            }));
            includeDateInActiveFilters(targetDateValue);
        }
        row.wfoWave = "Change Schedule";
        row.workSetup = "WFO";
        row.creditUsed = false;
    }

    if (!hasProjectionDriver(row, employee)) {
        clearProjectedResultFromSource(employee, row.id);
    }

    ensureDateSequence(employee);
    ensureProjectedResultRow(employee, row);
    syncEmployeeWfoDoneFlags(employee);
    saveState();
    render();
}

function deleteRow(employeeId, rowId) {
    if (!requireLoggedInUser()) {
        return;
    }
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return;
    }
    const row = employee.rows.find((entry) => entry.id === rowId);
    if (!row) {
        return;
    }
    const confirmed = window.confirm("⚠️ Warning: Move this schedule row to Trash Bin?");
    if (!confirmed) {
        return;
    }
    state.deleted.rows.push({
        id: createId(),
        employeeId: employee.id,
        employeeName: employee.name,
        row: cloneState(row),
        deletedAt: new Date().toISOString(),
    });
    employee.rows = employee.rows.filter((entry) => entry.id !== rowId);
    saveState();
    render();
}

function deleteEmployee(employeeId) {
    if (!requireLoggedInUser()) {
        return;
    }
    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return;
    }
    const confirmed = window.confirm("⚠️ Warning: Move this employee to Trash Bin?");
    if (!confirmed) {
        return;
    }

    state.deleted.employees.push({
        id: createId(),
        employee: cloneState(employee),
        deletedAt: new Date().toISOString(),
    });
    state.employees = state.employees.filter((entry) => entry.id !== employeeId);
    if (activeTab === employeeId) {
        activeTab = "all";
    }
    saveState();
    renderEmployeeNamesSettingsList();
    render();
}

function addRow() {
    if (!requireLoggedInUser()) {
        return;
    }
    let targetEmployee = state.employees.find((entry) => entry.id === activeTab);
    if (!targetEmployee) {
        const visibleEmployees = getVisibleEmployees();
        if (!visibleEmployees.length) {
            window.alert("Please add an employee first before adding a schedule row.");
            return;
        }
        targetEmployee = visibleEmployees[0];
        activeTab = targetEmployee.id;
    }
    const newRow = createRow(getNextDateValue(targetEmployee));
    targetEmployee.rows.push(newRow);
    includeDateInActiveFilters(newRow.dateValue);
    if (!ensureDateSequence(targetEmployee)) {
        targetEmployee.rows = targetEmployee.rows.filter((row) => row.id !== newRow.id);
    }
    saveState();
    render();
}

function renderHeader() {
    document.getElementById("headerTitle").textContent = state.headerName;
    const currentUser = getCurrentUser();
    const authShortcutButton = document.getElementById("authShortcutBtn");
    document.getElementById("headerMeta").textContent = currentUser
        ? `Signed in as ${currentUser.username}`
        : "No user logged in";
    document.getElementById("currentUserPill").textContent = currentUser
        ? `User: ${currentUser.username}`
        : "User: none";
    authShortcutButton.textContent = currentUser ? "Logged In" : "Log In";
    authShortcutButton.disabled = Boolean(currentUser);
}

function openAuthModal() {
    const modal = document.getElementById("authModal");
    if (!modal) {
        return;
    }
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    const usernameInput = document.getElementById("authUsernameInput");
    if (usernameInput) {
        usernameInput.focus();
    }
}

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (!modal) {
        return;
    }
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
}

function setAuthFeedback(message, tone = "info") {
    const feedback = document.getElementById("authFeedback");
    if (!feedback) {
        return;
    }
    feedback.textContent = message;
    if (tone === "info") {
        delete feedback.dataset.tone;
        return;
    }
    feedback.dataset.tone = tone;
}

function clearAuthInputs() {
    const usernameInput = document.getElementById("authUsernameInput");
    const passwordInput = document.getElementById("authPasswordInput");
    if (usernameInput) {
        usernameInput.value = "";
    }
    if (passwordInput) {
        passwordInput.value = "";
    }
}

function setDeleteAccountFeedback(message, tone = "info") {
    const feedback = document.getElementById("deleteAccountFeedback");
    if (!feedback) {
        return;
    }
    feedback.textContent = message;
    if (tone === "info") {
        delete feedback.dataset.tone;
        return;
    }
    feedback.dataset.tone = tone;
}

function closeDeleteAccountModal() {
    const modal = document.getElementById("deleteAccountModal");
    const passwordInput = document.getElementById("deleteAccountPasswordInput");
    pendingDeleteAccountId = "";
    if (passwordInput) {
        passwordInput.value = "";
    }
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    setDeleteAccountFeedback("Deleting an account also removes its saved schedule data from this browser.");
}

function closeHardResetModal() {
    const modal = document.getElementById("hardResetPasswordModal");
    const passwordInput = document.getElementById("hardResetPasswordInput");
    const feedback = document.getElementById("hardResetPasswordFeedback");
    pendingHardResetUserId = "";
    if (passwordInput) {
        passwordInput.value = "";
    }
    if (feedback) {
        feedback.textContent = "Enter the account password to confirm deletion.";
        delete feedback.dataset.tone;
    }
    if (!modal) {
        return;
    }
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
}

function openHardResetModal(userId) {
    const user = auth.users.find((entry) => entry.id === userId);
    if (!user) {
        return;
    }
    pendingHardResetUserId = user.id;
    const modal = document.getElementById("hardResetPasswordModal");
    const prompt = document.getElementById("hardResetPasswordPrompt");
    const passwordInput = document.getElementById("hardResetPasswordInput");
    const feedback = document.getElementById("hardResetPasswordFeedback");
    if (!modal || !prompt || !passwordInput || !feedback) {
        return;
    }
    prompt.textContent = `Enter the password for ${user.username} to proceed with reset.`;
    passwordInput.value = "";
    feedback.textContent = "Enter the account password to confirm deletion.";
    delete feedback.dataset.tone;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    passwordInput.focus();
}

function performHardReset(userId) {
    const currentUser = auth.users.find((entry) => entry.id === userId) || getCurrentUser();
    if (!currentUser) {
        return;
    }

    localStorage.removeItem(getUserStorageKey(currentUser.id));
    localStorage.removeItem(getUserBackupKey(currentUser.id));
    state = cloneState(createDefaultState());
    activeTab = "all";
    activeView = "schedule";
    setActiveView(activeView);
    saveState();
    applyTheme();
    render();
    closeSettings();
}

function confirmHardReset() {
    const currentUser = getCurrentUser();
    const feedback = document.getElementById("hardResetPasswordFeedback");
    const passwordInput = document.getElementById("hardResetPasswordInput");
    if (!currentUser || !feedback || !passwordInput) {
        return;
    }

    const password = passwordInput.value;
    if (password !== currentUser.password) {
        feedback.textContent = "Incorrect password. Reset cancelled.";
        feedback.dataset.tone = "error";
        passwordInput.focus();
        return;
    }

    performHardReset(currentUser.id);
    closeHardResetModal();
}

function openDeleteAccountModal(userId) {
    const user = auth.users.find((entry) => entry.id === userId);
    if (!user) {
        return;
    }
    pendingDeleteAccountId = user.id;
    document.getElementById("deleteAccountPrompt").textContent = `Enter the password for ${user.username} to confirm deletion.`;
    document.getElementById("deleteAccountPasswordInput").value = "";
    setDeleteAccountFeedback("Deleting an account also removes its saved schedule data from this browser.");
    const modal = document.getElementById("deleteAccountModal");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.getElementById("deleteAccountPasswordInput").focus();
}

function deleteAccount(userId) {
    const user = auth.users.find((entry) => entry.id === userId);
    if (!user) {
        return;
    }
    const isCurrentUser = auth.currentUserId === user.id;
    if (isAdminUser(user)) {
        setDeleteAccountFeedback("Admin account cannot be deleted.", "error");
        return;
    }

    const deletePassword = document.getElementById("deleteAccountPasswordInput").value;
    if (deletePassword !== user.password) {
        setDeleteAccountFeedback("Incorrect password. Account was not deleted.", "error");
        return;
    }

    localStorage.removeItem(getUserStorageKey(user.id));
    localStorage.removeItem(getUserBackupKey(user.id));
    auth.users = auth.users.filter((entry) => entry.id !== user.id);

    if (isCurrentUser) {
        auth.currentUserId = "";
        state = cloneState(createDefaultState());
        activeTab = "all";
        activeView = "schedule";
        setActiveView(activeView);
    }

    saveAuthState();
    closeDeleteAccountModal();
    clearAuthInputs();
    setAuthFeedback(`Account ${user.username} deleted.`, "success");
    render();
    if (isCurrentUser) {
        closeAllSettingsWindows();
        openAuthModal();
    }
}

function confirmDeleteAccount() {
    if (!pendingDeleteAccountId) {
        return;
    }
    deleteAccount(pendingDeleteAccountId);
}

function renderAdminAccountList() {
    const panel = document.getElementById("adminPanel");
    const list = document.getElementById("adminAccountList");
    const searchInput = document.getElementById("adminAccountSearchInput");
    if (!panel || !list) {
        return;
    }

    const currentUser = getCurrentUser();
    const showAdminPanel = isAdminUser(currentUser);
    panel.hidden = !showAdminPanel;
    panel.classList.toggle("hidden", !showAdminPanel);
    list.innerHTML = "";
    if (!showAdminPanel) {
        return;
    }

    if (!auth.users.length) {
        const empty = document.createElement("p");
        empty.className = "help-text";
        empty.textContent = "No registered users yet.";
        list.appendChild(empty);
        return;
    }

    const accountStats = auth.users.map((user) => {
        const userState = loadStateForUserId(user.id);
        return {
            user,
            userState,
            employeeCount: userState.employees.length,
            rowCount: userState.employees.reduce((sum, employee) => sum + employee.rows.length, 0),
        };
    });
    const highestEmployeeCount = Math.max(...accountStats.map((entry) => entry.employeeCount), 0);
    const highestRowCount = Math.max(...accountStats.map((entry) => entry.rowCount), 0);

    const searchTerm = `${searchInput?.value || ""}`.trim().toLowerCase();
    const visibleUsers = accountStats.filter(({ user, userState }) => {
        if (!searchTerm) {
            return true;
        }
        const taskTargetsText = (userState.subtradeProcessingTargets || [])
            .map((entry) => `${entry.subtrade || ""} ${entry.targetProcessingTime || ""} ${entry.weeklyWfhCreditTarget || ""}`)
            .join(" ");
        const haystack = [
            user.username,
            user.role,
            userState.headerName,
            taskTargetsText,
        ].join(" ").toLowerCase();
        return haystack.includes(searchTerm);
    });

    if (!visibleUsers.length) {
        const empty = document.createElement("p");
        empty.className = "help-text";
        empty.textContent = "No accounts matched your search.";
        list.appendChild(empty);
        return;
    }

    visibleUsers.forEach(({ user, userState, employeeCount, rowCount }) => {
        const row = document.createElement("div");
        const isTopEmployees = employeeCount > 0 && employeeCount === highestEmployeeCount;
        const isTopRows = rowCount > 0 && rowCount === highestRowCount;
        row.className = `account-row admin-account-row${isTopEmployees || isTopRows ? " admin-account-row-highlight" : ""}`;

        const info = document.createElement("div");
        info.className = "account-info";

        const topLine = document.createElement("div");
        topLine.className = "admin-account-topline";

        const name = document.createElement("strong");
        name.textContent = user.username;

        const role = document.createElement("span");
        role.className = `role-chip ${user.role === "admin" ? "admin" : "user"}`;
        role.textContent = user.role === "admin" ? "Administrator" : "Standard User";

        const spotlight = document.createElement("div");
        spotlight.className = "admin-spotlight-tags";
        if (isTopEmployees) {
            const badge = document.createElement("span");
            badge.className = "role-chip spotlight";
            badge.textContent = "Most Employees";
            spotlight.appendChild(badge);
        }
        if (isTopRows) {
            const badge = document.createElement("span");
            badge.className = "role-chip spotlight";
            badge.textContent = "Most Rows";
            spotlight.appendChild(badge);
        }

        const detail = document.createElement("span");
        detail.textContent = currentUser?.id === user.id ? "Currently active on this browser" : "Stored locally on this browser";

        const updatedAt = document.createElement("span");
        updatedAt.className = "admin-updated-at";
        updatedAt.textContent = `Last updated: ${formatTimestamp(user.updatedAt || userState.lastUpdatedAt)}`;

        const metaGrid = document.createElement("div");
        metaGrid.className = "admin-meta-grid";

        const taskTargetCount = (userState.subtradeProcessingTargets || []).length;

        [
            { label: "Password", value: user.password || "(empty)" },
            { label: "Header Name", value: userState.headerName || "Work Setup Schedule" },
            { label: "Task Targets", value: String(taskTargetCount) },
            { label: "Employees", value: String(employeeCount) },
            { label: "Schedule Rows", value: String(rowCount) },
        ].forEach((entry) => {
            const item = document.createElement("div");
            item.className = "admin-meta-item";
            const label = document.createElement("span");
            label.className = "admin-meta-label";
            label.textContent = entry.label;
            const value = document.createElement("strong");
            value.className = "admin-meta-value";
            value.textContent = entry.value;
            item.appendChild(label);
            item.appendChild(value);
            metaGrid.appendChild(item);
        });

        const topLineRight = document.createElement("div");
        topLineRight.className = "admin-topline-right";
        topLineRight.appendChild(role);
        if (spotlight.childNodes.length) {
            topLineRight.appendChild(spotlight);
        }

        topLine.appendChild(name);
        topLine.appendChild(topLineRight);
        info.appendChild(topLine);
        info.appendChild(detail);
        info.appendChild(updatedAt);
        info.appendChild(metaGrid);
        row.appendChild(info);
        list.appendChild(row);
    });
}

function clearAdminSearch() {
    const searchInput = document.getElementById("adminAccountSearchInput");
    if (!searchInput) {
        return;
    }
    searchInput.value = "";
    renderAdminAccountList();
}

function clearGuideHighlights() {
    document.querySelectorAll(".guide-highlight").forEach((element) => {
        element.classList.remove("guide-highlight");
    });
}

function resetGuideSpotlight() {
    const spotlight = document.getElementById("guideSpotlight");
    if (!spotlight) {
        return;
    }
    spotlight.style.removeProperty("top");
    spotlight.style.removeProperty("left");
    spotlight.style.removeProperty("width");
    spotlight.style.removeProperty("height");
    spotlight.style.removeProperty("border-radius");
    spotlight.classList.remove("active");
}

function updateGuideDots() {
    const dots = document.getElementById("guideDots");
    if (!dots) {
        return;
    }
    dots.innerHTML = "";
    GUIDE_STEPS.forEach((_, index) => {
        const dot = document.createElement("span");
        dot.className = `guide-dot${index === guideStepIndex ? " active" : ""}`;
        dots.appendChild(dot);
    });
}

function positionGuideSpotlight(target) {
    const spotlight = document.getElementById("guideSpotlight");
    if (!spotlight || !target) {
        resetGuideSpotlight();
        return;
    }

    const rect = target.getBoundingClientRect();
    const styles = window.getComputedStyle(target);
    const radius = styles.borderRadius || "16px";

    spotlight.style.top = `${Math.max(8, rect.top - 8)}px`;
    spotlight.style.left = `${Math.max(8, rect.left - 8)}px`;
    spotlight.style.width = `${Math.max(24, rect.width + 16)}px`;
    spotlight.style.height = `${Math.max(24, rect.height + 16)}px`;
    spotlight.style.borderRadius = radius;
    spotlight.classList.add("active");
}

function positionGuideCard(target, step = null) {
    const guideCard = document.querySelector("#guideModal .guide-card");
    if (!guideCard) {
        return;
    }

    if (!target) {
        guideCard.style.removeProperty("top");
        guideCard.style.removeProperty("left");
        guideCard.style.removeProperty("right");
        guideCard.style.removeProperty("bottom");
        guideCard.dataset.placement = "center";
        return;
    }

    const rect = target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 20;
    const cardWidth = Math.min(380, viewportWidth - (margin * 2));
    const cardHeight = 260;
    const spaces = {
        bottom: viewportHeight - rect.bottom,
        top: rect.top,
        right: viewportWidth - rect.right,
        left: rect.left,
    };

    let placement = step?.placement || "bottom";
    const canUsePlacement = {
        bottom: spaces.bottom >= cardHeight + 28,
        top: spaces.top >= cardHeight + 28,
        right: spaces.right >= cardWidth + 28,
        left: spaces.left >= cardWidth + 28,
    };

    if (!canUsePlacement[placement]) {
        placement = "bottom";
    }

    if (placement === "bottom" && spaces.bottom >= cardHeight + 28) {
        placement = "bottom";
    } else if (spaces.top >= cardHeight + 28) {
        placement = "top";
    } else if (spaces.right >= cardWidth + 28) {
        placement = "right";
    } else if (spaces.left >= cardWidth + 28) {
        placement = "left";
    }

    let top = margin;
    let left = margin;

    if (placement === "bottom") {
        top = rect.bottom + 18;
        left = rect.left + (rect.width / 2) - (cardWidth / 2);
    } else if (placement === "top") {
        top = rect.top - cardHeight - 18;
        left = rect.left + (rect.width / 2) - (cardWidth / 2);
    } else if (placement === "right") {
        top = rect.top + (rect.height / 2) - (cardHeight / 2);
        left = rect.right + 18;
    } else if (placement === "left") {
        top = rect.top + (rect.height / 2) - (cardHeight / 2);
        left = rect.left - cardWidth - 18;
    }

    top = Math.max(margin, Math.min(top, viewportHeight - cardHeight - margin));
    left = Math.max(margin, Math.min(left, viewportWidth - cardWidth - margin));

    guideCard.dataset.placement = placement;
    guideCard.style.width = `${cardWidth}px`;
    guideCard.style.top = `${top}px`;
    guideCard.style.left = `${left}px`;
}

function refreshActiveGuidePosition() {
    if (guideStepIndex < 0 || guideStepIndex >= GUIDE_STEPS.length) {
        return;
    }
    const step = GUIDE_STEPS[guideStepIndex];
    const target = step?.selector ? document.querySelector(step.selector) : null;
    positionGuideSpotlight(target || null);
    positionGuideCard(target || null, step);
}

function closeGuide() {
    const modal = document.getElementById("guideModal");
    const guideCard = document.querySelector("#guideModal .guide-card");
    const reportModal = document.getElementById("reportModal");
    if (!modal) {
        return;
    }
    guideStepIndex = -1;
    clearGuideHighlights();
    resetGuideSpotlight();
    closeGuideMenu();
    if (reportModal) {
        reportModal.classList.add("hidden");
        reportModal.setAttribute("aria-hidden", "true");
    }
    setActiveView("schedule");
    if (guideCard) {
        guideCard.style.removeProperty("top");
        guideCard.style.removeProperty("left");
        guideCard.style.removeProperty("width");
        guideCard.dataset.placement = "center";
    }
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
}

function renderGuideStep() {
    const modal = document.getElementById("guideModal");
    const title = document.getElementById("guideTitle");
    const body = document.getElementById("guideBody");
    const stepMeta = document.getElementById("guideStepMeta");
    const previousButton = document.getElementById("previousGuideBtn");
    const skipButton = document.getElementById("skipGuideBtn");
    const nextButton = document.getElementById("nextGuideBtn");
    const step = GUIDE_STEPS[guideStepIndex];

    if (!modal || !title || !body || !stepMeta || !previousButton || !nextButton || !step) {
        closeGuide();
        return;
    }

    clearGuideHighlights();
    updateGuideDots();
    if (typeof step.beforeEnter === "function") {
        step.beforeEnter();
    }

    if (step.selector) {
        const target = document.querySelector(step.selector);
        if (target) {
            target.classList.add("guide-highlight");
            target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
            positionGuideSpotlight(target);
            positionGuideCard(target, step);
        } else {
            resetGuideSpotlight();
            positionGuideCard(null);
        }
    } else {
        resetGuideSpotlight();
        positionGuideCard(null);
    }

    title.textContent = step.title;
    body.textContent = step.body;
    stepMeta.textContent = `Step ${guideStepIndex + 1} of ${GUIDE_STEPS.length}`;
    previousButton.disabled = guideStepIndex === 0;
    if (skipButton) {
        skipButton.textContent = "Restart";
        skipButton.hidden = guideStepIndex >= GUIDE_STEPS.length - 2;
    }
    nextButton.textContent = guideStepIndex === GUIDE_STEPS.length - 1 ? "Finish" : "Next";
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

function previousGuideStep() {
    if (guideStepIndex <= 0) {
        renderGuideStep();
        return;
    }
    guideStepIndex -= 1;
    renderGuideStep();
}

function restartGuideTour() {
    guideStepIndex = 0;
    renderGuideStep();
}

function nextGuideStep() {
    if (guideStepIndex >= GUIDE_STEPS.length - 1) {
        closeGuide();
        return;
    }
    guideStepIndex += 1;
    renderGuideStep();
}

function startGuideTour(forceOpen = false) {
    const currentUser = getCurrentUser();
    if (!forceOpen && currentUser?.guideDisabled) {
        return;
    }
    guideStepIndex = -1;
    nextGuideStep();
}

function reopenQuickGuide() {
    if (!getCurrentUser()) {
        return;
    }
    closeAllSettingsWindows();
    startGuideTour(true);
}

function disableGuideForCurrentUser() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        closeGuide();
        return;
    }
    currentUser.guideDisabled = true;
    touchUserRecord(currentUser.id);
    saveAuthState();
    closeGuide();
}

function syncAuthUI() {
    const currentUser = getCurrentUser();
    const gate = document.getElementById("authGate");
    const authModal = document.getElementById("authModal");
    const appShell = document.getElementById("appShell");
    const currentUserText = document.getElementById("currentUserText");
    const authModalCurrentUserText = document.getElementById("authModalCurrentUserText");
    const logOutButton = document.getElementById("logOutBtn");
    const deleteCurrentAccountButton = document.getElementById("deleteCurrentAccountBtn");

    gate.classList.toggle("hidden", Boolean(currentUser));
    gate.setAttribute("aria-hidden", currentUser ? "true" : "false");
    authModal.classList.toggle("hidden", Boolean(currentUser));
    authModal.setAttribute("aria-hidden", currentUser ? "true" : "false");
    appShell.classList.toggle("auth-disabled", !currentUser);

    if (currentUserText) {
        currentUserText.textContent = currentUser
            ? `Active user: ${currentUser.username}`
            : "No user is logged in. Sign up or log in to load a user-specific schedule.";
    }
    if (authModalCurrentUserText) {
        authModalCurrentUserText.textContent = currentUser
            ? `Active user: ${currentUser.username}`
            : "No user is logged in.";
    }
    if (logOutButton) {
        logOutButton.disabled = !currentUser;
    }
    if (deleteCurrentAccountButton) {
        deleteCurrentAccountButton.disabled = !currentUser || isAdminUser(currentUser);
    }
}

function applyLogin(user) {
    auth.currentUserId = user.id;
    saveAuthState();
    state = loadState();
    activeTab = "all";
    activeView = "schedule";
    setActiveView(activeView);
    render();
}

function signUpUser() {
    const usernameInput = document.getElementById("authUsernameInput");
    const passwordInput = document.getElementById("authPasswordInput");
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username.length < 3) {
        setAuthFeedback("Username must be at least 3 characters.", "error");
        return;
    }
    if (password.length < 4) {
        setAuthFeedback("Password must be at least 4 characters.", "error");
        return;
    }
    if (findUserByUsername(username)) {
        setAuthFeedback("That username already exists.", "error");
        return;
    }

    const registeredNonAdminUsers = auth.users.filter((user) => !isAdminUser(user)).length;
    const shouldImportLegacyState = Boolean(pendingMigrationState) && !auth.legacyMigrated && registeredNonAdminUsers === 0;
    const newUser = {
        id: createId(),
        username,
        usernameKey: normalizeUsername(username),
        password,
        role: "user",
        guideDisabled: false,
        updatedAt: new Date().toISOString(),
    };

    auth.users.push(newUser);
    auth.currentUserId = newUser.id;

    if (shouldImportLegacyState) {
        state = cloneState(pendingMigrationState);
        auth.legacyMigrated = true;
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(BACKUP_KEY);
        pendingMigrationState = null;
    } else {
        state = cloneState(createDefaultState());
    }

    saveAuthState();
    saveState();
    clearAuthInputs();
    setAuthFeedback("Account created successfully.", "success");
    closeAuthModal();
    setActiveView("schedule");
    render();
    startGuideTour();
}

function logInUser() {
    const username = document.getElementById("authUsernameInput").value.trim();
    const password = document.getElementById("authPasswordInput").value.trim();
    const user = findUserByUsername(username);

    if (!user || user.password !== password) {
        setAuthFeedback("Invalid username or password.", "error");
        return;
    }

    clearAuthInputs();
    setAuthFeedback("Login successful.", "success");
    closeAuthModal();
    applyLogin(user);
}

function logOutUser() {
    if (!getCurrentUser()) {
        return;
    }

    auth.currentUserId = "";
    saveAuthState();
    state = cloneState(createDefaultState());
    activeTab = "all";
    activeView = "schedule";
    setActiveView(activeView);
    closeAllSettingsWindows();
    openAuthModal();
    render();
}

function updateCurrentAccount() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return;
    }

    const usernameInput = document.getElementById("accountUsernameInput");
    const passwordInput = document.getElementById("accountPasswordInput");
    const feedback = document.getElementById("accountFeedback");
    const nextUsername = usernameInput.value.trim();
    const nextPassword = passwordInput.value.trim();

    if (nextUsername.length < 3) {
        feedback.textContent = "Username must be at least 3 characters.";
        feedback.dataset.tone = "error";
        return;
    }
    if (nextPassword.length < 4) {
        feedback.textContent = "Password must be at least 4 characters.";
        feedback.dataset.tone = "error";
        return;
    }

    const duplicateUser = auth.users.find((user) => user.id !== currentUser.id && user.usernameKey === normalizeUsername(nextUsername));
    if (duplicateUser) {
        feedback.textContent = "That username already exists.";
        feedback.dataset.tone = "error";
        return;
    }

    currentUser.username = nextUsername;
    currentUser.usernameKey = normalizeUsername(nextUsername);
    currentUser.password = nextPassword;
    touchUserRecord(currentUser.id);
    saveAuthState();
    feedback.textContent = "Account credentials updated.";
    feedback.dataset.tone = "success";
    render();
    openSettings();
}

function sequenceDatesForEmployee(employee) {
    employee.rows = [...employee.rows].sort((left, right) => parseDateValue(left.dateValue) - parseDateValue(right.dateValue));
}

function sequenceCurrentMonthDates() {
    if (!requireLoggedInUser()) {
        return;
    }
    if (activeTab === "all") {
        state.employees.forEach((employee) => {
            sequenceDatesForEmployee(employee);
        });
    } else {
        const employee = state.employees.find((entry) => entry.id === activeTab);
        if (!employee) {
            return;
        }
        sequenceDatesForEmployee(employee);
    }
    saveState();
    render();
}

function renderFilters() {
    const yearFilter = document.getElementById("yearFilter");
    const subtradeFilter = document.getElementById("subtradeFilter");
    const monthFilterBtn = document.getElementById("monthFilterBtn");
    const weekFilterBtn = document.getElementById("weekFilterBtn");
    const dayFilterBtn = document.getElementById("dayFilterBtn");
    const monthSelectAll = document.getElementById("monthSelectAll");
    const weekSelectAll = document.getElementById("weekSelectAll");
    const daySelectAll = document.getElementById("daySelectAll");
    const monthFilterList = document.getElementById("monthFilterList");
    const weekFilterList = document.getElementById("weekFilterList");
    const dayFilterList = document.getElementById("dayFilterList");
    const chartStyle = document.getElementById("dashboardChartStyle");
    const chartScope = document.getElementById("dashboardChartScope");
    const dashboardMetricFilterBtn = document.getElementById("dashboardMetricFilterBtn");
    const dashboardMetricSelectAll = document.getElementById("dashboardMetricSelectAll");
    const dashboardMetricFilterList = document.getElementById("dashboardMetricFilterList");
    const dashboardContributorFilterBox = document.getElementById("dashboardContributorFilterBox");
    const dashboardContributorFilterBtn = document.getElementById("dashboardContributorFilterBtn");
    const dashboardContributorSelectAll = document.getElementById("dashboardContributorSelectAll");
    const dashboardContributorFilterList = document.getElementById("dashboardContributorFilterList");

    const selectedMonths = Array.isArray(state.selectedMonths)
        ? state.selectedMonths.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
        : [];
    const availableWeeks = getAvailableWeekValues(Number(state.selectedYear) || 2026, selectedMonths);
    const selectedWeeks = Array.isArray(state.selectedWeeks)
        ? state.selectedWeeks.map((value) => `${value}`)
        : [];
    let normalizedSelectedWeeks = selectedWeeks.filter((week) => week === "all" || availableWeeks.includes(week));
    let restoredWeeksFromMonths = false;
    if (selectedMonths.length && !normalizedSelectedWeeks.length) {
        const rememberedWeeks = getRememberedWeeksForMonths(selectedMonths).filter((week) => week === "all" || availableWeeks.includes(week));
        normalizedSelectedWeeks = rememberedWeeks.length
            ? rememberedWeeks
            : (availableWeeks.length ? ["all"] : []);
        restoredWeeksFromMonths = normalizedSelectedWeeks.length > 0;
    }

    const availableDays = getAvailableDayValues(Number(state.selectedYear) || 2026, selectedMonths, normalizedSelectedWeeks, state.selectedSubtrade);
    const availableDaySet = new Set(availableDays);
    const selectedDays = Array.isArray(state.selectedDays)
        ? state.selectedDays.map((value) => `${value || ""}`.trim()).filter((value) => availableDaySet.has(value))
        : [];
    const normalizedSelectedDays = restoredWeeksFromMonths ? [...availableDays] : selectedDays;

    const nextSelectedWeeks = JSON.stringify(normalizedSelectedWeeks);
    const nextSelectedDays = JSON.stringify(normalizedSelectedDays);
    const currentSelectedWeeks = JSON.stringify(Array.isArray(state.selectedWeeks) ? state.selectedWeeks : []);
    const currentSelectedDays = JSON.stringify(Array.isArray(state.selectedDays) ? state.selectedDays : []);
    const hasPrunedWeeks = currentSelectedWeeks !== nextSelectedWeeks;
    const hasPrunedDays = currentSelectedDays !== nextSelectedDays;
    if (hasPrunedWeeks) {
        state.selectedWeeks = normalizedSelectedWeeks;
    }
    if (hasPrunedDays) {
        state.selectedDays = normalizedSelectedDays;
    }
    if (hasPrunedWeeks || hasPrunedDays) {
        saveState();
    }

    yearFilter.innerHTML = "";
    getYearOptions().forEach((year) => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        if (year === Number(state.selectedYear)) {
            option.selected = true;
        }
        yearFilter.appendChild(option);
    });

    subtradeFilter.innerHTML = "";
    const allSubtradeOption = document.createElement("option");
    allSubtradeOption.value = "all";
    allSubtradeOption.textContent = "All Tasks";
    subtradeFilter.appendChild(allSubtradeOption);

    const subtradeOptions = getSubtradeOptions();
    subtradeOptions.forEach((subtrade) => {
        const option = document.createElement("option");
        option.value = subtrade;
        option.textContent = subtrade;
        subtradeFilter.appendChild(option);
    });

    const selectedSubtrade = `${state.selectedSubtrade || "all"}`.trim() || "all";
    const hasSelectedSubtrade = selectedSubtrade === "all"
        || subtradeOptions.some((subtrade) => normalizeSubtradeValue(subtrade) === normalizeSubtradeValue(selectedSubtrade));
    state.selectedSubtrade = hasSelectedSubtrade ? selectedSubtrade : "all";
    subtradeFilter.value = state.selectedSubtrade;

    monthFilterList.innerHTML = "";
    monthNames.forEach((monthName, index) => {
        const label = document.createElement("label");
        label.className = "checkbox-row";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = String(index + 1);
        checkbox.checked = selectedMonths.includes(index + 1);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(monthName));
        monthFilterList.appendChild(label);
    });

    weekFilterList.innerHTML = "";
    availableWeeks.forEach((week) => {
        const label = document.createElement("label");
        label.className = "checkbox-row";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = week;
        checkbox.checked = normalizedSelectedWeeks.includes("all") || normalizedSelectedWeeks.includes(week);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(`Week ${week}`));
        weekFilterList.appendChild(label);
    });

    const allMonthsSelected = selectedMonths.length === 12;
    monthSelectAll.checked = allMonthsSelected;
    const monthSelectAllLabel = document.getElementById("monthSelectAllLabel");
    if (monthSelectAllLabel) {
        monthSelectAllLabel.textContent = allMonthsSelected ? "Unselect all" : "Select all";
    }
    monthFilterBtn.textContent = allMonthsSelected
        ? "All Months"
        : selectedMonths.length
            ? `${selectedMonths.length} month(s)`
            : "No Months";

    const allWeeksSelected = availableWeeks.length > 0 && (normalizedSelectedWeeks.includes("all") || normalizedSelectedWeeks.length === availableWeeks.length);
    weekSelectAll.checked = allWeeksSelected;
    weekSelectAll.disabled = !availableWeeks.length;
    const weekSelectAllLabel = document.getElementById("weekSelectAllLabel");
    if (weekSelectAllLabel) {
        weekSelectAllLabel.textContent = allWeeksSelected ? "Unselect all" : "Select all";
    }
    weekFilterBtn.textContent = allWeeksSelected
        ? "All Weeks"
        : normalizedSelectedWeeks.length
            ? `${normalizedSelectedWeeks.length} week(s)`
            : "No Weeks";
    if (!availableWeeks.length) {
        weekFilterBtn.textContent = "No Weeks";
    }

    const dayFilterBox = document.getElementById("dayFilterBox");
    if (dayFilterBox) {
        dayFilterBox.classList.remove("hidden");
    }

    if (dayFilterList && daySelectAll && dayFilterBtn) {
        dayFilterList.innerHTML = "";
        availableDays.forEach((dateValue) => {
            const label = document.createElement("label");
            label.className = "checkbox-row";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = dateValue;
            checkbox.checked = normalizedSelectedDays.includes(dateValue);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(formatDayFilterLabel(dateValue)));
            dayFilterList.appendChild(label);
        });

        const allDaysSelected = availableDays.length > 0 && normalizedSelectedDays.length === availableDays.length;
        daySelectAll.checked = allDaysSelected;
        daySelectAll.disabled = !availableDays.length;
        const daySelectAllLabel = document.getElementById("daySelectAllLabel");
        if (daySelectAllLabel) {
            daySelectAllLabel.textContent = allDaysSelected ? "Unselect all" : "Select all";
        }
        dayFilterBtn.textContent = !availableDays.length
            ? "No Days"
            : allDaysSelected
                ? "All Days"
                : `${normalizedSelectedDays.length} day(s)`;
    }

    chartStyle.value = state.dashboardChartStyle || "pie";
    chartScope.value = state.dashboardChartScope || "overview";
    const isContributorScope = (state.dashboardChartScope || "overview") === "contributors";
    if (dashboardContributorFilterBox) {
        dashboardContributorFilterBox.classList.toggle("hidden", !isContributorScope);
        dashboardContributorFilterBox.setAttribute("aria-hidden", isContributorScope ? "false" : "true");
        if (!isContributorScope) {
            const dashboardContributorMenu = document.getElementById("dashboardContributorFilterMenu");
            if (dashboardContributorMenu) {
                dashboardContributorMenu.classList.add("hidden");
            }
        }
    }

    state.dashboardMetricFilterKeys = normalizeDashboardMetricFilterKeys(state.dashboardMetricFilterKeys);
    const selectedMetricKeys = state.dashboardMetricFilterKeys;
    if (dashboardMetricFilterList && dashboardMetricSelectAll && dashboardMetricFilterBtn) {
        dashboardMetricFilterList.innerHTML = "";
        DASHBOARD_METRIC_DEFINITIONS.forEach((metric) => {
            const label = document.createElement("label");
            label.className = "checkbox-row";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = metric.key;
            checkbox.checked = selectedMetricKeys.includes(metric.key);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(metric.label));
            dashboardMetricFilterList.appendChild(label);
        });

        const allMetricsSelected = selectedMetricKeys.length === DASHBOARD_METRIC_DEFINITIONS.length;
        dashboardMetricSelectAll.checked = allMetricsSelected;
        const dashboardMetricSelectAllLabel = document.getElementById("dashboardMetricSelectAllLabel");
        if (dashboardMetricSelectAllLabel) {
            dashboardMetricSelectAllLabel.textContent = allMetricsSelected ? "Unselect all" : "Select all";
        }
        dashboardMetricFilterBtn.textContent = allMetricsSelected
            ? "All Metrics"
            : selectedMetricKeys.length
                ? `${selectedMetricKeys.length} metric(s)`
                : "No Metrics";
    }

    const scopedEmployees = getDashboardScopedEmployees();
    const scopedEmployeeIds = scopedEmployees.map((employee) => employee.id);
    const selectedContributorIds = normalizeDashboardContributorEmployeeIds(state.dashboardContributorEmployeeIds);
    state.dashboardContributorEmployeeIds = selectedContributorIds.filter((employeeId) => scopedEmployeeIds.includes(employeeId));
    const selectedContributorSet = new Set(state.dashboardContributorEmployeeIds);

    if (dashboardContributorFilterList && dashboardContributorSelectAll && dashboardContributorFilterBtn) {
        dashboardContributorFilterList.innerHTML = "";
        scopedEmployees.forEach((employee) => {
            const label = document.createElement("label");
            label.className = "checkbox-row";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = employee.id;
            checkbox.checked = selectedContributorSet.has(employee.id);
            const nameWrap = document.createElement("span");
            nameWrap.className = "contributor-filter-name";
            const colorDot = document.createElement("span");
            colorDot.className = "contributor-color-dot";
            colorDot.style.backgroundColor = normalizeEmployeeColor(employee.employeeColor);
            const nameText = document.createElement("span");
            nameText.textContent = employee.name;
            label.appendChild(checkbox);
            nameWrap.appendChild(colorDot);
            nameWrap.appendChild(nameText);
            label.appendChild(nameWrap);
            dashboardContributorFilterList.appendChild(label);
        });

        const allSelected = scopedEmployees.length > 0 && state.dashboardContributorEmployeeIds.length === scopedEmployees.length;
        dashboardContributorSelectAll.checked = allSelected;
        dashboardContributorSelectAll.disabled = !scopedEmployees.length;
        const dashboardContributorSelectAllLabel = document.getElementById("dashboardContributorSelectAllLabel");
        if (dashboardContributorSelectAllLabel) {
            dashboardContributorSelectAllLabel.textContent = allSelected ? "Unselect all" : "Select all";
        }
        if (!scopedEmployees.length) {
            dashboardContributorFilterBtn.textContent = "No Names";
        } else if (allSelected) {
            dashboardContributorFilterBtn.textContent = "All Names";
        } else {
            dashboardContributorFilterBtn.textContent = state.dashboardContributorEmployeeIds.length
                ? `${state.dashboardContributorEmployeeIds.length} name(s)`
                : "No Names";
        }
    }
}

function closeFilterMenus() {
    document.getElementById("monthFilterMenu").classList.add("hidden");
    document.getElementById("weekFilterMenu").classList.add("hidden");
    const dayFilterMenu = document.getElementById("dayFilterMenu");
    if (dayFilterMenu) {
        dayFilterMenu.classList.add("hidden");
    }
    const dashboardMetricMenu = document.getElementById("dashboardMetricFilterMenu");
    if (dashboardMetricMenu) {
        dashboardMetricMenu.classList.add("hidden");
    }
    const dashboardContributorMenu = document.getElementById("dashboardContributorFilterMenu");
    if (dashboardContributorMenu) {
        dashboardContributorMenu.classList.add("hidden");
    }
}

function renderTabs() {
    const tabs = document.getElementById("tabs");
    tabs.innerHTML = "";

    const selectedSubtrade = `${state.selectedSubtrade || "all"}`.trim() || "all";
    const tabEmployees = getVisibleEmployees().filter((employee) => {
        if (selectedSubtrade === "all") {
            return true;
        }
        return normalizeSubtradeValue(employee?.subtrade || "") === normalizeSubtradeValue(selectedSubtrade);
    });

    if (activeTab !== "all" && !tabEmployees.some((employee) => employee.id === activeTab)) {
        activeTab = "all";
    }

    const allButton = document.createElement("button");
    allButton.className = `tab-btn ${activeTab === "all" ? "active" : ""}`;
    allButton.textContent = "ALL";
    allButton.addEventListener("click", () => {
        activeTab = "all";
        render();
    });
    tabs.appendChild(allButton);

    const addButton = document.createElement("button");
    addButton.className = "tab-btn tab-add-btn";
    addButton.textContent = "+";
    addButton.title = "Add employee";
    addButton.setAttribute("aria-label", "Add employee");
    addButton.addEventListener("click", addEmployeeFromTabs);
    tabs.appendChild(addButton);

    tabEmployees.forEach((employee) => {
        const button = document.createElement("button");
        button.className = `tab-btn ${activeTab === employee.id ? "active" : ""}`;
        button.type = "button";
        const employeeColor = normalizeEmployeeColor(employee.employeeColor);
        if (activeTab === employee.id) {
            button.style.backgroundColor = employeeColor;
            button.style.color = getReadableTextColor(employeeColor);
        }

        const label = document.createElement("span");
        label.textContent = employee.name;
        button.appendChild(label);

        const closeButton = document.createElement("span");
        closeButton.className = "tab-close-btn";
        closeButton.textContent = "×";
        closeButton.title = `Close ${employee.name} tab`;
        closeButton.setAttribute("aria-label", `Close ${employee.name} tab`);
        closeButton.addEventListener("click", (event) => {
            event.stopPropagation();
            hideEmployeeTab(employee.id);
        });
        button.appendChild(closeButton);

        button.addEventListener("click", () => {
            activeTab = employee.id;
            render();
        });
        tabs.appendChild(button);
    });
}

function renderTable() {
    const body = document.getElementById("scheduleBody");
    const activeLabel = document.getElementById("activeTabLabel");
    const rows = getVisibleRows();
    body.innerHTML = "";
    activeLabel.textContent = activeTab === "all" ? "All Employees" : (state.employees.find((entry) => entry.id === activeTab)?.name || "Employee");

    if (!rows.length) {
        const emptyRow = document.createElement("tr");
        const emptyCell = document.createElement("td");
        emptyCell.colSpan = 14;
        emptyCell.textContent = "No rows found for the selected year, month, week, and task.";
        emptyRow.appendChild(emptyCell);
        body.appendChild(emptyRow);
        return;
    }

    rows.forEach((row) => {
        const employee = state.employees.find((entry) => entry.id === row.employeeId);
        const displaySetup = getDisplayWorkSetup(row, employee);
        const workSetupClassName = getWorkSetupClass(row, employee);
        const isStruckThroughWfo = workSetupClassName.includes("wfo-waived") || workSetupClassName.includes("setup-badge wfo");
        const tr = document.createElement("tr");
        if (displaySetup === "WFO" && !row.wfoDone && !isStruckThroughWfo) {
            tr.classList.add("row-wfo");
        }

        const taskCell = document.createElement("td");
        const taskPill = document.createElement("span");
        taskPill.className = "cell-pill";
        const taskName = employee?.subtrade || "Uncategorized";
        const taskColor = getTaskColor(taskName);
        taskPill.textContent = taskName;
        if (taskColor) {
            taskPill.style.backgroundColor = taskColor;
            taskPill.style.color = getReadableTextColor(taskColor);
        }
        taskCell.appendChild(taskPill);
        tr.appendChild(taskCell);

        const employeeCell = document.createElement("td");
        const pill = document.createElement("span");
        pill.className = "cell-pill";
        pill.textContent = row.employeeName;
        const employeeColor = normalizeEmployeeColor(employee?.employeeColor);
        pill.style.backgroundColor = employeeColor;
        pill.style.color = getReadableTextColor(employeeColor);
        employeeCell.appendChild(pill);
        tr.appendChild(employeeCell);

        const weekCell = document.createElement("td");
        weekCell.textContent = getWeekLabel(row.dateValue);
        tr.appendChild(weekCell);

        const monthCell = document.createElement("td");
        const monthSelect = document.createElement("select");
        monthSelect.className = "select-field compact-date-select compact-month-select";
        const currentDate = parseDateValue(row.dateValue);
        const currentMonthIndex = currentDate.getMonth();
        const currentDay = currentDate.getDate();
        appendMonthOptions(monthSelect, currentMonthIndex);
        monthSelect.addEventListener("change", (event) => {
            updateDateRow(row.employeeId, row.id, event.target.value, dateSelect.value || currentDay);
        });
        monthCell.appendChild(monthSelect);
        tr.appendChild(monthCell);

        const dateCell = document.createElement("td");
        const dateSelect = document.createElement("select");
        dateSelect.className = "select-field compact-date-select compact-day-select";
        appendDayOptions(dateSelect, getDaysInMonth(Number(state.selectedYear), currentMonthIndex), currentDay);
        dateSelect.addEventListener("change", (event) => {
            updateDateRow(row.employeeId, row.id, monthSelect.value, event.target.value);
        });
        monthSelect.addEventListener("change", () => {
            const monthIndex = Number(monthSelect.value) - 1;
            const totalDays = getDaysInMonth(Number(state.selectedYear), monthIndex);
            const selectedDay = Math.min(Number(dateSelect.value) || 1, totalDays);
            dateSelect.innerHTML = "";
            appendDayOptions(dateSelect, totalDays, selectedDay);
        });
        dateCell.appendChild(dateSelect);
        tr.appendChild(dateCell);

        const dayCell = document.createElement("td");
        dayCell.textContent = getDisplayDate(row.dateValue).day;
        tr.appendChild(dayCell);

        const processingCell = document.createElement("td");
        const processingInput = document.createElement("input");
        processingInput.className = "input-field processing-time-input";
        processingInput.type = "text";
        processingInput.placeholder = "HH:MM:SS";
        processingInput.value = row.processingTime;
        processingInput.disabled = shouldDisableProcessingInput(row);
        processingInput.addEventListener("change", (event) => {
            updateRow(row.employeeId, row.id, "processingTime", event.target.value);
        });
        processingCell.appendChild(processingInput);
        tr.appendChild(processingCell);

        const accuracyCell = document.createElement("td");
        const accuracySelect = document.createElement("select");
        accuracySelect.className = "select-field";
        accuracySelect.disabled = shouldDisableAccuracyInput(row);
        ["", "No Error", "With Error"].forEach((optionValue) => {
            const option = document.createElement("option");
            option.value = optionValue;
            option.textContent = optionValue || "Select";
            if (optionValue === row.accuracy) {
                option.selected = true;
            }
            accuracySelect.appendChild(option);
        });
        accuracySelect.addEventListener("change", (event) => {
            updateRow(row.employeeId, row.id, "accuracy", event.target.value);
        });
        accuracyCell.appendChild(accuracySelect);
        tr.appendChild(accuracyCell);

        const leaveCell = document.createElement("td");
        const leaveSelect = document.createElement("select");
        leaveSelect.className = "select-field";
        ["", "N/A", "SL", "EL", "OFF", "ML", "PL", "TL", "VL"].forEach((optionValue) => {
            const option = document.createElement("option");
            option.value = optionValue;
            option.textContent = optionValue || "Select";
            if (optionValue === row.unapprovedLeave) {
                option.selected = true;
            }
            leaveSelect.appendChild(option);
        });
        leaveSelect.addEventListener("change", (event) => {
            updateRow(row.employeeId, row.id, "unapprovedLeave", event.target.value);
        });
        leaveCell.appendChild(leaveSelect);
        tr.appendChild(leaveCell);

        const workSetupCell = document.createElement("td");
        const workSetupBadge = document.createElement("span");
        workSetupBadge.className = workSetupClassName;
        workSetupBadge.textContent = displaySetup === "WFO" ? `WFO ${getWfoStatusLabel(row)}` : displaySetup;
        if (displaySetup === "WFO") {
            const tooltipText = getWfoReasonTooltip(row, employee);
            if (tooltipText) {
                workSetupBadge.classList.add("wfo-reason-tooltip");
                workSetupBadge.setAttribute("data-tooltip", tooltipText);
            }
        } else if (displaySetup === "WFH") {
            const tooltipText = getWfhReasonTooltip(row, employee);
            if (tooltipText) {
                workSetupBadge.classList.add("wfo-reason-tooltip");
                workSetupBadge.setAttribute("data-tooltip", tooltipText);
            }
        }
        workSetupCell.appendChild(workSetupBadge);
        tr.appendChild(workSetupCell);

        const wfoWaveCell = document.createElement("td");
        const wfoWaveSelect = document.createElement("select");
        wfoWaveSelect.className = "select-field";
        const shouldShowChangeSchedule = displaySetup === "WFO" || row.wfoWave === "Change Schedule";
        const waveOptions = shouldShowChangeSchedule
            ? ["", "Justified", "Change Schedule", "Use WFH Credit"]
            : ["", "Justified", "Use WFH Credit"];
        waveOptions.forEach((optionValue) => {
            const option = document.createElement("option");
            option.value = optionValue;
            option.textContent = optionValue || "None";
            if (optionValue === row.wfoWave) {
                option.selected = true;
            }
            wfoWaveSelect.appendChild(option);
        });
        wfoWaveSelect.addEventListener("change", (event) => {
            updateRow(row.employeeId, row.id, "wfoWave", event.target.value);
        });
        wfoWaveCell.appendChild(wfoWaveSelect);
        tr.appendChild(wfoWaveCell);

        const changeMonthCell = document.createElement("td");
        const changeMonthSelect = document.createElement("select");
        changeMonthSelect.className = "select-field";
        const currentChangeMonthIndex = parseMonthValue(row.changeScheduleMonth);
        const defaultChangeMonthIndex = currentChangeMonthIndex !== null ? currentChangeMonthIndex : currentMonthIndex;
        const emptyChangeMonthOption = document.createElement("option");
        emptyChangeMonthOption.value = "";
        emptyChangeMonthOption.textContent = "Select";
        emptyChangeMonthOption.selected = !row.changeScheduleMonth;
        changeMonthSelect.appendChild(emptyChangeMonthOption);
        appendMonthOptions(changeMonthSelect, defaultChangeMonthIndex);
        if (row.changeScheduleMonth) {
            changeMonthSelect.value = String(defaultChangeMonthIndex + 1);
        }
        changeMonthSelect.disabled = row.wfoWave !== "Change Schedule";
        changeMonthCell.appendChild(changeMonthSelect);
        tr.appendChild(changeMonthCell);

        const changeDateCell = document.createElement("td");
        const changeDateSelect = document.createElement("select");
        changeDateSelect.className = "select-field";
        const emptyChangeDateOption = document.createElement("option");
        emptyChangeDateOption.value = "";
        emptyChangeDateOption.textContent = "Select";
        emptyChangeDateOption.selected = !row.changeScheduleDate;
        changeDateSelect.appendChild(emptyChangeDateOption);
        const changeMonthIndexForDays = Number(changeMonthSelect.value) > 0
            ? Number(changeMonthSelect.value) - 1
            : defaultChangeMonthIndex;
        appendDayOptions(
            changeDateSelect,
            getDaysInMonth(Number(state.selectedYear), changeMonthIndexForDays),
            row.changeScheduleDate ? Number(row.changeScheduleDate) : null,
        );
        if (row.changeScheduleDate) {
            changeDateSelect.value = String(Number(row.changeScheduleDate));
        }
        changeDateSelect.disabled = row.wfoWave !== "Change Schedule";
        changeDateCell.appendChild(changeDateSelect);
        tr.appendChild(changeDateCell);

        changeMonthSelect.addEventListener("change", () => {
            const monthIndex = Number(changeMonthSelect.value) > 0
                ? Number(changeMonthSelect.value) - 1
                : defaultChangeMonthIndex;
            const totalDays = getDaysInMonth(Number(state.selectedYear), monthIndex);
            const selectedDay = Math.min(Number(changeDateSelect.value) || 1, totalDays);
            const shouldKeepEmpty = !changeMonthSelect.value;
            changeDateSelect.innerHTML = "";
            const resetOption = document.createElement("option");
            resetOption.value = "";
            resetOption.textContent = "Select";
            resetOption.selected = shouldKeepEmpty;
            changeDateSelect.appendChild(resetOption);
            appendDayOptions(changeDateSelect, totalDays, selectedDay);
            if (!shouldKeepEmpty) {
                changeDateSelect.value = String(selectedDay);
            }
            applyChangeScheduleUpdate(row.employeeId, row.id, changeMonthSelect.value, changeDateSelect.value);
        });
        changeDateSelect.addEventListener("change", () => {
            applyChangeScheduleUpdate(row.employeeId, row.id, changeMonthSelect.value, changeDateSelect.value);
        });

        const actionsCell = document.createElement("td");
        if (row.manualWfo || row.manualWfh) {
            const undoManualButton = document.createElement("button");
            undoManualButton.className = "secondary-btn mini-btn";
            undoManualButton.textContent = "Undo Manual";
            undoManualButton.addEventListener("click", () => {
                undoManualOverride(row.employeeId, row.id);
            });
            actionsCell.appendChild(undoManualButton);
        }

        const creditBalance = employee ? getEmployeeCreditBalance(employee) : 0;
        const canUseCredit = creditBalance > 0 && row.wfoWave !== "Use WFH Credit" && !row.creditUsed && displaySetup === "WFO";
        if (canUseCredit) {
            const creditButton = document.createElement("button");
            creditButton.className = "secondary-btn";
            creditButton.textContent = "Use Credit";
            creditButton.addEventListener("click", () => {
                updateRow(row.employeeId, row.id, "wfoWave", "Use WFH Credit");
            });
            actionsCell.appendChild(creditButton);
        }
        if (displaySetup === "WFO") {
            const doneButton = document.createElement("button");
            doneButton.className = `secondary-btn mini-btn ${row.wfoDone ? "is-done" : ""}`;
            doneButton.textContent = row.wfoDone ? "Undo" : "Done";
            doneButton.addEventListener("click", () => {
                setRowWfoDone(row.employeeId, row.id, !row.wfoDone);
            });
            actionsCell.appendChild(doneButton);

            if (!row.wfoDone) {
                const manualWfhButton = document.createElement("button");
                manualWfhButton.className = "secondary-btn mini-btn";
                manualWfhButton.textContent = "Manual WFH";
                manualWfhButton.addEventListener("click", () => {
                    openManualWfhModal(row.employeeId, row.id);
                });
                actionsCell.appendChild(manualWfhButton);
            }
        } else if (displaySetup === "WFH") {
            const manualWfoButton = document.createElement("button");
            manualWfoButton.className = "secondary-btn mini-btn";
            manualWfoButton.textContent = "Manual WFO";
            manualWfoButton.addEventListener("click", () => {
                openManualWfoModal(row.employeeId, row.id);
            });
            actionsCell.appendChild(manualWfoButton);
        }
        const deleteButton = document.createElement("button");
        deleteButton.className = "icon-btn row-delete-btn";
        deleteButton.textContent = "🗑";
        deleteButton.title = "Delete row";
        deleteButton.setAttribute("aria-label", "Delete row");
        deleteButton.addEventListener("click", () => {
            deleteRow(row.employeeId, row.id);
        });
        actionsCell.appendChild(deleteButton);
        tr.appendChild(actionsCell);

        body.appendChild(tr);
    });
}

function buildOverviewSeries(rows) {
    const trackedRows = rows.map((row) => {
        const employee = state.employees.find((entry) => entry.id === row.employeeId);
        return {
            ...row,
            displaySetup: getDisplayWorkSetup(row, employee),
        };
    });
    return [
        { label: "Off Target", value: rows.filter((row) => isProcessingTimeOffTarget(row, null)).length, color: "#dc2626" },
        { label: "With Error", value: rows.filter((row) => row.accuracy === "With Error").length, color: "#f59e0b" },
        { label: "Unapproved Leave", value: rows.filter((row) => ["SL", "EL"].includes((row.unapprovedLeave || "").trim())).length, color: "#ef4444" },
        { label: "WFH", value: trackedRows.filter((row) => row.displaySetup === "WFH").length, color: "#14b8a6" },
        { label: "WFO Pending", value: trackedRows.filter((row) => row.displaySetup === "WFO" && !row.wfoDone).length, color: "#2563eb" },
        { label: "WFO Done", value: trackedRows.filter((row) => row.displaySetup === "WFO" && row.wfoDone).length, color: "#16a34a" },
    ];
}

function buildContributorSeries(rows) {
    const grouped = rows.reduce((accumulator, row) => {
        accumulator[row.employeeName] = (accumulator[row.employeeName] || 0) + 1;
        return accumulator;
    }, {});
    return Object.entries(grouped).map(([employeeName, value], index) => ({
        label: employeeName,
        value,
        color: ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444", "#0f766e"][index % 6],
    }));
}

function getDashboardScopedEmployees() {
    const selectedSubtrade = `${state.selectedSubtrade || "all"}`.trim() || "all";
    return getVisibleEmployees().filter((employee) => {
        if (selectedSubtrade === "all") {
            return true;
        }
        return normalizeSubtradeValue(employee?.subtrade || "") === normalizeSubtradeValue(selectedSubtrade);
    });
}

function getSelectedDashboardContributorEmployees() {
    const scopedEmployees = getDashboardScopedEmployees();
    const normalizedIds = normalizeDashboardContributorEmployeeIds(state.dashboardContributorEmployeeIds);
    const selectedSet = new Set(normalizedIds);
    return scopedEmployees.filter((employee) => selectedSet.has(employee.id));
}

function getEmployeeContributorMetricsSnapshot(employee) {
    const rows = getFilteredRows(employee);
    const trackedRows = rows.filter((row) => ["WFO", "WFH"].includes(getDisplayWorkSetup(row, employee)));
    const wfoRows = trackedRows.filter((row) => getDisplayWorkSetup(row, employee) === "WFO");
    const unapprovedLeavesWith = rows.filter((row) => {
        const leave = `${row.unapprovedLeave || ""}`.trim();
        return leave && leave !== "N/A";
    }).length;
    const unapprovedLeavesNo = rows.length - unapprovedLeavesWith;
    const accuracyWithError = rows.filter((row) => row.accuracy === "With Error").length;
    const accuracyNoError = rows.filter((row) => row.accuracy === "No Error").length;

    return {
        employee,
        wfh: trackedRows.filter((row) => getDisplayWorkSetup(row, employee) === "WFH").length,
        wfoOngoing: wfoRows.filter((row) => !row.wfoDone).length,
        wfoDone: wfoRows.filter((row) => row.wfoDone).length,
        accuracyWithError,
        accuracyNoError,
        notTargetProcessingTime: rows.filter((row) => isProcessingTimeOffTarget(row, employee)).length,
        targetProcessingTime: rows.filter((row) => isProcessingTimeOnTarget(row, employee)).length,
        unapprovedLeavesWith,
        unapprovedLeavesNo,
        changeSchedule: rows.filter((row) => (row.wfoWave || "").trim() === "Change Schedule").length,
        wfhCreditsAvailed: rows.filter((row) => row.creditUsed || row.wfoWave === "Use WFH Credit").length,
        wfhCreditStatus: getEmployeeCreditBalance(employee),
    };
}

function buildEmployeeContributorMetrics() {
    return getDashboardScopedEmployees().map((employee) => getEmployeeContributorMetricsSnapshot(employee));
}

function buildAllEmployeesContributorMetricSeries() {
    const metrics = buildEmployeeContributorMetrics();
    const selectedMetricKeys = normalizeDashboardMetricFilterKeys(state.dashboardMetricFilterKeys);
    return DASHBOARD_METRIC_DEFINITIONS
        .filter((definition) => selectedMetricKeys.includes(definition.key))
        .map((definition) => ({
            label: definition.label,
            color: definition.color,
            key: definition.key,
            value: metrics.reduce((sum, entry) => sum + Number(entry[definition.key] || 0), 0),
        }));
}

function buildSelectedContributorOverviewSeries() {
    const selectedEmployees = getSelectedDashboardContributorEmployees();
    const selectedMetricKeys = normalizeDashboardMetricFilterKeys(state.dashboardMetricFilterKeys);
    if (!selectedMetricKeys.length || !selectedEmployees.length) {
        return [];
    }

    return selectedEmployees.map((employee) => {
        const snapshot = getEmployeeContributorMetricsSnapshot(employee);
        const value = selectedMetricKeys.reduce((sum, key) => sum + Number(snapshot[key] || 0), 0);
        return {
            label: employee.name,
            color: normalizeEmployeeColor(employee.employeeColor),
            key: employee.id,
            value,
        };
    });
}

function createChartMarkup(series, chartStyle) {
    const total = Math.max(1, series.reduce((sum, entry) => sum + entry.value, 0));
    if (chartStyle === "bar") {
        const maxValue = Math.max(...series.map((entry) => entry.value), 1);
        return `<svg class="chart-svg" viewBox="0 0 380 220" role="img" aria-label="Bar graph">${series.map((entry, index) => {
            const height = (entry.value / maxValue) * 140;
            const x = 30 + index * 70;
            const y = 190 - height;
            return `<g><rect class="chart-segment" x="${x}" y="${y}" width="40" height="${height}" fill="${entry.color}" rx="8"><title>${entry.label}: ${entry.value}</title></rect><text x="${x + 20}" y="205" text-anchor="middle" font-size="11" fill="#172033">${entry.label}</text><text x="${x + 20}" y="${y - 8}" text-anchor="middle" font-size="11" fill="#172033">${entry.value}</text></g>`;
        }).join("")}</svg>`;
    }

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const slices = series.map((entry) => {
        const segment = (entry.value / total) * circumference;
        const dash = `${segment} ${circumference - segment}`;
        const percentage = Math.round((entry.value / total) * 100);
        return `<circle class="chart-segment" cx="110" cy="110" r="${radius}" fill="none" stroke="${entry.color}" stroke-width="34" stroke-dasharray="${dash}" stroke-dashoffset="-${offset}" transform="rotate(-90 110 110)"><title>${entry.label}: ${entry.value} (${percentage}%)</title></circle>`;
    });
    return `<svg class="chart-svg" viewBox="0 0 250 220" role="img" aria-label="Pie chart"><circle cx="110" cy="110" r="70" fill="none" stroke="#e5e7eb" stroke-width="34"></circle>${slices.join("")}<text x="110" y="106" text-anchor="middle" font-size="16" font-weight="700" fill="#172033">${total}</text><text x="110" y="126" text-anchor="middle" font-size="12" fill="#61708a">entries</text></svg>`;
}

function createLegendMarkup(series) {
    return `<div class="chart-legend">${series.map((entry) => `<span class="legend-item"><span class="legend-swatch" style="background:${entry.color}"></span>${entry.label}</span>`).join("")}</div>`;
}

function createContributorLegendMarkup(employees, selectedEmployeeIds) {
    const selectedSet = new Set(Array.isArray(selectedEmployeeIds) ? selectedEmployeeIds : []);
    return `<div class="chart-legend contributor-legend">${employees.map((employee) => {
        const isSelected = selectedSet.has(employee.id);
        const color = normalizeEmployeeColor(employee.employeeColor);
        return `<button type="button" class="legend-item contributor-legend-btn ${isSelected ? "is-active" : "is-inactive"}" data-employee-id="${employee.id}" title="${isSelected ? "Hide" : "Show"} ${employee.name}"><span class="legend-swatch" style="background:${color}"></span>${employee.name}</button>`;
    }).join("")}</div>`;
}

function getWfoSummaryReasonText(row, employee) {
    if (row.manualWfo) {
        return row.manualWfoRemarks ? `Manual WFO: ${row.manualWfoRemarks}` : "Manual WFO";
    }

    function buildReasonDetails(sourceRow, reasons) {
        const details = [];
        const leaveCode = `${sourceRow?.unapprovedLeave || ""}`.trim();
        if (reasons.includes("Accuracy")) {
            details.push(leaveCode ? `Accuracy: ${leaveCode} + With Error` : "Accuracy: With Error");
        }
        if (reasons.includes("Processing Time")) {
            details.push(`Processing Time: ${sourceRow.processingTime || "-"}`);
        }
        if (reasons.includes("Unapproved Leave") && !reasons.includes("Accuracy")) {
            details.push(`Unapproved Leave: ${sourceRow.unapprovedLeave || "-"}`);
        }
        return details;
    }

    const outcomeEntry = getOutcomeForTargetRow(employee, row);
    const reasons = outcomeEntry?.outcome?.reasons || [];
    const sourceRow = outcomeEntry?.sourceRow || row;
    const details = buildReasonDetails(sourceRow, reasons);
    if (reasons.includes("Change Schedule")) {
        const sourceDate = getDisplayDate(sourceRow.dateValue);
        const targetDate = getDisplayDate(row.dateValue);
        details.push(`Change Schedule: ${sourceDate.month} ${sourceDate.date} ${sourceDate.day} -> ${targetDate.month} ${targetDate.date} ${targetDate.day}`);

        const rootOutcome = getOutcomeForTargetRow(employee, sourceRow);
        if (rootOutcome?.outcome?.setup === "WFO") {
            const rootDetails = buildReasonDetails(rootOutcome.sourceRow, rootOutcome.outcome.reasons || []);
            if (rootDetails.length) {
                details.push(`Root Trigger: ${rootDetails.join(" | ")}`);
            }
        }
    }

    return details.join(" | ") || reasons.join(", ") || "WFO";
}

function renderSummary() {
    const content = document.getElementById("summaryContent");
    const rows = getAllRows().filter((row) => {
        const employee = state.employees.find((entry) => entry.id === row.employeeId);
        const isWaivedByWave = row.wfoWave === "Justified" || row.wfoWave === "Change Schedule" || row.wfoWave === "Use WFH Credit";
        return getDisplayWorkSetup(row, employee) === "WFO" && !isWaivedByWave;
    });
    content.innerHTML = "";
    if (!rows.length) {
        content.innerHTML = '<p class="table-title">No WFO rows found for the selected filters.</p>';
        return;
    }
    const grouped = rows.reduce((accumulator, row) => {
        if (!accumulator[row.employeeName]) {
            accumulator[row.employeeName] = [];
        }
        accumulator[row.employeeName].push(row);
        return accumulator;
    }, {});
    const fragment = document.createDocumentFragment();
    Object.entries(grouped).forEach(([employeeName, employeeRows]) => {
        const card = document.createElement("div");
        card.className = "stack-card";
        const title = document.createElement("h3");
        title.textContent = employeeName;
        card.appendChild(title);
        const pendingRows = employeeRows.filter((row) => !row.wfoDone);
        const doneRows = employeeRows.filter((row) => row.wfoDone);
        [
            { label: "Ongoing WFO", rows: pendingRows },
            { label: "Finished WFO", rows: doneRows },
        ].forEach((sectionData) => {
            if (!sectionData.rows.length) {
                return;
            }
            const section = document.createElement("div");
            section.className = "summary-section";
            const heading = document.createElement("h4");
            heading.textContent = sectionData.label;
            section.appendChild(heading);
            const list = document.createElement("ul");
            sectionData.rows.forEach((row) => {
                const item = document.createElement("li");
                const employee = state.employees.find((entry) => entry.id === row.employeeId);
                const dateText = `${getDisplayDate(row.dateValue).month} ${getDisplayDate(row.dateValue).date} ${getDisplayDate(row.dateValue).day}`;
                const reasonText = getWfoSummaryReasonText(row, employee);
                item.textContent = `${dateText} — ${getWfoStatusLabel(row)} — ${reasonText}`;
                list.appendChild(item);
            });
            section.appendChild(list);
            card.appendChild(section);
        });
        fragment.appendChild(card);
    });
    content.appendChild(fragment);
}

function renderCredits() {
    const creditRuleText = document.getElementById("wfhCreditRuleText");
    if (creditRuleText) {
        const hasTaskCreditTargets = Array.isArray(state.subtradeProcessingTargets)
            && state.subtradeProcessingTargets.some((entry) => Number(entry?.weeklyWfhCreditTarget) > 0);
        creditRuleText.textContent = hasTaskCreditTargets
            ? "WFH credits are computed per Task target. Manual credit logs override per employee when matched."
            : "Set WFH occurrences per week in Task Target Processing Time to enable credit earning.";
    }

    const content = document.getElementById("creditsContent");
    content.innerHTML = "";
    const fragment = document.createDocumentFragment();
    state.employees.forEach((employee) => {
        const card = document.createElement("div");
        card.className = "stack-card";
        const title = document.createElement("h3");
        title.textContent = employee.name;
        card.appendChild(title);
        const badge = document.createElement("div");
        badge.className = "metric";
        badge.innerHTML = `<span class="badge">${getEmployeeCreditBalance(employee)}</span> credits available`;
        card.appendChild(badge);
        fragment.appendChild(card);
    });
    content.appendChild(fragment);
}

function renderDashboard() {
    const content = document.getElementById("dashboardContent");
    const rows = getAllRows();
    const trackedRows = rows.filter((row) => {
        const employee = state.employees.find((entry) => entry.id === row.employeeId);
        return ["WFO", "WFH"].includes(getDisplayWorkSetup(row, employee));
    });
    const wfoRows = trackedRows.filter((row) => {
        const employee = state.employees.find((entry) => entry.id === row.employeeId);
        return getDisplayWorkSetup(row, employee) === "WFO";
    });
    const isContributorScope = (state.dashboardChartScope || "overview") === "contributors";
    const series = isContributorScope
        ? buildSelectedContributorOverviewSeries()
        : buildAllEmployeesContributorMetricSeries();
    const contributorScopedEmployees = isContributorScope ? getDashboardScopedEmployees() : [];
    const normalizedContributorIds = normalizeDashboardContributorEmployeeIds(state.dashboardContributorEmployeeIds);
    const selectedContributorIds = normalizedContributorIds.filter((employeeId) => contributorScopedEmployees.some((employee) => employee.id === employeeId));
    const selectedMetricKeys = normalizeDashboardMetricFilterKeys(state.dashboardMetricFilterKeys);
    const chartStyle = state.dashboardChartStyle || "pie";
    const dashboardSectionOpen = normalizeDashboardSectionState(state.dashboardSectionOpen, createDefaultState().dashboardSectionOpen);
    const dashboardSectionMaximized = normalizeDashboardSectionState(state.dashboardSectionMaximized, createDefaultState().dashboardSectionMaximized);

    state.dashboardSectionOpen = dashboardSectionOpen;
    state.dashboardSectionMaximized = dashboardSectionMaximized;
    content.innerHTML = "";

    const cards = document.createElement("div");
    cards.className = "dashboard-grid";
    const createAccordionCard = (sectionKey, title, isOpen, options = {}) => {
        const card = document.createElement("div");
        card.className = `dashboard-card dashboard-accordion-card${isOpen ? " is-open" : ""}`;

        const header = document.createElement("button");
        header.type = "button";
        header.className = "dashboard-accordion-toggle";
        header.setAttribute("aria-expanded", isOpen ? "true" : "false");

        const titleWrap = document.createElement("span");
        titleWrap.className = "dashboard-accordion-title";
        titleWrap.textContent = title;
        header.appendChild(titleWrap);

        const statePill = document.createElement("span");
        statePill.className = "dashboard-accordion-state";
        statePill.textContent = isOpen ? "Hide" : "Show";
        header.appendChild(statePill);

        header.addEventListener("click", () => {
            setDashboardSectionOpen(sectionKey);
        });

        card.appendChild(header);

        if (!isOpen) {
            return card;
        }

        const body = document.createElement("div");
        body.className = `dashboard-accordion-body${options.bodyClass ? ` ${options.bodyClass}` : ""}`;

        if (typeof options.onBuild === "function") {
            options.onBuild(body);
        }

        card.appendChild(body);
        return card;
    };

    const overviewEmptyText = isContributorScope
        ? (selectedMetricKeys.length ? "No names selected." : "No metrics selected.")
        : "No metrics selected.";
    const overviewCard = createAccordionCard("overview", "Employee Contributors Overview", dashboardSectionOpen.overview, {
        onBuild: (body) => {
            if (!series.length) {
                const emptyText = document.createElement("p");
                emptyText.className = "help-text";
                emptyText.textContent = overviewEmptyText;
                body.appendChild(emptyText);
            } else {
                const chartWrap = document.createElement("div");
                chartWrap.innerHTML = `${createChartMarkup(series, chartStyle)}${isContributorScope ? createContributorLegendMarkup(contributorScopedEmployees, selectedContributorIds) : createLegendMarkup(series)}`;
                body.appendChild(chartWrap);
                if (isContributorScope) {
                    chartWrap.querySelectorAll(".contributor-legend-btn").forEach((button) => {
                        button.addEventListener("click", () => {
                            const employeeId = `${button.dataset.employeeId || ""}`.trim();
                            if (!employeeId) {
                                return;
                            }
                            const currentScopedIds = contributorScopedEmployees.map((employee) => employee.id);
                            const selectedSet = new Set(currentScopedIds.filter((id) => selectedContributorIds.includes(id)));
                            if (selectedSet.has(employeeId)) {
                                selectedSet.delete(employeeId);
                            } else {
                                selectedSet.add(employeeId);
                            }
                            state.dashboardContributorEmployeeIds = currentScopedIds.filter((id) => selectedSet.has(id));
                            saveState();
                            renderFilters();
                            renderDashboard();
                        });
                    });
                }
            }
        },
    });
    cards.appendChild(overviewCard);

    const pendingCount = wfoRows.filter((row) => !row.wfoDone).length;
    const doneCount = wfoRows.filter((row) => row.wfoDone).length;
    const wfhCount = trackedRows.filter((row) => {
        const employee = state.employees.find((entry) => entry.id === row.employeeId);
        return getDisplayWorkSetup(row, employee) === "WFH";
    }).length;
    const statusCard = createAccordionCard("status", "Work Setup Status", dashboardSectionOpen.status, {
        onBuild: (body) => {
            const statusGrid = document.createElement("div");
            statusGrid.className = "dashboard-status-grid";
            statusGrid.innerHTML = `<div class="metric-tile"><strong>${wfhCount}</strong><span>WFH</span></div><div class="metric-tile"><strong>${pendingCount}</strong><span>WFO Pending</span></div><div class="metric-tile"><strong>${doneCount}</strong><span>WFO Done</span></div>`;
            body.appendChild(statusGrid);
        },
    });
    cards.appendChild(statusCard);

    const wfoTrackingRows = [
        { title: "Pending WFO", rows: wfoRows.filter((row) => !row.wfoDone) },
        { title: "Finished WFO", rows: wfoRows.filter((row) => row.wfoDone) },
    ];
    const wfoTrackingItemCount = wfoTrackingRows.reduce((sum, entry) => sum + entry.rows.length, 0);
    const trackingCard = createAccordionCard("tracking", "WFO Tracking", dashboardSectionOpen.tracking, {
        bodyClass: wfoTrackingItemCount > 5 ? "dashboard-section-scroll" : "",
        onBuild: (body) => {
            const maximizeWrap = document.createElement("div");
            maximizeWrap.className = "dashboard-accordion-actions";
            if (wfoTrackingItemCount > 5) {
                const maximizeButton = document.createElement("button");
                maximizeButton.type = "button";
                maximizeButton.className = "secondary-btn mini-btn";
                maximizeButton.textContent = dashboardSectionMaximized.tracking ? "Minimize" : "Maximize";
                maximizeButton.addEventListener("click", (event) => {
                    event.stopPropagation();
                    setDashboardSectionMaximized("tracking");
                });
                maximizeWrap.appendChild(maximizeButton);
                body.appendChild(maximizeWrap);
            }

            const sectionWrap = document.createElement("div");
            sectionWrap.className = `dashboard-section-scroll${dashboardSectionMaximized.tracking ? " is-maximized" : ""}`;

            wfoTrackingRows.forEach((sectionData) => {
                const section = document.createElement("div");
                section.className = "summary-section";
                const heading = document.createElement("h4");
                heading.textContent = sectionData.title;
                section.appendChild(heading);

                const list = document.createElement("ul");
                if (!sectionData.rows.length) {
                    const item = document.createElement("li");
                    item.textContent = "No entries.";
                    list.appendChild(item);
                } else {
                    sectionData.rows.forEach((row) => {
                        const item = document.createElement("li");
                        const employee = state.employees.find((entry) => entry.id === row.employeeId);
                        const reasons = getOutcomeForTargetRow(employee, row)?.outcome?.reasons || [];
                        item.textContent = `${row.employeeName} — ${getDisplayDate(row.dateValue).month} ${getDisplayDate(row.dateValue).date}: ${reasons.join(", ") || "WFO"}`;
                        list.appendChild(item);
                    });
                }
                section.appendChild(list);
                sectionWrap.appendChild(section);
            });

            body.appendChild(sectionWrap);
        },
    });
    cards.appendChild(trackingCard);

    if (isContributorScope) {
        const metrics = getSelectedDashboardContributorEmployees().map((employee) => getEmployeeContributorMetricsSnapshot(employee));
        const metricsCard = createAccordionCard("contributorMetrics", "Employee Contributor Metrics", dashboardSectionOpen.contributorMetrics, {
            bodyClass: metrics.length > 5 ? "dashboard-section-scroll" : "",
            onBuild: (body) => {
                if (!metrics.length) {
                    const emptyText = document.createElement("p");
                    emptyText.className = "help-text";
                    emptyText.textContent = "No names selected for Employee Contributor overview.";
                    body.appendChild(emptyText);
                    return;
                }

                if (metrics.length > 5) {
                    const maximizeWrap = document.createElement("div");
                    maximizeWrap.className = "dashboard-accordion-actions";
                    const maximizeButton = document.createElement("button");
                    maximizeButton.type = "button";
                    maximizeButton.className = "secondary-btn mini-btn";
                    maximizeButton.textContent = dashboardSectionMaximized.contributorMetrics ? "Minimize" : "Maximize";
                    maximizeButton.addEventListener("click", (event) => {
                        event.stopPropagation();
                        setDashboardSectionMaximized("contributorMetrics");
                    });
                    maximizeWrap.appendChild(maximizeButton);
                    body.appendChild(maximizeWrap);
                }

                const list = document.createElement("div");
                list.className = `contributor-name-list dashboard-section-scroll${dashboardSectionMaximized.contributorMetrics ? " is-maximized" : ""}`;

                metrics.forEach((entry) => {
                    const headerButton = document.createElement("button");
                    headerButton.type = "button";
                    headerButton.className = "contributor-name-btn";
                    headerButton.textContent = entry.employee.name;
                    const employeeColor = normalizeEmployeeColor(entry.employee.employeeColor);
                    headerButton.style.background = employeeColor;
                    headerButton.style.color = getReadableTextColor(employeeColor);
                    headerButton.style.borderColor = employeeColor;
                    headerButton.addEventListener("click", () => {
                        openContributorDashboardModal(entry.employee.id);
                    });
                    list.appendChild(headerButton);
                });

                body.appendChild(list);
            },
        });
        cards.appendChild(metricsCard);
    }

    content.appendChild(cards);
}

function closeContributorDashboardModal() {
    const modal = document.getElementById("contributorDashboardModal");
    if (!modal) {
        return;
    }
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
}

function openContributorDashboardModal(employeeId) {
    const modal = document.getElementById("contributorDashboardModal");
    const title = document.getElementById("contributorDashboardModalTitle");
    const content = document.getElementById("contributorDashboardModalContent");
    if (!modal || !title || !content) {
        return;
    }

    const employee = state.employees.find((entry) => entry.id === employeeId);
    if (!employee) {
        return;
    }

    const snapshot = getEmployeeContributorMetricsSnapshot(employee);
    const selectedKeys = normalizeDashboardMetricFilterKeys(state.dashboardMetricFilterKeys);
    const series = DASHBOARD_METRIC_DEFINITIONS
        .filter((definition) => selectedKeys.includes(definition.key))
        .map((definition) => ({
            label: definition.label,
            color: definition.color,
            key: definition.key,
            value: Number(snapshot[definition.key] || 0),
            tone: definition.tone,
        }));

    title.textContent = `${employee.name} Dashboard`;
    content.innerHTML = "";

    const chartCard = document.createElement("div");
    chartCard.className = "dashboard-card";
    if (!series.length) {
        chartCard.innerHTML = `<h3>${employee.name} Metrics</h3><p class="help-text">No metrics selected.</p>`;
    } else {
        chartCard.innerHTML = `<h3>${employee.name} Metrics</h3>${createChartMarkup(series, state.dashboardChartStyle || "pie")}${createLegendMarkup(series)}`;
    }
    content.appendChild(chartCard);

    const metricsCard = document.createElement("div");
    metricsCard.className = "dashboard-card";
    metricsCard.innerHTML = "<h3>Metric Breakdown</h3>";
    const grid = document.createElement("div");
    grid.className = "contributor-metrics-grid";

    series.forEach((metric) => {
        const tile = document.createElement("div");
        tile.className = `metric-tile contributor-tone-${metric.tone}`;
        tile.innerHTML = `<strong>${metric.value}</strong><span>${metric.label}</span>`;
        grid.appendChild(tile);
    });
    if (series.length) {
        metricsCard.appendChild(grid);
    } else {
        const emptyText = document.createElement("p");
        emptyText.className = "help-text";
        emptyText.textContent = "No metrics selected.";
        metricsCard.appendChild(emptyText);
    }
    content.appendChild(metricsCard);

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

function renderTrash() {
    const content = document.getElementById("trashContent");
    if (!content) {
        return;
    }
    content.innerHTML = "";

    const rows = state.deleted?.rows || [];
    const employees = state.deleted?.employees || [];
    const manualCreditRules = state.deleted?.manualCreditRules || [];
    const taskTargets = state.deleted?.taskTargets || [];
    if (!rows.length && !employees.length && !manualCreditRules.length && !taskTargets.length) {
        content.innerHTML = '<p class="table-title">Trash bin is empty.</p>';
        return;
    }

    const rowCard = document.createElement("div");
    rowCard.className = "stack-card";
    rowCard.innerHTML = `<h3>Deleted Rows (${rows.length})</h3>`;
    rows.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "trash-row";
        const dateText = getDisplayDate(entry.row?.dateValue || `${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}-01`);
        row.innerHTML = `<div><strong>${entry.employeeName}</strong><br><span>${dateText.month} ${dateText.date}, ${dateText.day}</span></div>`;

        const actions = document.createElement("div");
        actions.className = "trash-actions";
        const restoreButton = document.createElement("button");
        restoreButton.className = "secondary-btn";
        restoreButton.textContent = "Restore";
        restoreButton.addEventListener("click", () => restoreDeletedRow(entry.id));

        const deleteForeverButton = document.createElement("button");
        deleteForeverButton.className = "danger-btn";
        deleteForeverButton.textContent = "Delete Forever";
        deleteForeverButton.addEventListener("click", () => deleteRowForever(entry.id));

        actions.appendChild(restoreButton);
        actions.appendChild(deleteForeverButton);
        row.appendChild(actions);
        rowCard.appendChild(row);
    });
    content.appendChild(rowCard);

    const employeeCard = document.createElement("div");
    employeeCard.className = "stack-card";
    employeeCard.innerHTML = `<h3>Deleted Employees (${employees.length})</h3>`;
    employees.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "trash-row";
        const employeeName = entry.employee?.name || "Unnamed Employee";
        const rowCount = entry.employee?.rows?.length || 0;
        row.innerHTML = `<div><strong>${employeeName}</strong><br><span>${rowCount} rows archived</span></div>`;

        const actions = document.createElement("div");
        actions.className = "trash-actions";
        const restoreButton = document.createElement("button");
        restoreButton.className = "secondary-btn";
        restoreButton.textContent = "Restore";
        restoreButton.addEventListener("click", () => restoreDeletedEmployee(entry.id));

        const deleteForeverButton = document.createElement("button");
        deleteForeverButton.className = "danger-btn";
        deleteForeverButton.textContent = "Delete Forever";
        deleteForeverButton.addEventListener("click", () => deleteEmployeeForever(entry.id));

        actions.appendChild(restoreButton);
        actions.appendChild(deleteForeverButton);
        row.appendChild(actions);
        employeeCard.appendChild(row);
    });
    content.appendChild(employeeCard);

    const manualRuleCard = document.createElement("div");
    manualRuleCard.className = "stack-card";
    manualRuleCard.innerHTML = `<h3>Deleted Manual Credit Logs (${manualCreditRules.length})</h3>`;
    manualCreditRules.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "trash-row";
        const rule = entry.rule || {};
        const employeeName = getManualCreditRuleEmployeeName(rule.employeeId);
        const monthText = (rule.months || []).map((value) => monthNames[value - 1] || value).join(", ");
        const weekText = (rule.weeks || []).map((value) => `Week ${value}`).join(", ");
        const yearText = (rule.years || []).join(", ");
        row.innerHTML = `<div><strong>${employeeName}</strong><br><span>${rule.occurrencesRequired || 1} occurrence(s) required • ${yearText || "-"} • ${monthText || "-"} • ${weekText || "-"}</span></div>`;

        const actions = document.createElement("div");
        actions.className = "trash-actions";
        const restoreButton = document.createElement("button");
        restoreButton.className = "secondary-btn";
        restoreButton.textContent = "Restore";
        restoreButton.addEventListener("click", () => restoreDeletedManualCreditRule(entry.id));

        const deleteForeverButton = document.createElement("button");
        deleteForeverButton.className = "danger-btn";
        deleteForeverButton.textContent = "Delete Forever";
        deleteForeverButton.addEventListener("click", () => deleteManualCreditRuleForever(entry.id));

        actions.appendChild(restoreButton);
        actions.appendChild(deleteForeverButton);
        row.appendChild(actions);
        manualRuleCard.appendChild(row);
    });
    content.appendChild(manualRuleCard);

    const taskTargetCard = document.createElement("div");
    taskTargetCard.className = "stack-card";
    taskTargetCard.innerHTML = `<h3>Deleted Task Target Processing Time (${taskTargets.length})</h3>`;
    taskTargets.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "trash-row";
        const target = entry.target || {};
        const taskColor = normalizeTaskColor(target.taskColor);
        const selectedLeaves = normalizeCountableLeaveValues(
            target.countLeaveTowardWfhCreditValues,
            target.countLeaveTowardWfhCredit,
        );
        const colorText = taskColor
            ? ` • Color: ${taskColor}`
            : "";
        const leaveText = selectedLeaves.length
            ? ` • Count toward WFH Credit: ${selectedLeaves.join(" / ")}`
            : " • Count toward WFH Credit: None";
        row.innerHTML = `<div><strong>${target.subtrade || "Unknown Task"}</strong><br><span>Target: ${target.targetProcessingTime || "-"} • WFH occurrences/week: ${target.weeklyWfhCreditTarget || "-"}${leaveText}${colorText}</span><br><span>Deleted: ${formatTimestamp(entry.deletedAt)}</span></div>`;

        const actions = document.createElement("div");
        actions.className = "trash-actions";
        const restoreButton = document.createElement("button");
        restoreButton.className = "secondary-btn";
        restoreButton.textContent = "Restore";
        restoreButton.addEventListener("click", () => restoreDeletedTaskTarget(entry.id));

        const deleteForeverButton = document.createElement("button");
        deleteForeverButton.className = "danger-btn";
        deleteForeverButton.textContent = "Delete Forever";
        deleteForeverButton.addEventListener("click", () => deleteTaskTargetForever(entry.id));

        actions.appendChild(restoreButton);
        actions.appendChild(deleteForeverButton);
        row.appendChild(actions);
        taskTargetCard.appendChild(row);
    });
    content.appendChild(taskTargetCard);
}

function setActiveView(view) {
    activeView = view;
    document.querySelectorAll(".view-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `${view}View`));
    document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    document.getElementById("sideNav").classList.remove("open");
    document.getElementById("menuBtn").classList.remove("open");
}

function openSettings(options = {}) {
    if (!getCurrentUser()) {
        openAuthModal();
        setAuthFeedback("Log in first to open settings.", "error");
        return;
    }
    const modal = document.getElementById("settingsModal");
    const headerInput = document.getElementById("headerNameInput");
    const accentInput = document.getElementById("accentColorInput");
    const backgroundInput = document.getElementById("backgroundColorInput");
    const surfaceInput = document.getElementById("surfaceColorInput");
    const textInput = document.getElementById("textColorInput");
    const accountUsernameInput = document.getElementById("accountUsernameInput");
    const accountPasswordInput = document.getElementById("accountPasswordInput");
    const accountFeedback = document.getElementById("accountFeedback");
    const subtradeTargetNameInput = document.getElementById("subtradeTargetNameInput");
    const subtradeTargetValueInput = document.getElementById("subtradeTargetValueInput");
    const subtradeTargetWeeklyCreditInput = document.getElementById("subtradeTargetWeeklyCreditInput");
    const subtradeTargetColorInput = document.getElementById("subtradeTargetColorInput");
    const adminPanel = document.getElementById("adminPanel");
    const currentUser = getCurrentUser();

    headerInput.value = state.headerName;
    accentInput.value = state.theme.accent;
    backgroundInput.value = state.theme.background;
    surfaceInput.value = state.theme.surface;
    textInput.value = state.theme.text;
    accountUsernameInput.value = currentUser?.username || "";
    accountPasswordInput.value = currentUser?.password || "";
    resetSubtradeTargetForm();
    setSubtradeTargetFeedback("Add task-specific target processing time and WFH credit rule.");
    renderSubtradeTargetList();
    accountFeedback.textContent = "";
    delete accountFeedback.dataset.tone;
    if (adminPanel) {
        const showAdminPanel = isAdminUser(currentUser);
        adminPanel.hidden = !showAdminPanel;
        adminPanel.classList.toggle("hidden", !showAdminPanel);
    }
    renderEmployeeNamesSettingsList();
    renderAdminAccountList();

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    syncAuthUI();
    if (options.focusAuth) {
        accountUsernameInput.focus();
    }
}

function openSettingsDetailModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        return;
    }
    closeSettingsDetailModals();
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

function closeSettingsDetailModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        return;
    }
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
}

function closeSettingsDetailModals() {
    SETTINGS_DETAIL_MODAL_IDS.forEach((modalId) => {
        closeSettingsDetailModal(modalId);
    });
}

function closeSettings() {
    document.getElementById("settingsModal").classList.add("hidden");
    document.getElementById("settingsModal").setAttribute("aria-hidden", "true");
    closeSettingsDetailModals();
}

function closeAllSettingsWindows() {
    closeSettings();
    closeScopeGuide();
    closeDeleteAccountModal();
}

function saveSettings() {
    if (!requireLoggedInUser()) {
        return;
    }
    const headerInput = document.getElementById("headerNameInput");
    const accentInput = document.getElementById("accentColorInput");
    const backgroundInput = document.getElementById("backgroundColorInput");
    const surfaceInput = document.getElementById("surfaceColorInput");
    const textInput = document.getElementById("textColorInput");
    const employeeFieldInputs = Array.from(document.querySelectorAll("#employeeSettingsList .settings-row input"));

    state.headerName = headerInput.value.trim() || "Work Setup Schedule";
    state.theme.accent = accentInput.value;
    state.theme.background = backgroundInput.value;
    state.theme.surface = surfaceInput.value;
    state.theme.text = textInput.value;

    employeeFieldInputs.forEach((input) => {
        const targetEmployee = state.employees.find((entry) => entry.id === input.dataset.employeeId);
        if (targetEmployee) {
            if (input.dataset.field === "subtrade") {
                targetEmployee.subtrade = input.value.trim() || "Uncategorized";
            } else if (input.dataset.field === "employeeColor") {
                targetEmployee.employeeColor = normalizeEmployeeColor(input.value);
            } else {
                targetEmployee.name = input.value.trim() || "Unnamed Employee";
            }
        }
    });

    saveState();
    applyTheme();
    render();
    closeAllSettingsWindows();
}

function hardResetAllData() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return;
    }
    const confirmed = window.confirm(`Are you sure you want to reset ${currentUser.username}'s data?`);
    if (!confirmed) {
        return;
    }
    openHardResetModal(currentUser.id);
}

function addEmployee() {
    if (!requireLoggedInUser()) {
        return;
    }
    openAddEmployeeTabModal();
}

function restoreDefaultTheme() {
    if (!requireLoggedInUser()) {
        return;
    }
    state.theme = cloneState(createDefaultState()).theme;
    saveState();
    applyTheme();
    openSettings();
}

function updateThemeFromInput() {
    if (!getCurrentUser()) {
        return;
    }
    state.theme.accent = document.getElementById("accentColorInput").value;
    state.theme.background = document.getElementById("backgroundColorInput").value;
    state.theme.surface = document.getElementById("surfaceColorInput").value;
    state.theme.text = document.getElementById("textColorInput").value;
    saveState();
    applyTheme();
}

function populateReportScope() {
    const list = document.getElementById("reportEmployeeList");
    const fromDate = document.getElementById("reportFromDate");
    const toDate = document.getElementById("reportToDate");
    list.innerHTML = "";
    state.employees.forEach((employee) => {
        const label = document.createElement("label");
        label.className = "checkbox-row";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = employee.id;
        checkbox.checked = true;
        checkbox.dataset.employeeId = employee.id;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(employee.name));
        list.appendChild(label);
    });
    document.getElementById("selectAllEmployees").checked = true;
    if (fromDate) {
        fromDate.value = "";
    }
    if (toDate) {
        toDate.value = "";
    }
    renderReportPreview();
}

function clearReportFilters() {
    document.querySelectorAll("#reportEmployeeList input").forEach((checkbox) => {
        checkbox.checked = true;
    });
    const selectAll = document.getElementById("selectAllEmployees");
    const fromDate = document.getElementById("reportFromDate");
    const toDate = document.getElementById("reportToDate");
    if (selectAll) {
        selectAll.checked = true;
    }
    if (fromDate) {
        fromDate.value = "";
    }
    if (toDate) {
        toDate.value = "";
    }
    renderReportPreview();
}

function getReportRowDisplay(row) {
    const employee = state.employees.find((entry) => entry.id === row.employeeId);
    const workSetup = getDisplayWorkSetup(row, employee);
    const wfoStatus = workSetup === "WFO" ? getWfoStatusLabel(row) : "";
    return {
        workSetup,
        wfoStatus,
        employee,
    };
}

function buildReportRows() {
    const selectedIds = Array.from(document.querySelectorAll("#reportEmployeeList input:checked")).map((input) => input.value);
    const fromDate = document.getElementById("reportFromDate").value;
    const toDate = document.getElementById("reportToDate").value;
    const selectedEmployees = selectedIds.length
        ? state.employees.filter((employee) => selectedIds.includes(employee.id))
        : [];

    const rows = [];
    selectedEmployees.forEach((employee) => {
        employee.rows.forEach((row) => {
            const rowDate = parseDateValue(row.dateValue);
            const matchesFrom = fromDate ? rowDate >= parseDateValue(fromDate) : true;
            const matchesTo = toDate ? rowDate <= parseDateValue(toDate) : true;
            if (matchesFrom && matchesTo) {
                rows.push({ employee: employee.name, employeeId: employee.id, ...row });
            }
        });
    });
    return rows.sort((left, right) => {
        if (left.employee !== right.employee) {
            return left.employee.localeCompare(right.employee);
        }
        return parseDateValue(left.dateValue) - parseDateValue(right.dateValue);
    });
}

function renderReportPreview() {
    const content = document.getElementById("reportPreviewContent");
    const summary = document.getElementById("reportPreviewSummary");
    if (!content || !summary) {
        return;
    }

    const rows = buildReportRows();
    content.innerHTML = "";

    if (!rows.length) {
        summary.textContent = "No rows selected yet.";
        content.innerHTML = '<p class="help-text">Choose employees or a date range to preview the report rows here.</p>';
        return;
    }

    const wfoCount = rows.filter((row) => getReportRowDisplay(row).workSetup === "WFO").length;
    summary.textContent = `${rows.length} row(s) selected • ${wfoCount} WFO row(s)`;

    const tableWrap = document.createElement("div");
    tableWrap.className = "report-preview-table-wrap";
    const table = document.createElement("table");
    table.className = "report-preview-table";
    table.innerHTML = `<thead><tr><th>Employee</th><th>Date</th><th>Week</th><th>Month</th><th>Day</th><th>Processing Time</th><th>WFO Waive</th><th>Work Setup</th><th>WFO Status</th><th>Accuracy</th><th>Unapproved Leave</th><th>Change Month</th><th>Change Date</th></tr></thead>`;
    const tbody = document.createElement("tbody");

    rows.forEach((row) => {
        const { workSetup, wfoStatus } = getReportRowDisplay(row);
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.employee}</td><td>${row.dateValue}</td><td>${getWeekLabel(row.dateValue)}</td><td>${getDisplayDate(row.dateValue).month}</td><td>${getDisplayDate(row.dateValue).day}</td><td>${row.processingTime || ""}</td><td>${row.wfoWave || ""}</td><td>${workSetup || ""}</td><td>${wfoStatus || ""}</td><td>${row.accuracy || ""}</td><td>${row.unapprovedLeave || ""}</td><td>${row.changeScheduleMonth || ""}</td><td>${row.changeScheduleDate || ""}</td>`;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    content.appendChild(tableWrap);
}

function downloadReport() {
    const rows = buildReportRows();
    if (!rows.length) {
        window.alert("No data to export.");
        return;
    }
    const header = ["Employee", "Date", "Week", "Month", "Day", "Processing Time", "WFO Waive", "Work Setup", "WFO Status", "Accuracy", "Unapproved Leave", "Change Schedule Month", "Change Schedule Date"];
    const csvRows = [header.join(",")];
    rows.forEach((row) => {
        const { workSetup, wfoStatus } = getReportRowDisplay(row);
        const values = [
            row.employee,
            row.dateValue,
            getWeekLabel(row.dateValue),
            getDisplayDate(row.dateValue).month,
            getDisplayDate(row.dateValue).day,
            row.processingTime,
            row.wfoWave,
            workSetup,
            wfoStatus,
            row.accuracy,
            row.unapprovedLeave,
            row.changeScheduleMonth,
            row.changeScheduleDate,
        ];
        csvRows.push(values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "work-setup-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
}

function openScopeGuide() {
    closeSettingsDetailModal("viewScopeSettingsModal");
    document.getElementById("scopeModal").classList.remove("hidden");
    document.getElementById("scopeModal").setAttribute("aria-hidden", "false");
}

function closeScopeGuide() {
    document.getElementById("scopeModal").classList.add("hidden");
    document.getElementById("scopeModal").setAttribute("aria-hidden", "true");
}

function render() {
    applyTheme();
    renderHeader();
    syncAuthUI();
    renderFilters();
    renderTabs();
    renderTable();
    renderSummary();
    renderCredits();
    renderDashboard();
    renderTrash();
}

function setupEvents() {
    document.getElementById("settingsBtn").addEventListener("click", openSettings);
    document.getElementById("authShortcutBtn").addEventListener("click", () => {
        openAuthModal();
    });
    document.getElementById("openAuthModalBtn").addEventListener("click", openAuthModal);
    document.getElementById("addRowBtn").addEventListener("click", addRow);
    document.getElementById("sequenceDatesBtn").addEventListener("click", sequenceCurrentMonthDates);
    document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings);
    document.getElementById("cancelSettingsBtn").addEventListener("click", closeSettings);
    document.querySelectorAll("#settingsModal .settings-nav-row").forEach((row) => {
        const targetModal = row.dataset.targetModal;
        if (!targetModal) {
            return;
        }
        row.addEventListener("click", () => openSettingsDetailModal(targetModal));
        row.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openSettingsDetailModal(targetModal);
            }
        });
    });
    document.getElementById("closeActiveAccountSettingsBtn").addEventListener("click", () => closeSettingsDetailModal("activeAccountSettingsModal"));
    document.getElementById("closeThemeSettingsBtn").addEventListener("click", () => closeSettingsDetailModal("themeSettingsModal"));
    document.getElementById("closeSubtradeTargetsSettingsBtn").addEventListener("click", () => closeSettingsDetailModal("subtradeTargetsSettingsModal"));
    document.getElementById("closeQuickGuideSettingsBtn").addEventListener("click", () => closeSettingsDetailModal("quickGuideSettingsModal"));
    document.getElementById("closeViewScopeSettingsBtn").addEventListener("click", () => closeSettingsDetailModal("viewScopeSettingsModal"));
    document.getElementById("closeEmployeeNamesSettingsBtn").addEventListener("click", () => closeSettingsDetailModal("employeeNamesSettingsModal"));
    document.getElementById("closeHardResetSettingsBtn").addEventListener("click", () => closeSettingsDetailModal("hardResetSettingsModal"));
    document.getElementById("closeManualWfhCreditOptionsBtn").addEventListener("click", closeManualWfhCreditOptionsModal);
    document.getElementById("confirmAddEmployeeTabBtn").addEventListener("click", confirmAddEmployeeFromTabs);
    document.getElementById("cancelAddEmployeeTabBtn").addEventListener("click", closeAddEmployeeTabModal);
    document.getElementById("addManualCreditRuleBtn").addEventListener("click", addManualWfhCreditRule);
    document.getElementById("clearManualCreditFiltersBtn").addEventListener("click", clearManualCreditLogFilters);
    document.getElementById("addSubtradeTargetBtn").addEventListener("click", addSubtradeProcessingTarget);
    document.getElementById("cancelSubtradeTargetEditBtn").addEventListener("click", cancelSubtradeTargetEdit);
    document.getElementById("addEmployeeBtn").addEventListener("click", addEmployee);
    document.getElementById("signUpBtn").addEventListener("click", signUpUser);
    document.getElementById("logInBtn").addEventListener("click", logInUser);
    document.getElementById("logOutBtn").addEventListener("click", logOutUser);
    document.getElementById("updateAccountBtn").addEventListener("click", updateCurrentAccount);
    document.getElementById("deleteCurrentAccountBtn").addEventListener("click", () => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            openDeleteAccountModal(currentUser.id);
        }
    });
    document.getElementById("confirmDeleteAccountBtn").addEventListener("click", confirmDeleteAccount);
    document.getElementById("cancelDeleteAccountBtn").addEventListener("click", closeDeleteAccountModal);
    document.getElementById("saveManualWfoBtn").addEventListener("click", confirmManualWfo);
    document.getElementById("cancelManualWfoBtn").addEventListener("click", closeManualWfoModal);
    document.getElementById("saveManualWfhBtn").addEventListener("click", confirmManualWfh);
    document.getElementById("cancelManualWfhBtn").addEventListener("click", closeManualWfhModal);
    document.getElementById("hardResetBtn").addEventListener("click", hardResetAllData);
    document.getElementById("confirmHardResetPasswordBtn").addEventListener("click", confirmHardReset);
    document.getElementById("cancelHardResetPasswordBtn").addEventListener("click", closeHardResetModal);
    document.getElementById("restoreDefaultsBtn").addEventListener("click", restoreDefaultTheme);
    document.getElementById("openQuickGuideBtn").addEventListener("click", reopenQuickGuide);
    document.getElementById("clearAdminSearchBtn").addEventListener("click", clearAdminSearch);
    document.getElementById("viewScopeBtn").addEventListener("click", openScopeGuide);
    document.getElementById("closeScopeBtn").addEventListener("click", closeScopeGuide);
    document.getElementById("clearReportFiltersBtn").addEventListener("click", clearReportFilters);
    document.getElementById("previousGuideBtn").addEventListener("click", previousGuideStep);
    document.getElementById("hideGuideForeverBtn").addEventListener("click", disableGuideForCurrentUser);
    document.getElementById("nextGuideBtn").addEventListener("click", nextGuideStep);
    document.getElementById("skipGuideBtn").addEventListener("click", restartGuideTour);
    document.getElementById("addEmployeeTabNameInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            confirmAddEmployeeFromTabs();
        }
    });
    document.getElementById("addEmployeeTabSubtradeInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            confirmAddEmployeeFromTabs();
        }
    });
    document.getElementById("subtradeTargetNameInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addSubtradeProcessingTarget();
        }
    });
    document.getElementById("subtradeTargetValueInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addSubtradeProcessingTarget();
        }
    });
    document.getElementById("subtradeTargetWeeklyCreditInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addSubtradeProcessingTarget();
        }
    });
    document.getElementById("subtradeTargetColorInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addSubtradeProcessingTarget();
        }
    });
    document.getElementById("manualCreditSearchInput").addEventListener("input", (event) => {
        manualCreditSearchQuery = event.target.value;
        renderManualCreditRuleList();
    });
    document.getElementById("manualCreditFilterYear").addEventListener("change", (event) => {
        manualCreditFilterYear = event.target.value;
        renderManualCreditRuleList();
    });
    document.getElementById("manualCreditFilterMonth").addEventListener("change", (event) => {
        manualCreditFilterMonth = event.target.value;
        renderManualCreditRuleList();
    });
    document.getElementById("manualCreditFilterWeek").addEventListener("change", (event) => {
        manualCreditFilterWeek = event.target.value;
        renderManualCreditRuleList();
    });

    document.getElementById("settingsModal").addEventListener("click", () => {
        // Keep settings open when clicking outside; close only via Save or Cancel.
    });
    document.getElementById("deleteAccountModal").addEventListener("click", (event) => {
        if (event.target.id === "deleteAccountModal") {
            closeDeleteAccountModal();
        }
    });
    document.getElementById("manualWfoModal").addEventListener("click", (event) => {
        if (event.target.id === "manualWfoModal") {
            closeManualWfoModal();
        }
    });
    document.getElementById("hardResetPasswordModal").addEventListener("click", (event) => {
        if (event.target.id === "hardResetPasswordModal") {
            closeHardResetModal();
        }
    });
    document.getElementById("manualWfhModal").addEventListener("click", (event) => {
        if (event.target.id === "manualWfhModal") {
            closeManualWfhModal();
        }
    });
    document.getElementById("contributorDashboardModal").addEventListener("click", (event) => {
        if (event.target.id === "contributorDashboardModal") {
            closeContributorDashboardModal();
        }
    });
    document.getElementById("authModal").addEventListener("click", (event) => {
        if (event.target.id === "authModal" && getCurrentUser()) {
            closeAuthModal();
        }
    });
    document.getElementById("guideModal").addEventListener("click", (event) => {
        if (event.target.id === "guideModal") {
            closeGuide();
        }
    });
    document.getElementById("reportModal").addEventListener("click", (event) => {
        if (event.target.id === "reportModal") {
            document.getElementById("reportModal").classList.add("hidden");
            document.getElementById("reportModal").setAttribute("aria-hidden", "true");
        }
    });
    document.getElementById("cancelReportBtn").addEventListener("click", () => {
        document.getElementById("reportModal").classList.add("hidden");
        document.getElementById("reportModal").setAttribute("aria-hidden", "true");
    });
    document.getElementById("downloadReportBtn").addEventListener("click", downloadReport);
    document.getElementById("scopeModal").addEventListener("click", (event) => {
        if (event.target.id === "scopeModal") {
            closeScopeGuide();
        }
    });
    document.getElementById("closeContributorDashboardBtn").addEventListener("click", closeContributorDashboardModal);
    document.getElementById("selectAllEmployees").addEventListener("change", (event) => {
        document.querySelectorAll("#reportEmployeeList input").forEach((checkbox) => {
            checkbox.checked = event.target.checked;
        });
        renderReportPreview();
    });

    document.getElementById("reportEmployeeList").addEventListener("change", renderReportPreview);
    document.getElementById("reportFromDate").addEventListener("change", renderReportPreview);
    document.getElementById("reportToDate").addEventListener("change", renderReportPreview);
    document.getElementById("adminAccountSearchInput").addEventListener("input", renderAdminAccountList);
    window.addEventListener("resize", refreshActiveGuidePosition);
    window.addEventListener("scroll", refreshActiveGuidePosition, true);

    document.getElementById("menuBtn").addEventListener("click", () => {
        const sideNav = document.getElementById("sideNav");
        const menuButton = document.getElementById("menuBtn");
        sideNav.classList.toggle("open");
        menuButton.classList.toggle("open");
    });

    document.addEventListener("click", (event) => {
        const sideNav = document.getElementById("sideNav");
        const menuButton = document.getElementById("menuBtn");
        if (!sideNav.contains(event.target) && !menuButton.contains(event.target)) {
            sideNav.classList.remove("open");
            menuButton.classList.remove("open");
        }
    });

    document.querySelectorAll(".nav-link").forEach((button) => {
        button.addEventListener("click", () => {
            if (button.id === "generateReportBtn") {
                populateReportScope();
                document.getElementById("reportModal").classList.remove("hidden");
                document.getElementById("reportModal").setAttribute("aria-hidden", "false");
                document.getElementById("sideNav").classList.remove("open");
                document.getElementById("menuBtn").classList.remove("open");
                return;
            }
            if (button.id === "manualCreditLogsNavBtn") {
                openManualWfhCreditOptionsModal();
                document.getElementById("sideNav").classList.remove("open");
                document.getElementById("menuBtn").classList.remove("open");
                return;
            }
            setActiveView(button.dataset.view);
        });
    });

    document.getElementById("yearFilter").addEventListener("change", (event) => {
        state.selectedYear = Number(event.target.value);
        saveState();
        render();
    });

    document.getElementById("subtradeFilter").addEventListener("change", (event) => {
        state.selectedSubtrade = event.target.value || "all";
        saveState();
        render();
    });

    document.getElementById("monthFilterBtn").addEventListener("click", (event) => {
        event.stopPropagation();
        const monthMenu = document.getElementById("monthFilterMenu");
        const weekMenu = document.getElementById("weekFilterMenu");
        const dayMenu = document.getElementById("dayFilterMenu");
        weekMenu.classList.add("hidden");
        if (dayMenu) {
            dayMenu.classList.add("hidden");
        }
        monthMenu.classList.toggle("hidden");
    });

    document.getElementById("weekFilterBtn").addEventListener("click", (event) => {
        event.stopPropagation();
        const monthMenu = document.getElementById("monthFilterMenu");
        const weekMenu = document.getElementById("weekFilterMenu");
        const dayMenu = document.getElementById("dayFilterMenu");
        monthMenu.classList.add("hidden");
        weekMenu.classList.toggle("hidden");
        if (dayMenu) {
            dayMenu.classList.add("hidden");
        }
    });

    document.getElementById("dayFilterBtn").addEventListener("click", (event) => {
        event.stopPropagation();
        const monthMenu = document.getElementById("monthFilterMenu");
        const weekMenu = document.getElementById("weekFilterMenu");
        const dayMenu = document.getElementById("dayFilterMenu");
        monthMenu.classList.add("hidden");
        weekMenu.classList.add("hidden");
        dayMenu.classList.toggle("hidden");
    });

    document.getElementById("dashboardMetricFilterBtn").addEventListener("click", (event) => {
        event.stopPropagation();
        const monthMenu = document.getElementById("monthFilterMenu");
        const weekMenu = document.getElementById("weekFilterMenu");
        const dashboardMetricMenu = document.getElementById("dashboardMetricFilterMenu");
        const dashboardContributorMenu = document.getElementById("dashboardContributorFilterMenu");
        monthMenu.classList.add("hidden");
        weekMenu.classList.add("hidden");
        if (dashboardContributorMenu) {
            dashboardContributorMenu.classList.add("hidden");
        }
        dashboardMetricMenu.classList.toggle("hidden");
    });

    document.getElementById("dashboardContributorFilterBtn").addEventListener("click", (event) => {
        event.stopPropagation();
        const monthMenu = document.getElementById("monthFilterMenu");
        const weekMenu = document.getElementById("weekFilterMenu");
        const dashboardMetricMenu = document.getElementById("dashboardMetricFilterMenu");
        const dashboardContributorMenu = document.getElementById("dashboardContributorFilterMenu");
        monthMenu.classList.add("hidden");
        weekMenu.classList.add("hidden");
        dashboardMetricMenu.classList.add("hidden");
        dashboardContributorMenu.classList.toggle("hidden");
    });

    document.getElementById("monthFilterMenu").addEventListener("click", (event) => {
        event.stopPropagation();
    });
    document.getElementById("weekFilterMenu").addEventListener("click", (event) => {
        event.stopPropagation();
    });
    document.getElementById("dayFilterMenu").addEventListener("click", (event) => {
        event.stopPropagation();
    });
    document.getElementById("dashboardMetricFilterMenu").addEventListener("click", (event) => {
        event.stopPropagation();
    });
    document.getElementById("dashboardContributorFilterMenu").addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.getElementById("monthSelectAll").addEventListener("change", (event) => {
        const previousMonths = Array.isArray(state.selectedMonths)
            ? state.selectedMonths.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
            : [];
        const previousWeeks = Array.isArray(state.selectedWeeks)
            ? state.selectedWeeks.map((value) => `${value}`).filter((value) => value === "all" || /^\d+$/.test(value))
            : [];
        if (previousMonths.length) {
            rememberWeeksForMonths(previousMonths, previousWeeks);
        }

        state.selectedMonths = event.target.checked ? monthNames.map((_, index) => index + 1) : [];
        if (state.selectedMonths.length) {
            state.selectedMonth = state.selectedMonths[0];
        }
        if (!state.selectedMonths.length) {
            state.selectedWeeks = [];
            state.selectedDays = [];
            saveState();
            render();
            return;
        }

        const availableWeeks = getAvailableWeekValues(Number(state.selectedYear) || 2026, state.selectedMonths);
        const rememberedWeeks = getRememberedWeeksForMonths(state.selectedMonths).filter((week) => week === "all" || availableWeeks.includes(week));
        state.selectedWeeks = rememberedWeeks.length ? rememberedWeeks : (availableWeeks.length ? ["all"] : []);
        state.selectedWeek = state.selectedWeeks[0] || "all";
        state.selectedDays = state.selectedWeeks.length
            ? getAvailableDayValues(Number(state.selectedYear) || 2026, state.selectedMonths, state.selectedWeeks, state.selectedSubtrade)
            : [];
        saveState();
        render();
    });

    document.getElementById("weekSelectAll").addEventListener("change", (event) => {
        const selectedMonths = Array.isArray(state.selectedMonths)
            ? state.selectedMonths.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
            : [];
        const availableWeeks = getAvailableWeekValues(Number(state.selectedYear) || 2026, selectedMonths);
        state.selectedWeeks = event.target.checked && availableWeeks.length ? ["all"] : [];
        state.selectedWeek = state.selectedWeeks[0] || "all";
        if (selectedMonths.length) {
            rememberWeeksForMonths(selectedMonths, state.selectedWeeks);
        }
        state.selectedDays = state.selectedWeeks.length
            ? getAvailableDayValues(Number(state.selectedYear) || 2026, selectedMonths, state.selectedWeeks, state.selectedSubtrade)
            : [];
        saveState();
        render();
    });

    document.getElementById("monthFilterList").addEventListener("change", () => {
        const previousMonths = Array.isArray(state.selectedMonths)
            ? state.selectedMonths.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
            : [];
        const previousWeeks = Array.isArray(state.selectedWeeks)
            ? state.selectedWeeks.map((value) => `${value}`).filter((value) => value === "all" || /^\d+$/.test(value))
            : [];
        if (previousMonths.length) {
            rememberWeeksForMonths(previousMonths, previousWeeks);
        }

        const selectedMonths = Array.from(document.querySelectorAll("#monthFilterList input:checked")).map((input) => Number(input.value));
        state.selectedMonths = selectedMonths;
        if (selectedMonths.length) {
            state.selectedMonth = selectedMonths[0];
        }
        if (!selectedMonths.length) {
            state.selectedWeeks = [];
            state.selectedDays = [];
            saveState();
            render();
            return;
        }

        const availableWeeks = getAvailableWeekValues(Number(state.selectedYear) || 2026, selectedMonths);
        const rememberedWeeks = getRememberedWeeksForMonths(selectedMonths).filter((week) => week === "all" || availableWeeks.includes(week));
        state.selectedWeeks = rememberedWeeks.length ? rememberedWeeks : (availableWeeks.length ? ["all"] : []);
        state.selectedWeek = state.selectedWeeks[0] || "all";
        state.selectedDays = state.selectedWeeks.length
            ? getAvailableDayValues(Number(state.selectedYear) || 2026, selectedMonths, state.selectedWeeks, state.selectedSubtrade)
            : [];
        saveState();
        render();
    });

    document.getElementById("weekFilterList").addEventListener("change", () => {
        const selectedMonths = Array.isArray(state.selectedMonths)
            ? state.selectedMonths.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
            : [];
        const selectedWeeks = Array.from(document.querySelectorAll("#weekFilterList input:checked")).map((input) => `${input.value}`);
        const availableWeeks = getAvailableWeekValues(Number(state.selectedYear) || 2026, selectedMonths);
        state.selectedWeeks = availableWeeks.length && selectedWeeks.length === availableWeeks.length ? ["all"] : selectedWeeks;
        state.selectedWeek = state.selectedWeeks[0] || "all";
        if (selectedMonths.length) {
            rememberWeeksForMonths(selectedMonths, state.selectedWeeks);
        }
        state.selectedDays = state.selectedWeeks.length
            ? getAvailableDayValues(Number(state.selectedYear) || 2026, selectedMonths, state.selectedWeeks, state.selectedSubtrade)
            : [];
        saveState();
        render();
    });

    document.getElementById("daySelectAll").addEventListener("change", (event) => {
        const selectedMonths = Array.isArray(state.selectedMonths)
            ? state.selectedMonths.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
            : [];
        const selectedWeeks = Array.isArray(state.selectedWeeks)
            ? state.selectedWeeks.map((value) => `${value}`)
            : [];
        const availableDays = getAvailableDayValues(Number(state.selectedYear) || 2026, selectedMonths, selectedWeeks, state.selectedSubtrade);
        state.selectedDays = event.target.checked ? availableDays : [];
        saveState();
        render();
    });

    document.getElementById("dayFilterList").addEventListener("change", () => {
        const selectedDays = Array.from(document.querySelectorAll("#dayFilterList input:checked"))
            .map((input) => `${input.value || ""}`.trim())
            .filter((value) => Boolean(value));
        state.selectedDays = selectedDays;
        saveState();
        render();
    });

    document.getElementById("dashboardMetricSelectAll").addEventListener("change", (event) => {
        state.dashboardMetricFilterKeys = event.target.checked
            ? DASHBOARD_METRIC_DEFINITIONS.map((entry) => entry.key)
            : [];
        state.dashboardMetricFilterKeys = normalizeDashboardMetricFilterKeys(state.dashboardMetricFilterKeys);
        saveState();
        renderFilters();
        renderDashboard();
    });

    document.getElementById("dashboardMetricFilterList").addEventListener("change", () => {
        const selectedMetricKeys = Array.from(document.querySelectorAll("#dashboardMetricFilterList input:checked"))
            .map((input) => `${input.value || ""}`.trim());
        state.dashboardMetricFilterKeys = normalizeDashboardMetricFilterKeys(selectedMetricKeys);
        saveState();
        renderFilters();
        renderDashboard();
    });

    document.getElementById("dashboardContributorSelectAll").addEventListener("change", (event) => {
        const scopedEmployees = getDashboardScopedEmployees();
        state.dashboardContributorEmployeeIds = event.target.checked
            ? scopedEmployees.map((employee) => employee.id)
            : [];
        saveState();
        renderFilters();
        renderDashboard();
    });

    document.getElementById("dashboardContributorFilterList").addEventListener("change", () => {
        const selectedContributorIds = Array.from(document.querySelectorAll("#dashboardContributorFilterList input:checked"))
            .map((input) => `${input.value || ""}`.trim())
            .filter((value) => Boolean(value));
        state.dashboardContributorEmployeeIds = normalizeDashboardContributorEmployeeIds(selectedContributorIds) || [];
        saveState();
        renderFilters();
        renderDashboard();
    });

    document.addEventListener("click", () => {
        closeFilterMenus();
    });

    document.getElementById("dashboardChartStyle").addEventListener("change", (event) => {
        state.dashboardChartStyle = event.target.value;
        saveState();
        renderDashboard();
    });
    document.getElementById("dashboardChartScope").addEventListener("change", (event) => {
        state.dashboardChartScope = event.target.value;
        saveState();
        renderFilters();
        renderDashboard();
    });

    ["accentColorInput", "backgroundColorInput", "surfaceColorInput", "textColorInput"].forEach((id) => {
        document.getElementById(id).addEventListener("input", updateThemeFromInput);
    });
}

setupEvents();
setActiveView(activeView);
applyTheme();
render();
