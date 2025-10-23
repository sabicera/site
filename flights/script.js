let flightLegs = [];
let legCounter = 0;
let airports = [];

// Load airports from vocabulary file or use default list
async function loadAirports() {
    // Default airport list - you can replace this with a fetch to a JSON file
    // Example: const response = await fetch('airports.json');
    // airports = await response.json();
    
    airports = [
        "Houston", "Athens", "Istanbul", "Antwerp", "Guayaquil", "Newark", "New York", "Larnaca", "London", "Paris", 
        "Dubai", "Tokyo", "Singapore", "Frankfurt", "Amsterdam", "Madrid",
        "Rome", "Barcelona", "Istanbul", "Bangkok", "Los Angeles", "Chicago",
        "Miami", "San Francisco", "Boston", "Seattle", "Las Vegas", "Orlando",
        "Philadelphia", "Phoenix", "Dallas", "Atlanta", "Denver", "Washington",
        "Toronto", "Montreal", "Vancouver", "Mexico City", "Cancun", "Sydney",
        "Melbourne", "Brisbane", "Auckland", "Vienna", "Brussels", "Copenhagen",
        "Prague", "Dublin", "Helsinki", "Lisbon", "Oslo", "Stockholm", "Warsaw",
        "Zurich", "Geneva", "Milan", "Venice", "Florence", "Naples", "Munich",
        "Berlin", "Hamburg", "Cologne", "Doha", "Abu Dhabi", "Riyadh", "Cairo",
        "Tel Aviv", "Beirut", "Amman", "Kuwait", "Muscat", "Bahrain", "Mumbai",
        "Delhi", "Bangalore", "Hong Kong", "Shanghai", "Beijing", "Seoul", "",
        "Osaka", "Kuala Lumpur", "Jakarta", "Manila", "Hanoi", "Ho Chi Minh"
    ].sort();
}

function initializeFirstLeg() {
    loadAirports().then(() => {
        addFlightLeg();
    });
}

function addFlightLeg() {
    legCounter++;
    const leg = {
        id: legCounter,
        arrivalAirport: '',
        departureAirport: '',
        departureDate: '',
        departureTime: '',
        arrivalDate: '',
        arrivalTime: ''
    };
    
    // Auto-fill arrival airport from previous leg's departure airport
    if (flightLegs.length > 0) {
        const prevLeg = flightLegs[flightLegs.length - 1];
        leg.arrivalAirport = prevLeg.departureAirport;
    }
    
    flightLegs.push(leg);
    renderFlightLegs();
}

function removeFlightLeg(id) {
    flightLegs = flightLegs.filter(leg => leg.id !== id);
    renderFlightLegs();
}

function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function updateFlightLeg(id, field, value) {
    const leg = flightLegs.find(l => l.id === id);
    if (leg) {
        // Apply title case for airport names
        if (field === 'arrivalAirport' || field === 'departureAirport') {
            leg[field] = toTitleCase(value);
        } else {
            leg[field] = value;
        }
        // Don't re-render on every keystroke to avoid time input issues
        if (field !== 'departureTime' && field !== 'arrivalTime') {
            renderFlightLegs();
        }
    }
}

function filterAirports(searchTerm) {
    if (!searchTerm) return [];
    const search = searchTerm.toLowerCase();
    return airports.filter(airport => 
        airport.toLowerCase().startsWith(search)
    ).slice(0, 5); // Limit to 5 suggestions
}

