// Application state
let vessels = [];
let selectedRow = null;
let updateInterval = null;
let searchQuery = '';

// Helper function to format datetime as DD/MM HH:MM
function formatDateTimeDisplay(datetimeString) {
   if (!datetimeString) return '';
   try {
      const date = new Date(datetimeString);
      if (isNaN(date.getTime())) return datetimeString;
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month} ${hours}:${minutes}`;
   } catch (e) {
      return datetimeString;
   }
}

// Helper function to parse user-entered date input
function parseUserDateInput(input) {
   if (!input) return '';
   
   input = input.trim();
   
   // Try to match various formats:
   // DD/MM HH:MM, DD/MM HHMM, DD/MM HH MM
   const patterns = [
      // DD/MM HH:MM or DD/MM/YY HH:MM or DD/MM/YYYY HH:MM
      /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2}):(\d{2})$/,
      // DD/MM HHMM (no colon or space)
      /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{2})(\d{2})$/,
      // DD/MM HH MM (space instead of colon)
      /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2})\s+(\d{2})$/,
   ];
   
   for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
         const day = match[1].padStart(2, '0');
         const month = match[2].padStart(2, '0');
         let year = match[3] || new Date().getFullYear().toString();
         if (year.length === 2) year = '20' + year;
         const hours = match[4].padStart(2, '0');
         const minutes = match[5].padStart(2, '0');
         
         // Validate values
         if (parseInt(month) > 12 || parseInt(day) > 31 || parseInt(hours) > 23 || parseInt(minutes) > 59) {
            return null;
         }
         
         return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
   }
   
   return null;
}

// Helper function to parse Excel date serial numbers
function parseExcelDate(excelDate) {
   if (typeof excelDate === 'number') {
      // Excel date serial number (days since 1900-01-01)
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date;
   } else if (excelDate instanceof Date) {
      return excelDate;
   } else if (typeof excelDate === 'string') {
      return new Date(excelDate);
   }
   return null;
}

// Ports categorized by region with timezones
const PORT_CATEGORIES = {
   'Panama': {
      ports: ['BALBOA', 'BALB ANCHORAGE', 'CRISTOBAL', 'COLON', 'RODMAN', 'MANZANILLO (PANAMA)', 'MANZANILLO', 'COLON INNER ANCHORAGE', 'BALB ANCH', 'CRISTOBAL ANCHORAGE', 'CRISTOBAL INNER ANCHORAGE', 'BALBOA ANCHORAGE', 'BALB ANCH / PAN CAN', 'COLON INNER ANCHORAGE', 'CRISTOBAL ANCH'],
      timezone: 'America/Panama',
      offset: -5
   },
   'Brazil': {
      ports: ['SANTOS', 'PARANAGUA', 'RIO GRANDE', 'ITAJAI', 'NAVEGANTES', 'RIO DE JANEIRO', 'RDJ', 'SALVADOR', 'PECEM'],
      timezone: 'America/Sao_Paulo',
      offset: -3
   },
   'Freeport': {
      ports: ['FREEPORT', 'FREEPORT ANCHORAGE'],
      timezone: 'America/Nassau',
      offset: -5
   },
   'Colombia': {
      ports: ['CARTAGENA','BUENAVENTURA'],
      timezone: 'America/Bogota',
      offset: -5
   },
   'Dominican Republic': {
      ports: ['CAUCEDO'],
      timezone: 'America/Santo_Domingo',
      offset: -4
   },
   'Chile': {
      ports: ['LIRQUEN', 'SAN ANTONIO', 'CORONEL', 'VALPARAISO'],
      timezone: 'America/Santiago',
      offset: -3
   },
   'Equador': {
      ports: ['GUAYAQUIL', 'PUERTO BOLIVAR'],
      timezone: 'America/Guayaquil',
      offset: -5
   },
   'Costa Rica': {
      ports: ['MOIN'],
      timezone: 'America/Costa_Rica',
      offset: -6
   },
   'Europe': {
      ports: ['MALTA', 'MALAGA', 'HAMBURG', 'CIVITAVECCHIA', 'LE HAVRE', 'ANTWERP', 'ROTTERDAM', 'LAS PALMAS', 'VALENCIA', 'MARSAXLOKK', ],
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

// Port flag mappings
const PORT_FLAGS = {
   // Panama
   'BALBOA': '🇵🇦',
   'PA BALBOA': '🇵🇦',
   'CRISTOBAL': '🇵🇦',
   'PA CRISTOBAL': '🇵🇦',
   'BALB ANCHORAGE': '🇵🇦',
   'COLON': '🇵🇦',
   'PA COLON': '🇵🇦',
   'RODMAN': '🇵🇦',
   'PA RODMAN': '🇵🇦',
   'MANZANILLO (PANAMA)': '🇵🇦',
   'MANZANILLO': '🇵🇦',
   'PA MANZANILLO': '🇵🇦',
   'COLON ANCHORAGE': '🇵🇦',
   'PA COLON ANCHORAGE': '🇵🇦',
   'BALB ANCH': '🇵🇦',
   'PA BALB ANCH': '🇵🇦',
   'CRISTOBAL ANCHORAGE': '🇵🇦',
   'PA CRISTOBAL ANCHORAGE': '🇵🇦',
   'BALBOA ANCHORAGE': '🇵🇦',
   'PA BALBOA ANCHORAGE': '🇵🇦',
   'BALB ANCH / PAN CAN': '🇵🇦',
   'COLON INNER ANCHORAGE': '🇵🇦',
   'CRISTOBAL ANCH': '🇵🇦',
   'PA CRISTOBAL ANCH': '🇵🇦',
   // Brazil
   'SANTOS': '🇧🇷',
   'BR SANTOS': '🇧🇷',
   'PARANAGUA': '🇧🇷',
   'BR PARANAGUA': '🇧🇷',
   'RIO GRANDE': '🇧🇷',
   'BR RIO GRANDE': '🇧🇷',
   'ITAJAI': '🇧🇷',
   'BR ITAJAI': '🇧🇷',
   'NAVEGANTES': '🇧🇷',
   'BR NAVEGANTES': '🇧🇷',
   'RIO DE JANEIRO': '🇧🇷',
   'BR RIO DE JANEIRO': '🇧🇷',
   'RDJ': '🇧🇷',
   'BR RDJ': '🇧🇷',
   'SALVADOR': '🇧🇷',
   'BR SALVADOR': '🇧🇷',
   'PECEM': '🇧🇷',
   'BR PECEM': '🇧🇷',
   // Bahamas
   'FREEPORT': '🇧🇸',
   'BS FREEPORT': '🇧🇸',
   'FREEPORT ANC': '🇧🇸',
   'BS FREEPORT ANC': '🇧🇸',
   // Colombia
   'CARTAGENA': '🇨🇴',
   'BUENAVENTURA': '🇨🇴',
   'CO CARTAGENA': '🇨🇴',
   // Equador
   'GUAYAQUIL': 'EC',
   'PUERTO BOLIVAR': 'EC',
   // Dominican Republic
   'CAUCEDO': '🇩🇴',
   // Chile
   'LIRQUEN': '🇨🇱',
   'CL LIRQUEN': '🇨🇱',
   'CORONEL': '🇨🇱',
   'CL CORONEL': '🇨🇱',
   'SAN ANTONIO': '🇨🇱',
   'CL SAN ANTONIO': '🇨🇱',
   'VALPARAISO': '🇨🇱',
   'CL VALPARAISO': '🇨🇱',
   // Costa Rica
   'MOIN': '🇨🇷',
   'CR MOIN': '🇨🇷',
   // Europe
   'MALAGA': '🇪🇸',
   'ES MALAGA': '🇪🇸',
   'MALTA': '🇲🇹',
   'MT MALTA': '🇲🇹',
   'HAMBURG': '🇩🇪',
   'DE HAMBURG': '🇩🇪',
   'LE HAVRE': '🇫🇷',
   'FR LE HAVRE': '🇫🇷',
   'ANTWERP': '🇧🇪',
   'BE ANTWERP': '🇧🇪',
   'ROTTERDAM': '🇳🇱',
   'NL ROTTERDAM': '🇳🇱',
   'LAS PALMAS': 'CI',
   'ES LAS PALMAS': 'CI',
   'VALENCIA': '🇪🇸',
   'ES VALENCIA': '🇪🇸',
   'MARSAXLOKK': '🇲🇹',
   'MT MARSAXLOKK': '🇲🇹'
};

// Get flag for a port
function getPortFlag(portName) {
   if (!portName) return '';
   const upperPort = portName.toUpperCase();
   for (const [region, data] of Object.entries(PORT_CATEGORIES)) {
      if (data.ports.includes(upperPort)) {
         // Return the 2-letter ISO code for the region
         const codes = {
            'Panama': 'pa',
            'Brazil': 'br',
            'Freeport': 'bs',
            'Colombia': 'co',
            'Chile': 'cl',
            'Belgium': 'be',
            'Spain': 'es',
            'Canary Islands': 'ci', // Corrected
            'Malta': 'mt',
            'Netherlands': 'nl',
            'Costa Rica': 'cr',
            'Peru': 'pe',
            'Ecuador': 'ec'
         };
         return codes[region] || '';
      }
   }
   return '';
}

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
   safeAddListener('import-json-btn', 'click', importJSON);
   safeAddListener('export-btn', 'click', exportExcel);
   safeAddListener('add-row-btn', 'click', addNewRow);
   safeAddListener('copy-k9-btn', 'click', () => copyVessels('K9'));
   safeAddListener('copy-uw-btn', 'click', () => copyVessels('U/W'));
   safeAddListener('copy-brazil-btn', 'click', copyBrazilVessels);
   safeAddListener('search-input', 'input', handleSearch);
   safeAddListener('clear-search-btn', 'click', clearSearch);

   document.addEventListener('click', (e) => {
      if (!e.target.closest('#context-menu')) hideContextMenu();
   });
   document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Search functionality
function handleSearch(e) {
   searchQuery = e.target.value.trim();
   const clearBtn = document.getElementById('clear-search-btn');
   if (clearBtn) {
      clearBtn.style.display = searchQuery ? 'block' : 'none';
   }
   renderVessels();
}

function clearSearch() {
   const searchInput = document.getElementById('search-input');
   const clearBtn = document.getElementById('clear-search-btn');
   if (searchInput) searchInput.value = '';
   if (clearBtn) clearBtn.style.display = 'none';
   searchQuery = '';
   renderVessels();
}

// Calculate time left until ETD
function calculateTimeLeft(etdStr, port) {
   if (!etdStr) return null;

   try {
      const etdDate = new Date(etdStr);
      if (isNaN(etdDate.getTime())) return null;

      const now = new Date();
      const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
         now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

      // Get port timezone offset
      const portOffset = getPortTimezoneOffset(port);

      // Convert port local time to UTC for comparison
      const etdUTC = Date.UTC(etdDate.getFullYear(), etdDate.getMonth(), etdDate.getDate(),
         etdDate.getHours() - portOffset, etdDate.getMinutes());

      const diff = etdUTC - nowUTC;

      if (diff < 0) {
         const absDiff = Math.abs(diff);
         const hours = Math.floor(absDiff / (1000 * 60 * 60));
         const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
         return {
            text: `${hours}h ${minutes}m overdue`,
            hours,
            minutes,
            overdue: true
         };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      let text = '';
      if (days > 0) text += `${days}d `;
      text += `${hours}h ${minutes}m`;

      return {
         text,
         days,
         hours,
         minutes,
         overdue: false
      };
   } catch (e) {
      console.error('Error calculating time left:', e);
      return null;
   }
}

// Auto-update countdowns
function startCountdownUpdates() {
   if (updateInterval) clearInterval(updateInterval);
   updateInterval = setInterval(() => {
      vessels.forEach(v => {
         if (v.etd) {
            v.timeLeft = calculateTimeLeft(v.etd, v.port);
         }
      });
      renderVessels();
   }, 60000); // Update every minute
}

// Add new row
function addNewRow() {
   const newVessel = {
      id: Date.now(),
      vesselName: 'NEW VESSEL',
      port: '',
      nextPort: '',
      inspectionType: 'Both',
      etb: '',
      etd: '',
      vesselPosition: '',
      status: 'Pending',
      notes: '',
      timeLeft: null
   };
   vessels.unshift(newVessel);
   renderVessels();
   saveData();

   setTimeout(() => {
      const firstInput = document.querySelector(`input[data-vessel-id="${newVessel.id}"]`);
      if (firstInput) {
         firstInput.select();
         firstInput.focus();
      }
   }, 100);
}

function renderVessels() {
   const tbody = document.getElementById('vessel-tbody');
   tbody.innerHTML = '';

   // Clean up invalid vessels first
   validateAndCleanVessels();

   if (vessels.length === 0) {
      tbody.innerHTML = `
            <tr>
                <td colspan="12" class="empty-state">
                    <h3>No vessels added yet</h3>
                    <p>Click "Import Excel" or "Add Row" to start</p>
                </td>
            </tr>
        `;
      return;
   }

   // Sort vessels by time left (soonest/least time first)
   let sortedVessels = [...vessels].sort((a, b) => {
      // Overdue vessels come first
      if (a.timeLeft?.overdue && !b.timeLeft?.overdue) return -1;
      if (!a.timeLeft?.overdue && b.timeLeft?.overdue) return 1;
      
      // Both overdue: sort by most overdue first (highest hours overdue)
      if (a.timeLeft?.overdue && b.timeLeft?.overdue) {
         const aTotal = (a.timeLeft.hours * 60) + a.timeLeft.minutes;
         const bTotal = (b.timeLeft.hours * 60) + b.timeLeft.minutes;
         return bTotal - aTotal; // Descending (most overdue first)
      }
      
      // Both have time left: sort by least time remaining first
      if (a.timeLeft && b.timeLeft && !a.timeLeft.overdue && !b.timeLeft.overdue) {
         const aTotalMinutes = (a.timeLeft.days * 24 * 60) + (a.timeLeft.hours * 60) + a.timeLeft.minutes;
         const bTotalMinutes = (b.timeLeft.days * 24 * 60) + (b.timeLeft.hours * 60) + b.timeLeft.minutes;
         return aTotalMinutes - bTotalMinutes; // Ascending (least time first)
      }
      
      // Vessels without time left go to the end
      if (!a.timeLeft && b.timeLeft) return 1;
      if (a.timeLeft && !b.timeLeft) return -1;
      
      // Both without time left: sort by ETD if available
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
                    <td colspan="12" class="empty-state">
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
      'Overdue': [],
      'Urgent (< 24h)': [],
      'Soon (< 72h)': [],
      'Upcoming': []
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
                <td colspan="12" class="category-title">
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
      // Auto-delete vessels with name "NAME" (case-insensitive)
      if (vessel.vesselName && vessel.vesselName.trim().toUpperCase() === 'NAME') {
         console.log('Auto-removing vessel with name "NAME"');
         return false;
      }

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

   // Row number (clickable to copy vessel info)
   const numCell = document.createElement('td');
   numCell.className = 'cell-number clickable-row-number';
   numCell.textContent = index;
   numCell.title = 'Click to copy vessel name, ETB, and ETD';
   
   // Add click handler to copy vessel info
   numCell.addEventListener('click', () => {
      const vesselName = vessel.vesselName || '';
      const etb = vessel.etb ? formatDateTimeDisplay(vessel.etb) : '';
      const etd = vessel.etd ? formatDateTimeDisplay(vessel.etd) : '';
      
      let copyText = vesselName;
      if (etb) {
         copyText += ` - ETB ${etb}`;
      }
      if (etd) {
         copyText += ` - ETD ${etd}`;
      }
      
      navigator.clipboard.writeText(copyText).then(() => {
         // Visual feedback - flash the row number
         numCell.classList.add('copied-flash');
         setTimeout(() => {
            numCell.classList.remove('copied-flash');
         }, 500);
         
         showNotification(`Copied: ${copyText}`);
      }).catch(err => {
         console.error('Failed to copy:', err);
         alert('Failed to copy to clipboard');
      });
   });
   
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
   // Port Cell Amendment in createTableRow
   // Inside createTableRow where you handle the Port Cell
   const portCell = document.createElement('td');
   const portContainer = document.createElement('div');
   portContainer.className = 'port-display-wrapper';

   const flagImg = document.createElement('img');
   flagImg.className = 'port-flag-icon round-flag'; // Added round-flag class
   const countryCode = getPortFlag(vessel.port);

   // Set the image source
   flagImg.src = countryCode ?
      `https://flagcdn.com/w80/${countryCode}.png` :
      'https://flagcdn.com/w80/un.png'; // 'un' is the United Nations flag, a good generic placeholder

   const portSelect = createSelectCell('port', vessel.port, PORTS, vessel.id);

   // Update flag image when selection changes
   portSelect.addEventListener('change', (e) => {
      const newCode = getPortFlag(e.target.value);
      flagImg.src = newCode ?
         `https://flagcdn.com/w80/${newCode}.png` :
         'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
   });

   portContainer.appendChild(flagImg);
   portContainer.appendChild(portSelect);
   portCell.appendChild(portContainer);
   row.appendChild(portCell);

   // Next Port
   const nextPortCell = document.createElement('td');
   const nextPortInput = createEditableCell('nextPort', vessel.nextPort || '', 'text', vessel.id);
   nextPortCell.appendChild(nextPortInput);
   row.appendChild(nextPortCell);

   // Inspection Type
   const inspectionCell = document.createElement('td');
   const inspectionSelect = createSelectCell('inspectionType', vessel.inspectionType, INSPECTION_TYPES, vessel.id);
   inspectionCell.appendChild(inspectionSelect);
   row.appendChild(inspectionCell);

   // ETB (editable text input)
   const etbCell = document.createElement('td');
   const etbInput = document.createElement('input');
   etbInput.type = 'text';
   etbInput.className = 'cell-content date-input';
   etbInput.placeholder = 'DD/MM HH:MM';
   etbInput.value = vessel.etb ? formatDateTimeDisplay(vessel.etb) : '';
   etbInput.dataset.field = 'etb';
   etbInput.dataset.vesselId = vessel.id;
   
   // Parse on blur to convert to ISO format
   etbInput.addEventListener('blur', (e) => {
      const inputValue = e.target.value.trim();
      if (inputValue) {
         // Try to parse the input
         const parsed = parseUserDateInput(inputValue);
         if (parsed) {
            updateVesselField(vessel.id, 'etb', parsed);
            e.target.value = formatDateTimeDisplay(parsed);
         } else {
            // Keep the original value if parsing fails
            e.target.value = vessel.etb ? formatDateTimeDisplay(vessel.etb) : '';
         }
      } else {
         updateVesselField(vessel.id, 'etb', '');
      }
   });
   
   // Update on change as well
   etbInput.addEventListener('change', (e) => {
      const inputValue = e.target.value.trim();
      if (inputValue) {
         const parsed = parseUserDateInput(inputValue);
         if (parsed) {
            updateVesselField(vessel.id, 'etb', parsed);
            e.target.value = formatDateTimeDisplay(parsed);
         }
      }
   });
   
   etbCell.appendChild(etbInput);
   row.appendChild(etbCell);

   // ETD (editable text input)
   const etdCell = document.createElement('td');
   const etdInput = document.createElement('input');
   etdInput.type = 'text';
   etdInput.className = 'cell-content date-input';
   etdInput.placeholder = 'DD/MM HH:MM';
   etdInput.value = vessel.etd ? formatDateTimeDisplay(vessel.etd) : '';
   etdInput.dataset.field = 'etd';
   etdInput.dataset.vesselId = vessel.id;
   
   // Parse on blur to convert to ISO format
   etdInput.addEventListener('blur', (e) => {
      const inputValue = e.target.value.trim();
      if (inputValue) {
         // Try to parse the input
         const parsed = parseUserDateInput(inputValue);
         if (parsed) {
            updateVesselField(vessel.id, 'etd', parsed);
            e.target.value = formatDateTimeDisplay(parsed);
         } else {
            // Keep the original value if parsing fails
            e.target.value = vessel.etd ? formatDateTimeDisplay(vessel.etd) : '';
         }
      } else {
         updateVesselField(vessel.id, 'etd', '');
      }
   });
   
   // Update on change as well
   etdInput.addEventListener('change', (e) => {
      const inputValue = e.target.value.trim();
      if (inputValue) {
         const parsed = parseUserDateInput(inputValue);
         if (parsed) {
            updateVesselField(vessel.id, 'etd', parsed);
            e.target.value = formatDateTimeDisplay(parsed);
         }
      }
   });
   
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

   // Notes with tooltip
   const notesCell = document.createElement('td');
   notesCell.className = 'col-notes';

   const notesWrapper = document.createElement('div');
   notesWrapper.className = 'notes-cell-wrapper';

   // Display element (truncated text)
   const notesDisplay = document.createElement('div');
   notesDisplay.className = 'notes-display';
   notesDisplay.textContent = vessel.notes || '';
   notesDisplay.title = 'Click to edit'; // Accessibility

   // Tooltip element (full text)
   const notesTooltip = document.createElement('div');
   notesTooltip.className = 'notes-tooltip';
   notesTooltip.textContent = vessel.notes || 'No notes';

   // Edit input (hidden by default)
   const notesInput = createEditableCell('notes', vessel.notes, 'text', vessel.id);

   // Click to edit
   notesDisplay.addEventListener('click', () => {
      notesWrapper.classList.add('editing');
      notesInput.focus();
   });

   // Blur to save and exit edit mode
   notesInput.addEventListener('blur', () => {
      notesWrapper.classList.remove('editing');
      notesDisplay.textContent = notesInput.value || '';
      notesTooltip.textContent = notesInput.value || 'No notes';
   });

   // Press Enter to save
   notesInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
         notesInput.blur();
      }
   });

   notesWrapper.appendChild(notesDisplay);
   notesWrapper.appendChild(notesTooltip);
   notesWrapper.appendChild(notesInput);
   notesCell.appendChild(notesWrapper);
   row.appendChild(notesCell);

   // Actions
   const actionsCell = document.createElement('td');
   actionsCell.className = 'col-actions';
   actionsCell.innerHTML = `<button class="btn btn-danger btn-small delete-btn" onclick="deleteRow(${vessel.id})">✕</button>`;
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
      // If you want the dropdown to be cleaner, just use 'option' 
      // instead of 'getPortFlag(option) + option'
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
      vessels.push({
         ...vessel,
         id: Date.now()
      });
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
   switch (action) {
      case 'duplicate':
         duplicateRow(vesselId);
         break;
      case 'delete':
         deleteRow(vesselId);
         break;
   }
}

