// Combined view implementation - with debugging
document.addEventListener('DOMContentLoaded', function() {
    // Wait for a longer time to ensure the app is fully initialized
    setTimeout(function() {
        console.log("Starting combined view initialization");
        
        // Debug: Check if we can access the pending arrays
        console.log("Current pendingInspections:", window.pendingInspections);
        console.log("Current pendingDepartures:", window.pendingDepartures);
        
        // Add the combined tab to the navigation
        const navTabs = document.querySelector('.nav-tabs');
        if (!navTabs) {
            console.error('Navigation tabs not found');
            return;
        }
        
        // Check if tab already exists
        if (document.getElementById('combined-tab')) {
            console.log('Combined tab already exists');
            return;
        }
        
        // Create the new combined tab
        const combinedTab = document.createElement('div');
        combinedTab.id = 'combined-tab';
        combinedTab.className = 'nav-tab';
        combinedTab.textContent = 'All Priorities';
        
        // Add it to the navigation tabs
        navTabs.appendChild(combinedTab);
        
        // Create the combined page container
        const appContainer = document.querySelector('.app-container');
        if (!appContainer) {
            console.error('App container not found');
            return;
        }
        
        // Create the combined page
        const combinedPage = document.createElement('div');
        combinedPage.id = 'combined-page';
        combinedPage.className = 'page';
        
        // Create the structure for the combined page
        combinedPage.innerHTML = `
            <header>
                <div class="theme-toggle">
                    <label class="switch">
                        <input type="checkbox" id="combined-theme-toggle-checkbox">
                        <span class="slider round"></span>
                    </label>
                    <span class="toggle-label">Dark Mode</span>
                </div>
                <div class="time-display">
                    <div class="panama-time">
                        <span class="label">Panama:</span>
                        <span id="combined-panama-time" class="time">DD/MM HH:MM:SS</span>
                    </div>
                    <div class="brazil-time">
                        <span class="label">Brazil:</span>
                        <span id="combined-brazil-time" class="time">DD/MM HH:MM:SS</span>
                    </div>
                    <div class="mexico-time">
                        <span class="label">Mexico:</span>
                        <span id="combined-mexico-time" class="time">DD/MM HH:MM:SS</span>
                    </div>
                </div>
                <div class="header-buttons">
                    <button id="combined-refresh-btn" class="btn btn-primary">Refresh</button>
                </div>
            </header>
            <main>
                <div class="combined-container">
                    <table id="combined-pending-table">
                        <thead>
                            <tr>
                                <th>All Priorities</th>
                                <th>Time Left</th>
                                <th>Location</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="combined-pending-tbody">
                            <!-- Table rows will be added here dynamically -->
                        </tbody>
                    </table>
                </div>
            </main>
        `;
        
        // Add the combined page to the app container
        appContainer.appendChild(combinedPage);
        
        // Add CSS for the combined view
        const style = document.createElement('style');
        style.textContent = `
            .combined-container {
                padding: 10px;
                height: calc(100vh - 100px);
                overflow-y: auto;
            }
            
            /* Location column styles */
            .location-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: 500;
                font-size: 12px;
                text-align: center;
            }
            
            .location-panama {
                background-color: #0f4c75;
                color: white;
            }
            
            .location-brazil {
                background-color: #1e88e5;
                color: white;
            }
            
            .location-mexico {
                background-color: #43a047;
                color: white;
            }
        `;
        document.head.appendChild(style);
        
        // Set up event listener for the combined tab
        combinedTab.addEventListener('click', function() {
            // Deactivate all tabs and pages first
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Activate the combined tab and page
            combinedTab.classList.add('active');
            combinedPage.classList.add('active');
            
            // Set active page in local storage
            localStorage.setItem('activePage', 'combined');
            window.activePage = 'combined';
            
            // Update the combined view
            updateCombinedView();
        });
        
        // Set up the theme toggle for combined page
        const combinedThemeToggle = document.getElementById('combined-theme-toggle-checkbox');
        if (combinedThemeToggle) {
            // Initialize the theme
            const savedTheme = localStorage.getItem('theme') || 'dark';
            combinedThemeToggle.checked = savedTheme === 'dark';
            
            // Add event listener
            combinedThemeToggle.addEventListener('change', function(e) {
                // Apply theme
                if (e.target.checked) {
                    document.body.classList.remove('light-theme');
                    document.querySelectorAll('.toggle-label').forEach(label => {
                        label.textContent = 'Dark Mode';
                    });
                    localStorage.setItem('theme', 'dark');
                } else {
                    document.body.classList.add('light-theme');
                    document.querySelectorAll('.toggle-label').forEach(label => {
                        label.textContent = 'Light Mode';
                    });
                    localStorage.setItem('theme', 'light');
                }
                
                // Sync other toggles
                document.querySelectorAll('input[type="checkbox"][id$="theme-toggle-checkbox"]').forEach(checkbox => {
                    if (checkbox !== e.target) {
                        checkbox.checked = e.target.checked;
                    }
                });
            });
        }
        
        // Set up refresh button
        const refreshBtn = document.getElementById('combined-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                console.log("Manual refresh clicked");
                updateCombinedView(true); // Force a refresh
            });
        }
        
        // Start updating time for combined view
        setInterval(updateCombinedTimes, 1000);
        updateCombinedTimes();
        
        // Start updating the combined view periodically
        setInterval(function() {
            updateCombinedView(false); // Regular update
        }, 10000);
        
        // Initial update
        updateCombinedView(true); // Force initial refresh
        
        // If the active page is set to combined, activate it
        if (localStorage.getItem('activePage') === 'combined') {
            combinedTab.click();
        }
        
        console.log('Combined view initialized successfully');
    }, 1000); // Wait 1000ms to ensure the app is fully initialized
});

