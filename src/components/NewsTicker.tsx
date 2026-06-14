import React from 'react';
import { Mail, Calendar, Sparkles, BellRing } from 'lucide-react';
import { NewsItem, SchoolConfig } from '../types';

interface NewsTickerProps {
  news: NewsItem[];
  config?: SchoolConfig;
}

export default function NewsTicker({ news, config }: NewsTickerProps) {
  const importantNotices = news.filter((n) => n.isImportant);
  
  // Conditionally use customizable marquee text or auto-generated notices
  const scrollText = config?.topMarqueeText 
    ? config.topMarqueeText 
    : (importantNotices.length > 0 
        ? importantNotices.map((n) => `✦ [${n.date}] ${n.title}: ${n.content}`).join(' ✦ ') 
        : "✦ Regular classes, admission files selection desks are online currently. ✦");

  // Determine if we should render ticker
  const hasContent = !!scrollText;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-amber-50 h-10 border-b border-amber-900 flex items-center relative overflow-hidden select-none text-xs font-bold shadow-md">
      {/* Static Header Tag */}
      <div className="bg-amber-900 text-amber-300 px-4 h-full flex items-center gap-1.5 shrink-0 z-10 border-r border-amber-800 uppercase tracking-widest font-mono text-[10px] shadow-[4px_0_10px_rgba(0,0,0,0.15)]">
        <BellRing className="w-3.5 h-3.5 animate-bounce text-amber-400" />
        <span className="hidden sm:inline">Notice Board</span>
        <span>Ticker</span>
      </div>

      {/* Dynamic Continuous Scrolling Marquee */}
      <div className="relative w-full overflow-hidden whitespace-nowrap h-full flex items-center">
        {hasContent ? (
          <>
            <div className="inline-block animate-marquee uppercase tracking-wider px-4">
              {scrollText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </div>
            <div className="absolute top-3 inline-block animate-marquee2 uppercase tracking-wider px-4">
              {scrollText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </div>
          </>
        ) : (
          <span className="px-6 text-slate-300">✦ Regular classes, admission files selection desks are online currently. ✦</span>
        )}
      </div>
    </div>
  );
}
