import React, { useState, useEffect } from 'react';
import { DAILY_DUAS } from '../data/duas';
import { ArrowRight, ArrowLeft, BookOpen, Star, Award, Sparkles, CheckCircle2, Shuffle, Crown, Medal, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export default function DuaPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [memorizedDuas, setMemorizedDuas] = useState<number[]>([]);

  // Load memorized duas from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('memorizedDuas');
    if (saved) {
      try {
        setMemorizedDuas(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse memorized duas", e);
      }
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
    localStorage.setItem('memorizedDuas', JSON.stringify(newMemorized));
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
    if (count >= 80) return { title: "Dua Master", icon: <Crown className="w-6 h-6 text-yellow-500" />, color: "from-yellow-400 to-amber-600" };
    if (count >= 50) return { title: "Dua Scholar", icon: <Medal className="w-6 h-6 text-purple-500" />, color: "from-purple-400 to-indigo-600" };
    if (count >= 20) return { title: "Dua Explorer", icon: <Flame className="w-6 h-6 text-orange-500" />, color: "from-orange-400 to-red-500" };
    if (count >= 5) return { title: "Dua Learner", icon: <Star className="w-6 h-6 text-blue-500 fill-blue-500" />, color: "from-blue-400 to-cyan-500" };
    return { title: "Dua Beginner", icon: <Sparkles className="w-6 h-6 text-emerald-500" />, color: "from-emerald-400 to-teal-500" };
  };

  const currentLevel = getLevel(memorizedDuas.length);

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
           transition={{ duration: 0.7, type: 'spring', bounce: 0.5 }}
           className={`p-4 bg-gradient-to-br ${currentLevel.color} rounded-full shadow-lg mb-4 cursor-pointer hover:scale-110 transition-transform`}
        >
          {currentLevel.icon}
        </motion.div>
        <h2 className={`text-3xl md:text-5xl font-extrabold bg-gradient-to-r ${currentLevel.color} bg-clip-text text-transparent drop-shadow-sm mb-2`}>
          Dua Adventure
        </h2>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
           <span className="font-bold text-slate-700 dark:text-slate-300">Level: <span className="text-emerald-600 dark:text-emerald-400">{currentLevel.title}</span></span>
        </div>
      </div>

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
    </div>
  );
}
