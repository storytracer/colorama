$(function () {
  const center = [25, 10];

  const map = L.map("map", {
    center: center,
    minZoom: 2,
    maxZoom: 20,
    zoom: 2,
    zoomControl: false,
    scrollWheelZoom: false,
    smoothWheelZoom: true,
    attributionControl: false,
  });

  function licenseLink(license) {
    switch(license) {
      case 'CC-BY-4.0':
        return 'https://creativecommons.org/licenses/by/4.0/'
      case 'CC0':
        return 'https://creativecommons.org/publicdomain/zero/1.0/'
    }
  }

  function formattedDateSpan(earlyDateString, lateDateString) {
    const earlyDate = new Date(earlyDateString).getTime();
    const lateDate = new Date(lateDateString).getTime();

    if (earlyDate == lateDate) {
      return earlyDateString
    } else {
      return earlyDateString + ' - ' + lateDateString
    }
  }

  var gl = L.maplibreGL({
    style: '/maps/dataviz_grey.json'
  }).addTo(map);

  var maplibreMap = gl.getMaplibreMap();
  maplibreMap.on('load', () => {
    maplibreMap.setLayoutProperty('boundaries', 'visibility', 'none');
    maplibreMap.setLayoutProperty('roads_highway', 'visibility', 'none');
  });

  const galleryElement = $("#gallery")[0];

  const gallery = lightGallery(galleryElement, {
    plugins: [lgZoom, lgThumbnail],
    dynamic: true,
    dynamicEl: [{src: "/favicon-32x32.png"}], // Needs to contain an object on init, otherwise media overlaps
    loop: false,
    animateThumb: true,
    allowMediaOverlap: false,
    mobileSettings: {
      controls: false,
      download: true,
      showMaximizeIcon: false,
      showCloseIcon: true,
    },
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
    maxClusterRadius: 100,
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
        iconSize: L.point(photoSize, photoSize), // Includes the height of the triangle
      }),
    }).on("click", function () {
      showPhotosForFeature(feature);
    });

    return marker;
  }

  function showPhotosForFeature(feature) {
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
              const license = feature.properties.license;
              const subHtml = `
                <p><strong>Caption: </strong>${feature.properties.caption}</p>
                <p><strong>Date: </strong>${formattedDateSpan(feature.properties.capture_date_earliest, feature.properties.capture_date_latest)} | <strong>Photographer: </strong>${feature.properties.operators[0]} | <strong>Source:&nbsp;</strong><a href="${feature.properties.doc_url}" target="_blank">Musée&nbsp;Albert&nbsp;Kahn</a> | <strong>License: </strong><a href="${licenseLink(license)}" target="_blank">${license}</a></p>
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
          
        gallery.refresh(photoElements.slice(0, 20));
        gallery.openGallery();
        if (photoElements.length > 20) {
          setTimeout(function() {
            gallery.refresh(photoElements);
          }, 1000);
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
      iconSize: L.point(photoSize, photoSize), // Includes the height of the triangle
    });
  }
});
