import React, { useState, useEffect } from 'react';
import { Search, Printer, RefreshCw, Award } from 'lucide-react';
import { Result, ClassName, SchoolConfig } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getClassSubjects, getSchoolClasses, getSchoolSessions } from '../data';
import { removeBlackBackground } from '../lib/removeBlack';
import confetti from 'canvas-confetti';

const playCelebrationSounds = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // 1. Festive Chime Arpeggio (Chimes)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      }, index * 120);
    });

    // 2. Crowd Cheering & Shouting Background Noise Sweep (Vocal Crowd Resonance)
    const cheerDuration = 3.5; // 3.5 seconds
    const cheerBufferSize = ctx.sampleRate * cheerDuration;
    const cheerBuffer = ctx.createBuffer(1, cheerBufferSize, ctx.sampleRate);
    const cheerData = cheerBuffer.getChannelData(0);
    for (let i = 0; i < cheerBufferSize; i++) {
      cheerData[i] = Math.random() * 2 - 1;
    }

    const cheerNode = ctx.createBufferSource();
    cheerNode.buffer = cheerBuffer;

    const cheerFilter = ctx.createBiquadFilter();
    cheerFilter.type = 'bandpass';
    cheerFilter.frequency.setValueAtTime(650, ctx.currentTime); // Vocal formants average around 600-800Hz
    cheerFilter.Q.setValueAtTime(1.5, ctx.currentTime); // Broad bandpass for organic feel

    const cheerGain = ctx.createGain();
    cheerGain.gain.setValueAtTime(0.001, ctx.currentTime);
    cheerGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.6); // Rise
    cheerGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cheerDuration); // Long decay

    cheerNode.connect(cheerFilter);
    cheerFilter.connect(cheerGain);
    cheerGain.connect(ctx.destination);
    cheerNode.start();

    // 3. Dense Crowd Clapping (120 overlayed claps to simulate a large crowd)
    const clapBufferSize = ctx.sampleRate * 0.3; // 300ms max buffer for a single clap
    const clapBuffer = ctx.createBuffer(1, clapBufferSize, ctx.sampleRate);
    const clapData = clapBuffer.getChannelData(0);
    for (let i = 0; i < clapBufferSize; i++) {
      clapData[i] = Math.random() * 2 - 1;
    }

    const playSingleCrowdClap = (delayMs: number, pitch: number, vol: number, clapLengthSec: number) => {
      setTimeout(() => {
        const source = ctx.createBufferSource();
        source.buffer = clapBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(pitch, ctx.currentTime);
        filter.Q.setValueAtTime(4.5, ctx.currentTime); // Realistic handclap resonance

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(vol, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + clapLengthSec);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start();
        source.stop(ctx.currentTime + clapLengthSec);
      }, delayMs);
    };

    // Synthesize 120 random claps spreading across 3.2 seconds
    for (let i = 0; i < 120; i++) {
      const delay = Math.random() * 3200; // delay spread
      // Vary the pitch slightly to represent different hands clapping in the room (900Hz to 2100Hz)
      const pitch = 900 + Math.random() * 1200; 
      // Vary volume for spatial depth (near and far audience)
      const vol = 0.04 + Math.random() * 0.14; 
      // Vary hand cup sizes (clapping decay length)
      const clapLen = 0.08 + Math.random() * 0.10; 
      playSingleCrowdClap(delay, pitch, vol, clapLen);
    }

    // 4. Firecracker Popping Sounds (Patake)
    const playFirecracker = (delayMs: number) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(85 + Math.random() * 50, ctx.currentTime); // Low booming bass

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);

        // Multiple crackling sparkles following the main boom
        for (let j = 0; j < 10; j++) {
          const crackleDelay = 60 + Math.random() * 250;
          setTimeout(() => {
            const crackleOsc = ctx.createOscillator();
            const crackleGain = ctx.createGain();
            crackleOsc.type = 'triangle';
            crackleOsc.frequency.setValueAtTime(1400 + Math.random() * 1200, ctx.currentTime);
            crackleGain.gain.setValueAtTime(0.04, ctx.currentTime);
            crackleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

            crackleOsc.connect(crackleGain);
            crackleGain.connect(ctx.destination);
            crackleOsc.start();
            crackleOsc.stop(ctx.currentTime + 0.03);
          }, crackleDelay);
        }

      }, delayMs);
    };

    // Play multiple spaced out firecrackers with rich stereophonic timing
    playFirecracker(150);
    playFirecracker(500);
    playFirecracker(900);
    playFirecracker(1400);
    playFirecracker(1900);

  } catch (err) {
    console.error("Audio Synthesis error:", err);
  }
};

const triggerPatake = () => {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // random explosions across the screen simulating firecrackers
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.2, 0.5) } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.2, 0.5) } });
  }, 250);
};

interface ResultPortalProps {
  results: Result[];
  config?: SchoolConfig;
}

const SUBJECTS = [
  "Quran",
  "Hifz",
  "Deeniyat",
  "Urdu",
  "English",
  "Hindi",
  "Science",
  "Social Science",
  "Math",
  "Dua & Kalma"
];

const SUBJECT_COLORS = [
  "#fce4ec", // Pinkish
  "#e8f5e9", // Greenish
  "#e3f2fd", // Blueish
  "#fff3e0", // Orangeish
  "#f3e5f5", // Purplish
  "#f1f8e9", // Light Lime
  "#e0f2f1", // Tealish
  "#fffde7", // Yellowish
  "#efebe9", // Brownish Grey
  "#e1f5fe"  // Light Blue
];

export function getCurrentSession(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 is January, 11 is December
  // Academic session shifts from April (month 3) or later
  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

export function normalizeSession(session: string): string {
  if (!session) return getCurrentSession();
  const trimmed = String(session).trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const firstYear = match[1];
    const secondYear = match[2];
    return `${firstYear}-20${secondYear}`;
  }
  return trimmed;
}

export function formatClassName(className: string | undefined): string {
  if (!className) return "";
  return String(className).replace(/(\d+)(ST|ND|RD|TH)/gi, (match, num, suffix) => {
    return num + suffix.toLowerCase();
  });
}

