import React from 'react';
import { Mail, Phone, MapPin, Heart, ShieldCheck, Milestone, GraduationCap, ServerCrash } from 'lucide-react';
import { SchoolConfig } from '../types';

interface FooterProps {
  config: SchoolConfig;
  onAdminClick: () => void;
}

export default function Footer({ config, onAdminClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-slate-900 to-black text-slate-300 border-t-4 border-amber-500 overflow-hidden pt-12">
      {/* Decorative Islamic Arch Element */}
      <div className="absolute top-0 inset-x-0 h-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400 via-emerald-800 to-transparent opacity-60"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-sm">
        {/* About column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-950 border border-emerald-800 rounded-lg text-amber-400">
              🕌
            </span>
            <span className="font-bold text-amber-400 uppercase tracking-widest text-xs font-mono">
              About Noorul Uloom
            </span>
          </div>
          <h4 className="text-white font-extrabold text-base tracking-wide">
            {config.schoolName}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {config.aboutText || "Established in 1994, our Madrasa is dedicated to offering a highly refined balance of authentic religious scholars (Aalim & Hifz streams) and modern scientific streams (Computer science & general education) to prepare multi-dimensional young minds."}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-amber-400/80 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Approved Educational Registry
          </div>
        </div>

        {/* Links Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-950 border border-emerald-800 rounded-lg text-amber-400">
              🔗
            </span>
            <span className="font-bold text-amber-400 uppercase tracking-widest text-xs font-mono">
              Quick Portals
            </span>
          </div>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="#about" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                • Institutional Vision & Mission
              </a>
            </li>
            <li>
              <a href="#principal" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                • Principal Message desk
              </a>
            </li>
            <li>
              <a href="#academics" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                • Academic streams & Curriculum
              </a>
            </li>
            <li>
              <span onClick={onAdminClick} className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5 font-bold text-amber-500">
                • Secure Staff ERP Control desk
              </span>
            </li>
          </ul>
        </div>

        {/* Location & Map info Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-950 border border-emerald-800 rounded-lg text-amber-400">
              📍
            </span>
            <span className="font-bold text-amber-400 uppercase tracking-widest text-xs font-mono">
              Location details
            </span>
          </div>
          <address className="not-italic space-y-2 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{config.address}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 font-mono">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <a href={`tel:${config.contactPhone}`} className="hover:text-amber-400 transition-colors">
                {config.contactPhone}
              </a>
            </div>
          </address>
        </div>

        {/* Islamic Decorative Calligraphy / Pattern Column */}
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="p-1.5 bg-emerald-950 border border-emerald-800 rounded-lg text-amber-400">
              💎
            </span>
            <span className="font-bold text-amber-400 uppercase tracking-widest text-xs font-mono">
              Student Motto
            </span>
          </div>
          <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-xl space-y-2">
            <p className="text-amber-100 font-serif font-bold text-base italic tracking-wide text-center">
              "{config.mottoArabic || "رَّبِّ زِدْنِي عِلْمًا"}"
            </p>
            <p className="text-[10px] text-slate-400 text-center font-mono">
              {config.mottoEnglish || '"O my Sustainer, increase me in knowledge." (Al-Quran - Surah Taha)'}
            </p>
          </div>
        </div>
      </div>

      {/* Marquee Banner Name at the Bottom */}
      <div className="relative border-y border-emerald-950/70 py-4 bg-slate-950/80">
        <div className="relative w-full overflow-hidden whitespace-nowrap">
          {/* Animated marquee movement using pure tailwind animation class */}
          <div className="inline-block animate-marquee text-lg md:text-2xl font-black font-serif italic text-center tracking-widest bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-450 dark:from-emerald-500 dark:via-amber-400 dark:to-emerald-400 bg-clip-text text-transparent px-8 shadow-inner select-none uppercase">
            <span>✦ {config.bottomMarqueeText || `EXCELLENCE IN ISLAMIC TA'LEEM & DIGITAL EDUCATION ✦ ADMISSIONS OPEN FOR SESSION ${currentYear}-${currentYear+1}`} ✦ </span>
          </div>
          <div className="absolute top-0 inline-block animate-marquee2 text-lg md:text-2xl font-black font-serif italic text-center tracking-widest bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-450 dark:from-emerald-500 dark:via-amber-400 dark:to-emerald-400 bg-clip-text text-transparent px-8 shadow-inner select-none uppercase">
            <span>✦ {config.bottomMarqueeText || `EXCELLENCE IN ISLAMIC TA'LEEM & DIGITAL EDUCATION ✦ ADMISSIONS OPEN FOR SESSION ${currentYear}-${currentYear+1}`} ✦ </span>
          </div>
        </div>
      </div>

      {/* Footer Copyright credits */}
      <div className="bg-black py-4 text-center text-[11px] text-slate-500 font-mono tracking-wider border-t border-emerald-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <span>&copy; {currentYear} {config.schoolName}. All Rights Reserved.</span>
          <span className="flex items-center gap-1 font-bold animate-rainbow-blink">
            Site Developer: Mohammad Yunush | Mobile: 8881138153
          </span>
          <span className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 animate-pulse fill-red-500" /> {config.footerCreditTag || "for Academic Excellence in Computer Lit & Ifta"}
          </span>
        </div>
      </div>
    </footer>
  );
}
