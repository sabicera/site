// DOM Elements
const k9TextArea = document.getElementById('k9-textarea');
const uwTextArea = document.getElementById('uw-textarea');
const k9HighlightDiv = document.getElementById('k9-highlight');
const uwHighlightDiv = document.getElementById('uw-highlight');
const panamaTimeDisplay = document.getElementById('panama-time');
const checkBtn = document.getElementById('check-btn');
const pendingBtn = document.getElementById('pending-btn');
const k9ClearBtn = document.getElementById('k9-clear-btn');
const uwClearBtn = document.getElementById('uw-clear-btn');
const k9CopyBtn = document.getElementById('k9-copy-btn');
const uwCopyBtn = document.getElementById('uw-copy-btn');
const pendingModal = document.getElementById('pending-modal');
const closeModalBtn = document.getElementById('close-modal');
const pendingTbody = document.getElementById('pending-tbody');
const pendingPanel = document.getElementById('pending-panel');
const pendingTbodyInline = document.getElementById('pending-tbody-inline');

// Application state
let pendingInspections = [];
let blinkState = false;
let isLargeScreen = false;
// Object to store inspection statuses
let inspectionStatuses = {};

// Inspection status constants
const STATUSES = {
    NONE: 'none',
    UWI_ONGOING: 'uwi-ongoing',
    UWI_DONE: 'uwi-done',
    K9_ONGOING: 'k9-ongoing',
    K9_DONE: 'k9-done'
};

// Initialize the application
function initApp() {
    console.log("App initialization started");
    
    // Initialize theme first
    setupThemeToggle();
    
    // Check screen size first
    checkScreenSize();
    
    // Then load saved data and set up listeners
    loadSavedData();
    setupEventListeners();
    startTimers();
    syncScroll(k9TextArea, k9HighlightDiv);
    syncScroll(uwTextArea, uwHighlightDiv);
    
    // Update pending inspections initially
    updatePendingInspections();
    
    console.log("App initialization completed. Large screen:", isLargeScreen);
}

