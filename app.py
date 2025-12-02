"""
MediFlex - Smart Medication System
AI-Powered Healthcare Application
"""

from flask import Flask, render_template, request, jsonify, session
from flask_mail import Mail
import numpy as np
import pickle
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os
from datetime import datetime
import json
from config import Config
from auth import auth_bp
from models import User

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = Config.SECRET_KEY

# Initialize Flask-Mail
mail = Mail(app)

# Register authentication blueprint
app.register_blueprint(auth_bp, url_prefix='/auth')

# Load ML Model and Preprocessing Objects
try:
    model = load_model('medicine_model.h5', compile=False)
    with open('tokenizer.pkl', 'rb') as f:
        tokenizer = pickle.load(f)
    with open('medicine_labels.pkl', 'rb') as f:
        medicine_list = pickle.load(f)
    print("✓ Model and artifacts loaded successfully!")
except Exception as e:
    print(f"✗ Error loading model: {e}")
    model = None
    tokenizer = None
    medicine_list = None

# Medicine Information Database
MEDICINE_INFO = {
    'paracetamol': {
        'name': 'Paracetamol',
        'category': 'Analgesic & Antipyretic',
        'usage': 'Used to treat fever, headache, and body pain',
        'dosage': 'Adults: 500-1000mg every 4-6 hours (max 4g/day)',
        'precautions': [
            'Do not exceed recommended dose',
            'Avoid alcohol consumption',
            'Consult doctor if pregnant or breastfeeding',
            'Not recommended for liver disease patients'
        ],
        'side_effects': ['Nausea', 'Allergic reactions (rare)', 'Liver damage (overdose)']
    },
    'cetirizine': {
        'name': 'Cetirizine',
        'category': 'Antihistamine',
        'usage': 'Used to treat allergies, cold, sneezing, and runny nose',
        'dosage': 'Adults: 10mg once daily',
        'precautions': [
            'May cause drowsiness',
            'Avoid driving after consumption',
            'Consult doctor if pregnant',
            'Reduce dose in kidney disease'
        ],
        'side_effects': ['Drowsiness', 'Dry mouth', 'Headache', 'Fatigue']
    },
    'azithromycin': {
        'name': 'Azithromycin',
        'category': 'Antibiotic',
        'usage': 'Used to treat bacterial infections, cough, and sore throat',
        'dosage': 'Adults: 500mg once daily for 3-5 days',
        'precautions': [
            'Complete the full course',
            'Take on empty stomach',
            'Avoid if allergic to macrolides',
            'Consult doctor for heart conditions'
        ],
        'side_effects': ['Diarrhea', 'Nausea', 'Abdominal pain', 'Vomiting']
    },
    'diclofenac': {
        'name': 'Diclofenac',
        'category': 'NSAID (Anti-inflammatory)',
        'usage': 'Used to treat swelling, inflammation, and body pain',
        'dosage': 'Adults: 50mg 2-3 times daily',
        'precautions': [
            'Take with food',
            'Avoid in stomach ulcers',
            'Not for long-term use without supervision',
            'Risk of cardiovascular events'
        ],
        'side_effects': ['Stomach upset', 'Heartburn', 'Dizziness', 'Headache']
    },
    'aciloc': {
        'name': 'Aciloc (Ranitidine)',
        'category': 'Antacid',
        'usage': 'Used to treat acidity and stomach pain',
        'dosage': 'Adults: 150mg twice daily or 300mg at bedtime',
        'precautions': [
            'Take before meals',
            'Avoid smoking and alcohol',
            'Consult doctor for kidney disease',
            'May interact with other medications'
        ],
        'side_effects': ['Headache', 'Dizziness', 'Constipation', 'Diarrhea']
    }
}

# Drug Interaction Database
DRUG_INTERACTIONS = {
    ('paracetamol', 'diclofenac'): {
        'severity': 'moderate',
        'warning': 'Both are pain relievers. Combination may increase risk of liver damage.',
        'recommendation': 'Consult doctor before combining these medications'
    },
    ('azithromycin', 'aciloc'): {
        'severity': 'mild',
        'warning': 'Antacids may reduce absorption of azithromycin.',
        'recommendation': 'Take azithromycin 1 hour before or 2 hours after antacid'
    },
    ('diclofenac', 'aciloc'): {
        'severity': 'low',
        'warning': 'Aciloc can help protect stomach from NSAID side effects.',
        'recommendation': 'This combination is often prescribed together'
    },
    ('cetirizine', 'paracetamol'): {
        'severity': 'low',
        'warning': 'Generally safe to take together for cold and flu symptoms.',
        'recommendation': 'No significant interaction, can be taken as prescribed'
    }
}

