import pandas as pd

# Define symptoms and medicine mapping
symptoms_list = [
    "fever", "headache", "body pain", "cold", "allergy", "sneezing", "runny nose",
    "cough", "sore throat", "bacterial infection", "inflammation", "swelling", "stomach pain", "acidity"
]

medicine_mapping = {
    "Paracetamol": ["fever"],
    "Cetirizine": ["cold", "allergy", "sneezing", "runny nose"],
    "Azithromycin": ["cough", "sore throat", "bacterial infection"],
    "Diclofenac": ["body pain", "inflammation", "swelling"],
    "Aciloc": ["stomach pain", "acidity"]
}

# Load dataset
df = pd.read_csv("medicines - modified.csv")

def recommend_medicine(symptoms):
    symptoms = symptoms.split(", ")
    recommended = set()
    
    # Fever-related conditions
    if "fever" in symptoms:
        if "body pain" in symptoms and len(symptoms) == 2:
            recommended.add("Paracetamol")
        elif "headache" in symptoms and len(symptoms) == 2:
            recommended.add("Paracetamol")
        elif "inflammation" in symptoms or "swelling" in symptoms:
            recommended.add("Paracetamol")
            recommended.add("Diclofenac")
        else:
            recommended.add("Paracetamol")
    
    # Pain conditions (when fever is absent)
    if "fever" not in symptoms:
        if "body pain" in symptoms or "headache" in symptoms or "inflammation" in symptoms or "swelling" in symptoms:
            recommended.add("Diclofenac")
    
    # Cold symptoms
    if any(sym in symptoms for sym in medicine_mapping["Cetirizine"]):
        recommended.add("Cetirizine")
    
    # Acidity symptoms
    if any(sym in symptoms for sym in medicine_mapping["Aciloc"]):
        recommended.add("Aciloc")
    
    # Cough & bacterial infection
    if "cough" in symptoms or "bacterial infection" in symptoms or "sore throat" in symptoms:
        recommended.add("Azithromycin")
    
    return ", ".join(recommended)

# Apply medicine recommendation
df["Recommended Medicines"] = df["Symptoms"].apply(recommend_medicine)

''' Save updated dataset
output_file = "updated_medicines.xlsx"
df.to_excel(output_file, index=False)

# Return file path for download
output_file'''
# Save updated dataset as CSV
output_file = "updated_medicines.csv"
df.to_csv(output_file, index=False)

# Return file path for download
output_file