// Update times for the combined view
function updateCombinedTimes() {
    updateTimeElementById('combined-panama-time', -5);
    updateTimeElementById('combined-brazil-time', -3);
    updateTimeElementById('combined-mexico-time', -6);
}

// Helper function to update time for an element by ID
function updateTimeElementById(elementId, offset) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const now = new Date();
    const utcTimeMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTimeMs + (3600000 * offset));
    
    // Format time
    const day = String(targetTime.getDate()).padStart(2, '0');
    const month = String(targetTime.getMonth() + 1).padStart(2, '0');
    const hours = String(targetTime.getHours()).padStart(2, '0');
    const minutes = String(targetTime.getMinutes()).padStart(2, '0');
    const seconds = String(targetTime.getSeconds()).padStart(2, '0');
    
    element.textContent = `${day}/${month} ${hours}:${minutes}:${seconds}`;
}

// Manual parsing function for Panama inspections
function manualParseInspections(text) {
    console.log("Manually parsing inspections from:", text?.substring(0, 100) + "...");
    const results = [];
    if (!text) return results;
    
    const lines = text.split('\n');
    // ETD DD/MM HH:MM
    const regex = /ETD\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})/;
    
    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            console.log("Found match:", match);
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
            
            // Create a Panama-timezone date
            const panamaOffset = -5; // UTC-5
            const date = new Date(Date.UTC(
                year,
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hours) - panamaOffset, // Adjust for Panama timezone
                parseInt(minutes)
            ));
            
            // Calculate hours until
            const now = new Date();
            const utcTimeMs = now.getTime() + (now.getTimezoneOffset() * 60000);
            const currentPanamaTime = new Date(utcTimeMs + (3600000 * panamaOffset));
            
            const diffInMillis = date.getTime() - currentPanamaTime.getTime();
            const hoursUntil = diffInMillis / (1000 * 60 * 60);
            
            // Generate a unique ID
            const id = line.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            
            results.push({
                description: line,
                etdDate: date,
                id: id,
                hoursUntil: hoursUntil,
                isUpcoming: hoursUntil < 24 && hoursUntil > 0,
                isPriority: hoursUntil < 6 && hoursUntil > 0,
                isUrgent: hoursUntil < 2 && hoursUntil > 0,
                status: (window.inspectionStatuses || {})[id] || 'none'
            });
        }
    }
    
    console.log("Manually parsed inspections:", results.length);
    return results;
}

