from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from flask_mail import Message
from functools import wraps
from models import User
import requests
import json

auth_bp = Blueprint('auth', __name__)

def login_required(f):
    """Decorator to require login for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_email' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/login', methods=['GET'])
def login():
    """Display login/signup page"""
    if 'user_email' in session:
        return redirect(url_for('home'))
    return render_template('login.html')

@auth_bp.route('/login', methods=['POST'])
def login_post():
    """Handle login request"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password required'}), 400
    
    # Verify credentials
    user = User.find_by_email(email)
    if not user:
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
    
    if not User.verify_password(email, password):
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
    
    if not user.get('verified', False):
        return jsonify({'success': False, 'message': 'Please verify your email first', 'needs_verification': True}), 401
    
    # Set session
    session['user_email'] = email
    session['user_name'] = user.get('name')
    session.permanent = True
    
    return jsonify({'success': True, 'message': 'Login successful'})

@auth_bp.route('/signup', methods=['POST'])
def signup_post():
    """Handle signup request"""
    data = request.get_json()
    email = data.get('email')
    name = data.get('name')
    password = data.get('password')
    
    if not email or not name or not password:
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    # Validate password strength
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
    
    # Check if user exists
    existing_user = User.find_by_email(email)
    if existing_user:
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    
    # Create user
    user = User.create_user(email, name, password)
    if not user:
        return jsonify({'success': False, 'message': 'Failed to create account'}), 500
    
    # Generate and send OTP
    otp = User.generate_otp()
    User.set_otp(email, otp)
    
    # Send OTP email
    try:
        from app import mail
        msg = Message(
            subject='MediFlex - Email Verification',
            recipients=[email],
            html=render_template('email_verification.html', name=name, otp=otp)
        )
        mail.send(msg)
    except Exception as e:
        print(f"Email sending failed: {e}")
        # Continue anyway - user can request resend
    
    return jsonify({
        'success': True, 
        'message': 'Account created! Please check your email for verification code.',
        'email': email
    })

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP code"""
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    
    if not email or not otp:
        return jsonify({'success': False, 'message': 'Email and OTP required'}), 400
    
    if User.verify_otp(email, otp):
        # Auto-login after verification
        user = User.find_by_email(email)
        session['user_email'] = email
        session['user_name'] = user.get('name')
        session.permanent = True
        
        return jsonify({'success': True, 'message': 'Email verified successfully!'})
    else:
        return jsonify({'success': False, 'message': 'Invalid or expired OTP'}), 400

@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend OTP code"""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'success': False, 'message': 'Email required'}), 400
    
    user = User.find_by_email(email)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    if user.get('verified'):
        return jsonify({'success': False, 'message': 'Email already verified'}), 400
    
    # Generate and send new OTP
    otp = User.generate_otp()
    User.set_otp(email, otp)
    
    try:
        from app import mail
        msg = Message(
            subject='MediFlex - Email Verification',
            recipients=[email],
            html=render_template('email_verification.html', name=user.get('name'), otp=otp)
        )
        mail.send(msg)
        return jsonify({'success': True, 'message': 'New OTP sent to your email'})
    except Exception as e:
        print(f"Email sending failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to send email'}), 500

@auth_bp.route('/google-login')
def google_login():
    """Initiate Google OAuth login"""
    from config import Config
    
    # Google OAuth 2.0 configuration
    google_provider_cfg = requests.get(Config.GOOGLE_DISCOVERY_URL).json()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]
    
    redirect_uri = f"{Config.BASE_URL}/auth/google/callback"
    
    # Build authorization URL
    params = {
        'client_id': Config.GOOGLE_CLIENT_ID,
        'redirect_uri': redirect_uri,
        'scope': 'openid email profile',
        'response_type': 'code',
        'access_type': 'offline',
        'prompt': 'select_account'
    }
    
    auth_url = f"{authorization_endpoint}?" + "&".join([f"{k}={v}" for k, v in params.items()])
    return redirect(auth_url)

@auth_bp.route('/google/callback')
def google_callback():
    """Handle Google OAuth callback"""
    from config import Config
    
    code = request.args.get('code')
    if not code:
        flash('Google login failed', 'error')
        return redirect(url_for('auth.login'))
    
    try:
        # Get tokens
        google_provider_cfg = requests.get(Config.GOOGLE_DISCOVERY_URL).json()
        token_endpoint = google_provider_cfg["token_endpoint"]
        
        token_data = {
            'code': code,
            'client_id': Config.GOOGLE_CLIENT_ID,
            'client_secret': Config.GOOGLE_CLIENT_SECRET,
            'redirect_uri': f"{Config.BASE_URL}/auth/google/callback",
            'grant_type': 'authorization_code'
        }
        
        token_response = requests.post(token_endpoint, data=token_data)
        tokens = token_response.json()
        
        # Get user info
        userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
        headers = {'Authorization': f'Bearer {tokens["access_token"]}'}
        user_info = requests.get(userinfo_endpoint, headers=headers).json()
        
        email = user_info.get('email')
        name = user_info.get('name')
        google_id = user_info.get('sub')
        
        # Check if user exists
        user = User.find_by_email(email)
        if not user:
            # Create new user
            user = User.create_user(email, name, google_id=google_id)
        
        # Set session
        session['user_email'] = email
        session['user_name'] = name
        session.permanent = True
        
        flash('Successfully logged in with Google!', 'success')
        return redirect(url_for('home'))
        
    except Exception as e:
        print(f"Google OAuth error: {e}")
        flash('Google login failed', 'error')
        return redirect(url_for('auth.login'))

@auth_bp.route('/logout')
def logout():
    """Logout user"""
    session.clear()
    flash('Successfully logged out', 'success')
    return redirect(url_for('home'))

@auth_bp.route('/profile')
@login_required
def profile():
    """User profile page"""
    email = session.get('user_email')
    stats = User.get_user_stats(email)
    consultations = User.get_consultations(email, limit=10)
    
    return render_template('profile.html', stats=stats, consultations=consultations)

@auth_bp.route('/update-profile', methods=['POST'])
@login_required
def update_profile():
    """Update user profile"""
    data = request.get_json()
    email = session.get('user_email')
    
    profile_data = {
        'age': data.get('age'),
        'weight': data.get('weight'),
        'allergies': data.get('allergies', []),
        'medical_conditions': data.get('medical_conditions', [])
    }
    
    User.update_profile(email, profile_data)
    return jsonify({'success': True, 'message': 'Profile updated successfully'})

@auth_bp.route('/get-user-profile', methods=['GET'])
@login_required
def get_user_profile():
    """Get user profile data for prescription generation"""
    email = session.get('user_email')
    user = User.find_by_email(email)
    
    if user:
        return jsonify({
            'success': True,
            'profile': user.get('profile', {})
        })
    return jsonify({'success': False}), 404