function showSuggestions(inputElement, suggestions, legId, field) {
    // Remove any existing suggestions
    const existingSuggestions = document.querySelector('.airport-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    
    if (suggestions.length === 0) return;
    
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'airport-suggestions';
    suggestionsDiv.style.cssText = `
        position: absolute;
        background: white;
        border: 2px solid #667eea;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        width: ${inputElement.offsetWidth}px;
    `;
    
    suggestions.forEach(airport => {
        const suggestionItem = document.createElement('div');
        suggestionItem.textContent = airport;
        suggestionItem.style.cssText = `
            padding: 10px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        suggestionItem.onmouseover = () => suggestionItem.style.background = '#f0f0f0';
        suggestionItem.onmouseout = () => suggestionItem.style.background = 'white';
        suggestionItem.onclick = () => {
            inputElement.value = airport;
            updateFlightLeg(legId, field, airport);
            suggestionsDiv.remove();
        };
        suggestionsDiv.appendChild(suggestionItem);
    });
    
    // Position suggestions below input
    const rect = inputElement.getBoundingClientRect();
    suggestionsDiv.style.top = (rect.bottom + window.scrollY) + 'px';
    suggestionsDiv.style.left = rect.left + 'px';
    
    document.body.appendChild(suggestionsDiv);
    
    // Close suggestions when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeHandler(e) {
            if (!suggestionsDiv.contains(e.target) && e.target !== inputElement) {
                suggestionsDiv.remove();
                document.removeEventListener('click', closeHandler);
            }
        });
    }, 0);
}

function renderFlightLegs() {
    const container = document.getElementById('flightLegsContainer');
    container.innerHTML = '';

    flightLegs.forEach((leg, index) => {
        const legDiv = document.createElement('div');
        legDiv.className = 'flight-leg';
        
        let layoverHTML = '';
        if (index > 0) {
            const prevLeg = flightLegs[index - 1];
            const layover = calculateLayover(prevLeg, leg);
            if (layover) {
                layoverHTML = `<div class="layover-info">⏱️ Layover: ${layover}</div>`;
            }
        }

        legDiv.innerHTML = `
            <h3>Flight Leg ${index + 1}</h3>
            ${flightLegs.length > 1 ? `<button class="btn btn-remove" onclick="removeFlightLeg(${leg.id})">Remove</button>` : ''}
            
            <div class="input-row">
                <div class="input-group">
                    <label>Arrival Airport</label>
                    <input type="text" 
                           id="arrival-${leg.id}"
                           placeholder="e.g., Houston" 
                           value="${leg.arrivalAirport}"
                           autocomplete="off"
                           oninput="showSuggestions(this, filterAirports(this.value), ${leg.id}, 'arrivalAirport')"
                           onblur="setTimeout(() => updateFlightLeg(${leg.id}, 'arrivalAirport', this.value), 200)">
                </div>
                <div class="input-group">
                    <label>Departure Date</label>
                    <input type="date" 
                           value="${leg.departureDate}"
                           onchange="updateFlightLeg(${leg.id}, 'departureDate', this.value)">
                </div>
                <div class="input-group">
                    <label>Departure Time (Local)</label>
                    <input type="time" 
                           value="${leg.departureTime}"
                           onblur="updateFlightLeg(${leg.id}, 'departureTime', this.value)">
                </div>
            </div>
            <div class="input-row">
                <div class="input-group">
                    <label>Departure Airport</label>
                    <input type="text" 
                           id="departure-${leg.id}"
                           placeholder="e.g., New York" 
                           value="${leg.departureAirport}"
                           autocomplete="off"
                           oninput="showSuggestions(this, filterAirports(this.value), ${leg.id}, 'departureAirport')"
                           onblur="setTimeout(() => updateFlightLeg(${leg.id}, 'departureAirport', this.value), 200)">
                </div>
                <div class="input-group">
                    <label>Arrival Date</label>
                    <input type="date" 
                           value="${leg.arrivalDate}"
                           onchange="updateFlightLeg(${leg.id}, 'arrivalDate', this.value)">
                </div>
                <div class="input-group">
                    <label>Arrival Time (Local)</label>
                    <input type="time" 
                           value="${leg.arrivalTime}"
                           onblur="updateFlightLeg(${leg.id}, 'arrivalTime', this.value)">
                </div>
            </div>
            ${layoverHTML}
        `;
        
        container.appendChild(legDiv);
    });
}

function calculateLayover(prevLeg, currentLeg) {
    // Calculate layover between previous flight's ARRIVAL and current flight's DEPARTURE
    if (!prevLeg.arrivalDate || !prevLeg.arrivalTime || 
        !currentLeg.departureDate || !currentLeg.departureTime) {
        return null;
    }

    const prevArrival = new Date(`${prevLeg.arrivalDate}T${prevLeg.arrivalTime}`);
    const currentDeparture = new Date(`${currentLeg.departureDate}T${currentLeg.departureTime}`);

    const diffMs = currentDeparture - prevArrival;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours} hours and ${diffMinutes} minutes`;
}

function subtractHours(timeString, hoursToSubtract) {
    const [hours, minutes] = timeString.split(':').map(Number);
    let newHours = hours - hoursToSubtract;
    
    if (newHours < 0) {
        newHours += 24;
    }
    
    return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function generateBriefing() {
    if (flightLegs.length === 0) {
        alert('Please add at least one flight leg');
        return;
    }

    const firstLeg = flightLegs[0];
    const lastLeg = flightLegs[flightLegs.length - 1];

    // Validate all required fields
    for (let i = 0; i < flightLegs.length; i++) {
        const leg = flightLegs[i];
        if (!leg.arrivalAirport || !leg.departureAirport || !leg.departureDate || 
            !leg.departureTime || !leg.arrivalDate || !leg.arrivalTime) {
            alert(`Please fill in all fields for Flight Leg ${i + 1}`);
            return;
        }
    }

    // Start building briefing HTML
    let briefingHTML = `<p>Dear Name,<br>Good day.</p>`;
    briefingHTML += `<p>Trust this mail finds you well.</p>`;
    briefingHTML += `<p><u>Below you will find detailed flight briefing:</u></p>`;

    // First line with bold formatting
    const firstDepartureDateTime = new Date(`${firstLeg.departureDate}T${firstLeg.departureTime}`);
    const firstDepDate = firstDepartureDateTime.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    }).replace(/\//g, '.');
    const firstDepTime = firstLeg.departureTime;
    const arrivalTime3HoursPrior = subtractHours(firstDepTime, 3);

    briefingHTML += `<p>Your flight from <b>${firstLeg.arrivalAirport}</b> to <b>${firstLeg.departureAirport}</b> departs on the <b>${firstDepDate} @ ${firstDepTime} LT</b>. `;
    briefingHTML += `<u>Please make sure you will be at the airport not later than <b>${arrivalTime3HoursPrior} LT</b>.</u></p>`;

    // Layover information for each connection
    flightLegs.forEach((leg, index) => {
        if (index < flightLegs.length - 1) {
            const nextLeg = flightLegs[index + 1];
            const layover = calculateLayover(leg, nextLeg);
            
            const depDateTime = new Date(`${nextLeg.departureDate}T${nextLeg.departureTime}`);
            const depDate = depDateTime.toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            }).replace(/\//g, '.');
            const depTime = nextLeg.departureTime;

            briefingHTML += `<p>In <b>${leg.departureAirport}</b> you will have a layover of <b>${layover}</b> until your next flight to <b>${nextLeg.departureAirport}</b>. `;
            briefingHTML += `Departing on <b>${depDate} @ ${depTime} LT</b>.</p>`;
        }
    });

    // Ticket attachment reference
    if (flightLegs.length > 1) {
        const secondToLastLeg = flightLegs[flightLegs.length - 2];
        briefingHTML += `<p>Please see in attached your flight ticket for <b>${secondToLastLeg.departureAirport}</b>.</p>`;
    }

    // Final taxi message
    briefingHTML += `<p><i>In <b>${lastLeg.departureAirport}</b> airport, a taxi will be waiting for you. `;
    briefingHTML += `In case you have notice that the driver is not in the pick-up point, please contact the responsible agent:</i></p>`;

    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = briefingHTML;
    outputDiv.classList.add('show');
    document.getElementById('copyBtn').style.display = 'block';
}

function copyToClipboard() {
    const outputDiv = document.getElementById('output');
    
    // Create a temporary element to copy HTML with formatting
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = outputDiv.innerHTML;
    document.body.appendChild(tempDiv);
    
    // Select the content
    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    try {
        // Copy with formatting
        document.execCommand('copy');
        
        const msg = document.getElementById('successMsg');
        msg.style.display = 'block';
        setTimeout(() => {
            msg.style.display = 'none';
        }, 2000);
    } catch (err) {
        console.error('Copy failed:', err);
    } finally {
        // Clean up
        selection.removeAllRanges();
        document.body.removeChild(tempDiv);
    }
}

// Initialize when page loads
initializeFirstLeg();

// Parallax effect on mouse move
document.addEventListener('mousemove', (e) => {
    const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    
    const layer2 = document.querySelector('.parallax-layer-2');
    const layer3 = document.querySelector('.parallax-layer-3');
    
    if (layer2) {
        layer2.style.transform = `translate(${mouseX * 20}px, ${mouseY * 20}px)`;
    }
    
    if (layer3) {
        layer3.style.transform = `translate(${mouseX * 40}px, ${mouseY * 40}px)`;
    }

});
