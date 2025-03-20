function formatName(name) {
    return name.trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatDate(date) {
    const months = {"JAN": "01", "FEB": "02", "MAR": "03", "APR": "04", "MAY": "05", "JUN": "06", 
                   "JUL": "07", "AUG": "08", "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12"};
    const day = date.substring(0, 2);
    const month = months[date.substring(2, 5)];
    const year = new Date().getFullYear() + (month < new Date().getMonth() + 1 ? 1 : 0);
    return `${day}.${month}.${year}`;
}

function isAlternativeFormat(text) {
    // Check if it has GDS format (1.1NAME/SURNAME)
    if (text.match(/\d\.\d[A-Z]+\/[A-Z\s]+/)) {
        return true;
    }
    
    // Check if it has the standard format with Flight Date, Org, Dest columns
    if (text.includes('Flight Date') && text.includes('Org') && text.includes('Dest')) {
        return true;
    }
    
    // Check if it has the bracketed format
    if (text.includes('(') && text.includes(')') && 
        (text.includes('MR') || text.includes('MRS') || text.includes('MS'))) {
        return true;
    }
    
    // Check for numbered passenger format like "1 MHLONGO/MDUDUZI FANA NIMROD MR"
    if (text.match(/\d+\s+[A-Z]+\/[A-Z\s]+\s+MR/i)) {
        return true;
    }
    
    // Check for "VESSEL" and "COST CENTRE" format
    if (text.includes('VESSEL') && text.includes('COST CENTRE')) {
        return true;
    }
    
    // Check for GDS dot-separated flight format
    if (text.match(/\d\s\.\s[A-Z]{2}\s\d+\s[A-Z]\s\d{2}[A-Z]{3}/)) {
        return true;
    }
    
    // Check for Turkish Airlines format
    if (text.match(/TK\d+\s+\d{2}[A-Z]{3}/)) {
        return true;
    }
    
    // Check for SA Airlink format
    if (text.match(/FA\d+\s+\d{2}[A-Z]{3}/)) {
        return true;
    }
    
    // Check for simple airline code + number format
    if (text.match(/[A-Z]{2}\d+\s+\d{2}[A-Z]{3}/)) {
        return true;
    }
    
    // Check for city/airport code format
    if (text.match(/\([A-Z]{3}\)/)) {
        return true;
    }
    
    return false;
}

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
    
    // Try to find passenger name in parentheses followed by MR/MRS
    const bracketsNameMatch = text.match(/\(([^)]+)\)\s*MR/i);
    if (bracketsNameMatch && bracketsNameMatch[1]) {
        return bracketsNameMatch[1].trim();
    }
    
    return null;
}

function extractPassengerName(text) {
    // First try to extract a single passenger name
    const singleName = extractSinglePassengerName(text);
    if (singleName) {
        return singleName;
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
    
    // If we still can't find a name, try the original format
    const nameMatch = text.match(/([A-Z\s]+)\s+MR\s+-+/);
    if (nameMatch && nameMatch[1]) {
        return nameMatch[1].trim();
    }
    
    // Try the format: FOR PASSENGER\nVIGUS/AARON CHRISTOPHER MR
    if (text.includes("FOR PASSENGER")) {
        const passengerLines = text.split("\n");
        for (let i = 0; i < passengerLines.length; i++) {
            if (passengerLines[i].includes("FOR PASSENGER") && i + 1 < passengerLines.length) {
                const nextLine = passengerLines[i + 1].trim();
                const nameMatch = nextLine.match(/([A-Z]+)\/([A-Z\s]+)\s+(MR|MS|MRS)/i);
                if (nameMatch) {
                    const lastName = nameMatch[1];
                    const firstName = nameMatch[2];
                    return formatName(lastName) + " " + formatName(firstName);
                }
            }
        }
    }
    
    return "Passenger";
}

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

// Export the functions to make them available to other modules
window.passengerUtils = {
    formatName,
    formatDate,
    isAlternativeFormat,
    extractPassengerName,
    extractMultiplePassengerNames
};
