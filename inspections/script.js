// DOM Elements - Common
const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
const portsThemeToggleCheckbox = document.getElementById('ports-theme-toggle-checkbox');
const pendingModal = document.getElementById('pending-modal');
const closeModalBtn = document.getElementById('close-modal');
const pendingTbody = document.getElementById('pending-tbody');
const modalTitle = document.getElementById('modal-title');
const columnHeader = document.getElementById('column-header');

// Navigation elements
const panamaTab = document.getElementById('panama-tab');
const portsTab = document.getElementById('ports-tab');
const panamaPage = document.getElementById('panama-page');
const portsPage = document.getElementById('ports-page');

// Application state
let activePage = 'panama'; 
let pendingInspections = [];
let pendingDepartures = [];
let blinkState = false;
let isLargeScreen = false;

// Status tracking
let inspectionStatuses = {};
let portStatuses = {};

// Status constants
const INSPECTION_STATUSES = {
    NONE: 'none',
    UWI_ONGOING: 'uwi-ongoing',
    UWI_DONE: 'uwi-done',
    K9_ONGOING: 'k9-ongoing',
    K9_DONE: 'k9-done'
};

// Page configurations
const PAGE_CONFIG = {
    'panama': {
        textAreas: {
            first: { 
                element: () => document.getElementById('k9-textarea'),
                highlightDiv: () => document.getElementById('k9-highlight'),
                clearBtn: () => document.getElementById('k9-clear-btn'),
                copyBtn: () => document.getElementById('k9-copy-btn'),
                storageKey: 'k9Text'
            },
            second: {
                element: () => document.getElementById('uw-textarea'), 
                highlightDiv: () => document.getElementById('uw-highlight'),
                clearBtn: () => document.getElementById('uw-clear-btn'),
                copyBtn: () => document.getElementById('uw-copy-btn'),
                storageKey: 'uwText'
            }
        },
        timeDisplay: () => document.getElementById('panama-time'),
        checkBtn: () => document.getElementById('panama-check-btn'),
        pendingBtn: () => document.getElementById('panama-pending-btn'),
        pendingPanel: () => document.getElementById('panama-pending-panel'),
        pendingTbodyInline: () => document.getElementById('panama-pending-tbody-inline'),
        items: () => pendingInspections,
        itemsType: 'inspections',
        timeZoneOffset: -5,
        statusesStorageKey: 'inspectionStatuses',
        statusObject: inspectionStatuses,
        parseFunction: parseInspectionETDDates
    },
    'ports': {
        textAreas: {
            first: {
                element: () => document.getElementById('brazil-textarea'),
                highlightDiv: () => document.getElementById('brazil-highlight'),
                clearBtn: () => document.getElementById('brazil-clear-btn'),
                copyBtn: () => document.getElementById('brazil-copy-btn'),
                storageKey: 'brazilText',
                country: 'Brazil'
            },
            second: {
                element: () => document.getElementById('mexico-textarea'),
                highlightDiv: () => document.getElementById('mexico-highlight'),
                clearBtn: () => document.getElementById('mexico-clear-btn'),
                copyBtn: () => document.getElementById('mexico-copy-btn'),
                storageKey: 'mexicoText',
                country: 'Mexico'
            }
        },
        timeDisplays: {
            'Brazil': () => document.getElementById('brazil-time'),
            'Mexico': () => document.getElementById('mexico-time')
        },
        checkBtn: () => document.getElementById('ports-check-btn'),
        pendingBtn: () => document.getElementById('ports-pending-btn'),
        pendingPanel: () => document.getElementById('ports-pending-panel'),
        pendingTbodyInline: () => document.getElementById('ports-pending-tbody-inline'),
        items: () => pendingDepartures,
        itemsType: 'departures',
        timeZoneOffsets: { 'Brazil': -3, 'Mexico': -6 },
        statusesStorageKey: 'portStatuses',
        statusObject: portStatuses,
        parseFunction: parsePortETDDates
    }
};

// Initialize the application
function initApp() {
    const savedPage = localStorage.getItem('activePage');
    if (savedPage) {
        activePage = savedPage;
        updateActivePage();
    }
    setupThemeToggle();
    checkScreenSize();
    setupNavigation();
    loadSavedData();
    setupEventListeners();
    startTimers();
    setupScrollSync();
    updatePendingItems();
}

