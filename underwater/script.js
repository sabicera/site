// Application state
let vessels = [];
let selectedRow = null;
let updateInterval = null;
let searchQuery = '';

// Ports categorized by region with timezones
const PORT_CATEGORIES = {
    'Panama': {
        ports: ['BALBOA', 'CRISTOBAL', 'COLON', 'RODMAN', 'MANZANILLO (PANAMA)', 'MANZANILLO', 'COLON ANCHORAGE', 'BALB ANCH','CRISTOBAL ANCHORAGE', 'BALBOA ANCHORAGE', 'BALB ANCH / PAN CAN', 'COLON INNER ANCHORAGE', 'CRISTOBAL ANCH'],
        timezone: 'America/Panama',
        offset: -5
    },
    'Brazil': {
        ports: ['SANTOS', 'PARANAGUA', 'RIO GRANDE', 'ITAJAI', 'NAVEGANTES', 'RIO DE JANEIRO', 'RDJ', 'SALVADOR', 'PECEM'],
        timezone: 'America/Sao_Paulo',
        offset: -3
    },
    'Freeport': {
        ports: ['FREEPORT'],
        timezone: 'America/Nassau',
        offset: -5
    },
    'Colombia': {
        ports: ['CARTAGENA'],
        timezone: 'America/Bogota',
        offset: -5
    },
    'Chile': {
        ports: ['LIRQUEN', 'SAN ANTONIO', 'VALPARAISO'],
        timezone: 'America/Santiago',
        offset: -3
    },
    'Costa Rica': {
        ports: ['MOIN'],
        timezone: 'America/Costa_Rica',
        offset: -6
    },
    'Europe': {
        ports: ['MALTA', 'HAMBURG', 'LE HAVRE', 'ANTWERP', 'ROTTERDAM', 'LAS PALMAS', 'VALENCIA','MARSAXLOKK',],
        timezone: 'Europe/Brussels',
        offset: 1
    },
    'Canary Islands': {
        ports: ['LAS PALMAS'],
        timezone: 'Atlantic/Canary',
        offset: 0
    }
};

// All ports flattened
const PORTS = Object.values(PORT_CATEGORIES).flatMap(region => region.ports);

// Get timezone offset for a port
function getPortTimezoneOffset(port) {
    if (!port) return 0;
    
    const portUpper = port.toUpperCase();
    
    for (const region in PORT_CATEGORIES) {
        const regionData = PORT_CATEGORIES[region];
        const foundPort = regionData.ports.find(p => 
            p.toUpperCase() === portUpper || 
            portUpper.includes(p.toUpperCase())
        );
        if (foundPort) {
            return regionData.offset;
        }
    }
    return 0; // Default to UTC if port not found
}

// Get port region name
function getPortRegion(port) {
    if (!port) return 'Unknown';
    
    const portUpper = port.toUpperCase();
    
    for (const region in PORT_CATEGORIES) {
        const regionData = PORT_CATEGORIES[region];
        const foundPort = regionData.ports.find(p => 
            p.toUpperCase() === portUpper || 
            portUpper.includes(p.toUpperCase())
        );
        if (foundPort) {
            return region;
        }
    }
    return 'Unknown';
}

// Inspection types
const INSPECTION_TYPES = ['K9', 'U/W', 'Both'];

// Vessel position options (physical status)
const VESSEL_POSITIONS = ['Not Berthed Yet', 'Anchorage', 'Berthed', 'Working', 'Sailed'];

// Status options (inspection status)
const STATUS_OPTIONS = ['Pending', 'K9 Ongoing', 'K9 Done', 'U/W Ongoing', 'U/W Done', 'Completed'];

// Initialize the application with error handling
function initApp() {
    try {
        setupThemeToggle();
        setupEventListeners();
        loadSavedData();
        renderVessels();
        updateFooter();
        startClock();
        startCountdownUpdates();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error initializing application: ' + error.message);
    }
}

// Theme toggle
function setupThemeToggle() {
    const checkbox = document.getElementById('theme-toggle-checkbox');
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isDark = savedTheme === 'dark';
    
    checkbox.checked = isDark;
    setTheme(isDark);
    
    checkbox.addEventListener('change', (e) => {
        setTheme(e.target.checked);
    });
}

function setTheme(isDark) {
    if (isDark) {
        document.body.classList.remove('light-theme');
        document.querySelector('.toggle-label').textContent = 'Dark Mode';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.add('light-theme');
        document.querySelector('.toggle-label').textContent = 'Light Mode';
        localStorage.setItem('theme', 'light');
    }
}

