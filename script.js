// Event listeners setup
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app
    initializePortDropdown();
    initializeClocks();
    
    // Start periodic updates for departure table
    setInterval(updateCountdownTimers, 1000);
    
    // Set up button event listeners
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('informUWI').addEventListener('click', informUWI);
    document.getElementById('informK9').addEventListener('click', informK9);
    document.getElementById('addVessel').addEventListener('click', () => {
        document.getElementById('addVesselModal').style.display = 'block';
    });
    document.getElementById('deleteSelected').addEventListener('click', deleteSelected);
    document.getElementById('markAsDeparted').addEventListener('click', markAsDeparted);
    document.getElementById('connectDB').addEventListener('click', () => {
        document.getElementById('dbModal').style.display = 'block';
    });
    
    // Modal close buttons
    document.getElementById('closeAddModal').addEventListener('click', () => {
        document.getElementById('addVesselModal').style.display = 'none';
    });
    document.getElementById('cancelAddVessel').addEventListener('click', () => {
        document.getElementById('addVesselModal').style.display = 'none';
    });
    document.getElementById('closeEditModal').addEventListener('click', () => {
        document.getElementById('editCellModal').style.display = 'none';
    });
    document.getElementById('cancelEditCell').addEventListener('click', () => {
        document.getElementById('editCellModal').style.display = 'none';
    });
    document.getElementById('closeDbModal').addEventListener('click', () => {
        document.getElementById('dbModal').style.display = 'none';
    });
    document.getElementById('cancelDbConfig').addEventListener('click', () => {
        document.getElementById('dbModal').style.display = 'none';
    });
    document.getElementById('closeFilteredModal').addEventListener('click', () => {
        document.getElementById('filteredDataModal').style.display = 'none';
    });
    document.getElementById('closeFiltered').addEventListener('click', () => {
        document.getElementById('filteredDataModal').style.display = 'none';
    });
    document.getElementById('copyToClipboard').addEventListener('click', copyToClipboard);
    
    // Form submissions
    document.getElementById('addVesselForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addNewVessel(e.target);
    });
    document.getElementById('editCellForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEditedCell(e.target);
    });
    document.getElementById('dbConfigForm').addEventListener('submit', (e) => {
        e.preventDefault();
        connectToDatabase(e.target);
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        const modals = document.getElementsByClassName('modal');
        for (let modal of modals) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        }
    });
    
    // ESC key handling for modals
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const modals = document.getElementsByClassName('modal');
            for (let modal of modals) {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                    break;
                }
            }
        }
    });
    
    // Try to load data on startup
    // First try from database
    testDatabaseConnection()
        .then(success => {
            if (success) {
                fetchVesselsFromDatabase();
            } else {
                // Fall back to localStorage if database connection fails
                loadVesselsFromLocalStorage();
            }
        })
        .catch(error => {
            console.error('Error testing database connection:', error);
            // Fall back to localStorage
            loadVesselsFromLocalStorage();
        });
});

// App data
const app = {
    darkMode: false,
    selectedRow: null,
    dbConnection: false,
    apiUrl: 'https://web-inspections.onrender.com', // CHANGE THIS to your actual server URL
    portToTimezone: {
        "Colon": "America/Panama",
        "Rodman": "America/Panama",
        "Cristobal": "America/Panama",
        "Balboa": "America/Panama",
        "Lazaro Cardenas": "America/Mexico_City",
        "Manzanillo": "America/Mexico_City",
        "Altamira": "America/Mexico_City",
        "Marsarxolkx": "Europe/Malta",
        "Santos": "America/Sao_Paulo",
        "Rio De Janeiro": "America/Sao_Paulo",
        "Rotterdam": "Europe/Amsterdam",
        "Moin": "America/Costa_Rica",
        "Freeport": "America/Nassau",
        "Antwerp": "Europe/Brussels",
        "Salvador": "America/Bahia",
        "Manzanillo": "America/Panama"
    },
    panamaPorts: ["Colon", "Rodman", "Cristobal", "Balboa"],
    clockCities: ["Panama", "Altamira", "Salvador", "Antwerp", "Freeport", "Moin", "Santos",],
    vessels: [],
    filteredVessels: [],
    clockIntervals: []
};

