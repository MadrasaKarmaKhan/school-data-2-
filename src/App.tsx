import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import NewsTicker from './components/NewsTicker';
import Homepage from './components/Homepage';
import ResultPortal from './components/ResultPortal';
import PrincipalDashboard from './components/PrincipalDashboard';
import AdmissionForm from './components/AdmissionForm';
import DuaPage from './components/DuaPage';
import {
  Student, Result, Teacher, AdmissionApplication, GalleryItem, NewsItem, SchoolConfig, ClassName
} from './types';
import {
  INITIAL_CONFIG, INITIAL_STUDENTS, INITIAL_RESULTS, INITIAL_TEACHERS,
  INITIAL_ADMISSIONS, INITIAL_GALLERY, INITIAL_NEWS, getStoredData, setStoredData, getSchoolClasses
} from './data';
import { ArrowUp, MessageSquare, ShieldCheck, HelpCircle } from 'lucide-react';
import { syncToFirebase, subscribeToFirebase } from './lib/firebaseUtils';
import { compressBase64Image } from './lib/imageUtils';

function normalizeClassName(rawClass: any): any {
  if (!rawClass) return "EDADIA";
  const str = String(rawClass).trim().toUpperCase();
  if (str === "L.K.G" || str === "LKG" || str === "L. K. G.") return "L.K.G";
  if (str === "U.K.G" || str === "UKG" || str === "U. K. G.") return "U.K.G";
  if (str === "1ST A" || str === "1 A" || str === "1A" || str === "CLASS 1 A" || str.includes("1ST A") || str.includes("1 A")) return "1ST A";
  if (str === "1ST B" || str === "1 B" || str === "1B" || str === "CLASS 1 B" || str.includes("1ST B") || str.includes("1 B")) return "1ST B";
  if (str === "2ND A" || str === "2 A" || str === "2A" || str === "CLASS 2 A" || str.includes("2ND A") || str.includes("2 A")) return "2ND A";
  if (str === "2ND B" || str === "2 B" || str === "2B" || str === "CLASS 2 B" || str.includes("2ND B") || str.includes("2 B")) return "2ND B";
  if (str === "3RD A" || str === "3 A" || str === "3A" || str === "CLASS 3 A" || str.includes("3RD A") || str.includes("3 A")) return "3RD A";
  if (str === "3RD B" || str === "3 B" || str === "3B" || str === "CLASS 3 B" || str.includes("3RD B") || str.includes("3 B")) return "3RD B";
  if (str === "4TH A" || str === "4 A" || str === "4A" || str === "CLASS 4 A" || str.includes("4TH A") || str.includes("4 A")) return "4TH A";
  if (str === "4TH B" || str === "4 B" || str === "4B" || str === "CLASS 4 B" || str.includes("4TH B") || str.includes("4 B")) return "4TH B";
  if (str === "5TH A" || str === "5 A" || str === "5A" || str === "CLASS 5 A" || str.includes("5TH A") || str.includes("5 A")) return "5TH A";
  if (str === "5TH B" || str === "5 B" || str === "5B" || str === "CLASS 5 B" || str.includes("5TH B") || str.includes("5 B")) return "5TH B";

  if (str === "1" || str === "1ST" || str === "FIRST" || str === "I" || str === "CLASS 1" || str === "CLASS 1ST") return "1ST A";
  if (str === "2" || str === "2ND" || str === "SECOND" || str === "II" || str === "CLASS 2" || str === "CLASS 2ND") return "2ND A";
  if (str === "3" || str === "3RD" || str === "THIRD" || str === "III" || str === "CLASS 3" || str === "CLASS 3RD") return "3RD A";
  if (str === "4" || str === "4TH" || str === "FOURTH" || str === "IV" || str === "CLASS 4" || str === "CLASS 4TH") return "4TH A";
  if (str === "5" || str === "5TH" || str === "FIFTH" || str === "V" || str === "CLASS 5" || str === "CLASS 5TH") return "5TH A";
  if (str === "EDADIA" || str === "IDADIA" || str === "IDADYAH" || str === "EDADYAH" || str === "IDAADIYA" || str === "IDADIYA" || str === "I'DADIYAH" || str === "I'DADIYA") return "EDADIA";
  if (str === "FARSI") return "FARSI";
  if (str === "ARBI" || str === "ARABIC") return "ARBI";
  
  const valid = [
    ...getSchoolClasses(),
    '1ST', '2ND', '3RD', '4TH', '5TH'
  ];
  if (valid.includes(str)) return str;
  const found = valid.find(c => str.includes(c) || c.includes(str));
  if (found) return found;
  return "EDADIA";
}

