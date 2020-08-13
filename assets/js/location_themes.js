var location_theme_config = {
  loc_theme: "../../data/location_themes.geojson",
  title: "DemographyDemography",
  layerName: "location",
  hoverProperty: "population_theme_index",
  sortProperty: "income_theme_index",
  sortOrder: "desc"
};

var location_themes_properties = [{
    value: "population_theme_index",
    label: "Population",
    table: {
      visible: true,
      sortable: true
    },
    filter: {
      type: "string"
    },
    info: true
  },
  {
    value: "income_theme_index",
    label: "Income",
    table: {
      visible: true,
      sortable: true
    },
    filter: {
      type: "string"
    },
    info: true
  },
  {
    value: "employment_theme_index",
    label: "Employment",
    table: {
      visible: true,
      sortable: true
    },
    filter: {
      type: "string"
    },
    info: true
  }
];

function drawCharts() {
  // Gender
  $(function () {
    var result = alasql("SELECT population_theme_value AS label, count(*) AS total FROM ? where name =='GENDERPCX' GROUP BY population_theme_value", [p_themes]);
    var columns = $.map(result, function (res) {
      return [
        [res.label, res.total]
      ];
    });
    var chart = c3.generate({
      bindto: "#gender-chart",
      data: {
        type: "pie",
        columns: columns
      }
    });
  });

  // https://c3js.org/samples/axes_x_tick_rotate.html
  $(function () {
    var totalNumber = alasql("SELECT population_theme_value AS total FROM ? where name =='ANCSPCY'", [p_themes]);
    var langGps = alasql("SELECT population_theme_description AS gp FROM ? where name =='ANCSPCY' GROUP BY population_theme_description ", [p_themes]);
    var gps = $.map(langGps, function (lgps) {
      return [lgps.gp];
    });

    var spokenNumber = $.map(totalNumber, function (res) {
      return [res.total];
    });
    var chart = c3.generate({
      bindto: "#employment-chart",
      data: {
        columns: [
          ['Total Number'].concat(spokenNumber)
        ]
      },
      axis: {
        x: {
          type: 'category',
          categories: gps,
          tick: {
            rotate: 75,
            multiline: false
          },
          height: 130
        }
      }
    });
  });

  // https://c3js.org/samples/data_stringx.html
  $(function () {
    var totalNumber = alasql("SELECT income_theme_value AS total FROM ? where name =='INCOMEKCX'", [income_themes]);
    var langGps = alasql("SELECT income_theme_description AS gp FROM ? where name =='INCOMEKCX' GROUP BY income_theme_description ", [income_themes]);
    var gps = $.map(langGps, function (lgps) {
      return [lgps.gp];
    });

    var spokenNumber = $.map(totalNumber, function (res) {
      return [res.total];
    });
    var chart = c3.generate({
      bindto: "#income-chart",
      data: {
        x: 'x',
        columns: [
          ['x'].concat(gps),
          ['Total Number'].concat(spokenNumber)
        ],
        groups: [
          ['download', 'loading']
        ],
        type: 'bar'
      },
      axis: {
        x: {
          type: 'category',
          categories: gps,
          tick: {
            rotate: 75,
            multiline: false
          },
          height: 130
        }
      }
    });
  });

  // https://c3js.org/samples/data_stringx.html
  $(function () {
    var totalNumber = alasql("SELECT expenditure_theme_value AS total FROM ?", [expenditure_themes]);
    var langGps = alasql("SELECT expenditure_theme_description AS gp FROM ?", [expenditure_themes]);
    var gps = $.map(langGps, function (lgps) {
      return [lgps.gp];
    });

    var expenditure = $.map(totalNumber, function (res) {
      return [res.total];
    });
    var chart = c3.generate({
      bindto: "#expenditure-chart",
      data: {
        columns: [
          ['Description'].concat(gps),
          ['Expenditure_In_Doller'].concat(expenditure)
        ],
        names: {
          data1: 'Description',
          data2: 'Expenditure_In_Doller'
      }
      }
    });
  });
}

$(function () {
  $(".title").html(location_theme_config.title);
  $("#layer-name").html(location_theme_config.layerName);
});

