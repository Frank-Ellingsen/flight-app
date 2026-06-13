# Streamlit Flight Viewer

This is a small Streamlit app that displays the mock flight data included in this repository.

Files
- streamlit_app/app.py — Streamlit app entry point
- streamlit_app/requirements.txt — Python dependencies

Run locally
1. python -m venv .venv
2. .\.venv\Scripts\activate
3. pip install -r streamlit_app/requirements.txt
4. streamlit run streamlit_app/app.py

Deploy to Streamlit Cloud
1. Visit https://streamlit.io/cloud and sign in with GitHub.
2. Create a new app and choose this repository (Frank-Ellingsen/flight-app).
3. Set the app path to: streamlit_app/app.py
4. Streamlit will use streamlit_app/requirements.txt to install dependencies and deploy.

Notes
- The app uses static mock data; for dynamic data you can call the existing Next.js API routes or connect to a backend.
- If you want this app to be public, ensure the repository visibility allows it or use private app settings in Streamlit Cloud.
