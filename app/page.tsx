"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { AuthControls } from "@/components/AuthControls";
import { VoiceSymptomInput } from "@/components/VoiceSymptomInput";
import { translations, Language } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type View = "home" | "library" | "symptoms" | "emergency" | "reports" | "directory" | "worker";

function Icon({ children }: { children: string }) { return <span className="icon" aria-hidden>{children}</span>; }

// Inline tour wrapper — avoids all dynamic import issues with react-joyride
function InlineAppTour({ run, steps, onFinish }: { run: boolean; steps: any[]; onFinish: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [JoyrideComp, setJoyrideComp] = useState<React.ComponentType<any> | null>(null);
  useEffect(() => {
    import('react-joyride').then(mod => {
      setJoyrideComp(() => mod.Joyride);
      setMounted(true);
    });
  }, []);
  if (!mounted || !JoyrideComp) return null;
  return (
    <JoyrideComp
      steps={steps}
      run={run}
      continuous
      onEvent={(data: any) => {
        if (data.status === 'finished' || data.status === 'skipped') onFinish();
      }}
      options={{ primaryColor: '#2b5a50' }}
    />
  );
}

export default function Home() {
  const [lang, setLang] = useState<Language>("English");
  const [view, setView] = useState<View>("home");
  const t = translations[lang];

  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined); }, []);
  
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1);
      if (["home", "library", "symptoms", "emergency", "reports", "directory", "worker"].includes(hash)) {
        setView(hash as View);
      } else {
        setView("home");
      }
    };
    window.addEventListener("hashchange", handleHash);
    handleHash();
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const nav = (next: View) => {
    window.location.hash = next;
  };

  const [demoActive, setDemoActive] = useState<"ckd" | "standard" | null>(null);
  const [demoStepMessage, setDemoStepMessage] = useState("");
  const [chosenSymptoms, setChosenSymptoms] = useState<string[]>([]);
  const [symptomResult, setSymptomResult] = useState(false);
  const [reportsText, setReportsText] = useState("");
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (!demoActive) return;
    let step = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const runCkdDemo = () => {
      if (step === 0) {
        setDemoStepMessage("Starting CKD Demo: First, let's look at a lab report...");
        timeoutId = setTimeout(() => { step++; nav("reports"); runCkdDemo(); }, 2500);
      } else if (step === 1) {
        setDemoStepMessage("Simulating user entering a lab report with high Creatinine and Urea...");
        timeoutId = setTimeout(() => { step++; setReportsText("Serum creatinine: 2.8 mg/dL\nUrea: 45 mg/dL"); runCkdDemo(); }, 3000);
      } else if (step === 2) {
        setDemoStepMessage("Now let's check what symptoms they have...");
        timeoutId = setTimeout(() => { step++; nav("symptoms"); runCkdDemo(); }, 3500);
      } else if (step === 3) {
        setDemoStepMessage("Selecting kidney-related symptoms (Swelling, Fatigue)...");
        timeoutId = setTimeout(() => { step++; setChosenSymptoms(["Swelling", "Fatigue"]); runCkdDemo(); }, 3000);
      } else if (step === 4) {
        setDemoStepMessage("Notice how the guidance suggests a specific kidney/BP check based on symptoms.");
        timeoutId = setTimeout(() => { step++; setSymptomResult(true); runCkdDemo(); }, 3500);
      } else if (step === 5) {
        setDemoStepMessage("CKD Demo complete!");
        timeoutId = setTimeout(() => { setDemoActive(null); }, 5000);
      }
    };

    const runStandardDemo = () => {
      if (step === 0) {
        setDemoStepMessage("Starting Standard Demo: Let's check symptoms...");
        timeoutId = setTimeout(() => { step++; nav("symptoms"); runStandardDemo(); }, 2500);
      } else if (step === 1) {
        setDemoStepMessage("Selecting general symptoms (Fever, Cough)...");
        timeoutId = setTimeout(() => { step++; setChosenSymptoms(["Fever", "Cough"]); runStandardDemo(); }, 3000);
      } else if (step === 2) {
        setDemoStepMessage("Showing standard guidance to rest and monitor...");
        timeoutId = setTimeout(() => { step++; setSymptomResult(true); runStandardDemo(); }, 3000);
      } else if (step === 3) {
        setDemoStepMessage("Standard Demo complete!");
        timeoutId = setTimeout(() => { setDemoActive(null); }, 4000);
      }
    };

    if (demoActive === "ckd") runCkdDemo();
    else if (demoActive === "standard") runStandardDemo();

    return () => clearTimeout(timeoutId);
  }, [demoActive]);

  const startDemo = (type: "ckd" | "standard") => {
    setChosenSymptoms([]);
    setSymptomResult(false);
    setReportsText("");
    setDemoActive(type);
    nav("home");
  };

  const tourSteps = [
    { target: '.language', content: 'You can change the language of the entire app here at any time. It works completely offline.' },
    { target: '.card.urgent', content: 'The Emergency button is always highlighted. It shows critical danger signs to watch for.' },
    { target: '.primary', content: 'This starts the Symptom Guidance flow, which is the core feature of the app.' },
    { target: '.demo-actions', content: 'Use these automatic demos to see how the app handles different health scenarios.' }
  ];

  return <main>
    <InlineAppTour run={runTour} steps={tourSteps} onFinish={() => setRunTour(false)} />
    {demoActive && <div style={{background: 'var(--brand)', color: 'white', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, fontSize: '0.9rem'}}><span><strong>Automated Demo:</strong> {demoStepMessage}</span><button style={{background: 'white', color: 'var(--brand)', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => setDemoActive(null)}>Stop Demo</button></div>}
    
    <header className="topbar">
      <button className="brand" onClick={() => nav("home")}><span>✚</span> SwasthyaSetu</button>
      <div className="header-actions">
        <AuthControls />
        <div className="language" aria-label="Language selection">
          {(["English", "मराठी", "हिन्दी"] as Language[]).map(l => <button key={l} className={lang === l ? "active" : ""} onClick={() => setLang(l)}>{l}</button>)}
        </div>
      </div>
    </header>
    <section className="safety"><span>●</span> {t.disclaimer}</section>
    
    {view === "home" && <HomeView t={t} nav={nav} startDemo={startDemo} startTour={() => setRunTour(true)} />}
    {view === "library" && <Library t={t} nav={nav} />}
    {view === "symptoms" && <Symptoms t={t} lang={lang} nav={nav} chosen={chosenSymptoms} setChosen={setChosenSymptoms} result={symptomResult} setResult={setSymptomResult} />}
    {view === "emergency" && <Emergency t={t} nav={nav} />}
    {view === "reports" && <Reports t={t} nav={nav} text={reportsText} setText={setReportsText} />}
    {view === "directory" && <Directory t={t} nav={nav} />}
    {view === "worker" && <Worker t={t} nav={nav} />}
    
    <footer>Offline-first prototype · Keep local centre numbers verified · Never delay emergency care</footer>
  </main>;
}

