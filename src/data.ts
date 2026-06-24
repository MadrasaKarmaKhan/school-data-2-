import { Student, Result, Teacher, AdmissionApplication, GalleryItem, NewsItem, SchoolConfig } from './types';

export const INITIAL_CONFIG: SchoolConfig = {
  schoolName: "Madrasa Arabia Noorul Uloom",
  schoolNameArabic: "المدرسة العربية نور العلوم",
  tagline: "Inspiring Excellence in Islamic Knowledge and Modern Education",
  principalName: "Hazrat Maulana Mufti Muhammad Shafiullah Sahib",
  principalMessage: "Dear Students, Parents, and Well-wishers, Welcome to Madrasa Arabia Noorul Uloom. Our mission is to nurture the hearts and minds of the next generation with authentic Islamic values alongside high-quality modern academic streams. We strive to develop righteous characters who excel in science, computer technology, and Quranic wisdom. May Allah accept our humble efforts.",
  googleSheetsWebhookUrl: "https://script.google.com/macros/s/AKfycbzlXCkVwXgVQPqgAm3qbUsPZTrWAYeaZg_BLyj7ozCt3C7Ns1Y-teOFVcyA9esIqQA-tw/exec",
  principalPhotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=350",
  contactPhone: "+91 9193984452",
  contactEmail: "info@noorululoom.edu",
  address: "Noorul Uloom Campus Karma Khan District Sant Kabir Nagar Uttar Pradesh -272126",
  whatsappNumber: "+919193984452",
  isAdmissionOpen: false,

  // Default sliders
  heroBg1: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1200",
  heroBg2: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1200",
  heroBg3: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=1200",

  // Stats Counters
  stat1Num: "30+",
  stat1Label: "Years of Trust",
  stat2Num: "1,500+",
  stat2Label: "Graduations (Aalim)",
  stat3Num: "100%",
  stat3Label: "Tajweed Success",
  stat4Num: "15+",
  stat4Label: "Smart IT courses",

  // Credentials
  historyHeader: "Roots in Scholars education",
  historyText: "Founded in Karma Khan, Sant Kabir Nagar, Uttar Pradesh in 1994 under the tutelage of senior Islamic theologians, our Madrasa has grown from a humble study-circle of tajweed to a pioneering full-fledged campus imparting higher Islamic sciences along with contemporary high-school modern syllabus.",
  missionHeader: "Equipping with dual wisdom",
  missionText: "To provide the younger generations with precise spiritual grounding, accurate recitation accents, authentic moral jurisprudence (Ifta guides) along with dynamic secular literacy in computer coding and physical science, producing leaders of tomorrow.",
  visionHeader: "Excel in Dunia & Akhirah",
  visionText: "We envision an society where future leaders hold the Holy Quran in their hearts and state-of-the-art technological literacy in their hands — fostering religious harmony, research advancements, and highly righteous human characters.",

  // Academic programs
  prog1Title: "Primary Education",
  prog1Text: "Targeted for kids aged 5 to 11. Imparts basic Arabic alphabets, tajweed vocalization, Urdu literature, coupled with English grammar, mathematics, and environmental sciences.",
  prog2Title: "Secondary Education",
  prog2Text: "Standard high-school courses adhering to regional standards alongside theology. Prepares for board evaluations with robust physics, biology, history and computer modules.",
  prog3Title: "Islamic Education (Aalim)",
  prog3Text: "Deep, multi-year certified theological learning comprising Tafseer-ul-Quran (Interpretation), Usool-ul-Hadith, Fiqh Jurisprudence (Fatwa streams) and Arabic grammar rhetoric.",
  prog4Title: "Computer & IT Literacy",
  prog4Text: "Advanced computer science training covering web architecture, basic algorithms (TypeScript), digital graphic tools, and online documentation databases for modern professions.",

  // Smart Campus facilities
  fac1Title: "Islamic Reference Library",
  fac1Img: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=600",
  fac1Text: "Houses over 10,000 reference volumes of Hadith collection, jurisprudential scrolls (Hanafi, Shafi, etc.) along with global history encyclopedias and textbooks.",
  fac2Title: "Digital Computing Center",
  fac2Img: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=600",
  fac2Text: "Equipped with high-performance computer terminals, smart multimedia overhead projectors, and safe filtered high-speed internet connections.",
  fac3Title: "Athletics & Assembly Ground",
  fac3Img: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=600",
  fac3Text: "Spacious open courtyards configured for daily physical assemblies, and physical health recreation files like football, badminton, and running tracks.",

  // New config entries
  admissionNotice: "ADMISSION 2026: Online Applications Open",
  establishedYear: "Est. 1994",
  principalSub: "Sheikh-ul-Hadith & Mufti",
  principalTitleHeading: "Message from Hazrat Maulana's desk",
  principalLedgerTag: "Authorized Institution Ledger 2026",
  topper1Heading: "Topper #1 (First Place)",
  topper1Name: "Mohammad Zaheer Khan",
  topper1Badge: "91.2% (Secondary Board First)",
  topper1Blurb: "Overall highest scorer in combined contemporary sciences curriculum.",
  topper2Heading: "Topper #2 (Saba Top)",
  topper2Name: "Ahmad Mujtaba",
  topper2Badge: "98% (Quran Memorization Top)",
  topper2Blurb: "Perfect score in tajweed accents saba' Recitation mode files.",
  topper3Heading: "Topper #3 (Aalim Topper)",
  topper3Name: "Fatima Bi",
  topper3Badge: "88.5% (Aalimiat Class Topper)",
  topper3Blurb: "Exemplary scores in Arabic Jurisprudence (Fiqh/Tafseer studies).",
  aboutText: "Established in 1994, our Madrasa is dedicated to offering a highly refined balance of authentic religious scholars (Aalim & Hifz streams) and modern scientific streams (Computer science & general education) to prepare multi-dimensional young minds.",
  mottoArabic: "رَّبِّ زِدْنِي عِلْمًا",
  mottoEnglish: '"O my Sustainer, increase me in knowledge." (Al-Quran - Surah Taha)',
  footerCreditTag: "for Academic Excellence in Computer Lit & Ifta",
  bottomMarqueeText: "EXCELLENCE IN ISLAMIC TA'LEEM & DIGITAL EDUCATION ✦ ADMISSIONS OPEN FOR SESSION 2026-2027",
  topMarqueeText: "Admission registration is completely paperless. Submit forms online now! ✦ Helpdesk Contact: +91 9193984452",

  // Default Donations Bank details & QR scan
  bankName: "State Bank of India (SBI)",
  accountName: "MADRASA ARABIA NOORUL ULOOM",
  accountNumber: "38920192831",
  ifscCode: "SBIN0001234",
  upiId: "madrasanoorululoom@sbi",
  qrCodeUrl: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=300",

  // Default Donation section texts
  donateSectionTitle: "Support Our Noble Cause (मदरसा की इमदाद करें)",
  donateSectionSubtitle: "अनाथ, गरीब एवं असहाय बच्चों की निःशुल्क दीनी तालीम, आधुनिक विद्यालयीय पाठ्यक्रम, कंप्यूटर शिक्षा, भोजन और रहने की व्यवस्था (मदरसा के संचालन) में अपनी ज़कात-सदक़ा से सहयोग करें।",
  whySupportHeading: "Why Support Us? (सहयोग करें)",
  whySupportText: "Our Madrasa provides free housing, uniforms, study materials, primary, secondary board education, and intensive theological classes to hundreds of students coming from disadvantaged backgrounds, solely supported by public contributors like you.",

  // Custom Logo URL
  logoUrl: ""
};

