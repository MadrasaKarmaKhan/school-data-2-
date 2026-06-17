import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getSchoolClasses } from '../data';
import { Sparkles, Key, UserPlus, LogIn, Award, Copy, Check, Info } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

export interface DuaStudent {
  code: string;
  name: string;
  className: string;
  rollNo: string;
  memorizedDuas: number[];
}

interface DuaAuthProps {
  onLogin: (student: DuaStudent) => void;
}

export default function DuaAuth({ onLogin }: DuaAuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regClass, setRegClass] = useState(getSchoolClasses()[0]);
  const [regRoll, setRegRoll] = useState('');
  const [regCodeOut, setRegCodeOut] = useState('');
  const [regError, setRegError] = useState('');
  const [copied, setCopied] = useState(false);

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

      <div className="p-8">
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-4">
                <Key className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Enter Your Code</h3>
              <p className="text-sm text-slate-500 mt-2">Enter the 6-digit code you received when registering.</p>
            </div>
            
            {loginError && <p className="text-red-500 text-sm text-center font-bold">{loginError}</p>}
            
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
          </form>
        ) : (
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
                  {getSchoolClasses().map(c => (
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
        )}
      </div>
    </div>
  );
}