// Event listeners
function setupEventListeners() {
    // Helper function to safely add event listener
    const safeAddListener = (id, event, handler) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element not found: ${id}`);
        }
    };
    
    safeAddListener('import-btn', 'click', importExcel);
    safeAddListener('export-btn', 'click', exportExcel);
    safeAddListener('paste-btn', 'click', openPasteModal);
    safeAddListener('cleanup-btn', 'click', manualCleanup);
    safeAddListener('copy-k9-btn', 'click', () => copyVessels('K9'));
    safeAddListener('copy-uw-btn', 'click', () => copyVessels('U/W'));
    safeAddListener('add-row-btn', 'click', addNewRow);
    //safeAddListener('clear-all-btn', 'click', clearAllVessels);
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    
    if (searchInput && clearSearchBtn) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
            renderVessels();
        });
        
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.style.display = 'none';
            renderVessels();
        });
    }
    
    document.addEventListener('click', hideContextMenu);
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Start countdown updates
function startCountdownUpdates() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(() => {
        updateCountdowns();
    }, 1000);
}

function updateCountdowns() {
    vessels.forEach(vessel => {
        if (vessel.etd) {
            vessel.timeLeft = calculateTimeLeft(vessel.etd, vessel.port);
        }
    });
    // Update only the time left cells without re-rendering entire table
    vessels.forEach(vessel => {
        const row = document.querySelector(`tr[data-id="${vessel.id}"]`);
        if (row && vessel.timeLeft) {
            const timeCell = row.querySelector('.time-left-cell');
            if (timeCell) {
                timeCell.innerHTML = `<span class="${vessel.timeLeft.overdue ? 'overdue' : 'countdown'}">${vessel.timeLeft.text}</span>`;
            }
        }
    });
}

function calculateTimeLeft(etdString, port) {
    if (!etdString) return null;
    
    // Split the datetime string
    const parts = etdString.split('T');
    if (parts.length !== 2) return null;
    
    const dateParts = parts[0].split('-');
    const timeParts = parts[1].split(':');
    
    // Create date in UTC, then adjust for port timezone
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    const etdAsUTC = Date.UTC(year, month, day, hour, minute, 0);
    const portOffset = getPortTimezoneOffset(port);
    const etdUTC = etdAsUTC - (portOffset * 60 * 60 * 1000);
    
    // Get current UTC time
    const nowUTC = Date.now();
    
    // Calculate difference
    const diff = etdUTC - nowUTC;
    
    if (diff < 0) {
        const absDiff = Math.abs(diff);
        const hours = Math.floor(absDiff / (1000 * 60 * 60));
        const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
        return { 
            overdue: true, 
            hours, 
            minutes, 
            text: `Overdue ${hours}h ${minutes}m`,
            portOffset: portOffset
        };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    let text = '';
    if (days > 0) text += `${days}d `;
    text += `${hours}h ${minutes}m`;
    
    return { 
        overdue: false, 
        days, 
        hours, 
        minutes, 
        text,
        portOffset: portOffset
    };
}

// Add new row
function addNewRow() {
    const newVessel = {
        id: Date.now(),
        vesselName: '',
        port: '',
        inspectionType: 'None',
        etd: '',
        vesselPosition: '',
        status: 'Pending',
        notes: '',
        timeLeft: null
    };
    
    vessels.push(newVessel);
    renderVessels();
    saveData();
    
    setTimeout(() => {
        const lastRow = document.querySelector(`tr[data-id="${newVessel.id}"]`);
        if (lastRow) {
            const vesselInput = lastRow.querySelector('.cell-content[data-field="vesselName"]');
            if (vesselInput) vesselInput.focus();
        }
    }, 100);
}

// Render vessels with categorization
function renderVessels() {
    const tbody = document.getElementById('vessel-tbody');
    tbody.innerHTML = '';
    
    // Clean up invalid vessels first
    validateAndCleanVessels();
    
    if (vessels.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <h3>No vessels added yet</h3>
                    <p>Click "Paste Vessels" to import from Monday.com, "Import Excel", or "Add Row" to start</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort vessels by ETD (soonest first)
    let sortedVessels = [...vessels].sort((a, b) => {
        if (!a.etd && !b.etd) return 0;
        if (!a.etd) return 1;
        if (!b.etd) return -1;
        return new Date(a.etd) - new Date(b.etd);
    });
    
    // Filter by search query (only if searchQuery is defined and not empty)
    if (typeof searchQuery !== 'undefined' && searchQuery) {
        sortedVessels = sortedVessels.filter(v => {
            const searchLower = searchQuery.toLowerCase();
            return (
                (v.vesselName && v.vesselName.toLowerCase().includes(searchLower)) ||
                (v.port && v.port.toLowerCase().includes(searchLower)) ||
                (v.notes && v.notes.toLowerCase().includes(searchLower))
            );
        });
        
        if (sortedVessels.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="empty-state">
                        <h3>No vessels found</h3>
                        <p>No vessels match "${searchQuery}". Try a different search term.</p>
                    </td>
                </tr>
            `;
            return;
        }
    }
    
    // Group by category
    const categorized = {
        'Urgent (< 24h)': [],
        'Soon (< 72h)': [],
        'Upcoming': [],
        'Overdue': []
    };
    
    sortedVessels.forEach(vessel => {
        if (vessel.timeLeft) {
            if (vessel.timeLeft.overdue) {
                categorized['Overdue'].push(vessel);
            } else {
                const totalHours = (vessel.timeLeft.days * 24) + vessel.timeLeft.hours;
                if (totalHours < 24) {
                    categorized['Urgent (< 24h)'].push(vessel);
                } else if (totalHours < 72) {
                    categorized['Soon (< 72h)'].push(vessel);
                } else {
                    categorized['Upcoming'].push(vessel);
                }
            }
        } else {
            categorized['Upcoming'].push(vessel);
        }
    });
    
    // Render each category
    let rowNum = 1;
    Object.entries(categorized).forEach(([category, categoryVessels]) => {
        if (categoryVessels.length > 0) {
            // Category header
            const headerRow = document.createElement('tr');
            headerRow.className = 'category-header';
            headerRow.innerHTML = `
                <td colspan="10" class="category-title">
                    <strong>${category}</strong> (${categoryVessels.length} vessel${categoryVessels.length > 1 ? 's' : ''})
                </td>
            `;
            tbody.appendChild(headerRow);
            
            // Vessel rows
            categoryVessels.forEach(vessel => {
                const row = createTableRow(vessel, rowNum++);
                tbody.appendChild(row);
            });
        }
    });
    
    updateFooter();
}

