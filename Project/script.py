# Path: Project/script.py
import json
import pandas
import numpy as np
import matplotlib.pyplot as plt
import os
import pycountry_convert as pc

def country_to_continent(country_name):
    try:
        country_alpha2 = pc.country_name_to_country_alpha2(country_name)
        country_continent_code = pc.country_alpha2_to_continent_code(country_alpha2)
        country_continent_name = pc.convert_continent_code_to_continent_name(country_continent_code)
        return country_continent_name
    except:
        print(country_name)
        return ""

dfs = [None] * 5
def main():
    ls = os.listdir("data")

    for i in ls:
        files = os.listdir("data/"+i)
        for j in files:
            path = "data/"+ i + '/' + j
            if j.endswith('.csv'):
                print(path.replace("data/", ""))
                
                df = pandas.read_csv(path, encoding='utf-8', on_bad_lines='skip')
                
                # switch to semicolon as separator
                if df.columns.__len__() < 2:
                    df = pandas.read_csv(path, encoding='utf-8', on_bad_lines='skip', sep=';')
                
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
                    df["Country"] = df["Country"].str.replace("Venezuela (Bolivarian Republic of)", "Venezuela", regex=True)
                    df["Country"] = df["Country"].str.replace("Iran", "Iran", regex=True)
                    df["Country"] = df["Country"].str.replace("Bolivia", "Bolivia", regex=True)
                    df["Country"] = df["Country"].str.replace("Russian Federation", "Russia", regex=True)
                    dfs[3] = df
                
                elif(i.startswith("2-")):
                    df.drop(columns=['Code'], inplace=True)
                    df.rename(columns={
                        "Entity": "Country",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: All Ages (Rate)": "All_Ages",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: Under 5 (Rate)": "Under_5",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: 5-14 years (Rate)": "5-14_years",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: 15-49 years (Rate)": "15-49_years",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: 50-69 years (Rate)": "50-69_years",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: 70+ years (Rate)": "70+_years",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: Age-standardized (Rate)": "Age-standardized"
                        }, inplace=True)
                    df.drop(columns=['All_Ages', 'Under_5', '5-14_years', '15-49_years', '50-69_years', '70+_years'], inplace=True)
                    for i in list(df.head(0))[2:]:
                        df[i] = df[i].apply(np.ceil)
                    df["Country"] = df["Country"].str.replace("East Timor", "Timor-Leste", regex=True)
                    dfs[0] = df

                elif(i.startswith("3-")):
                    df.drop(columns=['Code', 'Land-use change and forestry'], inplace=True)
                    df.rename(columns={'Entity': 'Country',
                                       'Manufacturing and construction': 'Manufacturing_and_construction',
                                       'Electricity and heat': 'Electricity_and_heat',
                                       'Fugitive emissions': 'Fugitive_emissions',
                                       'Other fuel combustion': 'Other_fuel_combustion',
                                       'Aviation and shipping': 'Aviation_and_shipping',
                                       }, inplace=True)
                    # df.fillna(0, inplace=True)
                    df['Total_Emissions'] = df.sum(axis=1, numeric_only=True)
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

                        df["Country"] = df["Country"].str.replace("Venezuela (Bolivarian Republic of)", "Venezuela", regex=True)
                        df["Country"] = df["Country"].str.replace(" (Islamic Republic of)", "", regex=True)
                        df["Country"] = df["Country"].str.replace("T\u00fcrkiye", "Turkey", regex=True)
                        df["Country"] = df["Country"].str.replace("Russian Federation", "Russia", regex=True)

                        # Pivot the data to reshape it
                        pivot_df = df.pivot_table(index=['Country', 'Year', 'Continent'], columns='Type', values='PM2.5', aggfunc='first').reset_index()
                        pivot_df["Country"] = pivot_df["Country"].str.replace("Iran", "Iran", regex=True)
                        
                        dfs[4] = pivot_df
                        # pivot_df.to_json("temp.json", orient='records', indent=4)

                elif(i.startswith("5-")):
                    df.drop(columns=['country_code', 'sub_region_name', 'intermediate_region', 'income_group', 'total_gdp_million', 'gdp_variation', 'region_name'], inplace=True)
                    df.rename(columns={
                        "year": "Year",
                        "country_name": "Country",
                        "total_gdp": "GDP",
                        }, inplace=True)
                    df["GDP"] = df["GDP"].astype(int)
                    df["Country"] = df["Country"].str.replace("Venezuela (Bolivarian Republic of)", "Venezuela", regex=True)
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
    merged["Country"] = merged["Country"].str.replace("Venezuela (Bolivarian Republic of)", "Venezuela", regex=True)


    merged = merged.merge(dfs[2], on=['Country', 'Year'], how='outer')

    # merge with map data
    with open("web/data.json", 'r') as f:
        data = json.loads(f.read())
        els = [el["properties"]["name"] for el in data["objects"]["countries"]["geometries"]]
        new_df = pandas.DataFrame({"Country": els, "ID": range(els.__len__())})
    merged = new_df.merge(merged, on='Country', how='outer')
    
    # remove info about countries not in the map and fill the rest with 0's
    merged = merged.dropna(subset=['ID'])
    merged = merged.dropna(subset=['Year'])
    merged = merged.fillna("..")
    
    merged = merged[merged['Year'] < 2020]
    merged = merged[merged['Year'] > 2009]

    merged = merged.drop('ID', axis=1)

    merged["Year"] = merged["Year"].astype(int)

    # merged = merged.merge(dfs[3], on=['Country', 'Year'], how='outer')
    # merged = merged.fillna("..")

    # add continent column
    merged["Continent"] = ""

    merged["Country"] = merged["Country"].str.replace("Dem. Rep. Congo", "Democratic Republic of the Congo", regex=True)
    merged["Country"] = merged["Country"].str.replace("CÃ´te d'Ivoire", "Côte d'Ivoire", regex=True)
    merged["Country"] = merged["Country"].str.replace("Central African Rep.", "Central African Republic", regex=True)
    merged["Country"] = merged["Country"].str.replace("Dominican Rep.", "Dominican Republic", regex=True)
    merged["Country"] = merged["Country"].str.replace("Bolivia", "Bolivia", regex=True)

    merged["Continent"] = merged["Country"].apply(country_to_continent)

    dfs[4].drop(columns=['Continent'], inplace=True)
    merged = merged.merge(dfs[4], on=['Country', 'Year'], how='outer')
    merged = merged.fillna("..")

    # merged.to_csv("deaths_emissions_gdp.csv", index=False)
    merged.to_json("web/deaths_emissions_gdp.json", orient='records', indent=4)

main()


