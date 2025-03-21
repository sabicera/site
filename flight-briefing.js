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

// Detect whether the input is in an alternative format 
function isAlternativeFormat(text) {
    // Check if it has GDS format (1.1NAME/SURNAME)
    if (text.match(/\d\.\d[A-Z]+\/[A-Z\s]+/)) {
        return true;
    }
    
    // Check if it has the standard format with Flight Date, Org, Dest columns
    if (text.includes('Flight Date') && text.includes('Org') && text.includes('Dest')) {
        return true;
    }
    
    // Check for various flight formats
    if (text.match(/\d\s\.\s[A-Z]{2}\s\d+\s[A-Z]\s\d{2}[A-Z]{3}/) || // GDS dot-separated flight format
        text.match(/[A-Z]{2}\d+\s+\d{2}[A-Z]{3}/) ||  // Simple airline code + number format
        text.match(/\([A-Z]{3}\)/)) {  // City/airport code format
        return true;
    }
    
    return false;
}

// Extract a single passenger name from a text string
function extractSinglePassengerName(text) {
    // Format: 1.1TLALI/RAMAQHUBU CHRISTIAN
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
    
    return null;
}

// Extract multiple passenger names from a text containing multiple names
function extractMultiplePassengerNames(text) {
    const lines = text.split('\n');
    const names = [];
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && trimmedLine.includes('/')) {
            const extractedName = extractSinglePassengerName(trimmedLine);
            if (extractedName) {
                names.push(extractedName);
            }
        }
    }
    
    return names.length > 0 ? names : ["Passenger"];
}

// Main function to extract passenger name from input text
function extractPassengerName(text) {
    // First try to extract a single passenger name
    const singleName = extractSinglePassengerName(text);
    if (singleName) {
        return singleName;
    }
    
    // Check for pattern like "CHIYA/LOYISO WISEMAN MR" directly at the beginning of a line
    const lines = text.split('\n');
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('/') && trimmedLine.match(/^[A-Z]+\/[A-Z\s]+(MR|MS|MRS)?$/)) {
            const nameMatch = trimmedLine.match(/([A-Z]+)\/([A-Z\s]+)(?:\s+(MR|MS|MRS))?$/);
            if (nameMatch) {
                const lastName = nameMatch[1];
                const firstName = nameMatch[2];
                return formatName(lastName) + " " + formatName(firstName);
            }
        }
    }
    
    // If we have multiple passenger names on separate lines, extract them all
    if (text.includes('\n')) {
        const multipleNames = extractMultiplePassengerNames(text);
        if (multipleNames.length > 0 && multipleNames[0] !== "Passenger") {
            return multipleNames[0]; // Return the first name for the briefing
        }
    }
    
    // If text contains spaces, split it and check each part for potential name patterns
    if (text.includes(' ')) {
        const parts = text.split(/\s+/);
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part.includes('/')) {
                // Look for patterns like "NAME/SOMETHING"
                let fullName = part;
                
                // Check if the next parts are part of the name (like "GEOFF MR")
                let j = i + 1;
                while (j < parts.length && 
                      !parts[j].includes('/') && 
                      !parts[j].includes('-------') && 
                      parts[j].toUpperCase() === parts[j]) {
                    fullName += " " + parts[j];
                    j++;
                }
                
                const extractedName = extractSinglePassengerName(fullName);
                if (extractedName) {
                    return extractedName;
                }
            }
        }
    }
    
    return "Passenger";
}

// ---------------- FLIGHT PARSING -----------------

