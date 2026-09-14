"use client";
import { useState } from "react";

// ─── CKD-EPI eGFR Formula (2021 race-free version) ───────────────────────────
function calcEGFR(creatinine: number, age: number, sex: "male" | "female"): number {
  const kappa = sex === "female" ? 0.7 : 0.9;
  const alpha = sex === "female" ? -0.241 : -0.302;
  const sexFactor = sex === "female" ? 1.012 : 1.0;
  const scrRatio = creatinine / kappa;
  const eGFR =
    142 *
    Math.pow(Math.min(scrRatio, 1), alpha) *
    Math.pow(Math.max(scrRatio, 1), -1.200) *
    Math.pow(0.9938, age) *
    sexFactor;
  return Math.round(eGFR * 10) / 10;
}

function ckdStage(egfr: number): { stage: string; label: string; color: string; advice: string } {
  if (egfr >= 90) return { stage: "G1", label: "Normal / High", color: "#2ecc71", advice: "Kidney function is normal. Maintain hydration, avoid NSAIDs, follow up annually if risk factors present." };
  if (egfr >= 60) return { stage: "G2", label: "Mildly Decreased", color: "#f1c40f", advice: "Mildly reduced. Control blood pressure (<130/80 mmHg), reduce salt intake, avoid nephrotoxic drugs." };
  if (egfr >= 45) return { stage: "G3a", label: "Mildly-Moderately Decreased", color: "#e67e22", advice: "Consult a physician. Manage BP aggressively. Restrict protein and phosphate intake. Check for anaemia." };
  if (egfr >= 30) return { stage: "G3b", label: "Moderately-Severely Decreased", color: "#e74c3c", advice: "Refer to nephrologist. Restrict potassium. Consider erythropoietin for anaemia. Avoid contrast dye." };
  if (egfr >= 15) return { stage: "G4", label: "Severely Decreased", color: "#c0392b", advice: "Urgent nephrology referral. Begin dialysis planning. Strict dietary management essential." };
  return { stage: "G5", label: "Kidney Failure", color: "#922b21", advice: "Kidney failure. Immediate nephrology care. Dialysis or transplant evaluation required." };
}

// ─── FINDRISC Diabetes Risk Score ────────────────────────────────────────────
function calcFINDRISC(
  age: number,
  bmi: number,
  waist: number,
  sex: "male" | "female",
  physicalActivity: boolean,
  fruitsVeg: boolean,
  hypertensionMed: boolean,
  highGlucoseHistory: boolean,
  familyHistory: "none" | "second_degree" | "first_degree"
): number {
  let score = 0;
  // Age
  if (age >= 45 && age < 55) score += 2;
  else if (age >= 55 && age < 64) score += 3;
  else if (age >= 64) score += 4;
  // BMI
  if (bmi >= 25 && bmi < 30) score += 1;
  else if (bmi >= 30) score += 3;
  // Waist circumference
  const waistLow = sex === "male" ? 94 : 80;
  const waistHigh = sex === "male" ? 102 : 88;
  if (waist >= waistLow && waist < waistHigh) score += 3;
  else if (waist >= waistHigh) score += 4;
  // Lifestyle
  if (!physicalActivity) score += 2;
  if (!fruitsVeg) score += 1;
  if (hypertensionMed) score += 2;
  if (highGlucoseHistory) score += 5;
  // Family history
  if (familyHistory === "second_degree") score += 3;
  else if (familyHistory === "first_degree") score += 5;
  return score;
}

