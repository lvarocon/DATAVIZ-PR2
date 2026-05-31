# -*- coding: utf-8 -*-
'''
De los archivos raw de AENA genero la suma de pasajeros agrupados por 
año, aeropuerto y aerolínea. Genero un archivo para cada año y uno considerando
todos los años.

Para este último limpio los aeropuertos que no llegarn a 1M de personas
durante los últimos dos años
'''


import os
import re
import pandas as pd


RAW_DIR = r'c:\Users\alvar\Desktop\ppc_raw\bronce'
OUT_DIR = r'c:\Users\alvar\Desktop\ppc_raw\silver'

# listado de aeropuertos con menos de 1M de pasajeros en los últimos 20 años
AIRPORTS_TO_DROP = [
    'HUESCA-PIRINEOS',
    'MADRID-CUATRO VIENTOS',
    'SABADELL',
    'SON BONET',
    'ALBACETE',
    'CÓRDOBA',
    'MADRID-TORREJÓN',
    'BURGOS',
    'ALGECIRAS /HELIPUERTO',
    'LOGROÑO',
    'SALAMANCA',
    'CEUTA /HELIPUERTO',
]

os.makedirs(OUT_DIR, exist_ok=True)

all_frames = []

csv_files = os.listdir(RAW_DIR)

csv_files = [filename for filename in csv_files if "ppc" in filename]

for fname in sorted(csv_files):
    
    file_dir = os.path.join(RAW_DIR, fname)
    
    # cargo csv
    df = pd.read_csv(
        file_dir,
        encoding='utf-16',
        sep=',',
        thousands='.'
    )

    # elimino filas con nan
    df.dropna(inplace=True)

    # añado columna de año
    year = int(fname[3:7])
    df['Año'] = year

    # agrupo por aeropuerto, compañía y año
    df_grouped = (
        df.groupby(['Año', 'Aeropuerto Base', 'Grupo Compañía'])['Pasajeros']
        .sum()
        .reset_index()
    )

    # guadro archivo individual
    out_name = fname.replace('.csv', '_grouped.csv')
    out_path = os.path.join(OUT_DIR, out_name)
    df_grouped.to_csv(out_path, index=False, encoding='utf-8-sig')
    
    all_frames.append(df_grouped)


# exporto un fichero conteniendo todos los años y limpiando aeropuertos
# con menos de 1M de pasajeros en los últimos 20 años
df_all = pd.concat(all_frames, ignore_index=True)
combined_path = os.path.join(OUT_DIR, 'grouped_all-clean.csv')
df_all.dropna(inplace=True)

# elimino aeropuertos, helipuertos y bases militares operadas por AENA
df_filtrado = df_all[~df_all['Aeropuerto Base'].isin(AIRPORTS_TO_DROP)]
df_filtrado.to_csv(combined_path, index=False, encoding='utf-8-sig')
    
# exporto un fichero con el listado de aeropuertos únicos
airports = (
    df["Aeropuerto Base"]
    .drop_duplicates()
    .sort_values()
    .reset_index(drop=True)
    .rename("Aeropuerto Base")
)
combined_path = os.path.join(OUT_DIR, 'unique_airports.csv')
airports.to_csv(combined_path, index=False, encoding='utf-8-sig')