// Copy vessels by inspection type
function copyVessels(inspectionType) {
   const filtered = vessels.filter(v => {
      const matchesType = v.inspectionType === inspectionType || v.inspectionType === 'Both';
      const isPanama = ['BALBOA', 'CRISTOBAL', 'COLON', 'RODMAN', 'MANZANILLO (PANAMA)', 'MANZANILLO', 'COLON ANCHORAGE', 'BALB ANCH', 'CRISTOBAL ANCHORAGE', 'BALBOA ANCHORAGE', 'BALB ANCH / PAN CAN', 'COLON INNER ANCHORAGE', 'CRISTOBAL ANCH'].includes(v.port);
      
      // Special handling for BALB ANCH / PAN CAN: include if has notes but no ETB/ETD
      if (v.port === 'BALB ANCH / PAN CAN') {
         const hasNotes = v.notes && v.notes.trim().length > 0;
         const hasNoETBETD = (!v.etb || v.etb.trim().length === 0) && (!v.etd || v.etd.trim().length === 0);
         return matchesType && hasNotes && hasNoETBETD;
      }
      
      return matchesType && isPanama;
   });

   if (filtered.length === 0) {
      alert(`No ${inspectionType} vessels in Panama ports.`);
      return;
   }

   // Group vessels by port
   const portGroups = {};
   filtered.forEach(v => {
      const port = v.port ? v.port.toUpperCase() : 'UNKNOWN';
      if (!portGroups[port]) {
         portGroups[port] = [];
      }
      portGroups[port].push(v);
   });

   // Sort vessels within each port by ETD
   Object.keys(portGroups).forEach(port => {
      portGroups[port].sort((a, b) => {
         if (!a.etd && !b.etd) return 0;
         if (!a.etd) return 1;
         if (!b.etd) return -1;
         return new Date(a.etd) - new Date(b.etd);
      });
   });

   // Define port order
   const portOrder = ['CRISTOBAL', 'COLON', 'RODMAN', 'BALBOA', 'MANZANILLO'];
   const sortedPorts = Object.keys(portGroups).sort((a, b) => {
      const aIndex = portOrder.findIndex(p => a.includes(p));
      const bIndex = portOrder.findIndex(p => b.includes(p));
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
   });

   // Build formatted output
   let output = [];

   sortedPorts.forEach(port => {
      const vessels = portGroups[port];
      output.push(`====${port}====`);

      vessels.forEach(v => {
         const vesselName = v.vesselName || 'UNKNOWN';

         // Parse ETB and ETD to DD/MM HHMM format
         let etbText = '';
         let etdText = '';
         let nextPortText = '';

         if (v.etb) {
            etbText = `ETB ${formatDateTimeDisplay(v.etb)}`;
         }

         if (v.etd) {
            etdText = `ETD ${formatDateTimeDisplay(v.etd)}`;
         }

         // Use nextPort field if available and convert to continent/region
         if (v.nextPort) {
            const nextPortUpper = v.nextPort.toUpperCase();
            
            // Skip if it's just a dash
            if (nextPortUpper === '-') {
               nextPortText = '';
            } else {
               let continentCode = '';
               
               // Map ports to continent codes
               const europePorts = ['MALTA', 'MALAGA', 'HAMBURG', 'LE HAVRE', 'ANTWERP', 'ROTTERDAM', 'LAS PALMAS', 'VALENCIA', 'MARSAXLOKK', 'FELIXSTOWE', 'SOUTHAMPTON', 'LONDON', 'MOIN'];
               const usaPorts = ['NEW YORK', 'NORFOLK', 'SAVANNAH', 'CHARLESTON', 'MIAMI', 'HOUSTON', 'LOS ANGELES', 'LONG BEACH', 'OAKLAND', 'SEATTLE', 'USA'];
               const asiaPorts = ['SINGAPORE', 'HONG KONG', 'SHANGHAI', 'NINGBO', 'BUSAN', 'TOKYO', 'YOKOHAMA', 'KAOHSIUNG', 'LAEM CHABANG', 'PORT KLANG', 'TANJUNG PELEPAS', 'COLOMBO', 'JEBEL ALI', 'DUBAI'];
               
               if (europePorts.some(port => nextPortUpper.includes(port))) {
                  continentCode = 'EU';
               } else if (usaPorts.some(port => nextPortUpper.includes(port))) {
                  continentCode = 'USA';
               } else if (asiaPorts.some(port => nextPortUpper.includes(port))) {
                  continentCode = 'ASIA';
               } else {
                  // If not in predefined lists, keep original
                  continentCode = nextPortUpper;
               }
               
               nextPortText = ` (${continentCode})`;
            }
         }

         // Build the vessel line
         let vesselLine = `* ${vesselName}`;
         if (etbText) {
            vesselLine += ` – ${etbText}`;
         }
         if (etdText) {
            vesselLine += ` - ${etdText}`;
         }
         vesselLine += nextPortText;
         
         // For BALB ANCH / PAN CAN vessels without ETB/ETD, add the notes
         if (v.port === 'BALB ANCH / PAN CAN' && !v.etb && !v.etd && v.notes) {
            vesselLine += ` - ${v.notes}`;
         }

         output.push(vesselLine);
      });

      output.push(''); // Empty line after each port group
   });

   const text = output.join('\n');

   navigator.clipboard.writeText(text).then(() => {
      showNotification(`Copied ${filtered.length} ${inspectionType} vessel(s)!`);
   }).catch(() => alert('Failed to copy'));
}