function Back({ nav, t }: { nav: (v: View) => void, t: any }) { return <button className="back" onClick={() => nav("home")}>{t.backToHome}</button>; }

function HomeView({ t, nav, startDemo, startTour }: { t: any; nav: (v: View) => void; startDemo: (type: "ckd" | "standard") => void; startTour: () => void }) {
  const cards: [View, string, string, string][] = [
    ["emergency", "🚨", t.emergency, t.emergencyDangerText.substring(0, 40) + "..."], 
    ["symptoms", "♡", t.symptoms, t.symptomsSubtitle.substring(0, 40) + "..."], 
    ["library", "▤", t.library, t.librarySubtitle], 
    ["reports", "⌁", t.reports, t.reportsSubtitle || "Explanations of tests"], 
    ["directory", "⌖", t.directory, t.directoryText.substring(0, 40) + "..."], 
    ["worker", "✚", t.worker, t.workerText.substring(0, 40) + "..."]
  ];
  return <>
    <section className="hero">
      <div>
        <p className="eyebrow">{t.offline}</p>
        <h1>{t.tagline}</h1>
        <p>Simple, respectful support for patients, families, ASHA workers, and rural health volunteers.</p>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem'}}>
          <button className="primary" onClick={() => nav("symptoms")}>{t.startGuidance}</button>
          <div className="demo-actions" style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
            <button className="secondary" style={{background: 'transparent', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'}} onClick={() => startDemo("ckd")}>{t.playCkd}</button>
            <button className="secondary" style={{background: 'transparent', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'}} onClick={() => startDemo("standard")}>{t.playStandard}</button>
            <button className="secondary" style={{background: '#f0f4f8', border: '1px solid #cce0ff', color: '#0055cc', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'}} onClick={startTour}>{t.playTour}</button>
          </div>
        </div>
      </div>
      <div className="hero-art">
        <img src="/rural-health-hero.png" alt="A community health worker supporting a rural family"/>
        <small>Care • Clarity • Connection</small>
      </div>
    </section>
    <section className="content">
      <h2>{t.choose}</h2>
      <div className="card-grid">
        {cards.map(([view, icon, title, text]) => 
          <button className={view === "emergency" ? "card urgent" : "card"} key={view} onClick={() => nav(view)}>
            <Icon>{icon}</Icon><strong>{title}</strong><span>{text}</span><b>{t.open}</b>
          </button>
        )}
      </div>
    </section>
  </>;
}

function Library({ nav, t }: { nav: (v: View) => void, t: any }) { 
  const [topic, setTopic] = useState(0); 
  return <section className="content page"><Back nav={nav} t={t}/><p className="eyebrow">{t.libraryEyebrow}</p><h1>{t.library}</h1><p>{t.librarySubtitle}</p><div className="library-layout"><div className="topic-list">{t.libraryItems.map((item: any, i: number) => <button onClick={() => setTopic(i)} className={i === topic ? "selected" : ""} key={item.name}>{item.name}</button>)}</div><article className="reading-card"><h2>{t.libraryItems[topic].name}</h2><p>{t.libraryItems[topic].text}</p><div className="notice">{t.libraryNotice}</div></article></div></section>; 
}

function Symptoms({ nav, t, lang, chosen, setChosen, result, setResult }: { nav: (v: View) => void, t: any, lang: Language, chosen: string[]; setChosen: React.Dispatch<React.SetStateAction<string[]>>; result: boolean; setResult: React.Dispatch<React.SetStateAction<boolean>> }) {
  const optionsKeys = ["Fever", "Cough", "Fatigue", "Headache", "Vomiting", "Swelling", "Breathing difficulty", "Chest pain", "Sudden weakness / paralysis"];
  
  const emergency = chosen.some(x => ["Breathing difficulty", "Chest pain", "Sudden weakness / paralysis"].includes(x));
  const toggle = (x: string) => setChosen(p => p.includes(x) ? p.filter(y => y !== x) : [...p, x]);
  
  return <section className="content page">
    <Back nav={nav} t={t}/>
    <p className="eyebrow">{t.symptomsEyebrow}</p>
    <h1>{t.symptoms}</h1>
    <p>{t.symptomsSubtitle}</p>
    
    <VoiceSymptomInput onMatch={(matches) => { setChosen(p => [...new Set([...p, ...matches])]); setResult(false); }} t={t} lang={lang} />
    
    <div className="symptom-grid">
      {optionsKeys.map(x => 
        <button className={chosen.includes(x) ? "symptom picked" : "symptom"} onClick={() => { toggle(x); setResult(false); }} key={x}>
          {chosen.includes(x) ? "✓ " : "+ "}{t.symptomOptions[x]}
        </button>
      )}
    </div>
    
    <button className="primary" disabled={!chosen.length} onClick={() => setResult(true)}>{t.showNextSteps}</button>
    
    {result && <div className={emergency ? "result danger" : "result"}>
      {emergency ? 
        <><h2>{t.emergencyDanger}</h2><p>{t.emergencyDangerText}</p></> 
      : 
        <>
          <h2>{t.suggestedSteps}</h2>
          <p>
            {chosen.includes("Vomiting") ? t.stepVomiting : t.stepRest}
            {chosen.includes("Fever") || chosen.includes("Cough") ? t.stepClinic : ""}
            {chosen.includes("Swelling") || chosen.includes("Fatigue") ? t.stepKidney : t.stepDefault}
          </p>
          <div className="notice">{t.symptomNotice}</div>
        </>
      }
    </div>}
  </section>;
}

function Emergency({ nav, t }: { nav: (v: View) => void, t: any }) { 
  const [sosSent, setSosSent] = useState(false);

  return <section className="content page emergency-page">
    <Back nav={nav} t={t}/>
    <div className="alarm">🚨</div>
    <h1>{t.emergencyTitle}</h1>

    <div style={{ textAlign: "center", margin: "2rem 0" }}>
      <button 
        onClick={() => setSosSent(true)}
        style={{
          background: sosSent ? "var(--muted)" : "#e74c3c",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "150px",
          height: "150px",
          fontSize: "2rem",
          fontWeight: "bold",
          cursor: sosSent ? "default" : "pointer",
          boxShadow: sosSent ? "none" : "0 8px 24px rgba(231, 76, 60, 0.4)",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto"
        }}
        disabled={sosSent}
      >
        {sosSent ? "SENT" : "SOS"}
      </button>
      
      {sosSent && (
        <div style={{ background: "#fdf0ef", border: "1px solid #fadbd8", borderRadius: "8px", padding: "1rem", marginTop: "1.5rem" }}>
          <p style={{ color: "#c0392b", fontWeight: "bold", margin: 0, fontSize: "1.1rem" }}>
            Alert Sent
          </p>
          <p style={{ color: "#e74c3c", margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
            Your emergency alert and approximate location have been transmitted to nearby hospitals and emergency services (Demo).
          </p>
        </div>
      )}
    </div>

    <p>{t.emergencyText}</p>
    <div className="warning-list">
      {t.emergencySigns.map((x: string) => <div key={x}>⚠ {x}</div>)}
    </div>
    <p className="notice">{t.emergencyNotice}</p>
  </section>; 
}

function Reports({ nav, t, text, setText }: { nav: (v: View) => void, t: any, text: string; setText: React.Dispatch<React.SetStateAction<string>> }) { 
  const found = useMemo(() => Object.entries(t.reportTerms).filter(([term]) => text.toLowerCase().includes(term)), [text, t.reportTerms]); 
  return <section className="content page">
    <Back nav={nav} t={t}/>
    <p className="eyebrow">{t.reportsEyebrow}</p>
    <h1>{t.reportsTitle}</h1>
    <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t.reportsPlaceholder}/>
    <p className="hint">{t.reportsHint}</p>
    {text && <div className="report-results">
      <h2>{t.reportsMean}</h2>
      {found.length ? found.map(([term, explanation]: any) => 
        <article key={term}><strong>{term[0].toUpperCase() + term.slice(1)}</strong><p>{explanation}</p></article>
      ) : <p>{t.reportsTry}</p>}
      <div className="notice">{t.reportsNotice}</div>
    </div>}
  </section>; 
}

function Directory({ nav, t }: { nav: (v: View) => void, t: any }) {
  const contacts = [
    { category: "Primary Health Centre (PHC)", icon: "🏥", name: "PHC Khed (Rajgurunagar)", address: "Near ST Stand, Rajgurunagar, Khed, Pune – 410505", phone: "02135-222244" },
    { category: "Community Health Centre (CHC)", icon: "🏨", name: "CHC Junnar", address: "Junnar-Otur Road, Junnar, Pune – 410502", phone: "02132-222035" },
    { category: "Sub-District (Rural) Hospital", icon: "🏛️", name: "Rural Hospital Ambegaon", address: "Ghodegaon, Ambegaon Taluka, Pune – 410503", phone: "02133-234002" },
    { category: "District Hospital", icon: "🏦", name: "Sassoon General Hospital (District HQ)", address: "Near Pune Railway Station, Pune – 411001", phone: "020-26128000" },
    { category: "Women & Child Health", icon: "👶", name: "District Women Hospital, Pune", address: "Kaka Halwai Wadi, Pune – 411002", phone: "020-26133191" },
    { category: "Ambulance / Emergency", icon: "🚑", name: "108 Emergency Ambulance (Maharashtra)", address: "Free service, available 24×7 across Maharashtra", phone: "108" },
    { category: "National Health Helpline", icon: "☎️", name: "Swasth Bharat Helpline", address: "Central Govt. toll-free helpline for health queries", phone: "1800-180-1104" },
    { category: "ASHA / Health Worker", icon: "🧑‍⚕️", name: "Your local ASHA worker", address: "Available in every village ward — ask at your Gram Panchayat", phone: "Gram Panchayat" },
  ];
  return <section className="content page">
    <Back nav={nav} t={t}/>
    <p className="eyebrow">{t.directoryEyebrow}</p>
    <h1>{t.directoryTitle}</h1>
    <p style={{marginBottom: "1.25rem", fontSize: "0.92rem", color: "var(--muted)"}}>
      Pune District · Maharashtra — verify phone numbers with local administration before clinical use.
    </p>
    <div className="directory">
      {contacts.map(({ category, icon, name, address, phone }) =>
        <article key={category}>
          <span>{icon}</span>
          <div>
            <small style={{fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em"}}>{category}</small>
            <strong style={{display: "block"}}>{name}</strong>
            <p style={{margin: "0.2rem 0 0.1rem", fontSize: "0.85rem"}}>{address}</p>
            <p style={{margin: 0, fontWeight: 700, color: "var(--brand)"}}>📞 {phone}</p>
          </div>
          <a href={`tel:${phone.replace(/[^0-9]/g, "")}`} className="outline" style={{textDecoration: "none"}}>{t.call}</a>
        </article>
      )}
    </div>
  </section>;
}

function Worker({ nav, t }: { nav: (v: View) => void, t: any }) { 
  const [saved, setSaved] = useState(false); 
  const [status, setStatus] = useState(""); 
  
  async function submit(e: FormEvent<HTMLFormElement>) { 
    e.preventDefault(); 
    const data = Object.fromEntries(new FormData(e.currentTarget)); 
    const payload = { ...data, createdAt: new Date().toISOString() };
    localStorage.setItem("swasthya-last-referral", JSON.stringify(payload)); 
    
    // Attempt Supabase insert if logged in
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { error } = await supabase.from('patient_history').insert({
        user_id: session.user.id,
        patient_name: data.patient,
        village: data.village,
        priority: data.priority,
        notes: data.notes || ""
      });
      
      if (error) {
        console.error(error);
        setStatus("Saved locally, but failed to sync to secure cloud. Check database permissions.");
      } else {
        setStatus("Saved locally and securely synced to your account.");
      }
    } else {
      setStatus("Saved locally. Sign in with Google to securely backup patient history.");
    }
    
    setSaved(true); 
  } 
  
  return <section className="content page">
    <Back nav={nav} t={t}/>
    <p className="eyebrow">{t.workerEyebrow}</p>
    <h1>{t.workerTitle}</h1>
    <p>{t.workerText}</p>
    <form onSubmit={submit} className="referral">
      <label>{t.workerPatient}<input required name="patient" placeholder="e.g. Patient ID 024"/></label>
      <label>{t.workerVillage}<input required name="village" placeholder="Village name"/></label>
      <label>{t.workerPriority}
        <select name="priority">
          <option>Routine follow-up</option>
          <option>Needs clinician review</option>
          <option>Urgent referral</option>
        </select>
      </label>
      <label>{t.workerNotes}<textarea name="notes" placeholder="Symptoms, duration, measurements"/></label>
      <button className="primary">{t.workerSave}</button>
    </form>
    {saved && <div className="result"><h2>{t.workerSavedTitle}</h2><p>{status}</p><p>{t.workerSavedNotice}</p></div>}
  </section>; 
}
