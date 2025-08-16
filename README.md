# 🌍 Language Detection

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.29-orange.svg)](https://streamlit.io/)

A simple **Machine Learning-based language detection** web app built with **Streamlit**. Type or paste text and instantly detect its language.  

---

## 🛠 Features

- Predicts the language of input text using a trained ML model.
- Shows results instantly in a visually appealing **glassmorphism UI**.
- Supports major languages such as **English, French, German, Spanish, Italian**, and more.
- Mobile-responsive layout for a smooth experience on different devices.
- **Future plans:** Upgrade to **deep learning** for more accurate multi-language support.

---

## 📊 Model Information

- Type: Basic ML model (e.g., **Random Forest** or similar)
- Accuracy: **91%** on test data
- Works best for selected major languages only

---

## 🖥 Tech Stack

- **Frontend:** Streamlit  
- **Backend:** Python  
- **Model:** Pickle serialized ML model

---

## 🚀 How to Run

1. Clone this repository:

```bash
git clone https://github.com/YourUsername/language-detection.git
cd language-detection
```

2. Create a virtual environment and activate it:

```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run the app:

```bash
streamlit run app.py
```

5. Open the app in your browser at the link provided by Streamlit.

---
## 📁 Files
- app.py – Streamlit application code
- language_detection_model.pkl – Trained ML model
- omegakavya.jpeg – Sidebar image (optional)

---

 ## ⚠️ Notes
 - This is a basic ML model.
 - Works strongly for major languages only.
 - Deep learning upgrade coming soon for better performance and wider language support.

---

## 🤝 Contributing

We welcome contributions! If you'd like to help **add support for more languages**, please follow these steps:

1. **Fork the repository** and clone it locally.
2. **Train a new model** or update the existing one to include additional languages.
3. **Test your changes** to ensure predictions work correctly.
4. **Create a pull request** with a clear description of the added languages and any changes made.

Your contributions will make this app more powerful and inclusive! 🌍✨

 ## ❤️ Author
 - Made with ❤️ by OmegaKavya