// Validate and clean vessels array
function validateAndCleanVessels() {
    const originalCount = vessels.length;
    
    vessels = vessels.filter(vessel => {
        // Must have a vessel name (at least 2 characters)
        if (!vessel.vesselName || vessel.vesselName.trim().length < 2) {
            console.log('Removing vessel: no valid name');
            return false;
        }
        
        // Must have BOTH port AND ETD - remove if both are missing
        const hasPort = vessel.port && vessel.port.trim().length > 0 && 
                       vessel.port !== '-- Select Port --' && 
                       vessel.port !== '';
        const hasETD = vessel.etd && vessel.etd.trim().length > 0;
        
        // Only remove if vessel has NO port AND NO ETD
        if (!hasPort && !hasETD) {
            console.log(`Removing vessel ${vessel.vesselName}: missing both port and ETD`);
            return false;
        }
        
        return true;
    });
    
    const removedCount = originalCount - vessels.length;
    if (removedCount > 0) {
        console.log(`Cleaned up ${removedCount} invalid vessel(s)`);
    }
    
    return removedCount;
}

// Create a table row
function createTableRow(vessel, index) {
    const row = document.createElement('tr');
    row.dataset.id = vessel.id;
    row.dataset.inspection = vessel.inspectionType;
    
    // Add priority class
    if (vessel.timeLeft) {
        if (vessel.timeLeft.overdue) {
            row.classList.add('overdue-row');
        } else {
            const totalHours = (vessel.timeLeft.days * 24) + vessel.timeLeft.hours;
            
            // Flash red if less than 3 hours
            if (totalHours < 3) {
                row.classList.add('urgent-row', 'flash-red');
            }
            // Flash yellow if less than 8 hours
            else if (totalHours < 8) {
                row.classList.add('priority-row', 'flash-yellow');
            }
            // Regular urgent (< 24h)
            else if (totalHours < 24) {
                row.classList.add('urgent-row');
            }
            // Soon (< 72h)
            else if (totalHours < 72) {
                row.classList.add('priority-row');
            }
        }
    }
    
    // Row number
    const numCell = document.createElement('td');
    numCell.className = 'cell-number';
    numCell.textContent = index;
    row.appendChild(numCell);
    
    // Vessel Name with link
    const vesselCell = document.createElement('td');
    const vesselInput = createEditableCell('vesselName', vessel.vesselName, 'text', vessel.id);
    
    // Apply vessel link if in database
    if (vessel.vesselName && window.formatVesselNameWithLink) {
        const formattedHtml = window.formatVesselNameWithLink(vessel.vesselName);
        if (formattedHtml !== vessel.vesselName && formattedHtml.includes('<a')) {
            vesselCell.innerHTML = formattedHtml;
            vesselCell.classList.add('vessel-cell');
            vesselCell.addEventListener('dblclick', () => {
                vesselCell.innerHTML = '';
                vesselCell.appendChild(vesselInput);
                vesselInput.focus();
            });
        } else {
            vesselCell.appendChild(vesselInput);
        }
    } else {
        vesselCell.appendChild(vesselInput);
    }
    row.appendChild(vesselCell);
    
    // Port
    const portCell = document.createElement('td');
    const portSelect = createSelectCell('port', vessel.port, PORTS, vessel.id);
    portCell.appendChild(portSelect);
    row.appendChild(portCell);
    
    // Inspection Type
    const inspectionCell = document.createElement('td');
    const inspectionSelect = createSelectCell('inspectionType', vessel.inspectionType, INSPECTION_TYPES, vessel.id);
    inspectionCell.appendChild(inspectionSelect);
    row.appendChild(inspectionCell);
    
    // ETD
    const etdCell = document.createElement('td');
    const etdInput = createEditableCell('etd', vessel.etd, 'datetime-local', vessel.id);
    etdCell.appendChild(etdInput);
    row.appendChild(etdCell);
    
    // Time Left (calculated, read-only)
    const timeLeftCell = document.createElement('td');
    timeLeftCell.className = 'time-left-cell';
    if (vessel.timeLeft) {
        timeLeftCell.innerHTML = `<span class="${vessel.timeLeft.overdue ? 'overdue' : 'countdown'}">${vessel.timeLeft.text}</span>`;
    } else {
        timeLeftCell.textContent = '--';
    }
    row.appendChild(timeLeftCell);
    
    // Vessel Position
    const positionCell = document.createElement('td');
    const positionSelect = createSelectCell('vesselPosition', vessel.vesselPosition, VESSEL_POSITIONS, vessel.id);
    positionCell.appendChild(positionSelect);
    row.appendChild(positionCell);
    
    // Status (inspection status)
    const statusCell = document.createElement('td');
    const statusSelect = createSelectCell('status', vessel.status, STATUS_OPTIONS, vessel.id);
    statusCell.appendChild(statusSelect);
    row.appendChild(statusCell);
    
    // Notes
    const notesCell = document.createElement('td');
    const notesInput = createEditableCell('notes', vessel.notes, 'text', vessel.id);
    notesCell.appendChild(notesInput);
    row.appendChild(notesCell);
    
    // Actions
    const actionsCell = document.createElement('td');
    actionsCell.innerHTML = `<button class="btn btn-danger btn-small" onclick="deleteRow(${vessel.id})">🗑️</button>`;
    row.appendChild(actionsCell);
    
    row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, vessel.id);
    });
    
    return row;
}

