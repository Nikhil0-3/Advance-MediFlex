// Global Variables
let selectedSymptoms = new Set();
let currentRecommendations = [];
let darkMode = localStorage.getItem('darkMode') === 'true';

// Initialize theme on load
document.addEventListener('DOMContentLoaded', function() {
    if (darkMode) {
        document.body.classList.add('dark-mode');
        updateThemeIcon();
    }
});

// Toggle theme
function toggleTheme() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', darkMode);
    updateThemeIcon();
    showToast(darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'success');
}

function updateThemeIcon() {
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = darkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Toggle advanced options
function toggleAdvancedOptions() {
    const panel = document.getElementById('advancedOptions');
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    
    if (isHidden) {
        panel.classList.add('slide-in');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
    toast.className = `toast toast-${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Add symptom to textarea
function addSymptom(symptom) {
    const textarea = document.getElementById('symptomInput');
    const currentValue = textarea.value.trim();
    
    if (currentValue === '') {
        textarea.value = symptom;
    } else {
        const symptoms = currentValue.split(',').map(s => s.trim()).filter(s => s !== '');
        if (!symptoms.includes(symptom)) {
            symptoms.push(symptom);
            textarea.value = symptoms.join(', ');
        }
    }
    
    // Add visual feedback
    event.target.style.background = '#10b981';
    event.target.style.color = 'white';
    event.target.style.borderColor = '#10b981';
    
    setTimeout(() => {
        event.target.style.background = '';
        event.target.style.color = '';
        event.target.style.borderColor = '';
    }, 500);
}

// Clear symptoms
function clearSymptoms() {
    document.getElementById('symptomInput').value = '';
    document.getElementById('resultsSection').style.display = 'none';
    selectedSymptoms.clear();
    
    // Reset all symptom tag styles
    const tags = document.querySelectorAll('.symptom-tag');
    tags.forEach(tag => {
        tag.style.background = '';
        tag.style.color = '';
        tag.style.borderColor = '';
    });
}

// Analyze symptoms
async function analyzeSymptoms() {
    const symptomsInput = document.getElementById('symptomInput').value.trim();
    
    if (symptomsInput === '') {
        showToast('Please enter symptoms', 'error');
        return;
    }
    
    // Show loading
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    
    // Try to fetch user profile for auto-fill age/weight
    try {
        const profileResponse = await fetch('/auth/get-user-profile');
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.success && profileData.profile) {
                // Auto-fill age and weight if not already filled
                const ageInput = document.getElementById('ageInput');
                const weightInput = document.getElementById('weightInput');
                
                if (ageInput && !ageInput.value && profileData.profile.age) {
                    ageInput.value = profileData.profile.age;
                }
                if (weightInput && !weightInput.value && profileData.profile.weight) {
                    weightInput.value = profileData.profile.weight;
                }
                
                // Auto-fill allergies if not already filled
                const allergiesInput = document.getElementById('allergiesInput');
                if (allergiesInput && !allergiesInput.value && profileData.profile.allergies?.length > 0) {
                    allergiesInput.value = profileData.profile.allergies.join(', ');
                }
            }
        }
    } catch (error) {
        console.log('Could not fetch user profile');
    }
    
    try {
        // First, assess severity
        const severityResponse = await fetch('/assess-severity', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({symptoms: symptomsInput})
        });
        const severityData = await severityResponse.json();
        
        // Handle login requirement for severity assessment
        if (severityData.require_login) {
            document.getElementById('loadingSection').style.display = 'none';
            showToast(severityData.error, 'warning');
            setTimeout(() => {
                window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
            }, 1500);
            return;
        }
        
        // Then get medicine predictions
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({symptoms: symptomsInput})
        });
        
        const data = await response.json();
        
        // Hide loading
        document.getElementById('loadingSection').style.display = 'none';
        
        // Handle login requirement for predictions
        if (data.require_login) {
            showToast(data.error, 'warning');
            setTimeout(() => {
                window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
            }, 2000);
            return;
        }
        
        if (data.success) {
            currentRecommendations = data.medicines;
            await displayResults(data, severityData);
            
            // Check allergies if provided
            const allergies = document.getElementById('allergiesInput')?.value.trim();
            if (allergies) {
                await checkAllergies(data.medicines, allergies);
            }
            
            // Check drug interactions
            if (data.medicines.length > 1) {
                await checkInteractions(data.medicines);
            }
        } else {
            showToast(data.error || 'An error occurred', 'error');
        }
        
    } catch (error) {
        document.getElementById('loadingSection').style.display = 'none';
        showToast('Network error. Please try again.', 'error');
        console.error('Error:', error);
    }
}

// Check allergies
async function checkAllergies(medicines, allergies) {
    try {
        const response = await fetch('/check-allergies', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                medicines: medicines.map(m => m.name),
                allergies: allergies.split(',').map(a => a.trim())
            })
        });
        
        const data = await response.json();
        
        // Handle login requirement
        if (data.require_login) {
            showToast(data.error, 'warning');
            setTimeout(() => {
                window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
            }, 1500);
            return;
        }
        
        if (data.success && data.has_conflicts) {
            const warningDiv = document.getElementById('allergyWarnings');
            const detailsDiv = document.getElementById('allergyDetails');
            
            let html = '<ul>';
            data.conflicts.forEach(conflict => {
                html += `<li><strong>${conflict.medicine}:</strong> ${conflict.warning}</li>`;
            });
            html += '</ul>';
            
            detailsDiv.innerHTML = html;
            warningDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Allergy check error:', error);
    }
}

// Check drug interactions
async function checkInteractions(medicines) {
    try {
        const response = await fetch('/check-interactions', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                medicines: medicines.map(m => m.name)
            })
        });
        
        const data = await response.json();
        
        // Handle login requirement
        if (data.require_login) {
            showToast(data.error, 'warning');
            setTimeout(() => {
                window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
            }, 1500);
            return;
        }
        
        if (data.success && data.interactions.length > 0) {
            const warningDiv = document.getElementById('interactionWarnings');
            const detailsDiv = document.getElementById('interactionDetails');
            
            let html = '<ul>';
            data.interactions.forEach(interaction => {
                const severityClass = interaction.severity === 'severe' ? 'danger' : 
                                     interaction.severity === 'moderate' ? 'warning' : 'info';
                html += `<li class="severity-${severityClass}">
                    <strong>${interaction.medicines.join(' + ')}:</strong> ${interaction.warning}<br>
                    <em>Recommendation: ${interaction.recommendation}</em>
                </li>`;
            });
            html += '</ul>';
            
            detailsDiv.innerHTML = html;
            warningDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Interaction check error:', error);
    }
}

// Display results
async function displayResults(data, severityData) {
    const resultsSection = document.getElementById('resultsSection');
    const medicineResults = document.getElementById('medicineResults');
    const analyzedSymptoms = document.getElementById('analyzedSymptoms');
    const severityBadge = document.getElementById('severityBadge');
    
    analyzedSymptoms.textContent = `Based on symptoms: ${data.symptoms_analyzed}`;
    
    // Display severity
    if (severityData && severityData.success) {
        severityBadge.innerHTML = `
            <span class="badge badge-${severityData.color}">
                <i class="fas fa-heartbeat"></i> Severity: ${severityData.severity.toUpperCase()}
            </span>
            <span class="urgency-text">${severityData.urgency}</span>
        `;
        severityBadge.style.display = 'block';
    }
    
    if (data.medicines && data.medicines.length > 0) {
        let html = '';
        
        data.medicines.forEach((medicine, index) => {
            html += createMedicineCard(medicine, index);
        });
        
        medicineResults.innerHTML = html;
        resultsSection.style.display = 'block';
        
        // Smooth scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        medicineResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-info-circle"></i>
                <h3>No Specific Recommendation</h3>
                <p>${data.message || 'Please consult a healthcare professional for proper diagnosis and treatment.'}</p>
            </div>
        `;
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Dosage calculator modal
function showDosageCalculator() {
    if (currentRecommendations.length === 0) {
        showToast('No medicines to calculate dosage for', 'warning');
        return;
    }
    
    const modal = document.getElementById('dosageModal');
    const content = document.getElementById('dosageCalculatorContent');
    
    const age = document.getElementById('ageInput')?.value || '';
    const weight = document.getElementById('weightInput')?.value || '';
    
    let html = `
        <div class="dosage-form">
            <div class="form-group">
                <label>Age (years):</label>
                <input type="number" id="modalAge" value="${age}" min="0" max="120" class="form-input">
            </div>
            <div class="form-group">
                <label>Weight (kg):</label>
                <input type="number" id="modalWeight" value="${weight}" min="0" max="300" step="0.1" class="form-input">
            </div>
            <div class="form-group">
                <label>Select Medicine:</label>
                <select id="selectedMedicine" class="form-input">
                    ${currentRecommendations.map(m => `<option value="${m.name}">${m.info.name || m.name}</option>`).join('')}
                </select>
            </div>
            <button onclick="calculateDosage()" class="btn btn-primary">
                <i class="fas fa-calculator"></i> Calculate Dosage
            </button>
        </div>
        <div id="dosageResult" class="dosage-result"></div>
    `;
    
    content.innerHTML = html;
    modal.style.display = 'flex';
}

function closeDosageModal() {
    document.getElementById('dosageModal').style.display = 'none';
}

async function calculateDosage() {
    const age = document.getElementById('modalAge').value;
    const weight = document.getElementById('modalWeight').value;
    const medicine = document.getElementById('selectedMedicine').value;
    
    if (!age || !weight) {
        showToast('Please enter age and weight', 'error');
        return;
    }
    
    try {
        const response = await fetch('/calculate-dosage', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({medicine, age, weight})
        });
        
        const data = await response.json();
        
        // Handle login requirement
        if (data.require_login) {
            showToast(data.error, 'warning');
            setTimeout(() => {
                window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
            }, 1500);
            return;
        }
        
        if (data.success) {
            const resultDiv = document.getElementById('dosageResult');
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <h4><i class="fas fa-check-circle"></i> ${data.dosage.medicine}</h4>
                    <p><strong>Recommended Dosage:</strong> ${data.dosage.recommendation}</p>
                    ${data.dosage.note ? `<p><em>${data.dosage.note}</em></p>` : ''}
                    <p class="age-group-badge">Age Group: <span class="badge badge-info">${data.dosage.age_group}</span></p>
                </div>
            `;
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Calculation error. Please try again.', 'error');
    }
}

// Export report
async function exportReport() {
    if (currentRecommendations.length === 0) {
        showToast('No recommendations to export', 'warning');
        return;
    }
    
    const symptoms = document.getElementById('symptomInput').value;
    const date = new Date().toLocaleString();
    const age = document.getElementById('ageInput')?.value || 'Not specified';
    const weight = document.getElementById('weightInput')?.value || 'Not specified';
    
    // Fetch user profile for personalized dosage
    let userProfile = null;
    try {
        const response = await fetch('/auth/get-user-profile');
        if (response.ok) {
            const data = await response.json();
            userProfile = data.profile;
        }
    } catch (error) {
        console.log('Could not fetch user profile');
    }
    
    // Use profile data or form data
    const patientAge = userProfile?.age || age;
    const patientWeight = userProfile?.weight || weight;
    
    let report = `MEDIFLEX - PERSONALIZED CONSULTATION REPORT\n`;
    report += `${'='.repeat(70)}\n\n`;
    report += `Date: ${date}\n`;
    report += `Symptoms: ${symptoms}\n`;
    if (patientAge !== 'Not specified') report += `Patient Age: ${patientAge} years\n`;
    if (patientWeight !== 'Not specified') report += `Patient Weight: ${patientWeight} kg\n`;
    report += `\n`;
    report += `RECOMMENDED MEDICINES:\n`;
    report += `${'-'.repeat(70)}\n\n`;
    
    currentRecommendations.forEach((med, idx) => {
        report += `${idx + 1}. ${med.info.name || med.name}\n`;
        report += `   Confidence: ${med.confidence.toFixed(1)}%\n`;
        report += `   Category: ${med.info.category}\n`;
        report += `   Usage: ${med.info.usage}\n`;
        
        // Calculate personalized dosage
        const dosageInfo = calculatePersonalizedDosage(med.info, patientAge, patientWeight);
        report += `   Dosage: ${dosageInfo.dosage}\n`;
        report += `   Duration: ${dosageInfo.duration}\n`;
        report += `   Frequency: ${dosageInfo.frequency}\n`;
        report += `   Total Tablets Needed: ${dosageInfo.totalTablets} tablets\n`;
        
        report += `   Precautions:\n`;
        med.info.precautions.forEach(p => report += `   - ${p}\n`);
        
        if (dosageInfo.ageWarning) {
            report += `   ⚠️  AGE WARNING: ${dosageInfo.ageWarning}\n`;
        }
        report += `\n`;
    });
    
    report += `\n${'='.repeat(70)}\n`;
    report += `IMPORTANT NOTES:\n`;
    report += `- This prescription is personalized based on provided age and weight\n`;
    report += `- Take medicines exactly as prescribed\n`;
    report += `- Complete the full course even if you feel better\n`;
    report += `- Store medicines in a cool, dry place\n`;
    report += `\n`;
    report += `DISCLAIMER: This is an AI-based recommendation. Please consult a\n`;
    report += `qualified healthcare professional before taking any medication.\n`;
    report += `Always inform your doctor about existing medical conditions and allergies.\n`;
    
    // Create and download file
    const blob = new Blob([report], {type: 'text/plain'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediFlex_Prescription_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Personalized prescription downloaded successfully!', 'success');
}

// Calculate personalized dosage based on age and weight
function calculatePersonalizedDosage(medicineInfo, age, weight) {
    const medicineName = medicineInfo.name || '';
    let dosage = medicineInfo.dosage || 'As directed';
    let frequency = 'Twice daily';
    let duration = '5-7 days';
    let daysCount = 7;
    let timesPerDay = 2;
    let ageWarning = null;
    
    // Age-based adjustments
    if (age !== 'Not specified') {
        const ageNum = parseInt(age);
        
        if (ageNum < 12) {
            ageWarning = 'Pediatric dose required. Consult pediatrician before use.';
            dosage = dosage.replace(/500mg|650mg/g, '250mg');
            frequency = 'Twice daily (with 8-hour gap)';
        } else if (ageNum >= 12 && ageNum < 18) {
            dosage = dosage.replace(/650mg/g, '500mg');
            frequency = 'Twice daily';
        } else if (ageNum >= 65) {
            ageWarning = 'Elderly patient. Monitor for side effects. Consider reduced dose.';
            frequency = 'Twice daily (start with lower dose)';
        }
    }
    
    // Medicine-specific dosage calculations
    if (medicineName.toLowerCase().includes('paracetamol')) {
        frequency = 'Three times daily (every 6-8 hours)';
        timesPerDay = 3;
        duration = '3-5 days';
        daysCount = 5;
    } else if (medicineName.toLowerCase().includes('cetirizine')) {
        frequency = 'Once daily (preferably at bedtime)';
        timesPerDay = 1;
        duration = '5-7 days';
        daysCount = 7;
    } else if (medicineName.toLowerCase().includes('azithromycin')) {
        frequency = 'Once daily (same time each day)';
        timesPerDay = 1;
        duration = '3-5 days (complete course)';
        daysCount = 5;
    } else if (medicineName.toLowerCase().includes('diclofenac')) {
        frequency = 'Twice daily (after meals)';
        timesPerDay = 2;
        duration = '5-7 days';
        daysCount = 7;
    } else if (medicineName.toLowerCase().includes('aciloc') || medicineName.toLowerCase().includes('omeprazole')) {
        frequency = 'Twice daily (30 min before meals)';
        timesPerDay = 2;
        duration = '7-14 days';
        daysCount = 14;
    }
    
    // Calculate total tablets needed
    const totalTablets = Math.ceil(daysCount * timesPerDay);
    
    return {
        dosage: dosage,
        frequency: frequency,
        duration: duration,
        totalTablets: totalTablets,
        ageWarning: ageWarning
    };
}

// Toggle medicine details
function toggleMedicineDetails(cardId) {
    const card = document.getElementById(cardId);
    const details = card.querySelector('.medicine-details');
    const icon = card.querySelector('.expand-icon');
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
        card.classList.add('expanded');
    } else {
        details.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
        card.classList.remove('expanded');
    }
}

// Create medicine card HTML
function createMedicineCard(medicine, index) {
    const info = medicine.info || {};
    const confidenceClass = medicine.confidence >= 90 ? 'high' : medicine.confidence >= 70 ? 'medium' : 'low';
    const cardId = `medicine-${index}`;
    
    // Get age and weight for personalized dosage
    const age = document.getElementById('ageInput')?.value || 'Not specified';
    const weight = document.getElementById('weightInput')?.value || 'Not specified';
    const dosageInfo = calculatePersonalizedDosage(info, age, weight);
    
    return `
        <div class="medicine-card" id="${cardId}">
            <div class="medicine-header" onclick="toggleMedicineDetails('${cardId}')">
                <div>
                    <h3 class="medicine-name">
                        <i class="fas fa-pills"></i> ${info.name || medicine.name}
                    </h3>
                    ${info.category ? `<span class="medicine-category"><i class="fas fa-tag"></i> ${info.category}</span>` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="confidence-badge ${confidenceClass}">
                        <i class="fas fa-chart-line"></i> ${medicine.confidence.toFixed(1)}%
                    </div>
                    <i class="fas fa-chevron-down expand-icon"></i>
                </div>
            </div>
            
            <div class="medicine-details" style="display: none;">
                ${dosageInfo.ageWarning ? `
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; margin-bottom: 1rem; border-radius: 0.5rem;">
                    <strong><i class="fas fa-exclamation-triangle"></i> Important:</strong> ${dosageInfo.ageWarning}
                </div>
                ` : ''}
                
                ${info.usage ? `
                <div class="info-section">
                    <h4><i class="fas fa-info-circle"></i> Usage</h4>
                    <p>${info.usage}</p>
                </div>
                ` : ''}
                
                <div class="info-section" style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 1rem; border-radius: 0.5rem; border: 2px solid var(--primary-color);">
                    <h4><i class="fas fa-prescription"></i> Personalized Dosage Plan</h4>
                    <div style="display: grid; gap: 0.75rem; margin-top: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: white; border-radius: 0.25rem;">
                            <strong>Dosage:</strong>
                            <span>${dosageInfo.dosage}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: white; border-radius: 0.25rem;">
                            <strong>Frequency:</strong>
                            <span>${dosageInfo.frequency}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: white; border-radius: 0.25rem;">
                            <strong>Duration:</strong>
                            <span>${dosageInfo.duration}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--success-color); color: white; border-radius: 0.25rem; font-weight: 600;">
                            <strong>Total Tablets Needed:</strong>
                            <span>${dosageInfo.totalTablets} tablets</span>
                        </div>
                    </div>
                </div>
                
                ${info.precautions && info.precautions.length > 0 ? `
                <div class="info-section">
                    <h4><i class="fas fa-exclamation-triangle"></i> Precautions</h4>
                    <ul>
                        ${info.precautions.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${info.side_effects && info.side_effects.length > 0 ? `
                <div class="info-section">
                    <h4><i class="fas fa-heartbeat"></i> Possible Side Effects</h4>
                    <ul>
                        ${info.side_effects.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'error' ? 'fa-exclamation-circle' : 
                 type === 'success' ? 'fa-check-circle' : 
                 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Add notification styles dynamically
const notificationStyles = `
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 1rem;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 9999;
        min-width: 300px;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-error {
        border-left: 5px solid #ef4444;
    }
    
    .notification-error i {
        color: #ef4444;
        font-size: 1.5rem;
    }
    
    .notification-success {
        border-left: 5px solid #10b981;
    }
    
    .notification-success i {
        color: #10b981;
        font-size: 1.5rem;
    }
    
    .notification-info {
        border-left: 5px solid #3b82f6;
    }
    
    .notification-info i {
        color: #3b82f6;
        font-size: 1.5rem;
    }
    
    .no-results {
        text-align: center;
        padding: 3rem;
        background: white;
        border-radius: 1rem;
    }
    
    .no-results i {
        font-size: 4rem;
        color: #f59e0b;
        margin-bottom: 1rem;
    }
    
    .no-results h3 {
        font-size: 1.75rem;
        color: #1f2937;
        margin-bottom: 1rem;
    }
    
    .no-results p {
        color: #6b7280;
        font-size: 1.1rem;
    }
    
    .confidence-badge.high {
        background: #10b981;
    }
    
    .confidence-badge.medium {
        background: #f59e0b;
    }
    
    .confidence-badge.low {
        background: #ef4444;
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Keyboard shortcuts
document.getElementById('symptomInput').addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        analyzeSymptoms();
    }
});

// Auto-resize textarea
document.getElementById('symptomInput').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Page load animation
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

console.log('%c💊 MediFlex ', 'background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; font-size: 16px; font-weight: bold');
console.log('%cSmart Medication System - AI-Powered Healthcare', 'color: #6b7280; font-size: 12px');


// ========== NEW FEATURES ==========

// Symptom Auto-suggestions
let suggestionTimeout;
function setupSymptomSuggestions() {
    const input = document.getElementById('symptomInput');
    if (!input) return;
    
    input.addEventListener('input', function(e) {
        clearTimeout(suggestionTimeout);
        suggestionTimeout = setTimeout(async () => {
            const query = e.target.value.split(',').pop().trim();
            
            if (query.length < 2) {
                hideSuggestions();
                return;
            }
            
            try {
                const response = await fetch(`/symptom-suggestions?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.suggestions && data.suggestions.length > 0) {
                    showSuggestions(data.suggestions);
                } else {
                    hideSuggestions();
                }
            } catch (error) {
                console.error('Suggestions error:', error);
            }
        }, 300);
    });
}

