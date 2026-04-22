(function () {
  "use strict";

  const EARTH_RADIUS_KM = 6371;

  function toRadians(deg) {
    return (deg * Math.PI) / 180;
  }

  function toNumber(value) {
    return Number(value);
  }

  function isFiniteNumber(value) {
    return Number.isFinite(toNumber(value));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeName(value) {
    return String(value == null ? "" : value).trim().toLowerCase().replace(/\s+/g, "");
  }

  function haversineDistance(playerPosition, actualPosition) {
    const lat1 = toNumber(playerPosition && playerPosition.lat);
    const lon1 = toNumber(playerPosition && playerPosition.lon);
    const lat2 = toNumber(actualPosition && actualPosition.lat);
    const lon2 = toNumber(actualPosition && actualPosition.lon);

    if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) {
      return NaN;
    }

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  function geoToScreen(lat, lon, projection, transform) {
    const t = transform || d3.zoomIdentity;
    const projected = projection([lon, lat]);
    if (!projected) {
      return { x: NaN, y: NaN };
    }
    const [x, y] = t.apply(projected);
    return { x, y };
  }

  function screenToGeo(x, y, projection, transform) {
    const t = transform || d3.zoomIdentity;
    const [px, py] = t.invert([x, y]);
    const inverted = projection.invert([px, py]);
    if (!inverted) {
      return null;
    }
    const [lon, lat] = inverted;
    return { lat, lon };
  }

  function getFeatureName(feature) {
    if (!feature || !feature.properties) {
      return "";
    }

    const props = feature.properties;
    return (
      props.name ||
      props.NAME ||
      props.NAME_ZH ||
      props.admin ||
      props.sovereignt ||
      props.cn_name ||
      ""
    );
  }

  function shuffleArray(array) {
    const shuffled = Array.isArray(array) ? [...array] : [];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function sampleSize(array, count) {
    if (!Array.isArray(array)) {
      return [];
    }
    const size = clamp(toNumber(count) || 0, 0, array.length);
    return shuffleArray(array).slice(0, size);
  }

  function findFeatureByPoint(lon, lat, features) {
    if (!Array.isArray(features)) {
      return null;
    }
    for (let i = 0; i < features.length; i += 1) {
      const feature = features[i];
      try {
        if (d3.geoContains(feature, [lon, lat])) {
          return feature;
        }
      } catch (err) {
        // ignore invalid geometry
      }
    }
    return null;
  }

  function getPointerPosition(event, svgNode) {
    const [x, y] = d3.pointer(event, svgNode);
    return { x, y };
  }

  function formatDistance(distanceKm) {
    if (!Number.isFinite(distanceKm)) {
      return "-";
    }
    if (distanceKm >= 100) {
      return distanceKm.toFixed(0) + " km";
    }
    if (distanceKm >= 10) {
      return distanceKm.toFixed(1) + " km";
    }
    return distanceKm.toFixed(2) + " km";
  }

  function debounce(fn, delay) {
    let timer = null;
    const wait = Number.isFinite(delay) ? delay : 160;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function createProjection(type) {
    const normalized = String(type || "mercator").toLowerCase();
    if (
      normalized === "equirectangular" ||
      normalized === "eqc" ||
      normalized === "platecarree"
    ) {
      return d3.geoEquirectangular();
    }
    if (
      normalized === "naturalearth1" ||
      normalized === "natural-earth" ||
      normalized === "natural-earth-1"
    ) {
      return d3.geoNaturalEarth1();
    }
    if (normalized === "equalearth" || normalized === "equal-earth") {
      return d3.geoEqualEarth();
    }
    return d3.geoMercator();
  }

  function createBoundsFeature(bounds) {
    if (!Array.isArray(bounds) || bounds.length < 2) {
      return null;
    }
    const sw = bounds[0] || [];
    const ne = bounds[1] || [];
    const minLon = Number(sw[0]);
    const minLat = Number(sw[1]);
    const maxLon = Number(ne[0]);
    const maxLat = Number(ne[1]);

    if (![minLon, minLat, maxLon, maxLat].every(Number.isFinite)) {
      return null;
    }

    // Use MultiPoint instead of Polygon to avoid winding-direction ambiguity
    // in spherical geometry when fitting projected bounds.
    return {
      type: "Feature",
      geometry: {
        type: "MultiPoint",
        coordinates: [
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
        ],
      },
      properties: {},
    };
  }

  function renderMap(geojsonData, svgContainer, options) {
    const opts = options || {};
    const container =
      typeof svgContainer === "string"
        ? document.querySelector(svgContainer)
        : svgContainer;

    if (!container) {
      throw new Error("renderMap: container not found");
    }
    if (!geojsonData || !Array.isArray(geojsonData.features)) {
      throw new Error("renderMap: invalid geojson");
    }

    const width = opts.width || container.clientWidth || 960;
    const height = opts.height || container.clientHeight || 600;
    const padding = Number.isFinite(opts.padding) ? opts.padding : 24;
    const zoomable = opts.zoomable !== false;
    const scaleExtent = opts.scaleExtent || [1, 8];
    const projectionType = opts.projection || "mercator";
    const basemapFeature = opts.basemapFeature || geojsonData;
    const basemapClass = opts.basemapClass || "";
    const outlineClass = opts.outlineClass || "";
    const outlineFeature = opts.outlineFeature || geojsonData;
    const featureClass = opts.featureClass || "";
    const fitFeature = createBoundsFeature(opts.fitBounds) || geojsonData;

    const host = d3.select(container);
    host.selectAll("*").remove();

    const svg = host
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("aria-label", opts.ariaLabel || "map")
      .style("touch-action", "none");

    const root = svg.append("g").attr("class", "map-root");
    const baseLayer = root.append("g").attr("class", "base-layer");
    const featureLayer = root.append("g").attr("class", "feature-layer");
    const lineLayer = root.append("g").attr("class", "line-layer");
    const markerLayer = root.append("g").attr("class", "marker-layer");

    const projection = createProjection(projectionType).fitExtent(
      [
        [padding, padding],
        [width - padding, height - padding],
      ],
      fitFeature
    );

    const path = d3.geoPath().projection(projection);

    baseLayer
      .append("path")
      .datum(basemapFeature)
      .attr("class", ["map-basemap", basemapClass].filter(Boolean).join(" "))
      .attr("d", path);

    baseLayer
      .append("path")
      .datum(outlineFeature)
      .attr("class", ["map-outline", outlineClass].filter(Boolean).join(" "))
      .attr("d", path);

    const features = featureLayer
      .selectAll("path")
      .data(geojsonData.features)
      .join("path")
      .attr("class", ["map-feature", featureClass].filter(Boolean).join(" "))
      .attr("data-name", (d) => getFeatureName(d))
      .attr("d", path);

    let currentTransform = d3.zoomIdentity;
    let zoomBehavior = null;

    if (zoomable) {
      zoomBehavior = d3
        .zoom()
        .scaleExtent(scaleExtent)
        .on("zoom", (event) => {
          currentTransform = event.transform;
          root.attr("transform", currentTransform);
          if (typeof opts.onZoom === "function") {
            opts.onZoom(currentTransform);
          }
        });

      svg.call(zoomBehavior);
      if (opts.disableDoubleClickZoom) {
        svg.on("dblclick.zoom", null);
      }
    }

    function clearOverlays() {
      lineLayer.selectAll("*").remove();
      markerLayer.selectAll("*").remove();
    }

    function drawMarker(marker) {
      const m = marker || {};
      const lat = toNumber(m.lat);
      const lon = toNumber(m.lon);
      if (!isFiniteNumber(lat) || !isFiniteNumber(lon)) {
        return null;
      }

      const projected = projection([lon, lat]);
      if (!projected) {
        return null;
      }

      const r = isFiniteNumber(m.radius) ? Number(m.radius) : 5;
      const klass = m.className || "marker";

      return markerLayer
        .append("circle")
        .attr("class", klass)
        .attr("cx", projected[0])
        .attr("cy", projected[1])
        .attr("r", r);
    }

    function drawLine(from, to, className) {
      const a = from || {};
      const b = to || {};
      if (
        !isFiniteNumber(a.lat) ||
        !isFiniteNumber(a.lon) ||
        !isFiniteNumber(b.lat) ||
        !isFiniteNumber(b.lon)
      ) {
        return null;
      }

      const lineGeo = {
        type: "LineString",
        coordinates: [
          [Number(a.lon), Number(a.lat)],
          [Number(b.lon), Number(b.lat)],
        ],
      };
      const d = path(lineGeo);
      if (!d) {
        return null;
      }

      return lineLayer.append("path").attr("class", className || "distance-line").attr("d", d);
    }

    function resetView() {
      if (zoomable && zoomBehavior) {
        svg.transition().duration(220).call(zoomBehavior.transform, d3.zoomIdentity);
      }
    }

    function zoomToScale(scale) {
      if (!zoomable || !zoomBehavior) {
        return;
      }
      const target = clamp(Number(scale) || 1, scaleExtent[0], scaleExtent[1]);
      svg.call(zoomBehavior.scaleTo, target);
    }

    function panBy(dx, dy) {
      if (!zoomable || !zoomBehavior) {
        return;
      }
      const tx = Number(dx) || 0;
      const ty = Number(dy) || 0;
      const t = currentTransform || d3.zoomIdentity;
      const next = d3.zoomIdentity.translate(t.x + tx, t.y + ty).scale(t.k);
      svg.call(zoomBehavior.transform, next);
    }

    return {
      svg,
      root,
      features,
      projection,
      path,
      clearOverlays,
      drawMarker,
      drawLine,
      resetView,
      zoomToScale,
      panBy,
      getTransform() {
        return currentTransform;
      },
    };
  }

  window.MapGameUtils = {
    haversineDistance,
    geoToScreen,
    screenToGeo,
    renderMap,
    findFeatureByPoint,
    getFeatureName,
    getPointerPosition,
    shuffleArray,
    sampleSize,
    normalizeName,
    formatDistance,
    debounce,
    clamp,
  };
})();
