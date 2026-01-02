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
    "MSC SAGITTA III": "713208",
    "MSC SIYA B": "5690755",
    "LE HAVRE": "123616",
    "MSC LORENZA": "8506286",
    "MSC BOSPHORUS": "419385",
    "MSC LEO VI": "410383",
    "MSC ILLINOIS VII": "2696",
    "MSC HORTENSE": "9780611",
    "MSC JULIA R": "756293",
    "MSC CASSANDRE": "7116780",
    "MSC MUGE": "9771135",
    "MSC MAGNUM VII": "143667",
    "MSC MICHELA": "4301900",
    "MSC GIULIA": "4378187",
    "MSC VAISHNAVI R": "756294",
    "MSC URSULA VI": "421362",
    "MSC TIANJIN": "690702",
    "MSC PETRA": "754910",
    "CAPE AKRITAS": "4115608",
    "MSC NAOMI": "3474037",
    "MSC VANESSA": "419688",
    "MSC WESER": "715830",
    "MSC BRANKA": "4069935",
    "MSC RONIT R": "757579",
    "MSC ATHOS": "214829",
    "MSC MALENA": "713237",
    "MSC EMILIA": "9931061",
    "MSC RESILIENT III": "123709",
    "MSC PHOENIX": "415822",
    "MSC ORSOLA": "8187738",
    "MSC ALANYA": "6857243",
    "MSC ROUEN": "9297663",
    "EUROPE": "144594",
    "EUROPE": "144594",
    "EUROPE": "144594",
    "EUROPE": "144594",

    "MSC PINA": "463965",
    "MSC ATHENS": "214826",
    "MSC JAPAN III": "460736",
    "MSC SUAPE VII": "133878",
    "MSC DOMITILLE": "3579312",
    "MSC ELIANA": "9818282",
    "MSC SHUBA B": "5096617",
    "MSC INSA": "9495123",
    "MSC SOLA": "459583",
    "MSC ANZU": "3573660",
    "MSC LOS ANGELES": "730617",
    "MSC NOA ARIELA": "7746268",
    "CAPE SOUNIO": "4653483",
    "MSC CANBERRA III": "420829",
    "MSC BRASILIA VII": "133872",
    "MSC ACCRA IV": "758215",
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
