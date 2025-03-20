// Function to parse the alternative format
function parseAlternativeFormat(text) {
    const parsedFlights = [];
    const lines = text.split('\n');

    // Check for GDS dot-separated flight format
    // Example: 1 . UX 4064 H 17MAR VLCMAD HK1 1225 1330
    const gdsPattern = /\d\s\.\s([A-Z]{2})\s(\d+)\s[A-Z]\s(\d{2}[A-Z]{3})\s([A-Z]{3})([A-Z]{3})\s[A-Z]+\d\s(\d{4})\s(\d{4})/;

    if (text.match(gdsPattern)) {
        console.log("Detected GDS dot-separated format");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(gdsPattern);

            if (match) {
                const [_, airline, flightNumber, date, originCode, destCode, departure, arrival] = match;

                parsedFlights.push({
                    airline: airline,
                    flightNumber: flightNumber,
                    date: date,
                    originCode: originCode,
                    destinationCode: destCode,
                    departure: departure,
                    arrival: arrival
                });
            }
        }

        if (parsedFlights.length > 0) {
            return parsedFlights;
        }
    }

    // Check for city-code format
    // Example: CM0360 23FEB PANAMA CITY (PTY) LOS ANGELES (LAX) 0721 1130
    const cityCodePattern = /([A-Z]{2})(\d+)\s+(\d{2}[A-Z]{3})\s+.+?\(([A-Z]{3})\)\s+.+?\(([A-Z]{3})\)\s+(\d{4})\s+(\d{4})/;

    if (text.match(cityCodePattern)) {
        console.log("Detected city-code format");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(cityCodePattern);

            if (match) {
                const [_, airline, flightNumber, date, originCode, destCode, departure, arrival] = match;

                parsedFlights.push({
                    airline: airline,
                    flightNumber: flightNumber,
                    date: date,
                    originCode: originCode,
                    destinationCode: destCode,
                    departure: departure,
                    arrival: arrival
                });
            }
        }

        if (parsedFlights.length > 0) {
            return parsedFlights;
        }
    }

    // Check for simple flight format 
    // Example: AZ7507 09MAR OTP FCO 1130 1240
    const simpleFlightPattern = /([A-Z]{2})(\d+)\s+(\d{2}[A-Z]{3})\s+([A-Z]{3})\s+([A-Z]{3})\s+(\d{4})\s+(\d{4})/;

    if (text.match(simpleFlightPattern)) {
        console.log("Detected simple flight format");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(simpleFlightPattern);

            if (match) {
                const [_, airline, flightNumber, date, originCode, destCode, departure, arrival] = match;

                parsedFlights.push({
                    airline: airline,
                    flightNumber: flightNumber,
                    date: date,
                    originCode: originCode,
                    destinationCode: destCode,
                    departure: departure,
                    arrival: arrival
                });
            }
        }

        if (parsedFlights.length > 0) {
            return parsedFlights;
        }
    }

    // Check if this is the Turkish Airlines format like "TK1066 07MAR CND CONSTANTA IST ISTANBUL AIRPORT 1010 1230"
    const turkishPattern = /\b([A-Z]{2}\d+)\s+(\d{2}[A-Z]{3})\s+([A-Z]{3})\s+[A-Z\s]+\s+([A-Z]{3})\s+[A-Z\s]+\s+(\d{4})\s+(\d{4})/;
    if (text.match(turkishPattern)) {
        console.log("Detected Turkish Airlines format");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(turkishPattern);

            if (match) {
                const [_, flightCode, dateStr, originCode, destCode, departure, arrival] = match;
                const airline = flightCode.substring(0, 2);
                const flightNumber = flightCode.substring(2);

                parsedFlights.push({
                    airline: airline,
                    flightNumber: flightNumber,
                    date: dateStr,
                    originCode: originCode,
                    destinationCode: destCode,
                    departure: departure,
                    arrival: arrival
                });
            }
        }

        if (parsedFlights.length > 0) {
            return parsedFlights;
        }
    }

    // Check if this is the SA Airlink format like "FA0421 09MAR DUR PLZ 1400 1530"
    const salinkPattern = /\b([A-Z]{2}\d+)\s+(\d{2}[A-Z]{3})\s+([A-Z]{3})\s+([A-Z]{3})\s+(\d{4})\s+(\d{4})/;
    if (text.match(salinkPattern)) {
        console.log("Detected SA Airlink format");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(salinkPattern);

            if (match) {
                const [_, flightCode, dateStr, originCode, destCode, departure, arrival] = match;
                const airline = flightCode.substring(0, 2);
                const flightNumber = flightCode.substring(2);

                parsedFlights.push({
                    airline: airline,
                    flightNumber: flightNumber,
                    date: dateStr,
                    originCode: originCode,
                    destinationCode: destCode,
                    departure: departure,
                    arrival: arrival
                });
            }
        }

        if (parsedFlights.length > 0) {
            return parsedFlights;
        }
    }

    // Check for airline confirmation email format - using regex instead of hardcoded values
    const airlineConfirmPattern = /\b([A-Z]{2})\s+(\d+)\b[\s\S]*?\b([A-Z]{3})\b[\s\S]*?\b([A-Z]{3})\b[\s\S]*?\b(\d{4})\b[\s\S]*?\b(\d{4})\b/;
    if (text.match(airlineConfirmPattern)) {
        console.log("Detected airline confirmation format");

        // Look for flight segments
        const segmentRegex = /\b([A-Z]{2})\s+(\d+)\b[\s\S]*?\b([A-Z]{3})\b[\s\S]*?\b([A-Z]{3})\b[\s\S]*?\b(\d{4})\b[\s\S]*?\b(\d{4})\b/g;
        let match;

        // Find date in the format DDMMM (like 13MAR)
        const dateRegex = /\b(\d{2}[A-Z]{3})\b/;
        const dateMatch = text.match(dateRegex);
        const date = dateMatch ? dateMatch[1] : '';

        while ((match = segmentRegex.exec(text)) !== null) {
            const [_, airline, flightNumber, originCode, destCode, departure, arrival] = match;

            parsedFlights.push({
                airline: airline,
                flightNumber: flightNumber,
                date: date,
                originCode: originCode,
                destinationCode: destCode,
                departure: departure,
                arrival: arrival
            });
        }

        if (parsedFlights.length > 0) {
            return parsedFlights;
        }
    }

    // Look for lines containing flight details
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check for general airline code + flight number pattern
        // This will catch many formats like "CM 226", "BA 254", etc.
        const generalFlightPattern = /([A-Z]{2})\s+(\d+)\s+[A-Z]\s+(\d{2}[A-Z]{3})\s+([A-Z]{3})([A-Z]{3})/;
        const generalMatch = line.match(generalFlightPattern);

        if (generalMatch) {
            // Now look for the departure and arrival times
            const timePattern = /(\d{4})\s+(\d{4}|\#\d{4})/;
            const timeMatch = line.match(timePattern);

            if (timeMatch) {
                const [_, airline, flightNumber, date, originCode, destCode] = generalMatch;
                let [__, departure, arrival] = timeMatch;

                // Remove # if present (used for next-day arrivals)
                arrival = arrival.replace('#', '');

                parsedFlights.push({
                    airline,
                    flightNumber,
                    date,
                    originCode,
                    destinationCode: destCode,
                    departure,
                    arrival
                });

                continue;
            }
        }

        // Pattern for joined airport codes like VLCMAD
        const joinedAirportPattern = /([A-Z]{2})\s+(\d+)\s+[A-Z]\s+(\d{2}[A-Z]{3})\s+([A-Z]{3})([A-Z]{3})\s+[A-Z]+\d\s+(\d{4})\s+(\d{4})/;
        const joinedMatch = line.match(joinedAirportPattern);

        if (joinedMatch) {
            const [_, airline, flightNumber, date, originCode, destCode, departure, arrival] = joinedMatch;

            parsedFlights.push({
                airline,
                flightNumber,
                date,
                originCode,
                destinationCode: destCode,
                departure,
                arrival
            });

            continue;
        }
    }

    // If we still couldn't extract any flights, try one more pattern
    // Format like Flight Date Origin Destination Dep Arr with dashes between sections
    if (parsedFlights.length === 0 && text.includes("---------------------------------------------------------------------------------------------")) {
        console.log("Trying table format with dashes");

        // Look for lines after the dashes
        let headerFound = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.includes("---------------------------------------------------------------------------------------------")) {
                headerFound = true;
                continue;
            }

            if (headerFound && line.length > 0 && !line.includes("---------------------------------------------------------------------------------------------")) {
                // This looks like a flight details line
                // TK1066 07MAR CND CONSTANTA        IST ISTANBUL AIRPORT 1010  1230  07MAR   TK/SJZ68Q -   40K

                // Try to extract airport codes
                const airportCodes = line.match(/\b([A-Z]{3})\b/g);

                // Try to extract flight number
                const flightMatch = line.match(/([A-Z]{2})\s*(\d+)/);

                // Try to extract date
                const dateMatch = line.match(/\b(\d{2}[A-Z]{3})\b/);

                // Try to extract times
                const timeMatch = line.match(/\b(\d{4})\b/g);

                if (flightMatch && dateMatch && airportCodes && airportCodes.length >= 2 && timeMatch && timeMatch.length >= 2) {
                    const airline = flightMatch[1];
                    const flightNumber = flightMatch[2];
                    const date = dateMatch[1];
                    const originCode = airportCodes[0];
                    const destinationCode = airportCodes[1];
                    const departure = timeMatch[0];
                    const arrival = timeMatch[1].replace('+1', ''); // Remove the +1 if present

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
        }
    }

    return parsedFlights;
}

