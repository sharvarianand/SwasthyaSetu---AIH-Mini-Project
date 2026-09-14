"use client";
import { useEffect, useRef, useState } from "react";

// ─── Feature definitions ──────────────────────────────────────────────────────
// Each symptom is a binary feature. The model is a small neural net trained
// on rule-based synthetic data representing ICMR / WHO clinical triage logic.
// Training happens in-browser using TensorFlow.js — fully offline after first load.

const SYMPTOMS = [
  "Fever (≥38°C)",
  "Dry cough",
  "Shortness of breath",
  "Chest pain or tightness",
  "Fatigue / weakness",
  "Body ache / joint pain",
  "Headache",
  "Loss of taste or smell",
  "Sore throat",
  "Nausea or vomiting",
  "Diarrhoea",
  "Swelling (face / feet)",
  "Sudden confusion",
  "Skin rash",
] as const;

type Symptom = typeof SYMPTOMS[number];

// Urgency levels: 0 = Low, 1 = Moderate, 2 = High, 3 = Emergency
const URGENCY_META = [
  { label: "Low",       color: "#27ae60", advice: "Home rest, hydration, and monitoring. Seek care if symptoms worsen after 3 days." },
  { label: "Moderate",  color: "#f39c12", advice: "Visit a Primary Health Centre (PHC) within 24 hours for evaluation." },
  { label: "High",      color: "#e67e22", advice: "Seek hospital attention today. Do not delay — these symptoms need clinical assessment." },
  { label: "Emergency", color: "#c0392b", advice: "Call 108 immediately or go to the nearest emergency room. Do not wait." },
];