// Create editable cell
function createEditableCell(field, value, type, vesselId) {
    const input = document.createElement('input');
    input.type = type;
    input.className = 'cell-content';
    input.value = value || '';
    input.dataset.field = field;
    input.dataset.vesselId = vesselId;
    
    input.addEventListener('change', (e) => {
        updateVesselField(vesselId, field, e.target.value);
    });
    
    return input;
}

// Create select dropdown cell
function createSelectCell(field, value, options, vesselId) {
    const select = document.createElement('select');
    select.className = 'cell-content';
    select.dataset.field = field;
    select.dataset.vesselId = vesselId;
    
    if (field === 'port') {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Select Port --';
        select.appendChild(emptyOption);
    }
    
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        if (option === value) opt.selected = true;
        select.appendChild(opt);
    });
    
    select.addEventListener('change', (e) => {
        updateVesselField(vesselId, field, e.target.value);
    });
    
    return select;
}

// Update vessel field
function updateVesselField(vesselId, field, value) {
    const vessel = vessels.find(v => v.id === vesselId);
    if (vessel) {
        vessel[field] = value;
        // Recalculate time left if ETD or port changes
        if (field === 'etd' || field === 'port') {
            if (vessel.etd) {
                vessel.timeLeft = calculateTimeLeft(vessel.etd, vessel.port);
            }
        }
        saveData();
        renderVessels();
    }
}

// Delete row
function deleteRow(vesselId) {
    if (confirm('Delete this vessel?')) {
        vessels = vessels.filter(v => v.id !== vesselId);
        renderVessels();
        saveData();
    }
}

// Duplicate, move functions
function duplicateRow(vesselId) {
    const vessel = vessels.find(v => v.id === vesselId);
    if (vessel) {
        vessels.push({ ...vessel, id: Date.now() });
        renderVessels();
        saveData();
    }
}

function moveRowUp(vesselId) {
    const index = vessels.findIndex(v => v.id === vesselId);
    if (index > 0) {
        [vessels[index], vessels[index - 1]] = [vessels[index - 1], vessels[index]];
        renderVessels();
        saveData();
    }
}

function moveRowDown(vesselId) {
    const index = vessels.findIndex(v => v.id === vesselId);
    if (index < vessels.length - 1) {
        [vessels[index], vessels[index + 1]] = [vessels[index + 1], vessels[index]];
        renderVessels();
        saveData();
    }
}

// Context menu
function showContextMenu(event, vesselId) {
    const menu = document.getElementById('context-menu');
    menu.classList.remove('hidden');
    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;
    
    const newMenu = menu.cloneNode(true);
    menu.parentNode.replaceChild(newMenu, menu);
    
    newMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            handleContextMenuAction(item.dataset.action, vesselId);
            hideContextMenu();
        });
    });
}

function hideContextMenu() {
    document.getElementById('context-menu').classList.add('hidden');
}

function handleContextMenuAction(action, vesselId) {
    switch(action) {
        case 'edit':
            const row = document.querySelector(`tr[data-id="${vesselId}"]`);
            if (row) row.querySelector('.cell-content')?.focus();
            break;
        case 'duplicate': duplicateRow(vesselId); break;
        case 'delete': deleteRow(vesselId); break;
        case 'move-up': moveRowUp(vesselId); break;
        case 'move-down': moveRowDown(vesselId); break;
    }
}