// Save vessels to localStorage
function saveVesselsToLocalStorage() {
    localStorage.setItem('vessels', JSON.stringify(app.vessels));
}

// Load vessels from localStorage
function loadVesselsFromLocalStorage() {
    const storedVessels = localStorage.getItem('vessels');
    if (storedVessels) {
        app.vessels = JSON.parse(storedVessels);
        populateMainTable();
        updateDepartureTable();
        return true;
    }
    return false;
}

// Test database connection
function testDatabaseConnection() {
    return fetch(`${app.apiUrl}/db-connector.php/test`)
        .then(response => {
            // Add error handling for non-OK responses
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error testing database connection:', error);
            app.dbConnection = false;
            return false;
        });
}

// Function to fetch vessels from database
function fetchVesselsFromDatabase() {
    fetch(`${app.apiUrl}/vessels`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                app.vessels = data.data.vessels;
                populateMainTable();
                updateDepartureTable();
                
                // Also save to localStorage as backup
                saveVesselsToLocalStorage();
            } else {
                console.error('Error fetching vessels:', data.message);
                // Try to load from localStorage as fallback
                loadVesselsFromLocalStorage();
            }
        })
        .catch(error => {
            console.error('Error fetching vessels:', error);
            // Try to load from localStorage as fallback
            loadVesselsFromLocalStorage();
        });
}

// Function to add a vessel to the database
function addVesselToDatabase(vessel) {
    fetch(`${app.apiUrl}/vessels`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(vessel)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Refresh vessel list
            fetchVesselsFromDatabase();
        } else {
            console.error('Error adding vessel:', data.message);
            // Add locally as fallback
            app.vessels.push(vessel);
            saveVesselsToLocalStorage();
            populateMainTable();
            updateDepartureTable();
        }
    })
    .catch(error => {
        console.error('Error adding vessel:', error);
        // Add locally as fallback
        app.vessels.push(vessel);
        saveVesselsToLocalStorage();
        populateMainTable();
        updateDepartureTable();
    });
}

// Function to update a vessel field in the database
function updateVesselFieldInDatabase(id, field, value) {
    fetch(`${app.apiUrl}/vessels/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            field: field,
            value: value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Vessel field updated successfully');
        } else {
            console.error('Error updating vessel field:', data.message);
        }
        // Always save to localStorage as backup
        saveVesselsToLocalStorage();
    })
    .catch(error => {
        console.error('Error updating vessel field:', error);
        // Always save to localStorage as backup
        saveVesselsToLocalStorage();
    });
}

// Function to delete a vessel from the database
function deleteVesselFromDatabase(id) {
    fetch(`${app.apiUrl}/vessels/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Refresh vessel list
            fetchVesselsFromDatabase();
        } else {
            console.error('Error deleting vessel:', data.message);
            // Remove locally as fallback
            const index = app.vessels.findIndex(v => v.id === id);
            if (index !== -1) {
                app.vessels.splice(index, 1);
                saveVesselsToLocalStorage();
                app.selectedRow = null;
                populateMainTable();
                updateDepartureTable();
            }
        }
    })
    .catch(error => {
        console.error('Error deleting vessel:', error);
        // Remove locally as fallback
        const index = app.vessels.findIndex(v => v.id === id);
        if (index !== -1) {
            app.vessels.splice(index, 1);
            saveVesselsToLocalStorage();
            app.selectedRow = null;
            populateMainTable();
            updateDepartureTable();
        }
    });
}

// Database connection handling
function connectToDatabase(form) {
    const statusElement = document.getElementById('dbStatus');
    statusElement.textContent = "Testing database connection...";
    
    testDatabaseConnection()
        .then(success => {
            if (success) {
                statusElement.textContent = "Connected successfully!";
                app.dbConnection = true;
                
                // Load data from database
                fetchVesselsFromDatabase();
                
                // Close modal after a short delay
                setTimeout(() => {
                    document.getElementById('dbModal').style.display = 'none';
                }, 1500);
            } else {
                statusElement.textContent = "Connection failed. Using localStorage instead.";
                statusElement.classList.add('text-danger');
                app.dbConnection = false;
                
                // Load from localStorage
                loadVesselsFromLocalStorage();
            }
        })
        .catch(error => {
            statusElement.textContent = `Error: ${error.message}`;
            statusElement.classList.add('text-danger');
            app.dbConnection = false;
            
            // Load from localStorage
            loadVesselsFromLocalStorage();
        });
}

