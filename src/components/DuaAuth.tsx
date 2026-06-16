import React, { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getSchoolClasses } from '../data';
import { Sparkles, Key, UserPlus, LogIn, Award } from 'lucide-react';
import { motion } from 'motion/react';

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

  const [loading, setLoading] = useState(false);

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
    return (
      <div className="max-w-md mx-auto mt-12 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900 rounded-full text-emerald-600 dark:text-emerald-400">
            <Award className="w-12 h-12" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Registration Successful!</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">Your Secret Login Code is:</p>
        <div className="bg-amber-100 dark:bg-amber-900/50 p-6 rounded-2xl mb-8">
          <span className="text-4xl font-mono font-black text-amber-700 dark:text-amber-400 tracking-widest">{regCodeOut}</span>
        </div>
        <p className="text-red-500 font-bold mb-6 text-sm">Please write this number down. You will need it to login to your account!</p>
        <button
          onClick={() => {
            setLoginCode(regCodeOut);
            setRegCodeOut('');
            setMode('login');
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95"
        >
          Go to Login
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
