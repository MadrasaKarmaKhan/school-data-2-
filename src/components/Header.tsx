import React, { useState } from 'react';
import { School, Sun, Moon, LogIn, ShieldAlert, GraduationCap, FileText, PhoneCall, Image, Bell, Heart, X, Edit2, BookOpen } from 'lucide-react';
import { SchoolConfig, NewsItem } from '../types';

interface HeaderProps {
  config: SchoolConfig;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  news: NewsItem[];
}

export default function Header({
  config,
  currentTab,
  setCurrentTab,
  darkMode,
  setDarkMode,
  isLoggedIn,
  onLogout,
  news
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const getCurrentSession = () => {
    try {
      const stored = localStorage.getItem("school_sessions_list");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[parsed.length - 1]; // return the latest configured year
        }
      }
    } catch (e) {}
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  const navItems = [
    { id: 'home', label: config.navMenuHomeText || 'Home Page', icon: School, customIcon: config.navMenuHomeIcon },
    { id: 'dua', label: config.navMenuDuaText || 'Daily Duas', icon: BookOpen, customIcon: config.navMenuDuaIcon },
    { id: 'results', label: config.navMenuResultsText || 'Exam Results', icon: GraduationCap, customIcon: config.navMenuResultsIcon },
    { id: 'admissions', label: config.isAdmissionOpen === false ? 'Admissions Closed' : (config.navMenuAdmissionsText || 'Admissions Open'), icon: FileText, customIcon: config.navMenuAdmissionsIcon },
    { id: 'donate', label: config.navMenuDonateText || 'Donate', icon: Heart, customIcon: config.navMenuDonateIcon },
    { id: 'dashboard', label: config.navMenuDashboardText || (isLoggedIn ? 'Principal Panel' : 'Principal Office'), icon: ShieldAlert, customIcon: config.navMenuDashboardIcon },
  ];

  return (
    <header className="sticky top-0 z-50 transition-colors backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-emerald-100 dark:border-emerald-950 shadow-sm">
      <style>{`
        @keyframes headerTextColors {
          0%, 100% {
            color: #047857; /* Emerald-700 solid */
          }
          16% {
            color: #b45309; /* Amber-700 solid */
          }
          33% {
            color: #0369a1; /* Sky-700 solid */
          }
          50% {
            color: #be185d; /* Pink-700 solid */
          }
          66% {
            color: #6d28d9; /* Purple-700 solid */
          }
          83% {
            color: #c2410c; /* Orange-700 solid */
          }
        }
        @keyframes headerTextColorsDark {
          0%, 100% {
            color: #34d399; /* Emerald-400 solid */
          }
          16% {
            color: #fbbf24; /* Amber-400 solid */
          }
          33% {
            color: #38bdf8; /* Sky-400 solid */
          }
          50% {
            color: #f472b6; /* Pink-400 solid */
          }
          66% {
            color: #a78bfa; /* Purple-400 solid */
          }
          83% {
            color: #fb923c; /* Orange-400 solid */
          }
        }
        @keyframes customTickerScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .header-rainbow-glow {
          animation: headerTextColors 14s ease-in-out infinite;
          display: inline-block;
          font-weight: 900;
          letter-spacing: 0.05em;
        }
        .dark .header-rainbow-glow {
          animation: headerTextColorsDark 14s ease-in-out infinite;
        }
        .custom-ticker-container {
          display: flex;
          overflow: hidden;
          white-space: nowrap;
          width: 100%;
          mask-image: linear-gradient(to right, transparent, white 16px, white calc(100% - 16px), transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, white 16px, white calc(100% - 16px), transparent);
        }
        .custom-ticker-track {
          display: flex;
          width: max-content;
          animation: customTickerScroll 25s linear infinite;
        }
        .custom-ticker-track:hover {
          animation-play-state: paused;
        }
        .custom-ticker-item {
          flex-shrink: 0;
          padding-right: 6rem;
        }
      `}</style>
      {/* Upper Top Bar */}
      <div className="bg-gradient-to-r from-emerald-850 via-emerald-900 to-amber-900 text-amber-50 py-1.5 px-4 text-xs font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-1.5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-amber-100">{config.admissionNotice || "ADMISSION 2026: Online Applications Open"}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`tel:${config.contactPhone}`} className="hover:text-amber-300 transition-colors flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" /> {config.contactPhone}
            </a>
            <span className="hidden md:inline text-emerald-300">|</span>
            <span className="animate-pulse text-amber-300 font-semibold">{config.schoolNameArabic}</span>
          </div>
        </div>
      </div>

      {/* Main Brand Header Container */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-5 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Logo and Animated School Name */}
        <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => setCurrentTab('home')}>
          <div className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-amber-400 via-emerald-650 to-emerald-800 p-0.5 shadow-md shadow-emerald-900/10">
            <div className="w-full h-full bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 overflow-hidden">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <School className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 animate-pulse" />
              )}
            </div>
            {/* Outer golden circular shine */}
            <div className="absolute inset-0 rounded-full border border-amber-400/35 animate-spin-slow"></div>
          </div>
          {isLoggedIn && (
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentTab('dashboard'); }}
              className="absolute top-2 left-2 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded shadow-md font-bold text-[9px] flex items-center gap-1 z-10 transition-colors uppercase"
              title="Edit Logo in Admin Panel"
            >
              <Edit2 className="w-2.5 h-2.5" /> Edit Logo
            </button>
          )}
 
          <div className="flex-1 max-w-[280px] sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-3xl min-w-0 justify-center">
            {/* High-visibility background shape (pill/capsule) under the sliding text */}
            <div className="relative w-full h-11 sm:h-12 md:h-14 bg-gradient-to-r from-emerald-50/75 via-slate-50/90 to-amber-50/75 dark:from-slate-950/95 dark:via-slate-900/90 dark:to-slate-950/95 border-2 border-emerald-600/20 dark:border-emerald-500/25 rounded-2xl overflow-hidden flex items-center shadow-inner">
              <div className="custom-ticker-container select-none">
                <div className="custom-ticker-track py-1">
                  <div className="custom-ticker-item text-xs sm:text-sm md:text-[15px] lg:text-[17px] xl:text-[19px] font-black uppercase tracking-widest header-rainbow-glow leading-none">
                    MADRASA ARABIA NOORUL ULOOM KARMA KHAN, DISTRICT SANT KABIR NAGAR, UTTAR PRADESH - 272126 ✦
                  </div>
                  <div className="custom-ticker-item text-xs sm:text-sm md:text-[15px] lg:text-[17px] xl:text-[19px] font-black uppercase tracking-widest header-rainbow-glow leading-none" aria-hidden="true">
                    MADRASA ARABIA NOORUL ULOOM KARMA KHAN, DISTRICT SANT KABIR NAGAR, UTTAR PRADESH - 272126 ✦
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Real Navigation */}
        <div className="flex items-center gap-3.5">
          {/* Quick Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors relative"
              title="Important Announcements"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
                     {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-emerald-100 dark:border-slate-700 py-3 px-4 z-50 text-xs text-slate-700 dark:text-slate-300 animate-slide-up">
                <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-700 mb-2">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Notifications
                  </span>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-650 font-bold">&times;</button>
                </div>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {news.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 font-semibold">No notifications available.</div>
                  ) : (
                    news.map((item) => (
                      <div key={item.id} className="p-2 hover:bg-emerald-50/50 dark:hover:bg-slate-700/50 rounded-lg group relative">
                        <div className="flex justify-between items-start gap-1">
                          <span className={`text-[10px] font-mono font-bold block mb-0.5 ${item.isImportant ? 'text-amber-650 dark:text-amber-400' : 'text-emerald-650 dark:text-emerald-400'}`}>
                            {item.isImportant ? 'IMPORTANT' : 'NOTICE'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 dark:text-white mb-0.5 leading-snug">{item.title}</h4>
                        <p className="font-medium leading-relaxed text-slate-600 dark:text-slate-400 text-[11px] whitespace-pre-line">{item.content}</p>
                        <span className="text-[9px] text-slate-400 font-mono block mt-1">{item.date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 transition-all cursor-pointer"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* Quick Login Badge for admins */}
          {isLoggedIn ? (
            <button
              onClick={onLogout}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-150 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" /> Portal Login
            </button>
          )}
        </div>
      </div>

      {/* Floating Interactive Navigation Tab Bar */}
      <nav className="border-t border-emerald-50 dark:border-slate-800 py-2 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex justify-center items-center gap-2 sm:gap-4 md:gap-6 flex-wrap">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`py-1.5 px-2.5 md:px-4 rounded-lg flex items-center gap-1.5 text-[12px] md:text-[14px] font-bold tracking-tight transition-all duration-300 cursor-pointer relative ${
                  isActive
                    ? 'text-emerald-700 dark:text-amber-300 bg-emerald-100/55 dark:bg-emerald-950/60 shadow-inner'
                    : 'text-slate-650 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                {item.customIcon ? (
                  <img src={item.customIcon} alt={item.label} className="w-4 h-4 md:w-5 md:h-5 object-cover rounded-full" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? 'text-emerald-650 dark:text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                )}
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-600 dark:bg-amber-400 rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
