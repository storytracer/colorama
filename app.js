$(function () {
  const center = [49, 5];

  const map = L.map("map", {
    center: center,
    maxZoom: 16,
    zoom: 1,
    zoomControl: false,
    scrollWheelZoom: false,
    smoothWheelZoom: true,
    attributionControl: false,
  });

  var gl = L.maplibreGL({
    style:
      "https://api.maptiler.com/maps/92f61733-11cf-4c28-9191-a7d071f85ea4/style.json?key=Uw1F9DMKKQO925wMgQel",
  }).addTo(map);

  var attribution = L.control
    .attribution({
      position: "bottomright",
    })
    .addTo(map);
  attribution.addAttribution(
    '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
  );

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
    zoomToBoundsOnClick: false,
    spiderfyOnMaxZoom: false,
  });
  clusters.on('clusterclick', function (a) {
    a.layer.zoomToBounds();
  });

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
    // openDrawer();
    var geohash = feature.properties.geohash;
    var geojsonUrl =
      "https://features.colorama.app/collections/public.photos/items.json?geohash=" +
      geohash;
    const grid = $("#photo-grid");
    grid.html("");
    fetch(geojsonUrl)
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data, {
          onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties["image.filename"]) {
              const filename = feature.properties["image.filename"];
              const thumbUrl = thumbUrlPrefix + filename;
              const fullImageUrl = "https://images.colorama.app/unsigned/plain/local:///kahn/" + filename;
              const imageHTML = `
                <a class="photo-link" href="${fullImageUrl}" target="_blank" data-sub-html=".caption">
                  <img src="${thumbUrl}" width="128" height="128" alt="" />
                  <div class="caption">
                    <p><strong>Caption: </strong>${feature.properties.caption}</p>
                    <p><strong>Date: </strong>${feature.properties.capture_date_earliest} – ${feature.properties.capture_date_latest}</p>
                  </div>
                </a>`;
              grid.append(imageHTML);
            }
          },
        });

        const gallery = lightGallery(document.getElementById('photo-grid'), {
          plugins: [lgZoom, lgThumbnail],
          selector: '.photo-link',
          subHtmlSelectorRelative: true,
          showAfterLoad: false,
          animateThumb: true,
          preload: 0,
          mobileSettings: {
            controls: false,
            download: false,
            showMaximizeIcon: false,
            showCloseIcon: true,
          }
        });

        gallery.openGallery();
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

  setTimeout(function () {
    map.flyTo(center, 3);
  }, 750);

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

  lightGallery(document.getElementById('photo-grid'), {
    thumbnail: true,
    selector: '.photo-link'
  });
});
