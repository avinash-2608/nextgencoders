import os
import openai
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from models import init_db, upsert_user, update_performance, get_progress
from dotenv import load_dotenv
import traceback
import json

load_dotenv()

# Initialize OpenAI client with the new syntax
from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

init_db()

app = Flask(__name__)
CORS(app, origins=["http://localhost:1234", "http://localhost:3000", "http://localhost:5000"])

def call_openai(prompt, max_tokens=400, temperature=0.2):
    try:
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=temperature
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return json.dumps({"error": f"OpenAI API error: {str(e)}"})

@app.route("/api/user", methods=["POST"])
def create_user():
    try:
        data = request.json
        name = data.get("name")
        email = data.get("email")
        syllabus = data.get("syllabus", "")
        if not name or not email:
            return jsonify({"error": "name and email required"}), 400
        user_id = upsert_user(name, email, syllabus)
        return jsonify({"user_id": user_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/generate_plan", methods=["POST"])
def generate_plan():
    try:
        data = request.json
        user_id = data.get("user_id")
        syllabus = data.get("syllabus", "")
        exam_date = data.get("exam_date")
        daily_hours = data.get("daily_hours", 2)
        performance = data.get("performance", [])

        prompt = f"""
You are an expert study planner. Create a personalized 14-day study plan for a student preparing for exams.
Syllabus: {syllabus}
Exam date: {exam_date}
Daily study hours: {daily_hours}
Student recent performance summary: {performance}

Return a valid JSON object with keys: "plan" (array of days with topics and time allocation) and "tips" (short list of study tips).
Example format:
{{
  "plan": [
    {{
      "day": "Day 1",
      "topics": ["Topic A", "Topic B"],
      "time_allocation": "2 hours",
      "activities": ["Read chapter 1", "Practice problems"]
    }}
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}}
"""
        plan_text = call_openai(prompt, max_tokens=600)
        
        try:
            parsed_plan = json.loads(plan_text)
            return jsonify({"plan": parsed_plan, "plan_text": plan_text})
        except json.JSONDecodeError:
            return jsonify({"plan_text": plan_text})
            
    except Exception as e:
        print("Error generating study plan:\n", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/api/generate_questions", methods=["POST"])
def generate_questions():
    try:
        data = request.json
        topic = data.get("topic")
        difficulty = data.get("difficulty", "medium")
        num = int(data.get("num", 5))

        prompt = f"""
Generate {num} practice questions (with answers) for topic: {topic}. Difficulty: {difficulty}.
Return as a valid JSON array of objects with fields: question, options (array if MCQ), answer, explanation.

Example format:
[
  {{
    "question": "What is ...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Because..."
  }}
]
"""
        q_text = call_openai(prompt, max_tokens=800)
        
        try:
            parsed_questions = json.loads(q_text)
            return jsonify({"questions": parsed_questions, "questions_text": q_text})
        except json.JSONDecodeError:
            return jsonify({"questions_text": q_text})
            
    except Exception as e:
        print("Error generating questions:\n", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/api/submit_answers", methods=["POST"])
def submit_answers():
    try:
        data = request.json
        user_id = data.get("user_id")
        topic = data.get("topic")
        answers = data.get("answers")

        prompt = f"""
You are an exam grader. Evaluate these questions and student's answers: {json.dumps(answers)}
Provide a JSON response with: score (int), max_score (int), feedback (string), and weak_subtopics (array).

Example format:
{{
  "score": 8,
  "max_score": 10,
  "feedback": "Good overall performance but need improvement in...",
  "weak_subtopics": ["Subtopic A", "Subtopic B"]
}}
"""
        result_text = call_openai(prompt, max_tokens=400)
        
        try:
            parsed_result = json.loads(result_text)
            ts = datetime.utcnow().isoformat()
            score = parsed_result.get("score", 0)
            max_score = parsed_result.get("max_score", len(answers))
            update_performance(user_id, topic, score, max_score, ts)
            return jsonify({"evaluation": parsed_result, "evaluation_text": result_text})
        except json.JSONDecodeError:
            return jsonify({"evaluation_text": result_text})
            
    except Exception as e:
        print("Error grading answers:\n", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/api/progress/<int:user_id>", methods=["GET"])
def progress(user_id):
    try:
        rows = get_progress(user_id)
        return jsonify({"progress": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)