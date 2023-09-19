# Path: Project/script.py
import json
import pandas
import numpy as np
import matplotlib.pyplot as plt
import os

dfs = [None] * 2

def main():
    ls = os.listdir()

    files = [
        '.gitignore',
        'script.py',
        'deths_and_emissions_by_country_and_year.json',
        'deths_and_emissions_by_country_and_year.csv',
        'map_data.json',
        ]

    for i in files:
        try:
            ls.pop(ls.index(i))
        except:
            continue 

    for i in ls:
        files = os.listdir(i)
        for j in files:
            path = i + '/' + j
            if j.endswith('.csv'):
                print(path)
                
                df = pandas.read_csv(path, encoding='unicode_escape', on_bad_lines='skip')
                
                # switch to semicolon as separator
                if df.columns.__len__() < 2:
                    df = pandas.read_csv(path, encoding='unicode_escape', on_bad_lines='skip', sep=';')
                
                # remove columns with only one value
                remove_list = []
                for column in df.columns:
                    if(df[column].unique().__len__() == 1):
                        remove_list.append(column)
                df.drop(columns=remove_list, inplace=True)


                # Specific changes for each dataset

                if(i.startswith("1-")):
                    df.drop(columns=[
                        'AQI Category',
                        'CO AQI Category',
                        'Ozone AQI Category',
                        'NO2 AQI Category',
                        'PM2.5 AQI Category',
                        ], inplace=True)
                    df.rename(columns={'\u00ef\u00bb\u00bfCountry': 'Country'}, inplace=True)
                    
                    # merge countries with multiple entries (cities)
                    countries = {}
                    for line in df.values:
                        if line[0] not in countries and (str(line[0]) != "nan"):
                            countries[line[0]] = {
                                "Country": line[0],
                                "AQI": line[2],
                                "CO AQI": line[3],
                                "Ozone AQI": line[4],
                                "NO2 AQI": line[5],
                                "PM2.5 AQI": line[6],
                                "len": 1
                            }
                        elif str(line[0]) != "nan":
                            countries[line[0]]["AQI"] += line[2]
                            countries[line[0]]["CO AQI"] += line[3]
                            countries[line[0]]["Ozone AQI"] += line[4]
                            countries[line[0]]["NO2 AQI"] += line[5]
                            countries[line[0]]["PM2.5 AQI"] += line[6]
                            countries[line[0]]["len"] += 1

                    for c in countries:
                        countries[c]["AQI"] /= countries[c]["len"]
                        countries[c]["CO AQI"] /= countries[c]["len"]
                        countries[c]["Ozone AQI"] /= countries[c]["len"]
                        countries[c]["NO2 AQI"] /= countries[c]["len"]
                        countries[c]["PM2.5 AQI"] /= countries[c]["len"]
                        countries[c].pop("len")
                        for c2 in countries[c]:
                            if(c2 != "Country"):
                                countries[c][c2] = round(countries[c][c2], 2)
                    
                    df = pandas.DataFrame.from_dict(countries, orient='index')
                    
                elif(i.startswith("2-")):
                    df.drop(columns=['Code'], inplace=True)
                    df.rename(columns={
                        "Entity": "Country",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: All Ages (Rate)": "Age: All Ages",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: Under 5 (Rate)": "Age: Under 5",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: 5-14 years (Rate)": "Age: 5-14 years",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: 15-49 years (Rate)": "Age: 15-49 years",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: 50-69 years (Rate)": "Age: 50-69 years",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: 70+ years (Rate)": "Age: 70+ years",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: Age-standardized (Rate)": "Age: Age-standardized"
                        }, inplace=True)
                    dfs[0] = df

                elif(i.startswith("3-")):
                    df.drop(columns=['Code'], inplace=True)
                    df.rename(columns={'Entity': 'Country'}, inplace=True)
                    df.fillna(0, inplace=True)
                    dfs[1] = df

                elif(i.startswith("4-")):
                        df.drop(columns=['Dim1ValueCode', 'IsLatestYear', 'ParentLocationCode', 'Value', 'FactValueNumericHigh', 'FactValueNumericLow'], inplace=True)
                        df.rename(columns={
                            'SpatialDimValueCode': 'ISO3',
                            "Period": "Year",
                            'Location': 'Country',
                            'ParentLocation': 'Continent',
                            'Dim1': "Type",
                            'FactValueNumeric': "PM2.5",
                            }, inplace=True)

                elif(i.startswith("5-")):
                    df.drop(columns=['country_code', 'sub_region_name', 'intermediate_region', 'income_group', 'total_gdp_million', 'gdp_variation'], inplace=True)
                    df.rename(columns={"year": "Year"}, inplace=True)


                # filter years
                try:
                    df = df[df['Year'] < 2020]
                    df = df[df['Year'] > 2009]
                except KeyError:
                    pass

                # turn into json
                js = df.to_dict(orient='records')
                
                # save json
                with open(path.replace(".csv", ".json"), 'w') as f:
                    f.write(json.dumps(js, indent=4))

    # merge datasets with same keys (country and year)
    merged = dfs[0].merge(dfs[1], on=['Country', 'Year'], how='outer')
    
    # adapt to country map selection
    merged["Country"] = merged["Country"].str.replace("United States", "United States of America")
    merged["Country"] = merged["Country"].str.replace("Central African Republic", "Central African Rep.")
    merged["Country"] = merged["Country"].str.replace("Cote d'Ivoire", "Côte d'Ivoire")
    merged["Country"] = merged["Country"].str.replace("Dominican Republic", "Dominican Rep.")
    merged["Country"] = merged["Country"].str.replace("Democratic Republic of Congo", "Dem. Rep. Congo")

    # merge with map data
    with open("data.json", 'r') as f:
        data = json.loads(f.read())
        els = [el["properties"]["name"] for el in data["objects"]["countries"]["geometries"]]
        new_df = pandas.DataFrame({"Country": els, "ID": range(els.__len__())})
    merged = new_df.merge(merged, on='Country', how='outer')
    
    # remove info about countries not in the map and fill the rest with 0's
    merged = merged.dropna(subset=['ID']).fillna(0)
    
    merged = merged[merged['Year'] < 2020]
    merged = merged[merged['Year'] > 2009]

    # merged.to_csv("deths_and_emissions_by_country_and_year.csv", index=False)
    merged.to_json("deths_and_emissions_by_country_and_year.json", orient='records', indent=4)

main()

