function onEachFeature(feature, layer) {
  // does this feature have a property named popupContent?
  if (feature.properties && feature.properties.popupContent) {
    layer.bindPopup(feature.properties.popupContent);
  }
}

function displayMapPoints() {
  measureLayer.clearLayers();
  measureCircleLayer.clearLayers();
  // add data points
  var layerMapPoints = mapPoints.filter(
    a =>
      a.properties.measureName == measureName &&
      a.properties.percent >= minMeasurePercent &&
      a.properties.percent <= maxMeasurePercent
  );
  measureLayer = L.geoJSON(layerMapPoints, {
    onEachFeature: onEachFeature
  }).addTo(measureLayer);

  // add circles
  var filteredDataPoints = dataPoints.filter(
    a =>
      a.measureName == measureName &&
      (a.numerator / a.denominator) * 100.0 >= minMeasurePercent &&
      (a.numerator / a.denominator) * 100.0 <= maxMeasurePercent &&
      a.latitude
  );

  var maxdenominator = Math.max(...dataPoints.map(a => a.denominator));
  var maxRadius = 4000;
  var minRadius = 1000;

  filteredDataPoints.forEach(point => {
    var comment =
      "<p>" +
      point.clinic +
      "</p>" +
      point.measureName +
      " " +
      point.year +
      "<br/>" +
      "<b>" +
      parseFloat((point.numerator / point.denominator) * 100.0).toFixed(2) +
      "%" +
      "</b>" +
      " - " +
      point.numerator +
      " of " +
      point.denominator;

    var percent = (point.numerator / point.denominator) * 100.0;
    if (percent > 100) {
      percent = 100;
    }
    var h = Math.floor((percent * 120) / 100);
    var s = 1;
    var v = 1;

    var circle = L.circle([point.longitude, point.latitude], {
      color: "black",
      fillColor: hsv2rgb(h, s, 1),
      fillOpacity: 0.5,
      radius: minRadius + (point.denominator / maxdenominator) * maxRadius
    }).addTo(measureCircleLayer);

    circle.bindPopup(comment);
  });
}

function setupMap() {
  var mbAttr =
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    mbUrl =
      "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWRhbWdtaWxsZXIiLCJhIjoiY2p3a3QxenhtMHR3YzN5cDZpM2gyM3owbSJ9.PsI19CeIGyA0hmJvbCSYkA";

  var grayscale = L.tileLayer(mbUrl, {
      id: "mapbox.light",
      attribution: mbAttr
    }),
    streets = L.tileLayer(mbUrl, { id: "mapbox.streets", attribution: mbAttr });
  measureLayer = L.layerGroup();
  measureCircleLayer = L.layerGroup();

  map = L.map("map", {
    center: [39.376542, -111.552493],
    zoom: 6,
    layers: [grayscale, measureLayer]
  });

  baseLayers = {
    Grayscale: grayscale,
    Streets: streets
  };

  overlays = {
    "Measure Points": measureLayer,
    "Measure Size": measureCircleLayer
  };

  L.control.layers(baseLayers, overlays).addTo(map);
}

var hsv2rgb = function(h, s, v) {
  // adapted from http://schinckel.net/2012/01/10/hsv-to-rgb-in-javascript/
  var rgb,
    i,
    data = [];
  if (s === 0) {
    rgb = [v, v, v];
  } else {
    h = h / 60;
    i = Math.floor(h);
    data = [v * (1 - s), v * (1 - s * (h - i)), v * (1 - s * (1 - (h - i)))];
    switch (i) {
      case 0:
        rgb = [v, data[2], data[0]];
        break;
      case 1:
        rgb = [data[1], v, data[0]];
        break;
      case 2:
        rgb = [data[0], v, data[2]];
        break;
      case 3:
        rgb = [data[0], data[1], v];
        break;
      case 4:
        rgb = [data[2], data[0], v];
        break;
      default:
        rgb = [v, data[0], data[1]];
        break;
    }
  }
  return (
    "#" +
    rgb
      .map(function(x) {
        return ("0" + Math.round(x * 255).toString(16)).slice(-2);
      })
      .join("")
  );
};

var dataPoints = [];
var mapPoints = [];
var measureNames = [];
var map;
var measureLayer;
var measureCircleLayer;
var baseLayers;
var overlays;
var minMeasurePercent = 0;
var maxMeasurePercent = 100;
var measureName;

// read measure data
$.getJSON("measure.json", function(data) {
  data.data.map(item => {
    var dataPoint = {
      year: item[8],
      clinic: item[9],
      measureName: item[11],
      numerator: item[13],
      rate: item[12],
      denominator: item[14],
      latitude: item[15][2],
      longitude: item[15][1]
    };
    dataPoints.push(dataPoint);
  });

  measureNames = [...new Set(dataPoints.map(item => item.measureName))];

  dataPoints.map(item => {
    var comment =
      "<p>" +
      item.clinic +
      "</p>" +
      item.measureName +
      " " +
      item.year +
      "<br/>" +
      "<b>" +
      parseFloat((item.numerator / item.denominator) * 100.0).toFixed(2) +
      "%" +
      "</b>" +
      " - " +
      item.numerator +
      " of " +
      item.denominator;

    var geojsonFeature = {
      type: "Feature",
      properties: {
        name: item.clinic,
        measureName: item.measureName,
        popupContent: comment,
        percent: parseFloat((item.numerator / item.denominator) * 100),
        year: item.year
      },
      geometry: {
        type: "Point",
        coordinates: [parseFloat(item.latitude), parseFloat(item.longitude)]
      }
    };
    if (item.latitude && item.longitude) {
      mapPoints.push(geojsonFeature);
    }
  });

  setupMap();
  measureName = measureNames[0];
  displayMapPoints();

  $("#measureName").empty();
  $.each(measureNames, function(i, p) {
    $("#measureName").append(
      $("<option></option>")
        .val(p)
        .html(p)
    );
  });
});

/* Controls */

$("#measureName").on("change", function() {
  measureName = this.value;
  displayMapPoints();
});

var minSlider = document.getElementById("minPercent");
minSlider.oninput = function() {
  minMeasurePercent = this.value;
  displayMapPoints();
};

var maxSlider = document.getElementById("maxPercent");
maxSlider.oninput = function() {
  maxMeasurePercent = this.value;
  displayMapPoints();
};