// Copy vessels by inspection type
function copyVessels(inspectionType) {
    const filtered = vessels.filter(v => {
        const matchesType = v.inspectionType === inspectionType || v.inspectionType === 'Both';
        const isPanama = ['BALBOA', 'CRISTOBAL', 'COLON', 'RODMAN', 'MANZANILLO (PANAMA)', 'MANZANILLO', 'COLON ANCHORAGE', 'BALB ANCH','CRISTOBAL ANCHORAGE', 'BALBOA ANCHORAGE', 'BALB ANCH / PAN CAN', 'COLON INNER ANCHORAGE', 'CRISTOBAL ANCH'].includes(v.port);
        return matchesType && isPanama;
    });
    
    if (filtered.length === 0) {
        alert(`No ${inspectionType} vessels in Panama ports.`);
        return;
    }
    
    // Sort by time left (soonest first)
    filtered.sort((a, b) => {
        if (!a.timeLeft && !b.timeLeft) return 0;
        if (!a.timeLeft) return 1;
        if (!b.timeLeft) return -1;
        
        // If overdue, put at the top
        if (a.timeLeft.overdue && !b.timeLeft.overdue) return -1;
        if (!a.timeLeft.overdue && b.timeLeft.overdue) return 1;
        
        // Sort by total time in milliseconds
        const aTotalMs = (a.timeLeft.days * 24 * 60 * 60 * 1000) + 
            (a.timeLeft.hours * 60 * 60 * 1000) + 
            (a.timeLeft.minutes * 60 * 1000);
        
        const bTotalMs = (b.timeLeft.days * 24 * 60 * 60 * 1000) + 
            (b.timeLeft.hours * 60 * 60 * 1000) + 
            (b.timeLeft.minutes * 60 * 1000);
        
        return aTotalMs - bTotalMs;
    });
    
    const text = filtered.map(v => {
        let etdText = 'N/A';
        
        if (v.etd) {
            const etdDate = new Date(v.etd);
            const day = String(etdDate.getDate()).padStart(2, '0');
            const month = String(etdDate.getMonth() + 1).padStart(2, '0');
            const hours = String(etdDate.getHours()).padStart(2, '0');
            const minutes = String(etdDate.getMinutes()).padStart(2, '0');
            etdText = `${day}/${month} ${hours}:${minutes}`;
        }
        
        const timeLeftText = v.timeLeft ? ` (${v.timeLeft.text})` : '';
        return `${v.vesselName} - ${v.port} - ETD: ${etdText}${timeLeftText}`;
    }).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification(`Copied ${filtered.length} ${inspectionType} vessel(s)!`);
    }).catch(() => alert('Failed to copy'));
}

// Paste Modal
function openPasteModal() {
    document.getElementById('paste-modal').classList.remove('hidden');
    document.getElementById('paste-textarea').value = '';
    document.getElementById('paste-textarea').focus();
}

function closePasteModal() {
    document.getElementById('paste-modal').classList.add('hidden');
}

function processPastedVessels() {
    const textarea = document.getElementById('paste-textarea');
    const text = textarea.value.trim();
    
    if (!text) {
        alert('Please paste vessel data first.');
        return;
    }
    
    const inspectionType = document.querySelector('input[name="inspection-type"]:checked').value;
    const lines = text.split('\n').filter(line => line.trim());
    const newVessels = [];
    
    lines.forEach(line => {
        const vessel = parseMondayBoardLine(line, inspectionType);
        if (vessel) newVessels.push(vessel);
    });
    
    if (newVessels.length === 0) {
        alert('No valid vessel data found.');
        return;
    }
    
    vessels.push(...newVessels);
    renderVessels();
    saveData();
    closePasteModal();
    showNotification(`Added ${newVessels.length} vessel(s)!`);
}