# Severity Assessment Database
SEVERITY_INDICATORS = {
    'severe': ['high fever', 'severe pain', 'chest pain', 'difficulty breathing', 
               'persistent vomiting', 'blood in stool', 'severe headache', 'confusion'],
    'moderate': ['moderate fever', 'persistent cough', 'body aches', 'diarrhea', 
                 'stomach pain', 'swelling', 'inflammation'],
    'mild': ['mild headache', 'slight fever', 'runny nose', 'sneezing', 
             'minor allergy', 'mild acidity']
}

# Common Allergies Database
COMMON_ALLERGIES = {
    'paracetamol': ['acetaminophen', 'paracetamol allergy'],
    'cetirizine': ['antihistamine allergy', 'hydroxyzine allergy'],
    'azithromycin': ['macrolide antibiotics', 'erythromycin', 'clarithromycin'],
    'diclofenac': ['NSAIDs', 'aspirin', 'ibuprofen', 'naproxen'],
    'aciloc': ['ranitidine', 'H2 blockers']
}

# Symptom Database
SYMPTOM_DATABASE = [
    'fever', 'headache', 'body pain', 'cold', 'allergy', 'sneezing',
    'runny nose', 'cough', 'sore throat', 'bacterial infection',
    'swelling', 'inflammation', 'stomach pain', 'acidity'
]



@app.route('/')
def home():
    """Render the home page"""
    return render_template('index.html', symptoms=SYMPTOM_DATABASE)


@app.route('/calculate-dosage', methods=['POST'])
def calculate_dosage():
    """Calculate appropriate dosage based on age and weight - Requires login"""
    # Require login for advanced features
    if 'user_email' not in session:
        return jsonify({'success': False, 'error': 'Please login to use dosage calculator', 'require_login': True}), 401
    
    try:
        data = request.get_json()
        medicine = data.get('medicine', '').lower()
        age = int(data.get('age', 0))
        weight = float(data.get('weight', 0))
        
        if medicine not in MEDICINE_INFO:
            return jsonify({'success': False, 'error': 'Medicine not found'})
        
        # Dosage calculation logic
        dosage_info = {'medicine': MEDICINE_INFO[medicine]['name']}
        
        if age < 2:
            dosage_info['recommendation'] = 'Consult pediatrician - Not recommended for infants'
            dosage_info['suitable'] = False
        elif age < 12:
            if medicine == 'paracetamol':
                dose = weight * 10  # 10-15mg/kg
                dosage_info['recommendation'] = f'{dose:.0f}mg every 4-6 hours (max 4 doses/day)'
            elif medicine == 'cetirizine':
                dosage_info['recommendation'] = '5mg once daily'
            else:
                dosage_info['recommendation'] = 'Consult pediatrician for appropriate child dosage'
            dosage_info['suitable'] = True
            dosage_info['age_group'] = 'child'
        elif age < 18:
            dosage_info['recommendation'] = MEDICINE_INFO[medicine]['dosage']
            dosage_info['suitable'] = True
            dosage_info['age_group'] = 'teenager'
        elif age < 65:
            dosage_info['recommendation'] = MEDICINE_INFO[medicine]['dosage']
            dosage_info['suitable'] = True
            dosage_info['age_group'] = 'adult'
        else:
            dosage_info['recommendation'] = MEDICINE_INFO[medicine]['dosage'] + ' (May need adjustment for elderly)'
            dosage_info['suitable'] = True
            dosage_info['age_group'] = 'elderly'
            dosage_info['note'] = 'Consult doctor for elderly-specific dosing'
        
        return jsonify({'success': True, 'dosage': dosage_info})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/check-interactions', methods=['POST'])
