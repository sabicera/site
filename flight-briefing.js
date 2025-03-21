// ---------------- PASSENGER UTILS -----------------

// Format a name correctly (e.g., "JOHN" -> "John")
function formatName(name) {
    return name.trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Format date (e.g., "13MAR" -> "13.03.2025")
function formatDate(date) {
    const months = {"JAN": "01", "FEB": "02", "MAR": "03", "APR": "04", "MAY": "05", "JUN": "06", 
                   "JUL": "07", "AUG": "08", "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12"};
    const day = date.substring(0, 2);
    const month = months[date.substring(2, 5)];
    const year = new Date().getFullYear() + (month < new Date().getMonth() + 1 ? 1 : 0);
    return `${day}.${month}.${year}`;
}

// Extract passenger name from a text string
function extractPassengerName(text) {
    // Check for pattern like "CHIYA/LOYISO WISEMAN MR" at the beginning of a line
    const lines = text.split('\n');
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('/') && !trimmedLine.includes(':') && !trimmedLine.includes('----')) {
            const nameMatch = trimmedLine.match(/([A-Z]+)\/([A-Z\s]+)(?:\s+(MR|MS|MRS))?$/);
            if (nameMatch) {
                const lastName = nameMatch[1];
                const firstName = nameMatch[2];
                return formatName(lastName) + " " + formatName(firstName);
            }
        }
    }
    
    // Fallback to other patterns
    // Format: 1.1NAME/SURNAME
    const gdsNameMatch = text.match(/\d\.\d([A-Z]+)\/([A-Z\s]+)/);
    if (gdsNameMatch) {
        const lastName = gdsNameMatch[1];
        const firstName = gdsNameMatch[2];
        return formatName(lastName) + " " + formatName(firstName);
    }
    
    // Simple format with title: BROWN/JONATHAN GEOFF MR
    const standardNameMatch = text.match(/([A-Z]+)\/([A-Z\s]+)\s+(MR|MS|MRS)/i);
    if (standardNameMatch) {
        const lastName = standardNameMatch[1];
        const firstName = standardNameMatch[2];
        return formatName(lastName) + " " + formatName(firstName);
    }
    
    // Simple format WITHOUT title: GOSH/THOMAS SAMAUL ROBERT
    const nameWithoutTitleMatch = text.match(/([A-Z]+)\/([A-Z\s]+)$/);
    if (nameWithoutTitleMatch) {
        const lastName = nameWithoutTitleMatch[1];
        const firstName = nameWithoutTitleMatch[2];
        return formatName(lastName) + " " + formatName(firstName);
    }
    
    return "Passenger";
}

// ---------------- FLIGHT PARSING -----------------

// Parse flight information from text
function parseFlights(text) {
    const parsedFlights = [];
    const lines = text.split('\n');

    // Find flight data lines
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip separator and header lines
        if (line.includes("----") || line.includes("Flight Date") || line.length === 0) {
            continue;
        }
        
        // Look for lines with flight information (airline code + number)
        // Examples: CM 485 13MAR, UP 230 13MAR
        const flightMatch = line.match(/^([A-Z]{2})\s*(\d+)\s+(\d{2}[A-Z]{3})/);
        
        if (flightMatch) {
            const airline = flightMatch[1];
            const flightNumber = flightMatch[2];
            const date = flightMatch[3];
            
            // Extract airport codes using the most reliable method (end of segments)
            const segments = line.split(/\s{2,}/); // Split by 2 or more spaces
            const airportCodes = [];
            
            for (const segment of segments) {
                // Look for 3-letter codes at the end of segments
                const codeMatch = segment.match(/([A-Z]{3})$/);
                if (codeMatch) {
                    airportCodes.push(codeMatch[1]);
                }
            }
            
            // Find time patterns (four digits)
            const times = line.match(/\b(\d{4})\b/g) || [];
            
            // Only proceed if we found both airport codes and times
            if (airportCodes.length >= 2 && times.length >= 2) {
                parsedFlights.push({
                    airline,
                    flightNumber,
                    date,
                    originCode: airportCodes[0],
                    destinationCode: airportCodes[1],
                    departure: times[0],
                    arrival: times[1]
                });
            }
        }
    }
    
    return parsedFlights;
}

// Calculate layover time between flights
function calculateLayover(prevArrival, nextDeparture, prevDate, nextDate) {
    // Convert times to hours and minutes
    const prevHours = parseInt(prevArrival.substring(0, 2));
    const prevMinutes = parseInt(prevArrival.substring(3, 5));
    const nextHours = parseInt(nextDeparture.substring(0, 2));
    const nextMinutes = parseInt(nextDeparture.substring(3, 5));

    let layoverHours = 0;
    let layoverMinutes = 0;

    if (prevDate === nextDate) {
        // Same day connection
        layoverHours = nextHours - prevHours;
        layoverMinutes = nextMinutes - prevMinutes;

        if (layoverMinutes < 0) {
            layoverHours -= 1;
            layoverMinutes += 60;
        }
    } else {
        // Overnight connection or multi-day connection
        // Convert dates to Date objects for calculating days between
        const [day1, month1, year1] = prevDate.split('.');
        const [day2, month2, year2] = nextDate.split('.');

        const date1 = new Date(year1, parseInt(month1) - 1, parseInt(day1));
        const date2 = new Date(year2, parseInt(month2) - 1, parseInt(day2));

        // Calculate days difference
        const daysDiff = Math.floor((date2 - date1) / (24 * 60 * 60 * 1000));

        // Calculate total hours and minutes
        let hoursRemaining = 24 - prevHours;
        let minutesOvernight = 0;

        if (prevMinutes > 0) {
            hoursRemaining -= 1;
            minutesOvernight = 60 - prevMinutes;
        }

        // Add 24 hours for each full day in between
        layoverHours = hoursRemaining + nextHours + (24 * (daysDiff - 1));
        layoverMinutes = minutesOvernight + nextMinutes;

        if (layoverMinutes >= 60) {
            layoverHours += 1;
            layoverMinutes -= 60;
        }
    }

    // Ensure we don't have negative layover times
    if (layoverHours < 0) {
        layoverHours = 0;
        layoverMinutes = 0;
    }

    return {
        hours: layoverHours,
        minutes: layoverMinutes
    };
}

