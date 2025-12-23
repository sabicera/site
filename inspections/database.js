window.formatVesselNameWithLink = function(text) {
    if (!text) return text;
    const vesselNames = Object.keys(VESSEL_ID_DATABASE);
    vesselNames.sort((a, b) => b.length - a.length);
    let formattedText = text;
    const upperText = text.toUpperCase();
    for (const name of vesselNames) {
        const index = upperText.indexOf(name);
        if (index !== -1) {
            const shipId = VESSEL_ID_DATABASE[name];
            const url = `https://www.marinetraffic.com/en/ais/home/shipid:${shipId}/zoom:16`;
            const originalNameMatch = text.substr(index, name.length);
            const linkHtml = `<a href="${url}" target="_blank" class="vessel-link">${originalNameMatch}</a>`;
            return text.replace(originalNameMatch, linkHtml);
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
    "CATHERINE C": "8676359",
    "MSC VIDISHA R": "756300",
    "MSC JULIANA III": "757308",
    "MSC ELISABETTA": "9342816",
    "MSC ADONIS": "3603412",
    "MSC EXPRESS III": "1242848",
    "MSC MARIANNA": "409503",
    "MSC TIANSHAN": "152807",
    "MSC PASSION III": "758077",
    "MSC SASHA": "4330092",
    "MSC NERISSA V": "410823",
    "MSC MIRELLA R": "758132",
    "VALUE": "2657",
    "MSC ELOISE": "459901",
    "MSC EUGENIA": "7029539",
    "MSC MANYA": "755323",
    "MSC SUAPE VII": "133878",
    "MSC MARIA CLARA": "714770",
};