def check_interactions():
    """Check for drug interactions between multiple medicines - Requires login"""
    # Require login for advanced features
    if 'user_email' not in session:
        return jsonify({'success': False, 'error': 'Please login to use interaction checker', 'require_login': True}), 401
    
    try:
        data = request.get_json()
        medicines = [m.lower() for m in data.get('medicines', [])]
        
        if len(medicines) < 2:
            return jsonify({'success': True, 'interactions': []})
        
        interactions = []
        for i in range(len(medicines)):
            for j in range(i + 1, len(medicines)):
                pair = tuple(sorted([medicines[i], medicines[j]]))
                if pair in DRUG_INTERACTIONS:
                    interaction = DRUG_INTERACTIONS[pair].copy()
                    interaction['medicines'] = [medicines[i], medicines[j]]
                    interactions.append(interaction)
        
        return jsonify({'success': True, 'interactions': interactions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/assess-severity', methods=['POST'])
def assess_severity():
    """Assess symptom severity and provide urgency recommendation - Requires login"""
    # Require login for advanced features
    if 'user_email' not in session:
        return jsonify({'success': False, 'error': 'Please login to use severity assessment', 'require_login': True}), 401
    
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', '').lower()
        
        severity_score = {'severe': 0, 'moderate': 0, 'mild': 0}
        
        for severity, keywords in SEVERITY_INDICATORS.items():
            for keyword in keywords:
                if keyword in symptoms:
                    severity_score[severity] += 1
        
        # Determine overall severity
        if severity_score['severe'] > 0:
            level = 'severe'
            urgency = 'Seek immediate medical attention'
            color = 'danger'
        elif severity_score['moderate'] > severity_score['mild']:
            level = 'moderate'
            urgency = 'Consult a doctor soon'
            color = 'warning'
        else:
            level = 'mild'
            urgency = 'Self-care with OTC medication may be sufficient'
            color = 'success'
        
        return jsonify({
            'success': True,
            'severity': level,
            'urgency': urgency,
            'color': color,
            'details': severity_score
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/check-allergies', methods=['POST'])
def check_allergies():
    """Check if recommended medicines conflict with user allergies - Requires login"""
    # Require login for advanced features
    if 'user_email' not in session:
        return jsonify({'success': False, 'error': 'Please login to use allergy checker', 'require_login': True}), 401
    
    try:
        data = request.get_json()
        medicines = [m.lower() for m in data.get('medicines', [])]
        allergies = [a.lower().strip() for a in data.get('allergies', [])]
        
        conflicts = []
        for medicine in medicines:
            if medicine in COMMON_ALLERGIES:
                med_allergens = COMMON_ALLERGIES[medicine]
                for allergen in med_allergens:
                    for allergy in allergies:
                        if allergen.lower() in allergy or allergy in allergen.lower():
                            conflicts.append({
                                'medicine': MEDICINE_INFO[medicine]['name'],
                                'allergy': allergy,
                                'warning': f'You may be allergic to {MEDICINE_INFO[medicine]["name"]} due to {allergy} allergy'
                            })
        
        return jsonify({
            'success': True,
            'has_conflicts': len(conflicts) > 0,
            'conflicts': conflicts
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/predict', methods=['POST'])
def predict():
    """Predict medicines based on symptoms - Requires login"""
    # Require login for predictions
    if 'user_email' not in session:
        return jsonify({
            'success': False,
            'error': 'Please login to get medicine recommendations.',
            'require_login': True
        }), 401
    
    try:
        if model is None or tokenizer is None or medicine_list is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded. Please ensure all model files are present.'
            })

        # Get symptoms from request
        data = request.get_json()
        symptoms = data.get('symptoms', '')
        
        if not symptoms or symptoms.strip() == '':
            return jsonify({
                'success': False,
                'error': 'Please enter symptoms'
            })

        # Preprocess symptoms
        symptoms_lower = symptoms.lower().strip()
        
        # Tokenize and pad
        sequence = tokenizer.texts_to_sequences([symptoms_lower])
        padded_sequence = pad_sequences(sequence, maxlen=5)
        
        # Predict
        predictions = model.predict(padded_sequence, verbose=0)
        
        # Get predictions with threshold
        threshold = 0.5
        predicted_medicines = []
        
        for idx, prob in enumerate(predictions[0]):
            if prob > threshold:
                medicine_name = medicine_list[idx].lower()
                predicted_medicines.append({
                    'name': medicine_name,
                    'confidence': float(prob * 100),
                    'info': MEDICINE_INFO.get(medicine_name, {})
                })
        
        # Sort by confidence
        predicted_medicines.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Store in session for history
        if 'history' not in session:
            session['history'] = []
        
        consultation_data = {
            'symptoms': symptoms,
            'medicines': [m['name'] for m in predicted_medicines],
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        session['history'].append(consultation_data)
        
        # Save to user's MongoDB record
        try:
            User.add_consultation(session['user_email'], consultation_data)
        except Exception as db_error:
            print(f"Failed to save consultation to database: {db_error}")
        
        if len(predicted_medicines) == 0:
            return jsonify({
                'success': True,
                'medicines': [],
                'message': 'No specific medicine recommendation. Please consult a healthcare professional.'
            })
        
        return jsonify({
            'success': True,
            'medicines': predicted_medicines,
            'symptoms_analyzed': symptoms
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Prediction error: {str(e)}'
        })


@app.route('/about')
def about():
    """About page with research paper information"""
    return render_template('about.html')


@app.route('/health-tips')
def health_tips():
    """Health tips and medication guidelines"""
    return render_template('health_tips.html')


@app.route('/history')
def history():
    """Show user's consultation history - Requires login"""
    if 'user_email' not in session:
        return render_template('login.html')
    
    # Get user's consultation history from database
    user = User.find_by_email(session['user_email'])
    user_history = user.get('consultations', []) if user else []
    return render_template('history.html', history=user_history)


@app.route('/api/medicine-info/<medicine_name>')
def get_medicine_info(medicine_name):
    """API endpoint to get detailed medicine information"""
    medicine_data = MEDICINE_INFO.get(medicine_name.lower())
    if medicine_data:
        return jsonify({
            'success': True,
            'data': medicine_data
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Medicine information not found'
        })


@app.route('/clear-history', methods=['POST'])
def clear_history():
    """Clear user consultation history"""
    session.pop('history', None)
    return jsonify({'success': True})


@app.route('/medication-reminder', methods=['POST'])
def set_medication_reminder():
    """Set medication reminders for users"""
    if 'user_email' not in session:
        return jsonify({
            'success': False,
            'error': 'Please login to set reminders',
            'require_login': True
        }), 401
    
    try:
        data = request.get_json()
        medicine_name = data.get('medicine')
        time = data.get('time')
        frequency = data.get('frequency')
        
        # Store reminder in user's MongoDB record
        reminder_data = {
            'medicine': medicine_name,
            'time': time,
            'frequency': frequency,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # Add to user profile
        User.add_reminder(session['user_email'], reminder_data)
        
        return jsonify({
            'success': True,
            'message': f'Reminder set for {medicine_name} at {time}',
            'reminder': reminder_data
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/get-reminders', methods=['GET'])
def get_reminders():
    """Get user's medication reminders"""
    if 'user_email' not in session:
        return jsonify({
            'success': False,
            'error': 'Please login',
            'require_login': True
        }), 401
    
    try:
        user = User.find_by_email(session['user_email'])
        reminders = user.get('reminders', []) if user else []
        
        return jsonify({
            'success': True,
            'reminders': reminders
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/symptom-suggestions', methods=['GET'])
def symptom_suggestions():
    """Get AI-powered symptom suggestions based on partial input"""
    query = request.args.get('q', '').lower()
    
    if not query or len(query) < 2:
        return jsonify({'suggestions': []})
    
    # Common symptoms database
    common_symptoms = [
        'fever', 'headache', 'cough', 'cold', 'sore throat', 'body ache', 'fatigue',
        'nausea', 'vomiting', 'diarrhea', 'stomach pain', 'chest pain', 'back pain',
        'dizziness', 'shortness of breath', 'runny nose', 'sneezing', 'watery eyes',
        'muscle pain', 'joint pain', 'chills', 'sweating', 'loss of appetite',
        'constipation', 'bloating', 'heartburn', 'rash', 'itching', 'swelling',
        'ear ache', 'toothache', 'jaw pain', 'neck pain', 'shoulder pain',
        'weakness', 'confusion', 'insomnia', 'anxiety', 'depression'
    ]
    
    # Filter symptoms that match query
    suggestions = [s for s in common_symptoms if query in s][:10]
    
    return jsonify({'suggestions': suggestions})


@app.route('/emergency-contacts', methods=['GET'])
def emergency_contacts():
    """Get emergency contact information"""
    contacts = {
        'ambulance': '108',
        'police': '100',
        'fire': '101',
        'women_helpline': '1091',
        'child_helpline': '1098',
        'poison_control': '1800-110-113',
        'mental_health': '9152987821',
        'covid_helpline': '1075'
    }
    
    return jsonify({'success': True, 'contacts': contacts})


# Error handlers
@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404


@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500


if __name__ == '__main__':
    # Ensure required files exist
    required_files = ['medicine_model.h5', 'tokenizer.pkl', 'medicine_labels.pkl']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print(f"⚠ Warning: Missing files: {', '.join(missing_files)}")
        print("Please run the Jupyter notebook to generate these files first.")
    
    print("\n" + "="*70)
    print("  MediFlex - Smart Medication System")
    print("="*70 + "\n")
    print("🏥 Server starting on http://localhost:5000")
    print("📱 Access from mobile: http://<your-ip>:5000")
    print("\n⚕️  AI-Powered Healthcare Solution\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)

