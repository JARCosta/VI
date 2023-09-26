# Path: Project/script.py
import json
import pandas
import numpy as np
import matplotlib.pyplot as plt
import os

dfs = [None] * 4
def main():
    ls = os.listdir()

    files = [
        '.gitignore',
        'script.py',
        'deaths_emissions_gdp.json',
        'deaths_emissions_gdp.csv',
        'map_data.json',
        'temp.json',
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
                    df.rename(columns={'\u00ef\u00bb\u00bfCountry': 'Country'}, inplace=True)
                    df.dropna(subset=['Country'], inplace=True)

                    df = df.groupby('Country').mean(numeric_only=True).reset_index()
                    df = df.round(2)
                    df["Year"] = 2019
                    dfs[3] = df
                
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
                    for i in list(df.head(0))[2:]:
                        df[i] = df[i].apply(np.ceil)
                    dfs[0] = df

                elif(i.startswith("3-")):
                    df.drop(columns=['Code'], inplace=True)
                    df.rename(columns={'Entity': 'Country'}, inplace=True)
                    # df.fillna(0, inplace=True)
                    df['Total emissions'] = df.sum(axis=1, numeric_only=True)
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
                    df.drop(columns=['country_code', 'sub_region_name', 'intermediate_region', 'income_group', 'total_gdp_million', 'gdp_variation', 'region_name'], inplace=True)
                    df.rename(columns={
                        "year": "Year",
                        "country_name": "Country",
                        "total_gdp": "GDP",
                        }, inplace=True)
                    df["GDP"] = df["GDP"].astype(int)
                    dfs[2] = df

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

    merged = merged.merge(dfs[2], on=['Country', 'Year'], how='outer')

    # merge with map data
    with open("map_data.json", 'r') as f:
        data = json.loads(f.read())
        els = [el["properties"]["name"] for el in data["objects"]["countries"]["geometries"]]
        new_df = pandas.DataFrame({"Country": els, "ID": range(els.__len__())})
    merged = new_df.merge(merged, on='Country', how='outer')
    
    # remove info about countries not in the map and fill the rest with 0's
    merged = merged.dropna(subset=['ID'])
    merged = merged.dropna(subset=['Year'])
    merged = merged.fillna("..")
    
    # merged.to_json("aaaa.json", orient='records', indent=4)

    merged = merged[merged['Year'] < 2020]
    merged = merged[merged['Year'] > 2009]

    merged = merged.drop('ID', axis=1)

    merged["Year"] = merged["Year"].astype(int)

    merged = merged.merge(dfs[3], on=['Country', 'Year'], how='outer')
    merged = merged.fillna("..")

    # merged.to_csv("deaths_emissions_gdp.csv", index=False)
    merged.to_json("deaths_emissions_gdp.json", orient='records', indent=4)

main()


