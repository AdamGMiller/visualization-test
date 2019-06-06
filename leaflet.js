function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.popupContent) {
        layer.bindPopup(feature.properties.popupContent);
    }
}

function displayMapPoints(measureName) {
    if(layer)
    {
        vMap.removeLayer(layer);
    }
    layer = L.layerGroup();    
    vMap.addLayer(layer);

    var layerMapPoints = mapPoints.filter(a => a.properties.measureName == measureName);
    console.log(layerMapPoints);
    layer = L.geoJSON(layerMapPoints, {
        onEachFeature: onEachFeature
    }).addTo(layer);
}

var dataPoints = [];
var mapPoints = [];
var measureNames = [];
var years = [];
var vMap = L.map('mapid').setView([39.376542, -111.552493], 7);
var layer;

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWRhbWdtaWxsZXIiLCJhIjoiY2p3a3QxenhtMHR3YzN5cDZpM2gyM3owbSJ9.PsI19CeIGyA0hmJvbCSYkA', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
}).addTo(vMap);


// read measure data
$.getJSON("measure.json", function (data) {
    data.data.map(item => {
        var dataPoint = {
            year: item[8],
            clinic: item[9],
            measureName: item[11],
            numerator: item[13],
            denominator: item[12],
            total: item[14],
            latitude: item[15][2],
            longitude: item[15][1],
        }
        dataPoints.push(dataPoint);
    })

    measureNames = [...new Set(dataPoints.map(item => item.measureName))];
    years = [...new Set(dataPoints.map(item => item.year))];
   
    dataPoints.map(item => {
        var comment =
            '<p>' + item.clinic + '</p>' +
            item.measureName + '<br/>' +
            '<b>' +
            parseFloat(item.numerator / item.denominator * 100.0).toFixed(2) + "%" +
            '</b>' +
            ' - ' + item.numerator + ' of ' + item.denominator;

        var geojsonFeature = {
            "type": "Feature",
            "properties": {
                "name": item.clinic,
                "measureName": item.measureName,
                "popupContent": comment
            },
            "geometry": {
                "type": "Point",
                "coordinates": [parseFloat(item.latitude), parseFloat(item.longitude)]
            }
        }
        if(item.latitude && item.longitude)
        {
            mapPoints.push(geojsonFeature);
        }
    });

    displayMapPoints('Lower Back Pain');

    $('#measureName').empty();
    $.each(measureNames, function(i, p) {
        $('#measureName').append($('<option></option>').val(p).html(p));
    });

});



$('#measureName').on('change', function() {
    displayMapPoints(this.value) 
  });