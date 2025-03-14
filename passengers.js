function formatName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
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

function extractPassengerName(text) {
    // Format: 1.1SAMOILOV/DMYTRO
    const gdsNameMatch = text.match(/\d\.\d([A-Z]+)\/([A-Z\s]+)/);
    if (gdsNameMatch) {
        const lastName = gdsNameMatch[1];
        const firstName = gdsNameMatch[2];
        return formatName(firstName.trim()) + " " + formatName(lastName.trim());
    }
    
    // Try to match format: 1 MHLONGO/MDUDUZI FANA NIMROD MR
    const fullNameMatch = text.match(/\d+\s+([A-Z]+)\/([A-Z\s]+)\s+(MR|MS|MRS)/i);
    if (fullNameMatch) {
        const lastName = fullNameMatch[1];
        const firstName = fullNameMatch[2];
        return formatName(firstName.trim()) + " " + formatName(lastName.trim());
    }
    
    // Try to match format: 1 FEDOROV/VITALII MR 
    const simpleNameMatch = text.match(/\d+\s+([A-Z]+)\/([A-Z]+)\s+(MR|MS|MRS)/i);
    if (simpleNameMatch) {
        const lastName = simpleNameMatch[1];
        const firstName = simpleNameMatch[2];
        return formatName(firstName.trim()) + " " + formatName(lastName.trim());
    }
    
    // Try to find passenger name in parentheses followed by MR/MRS
    const bracketsNameMatch = text.match(/\(([^)]+)\)\s*MR/i);
    if (bracketsNameMatch && bracketsNameMatch[1]) {
        return bracketsNameMatch[1].trim();
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
                    return formatName(firstName.trim()) + " " + formatName(lastName.trim());
                }
            }
        }
    }
    
    // Try the original format
    const nameMatch = text.match(/([A-Z\s]+)\s+MR\s+-+/);
    if (nameMatch && nameMatch[1]) {
        return nameMatch[1].trim();
    }
    
    // Simple format: VIGUS/AARON CHRISTOPHER MR
    const standardNameMatch = text.match(/([A-Z]+)\/([A-Z\s]+)\s+(MR|MS|MRS)/i);
    if (standardNameMatch) {
        const lastName = standardNameMatch[1];
        const firstName = standardNameMatch[2];
        return formatName(firstName.trim()) + " " + formatName(lastName.trim());
    }
    
    return "Passenger";
}

// Export the functions to make them available to other modules
window.passengerUtils = {
    formatName,
    formatDate,
    isAlternativeFormat,
    extractPassengerName
};