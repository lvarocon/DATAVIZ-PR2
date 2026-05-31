// MAPA 2: COROPLÉTICO MUNDIAL
let svgG2, gG2LandMain, projG2, pathG2;

// Colores según rango de pasajeros anuales desde España
const thresholdValuesG2 = [10000, 100000, 1000000, 5000000, 20000000];
const colorRangeG2 = ["#eff6ff", "#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#172554"];
const colorScaleG2 = d3.scaleThreshold().domain(thresholdValuesG2).range(colorRangeG2);

const NO_DATA_COLOR_G2 = "#e2e8f0";
const SPAIN_COLOR_G2 = "#94a3b8";

function initGraph2() {
  svgG2 = d3.select("#world-svg");

  projG2 = d3.geoNaturalEarth1()
    .scale(165)
    .translate([W_WORLD / 2, H_WORLD / 2 + 10]);

  pathG2 = d3.geoPath().projection(projG2);

  svgG2.append('path')
    .datum({type: "Sphere"})
    .attr('class', 'sphere')
    .attr('d', pathG2);

  const graticule = d3.geoGraticule();
  svgG2.append('path')
    .datum(graticule)
    .attr('class', 'graticule')
    .attr('d', pathG2);

  gG2LandMain = svgG2.append('g');

  const zoomG2 = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [W_WORLD, H_WORLD]])
    .on('start', () => tooltipManager.hide())
    .on('zoom', (event) => {
      gG2LandMain.attr('transform', event.transform);
    });
  svgG2.call(zoomG2);

  // Dibujar paises iniciales
  gG2LandMain.selectAll('.country')
    .data(worldGeoJson.features)
    .enter().append('path')
    .attr('class', 'country')
    .attr('d', pathG2)
    .attr('fill', NO_DATA_COLOR_G2)
    .style('cursor', d => +d.id === 724 ? 'default' : 'pointer')
    .on('mouseover', function(event, d) {
      const iso = +d.id;
      if (iso === 724) return; // evitar origen España
      const name = ISO_TO_NAME[iso] || d.properties.name || "Destino desconocido";
      triggerWorldTooltip(event, iso, name, d);
    })
    .on('mousemove', function(event, d) {
      if (+d.id === 724) return;
      tooltipManager.move(event);
    })
    .on('mouseout', function(event, d) {
      if (+d.id === 724) return;
      tooltipManager.hide();
    });

  renderGraph2Legend();
}

function renderGraph2Legend() {
  const legendItems = [
    { label: "España (Origen)", color: SPAIN_COLOR_G2 },
    { label: "Sin vuelos/datos", color: NO_DATA_COLOR_G2 },
    { label: "< 10 K", color: "#eff6ff" },
    { label: "10 K – 100 K", color: "#dbeafe" },
    { label: "100 K – 1 M", color: "#93c5fd" },
    { label: "1 M – 5 M", color: "#3b82f6" },
    { label: "5 M – 20 M", color: "#1d4ed8" },
    { label: "> 20 M", color: "#172554" }
  ];

  const legWorldEl = d3.select('#legend-world-items');
  legWorldEl.selectAll('*').remove();
  legendItems.forEach(item => {
    const row = legWorldEl.append('div').attr('class', 'leg-item');
    row.append('div').attr('class', 'leg-color').style('background', item.color);
    row.append('span').attr('class', 'leg-label').text(item.label);
  });
}

// Calcular total pasajeros para un pais e iso dado
function getCountryPaxForYear(iso, year) {
  const countryCsvName = Object.keys(COUNTRY_TO_ISO).find(key => COUNTRY_TO_ISO[key] === iso);
  if (!countryCsvName) return 0;
  
  const matchedRows = datasetDestinations.filter(d => d.Año === year && d.País.toUpperCase() === countryCsvName);
  return d3.sum(matchedRows, d => d.Pasajeros);
}

function updateWorldMap(year) {
  gG2LandMain.selectAll('.country')
    .transition().duration(250)
    .attr('fill', d => {
      const iso = +d.id;
      if (iso === 724) return SPAIN_COLOR_G2;
      const pax = getCountryPaxForYear(iso, year);
      return pax === 0 ? NO_DATA_COLOR_G2 : colorScaleG2(pax);
    });
}

function triggerWorldTooltip(event, iso, countryName, d) {
  const countryCsvName = Object.keys(COUNTRY_TO_ISO).find(key => COUNTRY_TO_ISO[key] === iso);
  const pax = getCountryPaxForYear(iso, currentYear);

  // Historial del pais para el sparkline
  const histData = [];
  const years = d3.range(2006, 2026);
  years.forEach(y => {
    if (countryCsvName) {
      const matched = datasetDestinations.filter(x => x.Año === y && x.País.toUpperCase() === countryCsvName);
      histData.push([null, y, d3.sum(matched, x => x.Pasajeros)]);
    } else {
      histData.push([null, y, 0]);
    }
  });

  // Calcular reparto por aeropuerto de origen
  let originsText = "Sin vuelos origen registrados";
  if (countryCsvName && pax > 0) {
    const currentRows = datasetDestinations.filter(x => x.Año === currentYear && x.País.toUpperCase() === countryCsvName && x.Pasajeros > 0);
    const sorted = [...currentRows].sort((a, b) => b.Pasajeros - a.Pasajeros);
    
    const items = [];
    sorted.slice(0, 3).forEach(r => {
      const pctVal = Math.round((r.Pasajeros / pax) * 100);
      if (pctVal > 0) {
        items.push({ label: getAirportShortName(r['Aeropuerto Base']), pct: pctVal });
      }
    });
    
    if (sorted.length > 3) {
      const otherPax = d3.sum(sorted.slice(3), r => r.Pasajeros);
      const otherPctVal = Math.round((otherPax / pax) * 100);
      if (otherPax > 0 && otherPctVal > 0) {
        items.push({ label: "Otros", pct: otherPctVal });
      }
    }
    
    items.sort((a, b) => b.pct - a.pct);
    
    originsText = items.map(item => `${item.label} (${item.pct}%)`).join(", ");
  }

  tooltipManager.showWorld(event, countryName, currentYear, pax, histData, originsText);
}
