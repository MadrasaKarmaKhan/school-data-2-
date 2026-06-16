import React, { useState } from 'react';
import { DAILY_DUAS } from '../data/duas';
import { ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';

export default function DuaPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < DAILY_DUAS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentDua = DAILY_DUAS[currentIndex];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-fade-in text-center">
      <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/30 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full text-emerald-700 dark:text-emerald-400 mb-6 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                <BookOpen className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-br from-emerald-700 to-amber-600 dark:from-emerald-400 dark:to-amber-500 bg-clip-text text-transparent mb-8">
                Learn Daily Duas (मसनून दुआएं)
            </h2>

            <div className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-10 min-h-[300px] flex flex-col justify-center gap-6 shadow-inner relative">
                <div className="absolute top-4 right-6 text-xs font-mono font-bold text-slate-400">
                    {currentIndex + 1} / {DAILY_DUAS.length}
                </div>
                
                <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-amber-100 border-b border-slate-200 dark:border-slate-800 pb-4">
                    {currentDua.title}
                </h3>
                
                <p className="text-2xl md:text-3xl font-serif text-emerald-800 dark:text-emerald-100 leading-relaxed font-bold rtl" dir="rtl">
                    {currentDua.arabic}
                </p>
                
                <div className="bg-amber-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-amber-200/50 dark:border-emerald-900/60 mt-4 space-y-4">
                    <div className="flex gap-3">
                        <span className="font-bold text-amber-700 dark:text-amber-500 shrink-0 mt-0.5">हिन्दी:</span>
                        <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium">
                            {currentDua.translationHindi}
                        </p>
                    </div>
                    <div className="flex gap-3 border-t border-amber-200/50 dark:border-emerald-900/60 pt-4">
                        <span className="font-bold text-emerald-700 dark:text-emerald-500 shrink-0 mt-0.5">اردو:</span>
                        <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium font-serif leading-relaxed" dir="rtl">
                            {currentDua.translationUrdu}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex w-full items-center justify-between mt-8">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> Previous
                </button>
                
                <button
                    onClick={handleNext}
                    disabled={currentIndex === DAILY_DUAS.length - 1}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-extrabold text-sm transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                    Next Dua <ArrowRight className="w-4 h-4" />
                </button>
            </div>
            
            <p className="text-xs text-slate-400 mt-8 font-mono">
                Daily use Masnoon Duas for students to memorize.
            </p>
        </div>
      </div>
    </div>
  );
}