// Function to check if input is in alternative format
function isAlternativeFormat(text) {
    // Check if any of the alternative format patterns match
    const gdsPattern = /\d\s\.\s[A-Z]{2}\s\d+\s[A-Z]\s\d{2}[A-Z]{3}\s[A-Z]{3}[A-Z]{3}\s[A-Z]+\d\s\d{4}\s\d{4}/;
    const cityCodePattern = /[A-Z]{2}\d+\s+\d{2}[A-Z]{3}\s+.+?\([A-Z]{3}\)\s+.+?\([A-Z]{3}\)\s+\d{4}\s+\d{4}/;
    const simpleFlightPattern = /[A-Z]{2}\d+\s+\d{2}[A-Z]{3}\s+[A-Z]{3}\s+[A-Z]{3}\s+\d{4}\s+\d{4}/;
    const turkishPattern = /\b[A-Z]{2}\d+\s+\d{2}[A-Z]{3}\s+[A-Z]{3}\s+[A-Z\s]+\s+[A-Z]{3}\s+[A-Z\s]+\s+\d{4}\s+\d{4}/;
    const salinkPattern = /\b[A-Z]{2}\d+\s+\d{2}[A-Z]{3}\s+[A-Z]{3}\s+[A-Z]{3}\s+\d{4}\s+\d{4}/;

    // Check for airline confirmation email format
    const confirmationFormat = text.match(/\b[A-Z]{2}\s+\d+\b/) && text.match(/\b[A-Z]{3}\b/) && text.match(/\b\d{4}\b/);

    return text.match(gdsPattern) ||
        text.match(cityCodePattern) ||
        text.match(simpleFlightPattern) ||
        text.match(turkishPattern) ||
        text.match(salinkPattern) ||
        confirmationFormat;
}