export default function App() {
  // Loading Splash Screen state
  const [loading, setLoading] = useState(true);

  // Central Database States backed up to LocalStorage
  const [students, setStudents] = useState<Student[]>(() => getStoredData('nu_students', INITIAL_STUDENTS));
  const [results, setResults] = useState<Result[]>(() => {
    let loaded: Result[] = [];
    const primary = getStoredData<Result[]>('nu_results', []);
    if (primary && primary.length > 0) {
      loaded = primary;
    } else {
      const fallback = getStoredData<Result[]>('madarsa_records', []);
      if (fallback && fallback.length > 0) {
        loaded = fallback;
      } else {
        loaded = INITIAL_RESULTS;
      }
    }
    return loaded.filter(Boolean).map(r => ({
      ...r,
      rollNo: String(r.rollNo || ''),
      studentName: String(r.studentName || (r as any).name || ''),
      examType: r.examType || 'Annual',
      className: normalizeClassName(r.className) as ClassName,
      marks: typeof r.marks === 'string' ? JSON.parse(r.marks || '{}') : (r.marks || {})
    }));
  });
  const [teachers, setTeachers] = useState<Teacher[]>(() => getStoredData('nu_teachers', INITIAL_TEACHERS));
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>(() => getStoredData('nu_admissions', INITIAL_ADMISSIONS));
  const [gallery, setGallery] = useState<GalleryItem[]>(() => getStoredData('nu_gallery', INITIAL_GALLERY));
  const [news, setNews] = useState<NewsItem[]>(() => getStoredData('nu_news', INITIAL_NEWS));
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>(() => getStoredData('nu_config', INITIAL_CONFIG));

  // Visual/Environment parameters
  const [currentTab, setCurrentTab] = useState('home');
  const [darkMode, setDarkMode] = useState(() => getStoredData('nu_darkmode', false));
  const [isLoggedIn, setIsLoggedIn] = useState(() => getStoredData('nu_islogged', false));
  const [visitorCount, setVisitorCount] = useState(() => getStoredData('nu_visitors', 384));
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isLoggedInRef = useRef(isLoggedIn);
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  const lastFirebaseData = useRef<Record<string, string>>({});
  const initialRenderFlags = useRef<Record<string, boolean>>({
    students: true,
    results: true,
    teachers: true,
    admissions: true,
    gallery: true,
    news: true,
    config: true,
  });

  useEffect(() => {
    if (currentTab === 'donate') {
      setTimeout(() => {
        document.getElementById('donate')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [currentTab]);

  // Initial loader and migration effect
  useEffect(() => {
    // Migrate old default address/phone if present in stored local storage config to ensure user immediately sees the new address
    const stored = localStorage.getItem('nu_config');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.address?.includes("Lucknow") || parsed.contactPhone === "+91 98765 43210")) {
          parsed.address = "Noorul Uloom Campus Karma Khan District Sant Kabir Nagar Uttar Pradesh -272126";
          parsed.contactPhone = "+91 9193984452";
          parsed.whatsappNumber = "+919193984452";
          localStorage.setItem('nu_config', JSON.stringify(parsed));
          setSchoolConfig(parsed);
        }
      } catch (e) {
        console.error("Migration error: ", e);
      }
    }
    
    // Subscribe to Firebase Firestore and populate states (only if not admin, to prevent race conditions where admin data is overwritten)
    let unsubSchoolConfig: (() => void) | undefined;
    let unsubTeachers: (() => void) | undefined;
    let unsubStudents: (() => void) | undefined;
    let unsubResults: (() => void) | undefined;
    let unsubGallery: (() => void) | undefined;
    let unsubNews: (() => void) | undefined;
    let unsubAdmissions: (() => void) | undefined;

    let configLoaded = false;
    let newsLoaded = false;
    let studentsLoaded = false;
    let resultsLoaded = false;
    let teachersLoaded = false;
    let galleryLoaded = false;
    let admissionsLoaded = false;
    let hasCheckedLoading = false;

    const checkHideLoading = () => {
      if (configLoaded && newsLoaded && studentsLoaded && resultsLoaded && teachersLoaded && galleryLoaded && admissionsLoaded && !hasCheckedLoading) {
        hasCheckedLoading = true;
        setLoading(false);
      }
    };

    unsubSchoolConfig = subscribeToFirebase('schoolData', 'config', (data, fromCache, dataChanged) => {
      if (data && dataChanged) { lastFirebaseData.current['config'] = JSON.stringify(data); setSchoolConfig(data); }
      if (!fromCache) configLoaded = true;
      checkHideLoading();
    });
    unsubTeachers = subscribeToFirebase('schoolData', 'teachers', (data, fromCache, dataChanged) => {
      if (data && dataChanged) { lastFirebaseData.current['teachers'] = JSON.stringify(data); setTeachers(data); }
      if (!fromCache) teachersLoaded = true;
      checkHideLoading();
    });
    unsubStudents = subscribeToFirebase('schoolData', 'students', (data, fromCache, dataChanged) => {
      if (data && dataChanged) { lastFirebaseData.current['students'] = JSON.stringify(data); setStudents(data); }
      if (!fromCache) studentsLoaded = true;
      checkHideLoading();
    });
    unsubResults = subscribeToFirebase('schoolData', 'results', (data, fromCache, dataChanged) => {
      if (data && Array.isArray(data) && dataChanged) {
        const mapped = data.filter(Boolean).map(r => ({ ...r, rollNo: String(r.rollNo || ''), studentName: String(r.studentName || ''), className: normalizeClassName(r.className) as ClassName }));
        lastFirebaseData.current['results'] = JSON.stringify(mapped);
        setResults(mapped);
      }
      if (!fromCache) resultsLoaded = true;
      checkHideLoading();
    });
    unsubGallery = subscribeToFirebase('schoolData', 'gallery', (data, fromCache, dataChanged) => {
      if (data && dataChanged) { lastFirebaseData.current['gallery'] = JSON.stringify(data); setGallery(data); }
      if (!fromCache) galleryLoaded = true;
      checkHideLoading();
    });
    unsubNews = subscribeToFirebase('schoolData', 'news', (data, fromCache, dataChanged) => {
      if (data && dataChanged) { lastFirebaseData.current['news'] = JSON.stringify(data); setNews(data); }
      if (!fromCache) newsLoaded = true;
      checkHideLoading();
    });
    unsubAdmissions = subscribeToFirebase('schoolData', 'admissions', (data, fromCache, dataChanged) => {
      if (data && dataChanged) { lastFirebaseData.current['admissions'] = JSON.stringify(data); setAdmissions(data); }
      if (!fromCache) admissionsLoaded = true;
      checkHideLoading();
    });

    const timer = setTimeout(() => {
      if (!hasCheckedLoading) {
        hasCheckedLoading = true;
        setLoading(false);
      }
    }, 8000); // Wait up to 8 seconds for fresh data

    return () => {
      clearTimeout(timer);
      if (unsubSchoolConfig) unsubSchoolConfig();
      if (unsubTeachers) unsubTeachers();
      if (unsubStudents) unsubStudents();
      if (unsubResults) unsubResults();
      if (unsubGallery) unsubGallery();
      if (unsubNews) unsubNews();
      if (unsubAdmissions) unsubAdmissions();
    };
  }, []);

  // Sync results from Google Sheets
  useEffect(() => {
    const fetchFromSheets = async () => {
      // The user provided this exact macro, so we will fetch from it by default if custom config is missing.
      const defaultWebhookUrl = schoolConfig?.googleSheetsWebhookUrl || "https://script.google.com/macros/s/AKfycbzlXCkVwXgVQPqgAm3qbUsPZTrWAYeaZg_BLyj7ozCt3C7Ns1Y-teOFVcyA9esIqQA-tw/exec";
      
      const webhooks = [...(schoolConfig?.googleSheetsWebhooks || [])];
      
      // Always include the default one if not already in the list
      if (defaultWebhookUrl && !webhooks.some(w => w.url === defaultWebhookUrl)) {
        webhooks.push({ year: 'Default', url: defaultWebhookUrl });
      }

      if (webhooks.length === 0) return;

      try {
        const fetchPromises = webhooks.map(async (webhook) => {
          try {
            const response = await fetch(webhook.url);
            const text = await response.text();
            let data = [];
            try {
              data = JSON.parse(text);
            } catch (parseError) {
              console.warn(`Webhook ${webhook.url} returned non-JSON data.`);
              return [];
            }
            if (data && Array.isArray(data)) {
               return data.filter(Boolean).map((r: any) => ({
                 ...r,
                 rollNo: String(r.rollNo || ''),
                 studentName: String(r.studentName || ''),
                 className: normalizeClassName(r.className),
                 session: r.session || (webhook.year !== 'Default' ? webhook.year : undefined),
                 marks: typeof r.marks === 'string' ? JSON.parse(r.marks || '{}') : (r.marks || {})
               }));
            }
            return [];
          } catch(e) {
            console.warn(`Could not fetch from Google Sheets ${webhook.url}:`, e);
            return [];
          }
        });

        const allResultsArrays = await Promise.all(fetchPromises);
        const mapped = allResultsArrays.flat();

        if (mapped.length > 0) {
           setResults(prev => {
             const existingMap = new Map();
             prev.forEach(r => existingMap.set(`${String(r.rollNo).trim()}-${r.className}-${r.session}`, r));
             
             let changed = false;
             mapped.forEach(gsResult => {
               const key = `${String(gsResult.rollNo).trim()}-${gsResult.className}-${gsResult.session}`;
               if (!existingMap.has(key)) {
                 existingMap.set(key, gsResult);
                 changed = true;
               }
             });
             
             return changed ? Array.from(existingMap.values()) : prev;
           });
        }
      } catch (e) {
        console.error("Error during multiple sheets fetch", e);
      }
    };
    
    // Call the feature
    fetchFromSheets();
  }, [schoolConfig?.googleSheetsWebhookUrl, JSON.stringify(schoolConfig?.googleSheetsWebhooks), isLoggedIn]);

  const handleSync = useCallback((key: string, data: any, extraStorage?: string) => {
    setStoredData(`nu_${key}`, data);
    if (extraStorage) {
      localStorage.setItem(extraStorage, JSON.stringify(data));
    }
    
    const dataStr = JSON.stringify(data);
    
    if (initialRenderFlags.current[key]) {
      initialRenderFlags.current[key] = false;
      lastFirebaseData.current[key] = dataStr;
      return;
    }
    
    if (dataStr === lastFirebaseData.current[key]) {
      return;
    }
    
    localStorage.setItem(`nu_${key}_lastModified`, Date.now().toString());
    if (isLoggedIn) {
      const timer = setTimeout(() => syncToFirebase('schoolData', key, data), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  useEffect(() => { const cleanup = handleSync('students', students); if (cleanup) return cleanup; }, [students, handleSync]);
  useEffect(() => { const cleanup = handleSync('results', results, 'madarsa_records'); if (cleanup) return cleanup; }, [results, handleSync]);
  useEffect(() => { const cleanup = handleSync('teachers', teachers); if (cleanup) return cleanup; }, [teachers, handleSync]);
  useEffect(() => { const cleanup = handleSync('admissions', admissions); if (cleanup) return cleanup; }, [admissions, handleSync]);
  useEffect(() => { const cleanup = handleSync('gallery', gallery); if (cleanup) return cleanup; }, [gallery, handleSync]);
  useEffect(() => { const cleanup = handleSync('news', news); if (cleanup) return cleanup; }, [news, handleSync]);
  useEffect(() => { const cleanup = handleSync('config', schoolConfig); if (cleanup) return cleanup; }, [schoolConfig, handleSync]);

  useEffect(() => { setStoredData('nu_darkmode', darkMode); }, [darkMode]);
  useEffect(() => { setStoredData('nu_islogged', isLoggedIn); }, [isLoggedIn]);

  // Handle Dark mode DOM tags update
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Visitor increment on mount
  useEffect(() => {
    const freshVal = visitorCount + 1;
    setVisitorCount(freshVal);
    setStoredData('nu_visitors', freshVal);
  }, []);

  // Track window scroll coordinates for Scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Admission application submissions callback
  const handleAdmissionSubmit = (appData: Omit<AdmissionApplication, 'id' | 'applyDate' | 'status'> & { id?: string }) => {
    const yearPrefix = appData.academicYear ? appData.academicYear.split('-')[0] : new Date().getFullYear();
    const generatedId = appData.id || (`ADM-${yearPrefix}-` + Math.floor(1000 + Math.random() * 9000));
    const newApplication: AdmissionApplication = {
      ...appData,
      id: generatedId,
      applyDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setAdmissions(prev => [...prev, newApplication]);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    /* Full-screen Islamic design inspired Loading Animation */
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col justify-center items-center gap-6 z-50">
        <div className="relative flex justify-center items-center w-24 h-24">
          {/* Ornamental rotating circle */}
          <div className="absolute w-20 h-20 border-4 border-amber-400/40 rounded-full border-t-amber-400 animate-spin-slow"></div>
          {/* Inner pulse */}
          <span className="text-4xl animate-pulse">🕌</span>
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-bold tracking-widest text-amber-400 font-serif uppercase">
            Noorul Uloom
          </h2>
          <p className="text-[10px] font-mono tracking-widest text-emerald-450 uppercase text-emerald-400 font-bold">
            Loading Institution Ledger...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors flex flex-col justify-between font-sans selection:bg-emerald-650 selection:text-white pb-0">
      
      {/* Upper Navigation section */}
      <div>
        <Header
          config={schoolConfig}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          isLoggedIn={isLoggedIn}
          onLogout={() => setIsLoggedIn(false)}
          news={news}
        />

        {/* Bulletins notices scrolling bar */}
        <NewsTicker news={news} config={schoolConfig} />
      </div>

      {/* Main dynamic section content area */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full flex-grow">
        {(currentTab === 'home' || currentTab === 'donate') && (
          <Homepage
            config={schoolConfig}
            teachers={teachers}
            gallery={gallery}
            setCurrentTab={setCurrentTab}
            onAdmissionFormSubmit={handleAdmissionSubmit}
            isLoggedIn={isLoggedIn}
          />
        )}

        {currentTab === 'results' && (
          <ResultPortal results={results} config={schoolConfig} />
        )}

        {currentTab === 'admissions' && (
          <AdmissionForm onSubmit={handleAdmissionSubmit} admissions={admissions} gallery={gallery} config={schoolConfig} />
        )}

        {currentTab === 'dua' && (
          <DuaPage config={schoolConfig} />
        )}

        {currentTab === 'dashboard' && (
          <PrincipalDashboard
            students={students}
            setStudents={setStudents}
            results={results}
            setResults={setResults}
            teachers={teachers}
            setTeachers={setTeachers}
            admissions={admissions}
            setAdmissions={setAdmissions}
            gallery={gallery}
            setGallery={setGallery}
            news={news}
            setNews={setNews}
            schoolConfig={schoolConfig}
            setSchoolConfig={setSchoolConfig}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
          />
        )}
      </main>

      {/* Auxiliary Status Strip: Visitor Counter display */}
      <div className="bg-emerald-950 text-emerald-400 py-2.5 text-center text-xs font-mono border-t border-emerald-900 border-dashed">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center gap-2">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-amber-500 animate-pulse" /> Security Protection: Enabled</span>
          <span className="px-3 py-0.5 bg-emerald-900 border border-emerald-800 rounded-md font-bold text-amber-400">
            Visitor Counter Ledger: {visitorCount}
          </span>
        </div>
      </div>

      {/* Footer Area with marquee */}
      <Footer config={schoolConfig} onAdminClick={() => setCurrentTab('dashboard')} />

      {/* FLOATING ACTION UTILITIES */}

      {/* WhatsApp Chat Trigger Bubble */}
      <a
        href={`https://wa.me/${schoolConfig.whatsappNumber.replace(/[^0-9]/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-40 p-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-full shadow-2xl transition-all cursor-pointer flex items-center justify-center hover:-translate-y-1 hover:scale-105"
        title="Chat on WhatsApp"
      >
        <span className="relative flex h-3 w-3 absolute -top-1 -right-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
        <MessageSquare className="w-6 h-6 animate-pulse" />
      </a>

      {/* Scroll to Top Arrow Button */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-amber-50 rounded-full shadow-2xl transition-all cursor-pointer hover:-translate-y-1 hover:scale-105"
          title="Scroll back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

    </div>
  );
}