function parseMondayBoardLine(line, inspectionType) {
    line = line.trim();
    
    // Skip header rows and empty lines
    if (!line || 
        line.includes('VESSELS SAILING') || 
        line.includes('UPCOMING INSPECTIONS') ||
        line.includes('Name') ||
        line.includes('Subtitles') ||
        line.length < 3) {
        return null;
    }
    
    const vessel = {
        id: Date.now() + Math.random(),
        vesselName: '',
        port: '',
        inspectionType: inspectionType,
        etd: '',
        vesselPosition: '',
        status: 'Pending',
        notes: '',
        timeLeft: null
    };
    
    // Split by tabs (Excel copy paste format)
    const parts = line.split('\t').map(p => p.trim());
    
    // First column is usually the vessel name
    if (parts.length > 0 && parts[0]) {
        vessel.vesselName = parts[0].toUpperCase();
        
        // Column 11 is "Text" - extract notes
        if (parts.length > 11 && parts[11]) {
            vessel.notes = parts[11];
        }
        
        // Find port column (usually "Port of Inspection")
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part) {
                // Check if this part matches a known port
                const portMatch = PORTS.find(port => 
                    part.toUpperCase() === port.toUpperCase() ||
                    part.toUpperCase().includes(port.toUpperCase())
                );
                if (portMatch && !vessel.port) {
                    vessel.port = portMatch;
                }
                
                // Check for vessel position
                if (part.toUpperCase().includes('ANCHORAGE')) {
                    vessel.vesselPosition = 'Anchorage';
                } else if (part.toUpperCase().includes('NOT BERTHED')) {
                    vessel.vesselPosition = 'Not Berthed Yet';
                } else if (part.toUpperCase().includes('BERTHED')) {
                    vessel.vesselPosition = 'Berthed';
                } else if (part.toUpperCase().includes('WORKING')) {
                    vessel.vesselPosition = 'Working';
                } else if (part.toUpperCase().includes('SAILED')) {
                    vessel.vesselPosition = 'Sailed';
                }
            }
        }
        
        // Look for date in any column - try multiple formats
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part && !vessel.etd) {
                // Try YYYY-MM-DD format
                let dateMatch = part.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
                if (dateMatch) {
                    const year = dateMatch[1];
                    const month = dateMatch[2].padStart(2, '0');
                    const day = dateMatch[3].padStart(2, '0');
                    vessel.etd = `${year}-${month}-${day}T00:00`;
                    continue;
                }
                
                // Try "DD Mon" or "DD Mon, YYYY" format (e.g., "26 Dec" or "2 Jan, 2026")
                dateMatch = part.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:,?\s+(\d{4}))?/i);
                if (dateMatch) {
                    const day = dateMatch[1].padStart(2, '0');
                    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    const monthIndex = monthNames.findIndex(m => 
                        dateMatch[2].toLowerCase().startsWith(m.toLowerCase())
                    );
                    const month = (monthIndex + 1).toString().padStart(2, '0');
                    const year = dateMatch[3] || new Date().getFullYear();
                    vessel.etd = `${year}-${month}-${day}T00:00`;
                    continue;
                }
            }
        }
        
        // Look for ETD in "Updated ETD from Agent" column which has format like "ETD 27/12 19:00 (USA)"
        const fullLine = line.toUpperCase();
        const etdMatch = fullLine.match(/ETD\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2}):(\d{2})/);
        if (etdMatch && !vessel.etd) {
            const day = etdMatch[1].padStart(2, '0');
            const month = etdMatch[2].padStart(2, '0');
            let year = etdMatch[3] || new Date().getFullYear().toString();
            if (year.length === 2) year = '20' + year;
            const hours = etdMatch[4].padStart(2, '0');
            const minutes = etdMatch[5].padStart(2, '0');
            vessel.etd = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        
        if (vessel.etd) {
            vessel.timeLeft = calculateTimeLeft(vessel.etd, vessel.port);
        }
        
        return vessel;
    }
    
    return null;
}

function parseETDToDatetime(etdString) {
    const parts = etdString.split(' ');
    const datePart = parts[0];
    const timePart = parts[1] || '00:00';
    
    const dateMatch = datePart.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (!dateMatch) return '';
    
    let day = dateMatch[1].padStart(2, '0');
    let month = dateMatch[2].padStart(2, '0');
    let year = dateMatch[3] || new Date().getFullYear();
    
    if (year.toString().length === 2) {
        year = '20' + year;
    }
    
    return `${year}-${month}-${day}T${timePart}`;
}

// Clear all
function clearAllVessels() {
    if (vessels.length === 0) return;
    if (confirm(`Delete all ${vessels.length} vessels?`)) {
        vessels = [];
        renderVessels();
        saveData();
        showNotification('All vessels cleared!');
    }
}

// Manual cleanup - removes vessels without name, port, or ETD
function manualCleanup() {
    if (vessels.length === 0) {
        alert('No vessels to clean up.');
        return;
    }
    
    const removedCount = validateAndCleanVessels();
    
    if (removedCount > 0) {
        saveData();
        renderVessels();
        showNotification(`Removed ${removedCount} incomplete vessel(s)!`);
    } else {
        showNotification('All vessels are valid - nothing to clean up!');
    }
}

