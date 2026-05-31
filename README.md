# AENA: Dos décadas, tres gráficos

Este proyecto muestra una visualización de datos con **D3.js** y **HTML/CSS vanilla** que permite explorar la evolución del tráfico aéreo gestionado por AENA entre los años 2006 y 2025. 

El proyecto consta de una parte de procesamiento y limpieza de datos mediante el uso de scripts en **Python (Pandas)** la web donde se efectua la visualización.

---


## Estructura del Proyecto

```text
PR2/
├── data/                             # Contiene el pipeline de datos (ETL)
│   ├── raw/                          # Archivos CSV originales descargados de AENA (2006-2025)
│   ├── auxdata/                      # Archivos auxiliares (coordenadas de aeropuertos, mapeos de flota, etc.)
│   └── scripts/                      # Scripts de procesamiento de datos en Python
│       ├── g01/                      # ETL para el primer gráfico (Mapa de burbujas)
│       ├── g02/                      # ETL para el segundo gráfico (Mapa coroplético)
│       └── g03/                      # ETL para el tercer gráfico (Sankey)
│
├── docs/                             # Archivos de la visualización web interactiva (servidos en GitHub Pages)
│   ├── css/                          # Archivos de estilo CSS
│   ├── data/                         # Copia de los datos limpios en formato JSON y CSV para consumo de D3.js
│   ├── js/                           # Scripts JavaScript que implementan D3.js
│   │   ├── main.js                   # Carga de datos común, tooltips globales y relativo al slider
│   │   ├── map_bubbles.js            # Lógica y renderizado del gráfico de burbujas (g01)
│   │   ├── map_choropleth.js         # Lógica y renderizado del mapa coroplético mundial (g02)
│   │   └── sankey.js                 # Lógica y renderizado del diagrama de Sankey (g03)
│   └── index.html                    # Página de entrada principal y estructura web
│
└── README.md                         # Este archivo con la descripción del proyecto
```

---

## Cómo Ejecutar en Local
**Requiere tener python instalado**
1. Abre la terminal o consola del sistema.
2. Navega hasta la carpeta `docs` del proyecto:
3. Lanza el servidor web nativo de Python:
   ```bash
   python -m http.server 8000
   ```
4. Abre tu navegador e ingresa a: http://localhost:8000
