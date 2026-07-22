# 🎨 AI Image Generator, Blender & Auto-Adjust Agent  
A complete web-based AI image generation and compositing toolkit built using:

- **Imagen Image Models (v1beta)**
- **Canvas-based Blending Engine**
- **Gemini 2.5 Flash Agent for Auto-Adjustment**
- **Flask Python Backend**

This project enables generation of AI-based backgrounds and foregrounds, automatic background removal, intelligent foreground placement using an AI agent, and downloadable composite output.

## 🚀 Features
- Background + foreground generation using **Imagen**
- Auto-adjust using **Gemini Agent**
- Canvas-based blending engine
- Foreground background removal (chroma keying)
- Download final PNG output
- Full manual control of transformations & filters

## 📂 Project Structure
/frontend
  - index.html  
  - api.js  
  - blending.js  
  - control.js  
  - main.js  

/backend  
  - app.py (Gemini Auto-Adjust Backend)

## ⚙️ Setup Instructions
Install requirements:
```
pip install -r requirements.txt
```

Add API keys inside:
- `api.js`
- `app.py`

Run backend:
```
python app.py
```

Run frontend using Live Server or:
```
python -m http.server
```

## 🛠️ Requirements
Flask  
Flask-CORS  
google-generativeai  
Pillow  
NumPy  
OpenCV  
Requests

## 📄 License
MIT License © 2025
"# AI-Powered-Intelligent-Image-Composer" 
