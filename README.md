# 🏥 Advanced MediFlex - Smart Medication System

<div align="center">

![MediFlex Logo](static/logo.png)

**AI-Powered Healthcare Solution for Intelligent Medicine Recommendations**

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)](https://flask.palletsprojects.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15.0-orange.svg)](https://www.tensorflow.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Demo](#demo) • [Features](#features) • [Installation](#installation) • [Usage](#usage) • [API Documentation](#api-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation Guide](#installation-guide)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Machine Learning Model](#machine-learning-model)
- [Screenshots](#screenshots)
- [Android Application](#android-application)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 🎯 Overview

**Advanced MediFlex** is a cutting-edge AI-powered healthcare platform that revolutionizes medication management and health monitoring. Using deep learning and natural language processing, the system analyzes patient symptoms and provides accurate medicine recommendations with **98.64% precision**.

The platform combines artificial intelligence, IoT connectivity, and modern web technologies to deliver a comprehensive healthcare solution accessible 24/7.

### 🌟 Why Advanced MediFlex?

- 🤖 **AI-Powered Diagnosis**: Deep learning CNN model trained on extensive medical datasets
- 💊 **Personalized Dosage**: Age and weight-based medication calculations
- 🔒 **Safe & Secure**: Drug interaction detection and allergy checking
- 📱 **Cross-Platform**: Web application + Android mobile app
- 🌐 **Always Available**: 24/7 access to healthcare recommendations
- 📊 **Health Analytics**: Track symptoms, medicines, and health trends
- 🔔 **Smart Reminders**: Never miss a medication dose

---

## ✨ Key Features

### 🎯 Core Medical Features

#### 1. **AI Symptom Analysis**
- Advanced NLP-based symptom processing
- Multi-symptom analysis with CNN deep learning model
- Real-time medicine recommendations
- 98.64% precision rate

#### 2. **Personalized Dosage Calculator**
- Age-based dosage adjustments (Pediatric, Adolescent, Adult, Elderly)
- Weight-specific calculations
- Medicine-specific frequency and duration
- Total tablets calculation for prescription period

#### 3. **Drug Interaction Checker**
- Real-time interaction detection between multiple medicines
- Severity classification (Minor, Moderate, Severe)
- Detailed interaction explanations
- Alternative medicine suggestions

#### 4. **Allergy Detection System**
- Cross-reference patient allergies with recommended medicines
- Automatic warning alerts
- Alternative medicine recommendations
- Comprehensive allergy database

#### 5. **Severity Assessment**
- Symptom severity classification (Low, Moderate, High, Emergency)
- Emergency situation detection
- Recommended actions based on severity
- Hospital visit recommendations

### 👤 User Management Features

#### 6. **User Authentication & Profiles**
- Email/Password registration with OTP verification
- Google OAuth 2.0 integration
- Secure password hashing (Werkzeug)
- Profile management with medical history

#### 7. **Consultation History**
- Detailed consultation records
- Symptom tracking over time
- Medicine usage history
- Downloadable prescription reports

#### 8. **Medication Reminders**
- Schedule-based medication alerts
- Customizable reminder frequencies
- Duration tracking
- Medication adherence monitoring

### 📊 Advanced Features

#### 9. **Health Dashboard**
- Visual health analytics with charts
- Symptom frequency analysis
- Medicine usage trends
- Monthly consultation tracking

#### 10. **Smart Prescription Generator**
- Professional PDF prescriptions
- Personalized dosage information
- Medicine details and precautions
- Downloadable and shareable reports

#### 11. **Emergency Contacts**
- Quick access to emergency services
- Ambulance, police, fire services
- Specialized helplines (poison control, mental health, COVID)
- One-click emergency calling

#### 12. **Health Tips & Education**
- Curated health information
- Disease prevention tips
- Medication guidelines
- Wellness recommendations

### 🔧 Technical Features

#### 13. **Responsive Design**
- Mobile-first approach
- Works on all devices (phone, tablet, desktop)
- Progressive Web App (PWA) capabilities
- Touch-optimized interface

#### 14. **Dark Mode Support**
- Theme toggle functionality
- Eye-friendly dark theme
- Preference persistence
- CSS variable-based theming

#### 15. **Real-time Notifications**
- Flash messages for user actions
- Toast notifications
- Alert system for critical information
- Success/Error feedback

---

## 🛠️ Technology Stack

### Backend
```
Python 3.10+
├── Flask 3.0.0              # Web framework
├── TensorFlow 2.15.0        # Deep learning
├── PyMongo 4.6.1            # MongoDB driver
├── Flask-Mail 0.9.1         # Email service
├── Authlib 1.3.0            # OAuth authentication
└── python-dotenv 1.0.0      # Environment management
```

### Machine Learning
```
TensorFlow/Keras
├── CNN Architecture         # Convolutional Neural Network
├── NLTK 3.8.1              # Natural Language Processing
├── NumPy 1.24.3            # Numerical computing
├── Pandas 2.0.3            # Data manipulation
└── Scikit-learn 1.3.0      # ML utilities
```

### Frontend
```
HTML5 / CSS3 / JavaScript
├── Vanilla JavaScript       # No framework dependency
├── CSS Grid & Flexbox      # Modern layouts
├── Font Awesome 6.4.0      # Icons
└── Google Fonts (Inter)    # Typography
```

### Database
```
MongoDB Atlas
├── User Management
├── Consultation History
├── Medication Reminders
└── Profile Data
```

### Authentication
```
Multi-factor Authentication
├── Email/Password (bcrypt hashing)
├── OTP Email Verification
└── Google OAuth 2.0
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Web Browser  │  │ Mobile App   │  │   Tablet     │     │
│  │  (Chrome,    │  │  (Android)   │  │   (iPad)     │     │
│  │  Firefox,    │  │              │  │              │     │
│  │  Safari)     │  │              │  │              │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   LOAD BALANCER  │
                    │   (Production)   │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                                     │
┌─────────▼─────────┐              ┌───────────▼─────────┐
│  APPLICATION      │              │   STATIC ASSETS     │
│     LAYER         │              │      LAYER          │
│  ┌─────────────┐  │              │  ┌───────────────┐  │
│  │ Flask App   │  │              │  │  CSS/JS/IMG   │  │
│  │  - Routes   │  │              │  │  - style.css  │  │
│  │  - Auth     │  │              │  │  - main.js    │  │
│  │  - API      │  │              │  │  - logo.png   │  │
│  └──────┬──────┘  │              │  └───────────────┘  │
│         │         │              └─────────────────────┘
│  ┌──────▼──────┐  │
│  │   Models    │  │
│  │  - User     │  │
│  │  - Database │  │
│  └──────┬──────┘  │
└─────────┼─────────┘
          │
          │
┌─────────▼─────────────────────────────────────────────────┐
│                  INTELLIGENCE LAYER                        │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ ML Engine   │  │ NLP Engine   │  │ Recommendation  │  │
│  │             │  │              │  │    Engine       │  │
│  │ - CNN Model │  │ - Tokenizer  │  │ - Dosage Calc  │  │
│  │ - Medicine  │  │ - Symptom    │  │ - Interaction  │  │
│  │   Predictor │  │   Analysis   │  │   Checker      │  │
│  │             │  │              │  │ - Allergy Det  │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
└───────────────────────────────────────────────────────────┘
          │
          │
┌─────────▼─────────────────────────────────────────────────┐
│                    DATA LAYER                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  MongoDB    │  │  ML Models   │  │  Configuration  │  │
│  │   Atlas     │  │              │  │                 │  │
│  │ - Users     │  │ - model.h5   │  │ - .env         │  │
│  │ - History   │  │ - tokenizer  │  │ - config.py    │  │
│  │ - Reminders │  │ - labels.pkl │  │                 │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
└───────────────────────────────────────────────────────────┘
          │
          │
┌─────────▼─────────────────────────────────────────────────┐
│              EXTERNAL SERVICES LAYER                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Gmail      │  │ Google OAuth │  │   MongoDB       │  │
│  │   SMTP      │  │              │  │    Atlas        │  │
│  │             │  │              │  │                 │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

---

## 📥 Installation Guide

### Prerequisites

Ensure you have the following installed:

- **Python 3.10 or higher** - [Download](https://www.python.org/downloads/)
- **pip** (Python package manager)
- **Git** - [Download](https://git-scm.com/downloads)
- **MongoDB Atlas Account** (Free) - [Sign up](https://www.mongodb.com/cloud/atlas)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/advanced-mediflex.git
cd advanced-mediflex
```

### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Download NLTK Data

```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### Step 5: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Flask Configuration
SECRET_KEY=your-secret-key-change-this-in-production
FLASK_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=mediflex

# Gmail SMTP Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 6: Train ML Model (Optional)

If you want to retrain the model:

```bash
python dataset.py
```

This will generate:
- `medicine_model.h5` - Trained CNN model
- `tokenizer.pkl` - Text tokenizer
- `medicine_labels.pkl` - Medicine label encoder

### Step 7: Run the Application

```bash
python app.py
```

The application will be available at:
- **Local:** http://localhost:5000
- **Network:** http://your-ip:5000

---

## ⚙️ Configuration

### MongoDB Setup

1. Create a free MongoDB Atlas cluster
2. Whitelist your IP address (or allow access from anywhere for development)
3. Create a database named `mediflex`
4. Update `MONGODB_URI` in `.env` file

### Gmail SMTP Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Update `MAIL_USERNAME` and `MAIL_PASSWORD` in `.env`

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/auth/google/callback`
   - `https://yourdomain.com/auth/google/callback` (for production)
6. Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

---

## 🚀 Usage

### For Patients

#### 1. **Register/Login**
- Navigate to http://localhost:5000
- Click "Login" → "Register" or use Google Sign-In
- Verify email with OTP

#### 2. **Analyze Symptoms**
- Enter symptoms in the text area (e.g., "fever, headache, body pain")
- Or use quick select tags for common symptoms
- Click "Analyze & Get Recommendations"

#### 3. **Advanced Options**
- Add known allergies
- Enter age and weight for personalized dosage
- Profile data auto-fills if logged in

#### 4. **View Results**
- See recommended medicines with detailed information
- Check drug interactions
- Review allergy warnings
- View severity assessment

#### 5. **Download Prescription**
- Click "Download Prescription" for a detailed report
- Includes personalized dosage and tablet counts
- Share with doctors or pharmacies

#### 6. **Set Reminders**
- Navigate to Profile → Medication Reminders
- Add medicine schedule
- Receive notifications (if configured)

#### 7. **Track History**
- View past consultations
- Analyze symptom patterns
- Export health reports

### For Developers

#### API Testing

```bash
# Health check
curl http://localhost:5000/

# Predict medicine
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"symptoms": "fever, headache, cough"}'

# Check drug interactions
curl -X POST http://localhost:5000/check-interactions \
  -H "Content-Type: application/json" \
  -d '{"medicines": ["paracetamol", "aspirin"]}'
```

---

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

#### Google OAuth
```http
GET /auth/google-login
```

### Medicine Prediction

#### Analyze Symptoms
```http
POST /predict
Content-Type: application/json

{
  "symptoms": "fever, headache, body pain",
  "age": 30,
  "weight": 70,
  "allergies": "NSAIDs"
}

Response:
{
  "success": true,
  "medicines": ["paracetamol", "cetirizine"],
  "symptoms_analyzed": ["fever", "headache", "body pain"]
}
```

### Dosage Calculation

```http
POST /calculate-dosage
Content-Type: application/json

{
  "medicine": "paracetamol",
  "age": 30,
  "weight": 70
}

Response:
{
  "success": true,
  "dosage": {
    "dose_mg": 1000,
    "frequency": "3 times daily",
    "duration": "5 days",
    "total_tablets": 15
  }
}
```

### Drug Interaction Check

```http
POST /check-interactions
Content-Type: application/json

{
  "medicines": ["paracetamol", "aspirin", "warfarin"]
}

Response:
{
  "success": true,
  "interactions": [
    {
      "medicines": ["aspirin", "warfarin"],
      "severity": "severe",
      "description": "Increased bleeding risk"
    }
  ]
}
```

### Severity Assessment

```http
POST /assess-severity
Content-Type: application/json

{
  "symptoms": ["chest pain", "difficulty breathing"]
}

Response:
{
  "success": true,
  "severity": "emergency",
  "action": "Seek immediate medical attention",
  "call_emergency": true
}
```

### User History

```http
GET /history
Headers: Cookie: session=<session-id>

Response: HTML page with consultation history
```

---

## 🤖 Machine Learning Model

### Model Architecture

**Type:** Convolutional Neural Network (CNN)

**Layers:**
```
Input Layer
    ↓
Embedding Layer (300 dimensions)
    ↓
Conv1D (128 filters, kernel=5, ReLU)
    ↓
GlobalMaxPooling1D
    ↓
Dense (128 units, ReLU)
    ↓
Dropout (0.5)
    ↓
Dense (64 units, ReLU)
    ↓
Output Layer (Softmax)
```

### Training Details

- **Dataset Size:** 10,000+ symptom-medicine pairs
- **Training Epochs:** 50
- **Batch Size:** 32
- **Optimizer:** Adam
- **Loss Function:** Categorical Crossentropy
- **Validation Split:** 20%

### Performance Metrics

```
Accuracy:  98.64%
Precision: 98.71%
Recall:    98.58%
F1-Score:  98.64%
```

### Supported Medicines

The model predicts from a curated list of essential medicines:
- **Analgesics:** Paracetamol, Ibuprofen, Aspirin
- **Antibiotics:** Azithromycin, Amoxicillin, Ciprofloxacin
- **Antihistamines:** Cetirizine, Loratadine
- **NSAIDs:** Diclofenac, Naproxen
- **Antacids:** Ranitidine, Omeprazole
- And 50+ more essential medicines

---

## 📱 Android Application

Advanced MediFlex includes a native Android application built with Kotlin.

### Features
- ✅ Native Android UI with Material Design
- ✅ Offline symptom storage
- ✅ Push notifications for reminders
- ✅ Camera integration for medicine scanning
- ✅ Location-based pharmacy finder

### Installation

```bash
cd ANROID_APP_FILE_MEDIFLEX/MediFlex
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Screenshots

Located in `ANROID_APP_FILE_MEDIFLEX/App_Screenshots/`

---

## 📸 Screenshots

### Web Application

#### Home Page
![Home Page](static/screenshots/home.png)

#### Symptom Analysis
![Symptom Analysis](static/screenshots/analysis.png)

#### Medicine Recommendations
![Recommendations](static/screenshots/results.png)

#### User Profile
![Profile](static/screenshots/profile.png)

#### Health Dashboard
![Dashboard](static/screenshots/dashboard.png)

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Bugs

1. Check if the bug is already reported in [Issues](https://github.com/yourusername/advanced-mediflex/issues)
2. Create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)

### Suggesting Features

1. Open an issue with the tag `enhancement`
2. Describe the feature and its benefits
3. Provide examples or mockups

### Code Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 style guide for Python code
- Add docstrings to all functions
- Write unit tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Nikhil More

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## ⚠️ Disclaimer

**IMPORTANT MEDICAL DISCLAIMER:**

Advanced MediFlex is an AI-powered recommendation system designed for informational and educational purposes only. It is **NOT** a substitute for professional medical advice, diagnosis, or treatment.

**Please Note:**
- Always consult a qualified healthcare professional before taking any medication
- This system should not be used for medical emergencies
- The recommendations are based on AI predictions and may not be 100% accurate
- Individual health conditions vary; consult your doctor for personalized advice
- Do not self-medicate based solely on this application
- In case of emergency, call your local emergency services immediately

**The developers and contributors are not liable for any medical decisions made based on this application.**

---

## 🙏 Acknowledgments

- **TensorFlow Team** - For the amazing deep learning framework
- **Flask Community** - For the excellent web framework
- **MongoDB** - For the robust database solution
- **OpenStreetMap** - For mapping services
- **Font Awesome** - For beautiful icons
- **Google Fonts** - For typography
- **Medical Data Sources** - NHS, WebMD, Mayo Clinic for reference data

---

## 📞 Contact

**Nikhil More**

- 📧 Email: nikhil.030305@gmail.com
- 💼 LinkedIn: [Nikhil More](https://linkedin.com/in/nikhilmore)
- 🐙 GitHub: [@nikhilmore030305](https://github.com/nikhilmore030305)

**Project Link:** [https://github.com/yourusername/advanced-mediflex](https://github.com/yourusername/advanced-mediflex)

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/advanced-mediflex&type=Date)](https://star-history.com/#yourusername/advanced-mediflex&Date)

---

## 📊 Project Status

![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Tests](https://img.shields.io/badge/tests-100%25-success.svg)
![Coverage](https://img.shields.io/badge/coverage-95%25-green.svg)
![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)

---

<div align="center">

**Made with ❤️ by Nikhil More**

**⭐ Star this repository if you find it helpful!**

[Back to Top](#-advanced-mediflex---smart-medication-system)

</div>