function buildTheme() {
  filters = [];
  table = [{
    field: "action",
    title: "<i class='fa fa-gear'></i>&nbsp;Action",
    align: "center",
    valign: "middle",
    width: "75px",
    cardVisible: false,
    switchable: false,
    formatter: function (value, row, index) {
      return [
        '<a class="zoom" href="javascript:void(0)" title="Zoom" style="margin-right: 10px;">',
        '<i class="fa fa-search-plus"></i>',
        '</a>',
        '<a class="identify" href="javascript:void(0)" title="Identify">',
        '<i class="fa fa-info-circle"></i>',
        '</a>'
      ].join("");
    },
    events: {
      "click .zoom": function (e, value, row, index) {
        map.fitBounds(featureLayer.getLayer(row.leaflet_stamp).getBounds());
        highlightLayer.clearLayers();
        highlightLayer.addData(featureLayer.getLayer(row.leaflet_stamp).toGeoJSON());
      },
      "click .identify": function (e, value, row, index) {
        identifyFeature(row.leaflet_stamp);
        highlightLayer.clearLayers();
        highlightLayer.addData(featureLayer.getLayer(row.leaflet_stamp).toGeoJSON());
      }
    }
  }];



  $.each(location_themes_properties, function (index, value) {
    // Filter location_theme_config
    if (value.filter) {
      var id;
      if (value.filter.type == "integer") {
        id = "cast(properties->" + value.value + " as int)";
      } else if (value.filter.type == "double") {
        id = "cast(properties->" + value.value + " as double)";
      } else {
        id = "properties->" + value.value;
      }
      filters.push({
        id: id,
        label: value.label
      });
      $.each(value.filter, function (key, val) {
        if (filters[index]) {
          // If values array is empty, fetch all distinct values
          if (key == "values" && val.length === 0) {
            alasql("SELECT DISTINCT(properties->" + value.value + ") AS field FROM ? ORDER BY field ASC", [loc_theme.features], function (results) {
              distinctValues = [];
              $.each(results, function (index, value) {
                distinctValues.push(value.field);
              });
            });
            filters[index].values = distinctValues;
          } else {
            filters[index][key] = val;
          }
        }
      });
    }
    // Table location_theme_config
    if (value.table) {
      table.push({
        field: value.value,
        title: value.label
      });
      $.each(value.table, function (key, val) {
        if (table[index + 1]) {
          table[index + 1][key] = val;
        }
      });
    }
  });

  buildThemeFilters();
  buildThemeTable();
}
// Basemap Layers
var mapquestOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var mapquestHYB = L.layerGroup([L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}), L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})]);

var highlightLayer = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 5,
      color: "#FFF",
      weight: 2,
      opacity: 1,
      fillColor: "#00FFFF",
      fillOpacity: 1,
      clickable: false
    });
  },
  style: function (feature) {
    return {
      color: "#00FFFF",
      weight: 2,
      opacity: 1,
      fillColor: "#00FFFF",
      fillOpacity: 0.5,
      clickable: false
    };
  }
});