export default function ResultPortal({ results, config }: ResultPortalProps) {
  const [rollNo, setRollNo] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassName>('EDADIA');
  const [selectedExamType, setSelectedExamType] = useState<string>('Annual');
  const [selectedSession, setSelectedSession] = useState<string>(getCurrentSession());
  const [passingYear, setPassingYear] = useState('2526'); // Matches Urdu numerals 2026 / 1447 AH
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [foundResult, setFoundResult] = useState<Result | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [printScale, setPrintScale] = useState(100);

  // Automatically re-evaluate if results change after a search has been triggered
  useEffect(() => {
    if (searchTriggered && rollNo) {
      const potentialMatches = results.filter(
        (r) =>
          r.rollNo.toString().trim() === rollNo.trim() &&
          r.className === selectedClass &&
          (r.examType || 'Annual').toLowerCase() === selectedExamType.toLowerCase()
      );

      let match = null;
      if (potentialMatches.length > 0) {
        match = potentialMatches.find(
          (r) => normalizeSession(r.session).toLowerCase() === normalizeSession(selectedSession).toLowerCase()
        );
        if (!match) {
          match = potentialMatches[0];
          // We only auto-update selectedSession in the direct handleSearch to avoid infinite loops,
          // but we can set the foundResult here.
        }
      }

      setFoundResult(match);
      if (match && !showCelebration) {
        setShowCelebration(true);
        // Sound and effects are usually triggered on click, doing it here might be repetitive,
        // but it's safe if we only do it when showCelebration transitions from false to true.
      } else if (!match) {
        setShowCelebration(false);
      }
    }
  }, [results]); // Only depend on results to handle delayed data fetch from Sheets

  // Dynamically extract exam variations or provide robust default ones based on configured sessions
  const availableSessions = React.useMemo(() => {
    let list: string[];
    if (config?.sessions && config.sessions.length > 0) {
      list = [...config.sessions];
    } else {
      list = getSchoolSessions();
    }
    return Array.from(new Set(list)).sort().reverse();
  }, [config?.sessions]);

  const examSessions: any[] = [];
  const b_examSessions = React.useMemo(() => {
    const list: { examType: string; session: string; label: string }[] = [];
    
    // Add defaults first based on all available sessions
    const defaults = availableSessions.flatMap(sess => [
      { examType: "Annual", session: sess, label: `Annual Examination - ${sess} (सालाना / सालانہ)` },
      { examType: "Half-Yearly", session: sess, label: `Half-Yearly Examination - ${sess} (छमाही / शश ماہی)` },
      { examType: "Quarterly", session: sess, label: `Quarterly Examination - ${sess} (तिमाही / سہ ماہی)` },
    ]);
    /*
      { examType: "Annual", session: current, label: `Annual Examination - ${current} (सालाना / सालانہ)` },
      { examType: "Half-Yearly", session: current, label: `Half-Yearly Examination - ${current} (छमाही / شश ماہی)` },
      { examType: "Quarterly", session: current, label: `Quarterly Examination - ${current} (तिमाही / سہ ماہی)` },
      { examType: "Annual", session: "2025-2026", label: "Annual Examination - 2025-2026 (सालाना / سالانہ)" },
      { examType: "Half-Yearly", session: "2025-2026", label: "Half-Yearly Examination - 2025-2026 (छमाही / شش ماہی)" },
      { examType: "Quarterly", session: "2025-2026", label: "Quarterly Examination - 2025-2026 (तिमाही / سہ ماہی)" },
      { examType: "Annual", session: "2024-2025", label: "Annual Examination - 2024-2025 (सालाना / سالانہ)" },
      { examType: "Half-Yearly", session: "2024-2025", label: "Half-Yearly Examination - 2024-2025 (छमाही / شش ماہی)" },
      { examType: "Quarterly", session: "2024-2025", label: "Quarterly Examination - 2024-2025 (तिमाही / سہ ماہی)" },
    */
    
    // Scan real database results for any custom added variants
    results.forEach(res => {
      const type = res.examType || "Annual";
      const sess = normalizeSession(res.session);
      
      const exists = defaults.some(d => d.examType.toLowerCase() === type.toLowerCase() && d.session === sess);
      const listExists = list.some(l => l.examType.toLowerCase() === type.toLowerCase() && l.session === sess);
      
      if (!exists && !listExists) {
        list.push({
          examType: type,
          session: sess,
          label: `${type} Examination - ${sess}`
        });
      }
    });

    const combined = [...defaults, ...list];
    const uniques: typeof defaults = [];
    combined.forEach(p => {
      if (!uniques.some(u => u.examType.toLowerCase() === p.examType.toLowerCase() && u.session === p.session)) {
        uniques.push(p);
      }
    });
    return uniques;
  }, [results, availableSessions]);

  // Custom persistent logos from principal control panel uploads
  const [schoolLogo, setSchoolLogo] = useState<string>('');
  const [urduLogo, setUrduLogo] = useState<string>('');
  
  // Local printing rendering support
  const [printImage, setPrintImage] = useState<string>('');
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);

  useEffect(() => {
    // Load custom logos from cloud config first, then fall back to local storage
    const loadLogos = async () => {
      let sl = config?.marksheetLogo || config?.logoUrl || localStorage.getItem("m_logo");
      if (sl) {
        setSchoolLogo(await removeBlackBackground(sl));
      }

      let ul = config?.calligraphyBanner || localStorage.getItem("m_urdu_logo");
      if (ul) {
        setUrduLogo(ul);
      }
    };
    
    loadLogos();
  }, [searchTriggered, config]);

  const classes = React.useMemo(() => {
    let list: string[];
    if (config?.classes && config.classes.length > 0) {
      list = [...config.classes];
    } else {
      list = getSchoolClasses();
    }
    return Array.from(new Set(list));
  }, [config?.classes]) as ClassName[];

  useEffect(() => {
    if (classes.length > 0 && !classes.includes(selectedClass)) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    if (availableSessions.length > 0 && !availableSessions.includes(selectedSession)) {
      setSelectedSession(availableSessions[0]);
    }
  }, [availableSessions, selectedSession]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo.trim()) {
      alert("Please enter Roll Number to search!");
      return;
    }

    setSearchTriggered(true);
    // Find all results matching Roll Number, Class Name, and Exam Type
    const potentialMatches = results.filter(
      (r) =>
        r.rollNo.toString().trim() === rollNo.trim() &&
        r.className === selectedClass &&
        (r.examType || 'Annual').toLowerCase() === selectedExamType.toLowerCase()
    );

    let match = null;
    if (potentialMatches.length > 0) {
      // First try to find exact match with the currently selected session
      match = potentialMatches.find(
        (r) => normalizeSession(r.session).toLowerCase() === normalizeSession(selectedSession).toLowerCase()
      );
      
      // If no exact match for the selected session, but other sessions exist, pick the most recent one
      if (!match) {
        // Sort descending so the highest/newest year is first
        potentialMatches.sort((a, b) => normalizeSession(b.session).localeCompare(normalizeSession(a.session)));
        match = potentialMatches[0];
        
        // Auto-update the session dropdown to reflect the found result's actual session
        if (match.session) {
          setSelectedSession(normalizeSession(match.session));
        }
      }
    }

    if (match) {
      setFoundResult(match);
      setShowCelebration(true);
      playCelebrationSounds();
      triggerPatake();
    } else {
      setFoundResult(null);
      setShowCelebration(false);
    }
  };

  const handleReset = () => {
    setRollNo('');
    setSearchTriggered(false);
    setFoundResult(null);
    setPrintImage('');
    setShowCelebration(false);
  };

  // Maps stored marks to the 10 standard subjects gracefully
  const getSubjectMark = (res: Result, subject: string, index: number): number => {
    const marksData = res.marks || {};
    if (marksData[subject] !== undefined) {
      return Number(marksData[subject]) || 0;
    }
    const keys = Object.keys(marksData);
    const values = Object.values(marksData);

    // Substring search (e.g. "Quranic Tajweed" -> "Quran")
    const matchKey = keys.find(k => k.toLowerCase().includes(subject.toLowerCase()) || subject.toLowerCase().includes(k.toLowerCase()));
    if (matchKey !== undefined) {
      return Number(marksData[matchKey]) || 0;
    }

    // Fallback to absolute index mapping
    if (index < values.length) {
      return Number(values[index]) || 0;
    }

    return 75; // Default pleasing starter mark if unconfigured
  };

  const handleLaptopPrint = () => {
    setIsGeneratingPrint(true);
    
    // Delay print capture slightly to let the React state render dynamic top positioning adjustments
    setTimeout(() => {
      const printEl = document.getElementById('card-printed-view');
      if (!printEl) {
        alert("माफ कीजिये, मार्कशीट नहीं मिल सकी! (Error: Marksheet element not found!)");
        setIsGeneratingPrint(false);
        return;
      }

      try {
        // Create or retrieve a hidden print iframe (Perfect isolation without popup blocking)
        let printIframe = document.getElementById('print-iframe') as HTMLIFrameElement | null;
        if (!printIframe) {
          printIframe = document.createElement('iframe');
          printIframe.id = 'print-iframe';
          printIframe.style.position = 'fixed';
          printIframe.style.width = '0px';
          printIframe.style.height = '0px';
          printIframe.style.border = 'none';
          printIframe.style.top = '-1000px';
          printIframe.style.left = '-1000px';
          printIframe.style.pointerEvents = 'none';
          document.body.appendChild(printIframe);
        }

        const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
        if (!iframeDoc) {
          throw new Error("Iframe document not available");
        }

        // Collect all styles and links from the parent document to ensure tailwind works
        let parentStyles = '';
        document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
          parentStyles += node.outerHTML;
        });

        // Write base HTML with fonts
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Marksheet - Noorul Uloom</title>
              ${parentStyles}
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;650;700&family=Noto+Naskh+Arabic:wght@400;600;700&family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet" />
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  background-color: white !important;
                  color: black !important;
                  display: flex;
                  justify-content: center;
                  align-items: flex-start;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body, #card-printed-view, #card-printed-view * {
                  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                }
                .font-mono, [class*="font-mono"] {
                  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                }
                .font-arabic, [class*="font-arabic"] {
                  font-family: "Noto Naskh Arabic", serif !important;
                }
                .font-urdu, [class*="font-urdu"] {
                  font-family: "Noto Nastaliq Urdu", serif !important;
                }
                #card-printed-view {
                  box-shadow: none !important;
                  margin: 0 auto !important;
                  border: 5px solid #1e5631 !important;
                  width: 900px !important;
                  max-width: 900px !important;
                  height: 1311px !important;
                  min-height: 1311px !important;
                  max-height: 1311px !important;
                  display: flex !important;
                  flex-direction: column !important;
                  box-sizing: border-box !important;
                  transform: none !important;
                  zoom: ${printScale / 100} !important;
                }
                @media print {
                  body {
                    padding: 0;
                    margin: 0;
                    background-color: white !important;
                  }
                  #card-printed-view {
                    border: 5px solid #1e5631 !important;
                    background-color: white !important;
                    margin: 0 !important;
                  }
                  @page {
                    size: A4 portrait;
                    margin: 5mm;
                  }
                }
              </style>
            </head>
            <body>
              <div id="print-wrapper"></div>
            </body>
          </html>
        `);
        iframeDoc.close();

        // Copy printable content safely using importNode to avoid Wrong Document DOMException
        const printWrapper = iframeDoc.getElementById('print-wrapper');
        if (printWrapper) {
          const clone = iframeDoc.importNode(printEl, true) as HTMLElement;
          
          // Sync user input values
          const originalInputs = printEl.querySelectorAll('input, select, textarea');
          const clonedInputs = clone.querySelectorAll('input, select, textarea');
          originalInputs.forEach((inp, i) => {
            if (clonedInputs[i]) {
              (clonedInputs[i] as any).value = (inp as any).value;
            }
          });

          printWrapper.appendChild(clone);
        }

        // Copy styles/Tailwind safely using importNode
        const styleTags = window.document.querySelectorAll('style, link[rel="stylesheet"]');
        styleTags.forEach((styleTag) => {
          try {
            const importedStyle = iframeDoc.importNode(styleTag, true);
            iframeDoc.head.appendChild(importedStyle);
          } catch (styleErr) {
            console.warn("Style styleTag copy skipped:", styleErr);
          }
        });

        // Fire print preview inside iframe once fonts are loaded
        const triggerPrint = () => {
          try {
            printIframe?.contentWindow?.focus();
            printIframe?.contentWindow?.print();
          } catch (err) {
            console.error("Iframe print trigger failed, utilizing window.print() fallback:", err);
            window.focus();
            window.print();
          }
          setIsGeneratingPrint(false);
        };

        if ((iframeDoc as any).fonts && (iframeDoc as any).fonts.ready) {
          (iframeDoc as any).fonts.ready.then(() => {
            setTimeout(triggerPrint, 300);
          }).catch(() => {
            setTimeout(triggerPrint, 450);
          });
        } else {
          setTimeout(triggerPrint, 450);
        }

      } catch (e) {
        console.warn("Printing via iframe failed, falling back to direct window.print() directly:", e);
        // Fail-proof Direct Fallback
        setTimeout(() => {
          try {
            window.focus();
            window.print();
          } catch (err) {
            console.error("Direct printing fallback error:", err);
            alert("मार्कशीट प्रिंट करते समय त्रुटि हुई। कृपया इमेज डाउनलोड बटन का उपयोग करें!");
          }
          setIsGeneratingPrint(false);
        }, 150);
      }
    }, 150);
  };

  const handleDownloadJPG = () => {
    setIsGeneratingPrint(true);
    
    // Delay capture slightly to let the React state update flush and render shifted text positions
    setTimeout(() => {
      const card = document.getElementById('card-printed-view');
      if (!card) {
        alert("Error: Marksheet element not found!");
        setIsGeneratingPrint(false);
        return;
      }
      
      html2canvas(card, {
        scale: 2, // High DPI target quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff', // Ensures white backgrounds
        logging: false,
        onclone: (clonedDoc) => {
          // Explicitly inject the external Google Fonts and font-family rules to clonedDoc
          try {
            const fontLink = clonedDoc.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;650;700&family=Noto+Naskh+Arabic:wght@400;600;700&family=Noto+Nastaliq+Urdu:wght@400;700&display=swap';
            clonedDoc.head.appendChild(fontLink);

            const fontStyle = clonedDoc.createElement('style');
            fontStyle.textContent = `
              #card-printed-view, #card-printed-view * {
                font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              }
              .font-sans, [class*="font-sans"] {
                font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              }
              .font-mono, [class*="font-mono"] {
                font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
              }
              .font-arabic, [class*="font-arabic"] {
                font-family: "Noto Naskh Arabic", serif !important;
              }
              .font-urdu, [class*="font-urdu"] {
                font-family: "Noto Nastaliq Urdu", serif !important;
              }
              /* Preserve bold weight rendering properly */
              #card-printed-view span, #card-printed-view div, #card-printed-view td, #card-printed-view th {
                font-weight: inherit;
              }
            `;
            clonedDoc.head.appendChild(fontStyle);
          } catch (e) {
            console.warn("Could not inject custom styles into html2canvas clone:", e);
          }

          // Fix Tailwind v4 color issues in html2canvas (unsupported colors in style parsed list)
          try {
            // 1. Process inline styles of cloned style elements
            const styleEls = clonedDoc.querySelectorAll('style');
            styleEls.forEach((styleEl: any) => {
              if (styleEl.textContent) {
                styleEl.textContent = styleEl.textContent
                  .replace(/oklch\([^)]+\)/g, '#1e5631')
                  .replace(/oklab\([^)]+\)/g, '#1e5631');
              }
            });
          } catch (e) {
            console.warn("Could not replace text in style tags:", e);
          }

          try {
            // 2. Remove rules containing oklch / oklab in all parsed stylesheets
            for (let i = 0; i < clonedDoc.styleSheets.length; i++) {
              const sheet = clonedDoc.styleSheets[i];
              try {
                if (sheet.cssRules) {
                  for (let j = sheet.cssRules.length - 1; j >= 0; j--) {
                    const rule = sheet.cssRules[j];
                    if (rule.cssText && (rule.cssText.includes('oklch') || rule.cssText.includes('oklab'))) {
                      sheet.deleteRule(j);
                    }
                  }
                }
              } catch (sheetError) {
                // Ignore cross-origin stylesheet reading restrictions
              }
            }
          } catch (e) {
            console.warn("Could not filter rules in stylesheets:", e);
          }

          try {
            // 3. Purge element inline style values that contain oklch/oklab
            const elements = clonedDoc.querySelectorAll('*');
            elements.forEach((el: any) => {
              if (el.style) {
                if (el.style.color && (el.style.color.includes('oklch') || el.style.color.includes('oklab'))) {
                  el.style.color = '#1e5631';
                }
                if (el.style.backgroundColor && (el.style.backgroundColor.includes('oklch') || el.style.backgroundColor.includes('oklab'))) {
                  el.style.backgroundColor = '#ffffff';
                }
                if (el.style.borderColor && (el.style.borderColor.includes('oklch') || el.style.borderColor.includes('oklab'))) {
                  el.style.borderColor = '#1e5631';
                }
              }
            });
          } catch (e) {
            console.warn("Could not purge element styles:", e);
          }
        }
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `Noorul_Uloom_Marksheet_${foundResult?.rollNo || 'Result'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsGeneratingPrint(false);
      }).catch(err => {
        console.error("JPG export error:", err);
        setIsGeneratingPrint(false);
        alert("Download failed. Please print directly using 'Print Marksheet A4' or open in a new tab.");
      });
    }, 150);
  };

  // Determine current student's autocalculated rank relative to others
  const getAutocalculatedRank = (res: Result): string => {
    if (!res) return "-";
    const filteredByClass = results.filter(r => r.className === res.className);
    if (filteredByClass.length === 0) return "1";
    
    // Sort all by accumulated total
    const sorted = [...filteredByClass].sort((a,b) => {
      const totalA = Object.values(a.marks || {}).reduce((sum, v) => sum + (Number(v)||0), 0);
      const totalB = Object.values(b.marks || {}).reduce((sum, v) => sum + (Number(v)||0), 0);
      return totalB - totalA;
    });

    const rankIdx = sorted.findIndex(r => r.rollNo === res.rollNo);
    return rankIdx !== -1 ? String(rankIdx + 1) : "1";
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {showCelebration && foundResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 no-print">
          <div className="bg-gradient-to-br from-amber-50 to-white border-4 border-amber-400 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95">
            {/* Multi-color top accent bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-500 to-purple-500"></div>
            
            <div className="mt-4 flex justify-center gap-1 text-5xl">
              🎉 👏 💥
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e5631] mt-4 tracking-tight drop-shadow-sm">
              CONGRATULATIONS!
            </h2>
            <h3 className="text-xl font-bold text-amber-600 mt-1 font-sans">
              बधाई हो! / مبارکباد!
            </h3>
            
            <p className="text-slate-600 font-medium mt-3 text-sm sm:text-base px-2">
              शाबाश! आपका परीक्षा परिणाम घोषित हो चुका है और आप सफल रहे हैं!
            </p>

            {/* Student Highlight Box */}
            <div className="my-6 bg-white border border-amber-200 rounded-xl p-4 shadow-sm text-left space-y-2 max-w-xs mx-auto">
              <div className="flex justify-between border-b border-slate-100 pb-1.5 items-center">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Student Name</span>
                <span className="text-slate-900 font-extrabold text-sm text-right">{foundResult.studentName.toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5 items-center">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Class</span>
                <span className="text-slate-900 font-extrabold text-sm">{formatClassName(foundResult.className)}</span>
              </div>
              <div className="flex justify-between pb-0.5 items-center">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Roll No</span>
                <span className="text-slate-900 font-extrabold text-sm">{foundResult.rollNo}</span>
              </div>
            </div>

            {/* Main view marksheet action */}
            <button
              type="button"
              onClick={() => setShowCelebration(false)}
              className="w-full py-3.5 bg-[#1e5631] hover:bg-[#153e22] text-white font-extrabold text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              📄 मार्कशीट देखें / View Marksheet
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Overwrite Styles for perfect print formatting (Hiding standard page menus on print) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Force Light Color Scheme during printing */
          :root {
            color-scheme: light !important;
          }
          body {
            background: white !important;
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Counteract dark mode classes during print to prevent black sections */
          .dark, .dark * {
            background-color: transparent !important;
            color: black !important;
            border-color: #1e5631 !important;
          }
          /* Hide all general webpage elements on print */
          header, footer, .no-print, button, form, .controls, #savedListSection, .nav-ticker, .ticker-wrap, .news-ticker-container {
            display: none !important;
          }
          /* Let's make sure the card's outer wrappers don't block the visual printout */
          body * {
            visibility: hidden;
          }
          #card-printed-view, #card-printed-view * {
            visibility: visible !important;
          }
          #card-printed-view {
            position: relative !important;
            margin: 0 auto !important;
            width: 900px !important;
            max-width: 900px !important;
            height: 1311px !important; 
            min-height: 1311px !important;
            max-height: 1311px !important;
            border: 5px solid #1e5631 !important;
            box-shadow: none !important;
            background: white !important;
            background-color: white !important;
            color: black !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important; 
            transform-origin: top center !important;
            zoom: ${printScale / 100} !important;
            /* Allow browser to scale this 900x1311 block down to the page size */
          }
          
          #logoContainer, #logoContainer * , #logoContainer img, #urduLogoImg, .logo-container, .logo-container img {
            background-color: transparent !important;
            background: transparent !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #card-printed-view, #card-printed-view *, #card-printed-view img, #urduLogoImg, img {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          input, textarea, select {
            border: 1.5px solid #1e5631 !important;
            background-color: #f9fff9 !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
        }
      `}} />

      {/* Search Filter Headings */}
      <div className="text-center mb-8 space-y-2 no-print">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1e5631]/10 text-[#1e5631] dark:text-[#a4be7b] rounded-full text-xs font-bold uppercase tracking-widest">
          <Award className="w-3.5 h-3.5" /> Examination Results Portal
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          Annual Examination Mark List
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Enter student credentials to generate and print beautiful color-patterned dynamic certificates.
        </p>
      </div>

      {!searchTriggered ? (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl space-y-6 no-print">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
            <span className="text-xl">🕌</span>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">
              Search Result Card
            </h3>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Class / Stream</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value as ClassName);
                  setSearchTriggered(false);
                  setFoundResult(null);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white font-semibold focus:ring-1 focus:ring-emerald-500"
              >
                {classes.map((c) => (
                  <option key={c} value={c}>{formatClassName(c)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Exam Type</label>
                <select
                  value={selectedExamType}
                  onChange={(e) => {
                    setSelectedExamType(e.target.value);
                    setSearchTriggered(false);
                    setFoundResult(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white font-semibold focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Annual">Annual Examination</option>
                  <option value="Half-Yearly">Half-Yearly Examination</option>
                  <option value="Quarterly">Quarterly Examination</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Academic Year</label>
                <select
                  value={selectedSession}
                  onChange={(e) => {
                    setSelectedSession(e.target.value);
                    setSearchTriggered(false);
                    setFoundResult(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white font-semibold focus:ring-1 focus:ring-emerald-500"
                >
                  {availableSessions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Student Roll Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 2026101"
                value={rollNo}
                onChange={(e) => {
                  setRollNo(e.target.value.replace(/\D/g, ''));
                  setSearchTriggered(false);
                  setFoundResult(null);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white font-mono font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                <strong>💡 Quick Tip:</strong> Enter Roll: <code className="font-bold text-emerald-600">2026101</code> or <code className="font-bold text-emerald-600">2026102</code> to test!
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#1e5631] hover:bg-[#1a4929] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              Verify & Get Result Card
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-4 no-print">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Search Another
              </button>

              {foundResult && (
                <div className="flex gap-2 flex-wrap items-center">
                  {/* Print button on standard view */}
                  <button
                    onClick={handleLaptopPrint}
                    disabled={isGeneratingPrint}
                    className={`px-5 py-2 bg-[#1e5631] hover:bg-[#153e22] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer ${
                      isGeneratingPrint ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    <Printer className="w-4 h-4" /> 
                    {isGeneratingPrint ? "Preparing..." : "🖨️ Print Marksheet A4"}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile adjustment instructions & scale slider helper */}
            {foundResult && (
              <div className="p-3 bg-amber-50/50 dark:bg-slate-800/40 border border-amber-200/60 dark:border-slate-700/60 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-extrabold text-xs">
                    <span>📱</span>
                    <span>Mobile Screen Print Adjuster (मोबाइल प्रिंट साइज़ सुधारें)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    अगर मोबाइल से प्रिंट करने पर मार्कशीट साइड से कट रही है, तो नीचे से प्रिंट साइज़ को कम 
                    करें (जैसे <strong>70% या 75%</strong>) और प्रिंट सेटिंग्स में <strong>Portrait (पोर्ट्रेट)</strong> और 
                    <strong>A4</strong> साइज़ ज़रूर सेट करें।
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 min-w-[180px] justify-between shadow-sm">
                  <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">Print Size:</span>
                  <select
                    value={printScale}
                    onChange={(e) => setPrintScale(Number(e.target.value))}
                    className="bg-transparent text-xs font-extrabold text-[#1e5631] dark:text-[#a4be7b] border-none focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="100">100% (Normal)</option>
                    <option value="90">90% (Medium)</option>
                    <option value="85">85% (Compact)</option>
                    <option value="80">80% (Narrow)</option>
                    <option value="75">75% (Mobile Ideal)</option>
                    <option value="70">70% (Mobile Extra Fit)</option>
                    <option value="65">65% (Very Small)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {foundResult ? (
            /* EXACT HTML RENDERING WRAPPER WITH DIRECT SCALE SUPPORT FOR FULL COMPATIBILITY WITH IMAGE EXPORT */
            <div className="overflow-x-auto py-4">
              <div
                id="card-printed-view"
                className="bg-white text-black font-sans font-bold shadow-2xl relative select-none rounded-[16px]"
                style={{
                  width: '900px',
                  maxWidth: '900px',
                  height: '1311px',
                  minHeight: '1311px',
                  maxHeight: '1311px',
                  margin: 'auto',
                  background: '#ffffff',
                  border: '5px solid #1e5631',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}
              >
                {/* Header Curved Ribbon */}
                <div
                  id="topSpace"
                  style={{
                    position: 'relative',
                    height: '280px',
                    marginBottom: '30px',
                    background: 'linear-gradient(90deg, #fdfbf7, #fffdd0, #fdfbf7)',
                    margin: '-20px -20px 30px -20px',
                    padding: '15px',
                    borderRadius: '12px 12px 0 0',
                    clipPath: 'ellipse(110% 100% at 50% 0%)',
                    borderBottom: '2px solid #a5d6a7'
                  }}
                >
                  {/* Left Reg No */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '22px',
                      fontSize: '14px',
                      color: '#2e7d32',
                      fontWeight: 800,
                      zIndex: 15,
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center'
                    }}
                  >
                    Reg. No: 
                    <span 
                      style={{
                        border: 'none', 
                        background: 'transparent', 
                        paddingLeft: '4px',
                        color: '#000000',
                        fontWeight: 900
                      }} 
                    >
                      {foundResult.regNo || "G- 59313"}
                    </span>
                  </div>

                  {/* Right Rukniyat No (Positioned safely to the left of student photo box to prevent any overlaps) */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '22px',
                      fontSize: '14px',
                      color: '#1b5e20',
                      fontWeight: 800,
                      zIndex: 15,
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center',
                      direction: 'rtl',
                      fontFamily: '"Urdu Typesetting", "Sakkal Majalla", serif'
                    }}
                  >
                    رکنیت نمبر: 
                    <span 
                      style={{
                        border: 'none', 
                        background: 'transparent', 
                        paddingRight: '4px',
                        color: '#1b5e20',
                        fontWeight: 900,
                        fontFamily: 'sans-serif'
                      }} 
                    >
                      {foundResult.udise || "4053"}
                    </span>
                  </div>

                  {/* Left Stamp/Logo circle */}
                  <div 
                    id="logoContainer" 
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '40px',
                      width: '185px',
                      height: '185px',
                      zIndex: '10',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {schoolLogo ? (
                      <img src={schoolLogo} alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'transparent' }} />
                    ) : (
                      <div className="w-[170px] h-[170px] rounded-full border-4 border-[#1e5631] border-dashed flex flex-col items-center justify-center p-2 bg-[#fffdd0]/40 text-center">
                        <span className="text-[40px]">🕌</span>
                        <span className="text-[12px] font-black leading-tight text-[#1e5631]">NOORUL ULOOM</span>
                        <span className="text-[10px] font-bold text-[#1e5631]">KARMALHAN</span>
                      </div>
                    )}
                  </div>

                  {/* Draggable Header with text titles */}
                  <div 
                    id="headerDraggable" 
                    style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '100%',
                      textAlign: 'center',
                      zIndex: '5',
                      top: '10px'
                    }}
                  >
                    <div>
                      {urduLogo ? (
                        <img 
                          id="urduLogoImg" 
                          src={urduLogo} 
                          alt="Urdu Name calligraphy" 
                          style={{ maxWidth: '750px', height: '120px', objectFit: 'contain', margin: 'auto', backgroundColor: 'transparent' }} 
                        />
                      ) : (
                        <div style={{ height: '120px', width: '750px', margin: '0 auto' }} className="flex flex-col items-center justify-center p-2 rounded bg-[#fffdd0]/30">
                          <span style={{ fontSize: '38px', color: '#1b5e20', fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}>مَدْرَسَة عَرَبِيَّة نُورُ الْعُلُومِ كَارْمَاخَانْ</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0000FF', marginTop: '-5px', whiteSpace: 'nowrap' }}>
                      MADARSA ARABIA NOORUL ULOOM
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0000FF', whiteSpace: 'nowrap' }}>
                      Karma Khan, Distt: Sant Kabir Nagar (U.P.)
                    </div>
                    <div 
                      style={{
                        fontSize: '24px', 
                        marginTop: '8px', 
                        background: '#FFFDD0', 
                        color: '#000000', 
                        display: 'inline-block', 
                        padding: '4px 28px', 
                        borderRadius: '18px', 
                        border: '2px solid #1e5631',
                        fontWeight: 900
                      }}
                    >
                      {foundResult.examType 
                        ? (foundResult.examType.toLowerCase() === 'annual' 
                          ? 'Annual Examination' 
                          : foundResult.examType.toLowerCase() === 'half-yearly' 
                            ? 'Half-Yearly Examination' 
                            : foundResult.examType.toLowerCase() === 'quarterly'
                              ? 'Quarterly Examination'
                              : foundResult.examType)
                        : 'Annual Examination'
                      } - {normalizeSession(foundResult.session)}
                    </div>
                  </div>

                  {/* Right Student picture Frame */}
                  <div 
                    id="photoBox" 
                    style={{
                      position: 'absolute',
                      top: '50px',
                      right: '15px',
                      width: '150px',
                      height: '170px',
                      border: '3px solid #2e7d32',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: '10',
                      overflow: 'hidden'
                    }}
                  >
                    {foundResult.photoUrl ? (
                      <img 
                        src={foundResult.photoUrl} 
                        alt="Candidate Portrait" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span id="photoText" style={{ color: '#2e7d32', fontSize: '13px', fontWeight: 'bold' }}>Photo</span>
                    )}
                  </div>
                </div>

                {/* Student Details Fields - Beautifully Aligned Rows */}
                {/* Row 1 */}
                <div className="card-details-row" style={{ display: 'flex', gap: '15px', marginBottom: '12px', alignItems: 'center', color: '#1e5631', width: '100%' }}>
                  <div style={{ flex: '1.5', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '17px', fontWeight: 800, width: '130px', display: 'inline-block' }}>Student Name:</span> 
                    <input 
                      readOnly 
                      value={foundResult.studentName.toUpperCase()} 
                      style={{ 
                        fontSize: '17px', 
                        fontWeight: 900, 
                        border: '1.5px solid #1e5631', 
                        borderRadius: '4px', 
                        background: '#f9fff9', 
                        width: '100%', 
                        boxSizing: 'border-box', 
                        height: '32px', 
                        color: '#000000',
                        padding: '4px 8px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ flex: '1.5', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '17px', fontWeight: 800, width: '130px', display: 'inline-block' }}>Father Name:</span> 
                    <input 
                      readOnly 
                      value={foundResult.fatherName.toUpperCase()} 
                      style={{ 
                        fontSize: '17px', 
                        fontWeight: 900, 
                        border: '1.5px solid #1e5631', 
                        borderRadius: '4px', 
                        background: '#f9fff9', 
                        width: '100%', 
                        boxSizing: 'border-box', 
                        height: '32px', 
                        color: '#000000',
                        padding: '4px 8px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="card-details-row" style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', color: '#1e5631', width: '100%' }}>
                  <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, width: '105px', display: 'inline-block' }}>Mother Name:</span> 
                    <input 
                      readOnly 
                      value={(foundResult.motherName || "ZAREENA KHATOON").toUpperCase()} 
                      style={{ 
                        fontSize: '16px', 
                        fontWeight: 900, 
                        border: '1.5px solid #1e5631', 
                        borderRadius: '4px', 
                        background: '#f9fff9', 
                        width: '100%', 
                        boxSizing: 'border-box', 
                        height: '32px', 
                        color: '#000000',
                        padding: '4px 8px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ width: '185px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <span style={{ fontSize: '15px', fontWeight: 800 }}>D.O.B:</span> 
                    <input 
                      readOnly 
                      value={foundResult.dateOfBirth || "12-04-2011"} 
                      style={{ 
                        fontSize: '16px', 
                        fontWeight: 900, 
                        border: '1.5px solid #1e5631', 
                        borderRadius: '4px', 
                        background: '#f9fff9', 
                        width: '100%', 
                        boxSizing: 'border-box', 
                        height: '32px', 
                        color: '#000000',
                        textAlign: 'center',
                        padding: '4px 8px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ width: '145px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                     <span style={{ fontSize: '15px', fontWeight: 800 }}>Class:</span> 
                     <input 
                       readOnly 
                       value={formatClassName(foundResult.className)} 
                       style={{ 
                         fontSize: '16px', 
                         fontWeight: 900, 
                         border: '1.5px solid #1e5631', 
                         borderRadius: '4px', 
                         background: '#f9fff9', 
                         width: '100%', 
                         boxSizing: 'border-box', 
                         height: '32px', 
                         color: '#000000',
                         textAlign: 'center',
                         padding: '4px 8px',
                         outline: 'none'
                       }}
                     />
                  </div>
                  <div style={{ width: '115px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, width: '55px', display: 'inline-block' }}>Roll No:</span> 
                    <input 
                      readOnly 
                      value={foundResult.rollNo} 
                      style={{ 
                        fontSize: '16px', 
                        fontWeight: 900, 
                        border: '1.5px solid #1e5631', 
                        borderRadius: '4px', 
                        background: '#f9fff9', 
                        width: '100%', 
                        boxSizing: 'border-box', 
                        height: '32px', 
                        color: '#000000',
                        textAlign: 'center',
                        padding: '4px 8px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Address full width block underneath */}
                <div className="card-details-row" style={{ display: 'flex', gap: '15px', marginBottom: '14px', alignItems: 'center', color: '#1e5631', width: '100%' }}>
                  <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '17px', fontWeight: 800, width: '75px', display: 'inline-block' }}>Address:</span> 
                    <input 
                      readOnly 
                      value={foundResult.address || "VILLAGE & POST KARMA KHAN, DISTRICT SANT KABIR NAGAR, UTTAR PRADESH"} 
                      style={{ 
                        fontSize: '15px', 
                        fontWeight: 900, 
                        border: '1.5px solid #1e5631', 
                        borderRadius: '4px', 
                        background: '#f9fff9', 
                        width: '100%', 
                        boxSizing: 'border-box', 
                        height: '32px', 
                        color: '#000000',
                        padding: '4px 8px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Rainbow Table of Subject Marks */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: 'white', border: '2px solid #1e5631' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900, width: '60px', verticalAlign: 'middle' }}>S.R.</th>
                      <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>Subject</th>
                      <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900, width: '100px', verticalAlign: 'middle' }}>Max</th>
                      <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900, width: '160px', verticalAlign: 'middle' }}>Marks Obtained</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getClassSubjects(foundResult.className).map((sub, idx) => {
                      const mark = getSubjectMark(foundResult, sub, idx);
                      const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];

                      return (
                        <tr key={sub} style={{ backgroundColor: color }}>
                          <td style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontWeight: 900, color: '#000000', fontFamily: 'sans-serif', verticalAlign: 'middle' }}>{idx + 1}</td>
                          <td className="subject-name" style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontWeight: 950, fontStyle: 'italic', fontFamily: 'Georgia, serif', color: '#000000', verticalAlign: 'middle' }}>{sub}</td>
                          <td style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>100</td>
                          <td style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontWeight: 900, color: '#000000', verticalAlign: 'middle' }}>{mark}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    {/* Autocalculated Row Total */}
                    <tr style={{ background: '#f9fff9' }}>
                      <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontStyle: 'italic', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>Total</th>
                      <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>{getClassSubjects(foundResult.className).length * 100}</th>
                      <th id="total" style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontWeight: 900, color: '#000000', verticalAlign: 'middle' }}>
                        {getClassSubjects(foundResult.className).reduce((sum, sub, i) => sum + getSubjectMark(foundResult, sub, i), 0)}
                      </th>
                    </tr>
                    
                    {/* Autocalculated Percentage */}
                    <tr style={{ background: '#f9fff9' }}>
                      <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontStyle: 'italic', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>Percentage</th>
                      <th colSpan={2} id="percent" style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontWeight: 900, color: '#000000', verticalAlign: 'middle' }}>
                        {getClassSubjects(foundResult.className).length > 0 ? (
                          (getClassSubjects(foundResult.className).reduce((sum, sub, i) => sum + getSubjectMark(foundResult, sub, i), 0) / getClassSubjects(foundResult.className).length).toFixed(2)
                        ) : '0.00'}%
                      </th>
                    </tr>

                    {/* Student Rank relative to active database */}
                    <tr style={{ backgroundColor: '#fffdd0' }}>
                      <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontStyle: 'italic', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>Rank</th>
                      <th colSpan={2} id="rank" style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '18px', fontWeight: 900, color: '#000000', verticalAlign: 'middle' }}>
                        {getAutocalculatedRank(foundResult)}
                      </th>
                    </tr>

                    {/* Calculated Division Row */}
                    <tr style={{ backgroundColor: '#fffdd0' }}>
                      <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontStyle: 'italic', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>Division</th>
                      <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '18px', fontWeight: 900, color: '#000000', fontStyle: 'italic', verticalAlign: 'middle' }}>
                        {foundResult.division || ""}
                      </th>
                    </tr>
                  </tfoot>
                </table>

                {/* PASS / FAIL STATUS INDICATORS IN DECORATIVE PILLS FRAME */}
                <div 
                  id="resultBox"
                  style={{
                    margin: '15px auto', 
                    width: '70%', 
                    padding: '10px', 
                    textAlign: 'center', 
                    fontSize: '22px', 
                    fontWeight: 900, 
                    background: '#fdfbf7', 
                    border: '2px solid #1b5e20', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '40px', 
                    alignItems: 'center', 
                    color: '#1b5e20'
                  }}
                >
                  <span>RESULT:</span>
                  
                   {/* PASS✓ Label Block */}
                  <span 
                    className={`status-label ${
                      (getClassSubjects(foundResult.className).length > 0 &&
                       (getClassSubjects(foundResult.className).reduce((sum, sub, i) => sum + getSubjectMark(foundResult, sub, i), 0) / getClassSubjects(foundResult.className).length) >= 23) 
                        ? 'opacity-100 bg-white font-black' 
                        : 'opacity-25 line-through font-normal'
                    }`}
                    style={{
                      padding: '2px 20px',
                      borderRadius: '5px',
                      border: (getClassSubjects(foundResult.className).length > 0 &&
                              (getClassSubjects(foundResult.className).reduce((sum, sub, i) => sum + getSubjectMark(foundResult, sub, i), 0) / getClassSubjects(foundResult.className).length) >= 23) ? '2.5px solid #1b5e20' : '1px solid currentColor',
                      color: (getClassSubjects(foundResult.className).length > 0 &&
                              (getClassSubjects(foundResult.className).reduce((sum, sub, i) => sum + getSubjectMark(foundResult, sub, i), 0) / getClassSubjects(foundResult.className).length) >= 23) ? '#1b5e20' : '#888'
                    }}
                  >
                    PASS ✓
                  </span>

                  {/* FAIL✗ Label Block */}
                  <span 
                    className={`status-label ${
                      (getClassSubjects(foundResult.className).length === 0 ||
                       (getClassSubjects(foundResult.className).reduce((sum, sub, i) => sum + getSubjectMark(foundResult, sub, i), 0) / getClassSubjects(foundResult.className).length) < 23) 
                        ? 'opacity-100 bg-white font-black' 
                        : 'opacity-25 line-through font-normal'
                    }`}
                    style={{
                      padding: '2px 20px',
                      borderRadius: '5px',
                      border: (getClassSubjects(foundResult.className).length === 0 ||
                              (getClassSubjects(foundResult.className).reduce((sum, sub, i) => sum + getSubjectMark(foundResult, sub, i), 0) / getClassSubjects(foundResult.className).length) < 23) ? '2.5px solid #d32f2f' : '1px solid currentColor',
                      color: (getClassSubjects(foundResult.className).length === 0 ||
                              (getClassSubjects(foundResult.className).reduce((sum, sub, i) => sum + getSubjectMark(foundResult, sub, i), 0) / getClassSubjects(foundResult.className).length) < 23) ? '#d32f2f' : '#888'
                    }}
                  >
                    FAIL ✗
                  </span>
                </div>

                {/* Footer Signatures Area */}
                <div 
                  className="footer-sign"
                  style={{
                    marginTop: 'auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    padding: '0 40px',
                    paddingBottom: '30px',
                    color: '#1e5631',
                    fontSize: '16px',
                    height: '110px'
                  }}
                >
                  <div style={{ position: 'relative', width: '250px', textAlign: 'center' }}>
                    {config?.principalSignatureUrl ? (
                      <div style={{ position: 'absolute', bottom: '22px', left: '50%', transform: 'translateX(-50%)', width: '160px', height: '65px', pointerEvents: 'none' }}>
                        <img 
                          src={config.principalSignatureUrl} 
                          alt="Principal Signature" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : null}
                    <div style={{ borderTop: '1.5px solid #1e5631', paddingTop: '4px', fontWeight: 900 }}>Principal Signature</div>
                  </div>

                  <div style={{ position: 'relative', width: '250px', textAlign: 'center' }}>
                    {config?.schoolStampUrl ? (
                      <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', width: '165px', height: '165px', pointerEvents: 'none', zIndex: 10 }}>
                        <img 
                          src={config.schoolStampUrl} 
                          alt="School Stamp" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : null}
                    <div style={{ borderTop: '1.5px solid #1e5631', paddingTop: '4px', fontWeight: 900 }}>Stamp / Seal</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-red-50 dark:bg-slate-800/50 border border-red-200 dark:border-red-950/50 rounded-2xl text-center space-y-4 no-print">
              <span className="text-4xl block">⚠️</span>
              <h4 className="font-extrabold text-[#1e5631] dark:text-[#a4be7b] text-lg">Results Transcript Not Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal">
                No matching results on record for Class <strong>{selectedClass}</strong> with Roll Number <strong>"{rollNo}"</strong>. Please verify details with the administration.
              </p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-[#1e5631] text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Go Back & Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
