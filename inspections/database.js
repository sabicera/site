window.formatVesselNameWithLink = function(text) {
    const regex = /\*(.*?)\*\s*[-–—]/; 
    const match = text.match(regex);
    if (match) {
        const rawName = match[1];
        const cleanName = rawName.trim().replace(/\s+/g, ' ').toUpperCase();
        const shipId = VESSEL_ID_DATABASE[cleanName];
        if (shipId) {
            const url = `https://www.marinetraffic.com/en/ais/home/shipid:${shipId}/zoom:10`;
            const linkHtml = `<a href="${url}" target="_blank" class="vessel-link">${rawName}</a>`;
            return text.replace(`*${rawName}*`, linkHtml);
        }
    }
    return text;
};

const VESSEL_ID_DATABASE = {
    "MSC ZONDA III": "758102",
    "MSC PRETORIA II": "757962",
    "MSC AMALFI": "2956",
    "MSC VIGO": "758696",
    "ARTEMIS": "6291945",
    "EUROPE": "144594",
    "VALUE": "2657",
    "MSC ELOISE": "459901",
    "MSC EUGENIA": "7029539",
    "MSC MANYA": "755323",
    "MSC SUAPE VII": "133878",
    "MSC MARIA CLARA": "714770",
};
