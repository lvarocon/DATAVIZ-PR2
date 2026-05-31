// DIAGRAMA DE SANKEY (AEROLINEAS -> FABRICANTES -> PASILLO)
let svgG3, gG3Links, gG3Nodes, defsG3, sankeyG3;
let currentSankeyYearTotal = 0;

// Paleta de colores para los nodos de Sankey
const SANKEY_COLORS = {
  "VUELING AIRLINES, S.A.": "#FF007F",
  "RYANAIR GROUP": "#FFB300",
  "GRUPO IBERIA": "#FF0000",
  "AIR EUROPA": "#FF6800",
  "EASYJET": "#A6BDD7",
  "LUFTHANSA GROUP": "#C10020",
  "AIR FRANCE-KLM GROUP": "#D9C4B1",
  "BINTER CANARIAS": "#817066",
  "TUI GROUP": "#004D20",
  "AIRBERLIN GROUP": "#F6A600",
  "SPANAIR": "#000000",
  "Otros": "#5A3D28",  
  "Airbus": "#E2F516",
  "Boeing": "#B32851",  
  "Doble pasillo": "#F4C800",
  "Pasillo único": "#7F180D",
  "Unico": "#94a3b8"
};

function getSankeyColor(name) {
  if (typeof globalAirlineList !== 'undefined' && globalAirlineList.includes(name)) {
    return globalAirlineColorScale(name);
  }
  return SANKEY_COLORS[name] || SANKEY_COLORS["Otros"] || "#8b5cf6";
}

function initGraph3() {
  svgG3 = d3.select("#sankey-svg");
  defsG3 = svgG3.append("defs");

  // Cabeceras de las columnas
  const headers = [
    { text: "Grupo Compañía", x: 40, anchor: "start" },
    { text: "Fabricante", x: W_SANKEY / 2, anchor: "middle" },
    { text: "Pasillo", x: W_SANKEY - 40, anchor: "end" }
  ];
  
  svgG3.selectAll(".level-header")
    .data(headers)
    .enter()
    .append("text")
    .attr("class", "level-header")
    .attr("x", d => d.x)
    .attr("y", 30)
    .attr("text-anchor", d => d.anchor)
    .text(d => d.text);

  gG3Links = svgG3.append("g").attr("class", "links-group");
  gG3Nodes = svgG3.append("g").attr("class", "nodes-group");

  // Layout de Sankey
  sankeyG3 = d3.sankey()
    .nodeWidth(24)
    .nodePadding(18)
    .extent([[40, 60], [W_SANKEY - 40, H_SANKEY - 20]])
    .nodeId(d => d.id)
    .nodeSort((a, b) => a.name.localeCompare(b.name)) // Orden alfabético para evitar cruces caóticos
    .iterations(0);
}

