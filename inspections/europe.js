// European Ports Tab Extension
(function() {
    // 1. Create a new tab in the navigation
    const navTabs = document.querySelector('.nav-tabs');
    if (navTabs) {
        const euTab = document.createElement('div');
        euTab.id = 'eu-tab';
        euTab.className = 'nav-tab';
        euTab.textContent = 'European Ports';
        navTabs.appendChild(euTab);
        
        // 2. Create the EU ports page structure
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            const euPage = document.createElement('div');
            euPage.id = 'eu-page';
            euPage.className = 'page';
            euPage.innerHTML = `
                <!-- Header with time display and buttons -->
                <header>
                    <div class="theme-toggle">
                        <label class="switch">
                            <input type="checkbox" id="eu-theme-toggle-checkbox">
                            <span class="slider round"></span>
                        </label>
                        <span class="toggle-label">Dark Mode</span>
                    </div>
                    <div class="time-display">
                        <div class="eu-time">
                            <span class="label">EU Time:</span>
                            <span id="eu-central-time" class="time">DD/MM HH:MM:SS</span>
                        </div>
                    </div>
                    <div class="header-buttons">
                        <button id="eu-check-btn" class="btn btn-primary">Check</button>
                        <button id="eu-pending-btn" class="btn btn-primary">Pending</button>
                    </div>
                </header>
                <!-- Main content area with panels -->
                <main>
                    <div class="split-container">
                        <!-- EU Ports Panel -->
                        <div class="panel">
                            <div class="text-container">
                                <textarea id="eu-textarea" class="text-area" spellcheck="false" wrap="off">Copy European ports here...!!!</textarea>
                                <div id="eu-highlight" class="highlight-overlay"></div>
                            </div>
                            <div class="panel-buttons">
                                <button id="eu-clear-btn" class="btn btn-danger">Delete</button>
                                <button id="eu-copy-btn" class="btn btn-primary">Copy EU</button>
                            </div>
                        </div>
                        <!-- Pending Panel - Will be visible only on larger screens -->
                        <div id="eu-pending-panel" class="panel pending-panel">
                            <div class="panel-header">
                                <h2>EU Ports ETB Countdown</h2>
                            </div>
                            <div class="pending-container">
                                <table id="eu-pending-table-inline">
                                    <thead>
                                        <tr>
                                            <th>European Port ETBs</th>
                                            <th>Time Left</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody id="eu-pending-tbody-inline">
                                        <!-- Table rows will be added here dynamically -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            `;
            
            // Insert the EU page before the pending modal
            const pendingModal = document.getElementById('pending-modal');
            if (pendingModal) {
                appContainer.insertBefore(euPage, pendingModal);
            } else {
                appContainer.appendChild(euPage);
            }
            
            // 3. Add CSS for European port badges
            const style = document.createElement('style');
            style.textContent = `
                .location-badge.location-malta {
                    background-color: #900C3F;
                    color: white;
                }
                .location-badge.location-hamburg {
                    background-color: #FFC300;
                    color: black;
                }
                .location-badge.location-lehavre {
                    background-color: #0074D9;
                    color: white;
                }
                .location-badge.location-antwerp {
                    background-color: #FF851B;
                    color: white;
                }
                .location-badge.location-rotterdam {
                    background-color: #2ECC40;
                    color: white;
                }

                /* FIX: class names cannot contain spaces.
                   The JS badge generator uses .replace(/[^a-z0-9]/g, '')
                   so "Las Palmas" becomes the class "location-laspalmas". */
                .location-badge.location-laspalmas {
                    background-color: rgb(46, 62, 204);
                    color: white;
                }
                
                /* Add port indicators for combined view */
                [data-port="Malta"] {
                    color: #FF5733;
                    margin-right: 5px;
                    font-weight: normal;
                }
                [data-port="Hamburg"] {
                    color: #DAF7A6;
                    margin-right: 5px;
                    font-weight: normal;
                }
                [data-port="Le Havre"] {
                    color: #85C1E9;
                    margin-right: 5px;
                    font-weight: normal;
                }
                [data-port="Antwerp"] {
                    color: #FFC300;
                    margin-right: 5px;
                    font-weight: normal;
                }
                [data-port="Rotterdam"] {
                    color: #7DCEA0;
                    margin-right: 5px;
                    font-weight: normal;
                }

                [data-port="Las Palmas"] {
                    color:rgb(126, 125, 206);
                    margin-right: 5px;
                    font-weight: normal;
                }
            `;
            document.head.appendChild(style);
            
            // 4. Set up global variables
            // These would normally be at the top of script.js, so we're adding them to the window object
            window.euTextArea = document.getElementById('eu-textarea');
            window.euHighlightDiv = document.getElementById('eu-highlight');
            window.euCentralTimeDisplay = document.getElementById('eu-central-time');
            window.euCheckBtn = document.getElementById('eu-check-btn');
            window.euPendingBtn = document.getElementById('eu-pending-btn');
            window.euClearBtn = document.getElementById('eu-clear-btn');
            window.euCopyBtn = document.getElementById('eu-copy-btn');
            window.euPendingPanel = document.getElementById('eu-pending-panel');
            window.euPendingTbodyInline = document.getElementById('eu-pending-tbody-inline');
            window.euThemeToggleCheckbox = document.getElementById('eu-theme-toggle-checkbox');
            
            // Track the EU port statuses
            window.pendingEuPortArrivals = [];
            window.euPortStatuses = window.euPortStatuses || {};
            
            // 5. Set up event listeners for the EU tab
            euTab.addEventListener('click', function() {
                // Remove active class from all tabs and pages
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                
                // Add active class to this tab and its page
                euTab.classList.add('active');
                euPage.classList.add('active');
                
                // Update active page in localStorage
                localStorage.setItem('activePage', 'eu');
                
                // Update the display
                updatePendingEuPortArrivals();
                
                // Update screen size check
                if (window.checkScreenSize) {
                    window.checkScreenSize();
                }
            });
            
            // 6. Set up theme toggle for EU tab
            if (euThemeToggleCheckbox) {
                const savedTheme = localStorage.getItem('theme') || 'dark';
                euThemeToggleCheckbox.checked = savedTheme === 'dark';
                
                euThemeToggleCheckbox.addEventListener('change', function(e) {
                    const isDark = e.target.checked;
                    
                    // Sync with main theme toggle function
                    if (window.setTheme) {
                        window.setTheme(isDark);
                    } else {
                        document.body.classList.toggle('light-theme', !isDark);
                        document.querySelectorAll('.toggle-label').forEach(label => {
                            label.textContent = isDark ? 'Dark Mode' : 'Light Mode';
                        });
                        localStorage.setItem('theme', isDark ? 'dark' : 'light');
                    }
                    
                    // Sync other checkboxes
                    document.querySelectorAll('input[type="checkbox"][id$="theme-toggle-checkbox"]').forEach(cb => {
                        if (cb !== e.target) cb.checked = isDark;
                    });
                });
            }
            
            // 7. Set up EU-specific event listeners
            if (euTextArea) {
                euTextArea.addEventListener('input', function() {
                    updatePendingEuPortArrivals();
                    saveEuData();
                });
                euTextArea.addEventListener('keydown', function(e) {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        const start = this.selectionStart;
                        const end = this.selectionEnd;
                        this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
                        this.selectionStart = this.selectionEnd = start + 1;
                    }
                });
            }
            
            if (euCheckBtn) {
                euCheckBtn.addEventListener('click', function() {
                    checkEuTextArea();
                });
            }
            
            if (euPendingBtn) {
                euPendingBtn.addEventListener('click', function() {
                    if (!window.isLargeScreen && window.togglePendingModal) {
                        window.togglePendingModal('eu');
                    }
                });
            }
            
            if (euClearBtn) {
                euClearBtn.addEventListener('click', function() {
                    if (euTextArea) {
                        euTextArea.value = '';
                        if (euHighlightDiv) euHighlightDiv.innerHTML = '';
                        saveEuData();
                    }
                });
            }
            
            if (euCopyBtn) {
                euCopyBtn.addEventListener('click', function() {
                    if (euTextArea && window.copyToClipboard) {
                        window.copyToClipboard(euTextArea.value);
                    }
                });
            }
            
            // 8. Set up scrolling sync for EU text area
            if (euTextArea && euHighlightDiv && window.syncScroll) {
                window.syncScroll(euTextArea, euHighlightDiv);
            }
            
            // 9. Load saved EU data
            loadSavedEuData();
            
            // 10. Include EU ports in combined view if it exists
            updateCombinedViewForEu();
            
        }
    }
    
    // Helper function to save EU data to localStorage
    function saveEuData() {
        if (window.euTextArea) localStorage.setItem('euText', window.euTextArea.value);
        localStorage.setItem('euPortStatuses', JSON.stringify(window.euPortStatuses || {}));
    }
    
    // Helper function to load saved EU data from localStorage
    function loadSavedEuData() {
        const savedEuText = localStorage.getItem('euText');
        if (savedEuText && window.euTextArea) {
            window.euTextArea.value = savedEuText;
        }
        
        const savedEuPortStatuses = localStorage.getItem('euPortStatuses');
        if (savedEuPortStatuses) {
            try {
                window.euPortStatuses = JSON.parse(savedEuPortStatuses);
            } catch (e) {
                console.error('Error parsing saved EU port statuses:', e);
                window.euPortStatuses = {};
            }
        }
        
        // Initial update
        updatePendingEuPortArrivals();
    }
    
    // Function to check EU text area for formatting without comparing to another text area
    function checkEuTextArea() {
        if (!window.euTextArea || !window.euHighlightDiv) return;
        
        const lines = window.euTextArea.value.split('\n');
        let euHtml = '';
        
        // Regular expressions for ETB format validation
        const etbRegex = /ETB\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})/;
        
        lines.forEach(line => {
            // Check if the line has a properly formatted ETB
            const hasValidETB = etbRegex.test(line);
            // Check if the line has a port identifier
            const hasPort = /\[(Malta|Hamburg|Le Havre|Antwerp|Rotterdam|Las Palmas)\]/i.test(line);
            
            // Highlight lines that are missing proper ETB format or port identifier
            let highlightClass = '';
            if (line.trim() !== '' && (!hasValidETB || !hasPort)) {
                highlightClass = 'highlight-diff';
            }
            
            euHtml += `<div class="highlight-line ${highlightClass}">${escapeHtml(line) || '&nbsp;'}</div>`;
        });
        
        // Update highlight div
        window.euHighlightDiv.innerHTML = euHtml;
        
        // Make sure the highlight div is properly aligned
        window.euHighlightDiv.scrollTop = window.euTextArea.scrollTop;
        window.euHighlightDiv.scrollLeft = window.euTextArea.scrollLeft;
    }
    
    // Escape HTML special characters (reuse from main script)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Parse ETB dates from European ports
    function parseEuPortETBDates(text) {
        const results = [];
        const lines = text.split('\n');
        
        // Match ETB pattern with flexible whitespace and optional content after the time
        // ETB followed by DD/MM HH:MM format
        const etbRegex = /ETB\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})/i;
        
        // Try to get port from either [Port] format or based on vessel name context
        const portPatterns = [
            { port: 'Hamburg', regex: /\[Hamburg\]|\bHamburg\b|\bMSC SOPHIA\b/i },
            { port: 'Malta', regex: /\[Malta\]|\bMalta\b|\bMALTA\b/i },
            { port: 'Le Havre', regex: /\[Le Havre\]|\bLe Havre\b|\bLE HAVRE\b/i },
            { port: 'Antwerp', regex: /\[Antwerp\]|\bAntwerp\b|\bANTWERP\b/i },
            { port: 'Rotterdam', regex: /\[Rotterdam\]|\bRotterdam\b|\bROTTERDAM\b/i },
            { port: 'Las Palmas', regex: /\[Las Palmas\]|\ Las Palmas\b|\ Las Palmas\b/i }
        ];
        
        lines.forEach(line => {
            if (line.trim() === '') return;
            
            // Try to find an ETB date
            const etbMatch = line.match(etbRegex);
            if (!etbMatch) return;
            
            // Try to identify the port
            let port = null;
            for (const pattern of portPatterns) {
                if (pattern.regex.test(line)) {
                    port = pattern.port;
                    break;
                }
            }
            
            // If no port was identified, default to Hamburg for MSC SOPHIA or first port otherwise
            if (!port) {
                if (/MSC SOPHIA/i.test(line)) {
                    port = 'Hamburg';
                } else {
                    port = 'European Port';
                }
            }
            
            // Parse the date
            const dateString = etbMatch[1];
            const [datePart, timePart] = dateString.split(' ');
            const [day, month] = datePart.split('/');
            const [hours, minutes] = timePart.split(':');
            
            // Create date object (using current year)
            const currentDate = new Date();
            let year = currentDate.getFullYear();
            
            // Handle year rollover (if current month is December and ETB is in January)
            const currentMonth = currentDate.getMonth() + 1;
            if (currentMonth === 12 && parseInt(month) === 1) {
                year = year + 1;
            }
            
            // Create the date in local time
            const etbDate = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
            
            // Calculate hours until
            const now = new Date();
            const diffInMillis = etbDate.getTime() - now.getTime();
            const hoursUntil = diffInMillis / (1000 * 60 * 60);
            
            // Create a unique ID
            const id = line.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            
            results.push({
                id: id,
                description: line,
                etbDate: etbDate,
                port: port,
                hoursUntil: hoursUntil,
                isUpcoming: hoursUntil < 24 && hoursUntil > 0,
                isPriority: hoursUntil < 6 && hoursUntil > 0,
                isUrgent: hoursUntil < 2 && hoursUntil > 0,
                status: 'none'
            });
        });
        
        // Sort by ETB date
        results.sort((a, b) => a.etbDate - b.etbDate);
        
        return results;
    }
    
    // Update pending EU port arrivals list
    function updatePendingEuPortArrivals() {
        if (!window.euTextArea) return;
        
        
        const euPortArrivals = parseEuPortETBDates(window.euTextArea.value);
        
        // Get current time
        const now = new Date();
        
        // Calculate priority status
        window.pendingEuPortArrivals = euPortArrivals.map(arrival => {
            const diffInMillis = arrival.etbDate.getTime() - now.getTime();
            const hoursUntil = diffInMillis / (1000 * 60 * 60);
            
            // Create a unique ID for each arrival
            const arrivalId = generateId(arrival.description);
            
            return {
                ...arrival,
                id: arrivalId,
                hoursUntil,
                isUpcoming: hoursUntil < 24 && hoursUntil > 0,
                isPriority: hoursUntil < 6 && hoursUntil > 0,
                isUrgent: hoursUntil < 2 && hoursUntil > 0,
                status: window.euPortStatuses[arrivalId] || window.INSPECTION_STATUSES?.NONE || 'none'
            };
        });
        
        // Sort by ETB date
        window.pendingEuPortArrivals.sort((a, b) => a.etbDate - b.etbDate);
        
        // Update table if on EU page
        const activePage = localStorage.getItem('activePage');
        if (activePage === 'eu') {
            updateEuPendingTableDisplay();
            
            // Update pending button appearance if there are urgent items
            if (window.euPendingBtn) {
                if (window.pendingEuPortArrivals.some(item => item.isUrgent)) {
                    window.euPendingBtn.innerHTML = 'Pending <span style="color: red;">⚠</span>';
                } else {
                    window.euPendingBtn.textContent = 'Pending';
                }
            }
        }
        
    }
    
    // Generate a unique ID (reuse from main script)
    function generateId(description) {
        return description.trim()
            .replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase();
    }
    
    // Update EU pending table display
    function updateEuPendingTableDisplay() {
        
        // Get the EU tbody element
        const euTbody = window.euPendingTbodyInline;
        
        if (!euTbody) return;
        
        // Clear the table
        euTbody.innerHTML = '';
        
        // Get all EU port arrivals
        const items = window.pendingEuPortArrivals;
        
        if (items.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 3;
            cell.textContent = 'No pending EU port arrivals';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            euTbody.appendChild(row);
            return;
        }
        
        items.forEach(item => {
            const row = document.createElement('tr');
            
            // Set data attribute for the arrival
            row.dataset.arrivalId = item.id;
            
            // Apply styling based on priority
            if (item.hoursUntil <= 0) {
                row.classList.add('overdue-row');
            } else if (item.isUrgent) {
                row.classList.add('urgent-row');
                if (window.blinkState) {
                    row.classList.add('urgent-blink');
                } else {
                    row.style.opacity = '0.5';
                }
            } else if (item.isPriority) {
                row.classList.add('priority-row');
                if (window.blinkState) {
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
            
            // Add port badge
            if (item.port) {
                const portSpan = document.createElement('span');
                portSpan.setAttribute('data-port', item.port);
                portSpan.textContent = `[${item.port}]`;
                descCell.appendChild(portSpan);
                descCell.appendChild(document.createTextNode(' '));
            }
            
            // Add main description text
            descCell.appendChild(document.createTextNode(item.description));
            row.appendChild(descCell);
            
            // Time left cell
            const timeCell = document.createElement('td');
            timeCell.style.textAlign = 'center';
            timeCell.style.whiteSpace = 'nowrap';
            
            const formattedTime = window.formatTimeLeft ? 
                window.formatTimeLeft(item.hoursUntil) : 
                formatTimeLeft(item.hoursUntil);
            
            timeCell.textContent = formattedTime;
            row.appendChild(timeCell);
            
            // Status cell
            const statusCell = document.createElement('td');
            statusCell.style.textAlign = 'center';
            statusCell.style.whiteSpace = 'nowrap';
            statusCell.classList.add('status-cell');
            
            // Add status indicator
            updateEuPortStatusIndicator(statusCell, item.status);
            
            row.appendChild(statusCell);
            
            // Add context menu event
            row.addEventListener('contextmenu', handleEuRowContextMenu);
            
            euTbody.appendChild(row);
        });
        
        // Update EU Central time display
        updateEuCentralTime();
    }
    
    // Update status indicator for EU ports
    function updateEuPortStatusIndicator(cell, status) {
        // Clear existing content
        cell.innerHTML = '';
        cell.className = 'status-cell';
        
        // If INSPECTION_STATUSES is available from the main script, use those constants
        const STATUSES = window.INSPECTION_STATUSES || {
            NONE: 'none',
            UWI_ONGOING: 'uwi-ongoing',
            UWI_DONE: 'uwi-done',
            K9_ONGOING: 'k9-ongoing',
            K9_DONE: 'k9-done'
        };
        
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
    
    // Format time left display (if not available from main script)
    function formatTimeLeft(hoursUntil) {
        if (hoursUntil <= 0) {
            const hoursPassed = Math.abs(hoursUntil);
            const hours = Math.floor(hoursPassed);
            const minutes = Math.floor((hoursPassed - hours) * 60);
            return `Overdue: ${hours}h ${minutes}m ago`;
        }
        
        const hours = Math.floor(hoursUntil);
        const minutes = Math.floor((hoursUntil - hours) * 60);
        return `${hours}h ${minutes}m`;
    }
    
    // Update EU Central time display
    function updateEuCentralTime() {
        if (window.euCentralTimeDisplay) {
            // EU Central time is UTC+2
            const now = new Date();
            const utcTimeMs = now.getTime() + (now.getTimezoneOffset() * 60000);
            const euCentralTime = new Date(utcTimeMs + (3600000 * 2)); // UTC+2
            
            // Format the time
            const day = String(euCentralTime.getDate()).padStart(2, '0');
            const month = String(euCentralTime.getMonth() + 1).padStart(2, '0');
            const hours = String(euCentralTime.getHours()).padStart(2, '0');
            const minutes = String(euCentralTime.getMinutes()).padStart(2, '0');
            const seconds = String(euCentralTime.getSeconds()).padStart(2, '0');
            
            window.euCentralTimeDisplay.textContent = `${day}/${month} ${hours}:${minutes}:${seconds}`;
        }
    }
    
    // Handle right-click on a row to show context menu
    function handleEuRowContextMenu(e) {
        e.preventDefault();
        
        // Get arrival ID
        const arrivalId = this.dataset.arrivalId;
        if (arrivalId) {
            showEuPortContextMenu(e.pageX, e.pageY, arrivalId);
        }
    }
    
    // Show context menu for EU ports
    function showEuPortContextMenu(x, y, arrivalId) {
        // Remove any existing context menus
        if (window.removeContextMenu) {
            window.removeContextMenu();
        } else {
            const existingMenu = document.getElementById('context-menu');
            if (existingMenu) {
                document.body.removeChild(existingMenu);
            }
        }
        
        // Create a new context menu
        const contextMenu = document.createElement('div');
        contextMenu.id = 'context-menu';
        contextMenu.className = 'context-menu';
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.dataset.arrivalId = arrivalId;
        contextMenu.dataset.type = 'eu-port';
        
        // Use INSPECTION_STATUSES from main script if available
        const STATUSES = window.INSPECTION_STATUSES || {
            NONE: 'none',
            UWI_ONGOING: 'uwi-ongoing',
            UWI_DONE: 'uwi-done',
            K9_ONGOING: 'k9-ongoing',
            K9_DONE: 'k9-done'
        };
        
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
        contextMenu.addEventListener('click', handleEuContextMenuItemClick);
        
        // Add a click event listener to remove the menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', removeEuContextMenu);
        }, 0);
    }
    
    // Handle clicks on context menu items for EU ports
    function handleEuContextMenuItemClick(e) {
        if (e.target.classList.contains('context-menu-item')) {
            const newStatus = e.target.dataset.status;
            const arrivalId = this.dataset.arrivalId;
            
            // Update the status in our tracking object
            window.euPortStatuses[arrivalId] = newStatus;
            
            // Update the arrival in pendingEuPortArrivals
            const arrival = window.pendingEuPortArrivals.find(arr => arr.id === arrivalId);
            if (arrival) {
                arrival.status = newStatus;
            }
            
            // Update the table display
            updateEuPendingTableDisplay();
            
            // Save the status
            saveEuData();
        }
        
        // Remove the context menu
        removeEuContextMenu();
    }
    
    // Remove the context menu
    function removeEuContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu) {
            document.body.removeChild(contextMenu);
        }
        
        // Remove the document click listener
        document.removeEventListener('click', removeEuContextMenu);
    }
    
    // Update the combined view to include EU ports
    function updateCombinedViewForEu() {
        // Check if the combined view exists and has been initialized
        const combinedTab = document.getElementById('combined-tab');
        const combinedPage = document.getElementById('combined-page');
        
        if (combinedTab && combinedPage) {
            // Get the original updateCombinedTable function
            const originalUpdateFn = window.updateCombinedTable;
            
            // Override the function to include EU ports
            window.updateCombinedTable = function() {
                const combinedTbody = document.getElementById('combined-pending-tbody');
                if (!combinedTbody) return;
                
                // Clear the table
                combinedTbody.innerHTML = '';
                
                // Get data from all tables
                const allItems = [];
                
                // Get Panama data (from the original function)
                const panamaTbody = document.getElementById('panama-pending-tbody-inline');
                if (panamaTbody) {
                    Array.from(panamaTbody.querySelectorAll('tr')).forEach(row => {
                        if (row.cells && row.cells.length >= 3) {
                            const item = {
                                description: row.cells[0].textContent.trim(),
                                timeLeft: row.cells[1].textContent.trim(),
                                status: row.cells[2].innerHTML,
                                location: 'Panama',
                                priority: getPriorityFromRow(row)
                            };
                            allItems.push(item);
                        }
                    });
                }
                
                // Get Brazil/Mexico data (from the original function)
                const portsTbody = document.getElementById('ports-pending-tbody-inline');
                if (portsTbody) {
                    Array.from(portsTbody.querySelectorAll('tr')).forEach(row => {
                        if (row.cells && row.cells.length >= 3) {
                            const descText = row.cells[0].textContent.trim();
                            let location = 'Unknown';
                            
                            // Determine location from the description
                            if (descText.includes('[Brazil]')) {
                                location = 'Brazil';
                            } else if (descText.includes('[Mexico]')) {
                                location = 'Mexico';
                            }
                            
                            const item = {
                                description: descText,
                                timeLeft: row.cells[1].textContent.trim(),
                                status: row.cells[2].innerHTML,
                                location: location,
                                priority: getPriorityFromRow(row)
                            };
                            allItems.push(item);
                        }
                    });
                }
                
                // NEW: Get EU ports data
                const euTbody = document.getElementById('eu-pending-tbody-inline');
                if (euTbody) {
                    Array.from(euTbody.querySelectorAll('tr')).forEach(row => {
                        if (row.cells && row.cells.length >= 3) {
                            const descText = row.cells[0].textContent.trim();
                            let port = 'Unknown';
                            
                            // Determine port from the description
                            if (descText.includes('[Malta]')) {
                                port = 'Malta';
                            } else if (descText.includes('[Hamburg]')) {
                                port = 'Hamburg';
                            } else if (descText.includes('[Le Havre]')) {
                                port = 'Le Havre';
                            } else if (descText.includes('[Antwerp]')) {
                                port = 'Antwerp';
                            } else if (descText.includes('[Rotterdam]')) {
                                port = 'Rotterdam';
                            } else if (descText.includes('[Las Palmas]')) {
                                port = 'Las Palmas';
                            }
                            
                            const item = {
                                description: descText,
                                timeLeft: row.cells[1].textContent.trim(),
                                status: row.cells[2].innerHTML,
                                location: 'EU: ' + port,
                                priority: getPriorityFromRow(row)
                            };
                            allItems.push(item);
                        }
                    });
                }
                
                // Sort by priority (urgent, priority, upcoming, overdue)
                allItems.sort((a, b) => {
                    // First by priority level
                    if (a.priority !== b.priority) {
                        const order = ['urgent', 'priority', 'upcoming', 'overdue', 'normal'];
                        return order.indexOf(a.priority) - order.indexOf(b.priority);
                    }
                    
                    // Then by time left
                    let aHours = parseTimeLeft(a.timeLeft);
                    let bHours = parseTimeLeft(b.timeLeft);
                    return aHours - bHours;
                });
                
                // Populate the table
                if (allItems.length === 0) {
                    const row = document.createElement('tr');
                    const cell = document.createElement('td');
                    cell.colSpan = 4;
                    cell.textContent = 'No pending inspections or departures';
                    cell.style.textAlign = 'center';
                    row.appendChild(cell);
                    combinedTbody.appendChild(row);
                } else {
                    allItems.forEach(item => {
                        const row = document.createElement('tr');
                        
                        // Set class based on priority
                        row.className = item.priority + '-row';
                        
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
                        timeCell.textContent = item.timeLeft;
                        row.appendChild(timeCell);
                        
                        // Location cell
                        const locationCell = document.createElement('td');
                        locationCell.style.textAlign = 'center';
                        
                        const locationBadge = document.createElement('span');
                        locationBadge.className = `location-badge location-${item.location.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                        locationBadge.textContent = item.location;
                        locationCell.appendChild(locationBadge);
                        
                        row.appendChild(locationCell);
                        
                        // Status cell
                        const statusCell = document.createElement('td');
                        statusCell.style.textAlign = 'center';
                        statusCell.style.whiteSpace = 'nowrap';
                        statusCell.innerHTML = item.status;
                        
                        row.appendChild(statusCell);
                        
                        // Add context menu event if needed
                        if (typeof window.handleRowContextMenu === 'function') {
                            row.addEventListener('contextmenu', window.handleRowContextMenu);
                        }
                        
                        combinedTbody.appendChild(row);
                    });
                }
                
                // Update the time display
                if (typeof window.updateTimeDisplay === 'function') {
                    window.updateTimeDisplay();
                }
            };
            
            // Call the function to update initially
            if (combinedPage.classList.contains('active')) {
                window.updateCombinedTable();
            }
        }
    }
    
    function updateEuTable(arrivals) {
        const euPendingTbodyInline = document.getElementById('eu-pending-tbody-inline');
        if (!euPendingTbodyInline) return;
        
        // Clear the table
        euPendingTbodyInline.innerHTML = '';
        
        arrivals.forEach(item => {
            const row = document.createElement('tr');
            
            // Set class based on priority
            if (item.hoursUntil <= 0) {
                row.classList.add('overdue-row');
            } else if (item.isUrgent) {
                row.classList.add('urgent-row');
            } else if (item.isPriority) {
                row.classList.add('priority-row');
            } else if (item.isUpcoming) {
                row.classList.add('upcoming-row');
            }
            
            // Description cell
            const descCell = document.createElement('td');
            descCell.style.fontFamily = 'monospace';
            descCell.style.whiteSpace = 'nowrap';
            
            // Add port badge if not in the description
            if (!item.description.includes('[')) {
                const portSpan = document.createElement('span');
                portSpan.setAttribute('data-port', item.port);
                portSpan.textContent = `[${item.port}] `;
                descCell.appendChild(portSpan);
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
            statusCell.classList.add('status-cell');
            statusCell.textContent = '—';
            row.appendChild(statusCell);
            
            euPendingTbodyInline.appendChild(row);
        });
    }

    // Force immediate parsing of EU data
    function parseAndUpdateEuData() {
        const euTextArea = document.getElementById('eu-textarea');
        const euPendingTbodyInline = document.getElementById('eu-pending-tbody-inline');
        
        if (!euTextArea || !euPendingTbodyInline) {
            console.error("Cannot find EU text area or table body");
            return;
        }
        
        
        // Parse ETB dates with a more flexible pattern
        const euPortArrivals = parseEuPortETBDates(euTextArea.value);
        
        // If there are arrivals, update the table
        if (euPortArrivals.length > 0) {
            updateEuTable(euPortArrivals);
            
            // Force update of the combined view
            const combinedTab = document.getElementById('combined-tab');
            if (combinedTab) {
                updateCombinedViewWithEuData(euPortArrivals);
            }
        } else {
            // Clear the table if no arrivals
            euPendingTbodyInline.innerHTML = '';
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 3;
            cell.textContent = 'No pending EU port arrivals';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            euPendingTbodyInline.appendChild(row);
        }
    }

    // Add EU time update to the main updateAllTimes function
    const originalUpdateAllTimes = window.updateAllTimes;
    if (typeof originalUpdateAllTimes === 'function') {
        window.updateAllTimes = function() {
            // Call the original function first
            originalUpdateAllTimes();
            
            // Then update EU time
            updateEuCentralTime();
        };
    }
    
    // Add EU ports to the updatePendingItems function
    const originalUpdatePendingItems = window.updatePendingItems;
    if (typeof originalUpdatePendingItems === 'function') {
        window.updatePendingItems = function() {
            const activePage = localStorage.getItem('activePage');
            if (activePage === 'eu') {
                updatePendingEuPortArrivals();
            } else {
                // Call the original function
                originalUpdatePendingItems();
            }
        };
    }
})();