function showSuggestions(suggestions) {
    let suggestionBox = document.getElementById('symptomSuggestions');
    
    if (!suggestionBox) {
        suggestionBox = document.createElement('div');
        suggestionBox.id = 'symptomSuggestions';
        suggestionBox.className = 'symptom-suggestions';
        document.getElementById('symptomInput').parentNode.appendChild(suggestionBox);
    }
    
    suggestionBox.innerHTML = suggestions.map(s => 
        `<div class="suggestion-item" onclick="selectSuggestion('${s}')">${s}</div>`
    ).join('');
    suggestionBox.style.display = 'block';
}

function hideSuggestions() {
    const suggestionBox = document.getElementById('symptomSuggestions');
    if (suggestionBox) {
        suggestionBox.style.display = 'none';
    }
}

function selectSuggestion(suggestion) {
    const input = document.getElementById('symptomInput');
    const parts = input.value.split(',');
    parts[parts.length - 1] = ' ' + suggestion;
    input.value = parts.join(',');
    hideSuggestions();
    input.focus();
}

// Medication Reminders
async function setMedicationReminder(medicineName) {
    const time = prompt('Enter reminder time (HH:MM format, e.g., 09:00):');
    const frequency = prompt('How many times per day? (1-4):');
    
    if (!time || !frequency) {
        showToast('Reminder cancelled', 'info');
        return;
    }
    
    try {
        const response = await fetch('/medication-reminder', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                medicine: medicineName,
                time: time,
                frequency: frequency
            })
        });
        
        const data = await response.json();
        
        if (data.require_login) {
            showToast(data.error, 'warning');
            setTimeout(() => {
                window.location.href = '/auth/login';
            }, 1500);
            return;
        }
        
        if (data.success) {
            showToast(data.message, 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to set reminder', 'error');
    }
}

