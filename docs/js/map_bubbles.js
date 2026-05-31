// MAPA 1: AEROPUERTOS ESPAÑA Y AEROLINEAS LIDER
let svgG1, gG1MainMapContainer, gG1LandMain, gG1BubMain;
let projG1Main, pathG1Main;

function initGraph1() {
  svgG1 = d3.select("#map-svg");

  // Proyección centrada en España
  projG1Main = d3.geoMercator()
    .center([-3.5, 37.0])
    .scale(1300)
    .translate([W_MAP * 0.5, H_MAP * 0.5]);

  pathG1Main = d3.geoPath().projection(projG1Main);

  // Evitar desbordes en zoom
  svgG1.append('defs').append('clipPath').attr('id', 'clip-g1-main')
    .append('rect').attr('x', 0).attr('y', 0).attr('width', W_MAP).attr('height', H_MAP);

  gG1MainMapContainer = svgG1.append('g')
    .attr('id', 'g1-main-map-container')
    .attr('clip-path', 'url(#clip-g1-main)');

  gG1LandMain = gG1MainMapContainer.append('g');

  // Mapa base
  gG1LandMain.selectAll('path')
    .data(worldGeoJson.features)
    .enter().append('path')
    .attr('class', 'land')
    .attr('d', pathG1Main);

  gG1BubMain = gG1MainMapContainer.append('g');

  // Zoom y arrastre
  const zoomMain = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [W_MAP, H_MAP]])
    .on('start', () => tooltipManager.hide())
    .on('zoom', (event) => {
      gG1MainMapContainer.attr('transform', event.transform);
      gG1BubMain.selectAll('circle').attr('r', d => radiusScale(d.Pasajeros) / event.transform.k);
    });
  svgG1.call(zoomMain);

  renderGraph1Legend();
}

function renderGraph1Legend() {
  const legEl = d3.select('#legend-items');
  legEl.selectAll('*').remove();
  globalAirlineList.forEach(al => {
    const row = legEl.append('div').attr('class', 'leg-item');
    row.append('div').attr('class', 'leg-circle')
      .style('width', '10px').style('height', '10px')
      .style('background', globalAirlineColorScale(al)).style('opacity', '0.8');
    row.append('span').text(al).attr('class', 'leg-label');
  });

  // Escala de tamaños
  const legSizeVals = [500000, 5000000, 20000000, 60000000];
  const legSizeEl = d3.select('#legend-size-items');
  legSizeEl.selectAll('*').remove();
  legSizeVals.forEach(v => {
    const r = radiusScale(v);
    const d = Math.max(r * 2, 6);
    const row = legSizeEl.append('div').attr('class', 'leg-item');
    row.append('div').attr('class', 'leg-circle')
      .style('width', d + 'px').style('height', d + 'px')
      .style('background', 'rgba(0,0,0,0.08)');
    row.append('span').text(v >= 1e6 ? (v/1e6).toFixed(0) + ' M' : (v/1e3).toFixed(0) + ' K');
  });
}

function updateGraph1(year) {
  const yearData = datasetAirports.filter(d => d.Año === year);
  const kMain = d3.zoomTransform(svgG1.node()).k || 1;

  // Dibujar burbujas ordenadas por tamaño
  const sorted = [...yearData].sort((a,b) => b.Pasajeros - a.Pasajeros);
  const circles = gG1BubMain.selectAll('circle').data(sorted, d => d['Aeropuerto Base']);

  circles.enter().append('circle')
    .attr('class', 'bubble')
    .attr('cx', d => projG1Main([d.longitude_deg, d.latitude_deg])[0])
    .attr('cy', d => projG1Main([d.longitude_deg, d.latitude_deg])[1])
    .attr('r', 0)
    .attr('fill', d => {
      const ai = globalAirlineLeadersIndex[`${d['Aeropuerto Base']}|${year}`];
      return ai ? globalAirlineColorScale(ai.airline) : '#888';
    })
    .attr('opacity', 0.75)
    .on('mouseover', function(ev, d) { triggerBubbleTooltip(ev, d, year); })
    .on('mousemove', function(ev) { tooltipManager.move(ev); })
    .on('mouseout', function() { tooltipManager.hide(); })
    .transition().duration(350)
    .attr('r', d => radiusScale(d.Pasajeros) / kMain);

  circles
    .on('mouseover', function(ev, d) { triggerBubbleTooltip(ev, d, year); })
    .on('mousemove', function(ev) { tooltipManager.move(ev); })
    .on('mouseout', function() { tooltipManager.hide(); })
    .transition().duration(350)
    .attr('cx', d => projG1Main([d.longitude_deg, d.latitude_deg])[0])
    .attr('cy', d => projG1Main([d.longitude_deg, d.latitude_deg])[1])
    .attr('r', d => radiusScale(d.Pasajeros) / kMain)
    .attr('fill', d => {
      const ai = globalAirlineLeadersIndex[`${d['Aeropuerto Base']}|${year}`];
      return ai ? globalAirlineColorScale(ai.airline) : '#888';
    });

  circles.exit().transition().duration(200).attr('r', 0).remove();
}

function triggerBubbleTooltip(event, d, year) {
  const airport = d['Aeropuerto Base'];
  const pax = d.Pasajeros;
  const ai = globalAirlineLeadersIndex[`${airport}|${year}`] || { airline: 'Sin datos', airlinePax: 0 };
  
  const histData = datasetAirports
    .filter(x => x['Aeropuerto Base'] === airport)
    .sort((a,b) => a.Año - b.Año)
    .map(x => [null, x.Año, x.Pasajeros]);

  tooltipManager.showBubble(event, airport, year, pax, ai, histData);
}