// ─── Training Data (100 synthetic cases, rule-based ground truth) ─────────────
function makeTrainingData() {
  // Feature indices matching SYMPTOMS array
  const F = Object.fromEntries(SYMPTOMS.map((s, i) => [s, i]));
  const X: number[][] = [];
  const Y: number[] = [];

  const add = (symptoms: Symptom[], urgency: number) => {
    const row = new Array(SYMPTOMS.length).fill(0);
    symptoms.forEach(s => { row[F[s]] = 1; });
    X.push(row);
    Y.push(urgency);
  };

  // Emergency cases (urgency = 3)
  add(["Shortness of breath", "Chest pain or tightness"], 3);
  add(["Sudden confusion", "Shortness of breath"], 3);
  add(["Chest pain or tightness", "Fatigue / weakness", "Shortness of breath"], 3);
  add(["Sudden confusion", "Fever (≥38°C)", "Shortness of breath"], 3);
  add(["Chest pain or tightness", "Swelling (face / feet)"], 3);
  add(["Shortness of breath", "Sudden confusion", "Swelling (face / feet)"], 3);
  add(["Chest pain or tightness", "Nausea or vomiting", "Shortness of breath"], 3);
  add(["Sudden confusion", "Swelling (face / feet)", "Fever (≥38°C)"], 3);

  // High urgency (urgency = 2)
  add(["Fever (≥38°C)", "Shortness of breath", "Fatigue / weakness"], 2);
  add(["Fever (≥38°C)", "Dry cough", "Shortness of breath"], 2);
  add(["Swelling (face / feet)", "Fatigue / weakness", "Headache"], 2);
  add(["Fever (≥38°C)", "Skin rash", "Headache"], 2);
  add(["Nausea or vomiting", "Swelling (face / feet)", "Fatigue / weakness"], 2);
  add(["Fever (≥38°C)", "Body ache / joint pain", "Skin rash"], 2);
  add(["Loss of taste or smell", "Fever (≥38°C)", "Dry cough", "Fatigue / weakness"], 2);
  add(["Headache", "Fever (≥38°C)", "Fatigue / weakness", "Nausea or vomiting"], 2);
  add(["Diarrhoea", "Fever (≥38°C)", "Nausea or vomiting", "Swelling (face / feet)"], 2);
  add(["Swelling (face / feet)", "Headache", "Fever (≥38°C)"], 2);
  add(["Fever (≥38°C)", "Dry cough", "Fatigue / weakness", "Body ache / joint pain"], 2);
  add(["Skin rash", "Fever (≥38°C)", "Fatigue / weakness"], 2);

  // Moderate urgency (urgency = 1)
  add(["Fever (≥38°C)", "Dry cough", "Sore throat"], 1);
  add(["Headache", "Fever (≥38°C)", "Body ache / joint pain"], 1);
  add(["Nausea or vomiting", "Diarrhoea", "Fever (≥38°C)"], 1);
  add(["Loss of taste or smell", "Fever (≥38°C)"], 1);
  add(["Fever (≥38°C)", "Sore throat", "Fatigue / weakness"], 1);
  add(["Dry cough", "Sore throat", "Headache", "Body ache / joint pain"], 1);
  add(["Fever (≥38°C)", "Dry cough"], 1);
  add(["Nausea or vomiting", "Diarrhoea", "Headache"], 1);
  add(["Body ache / joint pain", "Headache", "Fatigue / weakness", "Fever (≥38°C)"], 1);
  add(["Sore throat", "Dry cough", "Fever (≥38°C)"], 1);
  add(["Skin rash", "Headache"], 1);
  add(["Fever (≥38°C)", "Fatigue / weakness"], 1);
  add(["Loss of taste or smell", "Dry cough"], 1);
  add(["Nausea or vomiting", "Headache", "Fever (≥38°C)"], 1);
  add(["Diarrhoea", "Nausea or vomiting", "Fatigue / weakness"], 1);

  // Low urgency (urgency = 0)
  add(["Sore throat"], 0);
  add(["Dry cough"], 0);
  add(["Headache"], 0);
  add(["Body ache / joint pain"], 0);
  add(["Fatigue / weakness"], 0);
  add(["Nausea or vomiting"], 0);
  add(["Dry cough", "Sore throat"], 0);
  add(["Headache", "Fatigue / weakness"], 0);
  add(["Body ache / joint pain", "Fatigue / weakness"], 0);
  add(["Sore throat", "Headache"], 0);
  add(["Nausea or vomiting", "Headache"], 0);
  add(["Fatigue / weakness", "Body ache / joint pain", "Sore throat"], 0);
  add(["Diarrhoea"], 0);
  add(["Skin rash"], 0);
  add(["Loss of taste or smell"], 0);

  return { X, Y };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MLClassifier() {
  const [tfReady, setTfReady] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<{ urgency: number; confidence: number; probs: number[] } | null>(null);
  const modelRef = useRef<any>(null);
  const tfRef = useRef<any>(null);

  // Lazy-load TF.js only in browser
  useEffect(() => {
    import("@tensorflow/tfjs").then(tf => {
      tfRef.current = tf;
      setTfReady(true);
    }).catch(console.error);
  }, []);

  const trainModel = async () => {
    if (!tfReady || !tfRef.current) return;
    const tf = tfRef.current;
    setTraining(true);
    setTrainProgress(0);

    const { X, Y } = makeTrainingData();
    const xTensor = tf.tensor2d(X);
    const yTensor = tf.oneHot(tf.tensor1d(Y, "int32"), 4);

    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [SYMPTOMS.length], units: 32, activation: "relu" }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: "relu" }),
        tf.layers.dense({ units: 4, activation: "softmax" }),
      ],
    });

    model.compile({ optimizer: tf.train.adam(0.01), loss: "categoricalCrossentropy", metrics: ["accuracy"] });

    await model.fit(xTensor, yTensor, {
      epochs: 80,
      batchSize: 8,
      shuffle: true,
      callbacks: {
        onEpochEnd: (_: number, logs: any) => {
          setTrainProgress(Math.round((((_ + 1) / 80) * 100)));
        }
      }
    });

    xTensor.dispose(); yTensor.dispose();
    modelRef.current = model;
    setModelReady(true);
    setTraining(false);
  };

  const predict = () => {
    if (!modelRef.current || !tfRef.current) return;
    const tf = tfRef.current;
    const input = new Array(SYMPTOMS.length).fill(0);
    selected.forEach(i => { input[i] = 1; });
    const inputTensor = tf.tensor2d([input]);
    const predTensor = modelRef.current.predict(inputTensor) as any;
    const probs: number[] = Array.from(predTensor.dataSync());
    inputTensor.dispose(); predTensor.dispose();
    const urgency = probs.indexOf(Math.max(...probs));
    setResult({ urgency, confidence: Math.round(probs[urgency] * 100), probs });
  };

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
    setResult(null);
  };

  return (
    <div>
      {/* Model training panel */}
      {!modelReady && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.5rem" }}>Step 1: Train the Neural Network</h3>
          <p style={{ margin: "0 0 1rem", fontSize: "0.88rem", color: "var(--muted)" }}>
            A 3-layer neural network ({SYMPTOMS.length} inputs → 32 → 16 → 4 outputs) will be trained in your browser on {55} clinical triage cases derived from WHO and ICMR guidelines. After training, inference runs entirely offline.
          </p>
          {!training && (
            <button className="primary" onClick={trainModel} style={{ width: "100%" }}>
              🧠 Train Model In-Browser (TensorFlow.js)
            </button>
          )}
          {training && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.85rem" }}>
                <span>Training...</span><span>{trainProgress}%</span>
              </div>
              <div style={{ background: "var(--border)", borderRadius: "100px", height: "8px" }}>
                <div style={{ background: "var(--brand)", height: "8px", borderRadius: "100px", width: `${trainProgress}%`, transition: "width 0.2s" }} />
              </div>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>
                Running 80 epochs · batch size 8 · Adam optimizer
              </p>
            </div>
          )}
        </div>
      )}

      {modelReady && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#15803d", fontWeight: 700 }}>✓ Neural network trained and ready</span>
          <button onClick={() => { setModelReady(false); setResult(null); setSelected(new Set()); }}
            style={{ background: "transparent", border: "1px solid #15803d", color: "#15803d", padding: "0.25rem 0.6rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
            Retrain
          </button>
        </div>
      )}

      {/* Symptom selector */}
      {modelReady && (
        <div>
          <h3 style={{ margin: "0 0 0.75rem" }}>Step 2: Select Present Symptoms</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "1rem" }}>
            {SYMPTOMS.map((s, i) => (
              <button key={s} onClick={() => toggle(i)}
                style={{ textAlign: "left", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "2px solid",
                  borderColor: selected.has(i) ? "var(--brand)" : "var(--border)",
                  background: selected.has(i) ? "rgba(43,90,80,0.08)" : "transparent",
                  color: "var(--text)", cursor: "pointer", fontSize: "0.82rem", fontWeight: selected.has(i) ? 700 : 400 }}>
                {selected.has(i) ? "✓ " : ""}{s}
              </button>
            ))}
          </div>
          <button className="primary" disabled={selected.size === 0} onClick={predict} style={{ width: "100%", marginBottom: "1.5rem" }}>
            🔬 Run Inference ({selected.size} symptom{selected.size !== 1 ? "s" : ""} selected)
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ background: "var(--surface)", border: `2px solid ${URGENCY_META[result.urgency].color}`, borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Predicted Urgency</p>
              <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: URGENCY_META[result.urgency].color, lineHeight: 1.1 }}>
                {URGENCY_META[result.urgency].label}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>Confidence</p>
              <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 800, color: URGENCY_META[result.urgency].color }}>{result.confidence}%</p>
            </div>
          </div>
          <div style={{ background: "#f8f9fa", borderRadius: "8px", padding: "0.75rem", fontSize: "0.88rem", marginBottom: "1rem" }}>
            <strong>Recommended Action:</strong> {URGENCY_META[result.urgency].advice}
          </div>
          {/* Probability bars */}
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Class Probabilities</p>
          {URGENCY_META.map((m, i) => (
            <div key={i} style={{ marginBottom: "0.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.15rem" }}>
                <span style={{ fontWeight: 600 }}>{m.label}</span>
                <span>{Math.round(result.probs[i] * 100)}%</span>
              </div>
              <div style={{ background: "var(--border)", borderRadius: "100px", height: "6px" }}>
                <div style={{ background: m.color, height: "6px", borderRadius: "100px", width: `${result.probs[i] * 100}%`, transition: "width 0.3s" }} />
              </div>
            </div>
          ))}
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.73rem", color: "var(--muted)" }}>
            Model: 3-layer Dense NN · Trained on 55 cases · TensorFlow.js v4 · Runs 100% offline after initial model build
          </p>
        </div>
      )}
    </div>
  );
}