// Initialize port dropdown in the add vessel form
function initializePortDropdown() {
    const portSelect = document.getElementById('port');
    portSelect.innerHTML = '';

    Object.keys(app.portToTimezone).forEach(port => {
        const option = document.createElement('option');
        option.value = port;
        option.textContent = port;
        portSelect.appendChild(option);
    });
}

// Copy filtered data to clipboard
function copyToClipboard() {
    try {
        // Filter out departed vessels
        const activeVessels = app.filteredVessels.filter(vessel => !vessel.departed);
        
        if (activeVessels.length === 0) {
            alert("No active vessels to copy.");
            return;
        }
        
        // Format data with ETB and ETD labels
        let dataStr = "";
        activeVessels.forEach(vessel => {
            const vesselName = vessel.vessels;
            const etb = `    | ETB ${vessel.etb} =>`;
            const etd = `ETD ${vessel.etd} |  `;
            const port = vessel.port;
            const comments = vessel.comments;
            
            // Format the row
            let rowStr = `${vesselName}    ${etb} ${etd}    ${port}`;
            if (comments) {
                rowStr += `  ${comments}`;
            }
            dataStr += rowStr + "\n";
        });
        
        // Copy to clipboard
        navigator.clipboard.writeText(dataStr)
            .then(() => alert("Data copied to clipboard."))
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert("Failed to copy to clipboard.");
            });
    } catch (error) {
        console.error("Error copying to clipboard:", error);
        alert("Failed to copy to clipboard.");
    }
}

// Handle cell editing
function handleCellEdit(event) {
    const row = event.currentTarget;
    const index = parseInt(row.dataset.index);
    const vessel = app.vessels[index];
    const cellIndex = Array.from(row.cells).indexOf(event.target);
    
    if (cellIndex === -1) return;
    
    const columns = ["inspection", "vessels", "etb", "etd", "port", "comments"];
    const columnName = columns[cellIndex];
    const currentValue = vessel[columnName];
    
    const modal = document.getElementById('editCellModal');
    const titleElement = document.getElementById('cellTitle');
    const labelElement = document.getElementById('cellLabel');
    const inputElement = document.getElementById('cellValue');
    const selectElement = document.getElementById('cellValueSelect');
    
    titleElement.textContent = columnName.charAt(0).toUpperCase() + columnName.slice(1);
    labelElement.textContent = `Edit ${titleElement.textContent}:`;
    
    // Special handling for dropdown fields
    if (columnName === 'inspection') {
        inputElement.style.display = 'none';
        selectElement.style.display = 'block';
        selectElement.innerHTML = '';
        
        ["Both", "K9", "Underwater"].forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option;
            optionEl.textContent = option;
            if (option === currentValue) optionEl.selected = true;
            selectElement.appendChild(optionEl);
        });
    } else if (columnName === 'port') {
        inputElement.style.display = 'none';
        selectElement.style.display = 'block';
        selectElement.innerHTML = '';
        
        Object.keys(app.portToTimezone).forEach(port => {
            const option = document.createElement('option');
            option.value = port;
            option.textContent = port;
            if (port === currentValue) option.selected = true;
            selectElement.appendChild(option);
        });
    } else {
        inputElement.style.display = 'block';
        selectElement.style.display = 'none';
        inputElement.value = currentValue;
    }
    
    // Store vessel index and column for the save function
    modal.dataset.vesselIndex = index;
    modal.dataset.columnName = columnName;
    
    modal.style.display = 'block';
    
    if (inputElement.style.display !== 'none') {
        inputElement.focus();
        inputElement.select();
    }
}