function findRiskResult(score: number): { label: string; tenYearRisk: string; color: string; advice: string } {
  if (score < 7) return { label: "Low Risk", tenYearRisk: "1%", color: "#2ecc71", advice: "Low risk of Type 2 Diabetes in 10 years. Maintain active lifestyle and balanced diet." };
  if (score < 12) return { label: "Slightly Elevated", tenYearRisk: "4%", color: "#f1c40f", advice: "Slightly elevated. Increase physical activity to 30 min/day and reduce refined sugars." };
  if (score < 15) return { label: "Moderate Risk", tenYearRisk: "17%", color: "#e67e22", advice: "Moderate risk. Fasting blood glucose test recommended. Lifestyle modification is effective." };
  if (score < 20) return { label: "High Risk", tenYearRisk: "33%", color: "#e74c3c", advice: "High risk. Consult a physician immediately. HbA1c test and dietary counselling essential." };
  return { label: "Very High Risk", tenYearRisk: "50%", color: "#922b21", advice: "Very high risk. Urgent medical evaluation needed. Diabetes may already be present." };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RiskAssessment() {
  const [tab, setTab] = useState<"ckd" | "diabetes">("ckd");

  // CKD state
  const [creatinine, setCreatinine] = useState("");
  const [ckdAge, setCkdAge] = useState("");
  const [ckdSex, setCkdSex] = useState<"male" | "female">("male");
  const [ckdResult, setCkdResult] = useState<{ egfr: number; stage: ReturnType<typeof ckdStage> } | null>(null);

  // Diabetes state
  const [dAge, setDAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [waist, setWaist] = useState("");
  const [dSex, setDSex] = useState<"male" | "female">("male");
  const [physActivity, setPhysActivity] = useState(true);
  const [fruitsVeg, setFruitsVeg] = useState(true);
  const [hypertension, setHypertension] = useState(false);
  const [highGlucose, setHighGlucose] = useState(false);
  const [familyHx, setFamilyHx] = useState<"none" | "second_degree" | "first_degree">("none");
  const [diabResult, setDiabResult] = useState<{ score: number; risk: ReturnType<typeof findRiskResult> } | null>(null);

  const runCKD = () => {
    const scr = parseFloat(creatinine);
    const age = parseInt(ckdAge);
    if (isNaN(scr) || isNaN(age) || scr <= 0 || age <= 0) return;
    const egfr = calcEGFR(scr, age, ckdSex);
    setCkdResult({ egfr, stage: ckdStage(egfr) });
  };

  const runDiabetes = () => {
    const age = parseInt(dAge);
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    const wst = parseFloat(waist);
    if (isNaN(age) || isNaN(w) || isNaN(h) || isNaN(wst)) return;
    const bmi = w / (h * h);
    const score = calcFINDRISC(age, bmi, wst, dSex, physActivity, fruitsVeg, hypertension, highGlucose, familyHx);
    setDiabResult({ score, risk: findRiskResult(score) });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.75rem", border: "1px solid var(--border)",
    borderRadius: "8px", fontSize: "1rem", background: "var(--surface)", color: "var(--text)",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.88rem", fontWeight: 600, color: "var(--text)" };
  const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button onClick={() => { setTab("ckd"); setCkdResult(null); }}
          style={{ flex: 1, padding: "0.65rem 1rem", borderRadius: "8px", border: "2px solid",
            borderColor: tab === "ckd" ? "var(--brand)" : "var(--border)",
            background: tab === "ckd" ? "var(--brand)" : "transparent",
            color: tab === "ckd" ? "white" : "var(--text)", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>
          🧪 CKD Risk (eGFR)
        </button>
        <button onClick={() => { setTab("diabetes"); setDiabResult(null); }}
          style={{ flex: 1, padding: "0.65rem 1rem", borderRadius: "8px", border: "2px solid",
            borderColor: tab === "diabetes" ? "var(--brand)" : "var(--border)",
            background: tab === "diabetes" ? "var(--brand)" : "transparent",
            color: tab === "diabetes" ? "white" : "var(--text)", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>
          🩸 Diabetes Risk (FINDRISC)
        </button>
      </div>

      {/* CKD Tab */}
      {tab === "ckd" && (
        <div>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1rem" }}>
            Uses the <strong>CKD-EPI 2021</strong> equation — the international standard for estimating kidney function from a serum creatinine lab value.
          </p>
          <div style={gridStyle}>
            <label style={labelStyle}>Serum Creatinine (mg/dL)
              <input style={inputStyle} type="number" step="0.01" min="0.1" placeholder="e.g. 1.2" value={creatinine} onChange={e => setCreatinine(e.target.value)} />
            </label>
            <label style={labelStyle}>Age (years)
              <input style={inputStyle} type="number" min="18" max="110" placeholder="e.g. 45" value={ckdAge} onChange={e => setCkdAge(e.target.value)} />
            </label>
          </div>
          <label style={{ ...labelStyle, marginBottom: "1rem" }}>Biological Sex
            <select style={inputStyle} value={ckdSex} onChange={e => setCkdSex(e.target.value as any)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <button onClick={runCKD} className="primary" style={{ width: "100%", marginBottom: "1.5rem" }}>Calculate eGFR</button>

          {ckdResult && (
            <div style={{ background: "var(--surface)", border: `2px solid ${ckdResult.stage.color}`, borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Estimated GFR</p>
                  <p style={{ margin: 0, fontSize: "2.5rem", fontWeight: 800, color: ckdResult.stage.color, lineHeight: 1 }}>{ckdResult.egfr}</p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>mL/min/1.73m²</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ background: ckdResult.stage.color, color: "white", padding: "0.3rem 0.75rem", borderRadius: "20px", fontWeight: 700, fontSize: "0.9rem" }}>
                    Stage {ckdResult.stage.stage}
                  </span>
                  <p style={{ margin: "0.4rem 0 0", fontWeight: 700, color: ckdResult.stage.color }}>{ckdResult.stage.label}</p>
                </div>
              </div>
              <div style={{ background: "#f8f9fa", borderRadius: "8px", padding: "0.75rem", fontSize: "0.88rem", color: "var(--text)", lineHeight: 1.5 }}>
                <strong>Clinical Guidance:</strong> {ckdResult.stage.advice}
              </div>
              <p style={{ margin: "0.75rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
                Reference: Inker LA et al. NEJM 2021. CKD-EPI Creatinine 2021 equation.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Diabetes Tab */}
      {tab === "diabetes" && (
        <div>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1rem" }}>
            Uses the <strong>FINDRISC</strong> (Finnish Diabetes Risk Score) — validated by WHO and used globally to identify pre-diabetic individuals without a blood test.
          </p>
          <div style={gridStyle}>
            <label style={labelStyle}>Age (years)
              <input style={inputStyle} type="number" min="18" placeholder="e.g. 40" value={dAge} onChange={e => setDAge(e.target.value)} />
            </label>
            <label style={labelStyle}>Biological Sex
              <select style={inputStyle} value={dSex} onChange={e => setDSex(e.target.value as any)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label style={labelStyle}>Weight (kg)
              <input style={inputStyle} type="number" min="20" placeholder="e.g. 70" value={weight} onChange={e => setWeight(e.target.value)} />
            </label>
            <label style={labelStyle}>Height (cm)
              <input style={inputStyle} type="number" min="100" placeholder="e.g. 165" value={height} onChange={e => setHeight(e.target.value)} />
            </label>
            <label style={{ ...labelStyle, gridColumn: "1/-1" }}>Waist Circumference (cm)
              <input style={inputStyle} type="number" min="50" placeholder="e.g. 88" value={waist} onChange={e => setWaist(e.target.value)} />
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
            {[
              { label: "I exercise ≥30 min/day or walk briskly most days", val: physActivity, set: setPhysActivity },
              { label: "I eat fruits and vegetables every day", val: fruitsVeg, set: setFruitsVeg },
            ].map(({ label, val, set }) => (
              <label key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontSize: "0.9rem" }}>
                <input type="checkbox" checked={val} onChange={e => set(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--brand)" }} />
                {label}
              </label>
            ))}
            {[
              { label: "I take medication for high blood pressure", val: hypertension, set: setHypertension },
              { label: "I have been told my blood sugar was high before", val: highGlucose, set: setHighGlucose },
            ].map(({ label, val, set }) => (
              <label key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontSize: "0.9rem" }}>
                <input type="checkbox" checked={val} onChange={e => set(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--brand)" }} />
                {label}
              </label>
            ))}
          </div>

          <label style={{ ...labelStyle, marginBottom: "1rem" }}>Family history of diabetes
            <select style={inputStyle} value={familyHx} onChange={e => setFamilyHx(e.target.value as any)}>
              <option value="none">No family history</option>
              <option value="second_degree">Grandparent, aunt, uncle, or cousin</option>
              <option value="first_degree">Parent, sibling, or own child</option>
            </select>
          </label>

          <button onClick={runDiabetes} className="primary" style={{ width: "100%", marginBottom: "1.5rem" }}>Calculate Risk Score</button>

          {diabResult && (
            <div style={{ background: "var(--surface)", border: `2px solid ${diabResult.risk.color}`, borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>FINDRISC Score</p>
                  <p style={{ margin: 0, fontSize: "2.5rem", fontWeight: 800, color: diabResult.risk.color, lineHeight: 1 }}>{diabResult.score}</p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>out of 26 points</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ background: diabResult.risk.color, color: "white", padding: "0.3rem 0.75rem", borderRadius: "20px", fontWeight: 700, fontSize: "0.9rem" }}>
                    {diabResult.risk.label}
                  </span>
                  <p style={{ margin: "0.4rem 0 0", fontWeight: 700, color: diabResult.risk.color }}>{diabResult.risk.tenYearRisk} 10-year risk</p>
                </div>
              </div>
              <div style={{ background: "#f8f9fa", borderRadius: "8px", padding: "0.75rem", fontSize: "0.88rem", color: "var(--text)", lineHeight: 1.5 }}>
                <strong>Clinical Guidance:</strong> {diabResult.risk.advice}
              </div>
              <p style={{ margin: "0.75rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
                Reference: Lindström J, Tuomilehto J. Diabetes Care 2003. FINDRISC questionnaire.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