// Return airport names mapping (with fallback if external data not loaded)
function getAirportNames() {
    // Try to use the global airportNames object if it exists
    if (window.airportNames) {
        return window.airportNames;
    }
    
    // Fallback to minimal mapping if airportNames is not available
    console.warn("Airport data not loaded from airport-data.js, using fallback data.");
    return {
        "PTY": "Panama City",
        "MIA": "Miami",
        "NAS": "Nassau",
        "FPO": "Freeport",
        // Add a few more common airports
        "JFK": "New York",
        "LHR": "London",
        "CDG": "Paris",
        "FRA": "Frankfurt",
        "SIN": "Singapore"
    };
}

// ---------------- MAIN FUNCTIONS -----------------

// Generate flight briefing from input text
function generateBriefing() {
    const inputText = document.getElementById("flights").value.trim();
    const airportNames = getAirportNames();

    if (inputText === "") {
        alert("Please enter flight details.");
        return;
    }

    // Extract passenger name from the input text
    const passengerName = extractPassengerName(inputText);
    
    // Parse flights from the input text
    const flights = parseFlights(inputText);
    
    // If no flights were parsed successfully, show an error
    if (!flights || flights.length === 0) {
        alert("Could not recognize flight details. Please check the format and try again.");
        console.error("Failed to parse flights from input:", inputText);
        return;
    }

    // Generate the briefing text
    let briefing = `Dear ${passengerName},\nGood day.\n\nTrust this mail finds you well.\n\nBelow you will find detailed flight briefing:\n\n`;
    let previousArrivalTime = null;
    let previousDestination = null;
    let previousDestinationName = null;
    let previousDate = null;

    // Process all flights
    for (let i = 0; i < flights.length; i++) {
        const flight = flights[i];
        // Use airport code to look up the airport name, or use code if not found
        const originName = airportNames[flight.originCode] || flight.originCode;
        const destinationName = airportNames[flight.destinationCode] || flight.destinationCode;

        // Format the date (13MAR → 13.03.2025)
        const formattedDate = formatDate(flight.date);

        // Format departure time (0801 → 08:01)
        const departure = flight.departure.substring(0, 2) + ":" + flight.departure.substring(2, 4);

        // Calculate check-in time (3 hours before departure)
        const departureHours = parseInt(flight.departure.substring(0, 2));
        const checkInHours = departureHours >= 3 ? departureHours - 3 : departureHours + 21; // Handle wrap around past midnight
        const checkInTime = checkInHours.toString().padStart(2, '0') + ":" + flight.departure.substring(2, 4);

        briefing += `Your flight from ${originName} to ${destinationName} departs on ${formattedDate} @ ${departure} LT.`;

        // Only add the airport arrival time message for the first flight
        if (i === 0) {
            briefing += ` Please make sure you will be at the airport not later than ${checkInTime} LT.`;
        }
        briefing += `\n\n`;

        // Calculate and display layover for connecting flights
        if (previousArrivalTime && previousDestination && flight.originCode === previousDestination) {
            const prevArrivalFormatted = previousArrivalTime;
            const nextDepartureFormatted = departure;

            const layover = calculateLayover(
                prevArrivalFormatted,
                nextDepartureFormatted,
                previousDate,
                formattedDate
            );

            briefing += `In ${originName}, you will have a layover of ${layover.hours} hours and ${layover.minutes} minutes until your next flight to ${destinationName}. Departing on ${formattedDate} @ ${departure} LT.\n\n`;
        }

        // Format arrival time for next iteration
        const arrival = flight.arrival.substring(0, 2) + ":" + flight.arrival.substring(2, 4);
        previousArrivalTime = arrival;
        previousDestination = flight.destinationCode;
        previousDestinationName = destinationName;
        previousDate = formattedDate;
    }

    briefing += "Please see in attached your flight ticket.";
    document.getElementById("output").textContent = briefing;
}

// Copy output to clipboard
function copyOutput() {
    const output = document.getElementById("output");
    const text = output.textContent;

    navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById("copy-btn");
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
            copyBtn.textContent = "Copy to Clipboard";
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert("Failed to copy text. Please try again.");
    });
}

// Clear input and output fields
function clearFields() {
    document.getElementById("flights").value = "";
    document.getElementById("output").textContent = "";
}

// Set up event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if airport data is loaded
    if (!window.airportNames) {
        console.warn("Airport data not loaded. Make sure airport-data.js is included before flight-briefing.js");
    }

    // Generate button click handler
    document.getElementById('generate-btn').addEventListener('click', generateBriefing);

    // Copy button click handler
    document.getElementById('copy-btn').addEventListener('click', copyOutput);

    // Clear button click handler
    document.getElementById('clear-btn').addEventListener('click', clearFields);
});
