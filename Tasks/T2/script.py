import pandas as pd
import pycountry
import json

# Read the csv file
df = pd.read_csv('Income by Country.csv')


countries = []
average_income = []

for i in df.values:
    country = i[0]
    values = i[1:-1]
    info = i[-1] # Might be useless
    # print(country, values)
    

    sum_int = 0
    len = 0
    for j in values:
        try:
            sum_int += int(j)

            len += 1
        except:
            # print(country, j)
            pass
    
    if(len > 0):
        try:
            countries.append(pycountry.countries.get(name=country).alpha_3)
            average_income.append(round(sum_int/len, 2))
        except:
            # print(country)
            pass

new_df = pd.DataFrame({"Country": countries, "Average Income": average_income})
# print(new_df)


new_df.to_csv('Average Income by Country.csv', index=False, header=True)




