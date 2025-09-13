import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";

const API = "http://localhost:5000/api";

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [syllabus, setSyllabus] = useState(
    "Discrete Mathematics, Data Structures, Algorithms"
  );
  const [userId, setUserId] = useState(null);
  const [plan, setPlan] = useState(null);
  const [planText, setPlanText] = useState("");
  const [topic, setTopic] = useState("Dynamic Programming");
  const [questions, setQuestions] = useState(null);
  const [questionsText, setQuestionsText] = useState("");
  const [answers, setAnswers] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [evalText, setEvalText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createUser = async () => {
    try {
      setError("");
      setLoading(true);
      const resp = await axios.post(`${API}/user`, { name, email, syllabus });
      setUserId(resp.data.user_id);
    } catch (err) {
      setError(`Error creating user: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const genPlan = async () => {
    if (!userId) {
      setError("Please create a user first");
      return;
    }
    
    try {
      setError("");
      setLoading(true);
      const resp = await axios.post(`${API}/generate_plan`, {
        user_id: userId,
        syllabus,
        exam_date: "2025-10-15",
        daily_hours: 2,
        performance: [],
      });
      
      if (resp.data.plan) {
        setPlan(resp.data.plan);
      }
      if (resp.data.plan_text) {
        setPlanText(resp.data.plan_text);
      }
    } catch (err) {
      setError(`Error generating plan: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const genQuestions = async () => {
    try {
      setError("");
      setLoading(true);
      const resp = await axios.post(`${API}/generate_questions`, {
        topic,
        difficulty: "medium",
        num: 5,
      });
      
      if (resp.data.questions) {
        setQuestions(resp.data.questions);
      }
      if (resp.data.questions_text) {
        setQuestionsText(resp.data.questions_text);
      }
    } catch (err) {
      setError(`Error generating questions: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswers = async () => {
    if (!userId) {
      setError("Please create a user first");
      return;
    }
    
    try {
      setError("");
      setLoading(true);
      const payload = { user_id: userId, topic, answers };
      const resp = await axios.post(`${API}/submit_answers`, payload);
      
      if (resp.data.evaluation) {
        setEvaluation(resp.data.evaluation);
      }
      if (resp.data.evaluation_text) {
        setEvalText(resp.data.evaluation_text);
      }
    } catch (err) {
      setError(`Error submitting answers: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderPlan = () => {
    if (!plan) return planText;
    
    return (
      <div>
        <h3>Study Plan</h3>
        {plan.tips && (
          <div>
            <h4>Tips:</h4>
            <ul>
              {plan.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
        {plan.plan && plan.plan.map((day, index) => (
          <div key={index} style={{marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd'}}>
            <h4>{day.day}</h4>
            <p><strong>Time:</strong> {day.time_allocation}</p>
            <p><strong>Topics:</strong> {day.topics?.join(', ')}</p>
            <p><strong>Activities:</strong> {day.activities?.join(', ')}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderQuestions = () => {
    if (!questions) return questionsText;
    
    return (
      <div>
        <h3>Practice Questions</h3>
        {questions.map((q, index) => (
          <div key={index} style={{marginBottom: '2rem', padding: '1rem', border: '1px solid #eee'}}>
            <p><strong>Q{index + 1}:</strong> {q.question}</p>
            {q.options && (
              <ul>
                {q.options.map((option, optIndex) => (
                  <li key={optIndex}>{option}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderEvaluation = () => {
    if (!evaluation) return evalText;
    
    return (
      <div>
        <h3>Evaluation Results</h3>
        <p><strong>Score:</strong> {evaluation.score}/{evaluation.max_score}</p>
        <p><strong>Feedback:</strong> {evaluation.feedback}</p>
        {evaluation.weak_subtopics && (
          <div>
            <strong>Weak Subtopics:</strong>
            <ul>
              {evaluation.weak_subtopics.map((subtopic, index) => (
                <li key={index}>{subtopic}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>AI Exam Prep</h1>

      {error && (
        <div style={{color: "red", padding: "1rem", backgroundColor: "#ffe6e6", marginBottom: "1rem"}}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{padding: "1rem", backgroundColor: "#e6f7ff", marginBottom: "1rem"}}>
          Loading...
        </div>
      )}

      <section style={{ marginBottom: "2rem" }}>
        <h2>User Profile</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: "block", width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <textarea
          rows={3}
          placeholder="Syllabus Topics (comma-separated)"
          value={syllabus}
          onChange={(e) => setSyllabus(e.target.value)}
          style={{ display: "block", width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
        ></textarea>
        <button
          onClick={createUser}
          disabled={loading}
          style={{ marginTop: "0.5rem", padding: "0.5rem 1rem", borderRadius: "4px", backgroundColor: "#4CAF50", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Create/Update User
        </button>
        {userId && <p>User ID: {userId}</p>}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Generate Study Plan</h2>
        <button
          onClick={genPlan}
          disabled={!userId || loading}
          style={{ padding: "0.5rem 1rem", borderRadius: "4px", backgroundColor: "#2196F3", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Generate Study Plan
        </button>
        <div style={{ backgroundColor: "#f4f4f4", padding: "1rem", borderRadius: "4px", marginTop: "1rem" }}>
          {renderPlan()}
        </div>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Generate Practice Questions</h2>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ display: "block", width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button
          onClick={genQuestions}
          disabled={loading}
          style={{ padding: "0.5rem 1rem", borderRadius: "4px", backgroundColor: "#2196F3", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Generate Questions
        </button>
        <div style={{ backgroundColor: "#f4f4f4", padding: "1rem", borderRadius: "4px", marginTop: "1rem" }}>
          {renderQuestions()}
        </div>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Submit Answers</h2>
        <textarea
          placeholder='{"q1":"answer","q2":"answer"}'
          rows={4}
          onChange={(e) => {
            try {
              setAnswers(JSON.parse(e.target.value || "{}"));
            } catch (err) {
              setError("Invalid JSON format");
            }
          }}
          style={{ display: "block", width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
        ></textarea>
        <button
          onClick={submitAnswers}
          disabled={!userId || loading}
          style={{ marginTop: "0.5rem", padding: "0.5rem 1rem", borderRadius: "4px", backgroundColor: "#FF9800", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Submit Answers
        </button>
        <div style={{ backgroundColor: "#f4f4f4", padding: "1rem", borderRadius: "4px", marginTop: "1rem" }}>
          {renderEvaluation()}
        </div>
      </section>
    </div>
  );
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);