import sys
from flask import Flask, request, jsonify, render_template, session
import importlib
import json

bot = None
def get_bot():
    global bot
    if bot is None:
        bot = importlib.import_module("bot")
    return bot

app = Flask(__name__)
app.secret_key = "healthcare-chatbot-secret-key"

symptom_list = ['itching', 'skin_rash', 'nodal_skin_eruptions', 'continuous_sneezing', 'shivering', 'chills', 'joint_pain', 'stomach_pain', 'acidity', 'ulcers_on_tongue', 'muscle_wasting', 'vomiting', 'burning_micturition', 'spotting_urination', 'fatigue', 'weight_gain', 'anxiety', 'cold_hands_and_feets', 'mood_swings', 'weight_loss', 'restlessness', 'lethargy', 'patches_in_throat', 'irregular_sugar_level', 'cough', 'high_fever', 'sunken_eyes', 'breathlessness', 'sweating', 'dehydration', 'indigestion', 'headache', 'yellowish_skin', 'dark_urine', 'nausea', 'loss_of_appetite', 'pain_behind_the_eyes', 'back_pain', 'constipation', 'abdominal_pain', 'diarrhoea', 'mild_fever', 'yellow_urine', 'yellowing_of_eyes', 'acute_liver_failure', 'fluid_overload', 'swelling_of_stomach', 'swelled_lymph_nodes', 'malaise', 'blurred_and_distorted_vision', 'phlegm', 'throat_irritation', 'redness_of_eyes', 'sinus_pressure', 'runny_nose', 'congestion', 'chest_pain', 'weakness_in_limbs', 'fast_heart_rate', 'pain_during_bowel_movements', 'pain_in_anal_region', 'bloody_stool', 'irritation_in_anus', 'neck_pain', 'dizziness', 'cramps', 'bruising', 'obesity', 'swollen_legs', 'swollen_blood_vessels', 'puffy_face_and_eyes', 'enlarged_thyroid', 'brittle_nails', 'swollen_extremeties', 'excessive_hunger', 'extra_marital_contacts', 'drying_and_tingling_lips', 'slurred_speech', 'knee_pain', 'hip_joint_pain', 'muscle_weakness', 'stiff_neck', 'swelling_joints', 'movement_stiffness', 'spinning_movements', 'loss_of_balance', 'unsteadiness', 'weakness_of_one_body_side', 'loss_of_smell', 'bladder_discomfort', 'foul_smell_of_urine', 'continuous_feel_of_urine', 'passage_of_gases', 'internal_itching', 'toxic_look_typhos', 'depression', 'irritability', 'muscle_pain', 'altered_sensorium', 'red_spots_over_body', 'belly_pain', 'abnormal_menstruation', 'dischromic_patches', 'watering_from_eyes', 'increased_appetite', 'polyuria', 'family_history', 'mucoid_sputum', 'rusty_sputum', 'lack_of_concentration', 'visual_disturbances', 'receiving_blood_transfusion', 'receiving_unsterile_injections', 'coma', 'stomach_bleeding', 'distention_of_abdomen', 'history_of_alcohol_consumption', 'fluid_overload', 'blood_in_sputum', 'prominent_veins_on_calf', 'palpitations', 'painful_walking', 'pus_filled_pimples', 'blackheads', 'scurring', 'skin_peeling', 'silver_like_dusting', 'small_dents_in_nails', 'inflammatory_nails', 'blister', 'red_sore_around_nose', 'yellow_crust_ooze']

@app.route("/")
def index():
    if "chat_history" not in session:
        session["chat_history"] = []
        session["symptoms_collected"] = []
        session["awaiting_yes_no"] = None
        session["awaiting_symptom_list"] = None
        session["days"] = 0
    return render_template("index.html", symptoms=symptom_list)

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    msg = data.get("message", "").strip().lower()

    if "chat_history" not in session:
        session["chat_history"] = []
        session["symptoms_collected"] = []
        session["awaiting_yes_no"] = None
        session["awaiting_symptom_list"] = None
        session["days"] = 0

    quit_words = ["quit", "exit", "bye", "bye bye"]
    if msg in quit_words:
        session.clear()
        return jsonify({"reply": "Goodbye! Take care. Refresh to start a new chat.", "type": "bot"})

    try:
        b = get_bot()
        chat_hear = b.getresponse(msg)
    except Exception as e:
        return jsonify({"reply": f"Sorry, I couldn't process that. Please rephrase your symptom.", "type": "bot"})

    if len(chat_hear) == 1:
        reply = chat_hear[0]
        session["chat_history"].append({"user": msg, "bot": reply})
        session.modified = True
        return jsonify({"reply": reply, "type": "bot"})

    elif len(chat_hear) > 1:
        msg4 = chat_hear[0]
        symptoms_list = chat_hear[1]
        session["awaiting_symptom_list"] = symptoms_list
        session["chat_history"].append({"user": msg, "bot": msg4})
        session.modified = True
        return jsonify({
            "reply": msg4,
            "type": "symptom_confirm",
            "symptoms": symptoms_list
        })

    return jsonify({"reply": "I didn't understand that. Please describe your symptoms.", "type": "bot"})

@app.route("/api/symptom-answer", methods=["POST"])
def symptom_answer():
    data = request.get_json()
    collected = data.get("symptoms", [])
    days = data.get("days", 0)

    if not collected:
        return jsonify({"type": "bot", "reply": "No symptoms recorded. Please describe your symptoms again."})

    try:
        b = get_bot()
        final_disease = b.get_pridected_value(collected)
        result = b.get_diesese_practions(final_disease)
        result += "\n"

        maps_url = None
        if days > 10:
            result += "⚠️ You've been suffering for over 10 days. Stop self-medication and consult a doctor immediately.\n"
            maps_url = "https://www.google.com/maps/search/hospital+near+me/"

        return jsonify({"type": "result", "reply": result, "maps_url": maps_url})
    except Exception as e:
        return jsonify({"type": "bot", "reply": "Diagnosis complete. Based on your symptoms, please consult a doctor for a thorough checkup."})

@app.route("/api/search", methods=["POST"])
def search():
    data = request.get_json()
    query = data.get("query", "").lower()
    if not query:
        return jsonify({"results": []})

    import re
    pattern = re.compile(query.replace(" ", "_"))
    matches = [s.replace("_", " ") for s in symptom_list if pattern.search(s)]
    return jsonify({"results": matches[:20]})

if __name__ == "__main__":
    import time
    sys.setrecursionlimit(10000)
    print("Starting HealthCare Chatbot Web Server...")
    print("Loading AI models (this takes ~90s on first run)...")
    t0 = time.time()
    get_bot()
    print(f"Models loaded in {time.time()-t0:.1f}s. Server ready at http://localhost:5000")
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port, threaded=True)
