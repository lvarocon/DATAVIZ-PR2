// Dimensiones de los graficos
const W_MAP = 920, H_MAP = 560;
const W_WORLD = 920, H_WORLD = 500;
const W_SANKEY = 920, H_SANKEY = 580;

let currentYear = 2019;

// Formatear numeros de pasajeros
const formatPax = val => new Intl.NumberFormat('es-ES').format(val);

// Nombres cortos para los aeropuertos
const AIRPORT_SHORT_NAMES = {
  "ADOLFO SUÁREZ MADRID-BARAJAS": "Madrid",
  "BARCELONA-EL PRAT J.T.": "Barcelona",
  "PALMA DE MALLORCA": "Mallorca",
  "MÁLAGA-COSTA DEL SOL": "Málaga",
  "ALICANTE-ELCHE MIGUEL HDEZ.": "Alicante",
  "GRAN CANARIA": "G. Canaria",
  "TENERIFE SUR": "Tenerife S.",
  "TENERIFE NORTE-C. LA LAGUNA": "Tenerife N.",
  "VALENCIA": "Valencia",
  "BILBAO": "Bilbao",
  "SEVILLA": "Sevilla",
  "LANZAROTE CÉSAR MANRIQUE": "Lanzarote",
  "FUERTEVENTURA": "Fuerteventura",
  "IBIZA": "Ibiza",
  "SANTIAGO-ROSALÍA DE CASTRO": "Santiago",
  "ASTURIAS": "Asturias",
  "VIGO": "Vigo",
  "REUS": "Reus",
  "A CORUÑA": "A Coruña",
  "ZARAGOZA": "Zaragoza",
  "SEVE BALLESTEROS-SANTANDER": "Santander",
  "ALMERÍA": "Almería",
  "MENORCA": "Menorca",
  "FGL GRANADA-JAÉN": "Granada",
  "MELILLA": "Melilla",
  "SAN SEBASTIÁN": "S. Sebastián",
  "PAMPLONA": "Pamplona",
  "VALLADOLID": "Valladolid",
  "EL HIERRO": "El Hierro",
  "LA PALMA": "La Palma",
  "VITORIA": "Vitoria",
  "BADAJOZ": "Badajoz",
  "LA GOMERA": "La Gomera",
  "LEÓN": "León",
  "AEROPUERTO INTL. REGIÓN MURCIA": "Murcia",
  "MURCIA-SAN JAVIER": "M. San Javier"
};

function getAirportShortName(name) {
  return AIRPORT_SHORT_NAMES[name] || name;
}

// Diccionarios cargados desde JSON
let COUNTRY_TO_ISO = {};
let ISO_TO_NAME = {};

