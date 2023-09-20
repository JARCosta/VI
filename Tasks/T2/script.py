import pandas as pd
import pycountry
import json
import numpy as np

# Read the csv file
df = pd.read_csv('Income by Country.csv')


countries = []
average_income = []

for i in df.values:
    country = i[0]
    values = i[1:-1]
    info = i[-1] # Might be useless
    # print(country, values)
    
    values = [int(j) for j in values if j != ".." and j != " "]


    if(len(values) > 0):
        try:
            countries.append(pycountry.countries.get(name=country).alpha_3)
            average_income.append(round(np.mean(values), 2))
        except AttributeError:
            pass

new_df = pd.DataFrame({"Country": countries, "Average Income": average_income})
# print(new_df)


new_df.to_csv('Average Income by Country.csv', index=False, header=True)




