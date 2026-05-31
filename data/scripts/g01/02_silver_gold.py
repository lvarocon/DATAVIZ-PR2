import pandas as pd
import os

# importo dataframes desde silver
df = pd.read_csv("silver/grouped_all-clean.csv", encoding="utf-8-sig", sep=",")
df_loc = pd.read_csv("silver/unique_airports_location.csv", encoding="utf-8-sig", sep=";")

### creando airports_passenger_evolution.csv ###
# agrupo por aeropuerto y año sumando pasajeros
df_airports = (
    df.groupby(["Aeropuerto Base", "Año"], as_index=False)["Pasajeros"]
    .sum()
)

# añado nuevas columnas con latitud y longitud
df_airports = df_airports.merge(
    df_loc[["Aeropuerto Base", "latitude_deg", "longitude_deg"]],
    on="Aeropuerto Base",
    how="left"
)

# exporto a gold
df_airports.to_csv("gold/airports_passenger_evolution.csv", encoding="utf-8-sig", sep=",", index=False)

### creando top_airlines_per_airport_evolution.csv ###
# agrupo por aeropuerto, año y aerolinea sumando pasajeros
df_airlines = (
    df.groupby(["Aeropuerto Base", "Año", "Grupo Compañía"], as_index=False)["Pasajeros"]
    .sum()
)

# me quedo con la aerolinea con mas pasajeros por aeropuerto y año
df_top = (
    df_airlines.sort_values("Pasajeros", ascending=False)
    .groupby(["Aeropuerto Base", "Año"], as_index=False)
    .first()
)

# exporto a gold
df_top.to_csv("gold/top_airlines_per_airport_evolution.csv", encoding="utf-8-sig", sep=",", index=False)