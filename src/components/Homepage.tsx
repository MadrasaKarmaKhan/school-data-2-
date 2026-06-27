import React, { useState, useEffect } from 'react';
import {
  BookOpen, Landmark, Eye, Heart, Milestone, GraduationCap, Award, MapPin, Phone, Mail,
  Send, RefreshCw, Layers, Monitor, Play, Sparkles, Book, Compass, Shield, ArrowRight,
  Copy, Check, QrCode, Edit2
} from 'lucide-react';
import { Teacher, GalleryItem, SchoolConfig, ClassName, AdmissionApplication } from '../types';

interface HomepageProps {
  config: SchoolConfig;
  teachers: Teacher[];
  gallery: GalleryItem[];
  setCurrentTab: (tab: string) => void;
  onAdmissionFormSubmit: (app: Omit<AdmissionApplication, 'id' | 'applyDate' | 'status'>) => void;
  isLoggedIn?: boolean;
}

export default function Homepage({ config, teachers, gallery, setCurrentTab, onAdmissionFormSubmit, isLoggedIn }: HomepageProps) {
  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Copy bank details helper state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Gallery active filter & Lightbox zoom
  const [galleryCategory, setGalleryCategory] = useState<'All' | 'Campus' | 'Events' | 'Classes' | 'Achievements'>('All');
  const [activeLightbox, setActiveLightbox] = useState<GalleryItem | null>(null);

  // Auto Hero Slider State
  const [heroSlide, setHeroSlide] = useState(0);
  const heroBackgrounds = [
    config.heroBg1 ?? "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1200",
    config.heroBg2 ?? "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1200",
    config.heroBg3 ?? "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=1200"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroBackgrounds.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setTimeout(() => {
      setContactSuccess(true);
      setContactSubmitting(false);
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setContactSuccess(false), 5000);
    }, 1000);
  };

  // Gallery section has been removed as per user request

  return (
    <div className="space-y-20 pb-12">

      {/* Hero Section Container */}
      <section className="relative h-[550px] md:h-[650px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-1000">
        {/* Dynamic Image Canvas Slider slide */}
        <div className="absolute inset-0 transition-opacity duration-1000">
          <img
            src={heroBackgrounds[heroSlide]}
            alt="Madrasa School Campus background"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover brightness-40 transition-transform duration-1000 scale-105"
          />
        </div>

        {/* Emerald-Gold Overlay Veil */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/85 via-emerald-900/60 to-amber-950/40"></div>

        {/* Content Centered */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 md:px-8 space-y-6 z-10 max-w-5xl mx-auto">

          <div className="space-y-3.5">
            <h2 className="text-3xl md:text-5.5xl font-black text-white tracking-tight leading-tight select-none font-sans drop-shadow-md pb-4">
              {config.schoolName.toUpperCase()}
            </h2>
          </div>
        </div>
      </section>

      {/* Principal Message message desk */}
      <section id="principal" className="relative scroll-mt-20 p-6 md:p-10 bg-white dark:bg-slate-800 rounded-3xl border-2 border-emerald-500/20 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-8 items-center.">
        {isLoggedIn && (
          <button 
            onClick={() => setCurrentTab('dashboard')}
            className="absolute top-4 right-4 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md font-bold text-xs flex items-center gap-1.5 z-10 transition-colors"
            title="Edit in Admin Panel"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Principal Photo & Text
          </button>
        )}
        {/* Principal Portrait */}
        <div className="md:col-span-1 flex flex-col items-center gap-3 text-center self-center">
          <div className="relative">
            <img
              src={config.principalPhotoUrl}
              alt={config.principalName}
              referrerPolicy="no-referrer"
              className="w-44 h-52 object-cover rounded-2xl border-4 border-amber-400 shadow-xl"
            />
            <div className="absolute -bottom-3 inset-x-0 mx-auto w-fit px-3.5 py-1 bg-emerald-850 text-amber-400 text-[10px] font-bold uppercase rounded-full shadow border border-emerald-800 font-mono tracking-widest">
              PRINCIPAL DESK
            </div>
          </div>
          <div className="pt-3 space-y-0.5">
            <strong className="text-xs text-slate-800 dark:text-white block">{config.principalName}</strong>
            <span className="text-[10px] font-mono text-emerald-650 dark:text-amber-400 uppercase font-black">{config.principalSub ?? "Sheikh-ul-Hadith & Mufti"}</span>
          </div>
        </div>

        {/* Message body */}
        <div className="md:col-span-2 space-y-4 font-sans text-xs md:text-sm text-slate-700 dark:text-slate-350 leading-relaxed">
          <div className="flex items-center gap-1">
            <span className="text-2xl text-emerald-600">“</span>
            <h3 className="font-extrabold text-lg text-emerald-950 dark:text-amber-300 font-serif">{config.principalTitleHeading ?? "Message from Hazrat Maulana's desk"}</h3>
          </div>
          <p className="indent-4 italic">{config.principalMessage}</p>
          <div className="pt-2 flex items-center gap-1.5 font-bold font-mono text-[10px] text-emerald-600 dark:text-emerald-450 uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5 text-amber-500" /> {config.principalLedgerTag ?? "Authorized Institution Ledger 2026"}
          </div>
        </div>
      </section>

      {/* Smart Campus Facilities Section */}
      <section id="facilities" className="scroll-mt-20 space-y-8">
        <div className="text-center space-y-1">
          <span className="text-xs uppercase font-bold tracking-widest text-amber-600 font-mono">Infrastructure</span>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Smart Campus Facilities (सुविधाएं)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: config.fac1Title ?? "Islamic Reference Library",
              img: config.fac1Img ?? "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=600",
              text: config.fac1Text ?? "Houses over 10,000 reference volumes of Hadith collection, jurisprudential scrolls (Hanafi, Shafi, etc.) along with global history encyclopedias and textbooks."
            },
            {
              title: config.fac2Title ?? "Digital Computing Center",
              img: config.fac2Img ?? "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=600",
              text: config.fac2Text ?? "Equipped with high-performance computer terminals, smart multimedia overhead projectors, and safe filtered high-speed internet connections."
            },
            {
              title: config.fac3Title ?? "Athletics & Assembly Ground",
              img: config.fac3Img ?? "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=600",
              text: config.fac3Text ?? "Spacious open courtyards configured for daily physical assemblies, and physical health recreation files like football, badminton, and running tracks."
            }
          ].map((fac, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-755 shadow hover:shadow-lg transition-all overflow-hidden group">
              <div className="relative h-48 w-full overflow-hidden">
                <img 
                  src={fac.img} 
                  alt={fac.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="p-5 space-y-2">
                <strong className="text-sm font-extrabold text-slate-850 dark:text-white block">{fac.title}</strong>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {fac.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Honorable Faculty / Teacher Profiles Section */}
      {/* SECTION REMOVED AS PER USER REQUEST */}

      {/* Student Achievements / Toppers Section */}
      <section id="achievements" className="space-y-8">
        <div className="text-center space-y-1">
          <span className="text-xs uppercase font-bold tracking-widest text-amber-600 font-mono">Hall of Honor</span>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Recent Academic Toppers</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700">
          <div className="p-5 bg-gradient-to-br from-amber-50/50 to-white dark:from-slate-755 dark:to-slate-800/20 border border-amber-200/50 dark:border-slate-700 rounded-2xl flex gap-4 items-center shadow-sm relative overflow-hidden">
            <span className="text-4xl">🥇</span>
            <div className="space-y-1">
              <span className="font-mono text-amber-600 dark:text-amber-400 uppercase text-[9px] font-extrabold tracking-widest block">{config.topper1Heading ?? "Topper #1 (First Place)"}</span>
              <strong className="text-sm text-slate-900 dark:text-white block">{config.topper1Name ?? "Mohammad Zaheer Khan"}</strong>
              <span className="font-semibold text-slate-500 uppercase text-[9px] block">{config.topper1Badge ?? "91.2% (Secondary Board First)"}</span>
              <p className="text-[11px] text-slate-505 dark:text-slate-400 leading-relaxed italic">{config.topper1Blurb ?? "Overall highest scorer in combined contemporary sciences curriculum."}</p>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-white dark:from-slate-755 dark:to-slate-800/20 border border-emerald-250/30 dark:border-slate-700 rounded-2xl flex gap-4 items-center shadow-sm relative overflow-hidden">
            <span className="text-4xl">🥇</span>
            <div className="space-y-1">
              <span className="font-mono text-emerald-700 dark:text-emerald-400 uppercase text-[9px] font-extrabold tracking-widest block">{config.topper2Heading ?? "Topper #2 (Saba Top)"}</span>
              <strong className="text-sm text-slate-900 dark:text-white block">{config.topper2Name ?? "Ahmad Mujtaba"}</strong>
              <span className="font-semibold text-slate-500 uppercase text-[9px] block">{config.topper2Badge ?? "98% (Quran Memorization Top)"}</span>
              <p className="text-[11px] text-slate-505 dark:text-slate-400 leading-relaxed italic">{config.topper2Blurb ?? "Perfect score in tajweed accents saba' Recitation mode files."}</p>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-slate-55 to-white dark:from-slate-755 dark:to-slate-800/20 border border-slate-200 dark:border-slate-700 rounded-2xl flex gap-4 items-center shadow-sm relative overflow-hidden">
            <span className="text-4xl">🥈</span>
            <div className="space-y-1">
              <span className="font-mono text-slate-600 dark:text-slate-400 uppercase text-[9px] font-extrabold tracking-widest block">{config.topper3Heading ?? "Topper #3 (Aalim Topper)"}</span>
              <strong className="text-sm text-slate-900 dark:text-white block">{config.topper3Name ?? "Fatima Bi"}</strong>
              <span className="font-semibold text-slate-500 uppercase text-[9px] block">{config.topper3Badge ?? "88.5% (Aalimiat Class Topper)"}</span>
              <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed italic">{config.topper3Blurb ?? "Exemplary scores in Arabic Jurisprudence (Fiqh/Tafseer studies)."}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section with modern Lightbox */}
      {/* SECTION REMOVED AS PER USER REQUEST */}

      {/* 💰 Madrasa Support & Donation (Sadqat & Zakat) Section */}
      <section id="donate" className="scroll-mt-20 relative bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl overflow-hidden mt-12 space-y-8">
        {/* Top golden decorative line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-700"></div>

        <div className="text-center space-y-1.5">
          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-600 dark:text-amber-400 font-mono flex items-center justify-center gap-1.5">
            <Heart className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" /> HELP & FINANCIAL SUPPORT (मदरसा की इमदाद / ज़कात व सदाक़ात)
          </span>
          <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            {config.donateSectionTitle ?? "Support Our Noble Cause (मदरसा की इमदाद करें)"}
          </h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-semibold leading-relaxed">
            {config.donateSectionSubtitle ?? "अनाथ, गरीब एवं असहाय बच्चों की निःशुल्क दीनी तालीम, आधुनिक विद्यालयीय पाठ्यक्रम, कंप्यूटर शिक्षा, भोजन और रहने की व्यवस्था (मदरसा के संचालन) में अपनी ज़कात-सदक़ा से सहयोग करें।"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-stretch pt-2">
          {/* Card left: explanatory text & badges */}
          <div className="lg:col-span-4 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-6 shadow-sm">
            <div className="space-y-4">
              <strong className="text-xs uppercase font-extrabold text-emerald-800 dark:text-emerald-400 block border-b border-emerald-100 dark:border-emerald-900/40 pb-2 tracking-wider">
                {config.whySupportHeading ?? "Why Support Us? (सहयोग करें)"}
              </strong>
              <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                {config.whySupportText ?? "Our Madrasa provides free housing, uniforms, study materials, primary, secondary board education, and intensive theological classes to hundreds of students coming from disadvantaged backgrounds, solely supported by public contributors like you."}
              </p>
              
              <div className="space-y-2 pt-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">ACCEPTED FUNDS:</span>
                <div className="grid grid-cols-2 gap-1.5 font-sans font-bold text-[10px]">
                  <span className="p-1.5 px-2 bg-emerald-50 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-450 rounded-lg border border-emerald-100 dark:border-emerald-950">✓ Zakat (ज़कात)</span>
                  <span className="p-1.5 px-2 bg-amber-50 dark:bg-amber-950/45 text-amber-800 dark:text-amber-450 rounded-lg border border-amber-100 dark:border-amber-950">✓ Sadqat (सदक़ा)</span>
                  <span className="p-1.5 px-2 bg-emerald-50 dark:bg-emerald-950/45 text-emerald-850 dark:text-emerald-450 rounded-lg border border-emerald-100 dark:border-emerald-950">✓ Imdad (इमदाद)</span>
                  <span className="p-1.5 px-2 bg-amber-50 dark:bg-amber-950/45 text-amber-800 dark:text-amber-450 rounded-lg border border-amber-100 dark:border-amber-950">✓ Attiya (عطیہ)</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-900 dark:text-amber-400 font-semibold leading-relaxed">
              <span className="italic block leading-normal">
                "उन लोगों की मिसाल जो अपने माल अल्लाह की राह में ख़र्च करते हैं, उस दाने की तरह है जिससे सात बालें उगीं और हर बाल में सौ दाने हों। और अल्लाह जिसके लिए चाहता है (इसे) और बढ़ा देता है; अल्लाह बड़ी कुशादगी (वुसअत) वाला और सब कुछ जानने वाला है।"
                <strong className="block mt-1 text-slate-500 dark:text-slate-400 text-right font-sans not-italic text-[9px]">— सूरह अल-बक़रह, आयत 261</strong>
              </span>
            </div>
          </div>

          {/* Card Middle: Bank detail items and copy buttons */}
          <div className="lg:col-span-5 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-emerald-100 dark:border-slate-800 pb-2.5">
                <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <strong className="text-xs uppercase tracking-wider text-slate-800 dark:text-white block font-black">Bank Account Particulars</strong>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Bank Name */}
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 px-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">Bank Name</span>
                    <strong className="block text-slate-800 dark:text-slate-100 font-bold text-[11px]">{config.bankName ?? "State Bank of India (SBI)"}</strong>
                  </div>
                  <button 
                    onClick={() => handleCopy(config.bankName ?? "State Bank of India (SBI)", "bankName")}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-md transition-all cursor-pointer"
                    title="Copy Bank Name"
                  >
                    {copiedText === "bankName" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Account Name */}
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 px-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                  <div className="space-y-0.5 max-w-[80%]">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">Account Holder Name (खाताधारक नाम)</span>
                    <strong className="block text-slate-800 dark:text-slate-100 font-bold text-[10px] break-all uppercase">{config.accountName ?? "MADRASA ARABIA NOORUL ULOOM"}</strong>
                  </div>
                  <button 
                    onClick={() => handleCopy(config.accountName ?? "MADRASA ARABIA NOORUL ULOOM", "accountName")}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-md transition-all cursor-pointer"
                    title="Copy Account Name"
                  >
                    {copiedText === "accountName" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Account Number */}
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 px-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">Account Number (खाता संख्या)</span>
                    <strong className="block text-slate-900 dark:text-white font-mono text-sm tracking-wider font-bold">{config.accountNumber ?? "38920192831"}</strong>
                  </div>
                  <button 
                    onClick={() => handleCopy(config.accountNumber ?? "38920192831", "accountNumber")}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-md transition-all cursor-pointer"
                    title="Copy Account Number"
                  >
                    {copiedText === "accountNumber" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* IFSC Code */}
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 px-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">IFSC Code (आईएफएससी कोड)</span>
                    <strong className="block text-emerald-650 dark:text-emerald-400 font-mono text-sm uppercase tracking-wider font-bold">{config.ifscCode ?? "SBIN0001234"}</strong>
                  </div>
                  <button 
                    onClick={() => handleCopy(config.ifscCode ?? "SBIN0001234", "ifscCode")}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-md transition-all cursor-pointer"
                    title="Copy IFSC Code"
                  >
                    {copiedText === "ifscCode" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {copiedText && (
              <div className="text-[10px] text-center font-bold text-teal-850 dark:text-amber-400 bg-amber-500/10 py-1.5 rounded-lg border border-amber-500/20">
                ✔ copied successfully! (नकल कर लिया गया)
              </div>
            )}
          </div>

          {/* Card Right: UPI Payment and Scannable QR Code */}
          <div className="lg:col-span-3 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between items-center gap-4 text-center">
            <div className="space-y-3 w-full">
              <strong className="text-xs uppercase font-extrabold text-slate-850 dark:text-white block border-b border-slate-200 dark:border-slate-800 pb-2 tracking-wider">
                Scan UPI QR Code
              </strong>
              
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 dark:border-slate-850 shadow-inner flex flex-col items-center justify-center">
                {config.qrCodeUrl ? (
                  <img
                    src={config.qrCodeUrl}
                    alt="Madrasa UPI QR Code"
                    referrerPolicy="no-referrer"
                    className="w-32 h-32 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-32 h-32 bg-slate-100 dark:bg-slate-900 text-[10px] text-slate-400 text-center font-bold flex items-center justify-center rounded">
                    Configure QR in Admin Settings
                  </div>
                )}
              </div>

              {config.upiId && (
                <div className="space-y-1">
                  <span className="text-[8px] uppercase font-bold text-slate-400 block">UPI VPA address</span>
                  <div className="flex items-center justify-center gap-1">
                    <span className="px-2 py-1 bg-white dark:bg-slate-900 font-mono text-[10px] font-bold text-slate-650 dark:text-slate-300 rounded border border-slate-250 dark:border-slate-800 select-all tracking-tight truncate max-w-[150px]">
                      {config.upiId}
                    </span>
                    <button 
                      onClick={() => handleCopy(config.upiId ?? "", "upiId")}
                      className="p-1 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedText === "upiId" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Scan QR from <strong className="text-emerald-700 dark:text-emerald-400">PhonePe, Google Pay, Paytm, BHIM</strong> or any other banking application.
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form AND Map Sections */}
      <section id="contact" className="scroll-mt-20 space-y-8">
        <div className="text-center space-y-1">
          <span className="text-xs uppercase font-bold tracking-widest text-amber-600 font-mono font-bold">Get In Touch</span>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Location & Contacts Desk</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Map & details left */}
          <div className="p-6 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-750 rounded-2xl shadow-md flex flex-col justify-between gap-6">
            <div className="space-y-4 text-xs text-slate-650 dark:text-slate-350">
              <strong className="text-sm text-slate-900 dark:text-white block border-b border-slate-100 pb-2.5">Institutional Office</strong>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span>{config.address}</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                <a href={`tel:${config.contactPhone}`} className="hover:text-amber-650 font-mono font-semibold">
                  {config.contactPhone}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-600 shrink-0" />
                <a href={`mailto:${config.contactEmail}`} className="hover:text-amber-650">
                  {config.contactEmail}
                </a>
              </div>
            </div>

            {/* Embedded maps simulator */}
            <div className="h-52 w-full rounded-xl overflow-hidden border border-emerald-900/10">
              <iframe
                title="Madrasa Arabia Noorul Uloom Map Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14238.1691234567!2d80.9416!3d26.8467!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDUwJzQ4LjEiTiA4MMKwNTYnMjkuOCJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
              ></iframe>
            </div>
          </div>

          {/* Form form right */}
          <form onSubmit={handleContactSubmit} className="p-6 md:p-8 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-750 shadow-md rounded-2xl space-y-4 text-xs">
            <h4 className="font-extrabold text-sm text-slate-850 dark:text-white block pb-2.5 border-b border-slate-100">Leave an Inquiry Mail</h4>
            
            <div className="grid grid-cols-2 gap-3 pb-1">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">FullName *</label>
                <input
                  type="text" required placeholder="e.g. Salim Ali"
                  value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  className="p-2.5 w-full bg-slate-50 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Email Address (Optional)</label>
                <input
                  type="email" placeholder="salim@gmail.com"
                  value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  className="p-2.5 w-full bg-slate-50 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500">Mail Subject Heading *</label>
              <input
                type="text" required placeholder="e.g. Inquiry about syllabus schedules"
                value={contactForm.subject} onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                className="p-2.5 w-full bg-slate-50 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500">Detail message description *</label>
              <textarea
                required rows={3} placeholder="Type your full question or suggestions detail..."
                value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                className="p-2.5 w-full bg-slate-50 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
              />
            </div>

            {contactSuccess && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-150 p-2.5 rounded-lg font-bold">
                ✔ Your message has been routed successfully! Administrative files advisors will email you shortly.
              </p>
            )}

            <button
              type="submit" disabled={contactSubmitting}
              className="w-full py-3 bg-emerald-650 hover:bg-emerald-700 text-white font-bold tracking-wide uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {contactSubmitting ? (
                <span>Sending...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Dispatch Mail Inquiry
                </>
              )}
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