// GESTIÓN DE LOS TOOLTIPS
const tooltipManager = {
  el: d3.select("#tooltip"),
  
  // Tooltip para burbujas
  showBubble: function(event, airport, year, pax, ai, histData) {
    this.el.style("display", "block");
    this.el.html(`
      <div class="tt-title">${airport}</div>
      <div class="tt-row"><span class="tt-label">Año</span><span class="tt-value">${year}</span></div>
      <hr>
      <div class="tt-row"><span class="tt-label">Pasajeros totales</span><span class="tt-value">${formatPax(pax)} pax</span></div>
      <div class="tt-section">Evolución Histórica</div>
      <div id="tt-chart-container" style="width: 100%; height: 65px; margin-top: 4px;"></div>
      <hr>
      <div class="tt-row"><span class="tt-label">Aerolínea líder</span><span class="tt-value">${ai.airline}</span></div>
      <div class="tt-row"><span class="tt-label">Pax líder</span><span class="tt-value">${formatPax(ai.airlinePax)} pax</span></div>
    `);
    drawTTChart("#tt-chart-container", histData, year);
    this.move(event);
  },
  
  // Tooltip para paises (coropletico)
  showWorld: function(event, countryName, year, pax, histData, originsText) {
    this.el.style("display", "block");
    this.el.html(`
      <div class="tt-title">${countryName}</div>
      <div class="tt-row"><span class="tt-label">Año</span><span class="tt-value">${year}</span></div>
      <div class="tt-row"><span class="tt-label">Pasajeros</span><span class="tt-value">${pax > 0 ? formatPax(pax) + ' pax' : 'Sin conexión registrada'}</span></div>
      <hr>
      <div class="tt-section">Evolución Histórica</div>
      <div id="tt-chart-container" style="width: 100%; height: 65px; margin-top: 4px;"></div>
      <hr>
      <div class="tt-section">Conexión con Aeropuertos Nacionales</div>
      <div style="font-size: 0.72rem; color: var(--text-main); margin-top: 4px; line-height: 1.3;">
        ${originsText}
      </div>
    `);
    drawTTChart("#tt-chart-container", histData, year);
    this.move(event);
  },
  
  // Para shankey
  showSankeyNode: function(event, d, typeLabel, currentYearTotal) {
    const percentage = ((d.value / currentYearTotal) * 100).toFixed(2) + " %";
    this.el.style("display", "block");
    this.el.html(`
      <div class="tt-title">${d.name}</div>
      <div class="tt-row"><span class="tt-label">Categoría</span><span class="tt-value">${typeLabel}</span></div>
      <div class="tt-row"><span class="tt-label">Pasajeros</span><span class="tt-value">${formatPax(d.value)} pax</span></div>
      <hr>
      <div class="tt-row"><span class="tt-label">% Total Año</span><span class="tt-value">${percentage}</span></div>
    `);
    this.move(event);
  },
  
  // El que sale al apuntar a los caminos/lazos del Sankey
  showSankeyLink: function(event, d) {
    const sourceLabel = d.type === "fab-pas" ? "Fabricante" : "Compañía";
    const targetLabel = d.type === "fab-pas" ? "Pasillo" : "Fabricante";
    this.el.style("display", "block");
    this.el.html(`
      <div class="tt-title">Flujo de Pasajeros</div>
      <div class="tt-row"><span class="tt-label">${sourceLabel}</span><span class="tt-value">${d.source.name}</span></div>
      <div class="tt-row"><span class="tt-label">${targetLabel}</span><span class="tt-value">${d.target.name}</span></div>
      <hr>
      <div class="tt-row"><span class="tt-label">Pasajeros</span><span class="tt-value">${formatPax(d.value)} pax</span></div>
    `);
    this.move(event);
  },
  
  // Para que el tooltip siga al cursor y no se desborde de la pantalla
  move: function(event) {
    const x = event.clientX;
    const y = event.clientY;
    const offset = 15;
    const ttNode = this.el.node();
    const rect = ttNode.getBoundingClientRect();
    
    let left = x + offset;
    let top = y + offset;
    
    if (left + rect.width > window.innerWidth) {
      left = x - rect.width - offset;
    }
    if (top + rect.height > window.innerHeight) {
      top = y - rect.height - offset;
    }
    
    this.el.style("left", left + "px").style("top", top + "px");
  },
  
  hide: function() {
    this.el.style("display", "none");
  }
};

// Dibuja el grafico simple de linea
function drawTTChart(selector, histData, selectedYear) {
  const container = d3.select(selector);
  container.selectAll('*').remove();
  
  if (!histData.length) return;
  
  const w = 220;
  const h = 60;
  const margin = {top: 4, right: 8, bottom: 16, left: 8};
  
  const svg = container.append('svg').attr('width', w).attr('height', h);
  
  const xScale = d3.scaleLinear()
    .domain(d3.extent(histData, d => d[1]))
    .range([margin.left, w - margin.right]);
    
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(histData, d => d[2]) || 1000])
    .range([h - margin.bottom, margin.top]);
    
  const area = d3.area()
    .x(d => xScale(d[1]))
    .y0(h - margin.bottom)
    .y1(d => yScale(d[2]));
    
  const line = d3.line()
    .x(d => xScale(d[1]))
    .y(d => yScale(d[2]));
    
  svg.append('path')
    .datum(histData)
    .attr('fill', 'rgba(70, 130, 180, 0.15)')
    .attr('d', area);
    
  svg.append('path')
    .datum(histData)
    .attr('fill', 'none')
    .attr('stroke', '#4682b4')
    .attr('stroke-width', 1.8)
    .attr('d', line);
    
  const xAxis = d3.axisBottom(xScale)
    .ticks(5)
    .tickFormat(d3.format('d'))
    .tickSize(3)
    .tickPadding(3);
    
  svg.append('g')
    .attr('transform', `translate(0,${h - margin.bottom})`)
    .call(xAxis)
    .call(g => g.select('.domain').attr('stroke', '#94a3b8'))
    .call(g => g.selectAll('.tick line').attr('stroke', '#94a3b8'))
    .call(g => g.selectAll('.tick text').attr('fill', '#475569').style('font-size', '9px'));
    
  const currentData = histData.find(d => d[1] === selectedYear);
  if (currentData && currentData[2] > 0) {
    svg.append('circle')
      .attr('cx', xScale(currentData[1]))
      .attr('cy', yScale(currentData[2]))
      .attr('r', 3)
      .attr('fill', '#ffffff')
      .attr('stroke', '#4682b4')
      .attr('stroke-width', 1.5);
  }
}




