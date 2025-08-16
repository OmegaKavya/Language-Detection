import streamlit as st
import pickle

# -------------------- Load trained model --------------------
with open("language_detection_model.pkl", "rb") as f:
    model = pickle.load(f)

MODEL_ACCURACY = 0.91  # Your model's test accuracy

# -------------------- Page Config --------------------
st.set_page_config(page_title="Language Detection", page_icon="🌍", layout="centered")

# -------------------- Custom CSS for Glassmorphism --------------------
st.markdown(
    """
    <style>
    body {
        background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
        font-family: 'Segoe UI', sans-serif;
    }
    .title {
        font-size: 2.5rem;
        font-weight: 700;
        color: #ffffff;
        margin-top: 20px;
        margin-bottom: 10px;
        text-align: center;
    }
    .subtitle {
        font-size: 1.1rem;
        color: #dddddd;
        margin-bottom: 20px;
        text-align: center;
    }
    .description {
        font-size: 0.95rem;
        color: #cccccc;
        margin-bottom: 20px;
        text-align: center;
    }
    textarea {
        border-radius: 12px !important;
        padding: 12px !important;
        font-size: 1rem !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
    }
    .result-box {
        margin-top: 25px;
        padding: 15px;
        border-radius: 12px;
        font-size: 1.3rem;
        font-weight: 600;
        color: #fff;
        background: linear-gradient(135deg, #6a11cb, #2575fc);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    button[kind="secondary"] {
        background: linear-gradient(135deg, #ff9966, #ff5e62) !important;
        color: white !important;
        border-radius: 12px !important;
        font-size: 1.1rem !important;
        font-weight: 600 !important;
        padding: 8px 16px !important;
    }
    /* Profile Cards Grid - 3 per row */
    .profile-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        justify-items: center;
        margin-top: 20px;
    }
    .profile-card {
        background: rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 20px 12px;
        text-align: center;
        color: white;
        font-weight: 600;
        font-size: 1rem;
        box-shadow: 0 6px 18px rgba(0,0,0,0.2);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        width: 140px;
    }
    .profile-card:hover {
        transform: translateY(-10px) scale(1.05);
        box-shadow: 0 10px 25px rgba(0,0,0,0.35);
    }

    @media (max-width: 600px) {
        .profile-container {
            grid-template-columns: repeat(1, 1fr);
        }
    }

    @media (min-width: 601px) and (max-width: 900px) {
        .profile-container {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    /* Footer */
    .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 0.9rem;
        color: #cccccc;
    }
    .footer a {
        color: #00c6ff;
        text-decoration: none;
        font-weight: bold;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# -------------------- Sidebar --------------------
st.sidebar.image("omegakavya.jpeg", use_container_width=True)
st.sidebar.title("🌍 Language Detection")
st.sidebar.markdown(
    f"""
    **About this app**  
    Detect the **language** of any input text using a trained ML model.  
    - Model Accuracy: **{MODEL_ACCURACY*100:.2f}%**  
    - Works strongly for selected major languages only.  
    - Future version will integrate **deep learning** for better performance.  
    """
)

# -------------------- Title --------------------
st.markdown('<div class="title">🌍 Language Detection</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">Type or paste text and I’ll predict its language 🔮</div>', unsafe_allow_html=True)
st.markdown('<div class="description">Note: This is a basic ML model. Best performance is on major languages like English, French, German, Spanish, etc. More languages and deep learning enhancements coming soon!</div>', unsafe_allow_html=True)


user_input = st.text_area(
    "✏️ Enter your text here:",
    height=150,
    placeholder="Type or paste your text..."
)

if st.button("🚀 Detect Language"):
    if user_input.strip() == "":
        st.warning("⚠️ Please enter some text.")
    else:
        prediction = model.predict([user_input])[0]
        st.markdown(f'<div class="result-box">🌐 Predicted Language: {prediction}</div>', unsafe_allow_html=True)

st.markdown('</div>', unsafe_allow_html=True)

# -------------------- Profile Cards --------------------
st.markdown("## 🌐 Supported Languages")
st.markdown('<div class="profile-container">', unsafe_allow_html=True)

languages = [
    ("🇬🇧 English", "#6a11cb, #2575fc"),
    ("🇫🇷 French", "#00c6ff, #0072ff"),
    ("🇩🇪 German", "#f953c6, #b91d73"),
    ("🇳🇱 Dutch", "#11998e, #38ef7d"),
    ("🇮🇹 Italian", "#ff9966, #ff5e62"),
    ("🇪🇸 Spanish", "#f7971e, #ffd200"),
    ("🇵🇹 Portugeese", "#ee0979, #ff6a00"),
    ("🇸🇪 Sweedish", "#7f00ff, #e100ff"),
    ("🇹🇷 Turkish", "#56ccf2, #2f80ed"),
]

for lang, gradient in languages:
    st.markdown(
        f"""
        <div class="profile-card" style="background: linear-gradient(135deg, {gradient});">
            {lang}
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown('</div>', unsafe_allow_html=True)

# -------------------- Footer --------------------
st.markdown(
    """
    <div class="footer">
        Made with ❤️ by <a href="https://github.com/OmegaKavya" target="_blank">OmegaKavya</a>
    </div>
    """,
    unsafe_allow_html=True,
)