// Copy Brazil vessels (all inspection types)
function copyBrazilVessels() {
   const brazilPorts = ['SANTOS', 'PARANAGUA', 'RIO GRANDE', 'ITAJAI', 'NAVEGANTES', 'RIO DE JANEIRO', 'RDJ', 'SALVADOR', 'PECEM'];

   const filtered = vessels.filter(v => {
      const isBrazil = brazilPorts.some(port => v.port && v.port.toUpperCase().includes(port));
      return isBrazil;
   });

   if (filtered.length === 0) {
      alert('No vessels in Brazil ports.');
      return;
   }

   // Group vessels by port
   const portGroups = {};
   filtered.forEach(v => {
      const port = v.port ? v.port.toUpperCase() : 'UNKNOWN';
      if (!portGroups[port]) {
         portGroups[port] = [];
      }
      portGroups[port].push(v);
   });

   // Sort vessels within each port by ETD
   Object.keys(portGroups).forEach(port => {
      portGroups[port].sort((a, b) => {
         if (!a.etd && !b.etd) return 0;
         if (!a.etd) return 1;
         if (!b.etd) return -1;
         return new Date(a.etd) - new Date(b.etd);
      });
   });

   // Define port order for Brazil
   const portOrder = ['SANTOS', 'PARANAGUA', 'RIO GRANDE', 'ITAJAI', 'NAVEGANTES', 'RIO DE JANEIRO', 'RDJ', 'SALVADOR', 'PECEM'];
   const sortedPorts = Object.keys(portGroups).sort((a, b) => {
      const aIndex = portOrder.findIndex(p => a.includes(p));
      const bIndex = portOrder.findIndex(p => b.includes(p));
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
   });

   // Build formatted output
   let output = [];

   sortedPorts.forEach(port => {
      const vessels = portGroups[port];
      output.push(`====${port}====`);

      vessels.forEach(v => {
         const vesselName = v.vesselName || 'UNKNOWN';

         // Parse ETB and ETD to DD/MM HHMM format
         let etbText = '';
         let etdText = '';
         let nextPortText = '';

         if (v.etb) {
            etbText = `ETB ${formatDateTimeDisplay(v.etb)}`;
         }

         if (v.etd) {
            etdText = `ETD ${formatDateTimeDisplay(v.etd)}`;
         }

         // Use nextPort field if available and convert to continent/region
         if (v.nextPort) {
            const nextPortUpper = v.nextPort.toUpperCase();
            
            // Skip if it's just a dash
            if (nextPortUpper === '-') {
               nextPortText = '';
            } else {
               let continentCode = '';
               
               // Map ports to continent codes
               const europePorts = ['MALTA', 'MALAGA', 'HAMBURG', 'LE HAVRE', 'ANTWERP', 'ROTTERDAM', 'LAS PALMAS', 'VALENCIA', 'MARSAXLOKK', 'FELIXSTOWE', 'SOUTHAMPTON', 'LONDON'];
               const usaPorts = ['NEW YORK', 'NORFOLK', 'SAVANNAH', 'CHARLESTON', 'MIAMI', 'HOUSTON', 'LOS ANGELES', 'LONG BEACH', 'OAKLAND', 'SEATTLE'];
               const asiaPorts = ['SINGAPORE', 'HONG KONG', 'SHANGHAI', 'NINGBO', 'BUSAN', 'TOKYO', 'YOKOHAMA', 'KAOHSIUNG', 'LAEM CHABANG', 'PORT KLANG', 'TANJUNG PELEPAS', 'COLOMBO', 'JEBEL ALI', 'DUBAI'];
               
               if (europePorts.some(port => nextPortUpper.includes(port))) {
                  continentCode = 'EU';
               } else if (usaPorts.some(port => nextPortUpper.includes(port))) {
                  continentCode = 'USA';
               } else if (asiaPorts.some(port => nextPortUpper.includes(port))) {
                  continentCode = 'ASIA';
               } else {
                  // If not in predefined lists, keep original
                  continentCode = nextPortUpper;
               }
               
               nextPortText = ` (${continentCode})`;
            }
         }

         // Build the vessel line
         let vesselLine = `* ${vesselName}`;
         if (etbText) {
            vesselLine += ` – ${etbText}`;
         }
         if (etdText) {
            vesselLine += ` - ${etdText}`;
         }
         vesselLine += nextPortText;

         output.push(vesselLine);
      });

      output.push(''); // Empty line after each port group
   });

   const text = output.join('\n');

   navigator.clipboard.writeText(text).then(() => {
      showNotification(`Copied ${filtered.length} Brazil vessel(s)!`);
   }).catch(() => alert('Failed to copy'));
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

// IMPROVED: Better ETD text parsing for various formats
function parseETDText(text) {
   if (!text || typeof text !== 'string') return '';
   
   text = text.trim();
   const currentYear = new Date().getFullYear();
   
   // Pattern 1: "ETD DD/MM HH:MM (REGION)" or "ETD DD/MM HH:MM"
   const match1 = text.match(/ETD\s+(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})/i);
   if (match1) {
      const day = match1[1].padStart(2, '0');
      const month = match1[2].padStart(2, '0');
      const hours = match1[3].padStart(2, '0');
      const minutes = match1[4].padStart(2, '0');
      return `${currentYear}-${month}-${day}T${hours}:${minutes}`;
   }
   
   // Pattern 2: "ETD – HH:MM/DDth" or "ETD – HH:MM/DD"
   const match2 = text.match(/ETD\s*[–-]\s*(\d{1,2}):(\d{2})\s*\/\s*(\d{1,2})/i);
   if (match2) {
      const hours = match2[1].padStart(2, '0');
      const minutes = match2[2].padStart(2, '0');
      const day = match2[3].padStart(2, '0');
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      return `${currentYear}-${month}-${day}T${hours}:${minutes}`;
   }
   
   // Pattern 3: "ETB DD/HHMM ETS DD/HHMM" or "ETB DD/HHMM ETD DD/HHMM"
   const match3 = text.match(/ET[SD]\s+(\d{1,2})\/(\d{2})(\d{2})/i);
   if (match3) {
      const day = match3[1].padStart(2, '0');
      const hours = match3[2];
      const minutes = match3[3];
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      return `${currentYear}-${month}-${day}T${hours}:${minutes}`;
   }
   
   // Pattern 4: "ETA DD/MM" or "eta: DD/MM HH:MM"
   const match4 = text.match(/ETA[:\s]+(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/i);
   if (match4) {
      const day = match4[1].padStart(2, '0');
      const month = match4[2].padStart(2, '0');
      const hours = match4[3] ? match4[3].padStart(2, '0') : '00';
      const minutes = match4[4] ? match4[4] : '00';
      return `${currentYear}-${month}-${day}T${hours}:${minutes}`;
   }
   
   // Pattern 5: "ETB DD/MM HH:MM" (similar to ETD but for ETB)
   const match5 = text.match(/ETB\s+(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})/i);
   if (match5) {
      const day = match5[1].padStart(2, '0');
      const month = match5[2].padStart(2, '0');
      const hours = match5[3].padStart(2, '0');
      const minutes = match5[4].padStart(2, '0');
      return `${currentYear}-${month}-${day}T${hours}:${minutes}`;
   }
   
   return '';
}

