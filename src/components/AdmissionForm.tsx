import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Send, Calendar, Phone, Mail, User, MapPin, CheckCircle, 
  GraduationCap, Award, ShieldCheck, QrCode, Upload, Smartphone, 
  Heart, School, CreditCard, Printer, Check, Info, BadgeAlert
} from 'lucide-react';
import { AdmissionApplication, ClassName, GalleryItem, SchoolConfig } from '../types';
import { getSchoolClasses, getSchoolSessions } from '../data';

interface AdmissionFormProps {
  onSubmit: (app: Omit<AdmissionApplication, 'id' | 'applyDate' | 'status'> & { id?: string }) => void;
  admissions?: AdmissionApplication[];
  gallery?: GalleryItem[];
  config?: SchoolConfig;
}

import { printBlankAdmissionForm } from '../utils/printBlankAdmissionForm';

export function formatClassName(className: string | undefined): string {
  if (!className) return "";
  return String(className).replace(/(\d+)(ST|ND|RD|TH)/gi, (match, num, suffix) => {
    return num + suffix.toLowerCase();
  });
}

export function getCurrentSession(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 is January, 11 is December
  // Academic session shifts from April (month 3) or later
  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

export default function AdmissionForm({ onSubmit, admissions, gallery = [], config }: AdmissionFormProps) {
  const [activeTab, setActiveTab] = useState<'apply' | 'track'>('apply');
  const [trackId, setTrackId] = useState('');
  const [searchedApp, setSearchedApp] = useState<AdmissionApplication | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    className: 'EDADIA' as ClassName,
    contactPhone: '',
    whatsappNumber: '',
    aadhaarNumber: '',
    email: '',
    address: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    previousSchool: '',
    studentPhoto: '',
    academicYear: config?.defaultAcademicSession || getCurrentSession(),
    admissionType: 'New' as 'New' | 'Old',
    formNumber: ''
  });

  const [addressFields, setAddressFields] = useState({
    village: '',
    post: '',
    distt: '',
    state: '',
    country: 'INDIA',
    pinCode: ''
  });

  React.useEffect(() => {
    const { village, post, distt, state, country, pinCode } = addressFields;
    if (village || post || distt || state || pinCode) {
      setFormData(prev => ({
        ...prev,
        address: `Village: ${village}, Post: ${post}, Distt: ${distt}, State: ${state}, Country: ${country}, PIN: ${pinCode}`
      }));
    } else {
      setFormData(prev => ({ ...prev, address: '' }));
    }
  }, [addressFields]);

  const availableYears = React.useMemo(() => {
    let baseSessions = getSchoolSessions();
    if (config?.sessions && config.sessions.length > 0) {
      baseSessions = config.sessions;
    }
    const years = baseSessions.slice().reverse();
    if (config?.defaultAcademicSession && !years.includes(config.defaultAcademicSession)) {
      years.unshift(config.defaultAcademicSession);
    }
    return years;
  }, [config?.defaultAcademicSession, config?.sessions]);

  const [submittedApp, setSubmittedApp] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState<'All' | 'Campus' | 'Events' | 'Classes' | 'Achievements'>('All');
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');

  const handleTrackStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId.trim()) {
      alert("Please enter application ID!");
      return;
    }
    const found = admissions?.find(
      (app) => app.id.trim().toLowerCase() === trackId.trim().toLowerCase()
    );
    setSearchedApp(found || null);
    setHasSearched(true);
  };

  const classes = React.useMemo(() => {
    let list: string[];
    if (config?.classes && config.classes.length > 0) {
      list = [...config.classes];
    } else {
      list = getSchoolClasses();
    }
    return Array.from(new Set(list));
  }, [config?.classes]) as ClassName[];

  useEffect(() => {
    if (classes.length > 0 && !classes.includes(formData.className)) {
      setFormData(prev => ({ ...prev, className: classes[0] }));
    }
  }, [classes]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(formData.academicYear)) {
      setFormData(prev => ({ ...prev, academicYear: availableYears[0] }));
    }
  }, [availableYears]);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file format (.png or .jpg) only.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setFormData(prev => ({ ...prev, studentPhoto: ev.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formatAadhaar = (val: string) => {
    // Keep only digits
    const clean = val.replace(/\D/g, '').substring(0, 12);
    // Add spaces every 4 characters
    const parts = [];
    for (let i = 0; i < clean.length; i += 4) {
      parts.push(clean.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAadhaar(e.target.value);
    setFormData(prev => ({ ...prev, aadhaarNumber: formatted }));
  };

  const handleCopyPhoneToWhatsapp = () => {
    setFormData(prev => ({ ...prev, whatsappNumber: prev.contactPhone }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.studentName.trim()) {
      alert("Please enter candidate's full name");
      return;
    }
    if (!formData.fatherName.trim()) {
      alert("Please enter father's name");
      return;
    }
    if (!formData.motherName.trim()) {
      alert("Please enter mother's name");
      return;
    }
    if (!formData.dateOfBirth) {
      alert("Please select date of birth");
      return;
    }
    if (!formData.contactPhone.trim()) {
      alert("Please enter parent's mobile number");
      return;
    }
    if (formData.aadhaarNumber && formData.aadhaarNumber.replace(/\s/g, '').length !== 12) {
      alert("Please enter a valid 12-digit Aadhaar Card Number");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const yearPrefix = formData.academicYear.split('-')[0] || "2026";
      const generatedId = `ADM-${yearPrefix}-` + Math.floor(1000 + Math.random() * 9000);
      // Structure the data to conform to AdmissionApplication
      const payload: Omit<AdmissionApplication, 'id' | 'applyDate' | 'status'> & { id?: string } = {
        id: generatedId,
        studentName: formData.studentName.trim(),
        fatherName: formData.fatherName.trim(),
        motherName: formData.motherName.trim(),
        dateOfBirth: formData.dateOfBirth,
        className: formData.className,
        contactPhone: formData.contactPhone.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        aadhaarNumber: formData.aadhaarNumber.replace(/\s/g, ''),
        email: formData.email.trim() || 'N/A',
        address: formData.address.trim(),
        gender: formData.gender,
        previousSchool: formData.previousSchool.trim() || 'N/A',
        studentPhoto: formData.studentPhoto,
        academicYear: formData.academicYear,
        admissionType: formData.admissionType,
        formNumber: formData.formNumber.trim() || generatedId
      };

      onSubmit(payload);
      
      setSubmittedApp({
        ...payload,
        applyDate: new Date().toISOString().split('T')[0],
        applicationId: generatedId
      });
      setIsSubmitting(false);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1500);
  };

  if (submittedApp) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        {/* Printable Section */}
        <div className="p-8 md:p-10 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-2xl relative space-y-8" id="printable-admission-token">
          
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
            <GraduationCap className="w-96 h-96 text-emerald-900" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b-2 border-emerald-900/10">
            <div className="space-y-1.5 text-left">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 rounded text-[10px] font-black uppercase tracking-wider font-mono">
                {config?.admissionRegisteredTokenLabel || "Official Registered Token"}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-850 dark:text-white flex items-center gap-2">
                {config?.admissionInstitutionName || "JAMIA NOORUL ULOOM"}
              </h2>
              <p className="text-xs text-slate-500 font-semibold tracking-wide">
                {config?.admissionInstitutionAddress || "Golaganj, Lucknow, Uttar Pradesh, India"}
              </p>
            </div>
            
            <div className="text-right flex flex-col items-end gap-1 font-mono">
              <span className="text-[10px] text-slate-400 font-bold block">APPLICATION ID:</span>
              <span className="text-lg font-black text-amber-500 bg-slate-900 text-white dark:bg-slate-900 px-3 py-1 rounded-lg shadow-sm">
                {submittedApp.applicationId}
              </span>
            </div>
          </div>

          <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Application File Logged Successfully</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Your admission payload has been transferred under administrative queue for Mufti Muhammad Shafiullah Sahib. Bring a copy of this sheet along with original certificates during the physical desk verification.
              </p>
            </div>
          </div>

          {/* Transcript Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* Student Image on Left */}
            <div className="col-span-1 flex flex-col items-center justify-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-dashed border-emerald-700/30 bg-slate-100 dark:bg-slate-900 shadow-sm flex flex-col items-center justify-center select-none text-center p-1.5 shrink-0">
                {submittedApp.studentPhoto ? (
                  <img 
                    src={submittedApp.studentPhoto} 
                    alt={submittedApp.studentName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-slate-450 dark:text-slate-500 p-0.5 flex flex-col items-center justify-center">
                    <User className="w-8 h-8 opacity-60 mx-auto" />
                    <span className="text-[8px] font-black text-slate-500 uppercase mt-1.5 leading-tight tracking-wide block">Affix Photo Here<br/>(फोटो चिपकाएं)</span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <span className="text-xs text-slate-400">Selected Class</span>
                <p className="font-extrabold text-sm text-emerald-800 dark:text-emerald-400 mt-0.5">{submittedApp.className}</p>
              </div>
              
              <div className="pt-3 border-t border-slate-200 dark:border-slate-850 w-full flex flex-col items-center justify-center gap-1.5">
                <QrCode className="w-12 h-12 text-slate-800 dark:text-slate-300" />
                <span className="text-[9px] font-mono font-medium text-slate-400">SECURE DIGITAL TOKEN</span>
              </div>
            </div>

            {/* Structured Table of Values */}
            <div className="col-span-2 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b pb-1 border-slate-150 text-left">
                VERIFIED ADMISSION LEDGER DETAIL
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-left text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Candidate Full Name</span>
                  <span className="font-extrabold text-slate-800 dark:text-white text-sm">{submittedApp.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date of Birth (DOB)</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{submittedApp.dateOfBirth}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Father / Guardian Name</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{submittedApp.fatherName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Mother Name</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{submittedApp.motherName}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Mobile Number</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{submittedApp.contactPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">WhatsApp Hotline Number</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{submittedApp.whatsappNumber || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Aadhaar Card Number</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {submittedApp.aadhaarNumber ? formatAadhaar(submittedApp.aadhaarNumber) : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Gender</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{submittedApp.gender}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Last School Attended</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{submittedApp.previousSchool || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-405 text-slate-400 block font-medium">Academic Year</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{submittedApp.academicYear || getCurrentSession()}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Permanent Address</span>
                  <span className="text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">{submittedApp.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Endorsments Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-dashed border-slate-200 dark:border-slate-800 text-left text-xs text-slate-400 leading-relaxed">
            <div>
              <p className="font-bold text-slate-500 dark:text-slate-300 mb-1">Instruction Check:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Bring a high-contrast printed copy of this receipt.</li>
                <li>Submit 2 passport photos and copy of Aadhaar Card.</li>
                <li>Transfer certificates (T.C) must be counter-signed.</li>
              </ul>
            </div>
            
            {/* Signature Area */}
            <div className="flex flex-col items-end justify-end space-y-1">
              <div className="w-40 border-b border-slate-300 dark:border-slate-800 text-center pb-2">
                <span className="font-serif italic font-bold text-[11px] text-emerald-850 dark:text-teal-400">M. Shafiullah</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 mr-4">RECRUITMENT HEAD SIGNATURE</span>
            </div>
          </div>
        </div>

        {/* Action button panel */}
        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-850 text-white rounded-xl text-xs font-bold transition-all shadow hover:bg-slate-800 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Admission Sheet
          </button>
          
          <button
            onClick={() => setSubmittedApp(null)}
            className="px-6 py-3 bg-emerald-650 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      
      {/* Decorative Head Banner */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest">
          <GraduationCap className="w-4 h-4 animate-bounce" /> {config?.admissionSessionLabel || "Academic Admission Session"}: {formData.academicYear}
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-850 dark:text-white tracking-tight">
          {config?.admissionFormTitle || "Jamia Noorul Uloom Portal"}
        </h2>
        <p className="text-xs md:text-sm text-slate-550 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          {config?.admissionFormDescription || "Fill out the secure admission docket below for quick processing. All student profiles catalogued here are transmitted directly to the Principal's ERP desktop board."}
        </p>
        <div className="pt-4 flex justify-center">
          <button
            onClick={printBlankAdmissionForm}
            className="px-6 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Download Blank Offline Form (खाली फॉर्म प्रिंट करें)
          </button>
        </div>
        {config?.admissionNotice && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs md:text-sm font-semibold max-w-2xl mx-auto flex items-start gap-2 text-left">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{config.admissionNotice}</p>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-880 shadow-sm text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('apply');
              setHasSearched(false);
              setTrackId('');
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activeTab === 'apply'
                ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold'
            }`}
          >
            <Send className="w-4 h-4" /> {config?.admissionApplyTabLabel || "Apply Online (दाखिला आवेदन)"}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('track');
              setHasSearched(false);
              setTrackId('');
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activeTab === 'track'
                ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> {config?.admissionTrackTabLabel || "Check Status (स्थिति जांचें)"}
          </button>
        </div>
      </div>

      {activeTab === 'track' ? (
        <div className="max-w-xl mx-auto p-6 md:p-8 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-md">
          <div className="text-center space-y-2 mb-6 text-slate-800 dark:text-white">
            <h3 className="text-lg font-black text-slate-850 dark:text-white">Track Admission Status</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Enter your unique Application ID (e.g. <span className="font-mono font-bold text-slate-750 dark:text-slate-350">ADM-{getCurrentSession().split('-')[0] || '2026'}-1001</span>) received after form submission to check approval or rejection status.
            </p>
          </div>

          <form onSubmit={handleTrackStatus} className="space-y-4">
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-450 text-slate-400">
                <FileText className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder={`ADM-${getCurrentSession().split('-')[0] || '2026'}-XXXX`}
                value={trackId}
                onChange={(e) => setTrackId(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold tracking-wider text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-650 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold font-mono tracking-wider text-xs uppercase rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Check Online Ledger
            </button>
          </form>

          {hasSearched && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-900 text-left space-y-4">
              {searchedApp ? (
                <div className="space-y-4">
                  {searchedApp.status === 'approved' && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-400 font-mono tracking-wide">
                          APPROVED (स्वीकृत)
                        </h4>
                        <p className="text-[11px] text-slate-650 dark:text-slate-400 mt-1 leading-relaxed font-semibold">
                          Mubarak! Your admission application has been approved by Hazrat Maulana Mufti Muhammad Shafiullah Sahib. Please physically report to school desk with original documents to finalize.
                        </p>
                      </div>
                    </div>
                  )}

                  {searchedApp.status === 'rejected' && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-955/30 border border-rose-500/20 rounded-xl flex items-start gap-3">
                      <BadgeAlert className="w-5 h-5 text-rose-650 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase text-rose-800 dark:text-rose-400 font-mono tracking-wide">
                          REJECTED (अस्वीकृत)
                        </h4>
                        <p className="text-[11px] text-slate-655 dark:text-slate-400 mt-1 leading-relaxed font-semibold">
                          We regret to inform you that your application has been rejected under administrative selection constraints. Please contact support desk at <span className="font-bold text-slate-800 dark:text-white">+91 9193984452</span>.
                        </p>
                      </div>
                    </div>
                  )}

                  {searchedApp.status === 'pending' && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-955/30 border border-amber-500/20 rounded-xl flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-black uppercase text-amber-800 dark:text-amber-400 font-mono tracking-wide animate-pulse">
                          PENDING FOR REVIEW (आवेदन विचाराधीन)
                        </h4>
                        <p className="text-[11px] text-slate-650 dark:text-slate-400 mt-1 leading-relaxed font-semibold font-medium">
                          Your admission docket has been catalogued. Principal office currently verifying details in high administrative priority queue. Please check back later.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-205 dark:border-slate-755 bg-slate-205 shrink-0 select-none">
                      {searchedApp.studentPhoto ? (
                        <img src={searchedApp.studentPhoto} className="w-full h-full object-cover" alt="Student Portrait" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <User className="w-7 h-7" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 text-xs grow min-w-0">
                      <span className="text-[9px] font-black text-slate-400 uppercase font-mono block">APPLICATION RECEIPT</span>
                      <h4 className="font-extrabold text-slate-800 dark:text-white truncate">{searchedApp.studentName}</h4>
                      <p className="text-[11px] text-slate-500 font-bold">Class Applied: <span className="text-emerald-755 dark:text-emerald-450 font-black">{searchedApp.className}</span></p>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-2">
                        <div>
                          <span>FATHER GURADIAN:</span>
                          <p className="text-slate-700 dark:text-slate-300 font-semibold truncate">{searchedApp.fatherName}</p>
                        </div>
                        <div>
                          <span>APPLY DATE:</span>
                          <p className="text-slate-700 dark:text-slate-300 font-semibold">{searchedApp.applyDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-905/35 rounded-xl text-center space-y-1">
                  <BadgeAlert className="w-6 h-6 text-rose-600 mx-auto" />
                  <h4 className="text-xs font-black text-rose-800 dark:text-rose-400">Application Number Not Found</h4>
                  <p className="text-[10px] text-slate-505 dark:text-slate-400">
                    No active admissions ledger was found for the entered ID. Please double check the ID format (e.g. ADM-{getCurrentSession().split('-')[0] || '2026'}-X) or contact support desk.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : config?.isAdmissionOpen === false ? (
        <div className="max-w-xl mx-auto p-10 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-md text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <BadgeAlert className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-slate-850 dark:text-white">Admissions Currently Closed</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We are not accepting new admission applications at this time. Please check back later or contact the school office for further inquiries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Input form divided into sections (7 Columns) */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-md space-y-8 text-left">
            
            {/* Row index 1: Candidate particulars */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-amber-500 border-b border-slate-100 dark:border-slate-900 pb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[10px]">A</span>
                1. Candidate Profile Particulars
              </h3>

              {/* Student avatar builder */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row items-center gap-5">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all select-none group"
                  title="Click to Upload Passport Photo"
                >
                  {formData.studentPhoto ? (
                    <img src={formData.studentPhoto} alt="Student avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-center p-1.5 flex flex-col items-center justify-center text-slate-400 group-hover:text-emerald-500">
                      <User className="w-8 h-8 opacity-75" />
                      <span className="text-[8px] font-bold uppercase mt-1 leading-none tracking-tight">No Photo</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 flex-grow text-center sm:text-left">
                  <span className="text-xs font-black text-slate-750 dark:text-slate-300 block uppercase">Student Passport Photograph</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Upload a high-quality recent candidate photograph. If left blank, you will need to physically glue a passport photo onto the printed confirmation badge.
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 active:scale-95 text-white text-[10.5px] font-extrabold uppercase font-mono tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Photo (फोटो अपलोड करें)
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowGalleryModal(true)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-[10.5px] font-extrabold uppercase font-mono tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                    >
                      🖼️ Select from Gallery (गैलरी से चुनें)
                    </button>
                    
                    {formData.studentPhoto && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, studentPhoto: '' }))}
                        className="px-3 py-2 bg-slate-200 hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-650 dark:text-slate-300 text-[10.5px] font-extrabold uppercase font-mono tracking-wider rounded-lg cursor-pointer transition-all"
                      >
                        Remove (हटाएं)
                      </button>
                    )}
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between">
                    <span>Form Number (Optional)</span>
                    <span className="font-urdu text-sm">فارم نمبر</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <FileText className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Leave blank for auto-generate"
                      value={formData.formNumber}
                      onChange={(e) => setFormData({ ...formData, formNumber: e.target.value })}
                      className="w-full pl-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between">
                    <span>Candidate Full Name *</span>
                    <span className="font-urdu text-sm">نام طالب علم / طالبہ</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shakir Ahmad"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className="w-full pl-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between">
                    <span>Date of Birth (D.O.B) *</span>
                    <span className="font-urdu text-sm">تاریخ پیدائش</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full pl-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between">
                    <span>Aadhaar Number (12 Digit)</span>
                    <span className="font-urdu text-sm">آدھار نمبر</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <CreditCard className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 1234 5678 9012"
                      value={formData.aadhaarNumber}
                      onChange={handleAadhaarChange}
                      maxLength={14} // 12 digits + 2 spaces
                      className="w-full pl-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white font-mono"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 block font-medium">Leaves blank if Aadhaar registration is under queue.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between">
                    <span>Gender *</span>
                    <span className="font-urdu text-sm">جنس</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Male', 'Female', 'Other'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: g as any })}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                          formData.gender === g 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between">
                    <span>Academic Session Term *</span>
                    <span className="font-urdu text-sm">تعلیمی سال</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <select
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-emerald-800 dark:text-emerald-400 font-bold appearance-none cursor-pointer"
                    >
                      {availableYears.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <span className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400 text-[10px]">▼</span>
                  </div>
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between">
                    <span>Admission Type *</span>
                    <span className="font-urdu text-sm">داخلہ کی قسم (جدید / قدیم)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 h-10">
                    {['New', 'Old'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, admissionType: type as 'New' | 'Old' })}
                        className={`rounded-xl text-xs font-bold transition-all ${
                          formData.admissionType === type
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850'
                        }`}
                      >
                        {type === 'New' ? 'New (جدید)' : 'Old (قدیم)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row index 2: Parent information */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-amber-500 border-b border-slate-100 dark:border-slate-900 pb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[10px]">B</span>
                2. Parental & Family Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between">
                    <span>Father's / Guardian's Full Name *</span>
                    <span className="font-urdu text-sm">والد کا نام</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mohammad Bilal Ahmad"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      className="w-full pl-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between">
                    <span>Mother's Full Name *</span>
                    <span className="font-urdu text-sm">والدہ کا نام</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fatima Bi"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      className="w-full pl-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row index 3: Contact details */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-amber-500 border-b border-slate-100 dark:border-slate-900 pb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[10px]">C</span>
                3. Contact & Address details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between">
                    <span>Mobile Number *</span>
                    <span className="font-urdu text-sm">موبائل نمبر</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 99999 88888"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full pl-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between w-full">
                      <span>WhatsApp Number</span>
                      <span className="font-urdu text-sm">واٹس ایپ نمبر</span>
                    </label>
                  </div>
                  {formData.contactPhone && (
                    <div className="text-right mb-1">
                      <button
                        type="button"
                        onClick={handleCopyPhoneToWhatsapp}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 hover:underline cursor-pointer"
                      >
                        Same as Mobile
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      placeholder="e.g. +91 99999 88888"
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      className="w-full pl-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block">Parent Email ID (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="parent@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block">Full Residential Address (مکمل پتہ) *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    
                    <div className="space-y-1 col-span-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Village</label>
                      <input
                        type="text"
                        required
                        placeholder="Village Name"
                        value={addressFields.village}
                        onChange={(e) => setAddressFields({ ...addressFields, village: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white"
                      />
                    </div>
                    
                    <div className="space-y-1 col-span-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Post</label>
                      <input
                        type="text"
                        required
                        placeholder="Post Office"
                        value={addressFields.post}
                        onChange={(e) => setAddressFields({ ...addressFields, post: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Distt</label>
                      <input
                        type="text"
                        required
                        placeholder="District"
                        value={addressFields.distt}
                        onChange={(e) => setAddressFields({ ...addressFields, distt: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">State</label>
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={addressFields.state}
                        onChange={(e) => setAddressFields({ ...addressFields, state: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1 col-span-1 md:col-span-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Country</label>
                      <input
                        type="text"
                        required
                        readOnly
                        value={addressFields.country}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1 col-span-1 md:col-span-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">PIN Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 272126"
                        maxLength={6}
                        value={addressFields.pinCode}
                        onChange={(e) => setAddressFields({ ...addressFields, pinCode: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white font-mono"
                      />
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Row index 4: Course parameters */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-amber-500 border-b border-slate-100 dark:border-slate-900 pb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[10px]">D</span>
                4. Course Preferences & History
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between">
                    <span>Select Admission Class *</span>
                    <span className="font-urdu text-sm">مطلوبہ درجہ</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <School className="w-4 h-4" />
                    </span>
                    <select
                      value={formData.className}
                      onChange={(e) => setFormData({ ...formData, className: e.target.value as ClassName })}
                      className="w-full pl-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-emerald-800 dark:text-emerald-400 font-bold"
                    >
                      {classes.map((cls) => (
                        <option key={cls} value={cls}>{formatClassName(cls)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-650 dark:text-slate-300 block flex justify-between">
                    <span>Previous Attended School</span>
                    <span className="font-urdu text-sm">پہلے مدرسہ/اسکول کا نام</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Govt Primary School Lucknow / None"
                      value={formData.previousSchool}
                      onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                      className="w-full pl-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4.5 py-4 bg-emerald-650 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl text-xs font-extrabold font-mono tracking-widest uppercase cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                {isSubmitting ? (
                  <span>TRANSMITTING FILE SECURELY...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> REGISTER ADMISSION FILE
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Real-Time ID Preview Card (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-6 space-y-4">
            
            {/* Live Badge Preview Widget */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl flex flex-col items-center">
              
              {/* Halftone Islamic Geometric Background Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-teal-600/10 rounded-full blur-xl"></div>

              {/* ID Badge Heading */}
              <div className="text-center w-full pb-3 border-b border-white/10 mb-4 flex flex-col items-center gap-1">
                <span className="px-2 py-0.5 bg-yellow-400 text-black text-[9px] font-black rounded tracking-widest font-mono uppercase">
                  {config?.admissionBadgeTitle || "Candidate ID Badge"}
                </span>
                <span className="text-xs font-black tracking-widest font-serif text-amber-400">{config?.admissionInstitutionName || "JAMIA NOORUL ULOOM"}</span>
                <span className="text-[8px] tracking-wide font-mono opacity-50">{config?.admissionDeskName || "Lucknow Admission Desk"}</span>
              </div>

              {/* Portrait container */}
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-slate-800 shadow-lg mb-3 shrink-0 flex items-center justify-center select-none text-slate-550">
                {formData.studentPhoto ? (
                  <img 
                    src={formData.studentPhoto} 
                    alt="Candidate ID" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-500 opacity-60" />
                )}
              </div>

              {/* Patient Profile values */}
              <div className="text-center space-y-1.5 w-full">
                <h4 className="text-base font-black truncate max-w-full text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-white to-amber-200">
                  {formData.studentName || "Candidate Full Name"}
                </h4>
                
                <span className="inline-block px-3 py-0.5 bg-emerald-900/50 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold rounded-full">
                  Class: {formData.className}
                </span>

                <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-left text-[9px] text-slate-400 pt-3 border-t border-white/5 font-mono">
                  <div>
                    <span>FATHER NAME:</span>
                    <p className="text-white font-sans font-bold truncate">{formData.fatherName || "Father's Name"}</p>
                  </div>
                  <div>
                    <span>MOTHER NAME:</span>
                    <p className="text-white font-sans font-bold truncate">{formData.motherName || "Mother's Name"}</p>
                  </div>
                  <div>
                    <span>D.O.B:</span>
                    <p className="text-white font-bold">{formData.dateOfBirth || "YY-MM-DD"}</p>
                  </div>
                  <div>
                    <span>GENDER:</span>
                    <p className="text-white font-bold">{formData.gender}</p>
                  </div>
                  <div className="col-span-2">
                    <span>AADHAAR NUMBER:</span>
                    <p className="text-white font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded text-center">
                      {formData.aadhaarNumber || "XXXX XXXX XXXX"}
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code element placeholder */}
              <div className="w-full mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-[7px] text-amber-400/50 uppercase font-black tracking-widest font-mono">ADMISSION QR PASS</span>
                  <p className="text-[8px] text-slate-400 font-bold font-mono">Status: <span className="text-amber-500 animate-pulse">PENDING</span></p>
                </div>
                <QrCode className="w-8 h-8 text-white/50 opacity-80" />
              </div>
            </div>

            {/* Quick Informational Notice Widget */}
            <div className="p-5 bg-amber-50/40 dark:bg-slate-900/30 border border-amber-500/10 dark:border-amber-500/5 rounded-2xl space-y-3">
              <h5 className="font-bold text-xs text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <Info className="w-4 h-4 mt-0.5 shrink-0" /> Supporting Documents Desk Checklist
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                Submit copies of these files when visit school physically:
              </p>
              <ul className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1.5 pl-3 list-disc">
                <li>Candidate's Original Aadhaar print</li>
                <li>TC or Primary Report Ledger sheets</li>
                <li>Parent's Address verification billing files</li>
              </ul>
            </div>
            
          </div>
        </div>

      </div>
      )}

      {showGalleryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white flex items-center gap-2">
                🕌 Select Photo from School Gallery
              </h3>
              <button
                type="button"
                onClick={() => setShowGalleryModal(false)}
                className="p-1 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg text-xs cursor-pointer font-bold"
              >
                Close &times;
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-950 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
              <div className="flex flex-wrap gap-1">
                {['All', 'Campus', 'Events', 'Classes', 'Achievements'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGalleryCategoryFilter(cat as any)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      galleryCategoryFilter === cat
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-150 dark:hover:bg-slate-750'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <input
                type="text"
                placeholder="Search captions... (विवरण खोजें)"
                value={gallerySearchQuery}
                onChange={e => setGallerySearchQuery(e.target.value)}
                className="p-2 px-3 w-full sm:w-60 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white text-[11px]"
              />
            </div>

            {/* Gallery Grid */}
            <div className="p-5 overflow-y-auto flex-grow bg-slate-50 dark:bg-slate-950">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {gallery
                  .filter(item => galleryCategoryFilter === 'All' || item.category === galleryCategoryFilter)
                  .filter(item => !gallerySearchQuery.trim() || item.caption.toLowerCase().includes(gallerySearchQuery.toLowerCase()))
                  .map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, studentPhoto: item.url }));
                        setShowGalleryModal(false);
                      }}
                      className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-left flex flex-col justify-between"
                    >
                      <div className="relative h-28 bg-slate-100 overflow-hidden">
                        <img
                          src={item.url}
                          alt={item.caption}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-emerald-950 text-amber-300 font-mono text-[8px] font-black rounded uppercase">
                          {item.category}
                        </span>
                      </div>
                      <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <p className="text-[10px] text-slate-650 dark:text-slate-400 line-clamp-2 leading-snug font-medium">
                          {item.caption}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Footer hint */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 text-center text-[10px] text-slate-500">
              💡 Click on any photo above to select it as your profile photograph model picture.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
