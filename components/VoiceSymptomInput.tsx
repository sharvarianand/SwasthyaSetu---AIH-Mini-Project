"use client";

import { useState } from "react";
import { Language } from "@/lib/i18n";

type Props = { 
  onMatch: (symptoms: string[]) => void;
  t: any;
  lang: Language;
};

export function VoiceSymptomInput({ onMatch, t, lang }: Props) { 
  const [message, setMessage] = useState(""); 
  
  function start() { 
    const RecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition; 
    
    if (!RecognitionApi) { 
      setMessage(t.voiceNotSupported); 
      return; 
    } 
    
    const recognition = new RecognitionApi(); 
    
    // Set language based on selected app language
    if (lang === "English") recognition.lang = "en-IN";
    else if (lang === "मराठी") recognition.lang = "mr-IN";
    else if (lang === "हिन्दी") recognition.lang = "hi-IN";
    
    recognition.continuous = false; 
    recognition.interimResults = false; 
    
    recognition.onresult = (event: any) => { 
      const text = event.results[0][0].transcript.toLowerCase(); 
      const rules = t.symptomVoiceRules; 
      
      const matches = Object.entries(rules)
        .filter(([word]) => text.includes(word.toLowerCase()))
        .map(([, symptom]) => symptom as string); 
        
      if (matches.length) {
        onMatch(matches); 
        setMessage(t.voiceHeard.replace("{text}", text)); 
      } else {
        setMessage(t.voiceUnmatched.replace("{text}", text));
      }
    }; 
    
    recognition.onerror = () => setMessage(t.voiceError); 
    
    recognition.start(); 
    setMessage("Listening...");
  } 
  
  return (
    <div className="voice">
      <button type="button" className="outline" onClick={start}>{t.voicePrompt}</button>
      {message && <p style={{marginTop: '0.5rem', fontStyle: 'italic'}}>{message}</p>}
    </div>
  ); 
}