// Manual parsing function for port departures
function manualParseDepartures(text, country) {
    console.log(`Manually parsing ${country} departures from:`, text?.substring(0, 100) + "...");
    const results = [];
    if (!text) return results;
    
    const lines = text.split('\n');
    // ETD DD/MM HH:MM
    const regex = /ETD\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})(?:\(|$|\s)/;
    
    const offsetMap = {
        'Brazil': -3,  // UTC-3
        'Mexico': -6   // UTC-6
    };
    
    const offset = offsetMap[country] || 0;
    
    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            console.log(`Found ${country} match:`, match);
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
            
            // Create a timezone-adjusted date
            const date = new Date(Date.UTC(
                year,
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hours) - offset, // Adjust for country timezone
                parseInt(minutes)
            ));
            
            // Calculate hours until
            const now = new Date();
            const utcTimeMs = now.getTime() + (now.getTimezoneOffset() * 60000);
            const currentLocalTime = new Date(utcTimeMs + (3600000 * offset));
            
            const diffInMillis = date.getTime() - currentLocalTime.getTime();
            const hoursUntil = diffInMillis / (1000 * 60 * 60);
            
            // Generate a unique ID
            const id = line.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            
            results.push({
                description: line,
                etdDate: date,
                country: country,
                id: id,
                hoursUntil: hoursUntil,
                isUpcoming: hoursUntil < 24 && hoursUntil > 0,
                isPriority: hoursUntil < 6 && hoursUntil > 0,
                isUrgent: hoursUntil < 2 && hoursUntil > 0,
                status: (window.portStatuses || {})[id] || 'none'
            });
        }
    }
    
    console.log(`Manually parsed ${country} departures:`, results.length);
    return results;
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

