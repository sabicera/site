// DOM Elements - Common
const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
const portsThemeToggleCheckbox = document.getElementById('ports-theme-toggle-checkbox');
const toggleLabel = document.querySelector('.toggle-label');
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

// Panama Page Elements
const k9TextArea = document.getElementById('k9-textarea');
const uwTextArea = document.getElementById('uw-textarea');
const k9HighlightDiv = document.getElementById('k9-highlight');
const uwHighlightDiv = document.getElementById('uw-highlight');
const panamaTimeDisplay = document.getElementById('panama-time');
const panamaCheckBtn = document.getElementById('panama-check-btn');
const panamaPendingBtn = document.getElementById('panama-pending-btn');
const k9ClearBtn = document.getElementById('k9-clear-btn');
const uwClearBtn = document.getElementById('uw-clear-btn');
const k9CopyBtn = document.getElementById('k9-copy-btn');
const uwCopyBtn = document.getElementById('uw-copy-btn');
const panamaPendingPanel = document.getElementById('panama-pending-panel');
const panamaPendingTbodyInline = document.getElementById('panama-pending-tbody-inline');

// Ports Page Elements
const brazilTextArea = document.getElementById('brazil-textarea');
const mexicoTextArea = document.getElementById('mexico-textarea');
const brazilHighlightDiv = document.getElementById('brazil-highlight');
const mexicoHighlightDiv = document.getElementById('mexico-highlight');
const brazilTimeDisplay = document.getElementById('brazil-time');
const mexicoTimeDisplay = document.getElementById('mexico-time');
const portsCheckBtn = document.getElementById('ports-check-btn');
const portsPendingBtn = document.getElementById('ports-pending-btn');
const brazilClearBtn = document.getElementById('brazil-clear-btn');
const mexicoClearBtn = document.getElementById('mexico-clear-btn');
const brazilCopyBtn = document.getElementById('brazil-copy-btn');
const mexicoCopyBtn = document.getElementById('mexico-copy-btn');
const portsPendingPanel = document.getElementById('ports-pending-panel');
const portsPendingTbodyInline = document.getElementById('ports-pending-tbody-inline');

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
    panamaTab.addEventListener('click', () => {
        setActivePage('panama');
    });
    
    portsTab.addEventListener('click', () => {
        setActivePage('ports');
    });
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
    
    if (isLargeScreen) {
        // Show the inline panels for large screens
        if (panamaPendingPanel) {
            panamaPendingPanel.style.display = 'flex';
        }
        if (portsPendingPanel) {
            portsPendingPanel.style.display = 'flex';
        }
        console.log("Showing pending panels for large screen");
    } else {
        // Hide the inline panels for small screens
        if (panamaPendingPanel) {
            panamaPendingPanel.style.display = 'none';
        }
        if (portsPendingPanel) {
            portsPendingPanel.style.display = 'none';
        }
        console.log("Hiding pending panels for small screen");
    }
}

// Set up event listeners
function setupEventListeners() {
    // Pending modal
    closeModalBtn.addEventListener('click', togglePendingModal);
    window.addEventListener('click', (e) => {
        if (e.target === pendingModal) {
            togglePendingModal();
        }
    });
    
    // Panama page event listeners
    if (k9TextArea) {
        k9TextArea.addEventListener('input', () => {
            updatePendingInspections();
            saveData();
        });
        k9TextArea.addEventListener('keydown', handleTabKey);
    }
    
    if (uwTextArea) {
        uwTextArea.addEventListener('input', () => {
            updatePendingInspections();
            saveData();
        });
        uwTextArea.addEventListener('keydown', handleTabKey);
    }
    
    if (panamaCheckBtn) {
        panamaCheckBtn.addEventListener('click', () => {
            comparePanamaTextAreas();
        });
    }
    
    if (panamaPendingBtn) {
        panamaPendingBtn.addEventListener('click', () => {
            if (!isLargeScreen) {
                togglePendingModal('panama');
            }
        });
    }
    
    if (k9ClearBtn) {
        k9ClearBtn.addEventListener('click', () => {
            k9TextArea.value = '';
            k9HighlightDiv.innerHTML = '';
            saveData();
        });
    }
    
    if (uwClearBtn) {
        uwClearBtn.addEventListener('click', () => {
            uwTextArea.value = '';
            uwHighlightDiv.innerHTML = '';
            saveData();
        });
    }
    
    if (k9CopyBtn) {
        k9CopyBtn.addEventListener('click', () => {
            copyToClipboard(k9TextArea.value);
        });
    }
    
    if (uwCopyBtn) {
        uwCopyBtn.addEventListener('click', () => {
            copyToClipboard(uwTextArea.value);
        });
    }
    
    // Ports page event listeners
    if (brazilTextArea) {
        brazilTextArea.addEventListener('input', () => {
            updatePendingDepartures();
            saveData();
        });
        brazilTextArea.addEventListener('keydown', handleTabKey);
    }
    
    if (mexicoTextArea) {
        mexicoTextArea.addEventListener('input', () => {
            updatePendingDepartures();
            saveData();
        });
        mexicoTextArea.addEventListener('keydown', handleTabKey);
    }
    
    if (portsCheckBtn) {
        portsCheckBtn.addEventListener('click', () => {
            comparePortsTextAreas();
        });
    }
    
    if (portsPendingBtn) {
        portsPendingBtn.addEventListener('click', () => {
            if (!isLargeScreen) {
                togglePendingModal('ports');
            }
        });
    }
    
    if (brazilClearBtn) {
        brazilClearBtn.addEventListener('click', () => {
            brazilTextArea.value = '';
            brazilHighlightDiv.innerHTML = '';
            saveData();
        });
    }
    
    if (mexicoClearBtn) {
        mexicoClearBtn.addEventListener('click', () => {
            mexicoTextArea.value = '';
            mexicoHighlightDiv.innerHTML = '';
            saveData();
        });
    }
    
    if (brazilCopyBtn) {
        brazilCopyBtn.addEventListener('click', () => {
            copyToClipboard(brazilTextArea.value);
        });
    }
    
    if (mexicoCopyBtn) {
        mexicoCopyBtn.addEventListener('click', () => {
            copyToClipboard(mexicoTextArea.value);
        });
    }
    
    // Window resize
    window.addEventListener('resize', () => {
        checkScreenSize();
        updatePendingTableDisplay();
    });
    
    // Context menu listeners
    document.addEventListener('click', handleContextMenuClick);
}

