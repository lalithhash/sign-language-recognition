import pandas as pd
import matplotlib.pyplot as plt

# Load your dataset (ensure 'Date' is the correct column name for time-related data)
data = pd.read_csv('AI_model/sensor.csv')
# Check for duplicates in your dataset
duplicates = data.duplicated().sum()
print(f"Number of duplicate rows: {duplicates}")

# Optionally, drop duplicates
data = data.drop_duplicates()

import matplotlib.pyplot as plt

data.hist(figsize=(10, 8), bins=20, color='skyblue', edgecolor='black')
plt.suptitle("Histograms of Numeric Features")
plt.show()
