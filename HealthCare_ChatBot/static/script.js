const symptomList = [
    'itching', 'skin_rash', 'nodal_skin_eruptions', 'continuous_sneezing', 'shivering', 'chills', 'joint_pain',
    'stomach_pain', 'acidity', 'ulcers_on_tongue', 'muscle_wasting', 'vomiting', 'burning_micturition',
    'spotting_urination', 'fatigue', 'weight_gain', 'anxiety', 'cold_hands_and_feets', 'mood_swings',
    'weight_loss', 'restlessness', 'lethargy', 'patches_in_throat', 'irregular_sugar_level', 'cough',
    'high_fever', 'sunken_eyes', 'breathlessness', 'sweating', 'dehydration', 'indigestion', 'headache',
    'yellowish_skin', 'dark_urine', 'nausea', 'loss_of_appetite', 'pain_behind_the_eyes', 'back_pain',
    'constipation', 'abdominal_pain', 'diarrhoea', 'mild_fever', 'yellow_urine', 'yellowing_of_eyes',
    'acute_liver_failure', 'fluid_overload', 'swelling_of_stomach', 'swelled_lymph_nodes', 'malaise',
    'blurred_and_distorted_vision', 'phlegm', 'throat_irritation', 'redness_of_eyes', 'sinus_pressure',
    'runny_nose', 'congestion', 'chest_pain', 'weakness_in_limbs', 'fast_heart_rate',
    'pain_during_bowel_movements', 'pain_in_anal_region', 'bloody_stool', 'irritation_in_anus', 'neck_pain',
    'dizziness', 'cramps', 'bruising', 'obesity', 'swollen_legs', 'swollen_blood_vessels',
    'puffy_face_and_eyes', 'enlarged_thyroid', 'brittle_nails', 'swollen_extremeties', 'excessive_hunger',
    'extra_marital_contacts', 'drying_and_tingling_lips', 'slurred_speech', 'knee_pain', 'hip_joint_pain',
    'muscle_weakness', 'stiff_neck', 'swelling_joints', 'movement_stiffness', 'spinning_movements',
    'loss_of_balance', 'unsteadiness', 'weakness_of_one_body_side', 'loss_of_smell', 'bladder_discomfort',
    'foul_smell_of_urine', 'continuous_feel_of_urine', 'passage_of_gases', 'internal_itching',
    'toxic_look_typhos', 'depression', 'irritability', 'muscle_pain', 'altered_sensorium',
    'red_spots_over_body', 'belly_pain', 'abnormal_menstruation', 'dischromic_patches',
    'watering_from_eyes', 'increased_appetite', 'polyuria', 'family_history', 'mucoid_sputum',
    'rusty_sputum', 'lack_of_concentration', 'visual_disturbances', 'receiving_blood_transfusion',
    'receiving_unsterile_injections', 'coma', 'stomach_bleeding', 'distention_of_abdomen',
    'history_of_alcohol_consumption', 'fluid_overload', 'blood_in_sputum', 'prominent_veins_on_calf',
    'palpitations', 'painful_walking', 'pus_filled_pimples', 'blackheads', 'scurring', 'skin_peeling',
    'silver_like_dusting', 'small_dents_in_nails', 'inflammatory_nails', 'blister',
    'red_sore_around_nose', 'yellow_crust_ooze'
];

const exampleSymptoms = [
    'fever', 'cough', 'headache', 'stomach pain', 'fatigue', 'vomiting',
    'chest pain', 'dizziness', 'skin rash', 'joint pain', 'nausea', 'back pain'
];

let userName = '';
let awaitingSymptomConfirm = false;
let currentSymptomList = [];
let currentSymptomIndex = 0;
let answeredSymptoms = [];
let collectedSymptoms = [];
let userDays = 0;

function scrollToForm() {
    document.querySelector('.hero-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => document.getElementById('user-name-input').focus(), 600);
}

// Welcome screen
document.getElementById('start-chat-btn')?.addEventListener('click', startChat);
document.getElementById('user-name-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startChat();
});

function startChat() {
    const input = document.getElementById('user-name-input');
    const name = input.value.trim();
    if (name.length < 2) {
        input.style.border = '1px solid #ef4444';
        input.placeholder = 'Please enter at least 2 characters';
        setTimeout(() => { input.style.border = ''; }, 2000);
        return;
    }
    userName = name;
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('loading-overlay').classList.add('active');
    
    setTimeout(() => {
        document.getElementById('loading-overlay').classList.remove('active');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('sidebar-name').textContent = name.split(' ')[0];
        document.getElementById('sidebar-avatar').textContent = name.charAt(0).toUpperCase();
        initExampleChips();
        initSuggestionsGrid();
    }, 800);
}