// Setup scrolling synchronization
function setupScrollSync() {
    if (k9TextArea && k9HighlightDiv) {
        syncScroll(k9TextArea, k9HighlightDiv);
    }
    if (uwTextArea && uwHighlightDiv) {
        syncScroll(uwTextArea, uwHighlightDiv);
    }
    if (brazilTextArea && brazilHighlightDiv) {
        syncScroll(brazilTextArea, brazilHighlightDiv);
    }
    if (mexicoTextArea && mexicoHighlightDiv) {
        syncScroll(mexicoTextArea, mexicoHighlightDiv);
    }
}

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
    if (!element) {
        // console.warn(`Time display element not found for offset ${offset}.`); // Optional: Log a warning
        return;
    }

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
    const now = new Date(); // Get current time once for efficiency (optional optimization)

    // Update Panama time (UTC-5)
    updateTimeForLocation(panamaTimeDisplay, -5);

    // Update Brazil time (UTC-3)
    updateTimeForLocation(brazilTimeDisplay, -3);

    // Update Mexico time (UTC-6, assuming Mexico City - adjust if needed)
    updateTimeForLocation(mexicoTimeDisplay, -6);
}


// Update pending items based on active page (remains the same)
function updatePendingItems() {
    if (activePage === 'panama') {
        updatePendingInspections();
    } else {
        updatePendingDepartures();
    }
}