// Check screen size and update layout
function checkScreenSize() {
    isLargeScreen = window.innerWidth > 1200;
    console.log("Screen size check - Width:", window.innerWidth, "Is large screen:", isLargeScreen);
    
    if (isLargeScreen) {
        // Show the inline panel for large screens
        if (pendingPanel) {
            pendingPanel.style.display = 'flex';
            console.log("Showing pending panel for large screen");
        } else {
            console.error("Pending panel element not found");
        }
    } else {
        // Hide the inline panel for small screens
        if (pendingPanel) {
            pendingPanel.style.display = 'none';
            console.log("Hiding pending panel for small screen");
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    console.log("Setting up event listeners");
    
    // Text areas
    k9TextArea.addEventListener('input', () => {
        updatePendingInspections();
        saveData();
    });
    
    uwTextArea.addEventListener('input', () => {
        updatePendingInspections();
        saveData();
    });
    
    // Keyboard handling for tabs
    k9TextArea.addEventListener('keydown', handleTabKey);
    uwTextArea.addEventListener('keydown', handleTabKey);
    
    // Buttons
    checkBtn.addEventListener('click', compareTextAreas);
    pendingBtn.addEventListener('click', () => {
        console.log("Pending button clicked, isLargeScreen:", isLargeScreen);
        if (!isLargeScreen) {
            togglePendingModal();
        }
    });
    
    k9ClearBtn.addEventListener('click', () => { k9TextArea.value = ''; k9HighlightDiv.innerHTML = ''; saveData(); });
    uwClearBtn.addEventListener('click', () => { uwTextArea.value = ''; uwHighlightDiv.innerHTML = ''; saveData(); });
    k9CopyBtn.addEventListener('click', () => copyToClipboard(k9TextArea.value));
    uwCopyBtn.addEventListener('click', () => copyToClipboard(uwTextArea.value));
    
    // Modal
    closeModalBtn.addEventListener('click', togglePendingModal);
    window.addEventListener('click', (e) => {
        if (e.target === pendingModal) {
            togglePendingModal();
        }
    });
    
    // Window resize
    window.addEventListener('resize', () => {
        console.log("Window resized");
        checkScreenSize();
        updatePendingTableDisplay(); // Update tables when resizing
    });
    
    // Add our event listener for context menu creation
    document.addEventListener('click', handleContextMenuClick);
}

// Start timers for updating time and data
function startTimers() {
    // Update Panama time every second
    setInterval(updatePanamaTime, 1000);
    updatePanamaTime(); // Initial update
    
    // Update pending inspections every 10 seconds
    setInterval(updatePendingInspections, 10000);
    
    // Blink effect for urgent rows
    setInterval(() => {
        blinkState = !blinkState;
        updatePendingTableDisplay();
    }, 1000);
}

// Update Panama time display
function updatePanamaTime() {
    const now = new Date();
    const panamaOffset = -5; // UTC-5
    
    // Calculate Panama time
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const panamaTime = new Date(utcTime + (3600000 * panamaOffset));
    
    // Format: DD/MM HH:MM:SS
    const day = String(panamaTime.getDate()).padStart(2, '0');
    const month = String(panamaTime.getMonth() + 1).padStart(2, '0');
    const hours = String(panamaTime.getHours()).padStart(2, '0');
    const minutes = String(panamaTime.getMinutes()).padStart(2, '0');
    const seconds = String(panamaTime.getSeconds()).padStart(2, '0');
    
    panamaTimeDisplay.textContent = `${day}/${month} ${hours}:${minutes}:${seconds}`;
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

// Compare text areas and highlight differences
function compareTextAreas() {
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
    syncScrollAfterCompare();
}

// Synchronize scrolling between textarea and highlight div
function syncScroll(textArea, highlightDiv) {
    textArea.addEventListener('scroll', () => {
        highlightDiv.scrollTop = textArea.scrollTop;
        highlightDiv.scrollLeft = textArea.scrollLeft;
    });
}

// Additional synchronization after comparison
function syncScrollAfterCompare() {
    // Force synchronization after a short delay to ensure rendering is complete
    setTimeout(() => {
        k9HighlightDiv.scrollTop = k9TextArea.scrollTop;
        k9HighlightDiv.scrollLeft = k9TextArea.scrollLeft;
        uwHighlightDiv.scrollTop = uwTextArea.scrollTop;
        uwHighlightDiv.scrollLeft = uwTextArea.scrollLeft;
    }, 50);
}

// Escape HTML special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Parse ETD dates from text
function parseETDDates(text) {
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

// Update pending inspections list
function updatePendingInspections() {
    console.log("Updating pending inspections");
    
    const k9Inspections = parseETDDates(k9TextArea.value);
    const uwInspections = parseETDDates(uwTextArea.value);
    
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
        const inspectionId = generateInspectionId(inspection.description);
        
        return {
            ...inspection,
            id: inspectionId, // Add unique ID
            hoursUntil,
            isUpcoming: hoursUntil < 24 && hoursUntil > 0,
            isPriority: hoursUntil < 6 && hoursUntil > 0,
            isUrgent: hoursUntil < 2 && hoursUntil > 0,
            status: inspectionStatuses[inspectionId] || STATUSES.NONE // Add status from our tracking
        };
    });
    
    // Sort by ETD date
    pendingInspections.sort((a, b) => a.etdDate - b.etdDate);
    
    // Update both displays
    updatePendingTableDisplay();
    
    // Update pending button appearance if there are urgent items
    if (pendingInspections.some(item => item.isUrgent)) {
        pendingBtn.innerHTML = 'Pending <span style="color: red;">⚠</span>';
    } else {
        pendingBtn.textContent = 'Pending';
    }
    
    console.log("Found", pendingInspections.length, "pending inspections");
}

// Generate a unique ID for an inspection based on its description
function generateInspectionId(description) {
    // Remove spaces and special characters, convert to lowercase
    return description.trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
}

// Update pending table display for both modal and inline views
function updatePendingTableDisplay() {
    console.log("Updating table display. Modal table:", !!pendingTbody, "Inline table:", !!pendingTbodyInline);
    
    // Update modal table
    if (pendingTbody) {
        updateTableBody(pendingTbody);
    }
    
    // Update inline table if exists
    if (pendingTbodyInline) {
        updateTableBody(pendingTbodyInline);
    }
}

// Helper function to update a table body with pending data
function updateTableBody(tableBody) {
    tableBody.innerHTML = '';
    
    if (pendingInspections.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3; // Updated for status column
        cell.textContent = 'No pending inspections';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }
    
    pendingInspections.forEach(inspection => {
        const row = document.createElement('tr');
        row.dataset.inspectionId = inspection.id; // Store ID for reference
        
        // Apply styling based on priority
        if (inspection.hoursUntil <= 0) {
            row.className = 'overdue-row';
        } else if (inspection.isUrgent) {
            row.className = 'urgent-row';
            // Apply blinking effect only for urgent rows
            if (!blinkState) {
                row.style.opacity = '0.7';
            }
        } else if (inspection.isPriority) {
            row.className = 'priority-row';
        } else if (inspection.isUpcoming) {
            row.className = 'upcoming-row';
        }
        
        // Description cell - No text wrapping
        const descCell = document.createElement('td');
        descCell.style.fontFamily = 'monospace';
        descCell.style.whiteSpace = 'nowrap';
        descCell.textContent = inspection.description;
        row.appendChild(descCell);
        
        // Time left cell
        const timeCell = document.createElement('td');
        timeCell.style.textAlign = 'center';
        timeCell.style.whiteSpace = 'nowrap';
        timeCell.textContent = formatTimeLeft(inspection.hoursUntil);
        row.appendChild(timeCell);
        
        // Status cell - New!
        const statusCell = document.createElement('td');
        statusCell.style.textAlign = 'center';
        statusCell.style.whiteSpace = 'nowrap';
        statusCell.classList.add('status-cell');
        
        // Add status indicator based on current status
        updateStatusIndicator(statusCell, inspection.status);
        
        row.appendChild(statusCell);
        
        // Add context menu event
        row.addEventListener('contextmenu', handleRowContextMenu);
        
        tableBody.appendChild(row);
    });
}

// Update the status indicator in a cell
function updateStatusIndicator(cell, status) {
    // Clear existing content
    cell.innerHTML = '';
    cell.className = 'status-cell';
    
    // Add appropriate icon/text based on status
    switch(status) {
        case STATUSES.UWI_ONGOING:
            cell.classList.add('status-uwi-ongoing');
            cell.textContent = 'UWI Ongoing';
            break;
        case STATUSES.UWI_DONE:
            cell.classList.add('status-uwi-done');
            cell.textContent = 'UWI ✓';
            break;
        case STATUSES.K9_ONGOING:
            cell.classList.add('status-k9-ongoing');
            cell.textContent = 'K9 Ongoing';
            break;
        case STATUSES.K9_DONE:
            cell.classList.add('status-k9-done');
            cell.textContent = 'K9 ✓';
            break;
        default:
            cell.textContent = '—';
            break;
    }
}

// Handle right-click on a row to show context menu
function handleRowContextMenu(e) {
    e.preventDefault();
    
    // Get the inspection ID from the row
    const inspectionId = this.dataset.inspectionId;
    
    // Create a context menu
    showContextMenu(e.pageX, e.pageY, inspectionId);
}

// Show the custom context menu
function showContextMenu(x, y, inspectionId) {
    // Remove any existing context menus
    removeContextMenu();
    
    // Create a new context menu
    const contextMenu = document.createElement('div');
    contextMenu.id = 'inspection-context-menu';
    contextMenu.className = 'context-menu';
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.dataset.inspectionId = inspectionId;
    
    // Add menu items
    const menuItems = [
        { text: 'UWI Ongoing', status: STATUSES.UWI_ONGOING },
        { text: 'UWI Done', status: STATUSES.UWI_DONE },
        { text: 'K9 Ongoing', status: STATUSES.K9_ONGOING },
        { text: 'K9 Done', status: STATUSES.K9_DONE },
        { text: 'Clear Status', status: STATUSES.NONE }
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
        const inspectionId = this.dataset.inspectionId;
        const newStatus = e.target.dataset.status;
        
        // Update the status in our tracking object
        inspectionStatuses[inspectionId] = newStatus;
        
        // Update the inspection in pendingInspections
        const inspection = pendingInspections.find(insp => insp.id === inspectionId);
        if (inspection) {
            inspection.status = newStatus;
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
    if (!e.target.closest('#inspection-context-menu')) {
        removeContextMenu();
    }
}

// Remove the context menu
function removeContextMenu() {
    const contextMenu = document.getElementById('inspection-context-menu');
    if (contextMenu) {
        document.body.removeChild(contextMenu);
    }
    
    // Remove the document click listener
    document.removeEventListener('click', removeContextMenu);
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

// Toggle pending modal - Only for small screens
function togglePendingModal() {
    console.log("Toggle pending modal called, isLargeScreen:", isLargeScreen);
    
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
    localStorage.setItem('k9Text', k9TextArea.value);
    localStorage.setItem('uwText', uwTextArea.value);
    localStorage.setItem('inspectionStatuses', JSON.stringify(inspectionStatuses));
}

// Load text and status data from local storage
function loadSavedData() {
    // Load text data
    const savedK9Text = localStorage.getItem('k9Text');
    const savedUWText = localStorage.getItem('uwText');
    
    if (savedK9Text) {
        k9TextArea.value = savedK9Text;
    }
    
    if (savedUWText) {
        uwTextArea.value = savedUWText;
    }
    
    // Load inspection statuses
    const savedStatuses = localStorage.getItem('inspectionStatuses');
    if (savedStatuses) {
        try {
            inspectionStatuses = JSON.parse(savedStatuses);
        } catch (e) {
            console.error('Error parsing saved statuses:', e);
            inspectionStatuses = {};
        }
    }
    
    if (savedK9Text || savedUWText) {
        compareTextAreas();
    }
}

// Theme Toggle functionality
const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
const toggleLabel = document.querySelector('.toggle-label');

// Function to set theme
function setTheme(isDark) {
    if (isDark) {
        document.body.classList.remove('light-theme');
        toggleLabel.textContent = 'Dark Mode';
        localStorage.setItem('theme', 'dark');
        console.log("Theme set to dark mode");
    } else {
        document.body.classList.add('light-theme');
        toggleLabel.textContent = 'Light Mode';
        localStorage.setItem('theme', 'light');
        console.log("Theme set to light mode");
    }
}

// Initialize theme based on localStorage or default to dark
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const isDark = savedTheme === 'dark';
    
    console.log("Initializing theme from localStorage:", savedTheme);
    
    // Set checkbox state
    themeToggleCheckbox.checked = isDark;
    
    // Apply theme
    setTheme(isDark);
}

// Set up theme toggle
function setupThemeToggle() {
    // Add event listener for theme toggle
    themeToggleCheckbox.addEventListener('change', (e) => {
        setTheme(e.target.checked);
    });
    
    // Initialize theme
    initTheme();
}

// Initialize the application when the page loads
window.addEventListener('DOMContentLoaded', initApp);
