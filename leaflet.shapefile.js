function getColor(d) {
  return d > 70
    ? "#800026"
    : d > 60
    ? "#BD0026"
    : d > 50
    ? "#E31A1C"
    : d > 40
    ? "#FC4E2A"
    : d > 30
    ? "#FD8D3C"
    : d > 20
    ? "#FEB24C"
    : d > 10
    ? "#FED976"
    : "#FFEDA0";
}

function loadData() {
  $.ajax({
    dataType: "json",
    url: "HealthSmallStatisticalAreaMeasures.json",
    success: function(data) {
      data.data.map(item => {
        var dataPoint = {
          areaCode: parseFloat(item[8]).toFixed(1),
          areaName: item[9],
          measureName: item[10],
          rate: item[11],
          denominator: item[12],
          numerator: item[13]
        };
        dataPoints.push(dataPoint);
      });

      measureNames = [...new Set(dataPoints.map(item => item.measureName))];
      measureName = measureNames[0];

      $("#measureName").empty();
      $.each(measureNames, function(i, p) {
        $("#measureName").append(
          $("<option></option>")
            .val(p)
            .html(p)
        );
      });

      applyMeasure();
    }
  });
}

function applyMeasure() {
  minValue =
    Math.min(
      ...dataPoints.filter(a => a.measureName == measureName).map(a => a.rate)
    ) * 100.0;
  maxValue =
    Math.max(
      ...dataPoints.filter(a => a.measureName == measureName).map(a => a.rate)
    ) * 100.0;

  areas.eachLayer(function(area) {
    var selectedMeasures = dataPoints.filter(
      a =>
        a.areaCode ==
          parseFloat(area.feature.properties.area_code).toFixed(1) &&
        a.measureName == measureName
    );
    if (selectedMeasures.length > 0) {
      var measure = selectedMeasures[0];
      area.bindPopup(
        "<p>" +
          measure.areaName +
          "</p>" +
          parseFloat(measure.rate * 100).toFixed(0) +
          "%" +
          " - " +
          measure.numerator +
          " of " +
          measure.denominator
      );
      var h =
        ((measure.rate * 100.0 - minValue) * 100.0) / (maxValue - minValue);
      var s = 1;

      area.setStyle({ fillColor: hsv2rgb(h, s, 1) });
    } else {
      area.bindPopup("no data");
      area.styles = "#fff";
    }
  });
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
    "Measure Points": measureLayer
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
var baseLayers;
var overlays;
var measureName;

setupMap();

var areas = new L.geoJson();
areas.addTo(map);

$.ajax({
  dataType: "json",
  url: "HealthSmallStatisticalAreas.json",
  success: function(data) {
    $(data.features).each(function(key, data) {
      areas.addData(data);
    });
    loadData();
  }
});

/* controls */
$("#measureName").on("change", function() {
  measureName = this.value;
  applyMeasure();
});