export const INITIAL_STUDENTS: Student[] = [
  {
    id: "s1",
    rollNo: "2026101",
    name: "Mohammad Zaheer Khan",
    fatherName: "Abdur Rahman Khan",
    className: "EDADIA",
    session: "2025-2026",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
    dateOfBirth: "2010-04-12",
    contactNo: "+91 99999 88888"
  },
  {
    id: "s2",
    rollNo: "2026102",
    name: "Ahmad Mujtaba",
    fatherName: "Maulana Ghulam Mustafa",
    className: "FARSI",
    session: "2025-2026",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
    dateOfBirth: "2012-08-20",
    contactNo: "+91 98888 77777"
  },
  {
    id: "s3",
    rollNo: "2026103",
    name: "Fatima Bi",
    fatherName: "Sayyid Hamid Ali",
    className: "ARBI",
    session: "2025-2026",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    dateOfBirth: "2008-01-15",
    contactNo: "+91 97777 66666"
  }
];

export const INITIAL_RESULTS: Result[] = [
  {
    id: "r1",
    rollNo: "2026101",
    className: "EDADIA",
    passingYear: 2026,
    studentName: "Mohammad Zaheer Khan",
    fatherName: "Abdur Rahman Khan",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
    session: "2025-2026",
    marks: {
      "Quranic Tajweed": 94,
      "Arabic Grammar": 88,
      "Islamic History": 91,
      "Mathematics": 85,
      "General Science": 89,
      "Computer Applications": 95,
      "English Literature": 87
    },
    totalMarks: 700,
    percentage: 91.2,
    isPassed: true,
    examType: "Annual"
  },
  {
    id: "r2",
    rollNo: "2026102",
    className: "FARSI",
    passingYear: 2026,
    studentName: "Ahmad Mujtaba",
    fatherName: "Maulana Ghulam Mustafa",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
    session: "2025-2026",
    marks: {
      "Quran Memorization (Hifz)": 98,
      "Makharij & Tajweed Rules": 95,
      "Islamic Manners (Adab)": 92,
      "Basic Arabic Vocalization": 89,
      "Urdu Text Comprehension": 90
    },
    totalMarks: 500,
    percentage: 92.8,
    isPassed: true,
    examType: "Annual"
  },
  {
    id: "r3",
    rollNo: "2026103",
    className: "ARBI",
    passingYear: 2026,
    studentName: "Fatima Bi",
    fatherName: "Sayyid Hamid Ali",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    session: "2025-2026",
    marks: {
      "Arabic Jurisprudence (Fiqh)": 92,
      "Hadith Studies (Usool)": 87,
      "Tafseer-ul-Quran": 94,
      "Arabic Literature & Rhetoric": 85,
      "Contemporary Comparative Religions": 83,
      "Computer Basics & Research": 90
    },
    totalMarks: 600,
    percentage: 88.5,
    isPassed: true,
    examType: "Annual"
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: "t1",
    name: "Hazrat Maulana Mufti Muhammad Shafiullah Sahib",
    designation: "Principal & Senior Sheikh-ul-Hadith",
    qualification: "Fazeelat from Darul Uloom Deoband, Specialization in Ifta (Fatwa)",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
    phone: "+91 98765 00111",
    email: "principal@noorululoom.edu"
  },
  {
    id: "t2",
    name: "Maulana Abdur Rasheed Nadwi",
    designation: "Vice Principal & Professor of Arabic Language",
    qualification: "Aalimiat & Fazeelat from Darul Uloom Nadwatul Ulama, MA in Arabic Literature",
    photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300",
    phone: "+91 98765 00222",
    email: "arasheed@noorululoom.edu"
  },
  {
    id: "t3",
    name: "Qari Rizwan-ul-Haq",
    designation: "Head of Tajweed & Qira'at Department",
    qualification: "Hafiz-ul-Quran, Certified Saba' Qira'at (Seven Modes of Recitation)",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300",
    phone: "+91 98765 00333",
    email: "qrizwan@noorululoom.edu"
  },
  {
    id: "t4",
    name: "Er. Anas Siddiqui",
    designation: "Head of Modern Education & Computer Science",
    qualification: "B.Tech in Computer Science, Certified Web Architect",
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300",
    phone: "+91 98765 00444",
    email: "anas@noorululoom.edu"
  }
];