function setupNavigation() {
    panamaTab.addEventListener('click', () => setActivePage('panama'));
    portsTab.addEventListener('click', () => setActivePage('ports'));
}

function setActivePage(page) {
    activePage = page;
    localStorage.setItem('activePage', page);
    updateActivePage();
    updatePendingItems();
}

function updateActivePage() {
    if (activePage === 'panama') {
        panamaTab.classList.add('active');
        portsTab.classList.remove('active');
        panamaPage.classList.add('active');
        portsPage.classList.remove('active');
    } else if (activePage === 'ports') {
        panamaTab.classList.remove('active');
        portsTab.classList.add('active');
        panamaPage.classList.remove('active');
        portsPage.classList.add('active');
    }
}

function checkScreenSize() {
    isLargeScreen = window.innerWidth > 1200;
    ['panama', 'ports'].forEach(page => {
        const panel = PAGE_CONFIG[page].pendingPanel();
        if (panel) {
            panel.style.display = isLargeScreen ? 'flex' : 'none';
        }
    });
}

function setupEventListeners() {
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', togglePendingModal);
    }
    window.addEventListener('click', (e) => {
        if (pendingModal && e.target === pendingModal) {
            togglePendingModal();
        }
    });
    setupPageEventListeners('panama');
    setupPageEventListeners('ports');
    window.addEventListener('resize', () => {
        checkScreenSize();
        updatePendingTableDisplay();
    });
    document.addEventListener('click', handleContextMenuClick);
}

function setupPageEventListeners(page) {
    const config = PAGE_CONFIG[page];
    Object.entries(config.textAreas).forEach(([key, textAreaConfig]) => {
        const textArea = textAreaConfig.element();
        if (textArea) {
            textArea.addEventListener('input', () => {
                page === 'panama' ? updatePendingInspections() : updatePendingDepartures();
                saveData();
            });
            textArea.addEventListener('keydown', handleTabKey);
        }
        const clearBtn = textAreaConfig.clearBtn();
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const textArea = textAreaConfig.element();
                const highlightDiv = textAreaConfig.highlightDiv();
                if (textArea) textArea.value = '';
                if (highlightDiv) highlightDiv.innerHTML = '';
                saveData();
            });
        }
        const copyBtn = textAreaConfig.copyBtn();
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const textArea = textAreaConfig.element();
                if (textArea) copyToClipboard(textArea.value);
            });
        }
    });
    const checkBtn = config.checkBtn();
    if (checkBtn) {
        checkBtn.addEventListener('click', () => {
            compareTextAreas(page);
        });
    }
    const pendingBtn = config.pendingBtn();
    if (pendingBtn) {
        pendingBtn.addEventListener('click', () => {
            if (!isLargeScreen) {
                togglePendingModal(page);
            }
        });
    }
}

function setupScrollSync() {
    Object.entries(PAGE_CONFIG).forEach(([page, config]) => {
        Object.values(config.textAreas).forEach(textAreaConfig => {
            const textArea = textAreaConfig.element();
            const highlightDiv = textAreaConfig.highlightDiv();
            if (textArea && highlightDiv) {
                syncScroll(textArea, highlightDiv);
            }
        });
    });
}

function formatTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}:${seconds}`;
}

function updateTimeForLocation(element, offset) {
    if (!element) return;
    const now = new Date();
    const utcTimeMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTimeMs + (3600000 * offset));
    element.textContent = formatTime(targetTime);
}

function updateAllTimes() {
    updateTimeForLocation(PAGE_CONFIG.panama.timeDisplay(), PAGE_CONFIG.panama.timeZoneOffset);
    updateTimeForLocation(PAGE_CONFIG.ports.timeDisplays.Brazil(), PAGE_CONFIG.ports.timeZoneOffsets.Brazil);
    updateTimeForLocation(PAGE_CONFIG.ports.timeDisplays.Mexico(), PAGE_CONFIG.ports.timeZoneOffsets.Mexico);
}

function updatePendingItems() {
    if (activePage === 'panama') {
        updatePendingInspections();
    } else if (activePage === 'ports') {
        updatePendingDepartures();
    }
}

function startTimers() {
    setInterval(updateAllTimes, 1000);
    updateAllTimes();
    setInterval(updatePendingItems, 10000);
    setInterval(() => {
        blinkState = !blinkState;
        updatePendingTableDisplay();
    }, 1000);
}

function handleTabKey(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 1;
    }
}

function compareTextAreas(page) {
    const config = PAGE_CONFIG[page];
    const firstTextArea = config.textAreas.first.element();
    const secondTextArea = config.textAreas.second.element();
    const firstHighlightDiv = config.textAreas.first.highlightDiv();
    const secondHighlightDiv = config.textAreas.second.highlightDiv();
    if (!firstTextArea || !secondTextArea || !firstHighlightDiv || !secondHighlightDiv) return;
    const firstLines = firstTextArea.value.split('\n');
    const secondLines = secondTextArea.value.split('\n');
    const matchedFirstLines = new Set();
    const matchedSecondLines = new Set();
    for (let i = 0; i < firstLines.length; i++) {
        for (let j = 0; j < secondLines.length; j++) {
            if (!matchedSecondLines.has(j) && firstLines[i] === secondLines[j] && firstLines[i].trim() !== '') {
                matchedFirstLines.add(i);
                matchedSecondLines.add(j);
                break;
            }
        }
    }
    let firstHtml = '';
    let secondHtml = '';
    firstLines.forEach((line, index) => {
        const isMatch = matchedFirstLines.has(index);
        const highlightClass = !isMatch && line.trim() !== '' ? 'highlight-diff' : '';
        firstHtml += `<div class="highlight-line ${highlightClass}">${escapeHtml(line) || '&nbsp;'}</div>`;
    });
    secondLines.forEach((line, index) => {
        const isMatch = matchedSecondLines.has(index);
        const highlightClass = !isMatch && line.trim() !== '' ? 'highlight-diff' : '';
        secondHtml += `<div class="highlight-line ${highlightClass}">${escapeHtml(line) || '&nbsp;'}</div>`;
    });
    firstHighlightDiv.innerHTML = firstHtml;
    secondHighlightDiv.innerHTML = secondHtml;
    firstHighlightDiv.scrollTop = firstTextArea.scrollTop;
    firstHighlightDiv.scrollLeft = firstTextArea.scrollLeft;
    secondHighlightDiv.scrollTop = secondTextArea.scrollTop;
    secondHighlightDiv.scrollLeft = secondTextArea.scrollLeft;
    syncScrollAfterCompare(page);
}

function syncScroll(textArea, highlightDiv) {
    textArea.addEventListener('scroll', () => {
        highlightDiv.scrollTop = textArea.scrollTop;
        highlightDiv.scrollLeft = textArea.scrollLeft;
    });
}

function syncScrollAfterCompare(page) {
    setTimeout(() => {
        const config = PAGE_CONFIG[page];
        const firstTextArea = config.textAreas.first.element();
        const secondTextArea = config.textAreas.second.element();
        const firstHighlightDiv = config.textAreas.first.highlightDiv();
        const secondHighlightDiv = config.textAreas.second.highlightDiv();
        if (firstHighlightDiv && firstTextArea) {
            firstHighlightDiv.scrollTop = firstTextArea.scrollTop;
            firstHighlightDiv.scrollLeft = firstTextArea.scrollLeft;
        }
        if (secondHighlightDiv && secondTextArea) {
            secondHighlightDiv.scrollTop = secondTextArea.scrollTop;
            secondHighlightDiv.scrollLeft = secondTextArea.scrollLeft;
        }
    }, 50);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function parseInspectionETDDates(text) {
    const results = [];
    const lines = text.split('\n');
    const regex = /ETD\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})/;
    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            const dateString = match[1];
            const [datePart, timePart] = dateString.split(' ');
            const [day, month] = datePart.split('/');
            const [hours, minutes] = timePart.split(':');
            const currentDate = new Date();
            let year = currentDate.getFullYear();
            if (currentDate.getMonth() + 1 === 12 && parseInt(month) === 1) year++;
            const date = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
            results.push({ description: line, etdDate: date });
        }
    }
    return results;
}

function parsePortETDDates(text, country) {
    const results = [];
    const lines = text.split('\n');
    const regex = /ETD\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})(?:\(|$|\s)/;
    const offsetMap = { 'Brazil': -3, 'Mexico': -6 };
    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            const dateString = match[1];
            const [datePart, timePart] = dateString.split(' ');
            const [day, month] = datePart.split('/');
            const [hours, minutes] = timePart.split(':');
            const currentDate = new Date();
            let year = currentDate.getFullYear();
            if (currentDate.getMonth() + 1 === 12 && parseInt(month) === 1) year++;
            const utcDate = new Date(Date.UTC(year, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes)));
            const offset = offsetMap[country] || 0;
            const localDate = new Date(utcDate.getTime() - offset * 60 * 60 * 1000);
            results.push({ description: line, etdDate: localDate, country: country });
        }
    }
    return results;
}

function updatePendingInspections() {
    const k9TextArea = PAGE_CONFIG.panama.textAreas.first.element();
    const uwTextArea = PAGE_CONFIG.panama.textAreas.second.element();
    if (!k9TextArea || !uwTextArea) return;
    const k9Inspections = parseInspectionETDDates(k9TextArea.value);
    const uwInspections = parseInspectionETDDates(uwTextArea.value);
    const allInspections = [...k9Inspections, ...uwInspections];
    const uniqueMap = new Map();
    allInspections.forEach(inspection => uniqueMap.set(inspection.description, inspection));
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const currentPanamaTime = new Date(utcTime + (3600000 * -5));
    pendingInspections = Array.from(uniqueMap.values()).map(inspection => {
        const diffInMillis = inspection.etdDate.getTime() - currentPanamaTime.getTime();
        const hoursUntil = diffInMillis / (1000 * 60 * 60);
        const inspectionId = generateId(inspection.description);
        return {
            ...inspection, id: inspectionId, hoursUntil,
            isUpcoming: hoursUntil < 24 && hoursUntil > 0,
            isPriority: hoursUntil < 6 && hoursUntil > 0,
            isUrgent: hoursUntil < 2 && hoursUntil > 0,
            status: inspectionStatuses[inspectionId] || INSPECTION_STATUSES.NONE
        };
    });
    pendingInspections.sort((a, b) => a.etdDate - b.etdDate);
    if (activePage === 'panama') {
        updatePendingTableDisplay();
        const pendingBtn = PAGE_CONFIG.panama.pendingBtn();
        if (pendingBtn) {
            pendingBtn.innerHTML = pendingInspections.some(item => item.isUrgent) ? 'Pending <span style="color: red;">⚠</span>' : 'Pending';
        }
    }
}

function updatePendingDepartures() {
    const brazilTextArea = PAGE_CONFIG.ports.textAreas.first.element();
    const mexicoTextArea = PAGE_CONFIG.ports.textAreas.second.element();
    if (!brazilTextArea || !mexicoTextArea) return;
    const brazilDepartures = parsePortETDDates(brazilTextArea.value, 'Brazil');
    const mexicoDepartures = parsePortETDDates(mexicoTextArea.value, 'Mexico');
    const allDepartures = [...brazilDepartures, ...mexicoDepartures];
    const now = new Date();
    pendingDepartures = allDepartures.map(departure => {
        const diffInMillis = departure.etdDate.getTime() - now.getTime();
        const hoursUntil = diffInMillis / (1000 * 60 * 60);
        const departureId = generateId(departure.description);
        return {
            ...departure, id: departureId, hoursUntil,
            isUpcoming: hoursUntil < 24 && hoursUntil > 0,
            isPriority: hoursUntil < 6 && hoursUntil > 0,
            isUrgent: hoursUntil < 2 && hoursUntil > 0,
            status: portStatuses[departureId] || INSPECTION_STATUSES.NONE
        };
    });
    pendingDepartures.sort((a, b) => a.etdDate - b.etdDate);
    if (activePage === 'ports') {
        updatePendingTableDisplay();
        const pendingBtn = PAGE_CONFIG.ports.pendingBtn();
        if (pendingBtn) {
            pendingBtn.innerHTML = pendingDepartures.some(item => item.isUrgent) ? 'Pending <span style="color: red;">⚠</span>' : 'Pending';
        }
    }
}

function generateId(description) {
    return description.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function updatePendingTableDisplay() {
    const config = PAGE_CONFIG[activePage];
    if (!config) return;
    const modalTbody = pendingTbody;
    const inlineTbody = config.pendingTbodyInline();
    if (modalTitle) modalTitle.textContent = activePage === 'panama' ? 'U/W & K9 Countdown' : 'Ports Countdown';
    if (columnHeader) columnHeader.textContent = activePage === 'panama' ? 'Inspection Priorities' : 'Port Priorities';
    if (modalTbody) updateTableBody(modalTbody);
    if (inlineTbody) updateTableBody(inlineTbody);
}

function updateTableBody(tableBody) {
    tableBody.innerHTML = '';
    const config = PAGE_CONFIG[activePage];
    const items = config.items();
    if (items.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3;
        cell.textContent = `No pending ${config.itemsType}`;
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }
    items.forEach(item => {
        const row = document.createElement('tr');
        if (activePage === 'panama') row.dataset.inspectionId = item.id;
        else row.dataset.departureId = item.id;
        
        if (item.hoursUntil <= 0) row.classList.add('overdue-row');
        else if (item.isUrgent) {
            row.classList.add('urgent-row');
            if (blinkState) row.classList.add('urgent-blink');
            else row.style.opacity = '0.5';
        } else if (item.isPriority) {
            row.classList.add('priority-row');
            if (blinkState) row.classList.add('urgent-blink');
            else row.style.opacity = '0.5';
        } else if (item.isUpcoming) row.classList.add('upcoming-row');
        
        const descCell = document.createElement('td');
        descCell.style.fontFamily = 'monospace';
        descCell.style.whiteSpace = 'nowrap';
        if (activePage === 'ports' && item.country) {
            const countrySpan = document.createElement('span');
            countrySpan.setAttribute('data-country', item.country);
            countrySpan.textContent = `[${item.country}] `;
            descCell.appendChild(countrySpan);
        }
        
        // --- APPLY MARINETRAFFIC LINK LOGIC HERE ---
        descCell.innerHTML += formatVesselNameWithLink(item.description);
        row.appendChild(descCell);
        
        const timeCell = document.createElement('td');
        timeCell.style.textAlign = 'center';
        timeCell.style.whiteSpace = 'nowrap';
        timeCell.textContent = formatTimeLeft(item.hoursUntil);
        row.appendChild(timeCell);
        
        const statusCell = document.createElement('td');
        statusCell.style.textAlign = 'center';
        statusCell.classList.add('status-cell');
        updateStatusIndicator(statusCell, item.status);
        row.appendChild(statusCell);
        
        row.addEventListener('contextmenu', handleRowContextMenu);
        tableBody.appendChild(row);
    });
}

function updateStatusIndicator(cell, status) {
    cell.innerHTML = '';
    cell.className = 'status-cell';
    switch(status) {
        case INSPECTION_STATUSES.UWI_ONGOING: cell.classList.add('status-uwi-ongoing'); cell.textContent = 'UWI Ongoing'; break;
        case INSPECTION_STATUSES.UWI_DONE: cell.classList.add('status-uwi-done'); cell.textContent = activePage === 'panama' ? 'UWI Done' : 'UWI ✓'; break;
        case INSPECTION_STATUSES.K9_ONGOING: cell.classList.add('status-k9-ongoing'); cell.textContent = 'K9 Ongoing'; break;
        case INSPECTION_STATUSES.K9_DONE: cell.classList.add('status-k9-done'); cell.textContent = activePage === 'panama' ? 'K9 Done' : 'K9 ✓'; break;
        default: cell.textContent = '—'; break;
    }
}

function formatTimeLeft(hoursUntil) {
    if (hoursUntil <= 0) {
        const h = Math.floor(Math.abs(hoursUntil));
        const m = Math.floor((Math.abs(hoursUntil) - h) * 60);
        return `Overdue: ${h}h ${m}m ago`;
    }
    const h = Math.floor(hoursUntil);
    const m = Math.floor((hoursUntil - h) * 60);
    return `${h}h ${m}m`;
}

function handleRowContextMenu(e) {
    e.preventDefault();
    const id = activePage === 'panama' ? this.dataset.inspectionId : this.dataset.departureId;
    if (id) showContextMenu(e.pageX, e.pageY, id, activePage === 'panama' ? 'inspection' : 'port');
}

function showContextMenu(x, y, itemId, type) {
    removeContextMenu();
    const contextMenu = document.createElement('div');
    contextMenu.id = 'context-menu';
    contextMenu.className = 'context-menu';
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    if (type === 'inspection') contextMenu.dataset.inspectionId = itemId;
    else contextMenu.dataset.departureId = itemId;
    contextMenu.dataset.type = type;
    const items = [
        { text: 'UWI Ongoing', status: INSPECTION_STATUSES.UWI_ONGOING },
        { text: 'UWI Done', status: INSPECTION_STATUSES.UWI_DONE },
        { text: 'K9 Ongoing', status: INSPECTION_STATUSES.K9_ONGOING },
        { text: 'K9 Done', status: INSPECTION_STATUSES.K9_DONE },
        { text: 'Clear Status', status: INSPECTION_STATUSES.NONE }
    ];
    items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.textContent = item.text;
        menuItem.dataset.status = item.status;
        contextMenu.appendChild(menuItem);
    });
    document.body.appendChild(contextMenu);
    contextMenu.addEventListener('click', handleContextMenuItemClick);
    setTimeout(() => document.addEventListener('click', removeContextMenu), 0);
}

function handleContextMenuItemClick(e) {
    if (e.target.classList.contains('context-menu-item')) {
        const status = e.target.dataset.status;
        const type = this.dataset.type;
        if (type === 'inspection') {
            const id = this.dataset.inspectionId;
            inspectionStatuses[id] = status;
            const item = pendingInspections.find(i => i.id === id);
            if (item) item.status = status;
        } else {
            const id = this.dataset.departureId;
            portStatuses[id] = status;
            const item = pendingDepartures.find(i => i.id === id);
            if (item) item.status = status;
        }
        updatePendingTableDisplay();
        saveData();
    }
    removeContextMenu();
}

function handleContextMenuClick(e) {
    if (!e.target.closest('#context-menu')) removeContextMenu();
}

function removeContextMenu() {
    const menu = document.getElementById('context-menu');
    if (menu) document.body.removeChild(menu);
    document.removeEventListener('click', removeContextMenu);
}

function togglePendingModal(page) {
    if (page && page !== activePage) setActivePage(page);
    if (!isLargeScreen && pendingModal) {
        pendingModal.classList.toggle('hidden');
        if (!pendingModal.classList.contains('hidden')) updatePendingTableDisplay();
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const flash = document.createElement('div');
        flash.style = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,255,0,0.5);padding:10px 20px;border-radius:4px;z-index:1000;';
        flash.textContent = 'Copied to clipboard!';
        document.body.appendChild(flash);
        setTimeout(() => document.body.removeChild(flash), 1500);
    }).catch(() => alert('Failed to copy.'));
}

function saveData() {
    Object.entries(PAGE_CONFIG).forEach(([page, config]) => {
        Object.values(config.textAreas).forEach(cfg => {
            const el = cfg.element();
            if (el && cfg.storageKey) localStorage.setItem(cfg.storageKey, el.value);
        });
    });
    localStorage.setItem('inspectionStatuses', JSON.stringify(inspectionStatuses));
    localStorage.setItem('portStatuses', JSON.stringify(portStatuses));
}

function loadSavedData() {
    Object.entries(PAGE_CONFIG).forEach(([page, config]) => {
        Object.values(config.textAreas).forEach(cfg => {
            const el = cfg.element();
            if (el && cfg.storageKey) {
                const saved = localStorage.getItem(cfg.storageKey);
                if (saved) el.value = saved;
            }
        });
    });
    try {
        const i = localStorage.getItem('inspectionStatuses');
        if (i) inspectionStatuses = JSON.parse(i);
        const p = localStorage.getItem('portStatuses');
        if (p) portStatuses = JSON.parse(p);
    } catch (e) { console.error(e); }
}

function setupThemeToggle() {
    const boxes = [themeToggleCheckbox, portsThemeToggleCheckbox].filter(Boolean);
    const saved = localStorage.getItem('theme') || 'dark';
    const isDark = saved === 'dark';
    boxes.forEach(b => b.checked = isDark);
    setTheme(isDark);
    boxes.forEach(b => b.addEventListener('change', (e) => {
        setTheme(e.target.checked);
        boxes.forEach(ob => { if (ob !== e.target) ob.checked = e.target.checked; });
    }));
}

function setTheme(isDark) {
    if (isDark) {
        document.body.classList.remove('light-theme');
        document.querySelectorAll('.toggle-label').forEach(l => l.textContent = 'Dark Mode');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.add('light-theme');
        document.querySelectorAll('.toggle-label').forEach(l => l.textContent = 'Light Mode');
        localStorage.setItem('theme', 'light');
    }
}

window.addEventListener('DOMContentLoaded', initApp);
