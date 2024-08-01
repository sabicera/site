var map = L.map('map').setView([10, -30], 3); // Set initial view to show the entire world

// Add a Carto tile layer to the map with English labels
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 18
}).addTo(map);

var agentMarkers = [];
var providerMarkers = [];
var portsMarkers = [];

// Function to create a marker with mouseover and click events
function createMarker(lat, lon, popupContent, phoneNumber) {
    var marker = L.marker([lat, lon]);
    var whatsappUrl = `https://wa.me/${phoneNumber}`;
    
    // Replace new lines with HTML line breaks for display
    var formattedPopupContent = popupContent.replace(/\n/g, '<br>');
    
    // Escape single quotes for JavaScript string handling
    var escapedPopupContent = popupContent.replace(/'/g, "\\'").replace(/\n/g, '\\n');
    
    var updatedPopupContent = `
        <div>
            ${formattedPopupContent}
            <br><b>Contact:</b> <a href="${whatsappUrl}" target="_blank">${phoneNumber}</a>
            <br><button onclick="copyToClipboard('${escapedPopupContent}')">
                <img src="../icons/copy.png" alt="Copy" style="width:16px;height:16px;"/>
            </button>
        </div>
    `;
    
    marker.bindPopup(updatedPopupContent);

    marker.on('mouseover', function() {
        marker.openPopup();
    });

    marker.on('mouseout', function() {
        if (!marker.isPopupOpen()) {
            marker.closePopup();
        }
    });

    marker.on('click', function() {
        marker.openPopup();
        marker.off('mouseout');
    });

    return marker;
}

// Function to load markers from a JSON file
function loadMarkers(jsonFile, markerArray) {
    fetch(jsonFile)
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                var marker = createMarker(item.lat, item.lon, `<b>${item.name}</b><br>${item.details}`, item.phone);
                markerArray.push(marker);
                marker.addTo(map);
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

// Load markers for agents and providers
loadMarkers('agents.json', agentMarkers);
loadMarkers('providers.json', providerMarkers);
loadMarkers('ports.json', portsMarkers);

// Toggle visibility of markers
document.getElementById('toggle-agents').addEventListener('change', function() {
    if (this.checked) {
        agentMarkers.forEach(marker => marker.addTo(map));
    } else {
        agentMarkers.forEach(marker => marker.remove());
    }
});

document.getElementById('toggle-providers').addEventListener('change', function() {
    if (this.checked) {
        providerMarkers.forEach(marker => marker.addTo(map));
    } else {
        providerMarkers.forEach(marker => marker.remove());
    }
});

document.getElementById('toggle-ports').addEventListener('change', function() {
    if (this.checked) {
        portsMarkers.forEach(marker => marker.addTo(map));
    } else {
        portsMarkers.forEach(marker => marker.remove());
    }
});

// Function to copy text to clipboard
function copyToClipboard(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}
// Updated search functionality to include both agents and providers
document.getElementById('search-button').addEventListener('click', function() {
    var query = document.getElementById('search-box').value.toLowerCase();
    var found = false;

    var markers = agentMarkers.concat(providerMarkers, portsMarkers);

    markers.forEach(function(marker) {
        var popupContent = marker.getPopup().getContent().toLowerCase();
        if (popupContent.includes(query)) {
            map.setView(marker.getLatLng(), 10);
            marker.openPopup();
            found = true;
        }
    });

    if (!found) {
        alert('Location not found');
    }
});