export const INITIAL_ADMISSIONS: AdmissionApplication[] = [
  {
    id: "ADM-2026-1001",
    studentName: "Mohammad Sadiq",
    fatherName: "Mohammad Irfan",
    dateOfBirth: "2013-05-18",
    className: "L.K.G",
    contactPhone: "+91 88877 66554",
    email: "sadiqparent@gmail.com",
    address: "Golaganj, Near Jama Masjid, Lucknow",
    applyDate: "2026-05-28",
    status: "pending"
  },
  {
    id: "ADM-2026-1002",
    studentName: "Zubair Alvi",
    fatherName: "Khalid Alvi",
    dateOfBirth: "2009-11-02",
    className: "EDADIA",
    contactPhone: "+91 77766 55443",
    email: "khalidalvi@gmail.com",
    address: "Aliganj Extension, Lucknow",
    applyDate: "2026-05-30",
    status: "approved"
  }
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: "g1",
    url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800",
    caption: "Our main campus building during morning assembly.",
    category: "Campus"
  },
  {
    id: "g2",
    url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=800",
    caption: "The fully stocked digital and physical Islamic Library.",
    category: "Campus"
  },
  {
    id: "g3",
    url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=800",
    caption: "Students participating in the Annual Quran Recitation (Qira'at) Seminar.",
    category: "Events"
  },
  {
    id: "g4",
    url: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=800",
    caption: "Interactive interactive Smart Classroom with digital learning boards.",
    category: "Classes"
  },
  {
    id: "g5",
    url: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800",
    caption: "Advanced Computer Lab for digital education and online learning courses.",
    category: "Classes"
  },
  {
    id: "g6",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
    caption: "Gold Medal Ceremony for top-achieving students in Islamic and Contemporary subjects.",
    category: "Achievements"
  }
];

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: "n1",
    date: "2026-06-01",
    title: "Admissions Extended for Academic Year 2026-2027",
    content: "The advisory board has decided to extend online and offline admission applications till June 20, 2026. Apply through the admissions portal now.",
    isImportant: true
  },
  {
    id: "n2",
    date: "2026-05-25",
    title: "Annual Exam Results Declared",
    content: "Results for Session 2025-2026 are published online. Students can check their results on the Result Portal using class and roll number.",
    isImportant: true
  },
  {
    id: "n3",
    date: "2026-05-15",
    title: "New Modern Coding & IT Curriculum Pack Initiated",
    content: "From the upcoming session, advanced modules on AI foundation, Web Development, and Digital Literacy will be taught as part of Computer Education.",
    isImportant: false
  }
];

