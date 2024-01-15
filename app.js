$(function () {
  const center = [25, 10];

  const map = L.map("map", {
    center: center,
    minZoom: 2,
    maxZoom: 18,
    zoom: 2,
    zoomControl: false,
    scrollWheelZoom: false,
    smoothWheelZoom: true,
    attributionControl: false,
  });

  var gl = L.maplibreGL({
    style: '/maps/dataviz_grey.json'
  }).addTo(map);

  var maplibreMap = gl.getMaplibreMap();
  maplibreMap.on('load', () => {
    maplibreMap.setLayoutProperty('boundaries', 'visibility', 'none');
    maplibreMap.setLayoutProperty('roads_highway', 'visibility', 'none');
  });

  var attribution = L.control
    .attribution({
      position: "bottomright",
    })
    .addTo(map);
  attribution.addAttribution("<a href=\"https://github.com/protomaps/basemaps\">Protomaps</a> © <a href=\"https://openstreetmap.org\">OpenStreetMap</a>");

  L.control
    .zoom({
      position: "topright",
    })
    .addTo(map);

  const photoSize = 60;
  const thumbUrlPrefix =
    "https://images.colorama.app/unsigned/crop:0.85:0.85/resize:fill-down:128:128/plain/local:///kahn/";

  const clusters = L.markerClusterGroup({
    iconCreateFunction: createClusterCustomIcon,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom: false,
    disableClusteringAtZoom: 18,
  });
  // clusters.on('clusterclick', function (a) {
  //   a.layer.zoomToBounds();
  // });

  // Replace this with the path to your GeoJSON file
  const geojsonUrl =
    "https://features.colorama.app/collections/public.geohashes/items.json";

  fetch(geojsonUrl)
    .then((response) => response.json())
    .then((data) => {
      L.geoJSON(data, {
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.image_file) {
            let marker = createMarker(feature, layer.getLatLng());
            marker.options.photo_count = feature.properties.count;
            marker.options.image_file = feature.properties.image_file;
            clusters.addLayer(marker);
          }
        },
      });
      map.addLayer(clusters);
    });

  function createMarker(feature, latlng) {
    const imageFile = feature.properties.image_file;
    const photoCount = feature.properties.count;
    const imageUrl = thumbUrlPrefix + imageFile;

    const html = `
                <div class="photo-marker">
                    <img src="${imageUrl}" width="${photoSize}" height="${photoSize}" alt="" />
                    <div class="marker-count-badge">${photoCount}</div>
                </div>
            `;

    const marker = L.marker(latlng, {
      icon: L.divIcon({
        html: html,
        className: "", // Important: this removes default Leaflet icon styling
        iconSize: L.point(60, 60), // Includes the height of the triangle
      }),
    }).on("click", function () {
      showPhotosForFeature(feature);
    });

    return marker;
  }

  function showPhotosForFeature(feature) {
    console.log(feature);
    map.panTo([feature.properties.latitude, feature.properties.longitude]);
    var geohash = feature.properties.geohash;
    var geojsonUrl =
      "https://features.colorama.app/collections/public.photos/items.json?geohash=" +
      geohash;

    let photoElements = [];
    fetch(geojsonUrl)
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data, {
          onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties["image.filename"]) {
              const filename = feature.properties["image.filename"];
              const thumbUrl = thumbUrlPrefix + filename;
              const fullImageUrl =
                "https://images.colorama.app/unsigned/plain/local:///kahn/" +
                filename;
              const subHtml = `
                <p><strong>Caption: </strong>${feature.properties.caption}</p>
                <p><strong>Date: </strong>between ${feature.properties.capture_date_earliest} and ${feature.properties.capture_date_latest} | <strong>Photographer: </strong>${feature.properties.operators[0]} | <strong>Source:&nbsp;</strong><a href="${feature.properties.doc_url}">Musée&nbsp;Albert&nbsp;Kahn</a> | <strong>License: </strong>${feature.properties.license}</p>
              `;
              const dataElement = {
                src: fullImageUrl,
                thumb: thumbUrl,
                subHtml: subHtml,
              };

              photoElements.push(dataElement);
            }
          },
        });

        const gallery = lightGallery(document.getElementById("gallery"), {
          plugins: [lgZoom, lgThumbnail],
          dynamic: true,
          dynamicEl: photoElements.slice(0, 15),
          loop: false,
          showAfterLoad: false,
          animateThumb: true,
          mobileSettings: {
            controls: false,
            download: true,
            showMaximizeIcon: false,
            showCloseIcon: true,
          },
        });

        gallery.openGallery();
        if (photoElements.length > 15) {
          setTimeout(function() {
            gallery.refresh(photoElements);
          }, 500);
        }
      });
  }

  function createClusterCustomIcon(cluster) {
    const children = cluster.getAllChildMarkers();
    const firstChild = children.length ? children[0] : null;
    const firstChildImageFile = firstChild.options.image_file;
    const imageUrl = thumbUrlPrefix + firstChildImageFile;
    const photoCount = children.reduce((total, child) => {
      return total + child.options.photo_count;
    }, 0);

    const html = `
                <div class="cluster-marker">
                    <img src="${imageUrl}" width="${photoSize}" height="${photoSize}" alt="" />
                    <div class="marker-count-badge">${photoCount}</div>
                </div>
            `;

    return L.divIcon({
      html: html,
      className: "", // Important: this removes default Leaflet icon styling
      iconSize: L.point(60, 60), // Includes the height of the triangle
    });
  }

  function openDrawer() {
    if (!$("#drawer").hasClass("expanded")) {
      toggleDrawer();
    }
  }

  function panMapForDrawer() {
    var drawerElement = $("#drawer");
    var mapElement = $("#map");
    if (drawerElement.hasClass("expanded")) {
      map.panBy([0, 200], { easeLinearity: 1 });
    } else {
      map.panBy([0, -200]);
    }
  }

  function toggleDrawer() {
    var drawerElement = $("#drawer");
    var mapElement = $("#map");

    drawerElement.toggleClass("expanded"); // Toggle the .expanded class
    mapElement.toggleClass("collapsed"); // Toggle the .expanded class
    panMapForDrawer();
  }
});
