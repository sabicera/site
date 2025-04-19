// Simple solution - modify the existing code directly
(function() {
    // First, add the tab
    const navTabs = document.querySelector('.nav-tabs');
    if (navTabs) {
        const combinedTab = document.createElement('div');
        combinedTab.id = 'combined-tab';
        combinedTab.className = 'nav-tab';
        combinedTab.textContent = 'All Priorities';
        navTabs.appendChild(combinedTab);
        
        // Then, create the combined page structure (similar to existing pages)
        const panamaPage = document.getElementById('panama-page');
        if (panamaPage && panamaPage.parentNode) {
            const combinedPage = document.createElement('div');
            combinedPage.id = 'combined-page';
            combinedPage.className = 'page';
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
                        <span class="label">All Priorities:</span>
                        <span id="combined-time" class="time">DD/MM HH:MM:SS</span>
                    </div>
                    <div class="header-buttons">
                        <button id="combined-refresh-btn" class="btn btn-primary">Refresh</button>
                    </div>
                </header>
                <main>
                    <div class="split-container">
                        <div class="panel">
                            <div class="pending-container">
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
                        </div>
                    </div>
                </main>
            `;
            
            // Add it to the DOM in the same parent as the panama page
            panamaPage.parentNode.insertBefore(combinedPage, document.getElementById('pending-modal'));
            
            // Add CSS for the location badges
            const style = document.createElement('style');
            style.textContent = `
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
            
            // Set up tab click behavior
            combinedTab.addEventListener('click', function() {
                // Hide other pages, show this one
                document.querySelectorAll('.nav-tab').forEach(tab => {
                    tab.addEventListener('click', function() {
                        const targetId = this.id.replace('-tab', '');
                        
                        // Remove active class from all tabs and pages
                        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                        
                        // Add active class to clicked tab and corresponding page
                        this.classList.add('active');
                        document.getElementById(targetId + '-page').classList.add('active');
                        
                        // Update localStorage
                        localStorage.setItem('activePage', targetId);
                    });
                });                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                combinedTab.classList.add('active');
                combinedPage.classList.add('active');
                
                // Update the display
                updateCombinedTable();
            });
            
            // Add theme toggle functionality
            const combinedThemeToggle = document.getElementById('combined-theme-toggle-checkbox');
            if (combinedThemeToggle) {
                const savedTheme = localStorage.getItem('theme') || 'dark';
                combinedThemeToggle.checked = savedTheme === 'dark';
                
                combinedThemeToggle.addEventListener('change', function(e) {
                    const isDark = e.target.checked;
                    document.body.classList.toggle('light-theme', !isDark);
                    document.querySelectorAll('.toggle-label').forEach(label => {
                        label.textContent = isDark ? 'Dark Mode' : 'Light Mode';
                    });
                    localStorage.setItem('theme', isDark ? 'dark' : 'light');
                    
                    // Sync other checkboxes
                    document.querySelectorAll('input[type="checkbox"][id$="theme-toggle-checkbox"]').forEach(cb => {
                        if (cb !== e.target) cb.checked = isDark;
                    });
                });
            }
            
            // Add refresh button functionality
            const refreshBtn = document.getElementById('combined-refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', updateCombinedTable);
            }
            
            // Function to update the combined table
            function updateCombinedTable() {
                const combinedTbody = document.getElementById('combined-pending-tbody');
                if (!combinedTbody) return;
                
                // Clear the table
                combinedTbody.innerHTML = '';
                
                // Get data from both tables
                const allItems = [];
                
                // Get Panama data
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
                
                // Get Brazil/Mexico data
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
                        locationBadge.className = `location-badge location-${item.location.toLowerCase()}`;
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
                updateTimeDisplay();
            }
            
            // Helper function to get priority from a row
            function getPriorityFromRow(row) {
                if (row.classList.contains('urgent-row')) return 'urgent';
                if (row.classList.contains('priority-row')) return 'priority';
                if (row.classList.contains('upcoming-row')) return 'upcoming';
                if (row.classList.contains('overdue-row')) return 'overdue';
                return 'normal';
            }
            
            // Helper function to parse time left text to hours
            function parseTimeLeft(timeLeftText) {
                if (timeLeftText.includes('Overdue')) {
                    // Parse "Overdue: Xh Ym ago"
                    const match = timeLeftText.match(/Overdue:\s+(\d+)h\s+(\d+)m\s+ago/);
                    if (match) {
                        const hours = parseInt(match[1]);
                        const minutes = parseInt(match[2]);
                        return -(hours + minutes / 60);
                    }
                } else {
                    // Parse "Xh Ym"
                    const match = timeLeftText.match(/(\d+)h\s+(\d+)m/);
                    if (match) {
                        const hours = parseInt(match[1]);
                        const minutes = parseInt(match[2]);
                        return hours + minutes / 60;
                    }
                }
                return 999; // Default high value if can't parse
            }
            
            // Function to update the time display
            function updateTimeDisplay() {
                const timeElement = document.getElementById('combined-time');
                if (timeElement) {
                    const now = new Date();
                    const day = String(now.getDate()).padStart(2, '0');
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    const seconds = String(now.getSeconds()).padStart(2, '0');
                    
                    timeElement.textContent = `${day}/${month} ${hours}:${minutes}:${seconds}`;
                }
            }
            
            // Set up regular time updates
            setInterval(updateTimeDisplay, 1000);
            updateTimeDisplay();
            
            // Update the table every 10 seconds when active
            setInterval(() => {
                if (combinedPage.classList.contains('active')) {
                    updateCombinedTable();
                }
            }, 10000);
            
            console.log('Combined view initialized');
        }
    }
})();
