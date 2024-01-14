document.addEventListener("DOMContentLoaded", function () {
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
  const imageUrlPrefix =
    "https://images.colorama.app/unsigned/crop:0.85:0.85/resize:fill-down:150:150/plain/local:///kahn/";

  var gl = L.maplibreGL({
    style:
      "https://api.maptiler.com/maps/92f61733-11cf-4c28-9191-a7d071f85ea4/style.json?key=Uw1F9DMKKQO925wMgQel",
  }).addTo(map);

  const markers = L.markerClusterGroup({
    iconCreateFunction: createClusterCustomIcon,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom: false,
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
            markers.addLayer(marker);
          }
        },
      });
      map.addLayer(markers);
    });

  function createMarker(feature, latlng) {
    const imageFile = feature.properties.image_file;
    const photoCount = feature.properties.count;
    const imageUrl = imageUrlPrefix + imageFile;

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
    });

    return marker;
  }

  function createClusterCustomIcon(cluster) {
    const children = cluster.getAllChildMarkers();
    const firstChild = children.length ? children[0] : null;
    const firstChildImageFile = firstChild.options.image_file;
    const imageUrl = imageUrlPrefix + firstChildImageFile;
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

  "mousedown".split(" ").forEach(function(e){
    document.getElementById("drawer").addEventListener(e, drawerTouched);
  });

  function drawerTouched() {
    var drawer = document.getElementById("drawer");
    drawer.classList.toggle("expanded"); // Toggle the .expanded class
  }
});