// Start timers for updating time and data (updated)
function startTimers() {
    // Update all times every second using the combined function
    setInterval(updateAllTimes, 1000);

    // Initial time updates using the combined function
    updateAllTimes();

    // Update pending items every 10 seconds (remains the same)
    setInterval(updatePendingItems, 10000);

    // Blink effect for urgent rows (remains the same)
    setInterval(() => {
        blinkState = !blinkState;
        updatePendingTableDisplay(); // Make sure this function exists
    }, 1000); // Consider if this interval needs to be different
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

// Compare K9 and UW text areas
function comparePanamaTextAreas() {
    if (!k9TextArea || !uwTextArea || !k9HighlightDiv || !uwHighlightDiv) return;
    
    // Get text content
    const k9Lines = k9TextArea.value.split('\n');
    const uwLines = uwTextArea.value.split('\n');
    
    // Create sets to track matched lines
    const matchedK9Lines = new Set();
    const matchedUWLines = new Set();
    
    // Find matching lines
    for (let i = 0; i < k9Lines.length; i++) {
        for (let j = 0; j < uwLines.length; j++) {
            if (!matchedUWLines.has(j) && k9Lines[i] === uwLines[j] && k9Lines[i].trim() !== '') {
                matchedK9Lines.add(i);
                matchedUWLines.add(j);
                break;
            }
        }
    }
    
    // Generate highlighted HTML
    let k9Html = '';
    let uwHtml = '';
    
    k9Lines.forEach((line, index) => {
        const isMatch = matchedK9Lines.has(index);
        const highlightClass = !isMatch && line.trim() !== '' ? 'highlight-diff' : '';
        k9Html += `<div class="highlight-line ${highlightClass}">${escapeHtml(line) || '&nbsp;'}</div>`;
    });
    
    uwLines.forEach((line, index) => {
        const isMatch = matchedUWLines.has(index);
        const highlightClass = !isMatch && line.trim() !== '' ? 'highlight-diff' : '';
        uwHtml += `<div class="highlight-line ${highlightClass}">${escapeHtml(line) || '&nbsp;'}</div>`;
    });
    
    // Update highlight divs
    k9HighlightDiv.innerHTML = k9Html;
    uwHighlightDiv.innerHTML = uwHtml;
    
    // Make sure the highlight divs are properly aligned
    k9HighlightDiv.scrollTop = k9TextArea.scrollTop;
    k9HighlightDiv.scrollLeft = k9TextArea.scrollLeft;
    uwHighlightDiv.scrollTop = uwTextArea.scrollTop;
    uwHighlightDiv.scrollLeft = uwTextArea.scrollLeft;
    
    // Ensure the highlight divs remain aligned when scrolling
    syncScrollAfterCompare('panama');
}

// Compare Brazil and Mexico text areas
function comparePortsTextAreas() {
    if (!brazilTextArea || !mexicoTextArea || !brazilHighlightDiv || !mexicoHighlightDiv) return;
    
    // Get text content
    const brazilLines = brazilTextArea.value.split('\n');
    const mexicoLines = mexicoTextArea.value.split('\n');
    
    // Create sets to track matched lines
    const matchedBrazilLines = new Set();
    const matchedMexicoLines = new Set();
    
    // Find matching lines
    for (let i = 0; i < brazilLines.length; i++) {
        for (let j = 0; j < mexicoLines.length; j++) {
            if (!matchedMexicoLines.has(j) && brazilLines[i] === mexicoLines[j] && brazilLines[i].trim() !== '') {
                matchedBrazilLines.add(i);
                matchedMexicoLines.add(j);
                break;
            }
        }
    }
    
    // Generate highlighted HTML
    let brazilHtml = '';
    let mexicoHtml = '';
    
    brazilLines.forEach((line, index) => {
        const isMatch = matchedBrazilLines.has(index);
        const highlightClass = !isMatch && line.trim() !== '' ? 'highlight-diff' : '';
        brazilHtml += `<div class="highlight-line ${highlightClass}">${escapeHtml(line) || '&nbsp;'}</div>`;
    });
    
    mexicoLines.forEach((line, index) => {
        const isMatch = matchedMexicoLines.has(index);
        const highlightClass = !isMatch && line.trim() !== '' ? 'highlight-diff' : '';
        mexicoHtml += `<div class="highlight-line ${highlightClass}">${escapeHtml(line) || '&nbsp;'}</div>`;
    });
    
    // Update highlight divs
    brazilHighlightDiv.innerHTML = brazilHtml;
    mexicoHighlightDiv.innerHTML = mexicoHtml;
    
    // Make sure the highlight divs are properly aligned
    brazilHighlightDiv.scrollTop = brazilTextArea.scrollTop;
    brazilHighlightDiv.scrollLeft = brazilTextArea.scrollLeft;
    mexicoHighlightDiv.scrollTop = mexicoTextArea.scrollTop;
    mexicoHighlightDiv.scrollLeft = mexicoTextArea.scrollLeft;
    
    // Ensure the highlight divs remain aligned when scrolling
    syncScrollAfterCompare('ports');
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
        if (page === 'panama') {
            if (k9HighlightDiv && k9TextArea) {
                k9HighlightDiv.scrollTop = k9TextArea.scrollTop;
                k9HighlightDiv.scrollLeft = k9TextArea.scrollLeft;
            }
            if (uwHighlightDiv && uwTextArea) {
                uwHighlightDiv.scrollTop = uwTextArea.scrollTop;
                uwHighlightDiv.scrollLeft = uwTextArea.scrollLeft;
            }
        } else { // ports
            if (brazilHighlightDiv && brazilTextArea) {
                brazilHighlightDiv.scrollTop = brazilTextArea.scrollTop;
                brazilHighlightDiv.scrollLeft = brazilTextArea.scrollLeft;
            }
            if (mexicoHighlightDiv && mexicoTextArea) {
                mexicoHighlightDiv.scrollTop = mexicoTextArea.scrollTop;
                mexicoHighlightDiv.scrollLeft = mexicoTextArea.scrollLeft;
            }
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
    const panamaOffset = -5; // UTC-5
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
        if (pendingInspections.some(item => item.isUrgent)) {
            panamaPendingBtn.innerHTML = 'Pending <span style="color: red;">⚠</span>';
        } else {
            panamaPendingBtn.textContent = 'Pending';
        }
    }
    
    console.log("Found", pendingInspections.length, "pending inspections");
}

// Update pending departures list
function updatePendingDepartures() {
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
        if (pendingDepartures.some(item => item.isUrgent)) {
            portsPendingBtn.innerHTML = 'Pending <span style="color: red;">⚠</span>';
        } else {
            portsPendingBtn.textContent = 'Pending';
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
    
    // Get the correct tbody elements based on active page
    const modalTbody = pendingTbody;
    const inlineTbody = activePage === 'panama' ? panamaPendingTbodyInline : portsPendingTbodyInline;
    
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
    
    // Get items based on active page
    const items = activePage === 'panama' ? pendingInspections : pendingDepartures;
    
    if (items.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3;
        cell.textContent = `No pending ${activePage === 'panama' ? 'inspections' : 'departures'}`;
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
        if (activePage === 'panama') {
            updateInspectionStatusIndicator(statusCell, item.status);
        } else {
            updatePortStatusIndicator(statusCell, item.status);
        }
        
        row.appendChild(statusCell);
        
        // Add context menu event
        row.addEventListener('contextmenu', handleRowContextMenu);
        
        tableBody.appendChild(row);
    });
}

// Update inspection status indicator
function updateInspectionStatusIndicator(cell, status) {
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
            cell.textContent = 'UWI Done';
            break;
        case INSPECTION_STATUSES.K9_ONGOING:
            cell.classList.add('status-k9-ongoing');
            cell.textContent = 'K9 Ongoing';
            break;
        case INSPECTION_STATUSES.K9_DONE:
            cell.classList.add('status-k9-done');
            cell.textContent = 'K9 Done';
            break;
        default:
            cell.textContent = '—';
            break;
    }
}