// Chat functionality
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

sendBtn?.addEventListener('click', sendMessage);
chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    addMessage(msg, 'user');
    chatInput.value = '';

    if (awaitingSymptomConfirm) {
        return;
    }

    showTyping();
    fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
    })
    .then(r => r.json())
    .then(data => {
        removeTyping();
        if (data.type === 'symptom_confirm') {
            startSymptomConfirmation(data.symptoms);
            addMessage(data.reply, 'bot');
        } else {
            addMessage(data.reply, 'bot');
        }
    })
    .catch(() => {
        removeTyping();
        addMessage('Sorry, connection error. Please try again.', 'bot');
    });
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    if (sender === 'bot') {
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
    } else {
        avatar.innerHTML = `<i class="fas fa-user"></i>`;
    }

    const content = document.createElement('div');
    content.className = 'message-content';

    const p = document.createElement('p');
    p.textContent = text;
    content.appendChild(p);

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    content.appendChild(time);

    div.appendChild(avatar);
    div.appendChild(content);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
    const div = document.createElement('div');
    div.className = 'message bot-message';
    div.id = 'typing-indicator';
    div.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

// Symptom confirmation flow
function startSymptomConfirmation(symptoms) {
    awaitingSymptomConfirm = true;
    currentSymptomList = symptoms;
    currentSymptomIndex = 0;
    answeredSymptoms = [];
    collectedSymptoms = [];
    document.getElementById('chat-input').disabled = true;
    document.getElementById('send-btn').disabled = true;
    document.querySelectorAll('#chat-input, #send-btn').forEach(el => el.style.opacity = '0.5');
    askNextSymptom();
}

function askNextSymptom() {
    if (currentSymptomIndex >= currentSymptomList.length) {
        finishSymptomConfirmation();
        return;
    }

    const symptom = currentSymptomList[currentSymptomIndex];
    const container = document.getElementById('symptom-confirm');
    container.style.display = 'block';

    const progress = document.getElementById('symptom-progress');
    progress.innerHTML = `<div class="symptom-progress-bar" style="width:${(currentSymptomIndex / currentSymptomList.length) * 100}%"></div>`;

    document.getElementById('symptom-question').innerHTML =
        `<i class="fas fa-question-circle"></i> Are you suffering from <strong>${symptom.replace(/_/g, ' ')}</strong>?`;

    document.getElementById('btn-yes').onclick = () => answerSymptom(symptom, 'yes');
    document.getElementById('btn-no').onclick = () => answerSymptom(symptom, 'no');
}

function answerSymptom(symptom, answer) {
    answeredSymptoms.push(symptom);
    if (answer === 'yes') {
        collectedSymptoms.push(symptom);
        addMessage(`Yes, I have ${symptom.replace(/_/g, ' ')}`, 'user');
    } else {
        addMessage(`No, I don't have ${symptom.replace(/_/g, ' ')}`, 'user');
    }

    currentSymptomIndex++;
    if (currentSymptomIndex >= currentSymptomList.length) {
        document.getElementById('symptom-confirm').style.display = 'none';
        finishSymptomConfirmation();
    } else {
        askNextSymptom();
    }
}

function finishSymptomConfirmation() {
    document.getElementById('symptom-confirm').style.display = 'none';
    askDays();
}

function askDays() {
    const msgBox = document.getElementById('symptom-confirm');
    msgBox.style.display = 'block';
    document.getElementById('symptom-progress').innerHTML =
        `<div class="symptom-progress-bar" style="width:100%"></div>`;
    document.getElementById('symptom-question').innerHTML =
        `<i class="fas fa-calendar-alt"></i> Since how many days have you been experiencing these symptoms?`;

    const btnContainer = document.querySelector('.symptom-buttons');
    btnContainer.innerHTML = `
        <input type="number" id="days-input" min="1" placeholder="Enter number of days" style="
            flex:1; padding:10px 14px; border:2px solid #e2e8f0; border-radius:10px; font-size:14px;
            font-family:'Inter',sans-serif; outline:none;
        ">
        <button class="btn-yes" id="days-submit" style="padding:10px 24px;">
            <i class="fas fa-check"></i> Submit
        </button>
    `;

    document.getElementById('days-input').focus();
    document.getElementById('days-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitDays();
    });
    document.getElementById('days-submit').addEventListener('click', submitDays);
}