// Save edited cell value
function saveEditedCell(form) {
    const modal = document.getElementById('editCellModal');
    const index = parseInt(modal.dataset.vesselIndex);
    const columnName = modal.dataset.columnName;
    const inputElement = document.getElementById('cellValue');
    const selectElement = document.getElementById('cellValueSelect');
    
    // Get value from the appropriate input
    let newValue;
    if (inputElement.style.display === 'none') {
        newValue = selectElement.value;
    } else {
        newValue = inputElement.value;
    }
    
    // Update the vessel data
    app.vessels[index][columnName] = newValue;
    
    // If connected to DB, update in database
    if (app.dbConnection && app.vessels[index].id) {
        updateVesselFieldInDatabase(app.vessels[index].id, columnName, newValue);
    } else {
        // Otherwise just save to localStorage
        saveVesselsToLocalStorage();
    }
    
    // Update tables
    populateMainTable();
    if (columnName === 'etd' || columnName === 'etb') {
        updateDepartureTable();
    }
    
    modal.style.display = 'none';
}

// Change vessel inspection timing
function changeVesselTiming(vessel) {
    const currentTiming = vessel.inspectionTiming;
    const newTiming = currentTiming === 'Upon Arrival' ? 'Upon Departure' : 'Upon Arrival';
    
    if (confirm(`Change inspection timing for ${vessel.vessels} from ${currentTiming} to ${newTiming}?`)) {
        // Find vessel index
        const index = app.vessels.findIndex(v => v.vessels === vessel.vessels);
        if (index !== -1) {
            app.vessels[index].inspectionTiming = newTiming;
            
            // If connected to DB, update in database
            if (app.dbConnection && app.vessels[index].id) {
                updateVesselFieldInDatabase(app.vessels[index].id, 'inspectionTiming', newTiming);
            } else {
                saveVesselsToLocalStorage();
            }
            
            updateDepartureTable();
        }
    }
}

// Add new vessel
function addNewVessel(form) {
    const inspection = document.getElementById('inspectionType').value;
    const inspectionTiming = document.getElementById('inspectionTiming').value;
    const vessels = document.getElementById('vesselName').value;
    const etb = document.getElementById('etb').value;
    const etd = document.getElementById('etd').value;
    const port = document.getElementById('port').value;
    const comments = document.getElementById('comments').value;
    
    if (!vessels || !etb || !etd || !port) {
        alert("Vessels, ETB, ETD, and Port are required fields.");
        return;
    }
    
    // Create new vessel object
    const newVessel = {
        inspection,
        inspectionTiming,
        vessels,
        etb,
        etd,
        port,
        comments,
        departed: false
    };
    
    // If connected to DB, save to database
    if (app.dbConnection) {
        addVesselToDatabase(newVessel);
    } else {
        // Otherwise add locally and save to localStorage
        app.vessels.push(newVessel);
        saveVesselsToLocalStorage();
        
        // Update tables
        populateMainTable();
        updateDepartureTable();
    }
    
    // Close modal
    document.getElementById('addVesselModal').style.display = 'none';
    
    // Reset form
    form.reset();
}

// Mark selected vessel as departed
function markAsDeparted() {
    if (app.selectedRow === null) {
        alert("No vessel selected.");
        return;
    }
    
    // Toggle departed status
    const currentStatus = app.vessels[app.selectedRow].departed;
    app.vessels[app.selectedRow].departed = !currentStatus;
    
    // If connected to DB, update in database
    if (app.dbConnection && app.vessels[app.selectedRow].id) {
        updateVesselFieldInDatabase(app.vessels[app.selectedRow].id, 'departed', !currentStatus);
    } else {
        saveVesselsToLocalStorage();
    }
    
    if (!currentStatus) {
        alert("Vessel marked as departed.");
    } else {
        alert("Vessel marked as not departed.");
    }
    
    // Update tables
    populateMainTable();
    updateDepartureTable();
}