// Extract passenger name from text
function extractPassengerName(text) {
    // Try to find passenger name in various formats
    const namePatterns = [
        /PASSENGER:\s+([A-Z\s]+)/i,
        /NAME:\s+([A-Z\s]+)/i,
        /PASSENGER NAME:\s+([A-Z\s]+)/i,
        /([A-Z]+)\/([A-Z\s]+)/,
        /([A-Z]+)\/([A-Z\s]+)\s+MR/,
        /([A-Z]+)\/([A-Z\s]+)\s+M[RS]/
    ];

    for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match) {
            if (match[2]) {
                // Format with surname/firstname
                return formatName(match[2]) + " " + formatName(match[1]);
            } else {
                // Simple name format
                return formatName(match[1]);
            }
        }
    }

    // If no name found, try to look for a sequence of uppercase letters that might be a name
    const uppercaseSequence = text.match(/\b([A-Z]{5,})\b/);
    if (uppercaseSequence) {
        return formatName(uppercaseSequence[1]);
    }

    // Default to generic passenger
    return "Passenger";
}

// Format name properly (JOHN DOE -> John Doe)
function formatName(name) {
    return name.trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Format date (13MAR -> 13.03.2025)
function formatDate(dateStr) {
    const day = dateStr.substring(0, 2);
    const monthStr = dateStr.substring(2, 5);

    const months = {
        "JAN": "01",
        "FEB": "02",
        "MAR": "03",
        "APR": "04",
        "MAY": "05",
        "JUN": "06",
        "JUL": "07",
        "AUG": "08",
        "SEP": "09",
        "OCT": "10",
        "NOV": "11",
        "DEC": "12"
    };

    const month = months[monthStr];
    const currentYear = new Date().getFullYear();

    return `${day}.${month}.${currentYear}`;
}

// Initialize airport names object using airportNames from airport-data.js
function getAirportNames() {
    // Use the airportNames object from airport-data.js
    return airportNames;
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

function generateBriefing() {
    const inputText = document.getElementById("flights").value.trim();
    const airportNames = getAirportNames();

    if (inputText === "") {
        alert("Please enter flight details.");
        return;
    }

    // Detect which format we're dealing with
    const isAltFormat = isAlternativeFormat(inputText);
    let passengerName;
    let flights;

    if (isAltFormat) {
        // Handle alternative format
        passengerName = extractPassengerName(inputText);
        flights = parseAlternativeFormat(inputText);

        // Debug output
        console.log("Extracted passenger name:", passengerName);
        console.log("Parsed flights:", flights);

        // If no flights were parsed successfully, show an error
        if (!flights || flights.length === 0) {
            alert("Could not recognize flight details. Please check the format and try again.");
            console.error("Failed to parse flights from input:", inputText);
            return;
        }
    } else {
        // Handle original format
        const flightLines = inputText.split("\n").filter(line => line.trim() !== "");
        flights = [];

        // Use regex to extract name from the first line if it exists
        const nameMatch = flightLines[0].match(/\d+([A-Z]+)/);
        passengerName = nameMatch ? formatName(nameMatch[1]) : "Passenger";

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

    let briefing = `Dear ${passengerName},\nGood day.\n\nTrust this mail finds you well.\n\nBelow you will find detailed flight briefing:\n\n`;
    let previousArrivalTime = null;
    let previousDestination = null;
    let previousDestinationName = null;
    let previousDate = null;

    // Process all flights
    for (let i = 0; i < flights.length; i++) {
        const flight = flights[i];
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

function clearFields() {
    document.getElementById("flights").value = "";
    document.getElementById("output").textContent = "";
}

// Set up event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Generate button click handler
    document.getElementById('generate-btn').addEventListener('click', generateBriefing);

    // Copy button click handler
    document.getElementById('copy-btn').addEventListener('click', copyOutput);

    // Clear button click handler
    document.getElementById('clear-btn').addEventListener('click', clearFields);
});
