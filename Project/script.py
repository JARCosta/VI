# Path: Project/script.py
import json
import pandas
import numpy as np
import matplotlib.pyplot as plt
import os


def main():
    ls = os.listdir()
    ls.pop(ls.index('script.py'))
    ls.pop(ls.index('.dont-know-who-i-got-this'))

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
                    df["Country"].fillna("World", inplace=True)

                elif(i.startswith("2-")):
                    df.drop(columns=['Code'], inplace=True)
                    df.rename(columns={
                        "Entity": "Country",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: All Ages (Rate)": "Age: All Ages",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: Under 5 (Rate)": "Age: Under 5",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: 5-14 years (Rate)": "Age: 5-14 year",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: 15-49 years (Rate)": "Age: 15-49 year",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: 50-69 years (Rate)": "Age: 50-69 years",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: 70+ years (Rate)": "Age: 70+ years",
                        "Deaths - Chronic respiratory diseases - Sex: Both - Age: Age-standardized (Rate)": "Age: Age-standardized"
                        }, inplace=True)

                elif(i.startswith("3-")):
                    df.drop(columns=['Code'], inplace=True)
                    df.rename(columns={'Entity': 'Country'}, inplace=True)
                    df.fillna(0, inplace=True)

                elif(i.startswith("4-")):
                    if(j.startswith("who_aap")):
                        df.drop(columns=['ISO3', 'WHO Region'], inplace=True)
                        df.rename(columns={"Measurement Year": "Year",
                                           "WHO Country Name": "Country",
                                           "City or Locality": "City"
                                           }, inplace=True)
                        df.fillna(-1, inplace=True)
                    elif(j.startswith("who-data")):
                        df.drop(columns=['Dim1ValueCode', 'IsLatestYear', 'SpatialDimValueCode', 'ParentLocationCode'], inplace=True)
                        df.rename(columns={"Period": "Year"}, inplace=True)
                        #TODO: remove trash from "Value": "10.01 [6.29 \u00e2\u0080\u0093 13.74]"
                elif(i.startswith("5-")):
                    df.drop(columns=['country_code', 'sub_region_name', 'intermediate_region', 'income_group', 'total_gdp_million'], inplace=True)
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



main()