// Import/Export Excel
function importExcel() {
    const input = document.getElementById('excel-file-input');
    input.click();
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                
                let allVessels = [];
                
                // Process all sheets
                workbook.SheetNames.forEach(sheetName => {
                    console.log(`Processing sheet: ${sheetName}`);
                    const sheet = workbook.Sheets[sheetName];
                    
                    // Get all data as array of arrays (raw format)
                    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                    
                    console.log(`Total rows in sheet: ${rawData.length}`);
                    
                    // Find the header row (contains "Name" or "Vessel Name")
                    let headerIndex = -1;
                    let headers = [];
                    let isOwnFormat = false;
                    
                    for (let i = 0; i < rawData.length; i++) {
                        const row = rawData[i];
                        // Check for our own export format
                        if (row[1] === 'Vessel Name') {
                            headerIndex = i;
                            headers = row;
                            isOwnFormat = true;
                            console.log(`Found our export format header at row ${i}:`, headers);
                            break;
                        }
                        // Check for Monday.com format
                        else if (row[0] === 'Name') {
                            headerIndex = i;
                            headers = row;
                            isOwnFormat = false;
                            console.log(`Found Monday.com format header at row ${i}:`, headers);
                            break;
                        }
                    }
                    
                    if (headerIndex === -1) {
                        console.log('No header row found in sheet');
                        return;
                    }
                    
                    // Find column indices based on format
                    let nameCol, dateCol, statusCol, vesselPosCol, portCol, updatedEtdCol, textCol, inspectionTypeCol;
                    
                    if (isOwnFormat) {
                        // Our export format
                        nameCol = headers.indexOf('Vessel Name');
                        portCol = headers.indexOf('Port');
                        inspectionTypeCol = headers.indexOf('Inspection Type');
                        dateCol = headers.indexOf('ETD');
                        vesselPosCol = headers.indexOf('Vessel Position');
                        statusCol = headers.indexOf('Status');
                        textCol = headers.indexOf('Notes');
                        updatedEtdCol = -1; // Not used in our format
                    } else {
                        // Monday.com format
                        nameCol = headers.indexOf('Name');
                        dateCol = headers.indexOf('Date');
                        statusCol = headers.indexOf('Status');
                        vesselPosCol = headers.indexOf('Vessel Position');
                        portCol = headers.indexOf('Port of Inspection');
                        updatedEtdCol = headers.indexOf('Updated ETD from Agent');
                        textCol = headers.indexOf('Text');
                        inspectionTypeCol = -1; // Not in Monday.com format
                    }
                    
                    console.log('Column indices:', {
                        format: isOwnFormat ? 'Our Export' : 'Monday.com',
                        name: nameCol,
                        port: portCol,
                        inspectionType: inspectionTypeCol,
                        date: dateCol,
                        vesselPos: vesselPosCol,
                        status: statusCol,
                        updatedEtd: updatedEtdCol,
                        text: textCol
                    });
                    
                    // Process data rows (after header)
                    for (let i = headerIndex + 1; i < rawData.length; i++) {
                        const row = rawData[i];
                        const vesselName = row[nameCol];
                        
                        // Skip empty rows or section headers
                        if (!vesselName || 
                            typeof vesselName !== 'string' ||
                            vesselName.length < 2 ||
                            vesselName.includes('VESSELS SAILING') ||
                            vesselName.includes('UPCOMING') ||
                            vesselName.includes('UWI & K9')) {
                            continue;
                        }
                        
                        const vessel = {
                            id: Date.now() + Math.random(),
                            vesselName: vesselName.toUpperCase().trim(),
                            port: '',
                            inspectionType: 'Both', // Default, will be updated if available
                            etd: '',
                            vesselPosition: '',
                            status: 'Pending',
                            notes: '',
                            timeLeft: null
                        };
                        
                        // Get port
                        const port = row[portCol];
                        if (port && typeof port === 'string') {
                            vessel.port = port.toUpperCase().trim();
                        }
                        
                        // Get inspection type (if available in our export format)
                        if (inspectionTypeCol >= 0) {
                            const inspectionType = row[inspectionTypeCol];
                            if (inspectionType && typeof inspectionType === 'string') {
                                vessel.inspectionType = inspectionType.trim();
                            }
                        }
                        
                        // Get vessel position
                        if (vesselPosCol >= 0) {
                            const vesselPos = row[vesselPosCol];
                            if (vesselPos && typeof vesselPos === 'string') {
                                vessel.vesselPosition = vesselPos.trim();
                            } else if (vesselPos === null || vesselPos === undefined) {
                                vessel.vesselPosition = '';
                            }
                        }
                        
                        // Get status
                        if (statusCol >= 0) {
                            const statusValue = row[statusCol];
                            if (statusValue && typeof statusValue === 'string') {
                                vessel.status = statusValue.trim();
                            }
                        }
                        
                        // Get ETD - priority to "Updated ETD from Agent" for Monday.com, or "ETD" for our format
                        let etdValue = updatedEtdCol >= 0 ? (row[updatedEtdCol] || row[dateCol]) : row[dateCol];
                        
                        if (etdValue) {
                            // Handle ISO format from our export (e.g., "2025-12-27T19:00")
                            if (typeof etdValue === 'string' && etdValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
                                vessel.etd = etdValue;
                            }
                            // Handle "ETD DD/MM HH:MM" format from Monday.com
                            else if (typeof etdValue === 'string') {
                                // Remove leading dash and spaces
                                etdValue = etdValue.trim().replace(/^-\s*/, '');
                                
                                const etdMatch = etdValue.match(/ETD\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2}):(\d{2})/);
                                if (etdMatch) {
                                    const day = etdMatch[1].padStart(2, '0');
                                    const month = etdMatch[2].padStart(2, '0');
                                    let year = etdMatch[3] || new Date().getFullYear().toString();
                                    if (year.length === 2) year = '20' + year;
                                    const hours = etdMatch[4].padStart(2, '0');
                                    const minutes = etdMatch[5].padStart(2, '0');
                                    vessel.etd = `${year}-${month}-${day}T${hours}:${minutes}`;
                                }
                            } 
                            // Handle Date object
                            else if (etdValue instanceof Date || typeof etdValue === 'object') {
                                try {
                                    const date = new Date(etdValue);
                                    if (!isNaN(date.getTime())) {
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        vessel.etd = `${year}-${month}-${day}T00:00`;
                                    }
                                } catch (e) {
                                    console.error('Date conversion error:', e);
                                }
                            }
                        }
                        
                        // Get notes from Text/Notes column
                        if (textCol >= 0) {
                            const textNotes = row[textCol];
                            if (textNotes && typeof textNotes === 'string') {
                                vessel.notes = textNotes.trim();
                            }
                        }
                        
                        // Calculate time left
                        if (vessel.etd) {
                            vessel.timeLeft = calculateTimeLeft(vessel.etd, vessel.port);
                        }
                        
                        allVessels.push(vessel);
                        console.log('Added vessel:', vessel.vesselName, vessel.port, vessel.etd, vessel.vesselPosition, vessel.status);
                    }
                });
                
                console.log(`Total vessels imported: ${allVessels.length}`);
                
                if (allVessels.length === 0) {
                    alert('No valid vessel data found in the Excel file.\n\nMake sure the file has:\n- A row with "Name" in the first column\n- Vessel data in rows below the header');
                    return;
                }
                
                if (confirm(`Import ${allVessels.length} vessels from Excel?\n\nThis will replace all current data.`)) {
                    vessels = allVessels;
                    renderVessels();
                    saveData();
                    showNotification(`Successfully imported ${allVessels.length} vessels!`);
                }
            } catch (err) {
                alert('Error reading Excel file:\n' + err.message);
                console.error('Import error:', err);
            }
        };
        
        reader.readAsArrayBuffer(file);
        input.value = '';
    };
}

