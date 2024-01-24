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
    maplibreMap.setLayoutProperty('places_country', 'visibility', 'none');
    maplibreMap.setLayoutProperty('places_region', 'visibility', 'none');
    maplibreMap.setLayoutProperty('pois_important', 'visibility', 'none');

    $(".loading-overlay").toggleClass("hidden");
  });

  const galleryElement = $("#gallery")[0];

  const gallery = lightGallery(galleryElement, {
    plugins: [lgZoom, lgThumbnail],
    dynamic: true,
    dynamicEl: [{src: "/favicon-32x32.png", thumb: "", subHtml: ""}], // Needs to contain an object on init, otherwise media overlaps
    loop: false,
    animateThumb: true,
    toggleThumb: false,
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
    .setPrefix(false)
    .addTo(map);
  attribution.addAttribution("🅮 <a href=\"https://github.com/protomaps/basemaps\">Protomaps</a> © <a href=\"https://openstreetmap.org\">OpenStreetMap</a>");

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
    disableClusteringAtZoom: 16,
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

  // Event listener for the shuffle button
  $('#shuffle').on('click', function() {
    shuffleMarker();
  });

  function calculateFlyToDuration(currentCenter, targetLatLng) {
    // Constants for tuning the calculation
    const minDuration = 2.5; // Minimum duration in seconds
    const maxDuration = 5; // Maximum duration in seconds
    const distanceFactor = 0.0005; // Adjust this to change duration scaling with distance
  
    // Calculate the geographical distance between the two points (in meters)
    const distance = currentCenter.distanceTo(targetLatLng);
  
    // Calculate duration based on distance
    let duration = distance * distanceFactor;

    if (map.getZoom() < 3) {
      duration = duration / 2;
    }
  
    // Apply minimum and maximum constraints
    duration = Math.max(duration, minDuration);
    duration = Math.min(duration, maxDuration);
  
    return duration;
  }
  
  function shuffleRandomMarker() {
    const markers = clusters.getLayers();
    if (markers.length > 0) {
      const randomIndex = Math.floor(Math.random() * markers.length);
      const selectedMarker = markers[randomIndex];
      flyToMarker(selectedMarker);
    } else {
      console.log("No markers available to shuffle.");
    }
  }

  function shuffleDistantMarker() {
    const markers = clusters.getLayers();
    if (markers.length > 0) {
      const currentCenter = map.getCenter();
      let weightedMarkers = markers.map(marker => {
        const distance = currentCenter.distanceTo(marker.getLatLng());
        return { marker, weight: distance };
      });
  
      // Normalize weights
      const totalWeight = weightedMarkers.reduce((total, wm) => total + wm.weight, 0);
      weightedMarkers = weightedMarkers.map(wm => ({ marker: wm.marker, weight: wm.weight / totalWeight }));
  
      // Select a marker based on the weights
      let sum = 0;
      const r = Math.random();
      for (const wm of weightedMarkers) {
        sum += wm.weight;
        if (r <= sum) {
          flyToMarker(wm.marker);
          break;
        }
      }
    } else {
      console.log("No markers available to shuffle.");
    }
  }
  
  function shuffleMarker() {
    shuffleDistantMarker();
  }

  function flyToMarker(selectedMarker) {
    const currentZoom = map.getZoom();
    const targetZoom = 16; // Example target zoom level
    const currentCenter = map.getCenter();
    const targetLatLng = selectedMarker.getLatLng();
  
    const duration = calculateFlyToDuration(currentCenter, targetLatLng);
  
    map.flyTo(targetLatLng, targetZoom, {
      animate: true,
      easeLinearity: 1,
      duration: duration
    });
  
    /* Disable automatic click on marker
    map.once('zoomend', function() {
      setTimeout(function() {
        selectedMarker.fire('click');
      }, 250);
    });
    */
  }
  
});