// Delete selected vessel
function deleteSelected() {
    if (app.selectedRow === null) {
        alert("No vessel selected.");
        return;
    }
    
    if (confirm("Are you sure you want to delete the selected vessel?")) {
        // If connected to DB and vessel has ID, delete from database
        if (app.dbConnection && app.vessels[app.selectedRow].id) {
            deleteVesselFromDatabase(app.vessels[app.selectedRow].id);
        } else {
            // Remove vessel from array
            app.vessels.splice(app.selectedRow, 1);
            saveVesselsToLocalStorage();
            
            // Reset selection
            app.selectedRow = null;
            
            // Update tables
            populateMainTable();
            updateDepartureTable();
        }
    }
}

// Initialize clocks
function initializeClocks() {
    const clockPanel = document.getElementById('clockPanel');
    clockPanel.innerHTML = '';

    app.clockCities.forEach(city => {
        const cityDiv = document.createElement('div');
        cityDiv.className = 'city-clock';
        
        const cityName = document.createElement('div');
        cityName.className = 'city-name';
        cityName.textContent = city;
        
        const cityTime = document.createElement('div');
        cityTime.className = 'city-time';
        cityTime.id = `clock-${city}`;
        
        cityDiv.appendChild(cityName);
        cityDiv.appendChild(cityTime);
        clockPanel.appendChild(cityDiv);
    });

    // Clear existing intervals
    app.clockIntervals.forEach(interval => clearInterval(interval));
    app.clockIntervals = [];

    // Start updating clocks
    updateAllClocks();
    app.clockIntervals.push(setInterval(updateAllClocks, 1000));
}

// Update all city clocks
function updateAllClocks() {
    app.clockCities.forEach(city => {
        const timezone = app.portToTimezone[city] || "America/Panama";
        const cityTime = document.getElementById(`clock-${city}`);
        
        const now = new Date();
        const options = { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        cityTime.textContent = now.toLocaleTimeString([], options);
    });
}

// Populate main table with vessel data
function populateMainTable() {
    const tableBody = document.querySelector('#mainTable tbody');
    tableBody.innerHTML = '';

    app.vessels.forEach((vessel, index) => {
        const row = document.createElement('tr');
        if (vessel.departed) row.classList.add('departed');
        
        row.innerHTML = `
            <td>${vessel.inspection}</td>
            <td>${vessel.vessels}</td>
            <td class="center-align">${vessel.etb}</td>
            <td class="center-align">${vessel.etd}</td>
            <td class="center-align">${vessel.port}</td>
            <td>${vessel.comments || ''}</td>
        `;
        
        row.dataset.index = index;
        row.addEventListener('dblclick', handleCellEdit);
        row.addEventListener('click', () => {
            // Handle row selection
            document.querySelectorAll('#mainTable tbody tr.selected').forEach(el => {
                el.classList.remove('selected');
            });
            row.classList.add('selected');
            app.selectedRow = index;
        });

        tableBody.appendChild(row);
    });
}

// Update departure table with priority vessels
function updateDepartureTable() {
    const tableBody = document.querySelector('#departureTable tbody');
    tableBody.innerHTML = '';

    // Filter out departed vessels
    const activeVessels = app.vessels.filter(vessel => !vessel.departed);
    
    if (activeVessels.length === 0) return;

    // Group vessels by inspection timing
    const arrivalVessels = activeVessels
        .filter(vessel => vessel.inspectionTiming === 'Upon Arrival')
        .sort((a, b) => a.etb.localeCompare(b.etb));

    const departureVessels = activeVessels
        .filter(vessel => vessel.inspectionTiming !== 'Upon Arrival')
        .sort((a, b) => a.etd.localeCompare(b.etd));

    // Combine the groups (arrival vessels first)
    const sortedVessels = [...arrivalVessels, ...departureVessels];
    
    // Take top 20 vessels
    const displayVessels = sortedVessels.slice(0, 20);

    displayVessels.forEach((vessel, index) => {
        const row = document.createElement('tr');
        
        // Determine which time field to use
        const timeField = vessel.inspectionTiming === 'Upon Arrival' ? 'ETB' : 'ETD';
        const timeValue = vessel.inspectionTiming === 'Upon Arrival' ? vessel.etb : vessel.etd;
        
        // Calculate time left
        const timeLeft = calculateTimeLeft(timeValue, vessel.port);
        
        // Determine class for time left
        const timeLeftClass = timeLeft.startsWith('Delayed') ? 'delayed' : '';
        
        row.innerHTML = `
            <td>${vessel.inspection}</td>
            <td>${vessel.inspectionTiming}</td>
            <td>${vessel.vessels}</td>
            <td class="center-align">${timeField}: ${timeValue}</td>
            <td class="center-align">${vessel.port}</td>
            <td class="center-align ${timeLeftClass}">${timeLeft}</td>
        `;
        
        // Add context menu for inspection timing change
        row.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            changeVesselTiming(vessel);
        });
        
        tableBody.appendChild(row);
    });
}

