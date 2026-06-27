import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getSchoolClasses } from '../data';
import { Sparkles, Key, UserPlus, LogIn, Award, Copy, Check, Info, Search, HelpCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

export interface DuaStudent {
  code: string;
  name: string;
  className: string;
  rollNo: string;
  memorizedDuas: number[];
}

import { SchoolConfig } from '../types';

interface DuaAuthProps {
  onLogin: (student: DuaStudent) => void;
  config?: SchoolConfig;
}

export default function DuaAuth({ onLogin, config }: DuaAuthProps) {
  const classes = React.useMemo(() => {
    let list: string[];
    if (config?.classes && config.classes.length > 0) {
      list = [...config.classes];
    } else {
      list = getSchoolClasses();
    }
    return Array.from(new Set(list));
  }, [config?.classes]);

  const [mode, setMode] = useState<'login' | 'register' | 'find-code'>('login');
  
  // Login State
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regClass, setRegClass] = useState(classes[0] || 'EDADIA');
  const [regRoll, setRegRoll] = useState('');
  const [regCodeOut, setRegCodeOut] = useState('');
  const [regError, setRegError] = useState('');
  const [copied, setCopied] = useState(false);

  // Find Code State (Forgot Code)
  const [findClass, setFindClass] = useState(classes[0] || 'EDADIA');
  const [findRoll, setFindRoll] = useState('');
  const [findName, setFindName] = useState('');
  const [findError, setFindError] = useState('');
  const [findResults, setFindResults] = useState<Array<{ code: string; name: string; rollNo: string; className: string }>>([]);
  const [searched, setSearched] = useState(false);
  const [copiedFoundCode, setCopiedFoundCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // Spark firecrackers confetti on successful registration!
  useEffect(() => {
    if (regCodeOut) {
      // Firework confetti sequence simulating "patake foote"
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 1000 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 45 * (timeLeft / duration);
        // Left side fireworks
        confetti({ 
          ...defaults, 
          particleCount, 
          origin: { x: randomInRange(0.1, 0.35), y: Math.random() - 0.2 },
          colors: ['#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#ff4500']
        });
        // Right side fireworks
        confetti({ 
          ...defaults, 
          particleCount, 
          origin: { x: randomInRange(0.65, 0.9), y: Math.random() - 0.2 },
          colors: ['#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#ff4550']
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [regCodeOut]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginCode.trim()) return;
    setLoading(true);
    setLoginError('');
    try {
      const docRef = doc(db, 'students', loginCode.trim());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        onLogin({
          code: docSnap.id,
          name: data.name,
          className: data.className,
          rollNo: data.rollNo,
          memorizedDuas: data.memorizedDuas || []
        });
      } else {
        setLoginError('Invalid Code. No student found.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Network Error. Please try again.');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regRoll.trim()) {
      setRegError('Please provide Name and Roll No');
      return;
    }
    setLoading(true);
    setRegError('');
    try {
      // Generate unique 6 digit code
      let code = '';
      let exists = true;
      while (exists) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        const docRef = doc(db, 'students', code);
        const docSnap = await getDoc(docRef);
        exists = docSnap.exists();
      }
      
      const newStudent = {
        name: regName.trim(),
        className: regClass,
        rollNo: regRoll.trim(),
        memorizedDuas: []
      };
      
      await setDoc(doc(db, 'students', code), newStudent);
      setRegCodeOut(code);
    } catch (err) {
      console.error(err);
      setRegError('Could not register. Please try again.');
    }
    setLoading(false);
  };

  const handleFindCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findRoll.trim() && !findName.trim()) {
      setFindError('Please enter details to search (लिखें: अपना रोल नंबर या नाम)');
      return;
    }
    setLoading(true);
    setFindError('');
    setFindResults([]);
    setSearched(true);

    try {
      const q = query(
        collection(db, 'students'),
        where('className', '==', findClass)
      );
      const querySnapshot = await getDocs(q);
      const matched: Array<{ code: string; name: string; rollNo: string; className: string }> = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const studentName = data.name || '';
        const studentRoll = data.rollNo || '';
        
        let isMatch = true;

        if (findRoll.trim()) {
          const normInputRoll = findRoll.trim().replace(/^0+/, '').toLowerCase();
          const normStudentRoll = String(studentRoll).trim().replace(/^0+/, '').toLowerCase();
          if (normInputRoll !== normStudentRoll) {
            isMatch = false;
          }
        }

        if (findName.trim()) {
          const normInputName = findName.trim().toLowerCase();
          const normStudentName = studentName.trim().toLowerCase();
          if (!normStudentName.includes(normInputName)) {
            isMatch = false;
          }
        }

        if (isMatch) {
          matched.push({
            code: doc.id,
            name: studentName,
            rollNo: String(studentRoll),
            className: data.className || ''
          });
        }
      });

      setFindResults(matched);
      if (matched.length === 0) {
        setFindError('No matching student found. Please check spelling, Class, or Roll No. (कोई छात्र नहीं मिला, कृपया स्पेलिंग या रोल नंबर जांचें)');
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'resource-exhausted') {
        setFindError('Server is currently too busy (Quota Exceeded). Please try again later.');
      } else {
        setFindError('Connection error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (regCodeOut) {
    const handleCopy = () => {
      navigator.clipboard.writeText(regCodeOut);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    };

    return (
      <div className="max-w-md mx-auto mt-12 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl text-center border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        {/* Colorful top border pattern */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-500 to-blue-500" />
        
        <motion.div 
          initial={{ scale: 0, rotate: -180 }} 
          animate={{ scale: 1, rotate: 0 }} 
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex justify-center mb-6 mt-2"
        >
          <div className="p-4 bg-emerald-100 dark:bg-emerald-950/50 rounded-full text-emerald-600 dark:text-emerald-400 shadow-inner">
            <Award className="w-14 h-14 animate-pulse" />
          </div>
        </motion.div>

        {/* Big Congratulations Name Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1"
        >
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-amber-50 to-emerald-700 dark:from-emerald-400 dark:via-amber-400 dark:to-emerald-300">
            Congratulations!
          </h2>
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
            {regName}
          </h3>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold text-base mt-1">
            बधाई हो, {regName}! | مبارک ہو، {regName}!
          </p>
        </motion.div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-6 font-medium">Your Unique Login Code is:</p>
        
        {/* Interactive Big Code Display */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-850 p-6 rounded-2xl my-4 border-2 border-amber-300 dark:border-amber-900/50 relative group"
        >
          <span className="text-5xl font-mono font-black text-amber-600 dark:text-amber-400 tracking-[0.25em] pl-[0.25em] inline-block filter drop-shadow">
            {regCodeOut}
          </span>
        </motion.div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`mx-auto mb-6 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 ${
            copied 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300' 
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Copied! (कॉपी हो गया)</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Code (कोड कॉपी करें)</span>
            </>
          )}
        </button>

        {/* Warning / Save Info Box */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/30 p-4 rounded-2xl mb-8 text-left space-y-3"
        >
          <div className="flex items-start gap-2.5">
            <Info className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-zinc-800 dark:text-zinc-200 font-extrabold text-sm uppercase tracking-wide">
                Important Instruction (ज़रूरी नोट):
              </h4>
              <p className="text-rose-700 dark:text-rose-300 text-xs font-semibold leading-relaxed">
                👉 <strong className="font-extrabold text-rose-800 dark:text-rose-300">बच्चे ध्यान दें:</strong> इस 6-डिजिट नंबर को अपनी डायरी या कॉपी में ध्यान से नोट कर लें! इसके बिना आप दोबारा लॉग इन नहीं कर पाएंगे।
              </p>
              <p className="text-rose-700 dark:text-rose-300 text-xs font-semibold leading-relaxed">
                👉 <strong className="font-extrabold text-rose-800 dark:text-rose-300">اہم ہدایت:</strong> اس 6 ہندسوں والے نمبر کو اپنی ڈائری یا کاپی میں لکھ لیں! اگلی بار لاگ ان کرنے کے لیے اس کی ضرورت ہوگی۔
              </p>
            </div>
          </div>
        </motion.div>

        <button
          type="button"
          onClick={() => {
            setLoginCode(regCodeOut);
            setRegCodeOut('');
            setMode('login');
          }}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-md active:scale-95 text-base flex justify-center items-center gap-2"
        >
          <span>Go to Class & Learn (क्लास में जाएँ)</span> <Sparkles className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-fade-in">
      {mode !== 'find-code' ? (
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-4 font-bold text-center transition-colors flex justify-center items-center gap-2 ${mode === 'login' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-b-4 border-emerald-500 text-emerald-700 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <LogIn className="w-5 h-5" /> Login Code
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-4 font-bold text-center transition-colors flex justify-center items-center gap-2 ${mode === 'register' ? 'bg-amber-50 dark:bg-amber-900/20 border-b-4 border-amber-500 text-amber-700 dark:text-amber-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <UserPlus className="w-5 h-5" /> New Student
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900/50 dark:to-slate-850 px-8 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="font-extrabold text-slate-750 dark:text-amber-400 text-sm flex items-center gap-1.5 select-none">
            <HelpCircle className="w-4.5 h-4.5 text-amber-500" /> Code Finder (अपना कोड ढूँढें)
          </span>
          <button
            onClick={() => {
              setMode('login');
              setFindError('');
              setSearched(false);
            }}
            className="text-xs font-black text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back (पीछे)
          </button>
        </div>
      )}

      <div className="p-8">
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-4">
                <Key className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Enter Your Code</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">Enter the 6-digit code you received when registering.</p>
            </div>
            
            {loginError && <p className="text-red-500 text-sm text-center font-bold bg-rose-50 dark:bg-rose-950/20 py-2 px-4 rounded-xl border border-rose-200 dark:border-rose-900/30">{loginError}</p>}
            
            <div>
              <input
                type="text"
                placeholder="e.g. 123456"
                value={loginCode}
                onChange={e => setLoginCode(e.target.value.replace(/\D/, '').substring(0, 6))}
                className="w-full text-center text-3xl font-mono py-4 bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || loginCode.length < 6}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? 'Verifying...' : 'Login & Learn'} <Sparkles className="w-5 h-5" />
            </button>

            {/* Link to Code Finder */}
            <div className="text-center border-t border-slate-100 dark:border-slate-700/60 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setFindError('');
                  setSearched(false);
                  setMode('find-code');
                }}
                className="text-xs font-black text-amber-600 dark:text-amber-400 hover:text-amber-500 duration-150 select-none hover:underline"
              >
                Forgot your Login Code? Click here (अपना कोड ढूँढें)
              </button>
            </div>
          </form>
        ) : mode === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Student Registration</h3>
              <p className="text-sm text-slate-500 mt-2">Fill in your details to get your login code.</p>
            </div>

            {regError && <p className="text-red-500 text-sm text-center font-bold">{regError}</p>}

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Student Name</label>
              <input
                type="text"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="e.g. Abdullah"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Class</label>
                <select
                  value={regClass}
                  onChange={e => setRegClass(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {classes.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Roll No</label>
                <input
                  type="text"
                  value={regRoll}
                  onChange={e => setRegRoll(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? 'Generating...' : 'Get My Code'}
            </button>
          </form>
        ) : (
          /* CODE FINDER FORM */
          <form onSubmit={handleFindCode} className="space-y-5">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-amber-100 dark:bg-amber-950/50 rounded-full mb-3">
                <Search className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Find My Code</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
                👉 Enter your Class and Roll Number or Name to recover your login code. <br />
                👉 अपना कोड दोबारा जानने के लिए क्लास और रोल नंबर या नाम दर्ज करें।
              </p>
            </div>

            {findError && (
              <p className="text-red-500 text-xs text-center font-bold bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/30">
                {findError}
              </p>
            )}

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Select Class (क्लास का चयन करें)</label>
              <select
                value={findClass}
                onChange={e => setFindClass(e.target.value)}
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Roll No (रोल नंबर)</label>
                <input
                  type="text"
                  placeholder="e.g. 5"
                  value={findRoll}
                  onChange={e => setFindRoll(e.target.value.replace(/\s/, ''))}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Name (स्पेलिंग/नाम)</label>
                <input
                  type="text"
                  placeholder="e.g. Fatima"
                  value={findName}
                  onChange={e => setFindName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              <Search className="w-4.5 h-4.5" />
              <span>{loading ? 'Searching...' : 'Find My Code (ढूंढें)'}</span>
            </button>

            {/* RESULTS FROM FIREBASE ACCORDION */}
            {searched && findResults.length > 0 && (
              <div className="mt-6 space-y-4 border-t border-slate-100 dark:border-slate-700 pt-5 text-left">
                <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 text-center uppercase tracking-wider animate-pulse">
                  🎉 Code Found! (आपका कोड मिल गया)
                </h4>
                <div className="space-y-3">
                  {findResults.map((st) => (
                    <div 
                      key={st.code} 
                      className="bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-900/40 p-4 rounded-2xl relative shadow-sm animate-scale-up"
                    >
                      <div className="mb-2">
                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm">
                          {st.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          Class: {st.className} | Roll No: {st.rollNo}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl flex justify-between items-center bg-gradient-to-r">
                        <span className="font-mono font-black text-2xl text-amber-600 dark:text-amber-400 tracking-widest pl-1">
                          {st.code}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {/* Copy code button */}
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(st.code);
                              setCopiedFoundCode(st.code);
                              setTimeout(() => setCopiedFoundCode(null), 2500);
                            }}
                            className={`p-2 rounded-lg border transition hover:scale-105 active:scale-95 ${
                              copiedFoundCode === st.code
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300'
                                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 border-slate-200 dark:border-slate-75 *:'
                            }`}
                            title="Copy Code"
                          >
                            {copiedFoundCode === st.code ? (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Login Now directly with this student */}
                          <button
                            type="button"
                            onClick={() => {
                              setLoginCode(st.code);
                              setMode('login');
                            }}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-3.5 py-2 rounded-lg transition active:scale-95 duration-100 hover:scale-102"
                          >
                            Use Code (लॉग इन करें)
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