// Emergency Contacts
async function showEmergencyContacts() {
    try {
        const response = await fetch('/emergency-contacts');
        const data = await response.json();
        
        if (data.success) {
            const modal = document.createElement('div');
            modal.className = 'emergency-modal';
            modal.innerHTML = `
                <div class="emergency-modal-content">
                    <div class="emergency-modal-header">
                        <h3><i class="fas fa-phone-alt"></i> Emergency Contacts</h3>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">&times;</button>
                    </div>
                    <div class="emergency-modal-body">
                        <div class="emergency-contacts-grid">
                            <div class="emergency-contact">
                                <i class="fas fa-ambulance"></i>
                                <strong>Ambulance</strong>
                                <a href="tel:${data.contacts.ambulance}">${data.contacts.ambulance}</a>
                            </div>
                            <div class="emergency-contact">
                                <i class="fas fa-shield-alt"></i>
                                <strong>Police</strong>
                                <a href="tel:${data.contacts.police}">${data.contacts.police}</a>
                            </div>
                            <div class="emergency-contact">
                                <i class="fas fa-fire"></i>
                                <strong>Fire</strong>
                                <a href="tel:${data.contacts.fire}">${data.contacts.fire}</a>
                            </div>
                            <div class="emergency-contact">
                                <i class="fas fa-biohazard"></i>
                                <strong>Poison Control</strong>
                                <a href="tel:${data.contacts.poison_control}">${data.contacts.poison_control}</a>
                            </div>
                            <div class="emergency-contact">
                                <i class="fas fa-brain"></i>
                                <strong>Mental Health</strong>
                                <a href="tel:${data.contacts.mental_health}">${data.contacts.mental_health}</a>
                            </div>
                            <div class="emergency-contact">
                                <i class="fas fa-virus"></i>
                                <strong>COVID Helpline</strong>
                                <a href="tel:${data.contacts.covid_helpline}">${data.contacts.covid_helpline}</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    } catch (error) {
        showToast('Failed to load emergency contacts', 'error');
    }
}

// Initialize new features on page load
document.addEventListener('DOMContentLoaded', function() {
    setupSymptomSuggestions();
});
