import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report
import pickle
import os

def train_and_save_model(data_path, model_path):
    """
    Loads the dataset, trains a language detection model, and saves it using pickle.

    Args:
        data_path (str): Path to the cleaned CSV file with 'Text' and 'Language' columns.
        model_path (str): Path to save the trained model.

    Returns:
        tuple: (accuracy, classification_report_str)
    """
    # Ensure paths are absolute
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, data_path)
    model_path = os.path.join(script_dir, model_path)

    # Check if dataset exists
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data file not found: {data_path}")

    # Step 1: Load the dataset
    data = pd.read_csv(data_path)
    data = data.dropna(subset=['Text', 'Language'])  # Drop missing values

    # Step 2: Define features (X) and labels (y)
    X = data['Text'].astype(str)
    y = data['Language']

    # Step 3: Split the dataset
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Step 4: Create a pipeline with TF-IDF + Naive Bayes
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(analyzer='char', ngram_range=(1, 3))),
        ('clf', MultinomialNB())
    ])

    # Step 5: Train the model
    pipeline.fit(X_train, y_train)

    # Step 6: Evaluate the model
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred)

    # Step 7: Save model with pickle
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    with open(model_path, "wb") as f:
        pickle.dump(pipeline, f)

    return accuracy, report


# --- Main execution block ---
if __name__ == "__main__":
    # File paths
    CLEAN_DATA_FILE = 'Language_Detection_Cleaned.csv'
    MODEL_OUTPUT_FILE = 'language_detection_model.pkl'

    # Train and save the model
    model_accuracy, model_report = train_and_save_model(CLEAN_DATA_FILE, MODEL_OUTPUT_FILE)

    # Print results
    print("\n--- Training Complete ---")
    print(f"Model saved to: {MODEL_OUTPUT_FILE}")
    print(f"Model Accuracy on Test Data: {model_accuracy:.4f}")

    print("\n--- Classification Report ---")
    print(model_report)

    # Demonstrate predictions using the saved model
    print("\n--- Testing the saved model with sample inputs ---")
    if os.path.exists(MODEL_OUTPUT_FILE):
        with open(MODEL_OUTPUT_FILE, "rb") as f:
            loaded_model = pickle.load(f)

        sample_inputs = [
            "This is a test of the language detection system.",  # English
            "Ceci est un test du système de détection de langue.",  # French
            "Este es un sistema de prueba de detección de idioma.",  # Spanish
            "Это тест системы определения языка.",  # Russian
            "هذا اختبار لنظام كشف اللغة",  # Arabic
            "Questo è un test del sistema di rilevamento della lingua.",  # Italian
            "Dit is een test van het taaldetectiesysteem."  # Dutch
        ]

        predictions = loaded_model.predict(sample_inputs)

        for i, text in enumerate(sample_inputs):
            print(f"Input: '{text}'")
            print(f"--> Predicted Language: {predictions[i]}\n")
    else:
        print(f"Error: Model file '{MODEL_OUTPUT_FILE}' not found. Cannot run demonstration.")