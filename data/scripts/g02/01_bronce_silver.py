# -*- coding: utf-8 -*-
'''
De los archivos raw de AENA genero la suma de pasajeros agrupados por 
año, aeropuerto y país de destino. Genero un archivo considerando
todos los años.

Además limpio los aeropuertos que no llegarn a 1M de personas
durante los últimos dos años
'''

import os
import re
import pandas as pd

RAW_DIR = r'G:\Mi unidad\Semestre 5\Visualización de datos\PR2\plot2\bronce'
OUT_DIR = r'G:\Mi unidad\Semestre 5\Visualización de datos\PR2\plot2\silver'

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

    # filtro por Tipo Tráfico == 'COMERCIAL'
    df = df[df['Tipo Tráfico'] == 'COMERCIAL']

    # limpio aeropuertos con menos de 1M de pasajeros en los últimos 20 años
    df = df[~df['Aeropuerto Base'].isin(AIRPORTS_TO_DROP)]

    # añado columna de año
    year = int(fname[3:7])
    df['Año'] = year

    # agrupo por aeropuerto, pais de destino y año
    df_grouped = (
        df.groupby(['Año', 'Aeropuerto Base', 'País'])['Pasajeros']
        .sum()
        .reset_index()
    )

    # guadro archivo individual
    out_name = fname.replace('.csv', '_grouped.csv')
    out_path = os.path.join(OUT_DIR, out_name)
    df_grouped.to_csv(out_path, index=False, encoding='utf-8-sig')
    
    all_frames.append(df_grouped)


# exporto un fichero conteniendo todos los años
df_all = pd.concat(all_frames, ignore_index=True)
combined_path = os.path.join(OUT_DIR, 'passengers_by_year_airport_destination.csv')

df_all.dropna(inplace=True)
df_all.to_csv(combined_path, index=False, encoding='utf-8-sig')