# Importo pandas para leer el archivo fácil y rápido
import pandas as pd
import os

DIR = r'G:\Mi unidad\Semestre 5\Visualización de datos\PR2\plot3\silver'
file_dir = os.path.join(DIR, 'passengers_by_year_group_company_and_type_aircraft.csv')

# Cargo el CSV en memoria
df = pd.read_csv(file_dir)

# Saco la columna de "Tipo Avión", quito los nulos y me quedo con los nombres únicos
tipos_unicos = df['Tipo Avión'].dropna().unique()

# Filtro los aviones de Airbus buscando "airbus" en minúsculas
airbus = sorted([av for av in tipos_unicos if 'airbus' in av.lower()])

# Hago lo mismo con Boeing, buscando "boeing" o "boing" por si acaso
boeing = sorted([av for av in tipos_unicos if 'boeing' in av.lower() or 'boing' in av.lower()])

pd.DataFrame(airbus).to_csv(os.path.join(DIR, 'airbus_unique.csv'), index=False, encoding='utf-8-sig')
pd.DataFrame(boeing).to_csv(os.path.join(DIR, 'boeing_unique.csv'), index=False, encoding='utf-8-sig')