// Import JSON - simpler and more reliable than Excel
function importJSON() {
   const input = document.getElementById('json-file-input');
   if (!input) {
      alert('File input element not found');
      return;
   }

   input.click();
   input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onerror = (error) => {
         console.error('FileReader error:', error);
         alert('Error reading JSON file. Please try again.');
      };

      reader.onload = (event) => {
         try {
            const jsonData = JSON.parse(event.target.result);
            
            if (!Array.isArray(jsonData)) {
               alert('Invalid JSON format. Expected an array of vessels.');
               return;
            }

            console.log(`Loaded ${jsonData.length} vessels from JSON`);

            // Process each vessel and calculate time left
            const importedVessels = jsonData.map(v => {
               const vessel = {
                  id: Date.now() + Math.random(),
                  vesselName: v.vesselName || '',
                  port: v.port || '',
                  nextPort: v.nextPort || '',
                  inspectionType: v.inspectionType || 'Both',
                  etb: v.etb || '',
                  etd: v.etd || '',
                  vesselPosition: v.vesselPosition || '',
                  status: v.status || 'Pending',
                  notes: v.notes || '',
                  timeLeft: null
               };

               // Calculate time left
               if (vessel.etd) {
                  vessel.timeLeft = calculateTimeLeft(vessel.etd, vessel.port);
               }

               return vessel;
            });

            if (confirm(`Import ${importedVessels.length} vessels from JSON?\n\nThis will replace all current data.`)) {
               vessels = importedVessels;
               renderVessels();
               saveData();
               showNotification(`Successfully imported ${importedVessels.length} vessels!`);
            }
         } catch (err) {
            alert('Error parsing JSON file:\n' + err.message);
            console.error('JSON import error:', err);
         }
      };

      reader.readAsText(file);
      input.value = '';
   };
}

