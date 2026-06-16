import React, { useState, useEffect } from 'react';
import { DAILY_DUAS } from '../data/duas';
import { ArrowRight, ArrowLeft, BookOpen, Star, Award, Sparkles, CheckCircle2 } from 'lucide-react';
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

  const toggleMemorized = () => {
    const isMemorized = memorizedDuas.includes(currentDua.id);
    let newMemorized;
    
    if (isMemorized) {
      newMemorized = memorizedDuas.filter(id => id !== currentDua.id);
    } else {
      // Add to memorized and show confetti
      newMemorized = [...memorizedDuas, currentDua.id];
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899']
      });
    }
    
    setMemorizedDuas(newMemorized);
    localStorage.setItem('memorizedDuas', JSON.stringify(newMemorized));
  };

  const currentDua = DAILY_DUAS[currentIndex];
  const isCurrentlyMemorized = memorizedDuas.includes(currentDua.id);
  const progressPercentage = (memorizedDuas.length / DAILY_DUAS.length) * 100;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9,
    }),
  };

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 animate-fade-in">
      
      {/* Fun Header */}
      <div className="flex flex-col items-center justify-center mb-8 text-center">
        <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1, rotate: [0, -10, 10, -10, 0] }}
           transition={{ duration: 0.5, type: 'spring' }}
           className="p-4 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full shadow-lg mb-4 cursor-pointer hover:scale-110 transition-transform"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
          Dua Adventure
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium flex items-center justify-center gap-2">
           Let's learn our daily duas! <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
        </p>
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
             <span className="text-amber-600 dark:text-amber-400">
               #{currentIndex + 1}
             </span>
           </div>
           <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-200 dark:border-slate-700 p-0.5">
             <motion.div 
               className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full"
               initial={{ width: 0 }}
               animate={{ width: `${progressPercentage}%` }}
               transition={{ duration: 0.5, ease: "easeOut" }}
             />
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
                opacity: { duration: 0.2 }
              }}
              className={`w-full ${isCurrentlyMemorized ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'} border-2 rounded-3xl p-6 md:p-10 min-h-[350px] flex flex-col justify-center items-center gap-6 shadow-inner relative transition-colors duration-500`}
            >
              {isCurrentlyMemorized && (
                 <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white p-2 rounded-full shadow-lg transform rotate-12 flex items-center gap-1 font-bold text-xs uppercase px-4 border-2 border-white dark:border-slate-800">
                    <CheckCircle2 className="w-4 h-4" /> Learned
                 </div>
              )}

              <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-amber-100 border-b-2 border-slate-200 dark:border-slate-700 pb-4 text-center w-full">
                  {currentDua.title}
              </h3>
              
              <div className="w-full relative">
                 <BookOpen className="w-32 h-32 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none" />
                 <p className="text-3xl md:text-5xl font-serif text-emerald-800 dark:text-emerald-300 leading-normal font-bold text-center drop-shadow-sm mb-6" dir="rtl" style={{ lineHeight: '1.6' }}>
                     {currentDua.arabic}
                 </p>
              </div>
              
              <div className="w-full flex flex-col gap-4">
                  <div className="bg-amber-100/50 dark:bg-amber-950/30 p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-900/50">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2 border-b border-amber-200/50 dark:border-amber-900/50 pb-2">
                          <span className="font-black text-amber-800 dark:text-amber-500 bg-amber-200 dark:bg-amber-900/50 px-2 py-1 rounded text-xs tracking-wider">हिन्दी TRANSLATION</span>
                          <p className="text-base md:text-lg text-slate-800 dark:text-slate-200 font-medium">
                              {currentDua.translationHindi}
                          </p>
                      </div>
                      <div className="flex flex-col sm:flex-row-reverse sm:items-center gap-2 sm:gap-4 mt-2">
                          <span className="font-black text-teal-800 dark:text-teal-500 bg-teal-200 dark:bg-teal-900/50 px-2 py-1 rounded text-xs tracking-wider">اردو TRANSLATION</span>
                          <p className="text-base md:text-lg text-slate-800 dark:text-slate-200 font-medium font-serif" dir="rtl">
                              {currentDua.translationUrdu}
                          </p>
                      </div>
                  </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10 relative z-10 w-full max-w-2xl mx-auto">
            <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex-1 min-w-[120px] flex justify-center items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all duration-300 disabled:opacity-40 disabled:scale-100 hover:scale-105 active:scale-95 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer shadow-sm hover:shadow-md"
            >
                <ArrowLeft className="w-5 h-5" /> Back
            </button>
            

            <button
                onClick={toggleMemorized}
                className={`flex-[1.5] min-w-[160px] flex justify-center items-center gap-2 px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg active:scale-95 border-b-4 ${
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
            </button>


            <button
                onClick={handleNext}
                disabled={currentIndex === DAILY_DUAS.length - 1}
                className="flex-1 min-w-[120px] flex justify-center items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-40 disabled:scale-100 hover:scale-105 active:scale-95 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white cursor-pointer border-b-4 border-emerald-700"
            >
                Next <ArrowRight className="w-5 h-5" />
            </button>
        </div>
        
      </div>
    </div>
  );
}
