import pandas as pd
import re

def preprocess_text(text):
    """
    Cleans a single text string by lowercasing, removing numbers, 
    punctuation, and extra whitespace.
    
    Args:
        text (str): The input string to clean.
        
    Returns:
        str: The cleaned string.
    """
    # Your code here:
    # 1. Convert text to lowercase
    text = text.lower()
    # 2. Use regex to remove numbers
    text = re.sub(r'\d+', '', text)
    # 3. Use regex to remove punctuation and special characters
    text = re.sub(r'[^a-z\s]', '', text)
    # 4. Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()    
    cleaned_text = text # Replace this with your actual cleaned text
    return cleaned_text


# --- Main execution block ---
if __name__ == "__main__":
    # Define file paths
    INPUT_FILE = 'Language Detection.csv'
    OUTPUT_FILE = 'Language_Detection_Cleaned.csv'
    
    print("Starting data cleaning process...")
    
    # 1. Load the data
    try:
        data = pd.read_csv(INPUT_FILE)
        print(f"Successfully loaded {INPUT_FILE}")
    except FileNotFoundError:
        print(f"Error: {INPUT_FILE} not found. Please place it in the correct directory.")
        exit() # Exit the script if the file isn't there

    # 2. Handle missing values
    # Your code here: Drop rows with any null values.
    data = data.dropna()
    
    # 3. Apply the cleaning function to the 'Text' column
    data['Text'] = data['Text'].apply(preprocess_text)
    # Ensure the 'Text' column is treated as string type to avoid errors
    print("Cleaning text data...")
    # data['Text'] = ... your code here ...
    
    
    # 4. Save the cleaned data
    # Hint: Use the .to_csv() method. Remember to set index=False.
    # Your code here...
    data.to_csv(OUTPUT_FILE,index=False)
    
    print(f"Data cleaning complete. Cleaned data saved to {OUTPUT_FILE}")