// Import Excel
function importExcel() {
   const input = document.getElementById('excel-file-input');
   if (!input) {
      alert('File input element not found');
      return;
   }

   input.click();
   input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Check file size (limit to 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
         alert(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Please use a file smaller than 5MB.`);
         return;
      }
      
      console.log(`Loading file: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);

      const reader = new FileReader();
      reader.onerror = (error) => {
         console.error('FileReader error:', error);
         alert('Error reading file. Please try again.');
      };
      
      reader.onload = (event) => {
         try {
            console.log('File loaded, parsing Excel...');
            
            // Use the most memory-efficient settings
            const workbook = XLSX.read(event.target.result, {
               type: 'array',
               cellDates: true,
               cellFormula: false,
               cellStyles: false,
               sheetStubs: false,
               bookDeps: false,
               bookSheets: false,
               bookProps: false,
               bookVBA: false
            });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Use sheet_to_json with header: 1 to get array of arrays
            const rawData = XLSX.utils.sheet_to_json(firstSheet, {
               header: 1,
               raw: false,
               defval: '',
               blankrows: false
            });

            console.log('Raw Excel Data (first 3 rows):', rawData.slice(0, 3));
            console.log('First row type check:', rawData[0], 'Is array?', Array.isArray(rawData[0]));
            if (rawData[0]) {
                console.log('First cell of first row:', rawData[0][0], 'Type:', typeof rawData[0][0]);
            }
            
            // Clean up the data - the mini library sometimes returns nested structures
            const cleanedData = rawData.map(row => {
               // If row is not an array, skip it
               if (!Array.isArray(row)) {
                  console.warn('Skipping non-array row:', row);
                  return [];
               }
               
               // Clean each cell in the row
               return row.map(cell => {
                  // Handle null/undefined
                  if (cell === null || cell === undefined) return '';
                  
                  // If it's already a string, return it
                  if (typeof cell === 'string') return cell;
                  
                  // If it's a number, convert to string
                  if (typeof cell === 'number') return String(cell);
                  
                  // If it's a Date, keep it as is
                  if (cell instanceof Date) return cell;
                  
                  // If it's an array or object (shouldn't happen but mini library quirk)
                  if (typeof cell === 'object') {
                     console.warn('Found object in cell, converting:', cell);
                     return JSON.stringify(cell);
                  }
                  
                  // Default: convert to string
                  return String(cell);
               });
            }).filter(row => {
               // Remove completely empty rows
               return row.length > 0 && row.some(cell => cell !== '' && cell !== null);
            });
            
            console.log('Cleaned data sample:', cleanedData.slice(0, 3));
            
            console.log(`Cleaned data: ${cleanedData.length} rows (from ${rawData.length})`);

            const allVessels = [];
            
            // Find ALL header rows (there may be multiple sections)
            const headerIndices = [];
            cleanedData.forEach((row, idx) => {
               if (row && row.length > 0) {
                  // Check if any cell in this row is exactly "Name" (case-insensitive)
                  const hasNameHeader = row.some(cell => {
                     if (cell && typeof cell === 'string') {
                        const cellValue = cell.trim().toUpperCase();
                        return cellValue === 'NAME' || cellValue === 'VESSEL NAME';
                     }
                     return false;
                  });
                  
                  if (hasNameHeader) {
                     headerIndices.push(idx);
                     console.log('Found header at row', idx, 'Row content:', row.slice(0, 5));
                  }
               }
            });

            if (headerIndices.length === 0) {
               // Fallback: look for any row with "Name" in it
               cleanedData.forEach((row, idx) => {
                  if (row && row.length > 0) {
                     const hasName = row.some(cell => {
                        if (cell && typeof cell === 'string') {
                           return cell.toUpperCase().includes('NAME');
                        }
                        return false;
                     });
                     if (hasName && idx < 10) { // Only check first 10 rows
                        headerIndices.push(idx);
                        console.log('Found potential header at row', idx);
                     }
                  }
               });
            }

            if (headerIndices.length === 0) {
               console.error('Could not find header! Showing first 5 rows for debugging:');
               cleanedData.slice(0, 5).forEach((row, idx) => {
                  console.log(`Row ${idx}:`, row);
               });
               alert('Could not find header row with "Name" column.\n\n' +
                     'First row shows: ' + (cleanedData[0] ? JSON.stringify(cleanedData[0].slice(0, 3)) : 'empty') +  
                     '\n\nTip: If file is in Protected View in Excel, click "Enable Editing" and save it first.');
               return;
            }

            console.log(`Found ${headerIndices.length} header section(s)`);

            // Process each section
            headerIndices.forEach((headerIndex, sectionNum) => {
               const headers = cleanedData[headerIndex].map(h => h ? h.trim() : '');
               console.log(`Section ${sectionNum + 1} headers:`, headers);

               // Get column indices
               const nameCol = headers.indexOf('Name');
               const portCol = headers.indexOf('Port of Inspection');
               const nextPortCol = headers.indexOf('Next port');
               const inspectionTypeCol = -1;  // Monday.com doesn't have this
               const dateCol = headers.indexOf('Date');
               const vesselPosCol = headers.indexOf('Vessel Position');
               const statusCol = headers.indexOf('Status');
               const textCol = headers.indexOf('Text');
               const updatedEtdCol = headers.indexOf('Updated ETD from Agent');
               const etbCol = -1;  // Monday.com doesn't have separate ETB column

               // Find the end of this section (next header or end of file)
               const nextHeaderIndex = headerIndices[sectionNum + 1];
               const endRow = nextHeaderIndex ? nextHeaderIndex - 1 : cleanedData.length;

               console.log(`Processing section ${sectionNum + 1}: rows ${headerIndex + 1} to ${endRow}`);

               // Process data rows in this section
               for (let i = headerIndex + 1; i < endRow; i++) {
                  const row = cleanedData[i];
                  if (!row || row.length === 0) continue;
                  
                  const vesselName = row[nameCol];

                  // Skip empty rows, section headers, or date ranges
                  if (!vesselName ||
                     typeof vesselName !== 'string' ||
                     vesselName.length < 2 ||
                     vesselName.includes('VESSELS SAILING') ||
                     vesselName.includes('UPCOMING') ||
                     vesselName.includes('MONITOR') ||
                     vesselName.includes('UWI & K9') ||
                     (vesselName.includes(' to ') && vesselName.includes('-'))) {  // Date ranges
                     continue;
                  }

                  const vessel = {
                     id: Date.now() + Math.random(),
                     vesselName: vesselName.toUpperCase().trim(),
                     port: '',
                     nextPort: '',
                     inspectionType: 'Both',  // Default
                     etb: '',
                     etd: '',
                     vesselPosition: '',
                     status: 'Pending',
                     notes: '',
                     timeLeft: null
                  };

                  // Get port
                  if (portCol >= 0 && row[portCol]) {
                     const portValue = row[portCol];
                     vessel.port = String(portValue).toUpperCase().trim();
                  }

                  // Get next port
                  if (nextPortCol >= 0 && row[nextPortCol]) {
                     const nextPortValue = row[nextPortCol];
                     vessel.nextPort = String(nextPortValue).toUpperCase().trim();
                  }

                  // Get vessel position
                  if (vesselPosCol >= 0 && row[vesselPosCol]) {
                     const pos = String(row[vesselPosCol]).trim();
                     // Map Monday.com positions to our position options
                     const posUpper = pos.toUpperCase();
                     if (posUpper.includes('PORT')) vessel.vesselPosition = 'Berthed';
                     else if (posUpper.includes('ANCH')) vessel.vesselPosition = 'Anchorage';
                     else if (posUpper.includes('NOT BERTHED')) vessel.vesselPosition = 'Not Berthed Yet';
                     else vessel.vesselPosition = pos;
                  }

                  // Get status
                  if (statusCol >= 0 && row[statusCol]) {
                     vessel.status = String(row[statusCol]).trim();
                  }

                  // Get ETD from "Updated ETD from Agent" column
                  let etdText = '';
                  if (updatedEtdCol >= 0 && row[updatedEtdCol]) {
                     etdText = String(row[updatedEtdCol]).trim();
                  } else if (dateCol >= 0 && row[dateCol]) {
                     // Fallback to Date column if Updated ETD is empty
                     const dateValue = row[dateCol];
                     if (dateValue instanceof Date || typeof dateValue === 'number') {
                        vessel.etd = parseAndFormatDateTime(dateValue);
                     }
                  }

                  // Parse ETD text if we have it
                  if (etdText) {
                     // Try to extract both ETB and ETD
                     const extracted = extractETBandETD(etdText);
                     if (extracted.etb) vessel.etb = extracted.etb;
                     if (extracted.etd) vessel.etd = extracted.etd;
                     
                     // If extraction didn't work, try simple parsing
                     if (!vessel.etd) {
                        vessel.etd = parseETDText(etdText);
                     }
                  }

                  // Get notes/text
                  if (textCol >= 0 && row[textCol]) {
                     vessel.notes = String(row[textCol]).trim();
                     
                     // Extract inspection type from notes
                     const notesUpper = vessel.notes.toUpperCase();
                     if (notesUpper === 'K9 ONLY' || notesUpper === 'K9') {
                        vessel.inspectionType = 'K9';
                     } else if (notesUpper === 'UW ONLY' || notesUpper === 'U/W ONLY' || notesUpper === 'UW') {
                        vessel.inspectionType = 'U/W';
                     } else if (notesUpper === 'BOTH' || (notesUpper.includes('K9') && notesUpper.includes('U/W'))) {
                        vessel.inspectionType = 'Both';
                     }
                  }

                  // Calculate time left
                  if (vessel.etd) {
                     vessel.timeLeft = calculateTimeLeft(vessel.etd, vessel.port);
                  }

                  allVessels.push(vessel);
                  console.log('Added vessel:', vessel.vesselName, 'Port:', vessel.port, 'ETB:', vessel.etb, 'ETD:', vessel.etd, 'Type:', vessel.inspectionType);
               }
            });

            console.log(`Total vessels imported: ${allVessels.length}`);

            if (allVessels.length === 0) {
               alert('No valid vessel data found in the Excel file.');
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

// Helper function to parse and format datetime from Excel
function parseAndFormatDateTime(value) {
   if (!value) return '';

   try {
      // Handle ISO format (already formatted) - both with and without seconds
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
         return value;
      }

      // Handle our export format: "DD/MM HH:MM" 
      if (typeof value === 'string') {
         value = value.trim();
         
         // Match DD/MM HH:MM format (our export format)
         const displayMatch = value.match(/^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/);
         if (displayMatch) {
            const day = displayMatch[1].padStart(2, '0');
            const month = displayMatch[2].padStart(2, '0');
            const year = new Date().getFullYear();
            const hours = displayMatch[3].padStart(2, '0');
            const minutes = displayMatch[4].padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
         }
         
         // Try to match ETD/ETB with various formats
         value = value.replace(/^-\s*/, '');
         
         // Try to match ETD with various formats: "ETD DD/MM HH:MM" or "ETD DD/MM HHMM"
         const etdMatch = value.match(/ETD\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2}):?(\d{2})/i);
         if (etdMatch) {
            const day = etdMatch[1].padStart(2, '0');
            const month = etdMatch[2].padStart(2, '0');
            let year = etdMatch[3] || new Date().getFullYear().toString();
            if (year.length === 2) year = '20' + year;
            const hours = etdMatch[4].padStart(2, '0');
            const minutes = etdMatch[5].padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
         }
      }

      // Handle Excel date serial number or Date object
      const date = parseExcelDate(value);
      if (date && !isNaN(date.getTime())) {
         const year = date.getFullYear();
         const month = String(date.getMonth() + 1).padStart(2, '0');
         const day = String(date.getDate()).padStart(2, '0');
         const hours = String(date.getHours()).padStart(2, '0');
         const minutes = String(date.getMinutes()).padStart(2, '0');
         return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
   } catch (e) {
      console.error('Date parsing error:', e, value);
   }

   return '';
}

// Helper function to extract ETB and ETD from combined string
function extractETBandETD(text) {
   if (!text || typeof text !== 'string') return { etb: '', etd: '' };
   
   const result = { etb: '', etd: '' };
   const currentYear = new Date().getFullYear();
   
   // Pattern 1: "ETB DD/MM HHMM - ETD DD/MM HH:MM" or "ETB DD/MM HH:MM - ETD DD/MM HH:MM"
   const etbMatch = text.match(/ETB\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2}):?(\d{2})/i);
   if (etbMatch) {
      const day = etbMatch[1].padStart(2, '0');
      const month = etbMatch[2].padStart(2, '0');
      let year = etbMatch[3] || currentYear.toString();
      if (year.length === 2) year = '20' + year;
      const hours = etbMatch[4].padStart(2, '0');
      const minutes = etbMatch[5].padStart(2, '0');
      result.etb = `${year}-${month}-${day}T${hours}:${minutes}`;
   }
   
   const etdMatch = text.match(/ET[SD]\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2}):?(\d{2})/i);
   if (etdMatch) {
      const day = etdMatch[1].padStart(2, '0');
      const month = etdMatch[2].padStart(2, '0');
      let year = etdMatch[3] || currentYear.toString();
      if (year.length === 2) year = '20' + year;
      const hours = etdMatch[4].padStart(2, '0');
      const minutes = etdMatch[5].padStart(2, '0');
      result.etd = `${year}-${month}-${day}T${hours}:${minutes}`;
   }
   
   // Pattern 2: "ETB – HH:MM/DDTH-MON, YYYY ETD – HH:MM /DDST-MON, YYYY"
   if (!result.etb || !result.etd) {
      const complexEtbMatch = text.match(/ETB\s*[–-]\s*(\d{1,2}):(\d{2})\s*\/\s*(\d{1,2})[A-Z]{2}[- ]([A-Z]{3})[,\s]*(\d{4})/i);
      if (complexEtbMatch) {
         const hours = complexEtbMatch[1].padStart(2, '0');
         const minutes = complexEtbMatch[2].padStart(2, '0');
         const day = complexEtbMatch[3].padStart(2, '0');
         const monthName = complexEtbMatch[4].toUpperCase();
         const year = complexEtbMatch[5];
         
         const monthMap = {
            'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
            'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
            'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
         };
         const month = monthMap[monthName] || '01';
         result.etb = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      
      const complexEtdMatch = text.match(/ET[SD]\s*[–-]\s*(\d{1,2}):(\d{2})\s*\/\s*(\d{1,2})[A-Z]{2}[- ]([A-Z]{3})[,\s]*(\d{4})/i);
      if (complexEtdMatch) {
         const hours = complexEtdMatch[1].padStart(2, '0');
         const minutes = complexEtdMatch[2].padStart(2, '0');
         const day = complexEtdMatch[3].padStart(2, '0');
         const monthName = complexEtdMatch[4].toUpperCase();
         const year = complexEtdMatch[5];
         
         const monthMap = {
            'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
            'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
            'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
         };
         const month = monthMap[monthName] || '01';
         result.etd = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
   }
   
   return result;
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
      'Next Port': v.nextPort || '',
      'Inspection Type': v.inspectionType,
      'ETB': v.etb || '',  // Export in ISO format for re-import
      'ETD': v.etd || '',  // Export in ISO format for re-import
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
   const locations = [{
         id: 'clock-panama',
         zone: 'America/Panama'
      },
      {
         id: 'clock-brazil',
         zone: 'America/Sao_Paulo'
      },
      {
         id: 'clock-freeport',
         zone: 'America/Nassau'
      },
      {
         id: 'clock-chile',
         zone: 'America/Santiago'
      },
      {
         id: 'clock-las-palmas',
         zone: 'Atlantic/Canary'
      }
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