var featureLayer = L.geoJson(null, {
  filter: function (feature, layer) {
    return feature.geometry.coordinates[0] !== 0 && feature.geometry.coordinates[1] !== 0;
  },
  pointToLayer: function (feature, latlng) {
    if (feature.properties && feature.properties["marker-color"]) {
      markerColor = feature.properties["marker-color"];
    } else {
      markerColor = "#FF0000";
    }
    return L.circleMarker(latlng, {
      radius: 4,
      weight: 2,
      fillColor: markerColor,
      color: markerColor,
      opacity: 1,
      fillOpacity: 1
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      layer.on({
        click: function (e) {
          identifyFeature(L.stamp(layer));
          highlightLayer.clearLayers();
          highlightLayer.addData(featureLayer.getLayer(L.stamp(layer)).toGeoJSON());
        },
        mouseover: function (e) {
          if (location_theme_config.hoverProperty) {
            $(".info-control").html(feature.properties[location_theme_config.hoverProperty]);
            $(".info-control").show();
          }
        },
        mouseout: function (e) {
          $(".info-control").hide();
        }
      });
    }
  }
});

// Fetch the THEME GeoJSON file
$.getJSON(location_theme_config.loc_theme, function (data) {
  loc_theme = data;
  features = $.map(loc_theme.features, function (feature) {
    return feature.properties;
  });

  p_themes = $.map(loc_theme.features, function (feature) {
    var ppl = $.map(feature.population_theme, function (p) {
      return p;
    });
    var merged = [].concat.apply([], ppl);
    return merged;
  });

  income_themes = $.map(loc_theme.features, function (feature) {
    var ppl = $.map(feature.income_theme, function (p) {
      return p;
    });
    var merged = [].concat.apply([], ppl);
    return merged;
  });

  expenditure_themes = $.map(loc_theme.features, function (feature) {
    var ppl = $.map(feature.expenditure_theme, function (p) {
      return p;
    });
    var merged = [].concat.apply([], ppl);
    return merged;
  });

  featureLayer.addData(data);
  buildTheme();
  $("#loading-mask").hide();
});

var map = L.map("map", {
  layers: [mapquestOSM, featureLayer, highlightLayer]
}).fitWorld();

// ESRI geocoder
var searchControl = L.esri.Geocoding.Controls.geosearch({
  useMapBounds: 17
}).addTo(map);

// Info control
var info = L.control({
  position: "bottomleft"
});


L.Routing.control({
  waypoints: [
    L.latLng(35.0118, -81.9571),
    L.latLng(35.00425, -81.57256),
    L.latLng(34.913156, -82.106588),
    L.latLng(34.831319, -82.295658),
    L.latLng(34.695366, -82.503984),
    L.latLng(34.695366, -82.503984)
  ],

  geocoder: L.Control.Geocoder.nominatim(),
  routeWhileDragging: true,
  reverseWaypoints: true,
  showAlternatives: true,
  altLineOptions: {
    styles: [{
        color: 'black',
        opacity: 0.15,
        weight: 9
      },
      {
        color: 'white',
        opacity: 0.8,
        weight: 6
      },
      {
        color: 'blue',
        opacity: 0.5,
        weight: 2
      }
    ]
  },
  lineOptions: {
    styles: [{
      className: 'animate'
    }]
  }
}).addTo(map);



// Custom info hover control
info.onAdd = function (map) {
  this._div = L.DomUtil.create("div", "info-control");
  this.update();
  return this._div;
};
info.update = function (props) {
  this._div.innerHTML = "";
};
info.addTo(map);
$(".info-control").hide();

// Larger screens get expanded layer control
if (document.body.clientWidth <= 767) {
  isCollapsed = true;
} else {
  isCollapsed = false;
}
var baseLayers = {
  "Street Map": mapquestOSM,
  "Aerial Imagery": mapquestHYB
};
var overlayLayers = {
  "<span id='layer-tree-name'>Location Lane</span>": featureLayer
};

var layerControl = L.control.layers(baseLayers, overlayLayers, {
  collapsed: isCollapsed
}).addTo(map);

// Filter table to only show features in current map bounds
map.on("moveend", function (e) {
  syncThemeTable();
});

map.on("click", function (e) {
  highlightLayer.clearLayers();
});

// Table formatter to make links clickable
function urlFormatter(value, row, index) {
  if (typeof value == "string" && (value.indexOf("http") === 0 || value.indexOf("https") === 0)) {
    return "<a href='" + value + "' target='_blank'>" + value + "</a>";
  }
}

function buildThemeFilters() {
  $("#query-builder").queryBuilder({
    allow_empty: true,
    filters: filters
  });
}

function buildFilters() {
  $("#query-builder").queryBuilder({
    allow_empty: true,
    filters: filters
  });
}

function applyFilter() {
  var query = "SELECT * FROM ?";
  var sql = $("#query-builder").queryBuilder("getSQL", false, false).sql;
  if (sql.length > 0) {
    query += " WHERE " + sql;
  }
  alasql(query, [loc_theme.features], function (features) {
    featureLayer.clearLayers();
    featureLayer.addData(features);
    syncThemeTable();
  });
}

function buildThemeTable() {
  $("#location_themes_table").bootstrapTable({
    cache: false,
    height: $("#table-container").height(),
    undefinedText: "",
    striped: false,
    pagination: false,
    minimumCountColumns: 1,
    sortName: location_theme_config.sortProperty,
    sortOrder: location_theme_config.sortOrder,
    toolbar: "#toolbar",
    search: true,
    trimOnSearch: false,
    showColumns: true,
    showToggle: true,
    columns: table,
    onClickRow: function (row) {
      // do something!
    },
    onDblClickRow: function (row) {
      // do something!
    }
  });

  map.fitBounds(featureLayer.getBounds());

  $(window).resize(function () {
    $("#location_themes_table").bootstrapTable("resetView", {
      height: $("#table-container").height()
    });
  });
}

function syncThemeTable() {
  tableFeatures = [];
  featureLayer.eachLayer(function (layer) {
    layer.feature.properties.leaflet_stamp = L.stamp(layer);
    if (map.hasLayer(featureLayer)) {
      if (map.getBounds().contains(layer.getBounds())) {
        tableFeatures.push(layer.feature.properties);
      }
    }
  });
  $("#location_themes_table").bootstrapTable("load", JSON.parse(JSON.stringify(tableFeatures)));
  var featureCount = $("#location_themes_table").bootstrapTable("getData").length;
  if (featureCount == 1) {
    $("#feature-count").html($("#location_themes_table").bootstrapTable("getData").length + " visible feature");
  } else {
    $("#feature-count").html($("#location_themes_table").bootstrapTable("getData").length + " visible features");
  }
}

function identifyFeature(id) {
  var content = `<div role="tabpanel">
  <ul class="nav nav-tabs" role="tablist">
    <li role="presentation" class="active"><a href="#gender-chart" aria-controls="reports" role="tab" data-toggle="tab">Gender Zone</a></li>
    <li role="presentation"><a href="#employment-chart" aria-controls="charts" role="tab" data-toggle="tab">Employment Zone</a></li>
    <li role="presentation"><a href="#income-chart" aria-controls="charts" role="tab" data-toggle="tab">Income Zone</a></li>
    <li role="presentation"><a href="#expenditure-chart" aria-controls="charts" role="tab" data-toggle="tab">Expenditure Zone</a></li>
  </ul>
  <div class="tab-content">
    <div role="tabpanel" class="tab-pane active" id="gender-chart"></div>
    <div role="tabpanel" class="tab-pane" id="employment-chart"></div>
    <div role="tabpanel" class="tab-pane" id="income-chart"></div>
    <div role="tabpanel" class="tab-pane" id="expenditure-chart"></div>
  </div>
</div>`;

  $("#feature-info").html(content);
  $("#featureModal").modal("show");
}

function switchView(view) {
  if (view == "split") {
    $("#view").html("Split View");
    location.hash = "#split";
    $("#table-container").show();
    $("#table-container").css("height", "55%");
    $("#map-container").show();
    $("#map-container").css("height", "45%");
    $(window).resize();
    if (map) {
      map.invalidateSize();
    }
  } else if (view == "map") {
    $("#view").html("Map View");
    location.hash = "#map";
    $("#map-container").show();
    $("#map-container").css("height", "100%");
    $("#table-container").hide();
    if (map) {
      map.invalidateSize();
    }
  } else if (view == "table") {
    $("#view").html("Table View");
    location.hash = "#table";
    $("#table-container").show();
    $("#table-container").css("height", "100%");
    $("#map-container").hide();
    $(window).resize();
  }
}

$("[name='view']").click(function () {
  $(".in,.open").removeClass("in open");
  if (this.id === "map-graph") {
    switchView("split");
    return false;
  } else if (this.id === "map-only") {
    switchView("map");
    return false;
  } else if (this.id === "graph-only") {
    switchView("table");
    return false;
  }
});

$("#about-btn").click(function () {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#filter-btn").click(function () {
  $("#filterModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#chart-btn").click(function () {
  $("#chartModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#view-sql-btn").click(function () {
  alert($("#query-builder").queryBuilder("getSQL", false, false).sql);
});

$("#apply-filter-btn").click(function () {
  applyFilter();
});

$("#reset-filter-btn").click(function () {
  $("#query-builder").queryBuilder("reset");
  applyFilter();
});

$("#extent-btn").click(function () {
  map.fitBounds(featureLayer.getBounds());
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#download-csv-btn").click(function () {
  $("#table").tableExport({
    type: "csv",
    ignoreColumn: [0],
    fileName: "data"
  });
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#download-excel-btn").click(function () {
  $("#table").tableExport({
    type: "excel",
    ignoreColumn: [0],
    fileName: "data"
  });
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#download-pdf-btn").click(function () {
  $("#table").tableExport({
    type: "pdf",
    ignoreColumn: [0],
    fileName: "data",
    jspdf: {
      format: "bestfit",
      margins: {
        left: 20,
        right: 10,
        top: 20,
        bottom: 20
      },
      autotable: {
        extendWidth: false,
        overflow: "linebreak"
      }
    }
  });
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#featureModal").on("shown.bs.modal", function (e) {
  drawCharts();
});