# -*- coding: utf-8 -*-
"""
Este script realiza el mapeo de aviones (Airbus/Boeing) a su respectiva Familia y Pasillo
utilizando los archivos de mapeo únicos generados previamente (airbus_unique.csv y boeing_unique.csv).
Para los demás aviones, se asigna Familia='Otros' y Pasillo='Unico'.
"""

import os
import re
import pandas as pd

# Directorios de los ficheros
DIR = r'G:\Mi unidad\Semestre 5\Visualización de datos\PR2\plot3\silver'
DIR2 = r'G:\Mi unidad\Semestre 5\Visualización de datos\PR2\plot3\gold'

def normalize_spaces(text):
    """Reemplaza múltiples espacios en blanco consecutivos por uno solo y elimina espacios al inicio/final."""
    if pd.isna(text):
        return ""
    return re.sub(r'\s+', ' ', str(text)).strip()

# Cargamos el archivo de pasajeros principal
passenger_file = os.path.join(DIR, 'passengers_by_year_group_company_and_type_aircraft.csv')
df = pd.read_csv(passenger_file)

# Cargamos los archivos unique de Airbus y Boeing (usando separador ;)
airbus_file = os.path.join(DIR, 'airbus_unique.csv')
boeing_file = os.path.join(DIR, 'boeing_unique.csv')

df_airbus = pd.read_csv(airbus_file, sep=';')
df_boeing = pd.read_csv(boeing_file, sep=';')

# Limpiamos las columnas para quedarnos solo con las 3 columnas necesarias
df_airbus = df_airbus[['Tipo Avión', 'Familia', 'Pasillo']].dropna(subset=['Tipo Avión'])
df_boeing = df_boeing[['Tipo Avión', 'Familia', 'Pasillo']].dropna(subset=['Tipo Avión'])

# Combinamos ambos conjuntos de mapeos únicos
df_unique = pd.concat([df_airbus, df_boeing], ignore_index=True)

# Creamos un diccionario de mapeo para una búsqueda rápida
mapping = {}
for _, row in df_unique.iterrows():
    tipo = normalize_spaces(row['Tipo Avión'])
    fam = str(row['Familia']).strip()
    pasillo = str(row['Pasillo']).strip()
    mapping[tipo] = {'Familia': fam, 'Pasillo': pasillo}

# Creamos las columnas Familia y Pasillo
def obtener_valores(tipo_avion):
    if pd.isna(tipo_avion):
        return 'Otros', 'Unico'
    
    tipo_str = normalize_spaces(tipo_avion)
    if tipo_str in mapping:
        return mapping[tipo_str]['Familia'], mapping[tipo_str]['Pasillo']
    else:
        return 'Otros', 'Unico'

# Aplicamos la función para generar las columnas
valores = df['Tipo Avión'].apply(obtener_valores)
df['Familia'] = [v[0] for v in valores]
df['Pasillo'] = [v[1] for v in valores]

# Añadimos la columna Fabricante considerando Airbus, Boeing, Otros
df['Fabricante'] = 'Otros'
df.loc[df['Tipo Avión'].str.contains('airbus', case=False, na=False), 'Fabricante'] = 'Airbus'
df.loc[df['Tipo Avión'].str.contains('boeing|boing', case=False, na=False), 'Fabricante'] = 'Boeing'

# Exportamos el nuevo dataframe completo
output_file = os.path.join(DIR, 'passengers_by_year_group_company_type_aircraft_family_and_aisle.csv')
df.to_csv(output_file, index=False, encoding='utf-8-sig')

# Creamos y exportamos una agrupación por Año, Grupo Compañía, Pasillo y Fabricante
df_grouped = df.groupby(['Año', 'Grupo Compañía', 'Pasillo', 'Fabricante'])['Pasajeros'].sum().reset_index()
output_grouped_file = os.path.join(DIR2, 'passengers_by_year_group_company_manufacturer_and_aisle.csv')
df_grouped.to_csv(output_grouped_file, index=False, encoding='utf-8-sig')

# Filtramos para quedarnos únicamente con las top 10 "Grupo Compañía" en términos de "Pasajeros"
top_10_companies = df_grouped.groupby('Grupo Compañía')['Pasajeros'].sum().nlargest(10).index
df_filtered = df_grouped[df_grouped['Grupo Compañía'].isin(top_10_companies)]
output_filtered_file = os.path.join(DIR2, 'passengers_by_year_group_company_manufacturer_and_aisle_top10.csv')
df_filtered.to_csv(output_filtered_file, index=False, encoding='utf-8-sig')