// IMPROVED: Calculate time left based on ETD and port timezone
function calculateTimeLeft(etdStr, port) {
    try {
        // Get timezone for port
        const timezoneName = app.portToTimezone[port] || "America/Panama";
        
        // Current date
        const now = new Date();
        
        // Parse the ETD string (DD/MM - HHMM) or (DD/MM / HHMM) format
        let datePart, timePart;
        
        if (etdStr.includes(' - ')) {
            [datePart, timePart] = etdStr.split(' - ');
        } else if (etdStr.includes(' / ')) {
            [datePart, timePart] = etdStr.split(' / ');
        } else if (etdStr === 'tbc') {
            return "To be confirmed";
        } else {
            console.log("Unparseable ETD format:", etdStr);
            return "Invalid ETD format";
        }
        
        // Handle formats like "31/03" or "31/03"
        const [day, month] = datePart.split('/').map(part => part.trim());
        
        // Parse hour and minute
        let hour, minute;
        if (timePart && timePart.length === 4) {
            // Format: 1700
            hour = timePart.substring(0, 2);
            minute = timePart.substring(2, 4);
        } else if (timePart) {
            // Format: may have spaces, try to parse the time
            const timeMatch = timePart.match(/(\d{1,2})(\d{2})/);
            if (timeMatch) {
                hour = timeMatch[1];
                minute = timeMatch[2];
            } else {
                return "Invalid time format";
            }
        } else {
            return "Invalid time format";
        }
        
        // Get current year
        const currentYear = now.getFullYear();
        
        // Create dates for comparison
        // Current date in the port's timezone
        const options = { 
            timeZone: timezoneName, 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
        };
        
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const portDateParts = formatter.formatToParts(now);
        
        const portDateObj = {};
        portDateParts.forEach(part => {
            if (part.type !== 'literal') {
                portDateObj[part.type] = part.value;
            }
        });
        
        // Convert port time to a date object
        const portNowString = `${portDateObj.year}-${portDateObj.month}-${portDateObj.day}T${portDateObj.hour}:${portDateObj.minute}:${portDateObj.second}`;
        const portNow = new Date(portNowString);
        
        // Create ETD date - first try assuming current year
        let etdYear = currentYear;
        const currentMonth = portNow.getMonth() + 1; // JavaScript months are 0-based
        
        // If the ETD month is earlier than current month and we're late in the year,
        // it's probably referring to next year
        if (parseInt(month) < currentMonth && currentMonth > 10 && parseInt(month) < 3) {
            etdYear = currentYear + 1;
        }
        
        // Format with proper padding for month and day
        const paddedMonth = month.padStart(2, '0');
        const paddedDay = day.padStart(2, '0');
        const paddedHour = hour.padStart(2, '0');
        const paddedMinute = minute.padStart(2, '0');
        
        // Create ETD date object
        const etdDateString = `${etdYear}-${paddedMonth}-${paddedDay}T${paddedHour}:${paddedMinute}:00`;
        const etdDate = new Date(etdDateString);
        
        // Get ETD time in the port's timezone
        const etdOptions = { timeZone: timezoneName };
        const etdDateInPortTZ = new Date(etdDate.toLocaleString('en-US', etdOptions));
        
        // Calculate time difference in seconds
        const diffInSeconds = (etdDate - portNow) / 1000;
        
        if (diffInSeconds < 0) {
            // ETD has passed
            const timePassed = Math.abs(diffInSeconds);
            const days = Math.floor(timePassed / 86400);
            const hours = Math.floor((timePassed % 86400) / 3600);
            const minutes = Math.floor((timePassed % 3600) / 60);
            const seconds = Math.floor(timePassed % 60);
            
            if (days > 0) {
                return `Delayed ${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else {
                return `Delayed ${hours}h ${minutes}m ${seconds}s`;
            }
        } else {
            // ETD is in the future
            const days = Math.floor(diffInSeconds / 86400);
            const hours = Math.floor((diffInSeconds % 86400) / 3600);
            const minutes = Math.floor((diffInSeconds % 3600) / 60);
            const seconds = Math.floor(diffInSeconds % 60);
            
            if (days > 0) {
                return `${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else {
                if (hours > 0) {
                    return `${hours}h ${minutes}m ${seconds}s`;
                } else {
                    return `${minutes}m ${seconds}s`;
                }
            }
        }
    } catch (error) {
        console.error("Error calculating time left:", error, "for ETD:", etdStr, "port:", port);
        return "Invalid ETD";
    }
}

// Update countdown timers
function updateCountdownTimers() {
    const rows = document.querySelectorAll('#departureTable tbody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 6) return;
        
        const etdCell = cells[3];
        const portCell = cells[4];
        const timeLeftCell = cells[5];
        
        // Extract time value from ETD cell (format: "ETB/ETD: time")
        const timeInfo = etdCell.textContent;
        const timeValue = timeInfo.split(': ')[1] || timeInfo;
        
        const port = portCell.textContent;
        
        // Calculate new time left
        const timeLeft = calculateTimeLeft(timeValue, port);
        
        // Update time left cell
        timeLeftCell.textContent = timeLeft;
        
        // Update class for delayed items
        if (timeLeft.startsWith('Delayed')) {
            timeLeftCell.classList.add('delayed');
        } else {
            timeLeftCell.classList.remove('delayed');
        }
    });
}

// Toggle theme between light and dark mode
function toggleTheme() {
    app.darkMode = !app.darkMode;
    document.body.classList.toggle('dark-mode', app.darkMode);
    
    // Update theme toggle button icon
    const themeButton = document.getElementById('themeToggle');
    if (app.darkMode) {
        themeButton.innerHTML = '<i class="fas fa-sun"></i> Toggle Theme';
    } else {
        themeButton.innerHTML = '<i class="fas fa-moon"></i> Toggle Theme';
    }
}

// Show inform UWI modal with filtered data
function informUWI() {
    // Filter for UWI inspections AND Panama ports
    app.filteredVessels = app.vessels.filter(vessel => 
        (vessel.inspection === 'Both' || vessel.inspection === 'Underwater') && 
        app.panamaPorts.includes(vessel.port)
    );

    if (app.filteredVessels.length === 0) {
        alert("No UWI inspection vessels found for Panama ports.");
        return;
    }

    showFilteredData("UWI Inspections Required (Panama Ports)");
}

// Show inform K9 modal with filtered data
function informK9() {
    // Filter for K9 inspections AND Panama ports
    app.filteredVessels = app.vessels.filter(vessel => 
        (vessel.inspection === 'Both' || vessel.inspection === 'K9') && 
        app.panamaPorts.includes(vessel.port)
    );

    if (app.filteredVessels.length === 0) {
        alert("No K9 inspection vessels found for Panama ports.");
        return;
    }

    showFilteredData("K9 Inspections Required (Panama Ports)");
}

function showFilteredData(title) {
    const modal = document.getElementById('filteredDataModal');
    const titleElement = document.getElementById('filteredTitle');
    const tableBody = document.querySelector('#filteredTable tbody');
    
    titleElement.textContent = title;
    tableBody.innerHTML = '';
    
    app.filteredVessels.forEach(vessel => {
        const row = document.createElement('tr');
        if (vessel.departed) row.classList.add('departed');
        
        row.innerHTML = `
            <td>${vessel.inspection}</td>
            <td>${vessel.vessels}</td>
            <td class="center-align">${vessel.etb}</td>
            <td class="center-align">${vessel.etd}</td>
            <td class="center-align">${vessel.port}</td>
            <td>${vessel.comments || ''}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    modal.style.display = 'block';
}
