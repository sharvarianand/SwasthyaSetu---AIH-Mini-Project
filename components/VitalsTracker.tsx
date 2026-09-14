"use client";
import { useEffect, useRef, useState } from "react";

type VitalType = "bp_systolic" | "bp_diastolic" | "blood_sugar" | "weight" | "spo2";

interface Reading {
  id: string;
  type: VitalType;
  value: number;
  date: string; // ISO date string YYYY-MM-DD
  note?: string;
}

const VITAL_META: Record<VitalType, { label: string; unit: string; icon: string; min: number; max: number; normalRange: [number, number]; color: string }> = {
  bp_systolic:   { label: "Blood Pressure (Systolic)",  unit: "mmHg", icon: "❤️", min: 60,  max: 250, normalRange: [90, 120],  color: "#e74c3c" },
  bp_diastolic:  { label: "Blood Pressure (Diastolic)", unit: "mmHg", icon: "🫀", min: 40,  max: 150, normalRange: [60, 80],   color: "#e67e22" },
  blood_sugar:   { label: "Blood Sugar (Fasting)",      unit: "mg/dL", icon: "🩸", min: 40,  max: 600, normalRange: [70, 100],  color: "#9b59b6" },
  weight:        { label: "Weight",                      unit: "kg",   icon: "⚖️", min: 20,  max: 300, normalRange: [0, 999],   color: "#2b5a50" },
  spo2:          { label: "Oxygen Saturation (SpO₂)",   unit: "%",    icon: "🫁", min: 50,  max: 100, normalRange: [95, 100],  color: "#2980b9" },
};

const STORAGE_KEY = "swasthya-vitals-v1";