// Parse flight information from alternative format text
function parseAlternativeFormat(text) {
    const parsedFlights = [];
    const lines = text.split('\n');

    // Check for Flight Date, Org, Dest format with dashes
    // This handles formats like: 
    // CM 226 14MAR PANAMA CIT PTY   MIAMI INTL MIA   0801  1208           2PC
    // AA3433 14MAR MIAMI INTL MIA   FREEPORT FPO     1615  1705           0PC
    if (text.includes("Flight Date") && text.includes("Org") && text.includes("Dest")) {
        console.log("Detected Flight Date/Org/Dest format with dashes");

        let foundHeader = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip until we find the header line
            if (!foundHeader) {
                if (line.includes("Flight Date") && line.includes("Org") && line.includes("Dest")) {
                    foundHeader = true;
                }
                continue;
            }
            
            // Skip separator lines
            if (line.includes("----")) {
                continue;
            }
            
            // Try to match flight details line
            // Example: CM 226 14MAR PANAMA CIT PTY   MIAMI INTL MIA   0801  1208           2PC
            const flightMatch = line.match(/([A-Z]{2})(\d+)\s+(\d{2}[A-Z]{3})/);
            
            if (flightMatch) {
                const airline = flightMatch[1];
                const flightNumber = flightMatch[2];
                const date = flightMatch[3];
                
                // Find origin and destination with their airport codes
                // The pattern looks for text followed by a 3-letter code
                const locationPattern = /\b([A-Z][A-Z\s]+)\s+([A-Z]{3})\b/g;
                const locations = [];
                let locationMatch;
                
                while ((locationMatch = locationPattern.exec(line)) !== null) {
                    locations.push({
                        cityName: locationMatch[1].trim(),
                        airportCode: locationMatch[2]
                    });
                }
                
                // Find time patterns - usually 4 digits
                const times = line.match(/\b(\d{4})\b/g) || [];
                
                if (locations.length >= 2 && times.length >= 2) {
                    parsedFlights.push({
                        airline,
                        flightNumber,
                        date,
                        originCode: locations[0].airportCode,
                        originName: locations[0].cityName,
                        destinationCode: locations[1].airportCode,
                        destinationName: locations[1].cityName,
                        departure: times[0],
                        arrival: times[1]
                    });
                }
            }
        }
        
        if (parsedFlights.length > 0) {
            return parsedFlights;
        }
    }

    // Check for GDS dot-separated flight format
    // Examples: 
    // 1 . UX 4064 H 17MAR VLCMAD HK1 1225 1330
    // 1 . LA  181 L  22MAR ARISCL HK1  0800   1031  O*        E SA
    // 2 . AF  401 M  22MAR SCLCDG HK1  1210  #0600  O*        E SA/SU 15
    const gdsPattern = /\d\s\.\s([A-Z]{2})\s+(\d+)\s+[A-Z]\s+(\d{2}[A-Z]{3})\s+([A-Z]{3,6})\s+\w+\s+(\d{4})\s+#?(\d{4})/;
    if (text.match(gdsPattern)) {
        console.log("Detected GDS dot-separated format");
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(gdsPattern);

            if (match) {
                const [_, airline, flightNumber, date, originDestCode, departure, arrival] = match;
                
                // We need to split the origin/destination code as it might be in different formats
                let originCode, destinationCode;
                
                // Format could be ARISCL (6 chars) or joined like VLCMAD (6 chars)
                if (originDestCode.length === 6) {
                    originCode = originDestCode.substring(0, 3);
                    destinationCode = originDestCode.substring(3, 6);
                } else {
                    // Handle other formats by looking for airport codes in the line
                    const airportCodes = line.match(/\b([A-Z]{3})\b/g);
                    if (airportCodes && airportCodes.length >= 2) {
                        originCode = airportCodes[0];
                        destinationCode = airportCodes[1];
                    } else {
                        // Fallback
                        originCode = originDestCode;
                        destinationCode = "UNK"; // Unknown
                    }
                }
                
                parsedFlights.push({
                    airline, 
                    flightNumber, 
                    date, 
                    originCode, 
                    destinationCode, 
                    departure, 
                    arrival
                });
            }
        }
        if (parsedFlights.length > 0) return parsedFlights;
    }

    // Check for simple flight format (like "AZ7507 09MAR OTP FCO 1130 1240")
    const simpleFlightPattern = /([A-Z]{2})(\d+)\s+(\d{2}[A-Z]{3})\s+([A-Z]{3})\s+([A-Z]{3})\s+(\d{4})\s+(\d{4})/;
    if (text.match(simpleFlightPattern)) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(simpleFlightPattern);

            if (match) {
                const [_, airline, flightNumber, date, originCode, destCode, departure, arrival] = match;
                parsedFlights.push({
                    airline, flightNumber, date, originCode, 
                    destinationCode: destCode, departure, arrival
                });
            }
        }
        if (parsedFlights.length > 0) return parsedFlights;
    }

    // Try to match any patterns with airline codes, dates, and airport codes
    if (parsedFlights.length === 0) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Look for airline code and flight number pattern
            const flightMatch = line.match(/\b([A-Z]{2})\s*(\d+)\b/);
            
            if (flightMatch) {
                const airline = flightMatch[1];
                const flightNumber = flightMatch[2];
                
                // Try to find date in DDMMM format
                const dateMatch = line.match(/\b(\d{2}[A-Z]{3})\b/);
                const date = dateMatch ? dateMatch[1] : '';
                
                // Try to find airport codes
                const airportCodes = line.match(/\b([A-Z]{3})\b/g);
                
                // Try to find time patterns
                const times = line.match(/\b(\d{4})\b/g);
                
                if (date && airportCodes && airportCodes.length >= 2 && times && times.length >= 2) {
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

// Return airport names mapping
function getAirportNames() {
    // Try to use the global airportNames object if it exists
    if (window.airportNames) {
        return window.airportNames;
    }
    
    // Fallback to a basic mapping if airportNames is not available
    console.warn("Airport data not loaded from airport-data.js, using fallback data.");
    return {
        "PTY": "Panama City",
        "GYE": "Guayaquil",
        "IST": "Istanbul",
        "CND": "Constanta",
        "DUR": "Durban",
        "PLZ": "Port Elizabeth",
        "JNB": "Johannesburg",
        "CPT": "Cape Town",
        "ARI": "Arica",
        "SCL": "Santiago",
        "CDG": "Paris Charles de Gaulle",
        "EDI": "Edinburgh",
        // Add commonly used airports
        "LHR": "London Heathrow",
        "FRA": "Frankfurt",
        "AMS": "Amsterdam",
        "MAD": "Madrid",
        "BCN": "Barcelona",
        "FCO": "Rome",
        "MUC": "Munich",
        "JFK": "New York",
        "LAX": "Los Angeles",
        "SFO": "San Francisco",
        "SIN": "Singapore",
        "BKK": "Bangkok",
        "SYD": "Sydney"
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
    
    // Detect format and parse flights
    const isAltFormat = isAlternativeFormat(inputText);
    let flights;

    if (isAltFormat) {
        // Handle alternative format
        flights = parseAlternativeFormat(inputText);
    } else {
        // Handle original format
        const flightLines = inputText.split("\n").filter(line => line.trim() !== "");
        flights = [];

        // Parse each flight line 
        for (const line of flightLines) {
            const parts = line.match(/(\w+)\s+(\d+)\s+([A-Z])\s+(\d{2}[A-Z]{3})\s+(\w{3})(\w{3})\s+\w+\s+(\d{4})\s+(?:#?(\d{4}))?/);

            if (parts) {
                const [_, airline, flightNumber, bookingClass, date, origin, destination, departure, arrival] = parts;

                flights.push({
                    airline: airline,
                    flightNumber: flightNumber,
                    date: date,
                    originCode: origin,
                    destinationCode: destination,
                    departure: departure,
                    arrival: arrival || departure // Default to departure if arrival is missing
                });
            }
        }
    }

    // Try one more approach if no flights were parsed yet - for the specific LATAM/Air France format
    if (!flights || flights.length === 0) {
        console.log("Trying alternate GDS format parser");
        const alternateGdsPattern = /\d\s\.\s([A-Z]{2})\s+(\d+)\s+[A-Z]\s+(\d{2}[A-Z]{3})\s+([A-Z]{3})([A-Z]{3})\s+\w+\s+(\d{4})\s+#?(\d{4})/;
        
        const lines = inputText.split('\n');
        flights = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Try the LATAM/AF format first
            if (line.match(/\d\s\.\s[A-Z]{2}\s+\d+\s+[A-Z]/)) {
                // Get the airline code and flight number
                const basicInfo = line.match(/\d\s\.\s([A-Z]{2})\s+(\d+)\s+([A-Z])\s+(\d{2}[A-Z]{3})/);
                
                if (basicInfo) {
                    const airline = basicInfo[1];
                    const flightNumber = basicInfo[2];
                    const date = basicInfo[4];
                    
                    // Get airport codes - might be together like ARISCL or separate
                    let originCode = "", destinationCode = "";
                    const airportCodes = line.match(/\b([A-Z]{3})\b/g);
                    
                    if (airportCodes && airportCodes.length >= 2) {
                        originCode = airportCodes[0];
                        destinationCode = airportCodes[1];
                    } else {
                        // Try to find joined codes like ARISCL
                        const joinedCodes = line.match(/\s([A-Z]{6})\s/);
                        if (joinedCodes) {
                            originCode = joinedCodes[1].substring(0, 3);
                            destinationCode = joinedCodes[1].substring(3, 6);
                        }
                    }
                    
                    // Get times
                    const times = line.match(/\b(\d{4})\b/g);
                    let departure = "", arrival = "";
                    
                    if (times && times.length >= 2) {
                        departure = times[0];
                        arrival = times[1].replace('#', ''); // Remove # from arrival if present
                    } else if (times && times.length === 1) {
                        departure = times[0];
                        arrival = departure; // Default if no arrival found
                    }
                    
                    if (airline && flightNumber && date && originCode && destinationCode && departure) {
                        flights.push({
                            airline,
                            flightNumber,
                            date,
                            originCode,
                            destinationCode,
                            departure,
                            arrival
                        });
                    }
                }
            }
        }
    }
    
    // If still no flights were parsed successfully, show an error
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
        // Use directly provided origin/destination names if available, otherwise look them up
        const originName = flight.originName || airportNames[flight.originCode] || flight.originCode;
        const destinationName = flight.destinationName || airportNames[flight.destinationCode] || flight.destinationCode;

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
