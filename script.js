const STORAGE_KEY = "offline-work-setup-schedule-v4";
const BACKUP_KEY = `${STORAGE_KEY}-backup`;
const AUTH_STORAGE_KEY = "offline-work-setup-auth-v1";
const USER_STORAGE_PREFIX = "offline-work-setup-user-v1";
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
        notes: "",
        generatedByRowId: "",
        ...defaults,
    };
}

function createDefaultState() {
    return {
        headerName: "Work Setup Schedule",
        targetProcessingTime: "",
        weeklyWfhCreditTarget: "",
        selectedYear: 2026,
        selectedMonth: 8,
        selectedWeek: "all",
        selectedMonths: [8],
        selectedWeeks: ["all"],
        dashboardChartStyle: "pie",
        dashboardChartScope: "overview",
        theme: {
            accent: "#2563eb",
            background: "#f3f6fb",
            surface: "#ffffff",
            text: "#172033",
        },
        deleted: {
            rows: [],
            employees: [],
        },
        employees: [],
    };
}

function createDefaultAuthState() {
    return {
        currentUserId: "",
        legacyMigrated: false,
        users: [],
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
    const users = Array.isArray(saved?.users)
        ? saved.users.map((user) => ({
            id: user.id || createId(),
            username: `${user.username || ""}`.trim() || "User",
            usernameKey: normalizeUsername(user.usernameKey || user.username),
            password: typeof user.password === "string" ? user.password : "",
        })).filter((user) => user.usernameKey)
        : [];
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

function loadState() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return cloneState(createDefaultState());
    }
    try {
        const saved = localStorage.getItem(getUserStorageKey(currentUser.id));
        const backup = localStorage.getItem(getUserBackupKey(currentUser.id));
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
            rows: Array.isArray(employee.rows) && employee.rows.length
                ? employee.rows.map((row) => {
                    const normalizedChangeSchedule = normalizeChangeScheduleFields(row);
                    return {
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
                        notes: row.notes || "",
                        generatedByRowId: typeof row.generatedByRowId === "string" ? row.generatedByRowId : "",
                    };
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

    const normalizedSelectedMonths = Array.isArray(saved.selectedMonths) && saved.selectedMonths.length
        ? Array.from(new Set(saved.selectedMonths.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)))
        : (Number(saved.selectedMonth) >= 1 && Number(saved.selectedMonth) <= 12 ? [Number(saved.selectedMonth)] : [fallback.selectedMonth]);

    let normalizedSelectedWeeks = Array.isArray(saved.selectedWeeks) && saved.selectedWeeks.length
        ? Array.from(new Set(saved.selectedWeeks.map((value) => `${value}`.trim()).filter((value) => value === "all" || /^\d+$/.test(value))))
        : (`${saved.selectedWeek || ""}`.trim() ? [`${saved.selectedWeek}`.trim()] : [fallback.selectedWeek]);
    if (normalizedSelectedWeeks.includes("all")) {
        normalizedSelectedWeeks = ["all"];
    }

    return {
        headerName: saved.headerName || fallback.headerName,
        targetProcessingTime: typeof saved.targetProcessingTime === "string" ? saved.targetProcessingTime : fallback.targetProcessingTime,
        weeklyWfhCreditTarget: typeof saved.weeklyWfhCreditTarget === "string"
            ? saved.weeklyWfhCreditTarget
            : (saved.weeklyWfhCreditTarget === null || typeof saved.weeklyWfhCreditTarget === "undefined"
                ? fallback.weeklyWfhCreditTarget
                : String(saved.weeklyWfhCreditTarget)),
        selectedYear: Math.max(2026, Number(saved.selectedYear) || fallback.selectedYear),
        selectedMonth: normalizedSelectedMonths[0] || fallback.selectedMonth,
        selectedWeek: normalizedSelectedWeeks[0] || fallback.selectedWeek,
        selectedMonths: normalizedSelectedMonths,
        selectedWeeks: normalizedSelectedWeeks,
        dashboardChartStyle: saved.dashboardChartStyle || fallback.dashboardChartStyle,
        dashboardChartScope: saved.dashboardChartScope || fallback.dashboardChartScope,
        theme: {
            accent: saved.theme?.accent || fallback.theme.accent,
            background: saved.theme?.background || fallback.theme.background,
            surface: saved.theme?.surface || fallback.theme.surface,
            text: saved.theme?.text || fallback.theme.text,
        },
        deleted: {
            rows: deletedRows,
            employees: deletedEmployees,
        },
        employees,
    };
}

pendingMigrationState = loadLegacyState();

function hasTargetProcessingTime() {
    return Boolean(`${state.targetProcessingTime || ""}`.trim());
}

function getWeeklyCreditTargetNumber() {
    const value = Number(state.weeklyWfhCreditTarget);
    return Number.isFinite(value) && value > 0 ? value : 0;
}

function requireLoggedInUser() {
    if (getCurrentUser()) {
        return true;
    }
    openSettings({ focusAuth: true });
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

function getAvailableWeekValues(year, months) {
    const validMonths = Array.isArray(months) && months.length
        ? months.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
        : [];
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
            rows: [],
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

function saveState() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return;
    }
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
    const selectedMonths = Array.isArray(state.selectedMonths) && state.selectedMonths.length
        ? state.selectedMonths.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
        : [Number(state.selectedMonth) || 1];

    const availableWeeks = getAvailableWeekValues(Number(state.selectedYear) || 2026, selectedMonths);

    let selectedWeeks = Array.isArray(state.selectedWeeks) && state.selectedWeeks.length
        ? state.selectedWeeks.map((value) => `${value}`)
        : [`${state.selectedWeek || "all"}`];
    if (selectedWeeks.includes("all")) {
        selectedWeeks = ["all"];
    } else {
        selectedWeeks = selectedWeeks.filter((week) => availableWeeks.includes(week));
    }

    return {
        year: Number(state.selectedYear) || 2026,
        months: selectedMonths,
        weeks: selectedWeeks,
    };
}

function isRowInFilters(row) {
    const { year, months, weeks } = getSelectedFilters();
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
    return true;
}

function getFilteredRows(employee) {
    return employee.rows.filter((row) => isRowInFilters(row));
}

function getVisibleRows() {
    const rows = state.employees.flatMap((employee) =>
        getFilteredRows(employee).map((row) => ({ ...row, employeeId: employee.id, employeeName: employee.name }))
    );
    return activeTab === "all" ? rows : rows.filter((row) => row.employeeId === activeTab);
}

function getAllRows() {
    return state.employees.flatMap((employee) =>
        getFilteredRows(employee).map((row) => ({ ...row, employeeId: employee.id, employeeName: employee.name }))
    );
}

function getWfoReasons(row) {
    const reasons = [];
    if (hasTargetProcessingTime() && parseDurationToSeconds(row.processingTime) > parseDurationToSeconds(state.targetProcessingTime)) {
        reasons.push("Processing Time");
    }
    if (row.accuracy === "With Error") {
        reasons.push("Accuracy");
    }
    if (["SL", "EL"].includes((row.unapprovedLeave || "").trim())) {
        reasons.push("Unapproved Leave");
    }
    if (row.wfoWave === "Change Schedule" || row.wfoWave === "Justified" || row.wfoWave === "Use WFH Credit") {
        reasons.push("WFO Wave");
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

function hasProjectionDriver(row) {
    if (!hasSetupInput(row)) {
        return false;
    }
    if (row.wfoWave === "Justified" || row.wfoWave === "Use WFH Credit") {
        return false;
    }
    if (row.wfoWave === "Change Schedule") {
        return Boolean(`${row.changeScheduleMonth || ""}`.trim() && `${row.changeScheduleDate || ""}`.trim());
    }
    return true;
}

function getProjectedDateForSourceRow(row) {
    if (!hasProjectionDriver(row)) {
        return "";
    }
    if (row.wfoWave === "Change Schedule") {
        const monthIndex = parseMonthValue(row.changeScheduleMonth);
        if (monthIndex !== null && row.changeScheduleDate) {
            return buildDateValue(Number(state.selectedYear), monthIndex, row.changeScheduleDate);
        }
    }
    return addDays(row.dateValue, 7);
}

function getProjectedOutcomeFromSourceRow(row) {
    if (!hasProjectionDriver(row)) {
        return null;
    }
    if (row.wfoWave === "Change Schedule") {
        return { setup: "WFO", reasons: ["Change Schedule"] };
    }
    const reasons = getWfoReasons(row).filter((reason) => reason !== "WFO Wave" && reason !== "Change Schedule");
    if (reasons.length) {
        return { setup: "WFO", reasons };
    }
    if (hasSetupInput(row)) {
        return { setup: "WFH", reasons: ["Eligible"] };
    }
    return null;
}

function getOutcomeForTargetRow(employee, row) {
    if (!employee || !row?.dateValue) {
        return null;
    }
    const matches = employee.rows
        .filter((sourceRow) => sourceRow.id !== row.id)
        .map((sourceRow) => ({ sourceRow, targetDate: getProjectedDateForSourceRow(sourceRow), outcome: getProjectedOutcomeFromSourceRow(sourceRow) }))
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
    const targetDateValue = getProjectedDateForSourceRow(row);
    const outcome = getProjectedOutcomeFromSourceRow(row);
    if (!targetDateValue || !outcome) {
        return;
    }
    const existingTargetRow = employee.rows.find((entry) => entry.id !== row.id && entry.dateValue === targetDateValue);
    if (existingTargetRow) {
        existingTargetRow.generatedByRowId = row.id;
        return;
    }
    employee.rows.push(createRow(targetDateValue, { generatedByRowId: row.id }));
}

function clearProjectedResultFromSource(employee, sourceRowId) {
    employee.rows.forEach((entry) => {
        if (entry.generatedByRowId === sourceRowId) {
            entry.generatedByRowId = "";
            if (!hasSetupInput(entry) && !entry.wfoWave) {
                entry.workSetup = "";
            }
        }
    });
}

function getEffectiveDate(row) {
    const projectedDate = getProjectedDateForSourceRow(row);
    if (projectedDate) {
        return projectedDate;
    }
    return row.dateValue;
}

function getDisplayWorkSetup(row, employee) {
    const targetOutcome = getOutcomeForTargetRow(employee, row);
    if (targetOutcome?.outcome?.setup) {
        return targetOutcome.outcome.setup;
    }
    return "";
}

function getWorkSetupClass(row, employee) {
    const targetOutcome = getOutcomeForTargetRow(employee, row);
    if (targetOutcome?.outcome?.setup === "WFO") {
        if (row.wfoWave === "Justified" || row.wfoWave === "Change Schedule") {
            return "setup-badge wfo-waived";
        }
        return "setup-badge reflected-wfo";
    }
    if (targetOutcome?.outcome?.setup === "WFH") {
        return "setup-badge";
    }
    return "";
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

function getEmployeeCreditBalance(employee) {
    const weeklyCounts = {};
    const weeklyTarget = getWeeklyCreditTargetNumber();
    if (!weeklyTarget) {
        return 0;
    }
    getFilteredRows(employee).forEach((row) => {
        if (!row.dateValue || row.creditUsed || row.wfoWave === "Use WFH Credit") {
            return;
        }
        const displaySetup = getDisplayWorkSetup(row, employee);
        if (displaySetup === "WFH") {
            const weekKey = `${parseDateValue(row.dateValue).getFullYear()}-${getWeekNumber(row.dateValue)}`;
            weeklyCounts[weekKey] = (weeklyCounts[weekKey] || 0) + 1;
        }
    });

    const earned = Object.values(weeklyCounts).reduce((sum, count) => sum + Math.floor(count / weeklyTarget), 0);
    const used = getFilteredRows(employee).filter((row) => row.creditUsed).length;
    return earned - used;
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
        row.processingTime = value;
    } else if (field === "wfoWave") {
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
            if (value === "Justified") {
                row.workSetup = "WFH";
            } else if (value === "Change Schedule") {
                row.workSetup = "WFO";
            } else if (hasWfoReason(row)) {
                row.workSetup = "WFO";
            } else {
                row.workSetup = "WFH";
            }
        }
    } else if (field === "accuracy") {
        row.accuracy = value;
    } else if (field === "unapprovedLeave") {
        row.unapprovedLeave = value;
        if (["SL", "EL"].includes(value)) {
            row.processingTime = "";
            row.accuracy = "";
        }
    } else if (field === "changeScheduleMonth") {
        row.changeScheduleMonth = value;
    } else if (field === "changeScheduleDate") {
        row.changeScheduleDate = value;
    }

    if (!hasSetupInput(row)) {
        row.workSetup = "";
    } else if (row.wfoWave === "Change Schedule") {
        row.workSetup = "WFO";
    } else if (row.wfoWave === "Justified" || row.wfoWave === "Use WFH Credit") {
        row.workSetup = "WFH";
    } else if (hasWfoReason(row)) {
        row.workSetup = "WFO";
    } else {
        row.workSetup = "WFH";
    }

    if (row.wfoWave !== "Change Schedule") {
        row.changeScheduleMonth = "";
        row.changeScheduleDate = "";
    }

    if (field === "processingTime" || field === "accuracy" || field === "unapprovedLeave") {
        if (!hasSetupInput(row)) {
            row.workSetup = "";
        } else {
            const reasons = getWfoReasons(row);
            row.workSetup = reasons.length ? "WFO" : "WFH";
        }
    }

    if (!hasProjectionDriver(row)) {
        clearProjectedResultFromSource(employee, row.id);
    }

    ensureProjectedResultRow(employee, row);

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
    saveState();
    render();
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
        const existingTargetRow = employee.rows.find((entry) => entry.id !== row.id && entry.dateValue === targetDateValue);
        if (existingTargetRow) {
            if (existingTargetRow.wfoWave === "Change Schedule" || existingTargetRow.workSetup === "WFO") {
                window.alert("This date is already tagged as WFO");
                return;
            }
            existingTargetRow.wfoWave = "";
            existingTargetRow.workSetup = "";
            existingTargetRow.changeScheduleMonth = "";
            existingTargetRow.changeScheduleDate = "";
            existingTargetRow.creditUsed = false;
            existingTargetRow.generatedByRowId = row.id;
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
        }
        row.wfoWave = "Change Schedule";
        row.workSetup = "WFO";
        row.creditUsed = false;
    }

    if (!hasProjectionDriver(row)) {
        clearProjectedResultFromSource(employee, row.id);
    }

    ensureDateSequence(employee);
    ensureProjectedResultRow(employee, row);
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
    render();
}

function addRow() {
    if (!requireLoggedInUser()) {
        return;
    }
    let targetEmployee = state.employees.find((entry) => entry.id === activeTab);
    if (!targetEmployee) {
        if (!state.employees.length) {
            window.alert("Please add an employee first before adding a schedule row.");
            return;
        }
        targetEmployee = state.employees[0];
        activeTab = targetEmployee.id;
    }
    const newRow = createRow(getNextDateValue(targetEmployee));
    targetEmployee.rows.push(newRow);
    if (!ensureDateSequence(targetEmployee)) {
        targetEmployee.rows = targetEmployee.rows.filter((row) => row.id !== newRow.id);
    }
    saveState();
    render();
}

function renderHeader() {
    document.getElementById("headerTitle").textContent = state.headerName;
    const currentUser = getCurrentUser();
    document.getElementById("headerMeta").textContent = currentUser
        ? `Signed in as ${currentUser.username}`
        : "No user logged in";
    document.getElementById("currentUserPill").textContent = currentUser
        ? `User: ${currentUser.username}`
        : "User: none";
    document.getElementById("authShortcutBtn").textContent = currentUser ? "Log Out" : "Log In";
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

    const deletePassword = document.getElementById("deleteAccountPasswordInput").value;
    if (deletePassword !== user.password) {
        setDeleteAccountFeedback("Incorrect password. Account was not deleted.", "error");
        return;
    }

    localStorage.removeItem(getUserStorageKey(user.id));
    localStorage.removeItem(getUserBackupKey(user.id));
    auth.users = auth.users.filter((entry) => entry.id !== user.id);

    if (auth.currentUserId === user.id) {
        auth.currentUserId = "";
        state = cloneState(createDefaultState());
        activeTab = "all";
        activeView = "schedule";
        setActiveView(activeView);
    }

    saveAuthState();
    closeDeleteAccountModal();
    renderAuthUserList();
    clearAuthInputs();
    setAuthFeedback(`Account ${user.username} deleted.`, "success");
    render();
}

function confirmDeleteAccount() {
    if (!pendingDeleteAccountId) {
        return;
    }
    deleteAccount(pendingDeleteAccountId);
}

function renderAuthUserList() {
    const list = document.getElementById("authUserList");
    if (!list) {
        return;
    }

    list.innerHTML = "";
    const currentUser = getCurrentUser();
    if (!auth.users.length) {
        const empty = document.createElement("p");
        empty.className = "help-text";
        empty.textContent = "No registered users yet.";
        list.appendChild(empty);
        return;
    }

    auth.users.forEach((user) => {
        const row = document.createElement("div");
        row.className = "account-row";

        const info = document.createElement("div");
        info.className = "account-info";

        const name = document.createElement("strong");
        name.textContent = user.username;

        const detail = document.createElement("span");
        detail.textContent = currentUser?.id === user.id ? "Currently active" : "Saved locally";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "danger-btn";
        deleteButton.textContent = "Delete Account";
        deleteButton.addEventListener("click", () => openDeleteAccountModal(user.id));

        info.appendChild(name);
        info.appendChild(detail);
        row.appendChild(info);
        row.appendChild(deleteButton);
        list.appendChild(row);
    });
}

function syncAuthUI() {
    const currentUser = getCurrentUser();
    const gate = document.getElementById("authGate");
    const appShell = document.getElementById("appShell");
    const currentUserText = document.getElementById("currentUserText");
    const logOutButton = document.getElementById("logOutBtn");

    gate.classList.toggle("hidden", Boolean(currentUser));
    gate.setAttribute("aria-hidden", currentUser ? "true" : "false");
    appShell.classList.toggle("auth-disabled", !currentUser);

    if (currentUserText) {
        currentUserText.textContent = currentUser
            ? `Active user: ${currentUser.username}`
            : "No user is logged in. Sign up or log in to load a user-specific schedule.";
    }
    if (logOutButton) {
        logOutButton.disabled = !currentUser;
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

    const shouldImportLegacyState = Boolean(pendingMigrationState) && !auth.legacyMigrated && auth.users.length === 0;
    const newUser = {
        id: createId(),
        username,
        usernameKey: normalizeUsername(username),
        password,
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
    closeSettings();
    setActiveView("schedule");
    render();
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
    closeSettings();
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
    closeSettings();
    render();
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
    const monthFilterBtn = document.getElementById("monthFilterBtn");
    const weekFilterBtn = document.getElementById("weekFilterBtn");
    const monthSelectAll = document.getElementById("monthSelectAll");
    const weekSelectAll = document.getElementById("weekSelectAll");
    const monthFilterList = document.getElementById("monthFilterList");
    const weekFilterList = document.getElementById("weekFilterList");
    const chartStyle = document.getElementById("dashboardChartStyle");
    const chartScope = document.getElementById("dashboardChartScope");

    const selectedMonths = Array.isArray(state.selectedMonths) && state.selectedMonths.length
        ? state.selectedMonths.map((value) => Number(value)).filter((value) => value >= 1 && value <= 12)
        : [Number(state.selectedMonth) || 1];
    const availableWeeks = getAvailableWeekValues(Number(state.selectedYear) || 2026, selectedMonths);
    let selectedWeeks = Array.isArray(state.selectedWeeks) && state.selectedWeeks.length
        ? state.selectedWeeks.map((value) => `${value}`)
        : [`${state.selectedWeek || "all"}`];
    if (selectedWeeks.includes("all")) {
        selectedWeeks = ["all"];
    } else {
        selectedWeeks = selectedWeeks.filter((week) => availableWeeks.includes(week));
    }
    if (!selectedWeeks.length && availableWeeks.length) {
        selectedWeeks = ["all"];
        state.selectedWeeks = ["all"];
        state.selectedWeek = "all";
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
        checkbox.checked = selectedWeeks.includes("all") || selectedWeeks.includes(week);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(`Week ${week}`));
        weekFilterList.appendChild(label);
    });

    const allMonthsSelected = selectedMonths.length === 12;
    monthSelectAll.checked = allMonthsSelected;
    monthFilterBtn.textContent = allMonthsSelected
        ? "All Months"
        : `${selectedMonths.length} month(s)`;

    const allWeeksSelected = selectedWeeks.includes("all") || (availableWeeks.length > 0 && selectedWeeks.length === availableWeeks.length);
    weekSelectAll.checked = allWeeksSelected;
    weekSelectAll.disabled = !availableWeeks.length;
    weekFilterBtn.textContent = allWeeksSelected
        ? "All Weeks"
        : `${selectedWeeks.length} week(s)`;
    if (!availableWeeks.length) {
        weekFilterBtn.textContent = "No Weeks";
    }

    chartStyle.value = state.dashboardChartStyle || "pie";
    chartScope.value = state.dashboardChartScope || "overview";
}

function closeFilterMenus() {
    document.getElementById("monthFilterMenu").classList.add("hidden");
    document.getElementById("weekFilterMenu").classList.add("hidden");
}

function renderTabs() {
    const tabs = document.getElementById("tabs");
    tabs.innerHTML = "";

    const allButton = document.createElement("button");
    allButton.className = `tab-btn ${activeTab === "all" ? "active" : ""}`;
    allButton.textContent = "ALL";
    allButton.addEventListener("click", () => {
        activeTab = "all";
        render();
    });
    tabs.appendChild(allButton);

    state.employees.forEach((employee) => {
        const button = document.createElement("button");
        button.className = `tab-btn ${activeTab === employee.id ? "active" : ""}`;
        button.textContent = employee.name;
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
        emptyCell.colSpan = 13;
        emptyCell.textContent = "No rows found for the selected year, month, and week.";
        emptyRow.appendChild(emptyCell);
        body.appendChild(emptyRow);
        return;
    }

    rows.forEach((row) => {
        const employee = state.employees.find((entry) => entry.id === row.employeeId);
        const displaySetup = getDisplayWorkSetup(row, employee);
        const reflectedOutcome = getOutcomeForTargetRow(employee, row);
        const tr = document.createElement("tr");
        if (reflectedOutcome?.outcome?.setup === "WFO") {
            tr.classList.add("row-wfo");
        } else if (row.wfoWave === "Justified") {
            tr.classList.add("row-justified");
        } else if (row.wfoWave === "Change Schedule") {
            tr.classList.add("row-change-schedule");
        } else if (row.wfoWave === "Use WFH Credit") {
            tr.classList.add("row-credit");
        }

        const employeeCell = document.createElement("td");
        const pill = document.createElement("span");
        pill.className = "cell-pill";
        pill.textContent = row.employeeName;
        employeeCell.appendChild(pill);
        tr.appendChild(employeeCell);

        const weekCell = document.createElement("td");
        weekCell.textContent = getWeekLabel(row.dateValue);
        tr.appendChild(weekCell);

        const monthCell = document.createElement("td");
        const monthInput = document.createElement("input");
        monthInput.className = "input-field";
        monthInput.type = "text";
        monthInput.value = getDisplayDate(row.dateValue).month;
        monthInput.addEventListener("change", (event) => {
            updateDateRow(row.employeeId, row.id, event.target.value, getDisplayDate(row.dateValue).date);
        });
        monthCell.appendChild(monthInput);
        tr.appendChild(monthCell);

        const dateCell = document.createElement("td");
        const dateInput = document.createElement("input");
        dateInput.className = "input-field";
        dateInput.type = "number";
        dateInput.min = "1";
        dateInput.max = "31";
        dateInput.value = getDisplayDate(row.dateValue).date;
        dateInput.addEventListener("change", (event) => {
            updateDateRow(row.employeeId, row.id, getDisplayDate(row.dateValue).month, event.target.value);
        });
        dateCell.appendChild(dateInput);
        tr.appendChild(dateCell);

        const dayCell = document.createElement("td");
        dayCell.textContent = getDisplayDate(row.dateValue).day;
        tr.appendChild(dayCell);

        const processingCell = document.createElement("td");
        const processingInput = document.createElement("input");
        processingInput.className = "input-field";
        processingInput.type = "text";
        processingInput.placeholder = "HH:MM:SS";
        processingInput.value = row.processingTime;
        processingInput.disabled = ["SL", "EL"].includes((row.unapprovedLeave || "").trim());
        processingInput.addEventListener("change", (event) => {
            updateRow(row.employeeId, row.id, "processingTime", event.target.value);
        });
        processingCell.appendChild(processingInput);
        tr.appendChild(processingCell);

        const wfoWaveCell = document.createElement("td");
        const wfoWaveSelect = document.createElement("select");
        wfoWaveSelect.className = "select-field";
        ["", "Justified", "Change Schedule", "Use WFH Credit"].forEach((optionValue) => {
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

        const workSetupCell = document.createElement("td");
        const workSetupBadge = document.createElement("span");
        workSetupBadge.className = getWorkSetupClass(row, employee);
        workSetupBadge.textContent = displaySetup;
        workSetupCell.appendChild(workSetupBadge);
        tr.appendChild(workSetupCell);

        const accuracyCell = document.createElement("td");
        const accuracySelect = document.createElement("select");
        accuracySelect.className = "select-field";
        accuracySelect.disabled = ["SL", "EL"].includes((row.unapprovedLeave || "").trim());
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
        ["", "N/A", "SL", "EL"].forEach((optionValue) => {
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

        const changeMonthCell = document.createElement("td");
        const changeMonthInput = document.createElement("input");
        changeMonthInput.className = "input-field";
        changeMonthInput.type = "text";
        changeMonthInput.placeholder = "";
        changeMonthInput.value = row.changeScheduleMonth;
        changeMonthInput.disabled = row.wfoWave !== "Change Schedule";
        changeMonthCell.appendChild(changeMonthInput);
        tr.appendChild(changeMonthCell);

        const changeDateCell = document.createElement("td");
        const changeDateInput = document.createElement("input");
        changeDateInput.className = "input-field";
        changeDateInput.type = "text";
        changeDateInput.placeholder = "";
        changeDateInput.value = row.changeScheduleDate;
        changeDateInput.disabled = row.wfoWave !== "Change Schedule";
        changeDateCell.appendChild(changeDateInput);
        tr.appendChild(changeDateCell);

        changeMonthInput.addEventListener("change", () => {
            applyChangeScheduleUpdate(row.employeeId, row.id, changeMonthInput.value, changeDateInput.value);
        });
        changeDateInput.addEventListener("change", () => {
            applyChangeScheduleUpdate(row.employeeId, row.id, changeMonthInput.value, changeDateInput.value);
        });

        const actionsCell = document.createElement("td");
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
    return [
        { label: "Off Target", value: hasTargetProcessingTime() ? rows.filter((row) => parseDurationToSeconds(row.processingTime) > parseDurationToSeconds(state.targetProcessingTime)).length : 0, color: "#dc2626" },
        { label: "With Error", value: rows.filter((row) => row.accuracy === "With Error").length, color: "#f59e0b" },
        { label: "Unapproved Leave", value: rows.filter((row) => ["SL", "EL"].includes((row.unapprovedLeave || "").trim())).length, color: "#ef4444" },
        {
            label: "WFO", value: rows.filter((row) => {
                const employee = state.employees.find((entry) => entry.id === row.employeeId);
                return getDisplayWorkSetup(row, employee) === "WFO";
            }).length, color: "#2563eb"
        },
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

function createChartMarkup(series, chartStyle) {
    const total = Math.max(1, series.reduce((sum, entry) => sum + entry.value, 0));
    if (chartStyle === "bar") {
        const maxValue = Math.max(...series.map((entry) => entry.value), 1);
        return `<svg class="chart-svg" viewBox="0 0 380 220" role="img" aria-label="Bar graph">${series.map((entry, index) => {
            const height = (entry.value / maxValue) * 140;
            const x = 30 + index * 70;
            const y = 190 - height;
            return `<g><rect x="${x}" y="${y}" width="40" height="${height}" fill="${entry.color}" rx="8"></rect><text x="${x + 20}" y="205" text-anchor="middle" font-size="11" fill="#172033">${entry.label}</text><text x="${x + 20}" y="${y - 8}" text-anchor="middle" font-size="11" fill="#172033">${entry.value}</text></g>`;
        }).join("")}</svg>`;
    }

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const slices = series.map((entry) => {
        const segment = (entry.value / total) * circumference;
        const dash = `${segment} ${circumference - segment}`;
        return `<circle cx="110" cy="110" r="${radius}" fill="none" stroke="${entry.color}" stroke-width="34" stroke-dasharray="${dash}" stroke-dashoffset="-${offset}" transform="rotate(-90 110 110)"></circle>`;
    });
    return `<svg class="chart-svg" viewBox="0 0 250 220" role="img" aria-label="Pie chart"><circle cx="110" cy="110" r="70" fill="none" stroke="#e5e7eb" stroke-width="34"></circle>${slices.join("")}<text x="110" y="106" text-anchor="middle" font-size="16" font-weight="700" fill="#172033">${total}</text><text x="110" y="126" text-anchor="middle" font-size="12" fill="#61708a">entries</text></svg>`;
}

function createLegendMarkup(series) {
    return `<div class="chart-legend">${series.map((entry) => `<span class="legend-item"><span class="legend-swatch" style="background:${entry.color}"></span>${entry.label}</span>`).join("")}</div>`;
}

function renderSummary() {
    const content = document.getElementById("summaryContent");
    const rows = getAllRows().filter((row) => {
        const employee = state.employees.find((entry) => entry.id === row.employeeId);
        const isWaivedByWave = row.wfoWave === "Justified" || row.wfoWave === "Change Schedule";
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
        const list = document.createElement("ul");
        employeeRows.forEach((row) => {
            const item = document.createElement("li");
            const employee = state.employees.find((entry) => entry.id === row.employeeId);
            const dateText = `${getDisplayDate(row.dateValue).month} ${getDisplayDate(row.dateValue).date}`;
            const reasons = getOutcomeForTargetRow(employee, row)?.outcome?.reasons || [];
            item.textContent = `${dateText} — ${reasons.join(", ") || "WFO"}`;
            list.appendChild(item);
        });
        card.appendChild(list);
        fragment.appendChild(card);
    });
    content.appendChild(fragment);
}

function renderCredits() {
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
    const flaggedRows = rows.filter((row) => {
        const employee = state.employees.find((entry) => entry.id === row.employeeId);
        return getDisplayWorkSetup(row, employee) === "WFO";
    });
    const series = state.dashboardChartScope === "contributors" ? buildContributorSeries(flaggedRows) : buildOverviewSeries(rows);
    const chartStyle = state.dashboardChartStyle || "pie";
    content.innerHTML = "";

    const cards = document.createElement("div");
    cards.className = "dashboard-grid";
    const card = document.createElement("div");
    card.className = "dashboard-card";
    card.innerHTML = `<h3>${state.dashboardChartScope === "contributors" ? "Employee Contributors" : "Flagged Overview"}</h3>${createChartMarkup(series, chartStyle)}${createLegendMarkup(series)}`;
    cards.appendChild(card);

    const detailCard = document.createElement("div");
    detailCard.className = "dashboard-card";
    const detailTitle = document.createElement("h3");
    detailTitle.textContent = "Flagged Entries";
    detailCard.appendChild(detailTitle);
    const list = document.createElement("ul");
    flaggedRows.forEach((row) => {
        const item = document.createElement("li");
        const employee = state.employees.find((entry) => entry.id === row.employeeId);
        const reasons = getOutcomeForTargetRow(employee, row)?.outcome?.reasons || [];
        item.textContent = `${row.employeeName} — ${getDisplayDate(row.dateValue).month} ${getDisplayDate(row.dateValue).date}: ${reasons.join(", ") || "WFO"}`;
        list.appendChild(item);
    });
    detailCard.appendChild(list);
    cards.appendChild(detailCard);
    content.appendChild(cards);
}

function renderTrash() {
    const content = document.getElementById("trashContent");
    if (!content) {
        return;
    }
    content.innerHTML = "";

    const rows = state.deleted?.rows || [];
    const employees = state.deleted?.employees || [];
    if (!rows.length && !employees.length) {
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
}

function setActiveView(view) {
    activeView = view;
    document.querySelectorAll(".view-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `${view}View`));
    document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    document.getElementById("sideNav").classList.remove("open");
    document.getElementById("menuBtn").classList.remove("open");
}

function openSettings(options = {}) {
    const modal = document.getElementById("settingsModal");
    const headerInput = document.getElementById("headerNameInput");
    const targetInput = document.getElementById("targetProcessingTimeInput");
    const weeklyTargetInput = document.getElementById("weeklyWfhCreditTargetInput");
    const accentInput = document.getElementById("accentColorInput");
    const backgroundInput = document.getElementById("backgroundColorInput");
    const surfaceInput = document.getElementById("surfaceColorInput");
    const textInput = document.getElementById("textColorInput");
    const employeeList = document.getElementById("employeeSettingsList");

    headerInput.value = state.headerName;
    targetInput.value = typeof state.targetProcessingTime === "string" ? state.targetProcessingTime : "";
    weeklyTargetInput.value = typeof state.weeklyWfhCreditTarget === "string" ? state.weeklyWfhCreditTarget : "";
    accentInput.value = state.theme.accent;
    backgroundInput.value = state.theme.background;
    surfaceInput.value = state.theme.surface;
    textInput.value = state.theme.text;
    employeeList.innerHTML = "";
    renderAuthUserList();
    setAuthFeedback("Create or access a user account stored locally in this browser.");

    state.employees.forEach((employee) => {
        const row = document.createElement("div");
        row.className = "settings-row";
        const input = document.createElement("input");
        input.className = "input-field";
        input.type = "text";
        input.value = employee.name;
        input.dataset.employeeId = employee.id;
        input.addEventListener("input", (event) => {
            const targetEmployee = state.employees.find((entry) => entry.id === employee.id);
            if (targetEmployee) {
                targetEmployee.name = event.target.value.trim() || "Unnamed Employee";
                renderTabs();
            }
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "icon-btn";
        deleteButton.textContent = "Remove";
        deleteButton.addEventListener("click", () => {
            deleteEmployee(employee.id);
            openSettings();
        });

        row.appendChild(input);
        row.appendChild(deleteButton);
        employeeList.appendChild(row);
    });

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    syncAuthUI();
    if (options.focusAuth) {
        document.getElementById("authUsernameInput").focus();
    }
}

function closeSettings() {
    document.getElementById("settingsModal").classList.add("hidden");
    document.getElementById("settingsModal").setAttribute("aria-hidden", "true");
}

function saveSettings() {
    if (!requireLoggedInUser()) {
        return;
    }
    const headerInput = document.getElementById("headerNameInput");
    const targetInput = document.getElementById("targetProcessingTimeInput");
    const weeklyTargetInput = document.getElementById("weeklyWfhCreditTargetInput");
    const accentInput = document.getElementById("accentColorInput");
    const backgroundInput = document.getElementById("backgroundColorInput");
    const surfaceInput = document.getElementById("surfaceColorInput");
    const textInput = document.getElementById("textColorInput");
    const nameInputs = Array.from(document.querySelectorAll("#employeeSettingsList .settings-row input"));

    state.headerName = headerInput.value.trim() || "Work Setup Schedule";
    state.targetProcessingTime = targetInput.value.trim();
    state.weeklyWfhCreditTarget = weeklyTargetInput.value.trim();
    state.theme.accent = accentInput.value;
    state.theme.background = backgroundInput.value;
    state.theme.surface = surfaceInput.value;
    state.theme.text = textInput.value;

    nameInputs.forEach((input, index) => {
        const targetEmployee = state.employees.find((entry) => entry.id === input.dataset.employeeId);
        if (targetEmployee) {
            targetEmployee.name = input.value.trim() || `Employee ${index + 1}`;
        }
    });

    saveState();
    applyTheme();
    render();
    closeSettings();
}

function hardResetAllData() {
    const confirmed = window.confirm("Are you sure you want to Reset all information?");
    if (!confirmed) {
        return;
    }

    auth.users.forEach((user) => {
        localStorage.removeItem(getUserStorageKey(user.id));
        localStorage.removeItem(getUserBackupKey(user.id));
    });
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    auth = cloneState(createDefaultAuthState());
    pendingMigrationState = null;
    state = cloneState(createDefaultState());
    activeTab = "all";
    activeView = "schedule";
    setActiveView(activeView);
    applyTheme();
    render();
    closeSettings();
}

function addEmployee() {
    if (!requireLoggedInUser()) {
        return;
    }
    const newEmployee = {
        id: createId(),
        name: `Employee ${state.employees.length + 1}`,
        rows: [],
    };
    state.employees.push(newEmployee);
    activeTab = newEmployee.id;
    saveState();
    openSettings();
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
                rows.push({ employee: employee.name, ...row });
            }
        });
    });
    return rows;
}

function downloadReport() {
    const rows = buildReportRows();
    if (!rows.length) {
        window.alert("No data to export.");
        return;
    }
    const header = ["Employee", "Date", "Week", "Month", "Day", "Processing Time", "WFO Wave", "Work Setup", "Accuracy", "Unapproved Leave", "Change Schedule Month", "Change Schedule Date"];
    const csvRows = [header.join(",")];
    rows.forEach((row) => {
        const values = [
            row.employee,
            row.dateValue,
            getWeekLabel(row.dateValue),
            getDisplayDate(row.dateValue).month,
            getDisplayDate(row.dateValue).day,
            row.processingTime,
            row.wfoWave,
            getDisplayWorkSetup(row),
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
        if (getCurrentUser()) {
            logOutUser();
            return;
        }
        openSettings({ focusAuth: true });
    });
    document.getElementById("openAccessSettingsBtn").addEventListener("click", () => openSettings({ focusAuth: true }));
    document.getElementById("addRowBtn").addEventListener("click", addRow);
    document.getElementById("sequenceDatesBtn").addEventListener("click", sequenceCurrentMonthDates);
    document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings);
    document.getElementById("cancelSettingsBtn").addEventListener("click", closeSettings);
    document.getElementById("addEmployeeBtn").addEventListener("click", addEmployee);
    document.getElementById("signUpBtn").addEventListener("click", signUpUser);
    document.getElementById("logInBtn").addEventListener("click", logInUser);
    document.getElementById("logOutBtn").addEventListener("click", logOutUser);
    document.getElementById("confirmDeleteAccountBtn").addEventListener("click", confirmDeleteAccount);
    document.getElementById("cancelDeleteAccountBtn").addEventListener("click", closeDeleteAccountModal);
    document.getElementById("hardResetBtn").addEventListener("click", hardResetAllData);
    document.getElementById("restoreDefaultsBtn").addEventListener("click", restoreDefaultTheme);
    document.getElementById("viewScopeBtn").addEventListener("click", openScopeGuide);
    document.getElementById("closeScopeBtn").addEventListener("click", closeScopeGuide);

    document.getElementById("settingsModal").addEventListener("click", () => {
        // Keep settings open when clicking outside; close only via Save or Cancel.
    });
    document.getElementById("deleteAccountModal").addEventListener("click", (event) => {
        if (event.target.id === "deleteAccountModal") {
            closeDeleteAccountModal();
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
    document.getElementById("selectAllEmployees").addEventListener("change", (event) => {
        document.querySelectorAll("#reportEmployeeList input").forEach((checkbox) => {
            checkbox.checked = event.target.checked;
        });
    });

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
            setActiveView(button.dataset.view);
        });
    });

    document.getElementById("yearFilter").addEventListener("change", (event) => {
        state.selectedYear = Number(event.target.value);
        saveState();
        render();
    });

    document.getElementById("monthFilterBtn").addEventListener("click", (event) => {
        event.stopPropagation();
        const monthMenu = document.getElementById("monthFilterMenu");
        const weekMenu = document.getElementById("weekFilterMenu");
        weekMenu.classList.add("hidden");
        monthMenu.classList.toggle("hidden");
    });

    document.getElementById("weekFilterBtn").addEventListener("click", (event) => {
        event.stopPropagation();
        const monthMenu = document.getElementById("monthFilterMenu");
        const weekMenu = document.getElementById("weekFilterMenu");
        monthMenu.classList.add("hidden");
        weekMenu.classList.toggle("hidden");
    });

    document.getElementById("monthFilterMenu").addEventListener("click", (event) => {
        event.stopPropagation();
    });
    document.getElementById("weekFilterMenu").addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.getElementById("monthSelectAll").addEventListener("change", (event) => {
        state.selectedMonths = event.target.checked ? monthNames.map((_, index) => index + 1) : [];
        if (state.selectedMonths.length) {
            state.selectedMonth = state.selectedMonths[0];
        }
        saveState();
        render();
    });

    document.getElementById("weekSelectAll").addEventListener("change", (event) => {
        const availableWeeks = getAvailableWeekValues(Number(state.selectedYear) || 2026, state.selectedMonths || [state.selectedMonth]);
        state.selectedWeeks = event.target.checked && availableWeeks.length ? ["all"] : [];
        state.selectedWeek = state.selectedWeeks[0] || "all";
        saveState();
        render();
    });

    document.getElementById("monthFilterList").addEventListener("change", () => {
        const selectedMonths = Array.from(document.querySelectorAll("#monthFilterList input:checked")).map((input) => Number(input.value));
        state.selectedMonths = selectedMonths;
        if (selectedMonths.length) {
            state.selectedMonth = selectedMonths[0];
        }
        saveState();
        render();
    });

    document.getElementById("weekFilterList").addEventListener("change", () => {
        const selectedWeeks = Array.from(document.querySelectorAll("#weekFilterList input:checked")).map((input) => `${input.value}`);
        const availableWeeks = getAvailableWeekValues(Number(state.selectedYear) || 2026, state.selectedMonths || [state.selectedMonth]);
        state.selectedWeeks = availableWeeks.length && selectedWeeks.length === availableWeeks.length ? ["all"] : selectedWeeks;
        state.selectedWeek = state.selectedWeeks[0] || "all";
        saveState();
        render();
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