function loadReadings(): Reading[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveReadings(readings: Reading[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
}

// Tiny inline SVG sparkline chart
function Sparkline({ readings, color }: { readings: Reading[]; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || readings.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const vals = readings.map(r => r.value);
    const minV = Math.min(...vals), maxV = Math.max(...vals);
    const range = maxV - minV || 1;
    ctx.clearRect(0, 0, W, H);
    // Grid line
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    // Line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    readings.forEach((r, i) => {
      const x = (i / (readings.length - 1)) * W;
      const y = H - ((r.value - minV) / range) * (H - 8) - 4;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    // Dots
    readings.forEach((r, i) => {
      const x = (i / (readings.length - 1)) * W;
      const y = H - ((r.value - minV) / range) * (H - 8) - 4;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }, [readings, color]);
  return <canvas ref={canvasRef} width={280} height={60} style={{ width: "100%", height: "60px", borderRadius: "6px" }} />;
}

function getStatus(value: number, type: VitalType): { label: string; color: string } {
  const { normalRange } = VITAL_META[type];
  if (type === "weight") return { label: "Logged", color: "#2b5a50" };
  if (value < normalRange[0]) return { label: "Below Normal", color: "#2980b9" };
  if (value > normalRange[1]) return { label: "Above Normal", color: "#e74c3c" };
  return { label: "Normal", color: "#27ae60" };
}

export default function VitalsTracker() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [type, setType] = useState<VitalType>("bp_systolic");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [activeTab, setActiveTab] = useState<VitalType>("bp_systolic");

  useEffect(() => { setReadings(loadReadings()); }, []);

  const add = () => {
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return;
    const newR: Reading = { id: Date.now().toString(), type, value: v, date, note };
    const updated = [...readings, newR].sort((a, b) => a.date.localeCompare(b.date));
    setReadings(updated);
    saveReadings(updated);
    setValue("");
    setNote("");
    setActiveTab(type);
  };

  const del = (id: string) => {
    const updated = readings.filter(r => r.id !== id);
    setReadings(updated);
    saveReadings(updated);
  };

  const tabReadings = readings.filter(r => r.type === activeTab).slice(-20);
  const latest = tabReadings[tabReadings.length - 1];
  const meta = VITAL_META[activeTab];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.75rem", border: "1px solid var(--border)",
    borderRadius: "8px", fontSize: "1rem", background: "var(--surface)", color: "var(--text)", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.88rem", fontWeight: 600 };

  const exportCSV = () => {
    const rows = ["Type,Value,Unit,Date,Note", ...readings.map(r => `${VITAL_META[r.type].label},${r.value},${VITAL_META[r.type].unit},${r.date},"${r.note || ""}"`)] ;
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "swasthya-vitals.csv";
    a.click();
  };

  return (
    <div>
      {/* Log new reading */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Log a New Reading</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Vital
            <select style={inputStyle} value={type} onChange={e => setType(e.target.value as VitalType)}>
              {(Object.entries(VITAL_META) as [VitalType, typeof VITAL_META[VitalType]][]).map(([k, v]) =>
                <option key={k} value={k}>{v.icon} {v.label}</option>
              )}
            </select>
          </label>
          <label style={labelStyle}>Value ({VITAL_META[type].unit})
            <input style={inputStyle} type="number" step="0.1" placeholder={`e.g. ${VITAL_META[type].normalRange[1]}`} value={value} onChange={e => setValue(e.target.value)} />
          </label>
          <label style={labelStyle}>Date
            <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
          <label style={labelStyle}>Note (optional)
            <input style={inputStyle} type="text" placeholder="e.g. after meal" value={note} onChange={e => setNote(e.target.value)} />
          </label>
        </div>
        <button className="primary" onClick={add} style={{ width: "100%" }}>+ Add Reading</button>
      </div>

      {/* Vital type tabs */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {(Object.entries(VITAL_META) as [VitalType, typeof VITAL_META[VitalType]][]).map(([k, v]) => (
          <button key={k} onClick={() => setActiveTab(k)}
            style={{ padding: "0.4rem 0.75rem", borderRadius: "20px", border: "2px solid",
              borderColor: activeTab === k ? v.color : "var(--border)",
              background: activeTab === k ? v.color : "transparent",
              color: activeTab === k ? "white" : "var(--text)", fontWeight: 600, cursor: "pointer", fontSize: "0.8rem" }}>
            {v.icon} {v.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Chart + latest */}
      {tabReadings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)", border: "1px dashed var(--border)", borderRadius: "12px" }}>
          No {meta.label} readings yet. Log one above.
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
          {/* Latest value */}
          {latest && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Latest {meta.label}</p>
                <p style={{ margin: 0, fontSize: "2.2rem", fontWeight: 800, color: meta.color, lineHeight: 1 }}>
                  {latest.value} <span style={{ fontSize: "1rem", fontWeight: 400 }}>{meta.unit}</span>
                </p>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>{latest.date}</p>
              </div>
              <span style={{ background: getStatus(latest.value, activeTab).color, color: "white", padding: "0.3rem 0.75rem", borderRadius: "20px", fontWeight: 700, fontSize: "0.82rem" }}>
                {getStatus(latest.value, activeTab).label}
              </span>
            </div>
          )}
          {/* Sparkline */}
          {tabReadings.length >= 2 && (
            <div style={{ marginBottom: "0.5rem" }}>
              <p style={{ margin: "0 0 0.3rem", fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>TREND (last {tabReadings.length} readings)</p>
              <Sparkline readings={tabReadings} color={meta.color} />
            </div>
          )}
          {/* Normal range indicator */}
          {meta.normalRange[1] < 999 && (
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>
              Normal range: {meta.normalRange[0]}–{meta.normalRange[1]} {meta.unit}
            </p>
          )}
        </div>
      )}

      {/* History list */}
      {tabReadings.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>All {meta.label} Readings</p>
            <button onClick={exportCSV} style={{ background: "transparent", border: "1px solid var(--border)", padding: "0.3rem 0.7rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
              ↓ Export CSV
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {[...tabReadings].reverse().map(r => {
              const s = getStatus(r.value, activeTab);
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.88rem" }}>
                  <span style={{ color: "var(--muted)" }}>{r.date}</span>
                  <span style={{ fontWeight: 700 }}>{r.value} {meta.unit}</span>
                  <span style={{ color: s.color, fontWeight: 600, fontSize: "0.78rem" }}>{s.label}</span>
                  {r.note && <span style={{ color: "var(--muted)", fontStyle: "italic" }}>{r.note}</span>}
                  <button onClick={() => del(r.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#e74c3c", fontWeight: 700, padding: "0 0.3rem" }}>✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
