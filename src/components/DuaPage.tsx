import React, { useState, useEffect } from 'react';
import { DAILY_DUAS } from '../data/duas';
import { ArrowRight, ArrowLeft, BookOpen, Star, Award, Sparkles, CheckCircle2, Shuffle, Crown, Medal, Flame, Trophy, Users, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { doc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getSchoolClasses } from '../data';
import DuaAuth, { DuaStudent } from './DuaAuth';
import { SchoolConfig } from '../types';

interface DuaPageProps {
  config?: SchoolConfig;
}

export default function DuaPage({ config }: DuaPageProps) {
  const [student, setStudent] = useState<DuaStudent | null>(null);
  const [allStudents, setAllStudents] = useState<DuaStudent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [memorizedDuas, setMemorizedDuas] = useState<number[]>([]);
  const [selectedClassTab, setSelectedClassTab] = useState<string>('');

  const classes = React.useMemo(() => {
    let list: string[];
    if (config?.classes && config.classes.length > 0) {
      list = [...config.classes];
    } else {
      list = getSchoolClasses();
    }
    return Array.from(new Set(list));
  }, [config?.classes]);

  // Auto-set selected class tab to student's own class on login
  useEffect(() => {
    if (student?.className) {
      setSelectedClassTab(student.className);
    }
  }, [student]);

  // Real-time listener for students to calculate ranks
  useEffect(() => {
    if (!student) return;
    const unsub = onSnapshot(
      collection(db, 'students'), 
      (snapshot) => {
        const studentsData: DuaStudent[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          studentsData.push({
             code: docSnap.id,
             name: data.name,
             className: data.className,
             rollNo: data.rollNo,
             memorizedDuas: data.memorizedDuas || []
          });
        });
        setAllStudents(studentsData);
        
        // Update current student's memorized duas from latest FB data mapping
        const me = studentsData.find(s => s.code === student.code);
        if (me) {
          setMemorizedDuas(me.memorizedDuas || []);
        }
      },
      (error: any) => {
        if (error?.code === 'resource-exhausted') {
          console.warn("Firebase Quota Exceeded for students collection. Using local state.");
        } else {
          console.error("Error fetching students:", error);
        }
      }
    );
    return () => unsub();
  }, [student]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('dua_student_code');
    setStudent(null);
    setMemorizedDuas([]);
  };

  // Try auto-login on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('dua_student_code');
    if (savedCode) {
      // Just set a dummy till real data arrives or do a fetch
      // For simplicity we will wait for them to click login, but we can auto-fetch:
      const fetchStud = async () => {
        const { getDoc } = await import('firebase/firestore');
        try {
           const ds = await getDoc(doc(db, 'students', savedCode));
           if(ds.exists()){
             const data = ds.data();
             setStudent({
               code: ds.id,
               name: data.name,
               className: data.className,
               rollNo: data.rollNo,
               memorizedDuas: data.memorizedDuas || []
             });
             setMemorizedDuas(data.memorizedDuas || []);
           } else {
             localStorage.removeItem('dua_student_code');
           }
        }catch(e){}
      };
      fetchStud();
    }
  }, []);

  const handleNext = () => {
    if (currentIndex < DAILY_DUAS.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleRandom = () => {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * DAILY_DUAS.length);
    } while (randomIndex === currentIndex && DAILY_DUAS.length > 1);
    setDirection(randomIndex > currentIndex ? 1 : -1);
    setCurrentIndex(randomIndex);
  };

  // Audio Context for success ding
  const playSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); 
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio play failed: ", e);
    }
  };

  const toggleMemorized = () => {
    const isMemorized = memorizedDuas.includes(currentDua.id);
    let newMemorized;
    
    if (isMemorized) {
      newMemorized = memorizedDuas.filter(id => id !== currentDua.id);
    } else {
      newMemorized = [...memorizedDuas, currentDua.id];
      playSuccessSound();
      
      // Different confetti based on total memorized
      const isMilestone = newMemorized.length % 10 === 0;
      confetti({
        particleCount: isMilestone ? 300 : 150,
        spread: isMilestone ? 100 : 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'],
        shapes: isMilestone ? ['star', 'circle'] : ['square', 'circle']
      });
    }
    
    setMemorizedDuas(newMemorized);
    if (student) {
      updateDoc(doc(db, 'students', student.code), {
        memorizedDuas: newMemorized
      }).catch(err => console.error("Error updating firebase: ", err));
    }
  };

  const currentDua = DAILY_DUAS[currentIndex];
  // Safe check in case CURRENT_DUA is undefined due to array changes
  if (!currentDua) {
     return <div>Loading...</div>;
  }
  
  const isCurrentlyMemorized = memorizedDuas.includes(currentDua.id);
  const progressPercentage = (memorizedDuas.length / DAILY_DUAS.length) * 100;

  // Level Logic
  const getLevel = (count: number) => {
    if (count >= 180) return { title: "Dua Legend", icon: <Crown className="w-6 h-6 text-pink-500 animate-bounce" />, color: "from-pink-500 to-purple-600" };
    if (count >= 130) return { title: "Dua Master", icon: <Crown className="w-6 h-6 text-yellow-500" />, color: "from-yellow-400 to-amber-600" };
    if (count >= 80) return { title: "Dua Scholar", icon: <Medal className="w-6 h-6 text-purple-500" />, color: "from-purple-400 to-indigo-600" };
    if (count >= 40) return { title: "Dua Explorer", icon: <Flame className="w-6 h-6 text-orange-500" />, color: "from-orange-400 to-red-500" };
    if (count >= 15) return { title: "Dua Learner", icon: <Star className="w-6 h-6 text-blue-500 fill-blue-500" />, color: "from-blue-400 to-cyan-500" };
    return { title: "Dua Beginner", icon: <Sparkles className="w-6 h-6 text-emerald-500" />, color: "from-emerald-400 to-teal-500" };
  };

  const currentLevel = getLevel(memorizedDuas.length);

  // Compute Top Student Per Class Leaderboard
  const topStudentsByClass: DuaStudent[] = (Object.values(
    allStudents.reduce((acc, s) => {
      if ((s.memorizedDuas?.length || 0) === 0) return acc;
      const score = s.memorizedDuas?.length || 0;
      if (!acc[s.className] || score > (acc[s.className].memorizedDuas?.length || 0)) {
        acc[s.className] = s;
      }
      return acc;
    }, {} as Record<string, DuaStudent>)
  ) as DuaStudent[]).sort((a, b) => (b.memorizedDuas?.length || 0) - (a.memorizedDuas?.length || 0));

  const topStudent = topStudentsByClass.length > 0 ? topStudentsByClass[0] : null;

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 animate-fade-in perspective-1000">
         <div className="flex flex-col items-center justify-center mb-8 text-center">
            <motion.div
              initial={{ scale: 0, y: -50 }}
              animate={{ scale: 1, y: 0, rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.7 }}
              className="p-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full shadow-lg mb-4"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent drop-shadow-sm mb-2">
              Dua Adventure Portal
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Please verify your student profile to track your memorization progress.</p>
         </div>
         <DuaAuth config={config} onLogin={(s) => {
           setStudent(s);
           setMemorizedDuas(s.memorizedDuas || []);
           localStorage.setItem('dua_student_code', s.code);
         }} />
      </div>
    );
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? -45 : 45
    }),
  };

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 animate-fade-in perspective-1000">
      
      {/* Fun Header */}
      <div className="flex flex-col items-center justify-center mb-8 text-center">
        <motion.div
           initial={{ scale: 0, y: -50 }}
           animate={{ scale: 1, y: 0, rotate: [0, -10, 10, -10, 0] }}
           transition={{ duration: 0.7 }}
           className={`p-4 bg-gradient-to-br ${currentLevel.color} rounded-full shadow-lg mb-4 cursor-pointer hover:scale-110 transition-transform`}
        >
          {currentLevel.icon}
        </motion.div>
        <h2 className={`text-3xl md:text-5xl font-extrabold bg-gradient-to-r ${currentLevel.color} bg-clip-text text-transparent drop-shadow-sm mb-2`}>
          Dua Adventure
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
             <span className="font-bold text-slate-700 dark:text-slate-300">Level: <span className="text-emerald-600 dark:text-emerald-400">{currentLevel.title}</span></span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
             <span className="font-bold text-slate-700 dark:text-slate-300">Student: <span className="text-amber-600 dark:text-amber-400">{student.name} ({student.className})</span></span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-3 py-2 rounded-full font-bold text-sm hover:bg-red-100 transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
      
      {/* Student Leaderboard Bar */}
      {topStudentsByClass.length > 0 && (
         <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between text-white border-4 border-emerald-300 dark:border-emerald-700 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10">
               <Trophy className="w-48 h-48 -mr-10 -mt-10" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
               <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                  <Trophy className="w-10 h-10 text-yellow-300" />
               </div>
               <div>
                  <h3 className="font-bold text-emerald-100 text-sm tracking-widest uppercase mb-1">Class Top Memorizers</h3>
                  <div className="text-2xl font-black">{topStudent?.name} ({topStudent?.className})</div>
                  <div className="text-sm text-emerald-100 font-medium">{topStudent?.memorizedDuas?.length || 0} Duas Memorized</div>
               </div>
            </div>
            
            <div className="flex -space-x-2 mt-4 md:mt-0 relative z-10 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
               {topStudentsByClass.slice(0, 5).map((s, idx) => (
                 <div key={s.code} className={`flex items-center gap-2 flex-shrink-0 bg-emerald-900/40 backdrop-blur-md px-4 py-3 rounded-full border-2 ${idx === 0 ? 'border-yellow-400 outline-2 outline-yellow-400/50 z-20' : 'border-emerald-400/30'}`}>
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-emerald-700 text-white'}`}>#{idx + 1}</span>
                    <span className="font-bold whitespace-nowrap">{s.name} <span className="text-emerald-200 ml-1 text-xs">({s.className}) - {s.memorizedDuas?.length || 0}</span></span>
                 </div>
               ))}
            </div>
         </div>
      )}

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border-4 border-emerald-400/50 dark:border-emerald-500/30 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Background blobs for fun look */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        {/* Progress Tracker */}
        <div className="flex flex-col mb-8 relative z-10 w-full max-w-xl mx-auto">
           <div className="flex justify-between items-center mb-2 font-bold text-sm">
             <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
               <Award className="w-5 h-5" /> Memorized: {memorizedDuas.length} / {DAILY_DUAS.length}
             </span>
             <span className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 px-3 py-1 rounded-full text-xs">
               Dua #{currentIndex + 1}
             </span>
           </div>
           <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-200 dark:border-slate-700 p-0.5 relative">
             <motion.div 
               className={`bg-gradient-to-r ${currentLevel.color} h-full rounded-full`}
               initial={{ width: 0 }}
               animate={{ width: `${progressPercentage}%` }}
               transition={{ duration: 0.5, ease: "easeOut" }}
             />
             {/* Progress milestones */}
             {[0.25, 0.5, 0.75].map(mark => (
                <div key={mark} className="absolute top-0 bottom-0 w-0.5 bg-white/50" style={{ left: `${mark * 100}%` }}></div>
             ))}
           </div>
        </div>

        {/* Flashcard Area */}
        <div className="w-full max-w-2xl mx-auto relative perspective-1000 z-10">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                rotateY: { duration: 0.4 }
              }}
              className={`w-full ${isCurrentlyMemorized ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'} border-4 rounded-3xl p-6 md:p-10 min-h-[400px] flex flex-col justify-center items-center gap-6 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.05)] relative transition-all duration-500`}
            >
              {isCurrentlyMemorized && (
                 <motion.div 
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 12 }}
                    transition={{ type: "spring", bounce: 0.6 }}
                    className="absolute -top-5 -right-5 bg-gradient-to-r from-green-400 to-emerald-500 text-white p-2 rounded-full shadow-xl flex items-center gap-1 font-black text-sm uppercase px-5 py-2 border-4 border-white dark:border-slate-800 z-20"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Learned!
                 </motion.div>
              )}

              <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-amber-100 border-b-4 border-slate-200 dark:border-slate-700 pb-4 text-center w-full">
                  {currentDua.title}
              </h3>
              
              <div className="w-full relative py-6">
                 <BookOpen className="w-32 h-32 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none" />
                 <p className="text-3xl md:text-5xl font-serif text-emerald-800 dark:text-emerald-300 leading-normal font-bold text-center drop-shadow-sm" dir="rtl" style={{ lineHeight: '1.8' }}>
                     {currentDua.arabic}
                 </p>
              </div>
              
              <div className="w-full flex flex-col gap-4 mt-auto">
                  <div className="bg-amber-100/50 dark:bg-amber-950/30 p-5 rounded-2xl border-2 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-colors cursor-pointer">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 border-b border-amber-200/50 dark:border-amber-900/50 pb-3">
                          <span className="font-black text-amber-800 dark:text-amber-500 bg-amber-200 dark:bg-amber-900/50 px-3 py-1 rounded-lg text-xs tracking-wider shadow-sm">हिन्दी TRANSLATION</span>
                          <p className="text-base md:text-lg text-slate-800 dark:text-slate-200 font-bold">
                              {currentDua.translationHindi}
                          </p>
                      </div>
                      <div className="flex flex-col sm:flex-row-reverse sm:items-center gap-2 sm:gap-4 mt-3">
                          <span className="font-black text-teal-800 dark:text-teal-500 bg-teal-200 dark:bg-teal-900/50 px-3 py-1 rounded-lg text-xs tracking-wider shadow-sm">اردو TRANSLATION</span>
                          <p className="text-base md:text-xl text-slate-800 dark:text-slate-200 font-medium font-serif" dir="rtl">
                              {currentDua.translationUrdu}
                          </p>
                      </div>
                  </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-10 relative z-10 w-full max-w-2xl mx-auto">
            <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex-1 min-w-[100px] flex justify-center items-center gap-2 px-4 py-4 rounded-2xl font-bold transition-all duration-300 disabled:opacity-40 hover:scale-105 active:scale-95 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 border-b-4"
            >
                <ArrowLeft className="w-5 h-5" /> 
            </button>
            
            <button
                onClick={handleRandom}
                className="flex-[1] min-w-[100px] flex justify-center items-center gap-2 px-4 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 bg-blue-100 text-blue-700 border-blue-300 border-2 border-b-4 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700"
                title="Surprise me with a random Dua!"
            >
                <Shuffle className="w-5 h-5" /> 
            </button>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMemorized}
                className={`flex-[2] min-w-[180px] flex justify-center items-center gap-2 px-6 py-4 rounded-2xl font-bold text-lg transition-colors duration-300 shadow-md hover:shadow-lg border-2 border-b-4 ${
                  isCurrentlyMemorized 
                    ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700' 
                    : 'bg-emerald-500 text-white border-emerald-700 hover:bg-emerald-400'
                }`}
            >
                {isCurrentlyMemorized ? (
                  <>
                    <Star className="w-6 h-6 fill-amber-500 text-amber-500" /> Memorized!
                  </>
                ) : (
                  <>
                    <Star className="w-6 h-6" /> I Memorized This
                  </>
                )}
            </motion.button>

            <button
                onClick={handleNext}
                disabled={currentIndex === DAILY_DUAS.length - 1}
                className="flex-1 min-w-[100px] flex justify-center items-center gap-2 px-4 py-4 rounded-2xl font-bold transition-all duration-300 shadow-md disabled:opacity-40 hover:scale-105 active:scale-95 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white border-2 border-emerald-700 border-b-4"
            >
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>
        
      </div>

      {/* 🏆 Detailed Class-by-Class Leaderboards Section */}
      <div className="mt-12 bg-white dark:bg-slate-900 border-4 border-amber-450/40 dark:border-amber-500/20 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-slate-100 dark:border-slate-800 pb-6 mb-8 relative z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-450 to-yellow-500 text-white rounded-2xl shadow-md">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-850 dark:text-amber-100 tracking-tight">
                कक्षावार रैंकिंग बोर्ड
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold tracking-wide uppercase">
                Class-wise Adventure Leaderboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-200">
            <Users className="w-4 h-4" /> Total Adventurers: <span className="font-extrabold text-lg ml-1">{allStudents.length}</span>
          </div>
        </div>

        {/* Class Selection Tabs */}
        <div className="mb-8 relative z-10">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-500" /> कक्षा चुनें (Choose Class to View Leaderboard)
          </p>
          
          <div className="flex gap-2 overflow-x-auto pb-3 pt-1 scroll-smooth hide-scrollbar -mx-2 px-2">
            {classes.map((className) => {
              const classStudents = allStudents.filter(s => s.className === className);
              const totalDuasInClass = classStudents.reduce((sum, s) => sum + (s.memorizedDuas?.length || 0), 0);
              const isActive = selectedClassTab === className;
              
              return (
                <button
                  key={className}
                  onClick={() => setSelectedClassTab(className)}
                  className={`flex-shrink-0 px-4 py-3 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 border-2 border-b-4 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-700 shadow-md scale-100'
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className={`w-5 h-5 text-xs flex items-center justify-center rounded-lg font-black ${
                    isActive ? 'bg-white text-emerald-700' : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}>
                    {classStudents.length}
                  </span>
                  <span>Class {className}</span>
                  {totalDuasInClass > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      🔥 {totalDuasInClass}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Class Performance & Rankings Card */}
        <div className="relative z-10 w-full animate-fade-in-up">
          {(() => {
            const classStudentsList = allStudents
              .filter(s => s.className === selectedClassTab)
              .sort((a, b) => {
                const scoreA = a.memorizedDuas?.length || 0;
                const scoreB = b.memorizedDuas?.length || 0;
                if (scoreB !== scoreA) {
                  return scoreB - scoreA;
                }
                const rollA = parseInt(a.rollNo) || 0;
                const rollB = parseInt(b.rollNo) || 0;
                return rollA - rollB;
              });

            if (classStudentsList.length === 0) {
              return (
                <div className="text-center py-12 px-6 bg-slate-50 dark:bg-slate-850 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-205">कक्षा {selectedClassTab} में कोई छात्र नहीं है</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    इस क्लास में अभी कोई छात्र पंजीकृत नहीं है। प्रगति देखने के लिए नया छात्र पंजीकृत करें।
                  </p>
                </div>
              );
            }

            // Calculations for Stats
            const classTotalDuas = classStudentsList.reduce((sum, s) => sum + (s.memorizedDuas?.length || 0), 0);
            const classAvgDuas = (classTotalDuas / classStudentsList.length).toFixed(1);
            const classChampion = classStudentsList[0];

            return (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-955/20 dark:to-orange-950/10 p-5 rounded-3xl border border-amber-200/50 dark:border-amber-900/30 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-amber-500 text-white rounded-2xl">
                      <Trophy className="w-6 h-6 animate-bounce" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-amber-800 dark:text-amber-500 tracking-wider uppercase mb-0.5">Class Champion</h4>
                      <p className="text-base font-black text-slate-800 dark:text-amber-300 truncate" title={classChampion.name}>{classChampion.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{classChampion.memorizedDuas?.length || 0} Duas Memorized</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-955/20 dark:to-teal-950/10 p-5 rounded-3xl border border-emerald-200/50 dark:border-emerald-900/30 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-emerald-500 text-white rounded-2xl">
                      <Star className="w-6 h-6 fill-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-500 tracking-wider uppercase mb-0.5">Total Memorized</h4>
                      <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{classTotalDuas} <span className="text-xs font-bold text-slate-550">Duas</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">In Class {selectedClassTab}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-955/20 dark:to-indigo-950/10 p-5 rounded-3xl border border-blue-200/50 dark:border-blue-900/30 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-blue-500 text-white rounded-2xl">
                      <Award className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-blue-850 dark:text-blue-400 tracking-wider uppercase mb-0.5">Average Progress</h4>
                      <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{classAvgDuas} <span className="text-xs font-bold text-slate-550">Duas / Student</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{classStudentsList.length} Active Adventurers</p>
                    </div>
                  </div>
                </div>

                {/* Rank Table List */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-4 grid grid-cols-12 gap-2 text-xs font-black text-slate-600 dark:text-slate-300 tracking-wider uppercase">
                    <div className="col-span-2">Rank (रैंक)</div>
                    <div className="col-span-1">Roll</div>
                    <div className="col-span-5 sm:col-span-6">Student Name (नाम)</div>
                    <div className="col-span-4 sm:col-span-3 text-right">Progress (याद हूई दुआएं)</div>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-850">
                    {classStudentsList.map((s, idx) => {
                      const isMe = s.code === student.code;
                      const score = s.memorizedDuas?.length || 0;
                      const userLevel = getLevel(score);
                      const sProgressPercentage = (score / DAILY_DUAS.length) * 100;

                      // Styles for top 3 places
                      let rankStyle = "bg-slate-100 dark:bg-slate-805 text-slate-700 dark:text-slate-300";
                      let rankText = `#${idx + 1}`;
                      let rankBadge = null;

                      if (idx === 0) {
                        rankStyle = "bg-amber-100 text-amber-900 border-2 border-amber-400 font-extrabold";
                        rankBadge = "🏆";
                      } else if (idx === 1) {
                        rankStyle = "bg-slate-205 text-slate-900 border-2 border-slate-400 font-extrabold";
                        rankBadge = "🥈";
                      } else if (idx === 2) {
                        rankStyle = "bg-orange-100 text-orange-950 border-2 border-orange-300 font-extrabold";
                        rankBadge = "🥉";
                      }

                      return (
                        <div
                          key={s.code}
                          className={`px-6 py-4 grid grid-cols-12 gap-2 items-center transition-colors ${
                            isMe 
                              ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500 dark:bg-emerald-950/30' 
                              : 'hover:bg-slate-100/40 dark:hover:bg-slate-800/20'
                          }`}
                        >
                          {/* Rank Badge */}
                          <div className="col-span-2 flex items-center gap-1.5">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-extrabold ${rankStyle}`}>
                              {rankBadge ? rankBadge : rankText}
                            </span>
                          </div>

                          {/* Roll Number */}
                          <div className="col-span-1 font-mono text-sm tracking-widest font-bold text-slate-500 dark:text-slate-400">
                            {s.rollNo}
                          </div>

                          {/* Student Name */}
                          <div className="col-span-5 sm:col-span-6 flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                              {s.name}
                            </span>
                            {isMe && (
                              <span className="bg-emerald-500 text-white font-black text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                You (आप)
                              </span>
                            )}
                            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-205/65 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-extrabold">
                              {userLevel.title}
                            </span>
                          </div>

                          {/* Score and Bar */}
                          <div className="col-span-4 sm:col-span-3 text-right flex flex-col items-end gap-1.5">
                            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                              {score} / {DAILY_DUAS.length} <span className="text-[10px] font-bold text-slate-400">Duas</span>
                            </span>
                            <div className="w-full max-w-[120px] bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`bg-gradient-to-r ${userLevel.color} h-full rounded-full`} 
                                style={{ width: `${sProgressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