function submitDays() {
    const input = document.getElementById('days-input');
    const days = parseInt(input.value);
    if (!days || days < 1) {
        input.style.border = '2px solid #ef4444';
        return;
    }
    userDays = days;
    addMessage(`Since ${days} day${days > 1 ? 's' : ''}`, 'user');
    document.getElementById('symptom-confirm').style.display = 'none';

    const payload = { symptoms: [...collectedSymptoms], days: userDays };
    collectedSymptoms = [];
    currentSymptomList = [];

    awaitingSymptomConfirm = false;
    document.getElementById('chat-input').disabled = false;
    document.getElementById('send-btn').disabled = false;
    document.querySelectorAll('#chat-input, #send-btn').forEach(el => el.style.opacity = '1');

    showTyping();
    fetch('/api/symptom-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => {
        if (!r.ok) throw new Error('Server error');
        return r.json();
    })
    .then(data => {
        removeTyping();
        if (data.type === 'result' || data.type === 'bot') {
            addMessage(data.reply, 'bot');
            if (data.maps_url) {
                addMapsButton();
            }
        }
    })
    .catch(() => {
        removeTyping();
        addMessage('Diagnosis complete. Based on your symptoms, please consult a doctor for a thorough checkup.', 'bot');
    });
}

function addMapsButton() {
    const div = document.createElement('div');
    div.className = 'message bot-message';
    div.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content">
            <p style="margin-bottom:10px;">🚨 Please visit a nearby hospital immediately.</p>
            <a href="https://www.google.com/maps/search/hospital+near+me/" target="_blank"
               style="display:inline-flex;align-items:center;gap:8px;
                      background:#ef4444;color:#fff;padding:10px 20px;border-radius:10px;
                      text-decoration:none;font-weight:600;font-size:14px;">
                <i class="fas fa-hospital"></i> Find Nearby Hospitals
            </a>
            <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Symptom search in sidebar
const searchInput = document.getElementById('symptom-search');
const searchResults = document.getElementById('search-results');
let searchTimeout;

searchInput?.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const query = this.value.trim().toLowerCase();
    if (!query) {
        searchResults.innerHTML = '<p class="search-hint">Start typing to see matching symptoms</p>';
        return;
    }

    searchTimeout = setTimeout(() => {
        const matches = symptomList.filter(s => s.includes(query));
        if (matches.length === 0) {
            searchResults.innerHTML = '<p class="search-hint">No matching symptoms found</p>';
            return;
        }
        searchResults.innerHTML = matches.slice(0, 20).map(s =>
            `<div class="search-result-item" onclick="clickSymptom('${s}')">
                <i class="fas fa-arrow-right"></i> ${s.replace(/_/g, ' ')}
            </div>`
        ).join('');
    }, 200);
});

function clickSymptom(symptom) {
    chatInput.value = symptom.replace(/_/g, ' ');
    searchResults.innerHTML = '<p class="search-hint">Start typing to see matching symptoms</p>';
    searchInput.value = '';
    sendMessage();
}

// Example chips
function initExampleChips() {
    const container = document.getElementById('example-chips');
    container.innerHTML = exampleSymptoms.map(s =>
        `<span class="example-chip" onclick="clickSymptom('${s}')">${s}</span>`
    ).join('');
}

// Suggest button
document.getElementById('suggest-btn')?.addEventListener('click', () => {
    document.getElementById('symptom-suggestions').classList.toggle('show');
});

document.getElementById('close-suggestions')?.addEventListener('click', () => {
    document.getElementById('symptom-suggestions').classList.remove('show');
});

function initSuggestionsGrid() {
    const grid = document.getElementById('suggestions-grid');
    grid.innerHTML = symptomList.map(s =>
        `<span class="suggestion-chip" onclick="clickSymptom('${s.replace(/_/g, ' ')}')">${s.replace(/_/g, ' ')}</span>`
    ).join('');
}

// Menu toggle for mobile
document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
});

// Clear chat
document.getElementById('clear-chat')?.addEventListener('click', () => {
    if (confirm('Clear conversation?')) {
        chatMessages.innerHTML = '';
        addMessage('Hello! I\'m your HealthCare Assistant. Please tell me what symptoms you\'re experiencing.', 'bot');
        collectedSymptoms = [];
        currentSymptomList = [];
        answeredSymptoms = [];
    }
});
