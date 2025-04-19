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
let activePage = 'panama'; // Default to panama page
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
        timeZoneOffset: -5, // UTC-5 for Panama
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
    console.log("App initialization started");
    
    // Load active page from localStorage
    const savedPage = localStorage.getItem('activePage');
    if (savedPage) {
        activePage = savedPage;
        updateActivePage();
    }
    
    // Initialize theme
    setupThemeToggle();
    
    // Check screen size
    checkScreenSize();
    
    // Set up navigation
    setupNavigation();
    
    // Load saved data
    loadSavedData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start timers
    startTimers();
    
    // Set up scrolling for text areas
    setupScrollSync();
    
    // Update pending items initially
    updatePendingItems();
    
    console.log("App initialization completed. Active page:", activePage);
}

// Set up navigation
function setupNavigation() {
    panamaTab.addEventListener('click', () => setActivePage('panama'));
    portsTab.addEventListener('click', () => setActivePage('ports'));
}

// Set active page
function setActivePage(page) {
    activePage = page;
    localStorage.setItem('activePage', page);
    updateActivePage();
    updatePendingItems();
}

// Update active page display
function updateActivePage() {
    if (activePage === 'panama') {
        panamaTab.classList.add('active');
        portsTab.classList.remove('active');
        panamaPage.classList.add('active');
        portsPage.classList.remove('active');
    } else {
        panamaTab.classList.remove('active');
        portsTab.classList.add('active');
        panamaPage.classList.remove('active');
        portsPage.classList.add('active');
    }
}

// Check screen size and update layout
function checkScreenSize() {
    isLargeScreen = window.innerWidth > 1200;
    console.log("Screen size check - Width:", window.innerWidth, "Is large screen:", isLargeScreen);
    
    // Get current page config
    const config = PAGE_CONFIG[activePage];
    
    // Update panel visibility based on screen size
    ['panama', 'ports'].forEach(page => {
        const panel = PAGE_CONFIG[page].pendingPanel();
        if (panel) {
            panel.style.display = isLargeScreen ? 'flex' : 'none';
        }
    });
    
    console.log(isLargeScreen ? "Showing" : "Hiding", "pending panels for", isLargeScreen ? "large" : "small", "screen");
}

// Set up event listeners
function setupEventListeners() {
    // Pending modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', togglePendingModal);
    }
    
    window.addEventListener('click', (e) => {
        if (pendingModal && e.target === pendingModal) {
            togglePendingModal();
        }
    });
    
    // Set up page-specific event listeners
    setupPageEventListeners('panama');
    setupPageEventListeners('ports');
    
    // Window resize
    window.addEventListener('resize', () => {
        checkScreenSize();
        updatePendingTableDisplay();
    });
    
    // Context menu listeners
    document.addEventListener('click', handleContextMenuClick);
}

// Setup page-specific event listeners
function setupPageEventListeners(page) {
    const config = PAGE_CONFIG[page];
    
    // Set up text area listeners
    Object.entries(config.textAreas).forEach(([key, textAreaConfig]) => {
        const textArea = textAreaConfig.element();
        if (textArea) {
            textArea.addEventListener('input', () => {
                page === 'panama' ? updatePendingInspections() : updatePendingDepartures();
                saveData();
            });
            textArea.addEventListener('keydown', handleTabKey);
        }
        
        // Clear button
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
        
        // Copy button
        const copyBtn = textAreaConfig.copyBtn();
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const textArea = textAreaConfig.element();
                if (textArea) copyToClipboard(textArea.value);
            });
        }
    });
    
    // Check button
    const checkBtn = config.checkBtn();
    if (checkBtn) {
        checkBtn.addEventListener('click', () => {
            compareTextAreas(page);
        });
    }
    
    // Pending button
    const pendingBtn = config.pendingBtn();
    if (pendingBtn) {
        pendingBtn.addEventListener('click', () => {
            if (!isLargeScreen) {
                togglePendingModal(page);
            }
        });
    }
}