function updateSankey(year) {
  const yearData = datasetSankey.filter(d => d.Año === year);
  currentSankeyYearTotal = d3.sum(yearData, d => d.Pasajeros);

  // Rollup de flujos
  const groupToFab = d3.rollup(
    yearData,
    v => d3.sum(v, d => d.Pasajeros),
    d => d['Grupo Compañía'],
    d => d.Fabricante
  );

  const fabToPas = d3.rollup(
    yearData,
    v => d3.sum(v, d => d.Pasajeros),
    d => d.Fabricante,
    d => d.Pasillo
  );

  const rawLinks = [];
  const nodeMap = new Map();
  const cleanString = str => str.replace(/[^a-zA-Z0-9_-]/g, "_"); // Evitamos caracteres raros en los IDs del DOM

  // Enlaces de aerolinea a fabricante
  for (const [grupo, fabs] of groupToFab) {
    for (const [fab, val] of fabs) {
      if (val > 0) {
        const sourceId = `grupo_${cleanString(grupo)}`;
        const targetId = `fab_${cleanString(fab)}`;
        rawLinks.push({ source: sourceId, target: targetId, value: val, type: "grupo-fab" });
        nodeMap.set(sourceId, { id: sourceId, name: grupo, level: 0 });
        nodeMap.set(targetId, { id: targetId, name: fab, level: 1 });
      }
    }
  }

  // Enlaces de fabricante a pasillo
  for (const [fab, pasillos] of fabToPas) {
    for (const [pas, val] of pasillos) {
      if (val > 0) {
        const sourceId = `fab_${cleanString(fab)}`;
        const targetId = `pas_${cleanString(pas)}`;
        rawLinks.push({ source: sourceId, target: targetId, value: val, type: "fab-pas" });
        nodeMap.set(sourceId, { id: sourceId, name: fab, level: 1 });
        nodeMap.set(targetId, { id: targetId, name: pas, level: 2 });
      }
    }
  }

  const rawNodes = Array.from(nodeMap.values());

  if (rawNodes.length === 0 || rawLinks.length === 0) {
    return;
  }

  // Layout coordinates calculation
  const { nodes, links } = sankeyG3({
    nodes: rawNodes.map(d => Object.assign({}, d)),
    links: rawLinks.map(d => Object.assign({}, d))
  });

  // Dibujar enlaces
  const linkSelection = gG3Links.selectAll(".link-path")
    .data(links, d => `${d.source.id}->${d.target.id}`);

  linkSelection.exit().transition().duration(250).attr("stroke-width", 0).remove();

  const linkEnter = linkSelection.enter()
    .append("path")
    .attr("class", "link-path")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.4)
    .on("mouseover", function(event, d) { tooltipManager.showSankeyLink(event, d); })
    .on("mousemove", function(event) { tooltipManager.move(event); })
    .on("mouseout", function() { tooltipManager.hide(); });

  const allLinks = linkEnter.merge(linkSelection);
  
  allLinks.transition().duration(400)
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", "#cbd5e1")
    .attr("stroke-width", d => Math.max(1.2, d.width));

  // Dibujar nodos
  const nodeSelection = gG3Nodes.selectAll(".node")
    .data(nodes, d => d.id);

  nodeSelection.exit().transition().duration(250).attr("opacity", 0).remove();

  const nodeEnter = nodeSelection.enter()
    .append("g")
    .attr("class", "node")
    .attr("opacity", 1);

  nodeEnter.append("rect")
    .on("mouseover", function(event, d) { triggerSankeyNodeTooltip(event, d); })
    .on("mousemove", function(event) { tooltipManager.move(event); })
    .on("mouseout", function() { tooltipManager.hide(); });
    
  nodeEnter.append("text")
    .attr("dy", "0.35em")
    .attr("pointer-events", "none");

  const allNodes = nodeEnter.merge(nodeSelection);

  allNodes.transition().duration(400)
    .attr("transform", d => `translate(${d.x0}, ${d.y0})`);

  allNodes.select("rect")
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => getSankeyColor(d.name))
    .attr("stroke", d => d3.rgb(getSankeyColor(d.name)).darker(0.8));

  allNodes.select("text")
    .attr("x", d => d.level === 2 ? -8 : (d.x1 - d.x0) + 8)
    .attr("y", d => (d.y1 - d.y0) / 2)
    .attr("text-anchor", d => d.level === 2 ? "end" : "start")
    .text(d => d.name);

  // Destacar nodos y enlaces conectados on hover
  allNodes.select("rect")
    .on("mouseover.highlight", function(event, node) {
      allLinks.style("stroke-opacity", l => 
        (l.source.id === node.id || l.target.id === node.id) ? 0.8 : 0.05
      );
      
      allNodes.style("opacity", n => {
        if (n.id === node.id) return 1.0;
        const isConnected = links.some(l => 
          (l.source.id === node.id && l.target.id === n.id) ||
          (l.target.id === node.id && l.source.id === n.id)
        );
        return isConnected ? 1.0 : 0.25;
      });
    })
    .on("mouseout.highlight", function() {
      allLinks.style("stroke-opacity", 0.38);
      allNodes.style("opacity", 1.0);
    });
}

function triggerSankeyNodeTooltip(event, d) {
  let typeLabel = "Grupo Compañía";
  if (d.level === 1) typeLabel = "Fabricante";
  if (d.level === 2) typeLabel = "Config. Pasillo";
  tooltipManager.showSankeyNode(event, d, typeLabel, currentSankeyYearTotal);
}
