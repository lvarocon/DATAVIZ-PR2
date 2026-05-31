# -*- coding: utf-8 -*-
'''
De los archivos raw de AENA genero la suma de pasajeros agrupados por 
año, Grupo Compañía y Tipo Avión. Genero un archivo considerando
todos los años.

'''

import os
import re
import pandas as pd

RAW_DIR = r'G:\Mi unidad\Semestre 5\Visualización de datos\PR2\plot3\bronce'
OUT_DIR = r'G:\Mi unidad\Semestre 5\Visualización de datos\PR2\plot3\silver'


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

    # agrupo por aeropuerto, pais de destino y año
    df_grouped = (
        df.groupby(['Año', 'Grupo Compañía', 'Tipo Avión'])['Pasajeros']
        .sum()
        .reset_index()
    )
    
    all_frames.append(df_grouped)


# exporto un fichero conteniendo todos los años
df_all = pd.concat(all_frames, ignore_index=True)
df_all.dropna(inplace=True)

combined_path = os.path.join(OUT_DIR, 'passengers_by_year_group_company_and_type_aircraft.csv')
df_all.to_csv(combined_path, index=False, encoding='utf-8-sig')

# creo dataframe con fabricante
df_all_manufacturer = df_all.copy()
df_all_manufacturer['Fabricante'] = 'OTROS'
df_all_manufacturer.loc[df_all_manufacturer['Tipo Avión'].str.contains('airbus', case=False, na=False), 'Fabricante'] = 'AIRBUS'
df_all_manufacturer.loc[df_all_manufacturer['Tipo Avión'].str.contains('boeing|boing', case=False, na=False), 'Fabricante'] = 'BOEING'

df_all_manufacturer = df_all_manufacturer.groupby(['Año', 'Grupo Compañía', 'Fabricante'])['Pasajeros'].sum().reset_index()

combined_path = os.path.join(OUT_DIR, 'passengers_by_year_group_company_and_manufacturer.csv')
df_all_manufacturer.to_csv(combined_path, index=False, encoding='utf-8-sig')