// Setup scrolling synchronization
function setupScrollSync() {
    // For each page, synchronize scrolling
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

// Format time
function formatTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}:${seconds}`;
}

// Helper function to update the time display for a specific element and UTC offset
function updateTimeForLocation(element, offset) {
    // Check if the target element exists
    if (!element) return;

    const now = new Date();
    // Calculate UTC time by adding the local timezone offset (in milliseconds)
    const utcTimeMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    // Calculate the target time by applying the desired offset (in milliseconds)
    const targetTime = new Date(utcTimeMs + (3600000 * offset)); // 3600000 ms in an hour

    // Update the element's text content
    element.textContent = formatTime(targetTime);
}

// Combined function to update all relevant time displays
function updateAllTimes() {
    // Update Panama time (UTC-5)
    updateTimeForLocation(PAGE_CONFIG.panama.timeDisplay(), PAGE_CONFIG.panama.timeZoneOffset);

    // Update Brazil time (UTC-3)
    updateTimeForLocation(PAGE_CONFIG.ports.timeDisplays.Brazil(), PAGE_CONFIG.ports.timeZoneOffsets.Brazil);

    // Update Mexico time (UTC-6)
    updateTimeForLocation(PAGE_CONFIG.ports.timeDisplays.Mexico(), PAGE_CONFIG.ports.timeZoneOffsets.Mexico);
}

// Update pending items based on active page
function updatePendingItems() {
    if (activePage === 'panama') {
        updatePendingInspections();
    } else {
        updatePendingDepartures();
    }
}

// Start timers for updating time and data
function startTimers() {
    // Update all times every second
    setInterval(updateAllTimes, 1000);

    // Initial time updates
    updateAllTimes();

    // Update pending items every 10 seconds
    setInterval(updatePendingItems, 10000);

    // Blink effect for urgent rows
    setInterval(() => {
        blinkState = !blinkState;
        updatePendingTableDisplay();
    }, 1000);
}

// Handle tab key in text areas
function handleTabKey(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        
        const start = this.selectionStart;
        const end = this.selectionEnd;
        
        // Insert tab at cursor position
        this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
        
        // Move cursor after the inserted tab
        this.selectionStart = this.selectionEnd = start + 1;
    }
}

// Generic function to compare text areas based on page
function compareTextAreas(page) {
    const config = PAGE_CONFIG[page];
    const firstTextArea = config.textAreas.first.element();
    const secondTextArea = config.textAreas.second.element();
    const firstHighlightDiv = config.textAreas.first.highlightDiv();
    const secondHighlightDiv = config.textAreas.second.highlightDiv();
    
    if (!firstTextArea || !secondTextArea || !firstHighlightDiv || !secondHighlightDiv) return;
    
    // Get text content
    const firstLines = firstTextArea.value.split('\n');
    const secondLines = secondTextArea.value.split('\n');
    
    // Create sets to track matched lines
    const matchedFirstLines = new Set();
    const matchedSecondLines = new Set();
    
    // Find matching lines
    for (let i = 0; i < firstLines.length; i++) {
        for (let j = 0; j < secondLines.length; j++) {
            if (!matchedSecondLines.has(j) && firstLines[i] === secondLines[j] && firstLines[i].trim() !== '') {
                matchedFirstLines.add(i);
                matchedSecondLines.add(j);
                break;
            }
        }
    }
    
    // Generate highlighted HTML
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
    
    // Update highlight divs
    firstHighlightDiv.innerHTML = firstHtml;
    secondHighlightDiv.innerHTML = secondHtml;
    
    // Make sure the highlight divs are properly aligned
    firstHighlightDiv.scrollTop = firstTextArea.scrollTop;
    firstHighlightDiv.scrollLeft = firstTextArea.scrollLeft;
    secondHighlightDiv.scrollTop = secondTextArea.scrollTop;
    secondHighlightDiv.scrollLeft = secondTextArea.scrollLeft;
    
    // Ensure the highlight divs remain aligned when scrolling
    syncScrollAfterCompare(page);
}

// Synchronize scrolling between textarea and highlight div
function syncScroll(textArea, highlightDiv) {
    textArea.addEventListener('scroll', () => {
        highlightDiv.scrollTop = textArea.scrollTop;
        highlightDiv.scrollLeft = textArea.scrollLeft;
    });
}

// Additional synchronization after comparison
function syncScrollAfterCompare(page) {
    // Force synchronization after a short delay to ensure rendering is complete
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

// Escape HTML special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Parse ETD dates for Panama inspections
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
            
            // Create date object (using current year)
            const currentDate = new Date();
            let year = currentDate.getFullYear();
            
            // Handle year rollover (if current month is December and ETD is in January)
            const currentMonth = currentDate.getMonth() + 1;
            if (currentMonth === 12 && parseInt(month) === 1) {
                year = year + 1;
            }
            
            const date = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
            
            results.push({
                description: line,
                etdDate: date
            });
        }
    }
    
    return results;
}

// Parse ETD dates from text with country information for ports
function parsePortETDDates(text, country) {
    const results = [];
    const lines = text.split('\n');

    // Updated regex to handle both formats:
    // 1. ETD DD/MM HH:MM
    // 2. ETD DD/MM HH:MM(content)
    const regex = /ETD\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})(?:\(|$|\s)/;

    const offsetMap = {
        'Brazil': -3,  // UTC-3
        'Mexico': -6   // UTC-6 (e.g., Mexico City)
    };

    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            const dateString = match[1];
            const [datePart, timePart] = dateString.split(' ');
            const [day, month] = datePart.split('/');
            const [hours, minutes] = timePart.split(':');

            // Create UTC date
            const currentDate = new Date();
            let year = currentDate.getFullYear();

            // Handle year rollover (e.g., December -> January)
            const currentMonth = currentDate.getMonth() + 1;
            if (currentMonth === 12 && parseInt(month) === 1) {
                year += 1;
            }

            const utcDate = new Date(Date.UTC(
                year,
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hours),
                parseInt(minutes)
            ));

            // Adjust to country local time
            const offset = offsetMap[country] || 0;
            const localDate = new Date(utcDate.getTime() - offset * 60 * 60 * 1000);

            results.push({
                description: line,
                etdDate: localDate,
                country: country
            });
        }
    }

    return results;
}

// Update pending inspections list
function updatePendingInspections() {
    const k9TextArea = PAGE_CONFIG.panama.textAreas.first.element();
    const uwTextArea = PAGE_CONFIG.panama.textAreas.second.element();
    
    if (!k9TextArea || !uwTextArea) return;
    
    console.log("Updating pending inspections");
    
    const k9Inspections = parseInspectionETDDates(k9TextArea.value);
    const uwInspections = parseInspectionETDDates(uwTextArea.value);
    
    // Combine lists and remove duplicates
    const allInspections = [...k9Inspections, ...uwInspections];
    const uniqueMap = new Map();
    
    allInspections.forEach(inspection => {
        uniqueMap.set(inspection.description, inspection);
    });
    
    // Get current Panama time
    const now = new Date();
    const panamaOffset = PAGE_CONFIG.panama.timeZoneOffset;
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const currentPanamaTime = new Date(utcTime + (3600000 * panamaOffset));
    
    // Calculate priority status
    pendingInspections = Array.from(uniqueMap.values()).map(inspection => {
        const diffInMillis = inspection.etdDate.getTime() - currentPanamaTime.getTime();
        const hoursUntil = diffInMillis / (1000 * 60 * 60);
        
        // Create a unique ID for each inspection
        const inspectionId = generateId(inspection.description);
        
        return {
            ...inspection,
            id: inspectionId, // Add unique ID
            hoursUntil,
            isUpcoming: hoursUntil < 24 && hoursUntil > 0,
            isPriority: hoursUntil < 6 && hoursUntil > 0,
            isUrgent: hoursUntil < 2 && hoursUntil > 0,
            status: inspectionStatuses[inspectionId] || INSPECTION_STATUSES.NONE // Add status from our tracking
        };
    });
    
    // Sort by ETD date
    pendingInspections.sort((a, b) => a.etdDate - b.etdDate);
    
    // Update tables if on panama page
    if (activePage === 'panama') {
        updatePendingTableDisplay();
        
        // Update pending button appearance if there are urgent items
        const pendingBtn = PAGE_CONFIG.panama.pendingBtn();
        if (pendingBtn) {
            if (pendingInspections.some(item => item.isUrgent)) {
                pendingBtn.innerHTML = 'Pending <span style="color: red;">⚠</span>';
            } else {
                pendingBtn.textContent = 'Pending';
            }
        }
    }
    
    console.log("Found", pendingInspections.length, "pending inspections");
}

// Update pending departures list
function updatePendingDepartures() {
    const brazilTextArea = PAGE_CONFIG.ports.textAreas.first.element();
    const mexicoTextArea = PAGE_CONFIG.ports.textAreas.second.element();
    
    if (!brazilTextArea || !mexicoTextArea) return;
    
    console.log("Updating pending departures");
    
    // Parse the ETD dates with country information
    const brazilDepartures = parsePortETDDates(brazilTextArea.value, 'Brazil');
    const mexicoDepartures = parsePortETDDates(mexicoTextArea.value, 'Mexico');
    
    // Combine lists
    const allDepartures = [...brazilDepartures, ...mexicoDepartures];
    
    // Get current time
    const now = new Date();
    
    // Calculate priority status
    pendingDepartures = allDepartures.map(departure => {
        const diffInMillis = departure.etdDate.getTime() - now.getTime();
        const hoursUntil = diffInMillis / (1000 * 60 * 60);
        
        // Create a unique ID for each departure
        const departureId = generateId(departure.description);
        
        return {
            ...departure,
            id: departureId, // Add unique ID
            hoursUntil,
            isUpcoming: hoursUntil < 24 && hoursUntil > 0,
            isPriority: hoursUntil < 6 && hoursUntil > 0,
            isUrgent: hoursUntil < 2 && hoursUntil > 0,
            status: portStatuses[departureId] || INSPECTION_STATUSES.NONE // Add status from our tracking
        };
    });
    
    // Sort by ETD date
    pendingDepartures.sort((a, b) => a.etdDate - b.etdDate);
    
    // Update tables if on ports page
    if (activePage === 'ports') {
        updatePendingTableDisplay();
        
        // Update pending button appearance if there are urgent items
        const pendingBtn = PAGE_CONFIG.ports.pendingBtn();
        if (pendingBtn) {
            if (pendingDepartures.some(item => item.isUrgent)) {
                pendingBtn.innerHTML = 'Pending <span style="color: red;">⚠</span>';
            } else {
                pendingBtn.textContent = 'Pending';
            }
        }
    }
    
    console.log("Found", pendingDepartures.length, "pending departures");
}

// Generate a unique ID for an item based on its description
function generateId(description) {
    // Remove spaces and special characters, convert to lowercase
    return description.trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
}

// Update pending table display for both modal and inline views
function updatePendingTableDisplay() {
    console.log("Updating table display for", activePage);
    
    const config = PAGE_CONFIG[activePage];
    
    // Get the correct tbody elements
    const modalTbody = pendingTbody;
    const inlineTbody = config.pendingTbodyInline();
    
    // Update modal title and column header
    if (modalTitle) {
        modalTitle.textContent = activePage === 'panama' ? 'U/W & K9 Countdown' : 'Ports Countdown';
    }
    
    if (columnHeader) {
        columnHeader.textContent = activePage === 'panama' ? 'Inspection Priorities' : 'Port Priorities';
    }
    
    // Update modal table
    if (modalTbody) {
        updateTableBody(modalTbody);
    }
    
    // Update inline table if exists
    if (inlineTbody) {
        updateTableBody(inlineTbody);
    }
}

// Helper function to update a table body with pending data
function updateTableBody(tableBody) {
    tableBody.innerHTML = '';
    
    // Get config for active page
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
        
        // Set data attribute based on active page
        if (activePage === 'panama') {
            row.dataset.inspectionId = item.id;
        } else {
            row.dataset.departureId = item.id;
        }
        
        // Apply styling based on priority
        if (item.hoursUntil <= 0) {
            row.classList.add('overdue-row');
        } else if (item.isUrgent) {
            row.classList.add('urgent-row');
            if (blinkState) {
                row.classList.add('urgent-blink');
            } else {
                row.style.opacity = '0.5';
            }
        } else if (item.isPriority) {
            row.classList.add('priority-row');
            if (blinkState) {
                row.classList.add('urgent-blink');
            } else {
                row.style.opacity = '0.5';
            }
        } else if (item.isUpcoming) {
            row.classList.add('upcoming-row');
        }
        
        // Description cell - No text wrapping
        const descCell = document.createElement('td');
        descCell.style.fontFamily = 'monospace';
        descCell.style.whiteSpace = 'nowrap';
        
        // For ports page, add country badge
        if (activePage === 'ports' && item.country) {
            const countrySpan = document.createElement('span');
            countrySpan.setAttribute('data-country', item.country);
            countrySpan.textContent = `[${item.country}]`;
            descCell.appendChild(countrySpan);
            descCell.appendChild(document.createTextNode(' '));
        }
        
        // Add main description text
        descCell.appendChild(document.createTextNode(item.description));
        row.appendChild(descCell);
        
        // Time left cell
        const timeCell = document.createElement('td');
        timeCell.style.textAlign = 'center';
        timeCell.style.whiteSpace = 'nowrap';
        
        const formattedTime = formatTimeLeft(item.hoursUntil);
        timeCell.textContent = formattedTime;
        
        row.appendChild(timeCell);
        
        // Status cell
        const statusCell = document.createElement('td');
        statusCell.style.textAlign = 'center';
        statusCell.style.whiteSpace = 'nowrap';
        statusCell.classList.add('status-cell');
        
        // Add appropriate status indicator based on page
        updateStatusIndicator(statusCell, item.status);
        
        row.appendChild(statusCell);
        
        // Add context menu event
        row.addEventListener('contextmenu', handleRowContextMenu);
        
        tableBody.appendChild(row);
    });
}

// Unified status indicator update
function updateStatusIndicator(cell, status) {
    // Clear existing content
    cell.innerHTML = '';
    cell.className = 'status-cell';
    
    // Add appropriate icon/text based on status
    switch(status) {
        case INSPECTION_STATUSES.UWI_ONGOING:
            cell.classList.add('status-uwi-ongoing');
            cell.textContent = 'UWI Ongoing';
            break;
        case INSPECTION_STATUSES.UWI_DONE:
            cell.classList.add('status-uwi-done');
            cell.textContent = activePage === 'panama' ? 'UWI Done' : 'UWI ✓';
            break;
        case INSPECTION_STATUSES.K9_ONGOING:
            cell.classList.add('status-k9-ongoing');
            cell.textContent = 'K9 Ongoing';
            break;
        case INSPECTION_STATUSES.K9_DONE:
            cell.classList.add('status-k9-done');
            cell.textContent = activePage === 'panama' ? 'K9 Done' : 'K9 ✓';
            break;
        default:
            cell.textContent = '—';
            break;
    }
}

// Format time left display
function formatTimeLeft(hoursUntil) {
    if (hoursUntil <= 0) {
        // Calculate time passed since departure
        const hoursPassed = Math.abs(hoursUntil);
        const hours = Math.floor(hoursPassed);
        const minutes = Math.floor((hoursPassed - hours) * 60);
        
        return `Overdue: ${hours}h ${minutes}m ago`;
    }
    
    const hours = Math.floor(hoursUntil);
    const minutes = Math.floor((hoursUntil - hours) * 60);
    
    return `${hours}h ${minutes}m`;
}

// Handle right-click on a row to show context menu
function handleRowContextMenu(e) {
    e.preventDefault();
    
    if (activePage === 'panama') {
        // Get inspection ID
        const inspectionId = this.dataset.inspectionId;
        if (inspectionId) {
            showContextMenu(e.pageX, e.pageY, inspectionId, 'inspection');
        }
    } else {
        // Get departure ID
        const departureId = this.dataset.departureId;
        if (departureId) {
            showContextMenu(e.pageX, e.pageY, departureId, 'port');
        }
    }
}

// Unified context menu function
function showContextMenu(x, y, itemId, type) {
    // Remove any existing context menus
    removeContextMenu();
    
    // Create a new context menu
    const contextMenu = document.createElement('div');
    contextMenu.id = 'context-menu';
    contextMenu.className = 'context-menu';
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    
    // Set appropriate data attribute
    if (type === 'inspection') {
        contextMenu.dataset.inspectionId = itemId;
    } else {
        contextMenu.dataset.departureId = itemId;
    }
    
    contextMenu.dataset.type = type;
    
    // Add menu items
    const menuItems = [
        { text: 'UWI Ongoing', status: INSPECTION_STATUSES.UWI_ONGOING },
        { text: 'UWI Done', status: INSPECTION_STATUSES.UWI_DONE },
        { text: 'K9 Ongoing', status: INSPECTION_STATUSES.K9_ONGOING },
        { text: 'K9 Done', status: INSPECTION_STATUSES.K9_DONE },
        { text: 'Clear Status', status: INSPECTION_STATUSES.NONE }
    ];
    
    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.textContent = item.text;
        menuItem.dataset.status = item.status;
        contextMenu.appendChild(menuItem);
    });
    
    // Add the menu to the document
    document.body.appendChild(contextMenu);
    
    // Add click event listener for the entire menu
    contextMenu.addEventListener('click', handleContextMenuItemClick);
    
    // Add a click event listener to remove the menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', removeContextMenu);
    }, 0);
}

// Handle clicks on context menu items
function handleContextMenuItemClick(e) {
    if (e.target.classList.contains('context-menu-item')) {
        const newStatus = e.target.dataset.status;
        const menuType = this.dataset.type;
        
        if (menuType === 'inspection') {
            const inspectionId = this.dataset.inspectionId;
            
            // Update the status in our tracking object
            inspectionStatuses[inspectionId] = newStatus;
            
            // Update the inspection in pendingInspections
            const inspection = pendingInspections.find(insp => insp.id === inspectionId);
            if (inspection) {
                inspection.status = newStatus;
            }
        } else { // port
            const departureId = this.dataset.departureId;
            
            // Update the status in our tracking object
            portStatuses[departureId] = newStatus;
            
            // Update the departure in pendingDepartures
            const departure = pendingDepartures.find(dep => dep.id === departureId);
            if (departure) {
                departure.status = newStatus;
            }
        }
        
        // Update the table display
        updatePendingTableDisplay();
        
        // Save the status
        saveData();
    }
    
    // Remove the context menu
    removeContextMenu();
}

// Handle click on a context menu item
function handleContextMenuClick(e) {
    // If the click is not on a context menu or its items, remove it
    if (!e.target.closest('#context-menu')) {
        removeContextMenu();
    }
}

// Remove the context menu
function removeContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) {
        document.body.removeChild(contextMenu);
    }
    
    // Remove the document click listener
    document.removeEventListener('click', removeContextMenu);
}

// Toggle pending modal
function togglePendingModal(page) {
    console.log("Toggle pending modal called for", page || activePage);
    
    // Set active page if provided
    if (page && page !== activePage) {
        setActivePage(page);
    }
    
    // Always show modal on small screens
    if (!isLargeScreen && pendingModal) {
        pendingModal.classList.toggle('hidden');
        
        if (!pendingModal.classList.contains('hidden')) {
            console.log("Showing modal");
            updatePendingTableDisplay();
        } else {
            console.log("Hiding modal");
        }
    } else {
        console.log("Not toggling modal on large screen");
    }
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            // Success notification - subtle flash
            const flashElement = document.createElement('div');
            flashElement.style.position = 'fixed';
            flashElement.style.top = '10px';
            flashElement.style.left = '50%';
            flashElement.style.transform = 'translateX(-50%)';
            flashElement.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
            flashElement.style.padding = '10px 20px';
            flashElement.style.borderRadius = '4px';
            flashElement.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
            flashElement.style.zIndex = '1000';
            flashElement.style.transition = 'opacity 0.3s';
            flashElement.textContent = 'Copied to clipboard!';
            
            document.body.appendChild(flashElement);
            
            setTimeout(() => {
                flashElement.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(flashElement);
                }, 300);
            }, 1500);
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                alert('Text copied to clipboard!');
            } catch (err) {
                console.error('Fallback copy method failed: ', err);
                alert('Failed to copy text. Please copy manually.');
            }
            
            document.body.removeChild(textArea);
        });
}

// Save text and status data to local storage
function saveData() {
    // Save all text areas based on config
    Object.entries(PAGE_CONFIG).forEach(([page, config]) => {
        Object.values(config.textAreas).forEach(textAreaConfig => {
            const textArea = textAreaConfig.element();
            if (textArea && textAreaConfig.storageKey) {
                localStorage.setItem(textAreaConfig.storageKey, textArea.value);
            }
        });
    });
    
    // Save status data
    localStorage.setItem('inspectionStatuses', JSON.stringify(inspectionStatuses));
    localStorage.setItem('portStatuses', JSON.stringify(portStatuses));
}

// Load text and status data from local storage
function loadSavedData() {
    // Load all text areas based on config
    Object.entries(PAGE_CONFIG).forEach(([page, config]) => {
        Object.values(config.textAreas).forEach(textAreaConfig => {
            const textArea = textAreaConfig.element();
            if (textArea && textAreaConfig.storageKey) {
                const savedText = localStorage.getItem(textAreaConfig.storageKey);
                if (savedText) {
                    textArea.value = savedText;
                }
            }
        });
    });
    
    // Load inspection statuses
    const savedInspectionStatuses = localStorage.getItem('inspectionStatuses');
    if (savedInspectionStatuses) {
        try {
            inspectionStatuses = JSON.parse(savedInspectionStatuses);
        } catch (e) {
            console.error('Error parsing saved inspection statuses:', e);
            inspectionStatuses = {};
        }
    }
    
    // Load port statuses
    const savedPortStatuses = localStorage.getItem('portStatuses');
    if (savedPortStatuses) {
        try {
            portStatuses = JSON.parse(savedPortStatuses);
        } catch (e) {
            console.error('Error parsing saved port statuses:', e);
            portStatuses = {};
        }
    }
}

// Theme Toggle functionality
function setupThemeToggle() {
    const checkboxes = [themeToggleCheckbox, portsThemeToggleCheckbox].filter(Boolean);
    const labels = document.querySelectorAll('.toggle-label');
    
    // Initialize theme based on localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const isDark = savedTheme === 'dark';
    
    console.log("Initializing theme from localStorage:", savedTheme);
    
    // Set checkbox states
    checkboxes.forEach(checkbox => {
        if (checkbox) checkbox.checked = isDark;
    });
    
    // Apply theme
    setTheme(isDark);
    
    // Add event listeners for theme toggle
    checkboxes.forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                setTheme(e.target.checked);
                
                // Sync the other checkbox
                checkboxes.forEach(otherCheckbox => {
                    if (otherCheckbox && otherCheckbox !== e.target) {
                        otherCheckbox.checked = e.target.checked;
                    }
                });
            });
        }
    });
}

// Function to set theme
function setTheme(isDark) {
    if (isDark) {
        document.body.classList.remove('light-theme');
        document.querySelectorAll('.toggle-label').forEach(label => {
            label.textContent = 'Dark Mode';
        });
        localStorage.setItem('theme', 'dark');
        console.log("Theme set to dark mode");
    } else {
        document.body.classList.add('light-theme');
        document.querySelectorAll('.toggle-label').forEach(label => {
            label.textContent = 'Light Mode';
        });
        localStorage.setItem('theme', 'light');
        console.log("Theme set to light mode");
    }
}

// Initialize the application when the page loads
window.addEventListener('DOMContentLoaded', initApp);