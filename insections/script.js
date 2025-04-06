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

// Application state
let pendingInspections = [];
let blinkState = false;

// Initialize the application
function initApp() {
    loadSavedText();
    setupEventListeners();
    startTimers();
    syncScroll(k9TextArea, k9HighlightDiv);
    syncScroll(uwTextArea, uwHighlightDiv);
}

// Set up event listeners
function setupEventListeners() {
    // Text areas
    k9TextArea.addEventListener('input', () => {
        updatePendingInspections();
        saveText();
    });
    
    uwTextArea.addEventListener('input', () => {
        updatePendingInspections();
        saveText();
    });
    
    // Keyboard handling for tabs
    k9TextArea.addEventListener('keydown', handleTabKey);
    uwTextArea.addEventListener('keydown', handleTabKey);
    
    // Buttons
    checkBtn.addEventListener('click', compareTextAreas);
    pendingBtn.addEventListener('click', togglePendingModal);
    k9ClearBtn.addEventListener('click', () => { k9TextArea.value = ''; k9HighlightDiv.innerHTML = ''; saveText(); });
    uwClearBtn.addEventListener('click', () => { uwTextArea.value = ''; uwHighlightDiv.innerHTML = ''; saveText(); });
    k9CopyBtn.addEventListener('click', () => copyToClipboard(k9TextArea.value));
    uwCopyBtn.addEventListener('click', () => copyToClipboard(uwTextArea.value));
    
    // Modal
    closeModalBtn.addEventListener('click', togglePendingModal);
    window.addEventListener('click', (e) => {
        if (e.target === pendingModal) {
            togglePendingModal();
        }
    });
}

// Start timers for updating time and data
function startTimers() {
    // Update Panama time every second
    setInterval(updatePanamaTime, 1000);
    updatePanamaTime(); // Initial update
    
    // Update pending inspections every 10 seconds
    setInterval(updatePendingInspections, 10000);
    updatePendingInspections(); // Initial update
    
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
        
        return {
            ...inspection,
            hoursUntil,
            isPriority: hoursUntil < 12 && hoursUntil > 0,
            isUrgent: hoursUntil < 6 && hoursUntil > 0
        };
    });
    
    // Sort by ETD date
    pendingInspections.sort((a, b) => a.etdDate - b.etdDate);
    
    // Update display if modal is open
    if (!pendingModal.classList.contains('hidden')) {
        updatePendingTableDisplay();
    }
    
    // Update pending button appearance if there are urgent items
    if (pendingInspections.some(item => item.isUrgent)) {
        pendingBtn.innerHTML = 'Pending <span style="color: red;">⚠</span>';
    } else {
        pendingBtn.textContent = 'Pending';
    }
}

// Update pending table display
function updatePendingTableDisplay() {
    pendingTbody.innerHTML = '';
    
    if (pendingInspections.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 2;
        cell.textContent = 'No pending inspections';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        pendingTbody.appendChild(row);
        return;
    }
    
    pendingInspections.forEach(inspection => {
        const row = document.createElement('tr');
        
        // Apply styling based on priority
        if (inspection.isUrgent) {
            row.className = blinkState ? 'urgent-row' : '';
        } else if (inspection.isPriority) {
            row.className = 'priority-row';
        }
        
        // Description cell
        const descCell = document.createElement('td');
        descCell.style.fontFamily = 'monospace';
        descCell.textContent = inspection.description;
        row.appendChild(descCell);
        
        // Time left cell
        const timeCell = document.createElement('td');
        timeCell.style.textAlign = 'center';
        timeCell.textContent = formatTimeLeft(inspection.hoursUntil);
        row.appendChild(timeCell);
        
        pendingTbody.appendChild(row);
    });
}

// Format time left display
function formatTimeLeft(hoursUntil) {
    if (hoursUntil <= 0) return 'Overdue';
    
    const hours = Math.floor(hoursUntil);
    const minutes = Math.floor((hoursUntil - hours) * 60);
    
    return `${hours}h ${minutes}m`;
}

// Toggle pending modal
function togglePendingModal() {
    pendingModal.classList.toggle('hidden');
    
    if (!pendingModal.classList.contains('hidden')) {
        updatePendingTableDisplay();
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

// Save text to local storage
function saveText() {
    localStorage.setItem('k9Text', k9TextArea.value);
    localStorage.setItem('uwText', uwTextArea.value);
}

// Load text from local storage
function loadSavedText() {
    const savedK9Text = localStorage.getItem('k9Text');
    const savedUWText = localStorage.getItem('uwText');
    
    if (savedK9Text) {
        k9TextArea.value = savedK9Text;
    }
    
    if (savedUWText) {
        uwTextArea.value = savedUWText;
    }
    
    if (savedK9Text || savedUWText) {
        compareTextAreas();
    }
}

// Initialize the application when the page loads
window.addEventListener('DOMContentLoaded', initApp);
