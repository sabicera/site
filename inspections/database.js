window.formatVesselNameWithLink = function(text) {
    // Regex looks for *NAME* -
    const regex = /\*(.*?)\*\s*-/;
    const match = text.match(regex);

    if (match) {
        const vesselName = match[1].trim().toUpperCase();
        const shipId = VESSEL_ID_DATABASE[vesselName];

        if (shipId) {
            // Live map link with zoom level 10
            const url = `https://www.marinetraffic.com/en/ais/home/shipid:${shipId}/zoom:8`;
            const linkHtml = `<a href="${url}" target="_blank" class="vessel-link">${match[1].trim()}</a>`;
            return text.replace(`*${match[1]}*`, linkHtml);
        }
    }
    return text;
};

const VESSEL_ID_DATABASE = {
    "MSC ZONDA III": "156432",
    "MSC PRETORIA II": "757962",
    "MSC AMALFI": "173852",
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