// Helper functions for safe local storage extraction
export const getStoredData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

export const setStoredData = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
};

export const DEFAULT_CLASSES: string[] = [
  'L.K.G', 'U.K.G', '1ST A', '1ST B', '2ND A', '2ND B', '3RD A', '3RD B', '4TH A', '4TH B', '5TH A', '5TH B', 'EDADIA', 'FARSI', 'ARBI'
];

export const getSchoolClasses = (): string[] => {
  if (typeof window === 'undefined') {
    return DEFAULT_CLASSES;
  }
  try {
    const stored = window.localStorage.getItem("school_classes_list");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading school_classes_list:", e);
  }
  return DEFAULT_CLASSES;
};

export const DEFAULT_SESSIONS: string[] = [
  "2024-2025", "2025-2026", "2026-2027", "2027-2028"
];

export const getSchoolSessions = (): string[] => {
  if (typeof window === 'undefined') {
    return DEFAULT_SESSIONS;
  }
  try {
    const stored = window.localStorage.getItem("school_sessions_list");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } else {
      window.localStorage.setItem("school_sessions_list", JSON.stringify(DEFAULT_SESSIONS));
    }
  } catch (e) {
    console.error("Error reading school_sessions_list:", e);
  }
  return DEFAULT_SESSIONS;
};

export const ORIGINAL_10_SUBJECTS = ["Quran", "Hifz", "Deeniyat", "Urdu", "English", "Hindi", "Science", "Social Science", "Math", "Dua & Kalma"];

export const DEFAULT_CLASS_SUBJECTS: Record<string, string[]> = {
  "L.K.G": [...ORIGINAL_10_SUBJECTS],
  "U.K.G": [...ORIGINAL_10_SUBJECTS],
  "1ST": [...ORIGINAL_10_SUBJECTS],
  "2ND": [...ORIGINAL_10_SUBJECTS],
  "3RD": [...ORIGINAL_10_SUBJECTS],
  "4TH": [...ORIGINAL_10_SUBJECTS],
  "5TH": [...ORIGINAL_10_SUBJECTS],
  "1ST A": [...ORIGINAL_10_SUBJECTS],
  "1ST B": [...ORIGINAL_10_SUBJECTS],
  "2ND A": [...ORIGINAL_10_SUBJECTS],
  "2ND B": [...ORIGINAL_10_SUBJECTS],
  "3RD A": [...ORIGINAL_10_SUBJECTS],
  "3RD B": [...ORIGINAL_10_SUBJECTS],
  "4TH A": [...ORIGINAL_10_SUBJECTS],
  "4TH B": [...ORIGINAL_10_SUBJECTS],
  "5TH A": [...ORIGINAL_10_SUBJECTS],
  "5TH B": [...ORIGINAL_10_SUBJECTS],
  "EDADIA": [...ORIGINAL_10_SUBJECTS],
  "FARSI": [...ORIGINAL_10_SUBJECTS],
  "ARBI": [...ORIGINAL_10_SUBJECTS]
};

export const getClassSubjects = (className: string): string[] => {
  if (typeof window === 'undefined') {
    return DEFAULT_CLASS_SUBJECTS[className] || ORIGINAL_10_SUBJECTS;
  }
  try {
    const stored = window.localStorage.getItem("madarsa_class_subjects");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed[className] && Array.isArray(parsed[className])) {
        return parsed[className];
      }
    }
  } catch (e) {
    console.error("Error reading madarsa_class_subjects:", e);
  }
  return DEFAULT_CLASS_SUBJECTS[className] || ORIGINAL_10_SUBJECTS;
};