// Update port status indicator
function updatePortStatusIndicator(cell, status) {
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
            cell.textContent = 'UWI ✓';
            break;
        case INSPECTION_STATUSES.K9_ONGOING:
            cell.classList.add('status-k9-ongoing');
            cell.textContent = 'K9 Ongoing';
            break;
        case INSPECTION_STATUSES.K9_DONE:
            cell.classList.add('status-k9-done');
            cell.textContent = 'K9 ✓';
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
            showInspectionContextMenu(e.pageX, e.pageY, inspectionId);
        }
    } else {
        // Get departure ID
        const departureId = this.dataset.departureId;
        if (departureId) {
            showPortContextMenu(e.pageX, e.pageY, departureId);
        }
    }
}

// Show context menu for inspections
function showInspectionContextMenu(x, y, inspectionId) {
    // Remove any existing context menus
    removeContextMenu();
    
    // Create a new context menu
    const contextMenu = document.createElement('div');
    contextMenu.id = 'context-menu';
    contextMenu.className = 'context-menu';
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.dataset.inspectionId = inspectionId;
    contextMenu.dataset.type = 'inspection';
    
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

// Show context menu for ports
function showPortContextMenu(x, y, departureId) {
    // Remove any existing context menus
    removeContextMenu();
    
    // Create a new context menu
    const contextMenu = document.createElement('div');
    contextMenu.id = 'context-menu';
    contextMenu.className = 'context-menu';
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.dataset.departureId = departureId;
    contextMenu.dataset.type = 'port';
    
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
    if (!isLargeScreen) {
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
    // Save panama page data
    if (k9TextArea) localStorage.setItem('k9Text', k9TextArea.value);
    if (uwTextArea) localStorage.setItem('uwText', uwTextArea.value);
    localStorage.setItem('inspectionStatuses', JSON.stringify(inspectionStatuses));
    
    // Save ports page data
    if (brazilTextArea) localStorage.setItem('brazilText', brazilTextArea.value);
    if (mexicoTextArea) localStorage.setItem('mexicoText', mexicoTextArea.value);
    localStorage.setItem('portStatuses', JSON.stringify(portStatuses));
}

// Load text and status data from local storage
function loadSavedData() {
    // Load panama page data
    const savedK9Text = localStorage.getItem('k9Text');
    const savedUWText = localStorage.getItem('uwText');
    
    if (savedK9Text && k9TextArea) {
        k9TextArea.value = savedK9Text;
    }
    
    if (savedUWText && uwTextArea) {
        uwTextArea.value = savedUWText;
    }
    
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
    
    // Load ports page data
    const savedBrazilText = localStorage.getItem('brazilText');
    const savedMexicoText = localStorage.getItem('mexicoText');
    
    if (savedBrazilText && brazilTextArea) {
        brazilTextArea.value = savedBrazilText;
    }
    
    if (savedMexicoText && mexicoTextArea) {
        mexicoTextArea.value = savedMexicoText;
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