// Update the combined view
function updateCombinedView(forceRefresh = false) {
    console.log('Updating combined view, force:', forceRefresh);
    
    // Try to get pending inspections and departures from the main app
    let pendingInspections = window.pendingInspections || [];
    let pendingDepartures = window.pendingDepartures || [];
    
    // If we're forcing a refresh or the arrays are empty, try to parse them manually
    if (forceRefresh || pendingInspections.length === 0 || pendingDepartures.length === 0) {
        console.log("Trying to parse manually");
        
        // Get the text from the textareas
        const k9TextArea = document.getElementById('k9-textarea');
        const uwTextArea = document.getElementById('uw-textarea');
        const brazilTextArea = document.getElementById('brazil-textarea');
        const mexicoTextArea = document.getElementById('mexico-textarea');
        
        // Parse Panama inspections
        const k9Inspections = k9TextArea ? manualParseInspections(k9TextArea.value) : [];
        const uwInspections = uwTextArea ? manualParseInspections(uwTextArea.value) : [];
        
        // Combine and deduplicate inspections
        const combinedInspections = [...k9Inspections, ...uwInspections];
        const uniqueMap = new Map();
        
        combinedInspections.forEach(inspection => {
            uniqueMap.set(inspection.description, inspection);
        });
        
        pendingInspections = Array.from(uniqueMap.values());
        
        // Parse port departures
        const brazilDepartures = brazilTextArea ? manualParseDepartures(brazilTextArea.value, 'Brazil') : [];
        const mexicoDepartures = mexicoTextArea ? manualParseDepartures(mexicoTextArea.value, 'Mexico') : [];
        
        pendingDepartures = [...brazilDepartures, ...mexicoDepartures];
    }
    
    console.log("pendingInspections:", pendingInspections.length);
    console.log("pendingDepartures:", pendingDepartures.length);
    
    // Get the blinkState from the main app or default to false
    const blinkState = window.blinkState || false;
    
    // Get the table body
    const combinedTbody = document.getElementById('combined-pending-tbody');
    if (!combinedTbody) {
        console.error('Combined table body not found');
        return;
    }
    
    // Clear the table
    combinedTbody.innerHTML = '';
    
    // Create combined list of all items
    const allItems = [];
    
    // Add Panama inspections
    pendingInspections.forEach(inspection => {
        allItems.push({
            ...inspection,
            location: 'Panama',
            id: 'panama-' + inspection.id,
            type: 'inspection'
        });
    });
    
    // Add port departures
    pendingDepartures.forEach(departure => {
        allItems.push({
            ...departure,
            location: departure.country || 'Unknown',
            id: (departure.country || 'unknown').toLowerCase() + '-' + departure.id,
            type: 'departure'
        });
    });
    
    // Sort all items by ETD date (regardless of location)
    allItems.sort((a, b) => {
        // Use dates if available, otherwise fallback to hoursUntil
        if (a.etdDate && b.etdDate) {
            return a.etdDate - b.etdDate;
        } else {
            return a.hoursUntil - b.hoursUntil;
        }
    });
    
    // Check if we have any items
    if (allItems.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'No pending inspections or departures found';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        combinedTbody.appendChild(row);
        
        // Add debug message
        const debugRow = document.createElement('tr');
        const debugCell = document.createElement('td');
        debugCell.colSpan = 4;
        debugCell.textContent = 'Make sure you have ETD dates in the format "ETD DD/MM HH:MM" in the text areas';
        debugCell.style.textAlign = 'center';
        debugCell.style.fontSize = '12px';
        debugCell.style.color = '#888';
        debugRow.appendChild(debugCell);
        combinedTbody.appendChild(debugRow);
        
        return;
    }
    
    // Add rows for each item
    allItems.forEach(item => {
        const row = document.createElement('tr');
        
        // Set data attributes
        row.dataset.itemId = item.id;
        row.dataset.itemType = item.type;
        
        // Apply styling based on priority
        if (item.hoursUntil <= 0) {
            row.classList.add('overdue-row');
        } else if (item.isUrgent) {
            row.classList.add('urgent-row');
            if (blinkState) {
                row.classList.add('urgent-blink');
            } else {
                row.style.opacity = '0.7';
            }
        } else if (item.isPriority) {
            row.classList.add('priority-row');
        } else if (item.isUpcoming) {
            row.classList.add('upcoming-row');
        }
        
        // Description cell
        const descCell = document.createElement('td');
        descCell.style.fontFamily = 'monospace';
        descCell.style.whiteSpace = 'nowrap';
        descCell.textContent = item.description;
        row.appendChild(descCell);
        
        // Time left cell
        const timeCell = document.createElement('td');
        timeCell.style.textAlign = 'center';
        timeCell.style.whiteSpace = 'nowrap';
        
        // Format time left
        const formattedTime = formatTimeLeft(item.hoursUntil);
        
        // Add time left with styled span
        const timeSpan = document.createElement('span');
        
        if (item.hoursUntil <= 0) {
            timeSpan.className = 'time-left-overdue';
        } else if (item.isUrgent) {
            timeSpan.className = 'time-left-urgent';
        } else if (item.isPriority) {
            timeSpan.className = 'time-left-priority';
        } else if (item.isUpcoming) {
            timeSpan.className = 'time-left-upcoming';
        }
        
        timeSpan.textContent = formattedTime;
        timeCell.appendChild(timeSpan);
        row.appendChild(timeCell);
        
        // Location cell
        const locationCell = document.createElement('td');
        locationCell.style.textAlign = 'center';
        
        const locationBadge = document.createElement('span');
        locationBadge.className = `location-badge location-${item.location.toLowerCase()}`;
        locationBadge.textContent = item.location;
        locationCell.appendChild(locationBadge);
        
        row.appendChild(locationCell);
        
        // Status cell
        const statusCell = document.createElement('td');
        statusCell.style.textAlign = 'center';
        statusCell.style.whiteSpace = 'nowrap';
        statusCell.classList.add('status-cell');
        
        // Add the appropriate status indicator
        switch(item.status) {
            case 'uwi-ongoing':
                statusCell.textContent = 'UWI Ongoing';
                statusCell.style.color = '#17a2b8';
                break;
            case 'uwi-done':
                statusCell.textContent = 'UWI Done';
                statusCell.style.color = '#28a745';
                break;
            case 'k9-ongoing':
                statusCell.textContent = 'K9 Ongoing';
                statusCell.style.color = '#fd7e14';
                break;
            case 'k9-done':
                statusCell.textContent = 'K9 Done';
                statusCell.style.color = '#28a745';
                break;
            default:
                statusCell.textContent = '—';
                break;
        }
        
        row.appendChild(statusCell);
        
        // Add context menu event
        row.addEventListener('contextmenu', handleCombinedRowContextMenu);
        
        combinedTbody.appendChild(row);
    });
}

