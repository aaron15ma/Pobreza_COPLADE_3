// Crear el mapa
var map = L.map('map').setView([31.8908, -115.9240], 9);

// Definir los basemaps
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var googleSatelliteLayer = L.tileLayer('http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
    attribution: '&copy; <a href="https://www.google.com/intl/en_ALL/help/terms_maps.html">Google Maps</a>'
});

// Variable para almacenar la capa GeoJSON
var geojsonLayer = null;

// Cargar el GeoJSON y crear la capa
function cargarGeoJSON() {
    fetch('RANGO POBREZA COPLADE MAPA 3.geojson')
        .then(response => response.json())
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
                style: function (feature) {
                    var pobreza = feature.properties.POBREZA;
                    return {
                        fillColor: getColor(pobreza),
                        fillOpacity: 0.6,
                        color: getColor(pobreza),
                        weight: 2,
                        opacity: 1
                    };
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(
                        feature.properties.Localidad +
                        '<br>Rango de Pobreza: ' + feature.properties.POBREZA +
                        '<br>Población ITER: ' + feature.properties.Población +
                        '<br>Municipio: ' + feature.properties.Municipio
                    );
                }
            });

            geojsonLayer.addTo(map);

            // Configurar los eventos para los filtros
            document.querySelectorAll('.filter-pobreza, .filter-municipio').forEach(function (checkbox) {
                checkbox.addEventListener('change', filterLayers);
            });

            // Inicializar el zoom
            ajustarZoom();

            // Definir las capas base
            var baseLayers = {
                "OpenStreetMap": osmLayer,
                "Google Satellite": googleSatelliteLayer
            };

            // Añadir el control de capas
            L.control.layers(baseLayers).addTo(map);

            // Añadir el control de búsqueda
            L.Control.geocoder().addTo(map);
        })
        .catch(err => console.error('Error al cargar GeoJSON:', err));
}

function filterLayers() {
    var selectedPobreza = obtenerFiltrosSeleccionados('.filter-pobreza');
    var selectedMunicipios = obtenerFiltrosSeleccionados('.filter-municipio');

    geojsonLayer.eachLayer(function (layer) {
        var pobreza = layer.feature.properties.POBREZA;
        var municipio = layer.feature.properties.Municipio;

        var mostrarLayer = (
            selectedPobreza.includes(pobreza) || selectedPobreza.length === 0
        ) && (
            selectedMunicipios.includes(municipio) || selectedMunicipios.length === 0
        );

        if (mostrarLayer) {
            if (!map.hasLayer(layer)) {
                map.addLayer(layer);
            }
        } else {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        }
    });

    ajustarZoom();
}

function obtenerFiltrosSeleccionados(selector) {
    return Array.from(document.querySelectorAll(selector + ':checked')).map(el => el.value);
}

function ajustarZoom() {
    var bounds = L.latLngBounds();
    geojsonLayer.eachLayer(function (layer) {
        if (map.hasLayer(layer)) {
            bounds.extend(layer.getBounds());
        }
    });

    if (bounds.isValid()) {
        map.fitBounds(bounds);
    }
}

function getColor(pobreza) {
    switch (pobreza) {
        case '0% - 20%':
            return '#abcd66';
        case '20% - 40%':
            return '#ffaa00';
        case '40% - 60%':
            return '#e60000';
        case '60% - 80%':
            return '#730000';
        default:
            return '#ccc'; // Gris por defecto si no hay coincidencia
    }
}

document.getElementById('remove-filters').addEventListener('click', function() {
    document.querySelectorAll('.filter-pobreza, .filter-municipio').forEach(function(checkbox) {
        checkbox.checked = false;
    });

    filterLayers();
});

// Inicializar el mapa con los datos GeoJSON
cargarGeoJSON();