// Variables globales
let worldGeoJson = null;       
let datasetAirports = null;    
let datasetAirlines = null;    
let datasetDestinations = null;
let datasetSankey = null;      

let globalAirlineList = [];
let globalAirlineColorScale = null;
let globalAirlineLeadersIndex = {}; 

// Escala para radios de las burbujas
const maxHistoricalPax = 70000000;
const radiusScale = d3.scaleSqrt().domain([0, maxHistoricalPax]).range([2, 35]); 

// Carga de datos
Promise.all([
  d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'),
  d3.json('data/country_iso_mapping.json'),
  d3.csv('data/g01-airports_passenger_evolution.csv'),
  d3.csv('data/g01-top_airlines_per_airport_evolution.csv'),
  d3.csv('data/g02-passengers_by_year_airport_destination.csv'),
  d3.csv('data/g03-passengers_by_year_group_company_manufacturer_and_aisle_top10.csv')
]).then(([world, mapping, airports, airlines, destinations, sankeyData]) => {
  
  COUNTRY_TO_ISO = mapping.COUNTRY_TO_ISO;
  ISO_TO_NAME = mapping.ISO_TO_NAME;
  
  worldGeoJson = topojson.feature(world, world.objects.countries);
  

  
  // Convertir strings a numeros
  airports.forEach(d => {
    d.Año = +d.Año;
    d.Pasajeros = +d.Pasajeros;
    d.latitude_deg = +d.latitude_deg;
    d.longitude_deg = +d.longitude_deg;
  });
  datasetAirports = airports;

  datasetAirlines = airlines.map(d => {
    return {
      'Aeropuerto Base': d['Aeropuerto Base'],
      Año: +d.Año,
      'Grupo Compañía': d['Grupo Compañía'],
      Pasajeros: +d.Pasajeros
    };
  });

  destinations.forEach(d => {
    d.Año = +d.Año;
    d.Pasajeros = +d.Pasajeros;
  });
  datasetDestinations = destinations;

  sankeyData.forEach(d => {
    d.Año = +d.Año;
    d.Pasajeros = +d.Pasajeros;
  });
  datasetSankey = sankeyData;

  // Indexar aerolineas lideres por base y año
  const uniqueAirlines = new Set();
  datasetAirlines.forEach(d => {
    globalAirlineLeadersIndex[`${d['Aeropuerto Base']}|${d.Año}`] = {
      airline: d['Grupo Compañía'],
      airlinePax: d.Pasajeros
    };
    uniqueAirlines.add(d['Grupo Compañía']);
  });
  globalAirlineList = Array.from(uniqueAirlines).sort();
  
  // Paleta de colores Kelly
  const customMapColors = [
    "#2B5C8F", "#FFB300", "#803E75", "#FF6800", "#A6BDD7",
    "#C10020", "#D9C4B1", "#817066", "#00A76F", "#F6A600",
    "#5A3D28", "#E2F516", "#B32851", "#F4C800", "#7F180D"
  ];
  const baseScale = d3.scaleOrdinal().domain(globalAirlineList).range(customMapColors);
  globalAirlineColorScale = function(airline) {
    const overrides = {
      "SPANAIR": "#000000",
      "VUELING AIRLINES, S.A.": "#FF007F",
      "TUI GROUP": "#004D20",
      "GRUPO IBERIA": "#FF0000"
    };
    return overrides[airline] || baseScale(airline);
  };

  // Quitar overlay de carga
  d3.select("#loading-overlay")
    .transition().duration(400)
    .style("opacity", 0)
    .remove();

  initGraph1();
  initGraph2();
  initGraph3();

  // Inicializar en 2019
  updateAll(2019);

});


// Actualizar todos los graficos
function updateAll(year) {
  currentYear = year;
  
  updateGraph1(year);
  updateWorldMap(year);
  updateSankey(year);
}

const slider = document.getElementById("year-slider");
const yearDisplay = document.getElementById("year-display");

// Listener del slider
slider.addEventListener("input", function() {
  const selectedYear = +this.value;
  yearDisplay.textContent = selectedYear;
  updateAll(selectedYear);
});