// Handle right-click on a combined view row
function handleCombinedRowContextMenu(e) {
    e.preventDefault();
    
    const itemId = this.dataset.itemId;
    const itemType = this.dataset.itemType;
    
    if (itemId && itemType) {
        showCombinedContextMenu(e.pageX, e.pageY, itemId, itemType);
    }
}

// Show context menu for combined view items
function showCombinedContextMenu(x, y, itemId, itemType) {
    // Remove any existing context menus
    const existingMenu = document.getElementById('context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // Create a new context menu
    const contextMenu = document.createElement('div');
    contextMenu.id = 'context-menu';
    contextMenu.className = 'context-menu';
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.dataset.itemId = itemId;
    contextMenu.dataset.itemType = itemType;
    
    // Add menu items
    const menuItems = [
        { text: 'UWI Ongoing', status: 'uwi-ongoing' },
        { text: 'UWI Done', status: 'uwi-done' },
        { text: 'K9 Ongoing', status: 'k9-ongoing' },
        { text: 'K9 Done', status: 'k9-done' },
        { text: 'Clear Status', status: 'none' }
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
    contextMenu.addEventListener('click', handleCombinedContextMenuItemClick);
    
    // Add a click event listener to remove the menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', function removeContextMenuOnClick(e) {
            if (!e.target.closest('#context-menu')) {
                const menu = document.getElementById('context-menu');
                if (menu) {
                    menu.remove();
                }
                document.removeEventListener('click', removeContextMenuOnClick);
            }
        });
    }, 0);
}

// Handle clicks on context menu items for combined view
function handleCombinedContextMenuItemClick(e) {
    if (e.target.classList.contains('context-menu-item')) {
        const newStatus = e.target.dataset.status;
        const itemId = this.dataset.itemId;
        const itemType = this.dataset.itemType;
        
        // Get references to necessary objects
        let inspectionStatuses = window.inspectionStatuses || {};
        let portStatuses = window.portStatuses || {};
        
        if (itemType === 'inspection') {
            // Extract the original inspection ID (remove 'panama-' prefix)
            const inspectionId = itemId.replace('panama-', '');
            
            // Update the status in our tracking object
            inspectionStatuses[inspectionId] = newStatus;
            window.inspectionStatuses = inspectionStatuses;
            
            // Update localStorage
            localStorage.setItem('inspectionStatuses', JSON.stringify(inspectionStatuses));
        } else if (itemType === 'departure') {
            // Extract country and departure ID
            const parts = itemId.split('-');
            const country = parts[0];
            const departureId = itemId.substring(country.length + 1);
            
            // Update the status in our tracking object
            portStatuses[departureId] = newStatus;
            window.portStatuses = portStatuses;
            
            // Update localStorage
            localStorage.setItem('portStatuses', JSON.stringify(portStatuses));
        }
        
        // Update our view
        updateCombinedView(true);
        
        // Try to update the main app's display if possible
        if (typeof window.updatePendingTableDisplay === 'function') {
            window.updatePendingTableDisplay();
        }
    }
    
    // Remove the context menu
    const menu = document.getElementById('context-menu');
    if (menu) {
        menu.remove();
    }
}