function exportExcel() {
    if (vessels.length === 0) {
        alert('No data to export!');
        return;
    }
    
    const exportData = vessels.map((v, i) => ({
        '#': i + 1,
        'Vessel Name': v.vesselName,
        'Port': v.port,
        'Inspection Type': v.inspectionType,
        'ETD': v.etd,
        'Time Left': v.timeLeft ? v.timeLeft.text : '',
        'Vessel Position': v.vesselPosition,
        'Status': v.status,
        'Notes': v.notes
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vessels');
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Vessel_Inspections_${date}.xlsx`);
    showNotification('Excel exported!');
}

function formatExcelDate(excelDate) {
    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date.toISOString().slice(0, 16);
    }
    return excelDate;
}

// Footer
function updateFooter() {
    const rowCountEl = document.getElementById('row-count');
    const k9CountEl = document.getElementById('k9-count');
    const uwCountEl = document.getElementById('uw-count');
    
    if (rowCountEl) rowCountEl.textContent = `Total Vessels: ${vessels.length}`;
    
    const k9 = vessels.filter(v => v.inspectionType === 'K9' || v.inspectionType === 'Both').length;
    const uw = vessels.filter(v => v.inspectionType === 'U/W' || v.inspectionType === 'Both').length;
    
    if (k9CountEl) k9CountEl.textContent = `K9: ${k9}`;
    if (uwCountEl) uwCountEl.textContent = `U/W: ${uw}`;
}

// Clock - show multiple timezones
function startClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    
    // Get UTC time components
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth();
    const utcDay = now.getUTCDate();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    
    // Helper function to format time
    const formatTime = (offsetHours) => {
        const localDate = new Date(Date.UTC(utcYear, utcMonth, utcDay, utcHours + offsetHours, utcMinutes));
        const hours = String(localDate.getUTCHours()).padStart(2, '0');
        const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };
    
    // Helper function to safely update clock element
    const updateClockElement = (id, text) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    };
    
    // Update each timezone clock
    updateClockElement('panama-time', `🇵🇦 Panama: ${formatTime(-5)}`);
    updateClockElement('brazil-time', `🇧🇷 Brazil: ${formatTime(-3)}`);
    updateClockElement('freeport-time', `🇧🇸 Freeport: ${formatTime(-5)}`);
    updateClockElement('chile-time', `🇨🇱 Chile: ${formatTime(-3)}`);
    updateClockElement('laspalmas-time', `🇪🇸 Las Palmas: ${formatTime(1)}`);
}

function updateWorldClocks() {
    const locations = [
        { id: 'clock-panama', zone: 'America/Panama' },
        { id: 'clock-brazil', zone: 'America/Sao_Paulo' },
        { id: 'clock-freeport', zone: 'America/Nassau' },
        { id: 'clock-chile', zone: 'America/Santiago' },
        { id: 'clock-las-palmas', zone: 'Atlantic/Canary' }
    ];

    const now = new Date();
    
    locations.forEach(loc => {
        const timeString = new Intl.DateTimeFormat('en-GB', {
            timeZone: loc.zone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(now);
        
        const element = document.getElementById(loc.id);
        if (element) element.textContent = timeString;
    });
}

// Start the clock
setInterval(updateWorldClocks, 1000);
updateWorldClocks(); // Initial call

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        addNewRow();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        showNotification('Data auto-saved!');
    }
    if (e.key === 'Escape') {
        closePasteModal();
        hideContextMenu();
    }
}

// Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: var(--btn-success); color: white;
        padding: 15px 20px; border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000; animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Save/Load
function saveData() {
    localStorage.setItem('vesselData', JSON.stringify(vessels));
}

function loadSavedData() {
    const saved = localStorage.getItem('vesselData');
    if (saved) {
        try {
            vessels = JSON.parse(saved);
            vessels.forEach(v => {
                if (v.etd) v.timeLeft = calculateTimeLeft(v.etd, v.port);
            });
        } catch (e) {
            console.error('Error loading:', e);
            vessels = [];
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
