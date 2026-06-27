import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  ShieldAlert, LogIn, Award, Users, BookOpen, FileText, Settings, Sparkles, Plus, Trash2, Edit2, Check, X,
  Search, Upload, Image, ShieldCheck, Mail, Phone, MapPin, RefreshCw, AlertCircle, PlusCircle, Calendar, Printer, Menu
} from 'lucide-react';
import { Student, Result, Teacher, AdmissionApplication, GalleryItem, NewsItem, SchoolConfig, ClassName } from '../types';
import { resizeImage, compressBase64Image } from '../lib/imageUtils';
import { removeBlackBackground } from '../lib/removeBlack';
import { getClassSubjects, DEFAULT_CLASS_SUBJECTS, getSchoolClasses, getSchoolSessions } from '../data';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DAILY_DUAS } from '../data/duas';
import { syncToFirebase } from '../lib/firebaseUtils';

interface PrincipalDashboardProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  results: Result[];
  setResults: React.Dispatch<React.SetStateAction<Result[]>>;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  admissions: AdmissionApplication[];
  setAdmissions: React.Dispatch<React.SetStateAction<AdmissionApplication[]>>;
  gallery: GalleryItem[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  news: NewsItem[];
  setNews: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  schoolConfig: SchoolConfig;
  setSchoolConfig: React.Dispatch<React.SetStateAction<SchoolConfig>>;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
}

export function normalizeClassName(rawClass: any): ClassName {
  if (!rawClass) return "EDADIA";
  const str = String(rawClass).trim().toUpperCase();
  if (str === "L.K.G" || str === "LKG" || str === "L. K. G.") return "L.K.G";
  if (str === "U.K.G" || str === "UKG" || str === "U. K. G.") return "U.K.G";
  if (str === "1ST A" || str === "1 A" || str === "1A" || str === "CLASS 1 A" || str.includes("1ST A") || str.includes("1 A")) return "1ST A";
  if (str === "1ST B" || str === "1 B" || str === "1B" || str === "CLASS 1 B" || str.includes("1ST B") || str.includes("1 B")) return "1ST B";
  if (str === "2ND A" || str === "2 A" || str === "2A" || str === "CLASS 2 A" || str.includes("2ND A") || str.includes("2 A")) return "2ND A";
  if (str === "2ND B" || str === "2 B" || str === "2B" || str === "CLASS 2 B" || str.includes("2ND B") || str.includes("2 B")) return "2ND B";
  if (str === "3RD A" || str === "3 A" || str === "3A" || str === "CLASS 3 A" || str.includes("3RD A") || str.includes("3 A")) return "3RD A";
  if (str === "3RD B" || str === "3 B" || str === "3B" || str === "CLASS 3 B" || str.includes("3RD B") || str.includes("3 B")) return "3RD B";
  if (str === "4TH A" || str === "4 A" || str === "4A" || str === "CLASS 4 A" || str.includes("4TH A") || str.includes("4 A")) return "4TH A";
  if (str === "4TH B" || str === "4 B" || str === "4B" || str === "CLASS 4 B" || str.includes("4TH B") || str.includes("4 B")) return "4TH B";
  if (str === "5TH A" || str === "5 A" || str === "5A" || str === "CLASS 5 A" || str.includes("5TH A") || str.includes("5 A")) return "5TH A";
  if (str === "5TH B" || str === "5 B" || str === "5B" || str === "CLASS 5 B" || str.includes("5TH B") || str.includes("5 B")) return "5TH B";

  if (str === "1" || str === "1ST" || str === "FIRST" || str === "I" || str === "CLASS 1" || str === "CLASS 1ST") return "1ST A";
  if (str === "2" || str === "2ND" || str === "SECOND" || str === "II" || str === "CLASS 2" || str === "CLASS 2ND") return "2ND A";
  if (str === "3" || str === "3RD" || str === "THIRD" || str === "III" || str === "CLASS 3" || str === "CLASS 3RD") return "3RD A";
  if (str === "4" || str === "4TH" || str === "FOURTH" || str === "IV" || str === "CLASS 4" || str === "CLASS 4TH") return "4TH A";
  if (str === "5" || str === "5TH" || str === "FIFTH" || str === "V" || str === "CLASS 5" || str === "CLASS 5TH") return "5TH A";
  if (str === "EDADIA" || str === "IDADIA" || str === "IDADYAH" || str === "EDADYAH" || str === "IDAADIYA" || str === "IDADIYA" || str === "I'DADIYAH" || str === "I'DADIYA") return "EDADIA";
  if (str === "FARSI") return "FARSI";
  if (str === "ARBI" || str === "ARABIC") return "ARBI";
  
  // If exact match of known types, return it
  const validClasses: ClassName[] = [
    ...getSchoolClasses() as ClassName[],
    '1ST', '2ND', '3RD', '4TH', '5TH'
  ];
  if (validClasses.includes(str as any)) {
    return str as ClassName;
  }
  
  // Try substring search
  const found = validClasses.find(c => str.includes(c) || c.includes(str));
  if (found) return found;

  return "EDADIA"; // Default fallback
}

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

export function normalizeSession(session: string): string {
  if (!session) return getCurrentSession();
  const trimmed = String(session).trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const firstYear = match[1];
    const secondYear = match[2];
    return `${firstYear}-20${secondYear}`;
  }
  return trimmed;
}

export default function PrincipalDashboard({
  students, setStudents,
  results, setResults,
  teachers, setTeachers,
  admissions, setAdmissions,
  gallery, setGallery,
  news, setNews,
  schoolConfig, setSchoolConfig,
  isLoggedIn, setIsLoggedIn
}: PrincipalDashboardProps) {
  // Dynamic class weights for sorting classes properly with dynamic classes
  const classWeights: Record<string, number> = {};
  getSchoolClasses().forEach((cls, idx) => {
    classWeights[cls] = idx + 1;
  });
  classWeights['1ST'] = classWeights['1ST A'] || 3;
  classWeights['2ND'] = classWeights['2ND A'] || 6;
  classWeights['3RD'] = classWeights['3RD A'] || 9;
  classWeights['4TH'] = classWeights['4TH A'] || 12;
  classWeights['5TH'] = classWeights['5TH A'] || 15;

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Active Management Tab inside ERP panel
  const [erpTab, setErpTab] = useState<'analytics' | 'students' | 'results' | 'teachers' | 'admissions' | 'admission_setup' | 'gallery' | 'news' | 'config' | 'duas-mgmt' | 'dua-students'>('analytics');

  // --- Dua App Management States ---
  const [duaStudents, setDuaStudents] = useState<any[]>([]);
  const [selectedDuaClassFilter, setSelectedDuaClassFilter] = useState<string>('ALL');
  const [duaSearchQuery, setDuaSearchQuery] = useState<string>('');
  const [editingDuaStudent, setEditingDuaStudent] = useState<any | null>(null);

  const [duas, setDuas] = useState<any[]>([]);
  const [editingDua, setEditingDua] = useState<any | null>(null);
  const [showAddDuaModal, setShowAddDuaModal] = useState<boolean>(false);
  const [newDua, setNewDua] = useState<any>({
    title: '',
    arabic: '',
    translationHindi: '',
    translationUrdu: ''
  });

  // Real-time listener for Registered Children (Dua App Students)
  useEffect(() => {
    if (!isLoggedIn) return;
    const unsub = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studs: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        studs.push({
          code: docSnap.id,
          name: data.name || '',
          className: data.className || '',
          rollNo: data.rollNo || '',
          memorizedDuas: data.memorizedDuas || []
        });
      });
      setDuaStudents(studs);
    }, (error: any) => {
      if (error?.code === 'resource-exhausted') {
        console.warn("Firebase Quota Exceeded. Using local/cached students.");
      } else {
        console.error("Firestore loading error: ", error);
      }
    });
    return () => unsub();
  }, [isLoggedIn]);

  // Real-time listener for Duas management
  useEffect(() => {
    if (!isLoggedIn) return;
    const unsub = onSnapshot(collection(db, 'duas'), (snapshot) => {
      const fbCustom: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const idVal = Number(docSnap.id);
        fbCustom.push({
          id: isNaN(idVal) ? (data.id || Date.now()) : idVal,
          title: data.title || '',
          arabic: data.arabic || '',
          translationHindi: data.translationHindi || '',
          translationUrdu: data.translationUrdu || ''
        });
      });

      let merged = [...DAILY_DUAS];
      fbCustom.forEach(customDua => {
        const idx = merged.findIndex(d => d.id === customDua.id);
        if (idx !== -1) {
          merged[idx] = customDua;
        } else {
          merged.push(customDua);
        }
      });

      const uniqueMap = new Map<number, any>();
      merged.forEach(d => uniqueMap.set(d.id, d));
      const sorted = Array.from(uniqueMap.values()).sort((a, b) => a.id - b.id);
      setDuas(sorted);
    }, (error: any) => {
      if (error?.code === 'resource-exhausted') {
        console.warn("Firebase Quota Exceeded. Using local/default duas.");
      } else {
        console.error("Firestore duas loading error: ", error);
      }
    });
    return () => unsub();
  }, [isLoggedIn]);

  // Dua saving and operations handlers
  const handleSaveDua = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDua) return;
    try {
      await setDoc(doc(db, 'duas', String(editingDua.id)), {
        id: editingDua.id,
        title: editingDua.title,
        arabic: editingDua.arabic,
        translationHindi: editingDua.translationHindi,
        translationUrdu: editingDua.translationUrdu
      });
      setEditingDua(null);
      alert('Dua updated successfully! (दुआ सफलतापूर्वक सहेजी गई)');
    } catch (err) {
      console.error(err);
      alert('Error updating Dua in database.');
    }
  };

  const handleAddDua = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDua.title.trim() || !newDua.arabic.trim()) {
      alert("Title and Arabic fields are required!");
      return;
    }
    try {
      const maxId = duas.length > 0 ? Math.max(...duas.map(d => Number(d.id) || 0)) : 0;
      const nextId = maxId + 1;
      await setDoc(doc(db, 'duas', String(nextId)), {
        id: nextId,
        title: newDua.title.trim(),
        arabic: newDua.arabic.trim(),
        translationHindi: newDua.translationHindi.trim(),
        translationUrdu: newDua.translationUrdu.trim()
      });
      setShowAddDuaModal(false);
      setNewDua({ title: '', arabic: '', translationHindi: '', translationUrdu: '' });
      alert('New Dua added successfully! (नई दुआ सफलतापूर्वक जोड़ी गई)');
    } catch (err) {
      console.error(err);
      alert('Error adding Dua to database.');
    }
  };

  const handleDeleteDua = async (id: number) => {
    if (!confirm("Are you sure you want to delete this Dua? (क्या आप वाकई इस दुआ को हटाना चाहते हैं?)")) return;
    try {
      await deleteDoc(doc(db, 'duas', String(id)));
      alert('Dua deleted successfully!');
    } catch (err) {
      console.error(err);
      alert('Error deleting Dua.');
    }
  };

  const handleSaveDuaStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDuaStudent) return;
    try {
      await setDoc(doc(db, 'students', editingDuaStudent.code), {
        name: editingDuaStudent.name.trim(),
        className: editingDuaStudent.className,
        rollNo: editingDuaStudent.rollNo.trim(),
        memorizedDuas: editingDuaStudent.memorizedDuas || []
      });
      setEditingDuaStudent(null);
      alert('Student profile updated successfully! (बच्चे का प्रोफ़ाइल अपडेट हो गया)');
    } catch (err) {
      console.error(err);
      alert('Database error. Could not update student.');
    }
  };

  const handleDeleteDuaStudent = async (code: string) => {
    if (!confirm("Remove this registered student from the Dua database? (क्या आप वाकई इस छात्र को हटाना चाहते हैं?)")) return;
    try {
      await deleteDoc(doc(db, 'students', code));
      alert('Student removed successfully.');
    } catch (err) {
      console.error(err);
      alert('Error removing student.');
    }
  };

  // Search filter modifiers
  const [studentSearch, setStudentSearch] = useState('');
  const [resultSearch, setResultSearch] = useState('');
  const [adminResultClassFilter, setAdminResultClassFilter] = useState<'ALL' | ClassName>('ALL');
  const [selectedExamTypeTab, setSelectedExamTypeTab] = useState<'Annual' | 'Half-Yearly' | 'Quarterly'>('Annual');
  const [savedRecordsYearFilter, setSavedRecordsYearFilter] = useState<string>(getCurrentSession());
  const [studentYearFilter, setStudentYearFilter] = useState<string>(getCurrentSession());
  const [studentClassFilter, setStudentClassFilter] = useState<'ALL' | ClassName>('ALL');

  // Editing structures
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  // Form creators states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    rollNo: '',
    name: '',
    fatherName: '',
    className: 'EDADIA' as ClassName,
    session: getCurrentSession(),
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    dateOfBirth: '2011-01-01',
    contactNo: ''
  });

  const [showAddResultModal, setShowAddResultModal] = useState(false);
  const [newResult, setNewResult] = useState({
    rollNo: '',
    className: 'EDADIA' as ClassName,
    passingYear: 2026,
    marksInput: {
      "Quranic Studies": 90,
      "Arabic Grammar": 85,
      "Islamic History": 80,
      "Mathematics": 75,
      "Computer Literacy": 92
    } as { [subject: string]: number }
  });

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    designation: '',
    qualification: '',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    phone: '',
    email: ''
  });

  const [showAddGalleryModal, setShowAddGalleryModal] = useState(false);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const [newGallery, setNewGallery] = useState({
    url: '',
    caption: '',
    category: 'Campus' as 'Campus' | 'Events' | 'Classes' | 'Achievements'
  });

  const [showAddNewsModal, setShowAddNewsModal] = useState(false);
  const [newNews, setNewNews] = useState({
    title: '',
    content: '',
    isImportant: true
  });

  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingNewsTitle, setEditingNewsTitle] = useState("");
  const [editingNewsContent, setEditingNewsContent] = useState("");
  const [editingNewsIsImportant, setEditingNewsIsImportant] = useState(false);
  const [deleteConfirmNewsId, setDeleteConfirmNewsId] = useState<string | null>(null);

  // Madarsa custom result form states
  const [adminRegNo, setAdminRegNo] = useState("G- 59313");
  const [adminUdise, setAdminUdise] = useState("4053");
  const [adminRollno, setAdminRollno] = useState("");
  const [adminSname, setAdminSname] = useState("");
  const [adminFname, setAdminFname] = useState("");
  const [adminMname, setAdminMname] = useState("");
  const [adminDob, setAdminDob] = useState("12-04-2011");
  const [adminSclass, setAdminSclass] = useState<ClassName>("EDADIA");
  const [adminAddress, setAdminAddress] = useState("VILLAGE & POST KARMA KHAN, DISTRICT SANT KABIR NAGAR, UTTAR PRADESH");
  const [adminDivision, setAdminDivision] = useState("");
  const [adminSession, setAdminSession] = useState(getCurrentSession());
  const [adminExamType, setAdminExamType] = useState("Annual");
  const [adminPhoto, setAdminPhoto] = useState("");
  const [adminMarks, setAdminMarks] = useState<{ [subject: string]: number | "" }>({});
  const [subjectConfigChangeCounter, setSubjectConfigChangeCounter] = useState(0);
  const [subjectKeysMap, setSubjectKeysMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const subjects = getClassSubjects(adminSclass);
    setSubjectKeysMap(prev => {
      const next = { ...prev };
      let changed = false;
      subjects.forEach(sub => {
        if (!next[sub]) {
          next[sub] = "key_" + Math.random().toString(36).substring(2, 9);
          changed = true;
        }
      });
      // Clean up old subject keys to avoid ghosting keys
      Object.keys(next).forEach(k => {
        if (!subjects.includes(k)) {
          delete next[k];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [adminSclass, subjectConfigChangeCounter]);

  const [customClasses, setCustomClasses] = useState<string[]>(() => {
    return schoolConfig.classes && schoolConfig.classes.length > 0
      ? schoolConfig.classes
      : getSchoolClasses();
  });
  
  useEffect(() => {
    if (schoolConfig.classes && schoolConfig.classes.length > 0) {
      setCustomClasses(schoolConfig.classes);
    }
  }, [schoolConfig.classes]);

  const [customSessions, setCustomSessions] = useState<string[]>(() => {
    return schoolConfig.sessions && schoolConfig.sessions.length > 0 
      ? schoolConfig.sessions 
      : getSchoolSessions();
  });

  useEffect(() => {
    if (schoolConfig.sessions && schoolConfig.sessions.length > 0) {
      setCustomSessions(schoolConfig.sessions);
    }
  }, [schoolConfig.sessions]);

  const [addSessionInput, setAddSessionInput] = useState("");
  const [editingSessionOldName, setEditingSessionOldName] = useState<string | null>(null);
  const [editingSessionNewName, setEditingSessionNewName] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const createSchoolSession = (sessionName: string) => {
    if (!sessionName.trim()) {
      alert("Session name cannot be empty!");
      return;
    }
    const normalized = sessionName.trim().toUpperCase();
    if (customSessions.includes(normalized)) {
      alert(`A session named "${normalized}" already exists!`);
      return;
    }

    const updatedSessions = [...customSessions, normalized];
    setCustomSessions(updatedSessions);
    setSchoolConfig(prev => ({ ...prev, sessions: updatedSessions }));
    localStorage.setItem("school_sessions_list", JSON.stringify(updatedSessions));
    setAddSessionInput("");
    alert(`Academic Session "${normalized}" has been successfully added to the system!`);
  };

  const deleteSchoolSession = (sessionName: string) => {
    if (customSessions.length <= 1) {
      alert("At least one academic session must exist in the system!");
      return;
    }

    const updatedSessions = customSessions.filter(sess => sess !== sessionName);
    setCustomSessions(updatedSessions);
    setSchoolConfig(prev => ({ ...prev, sessions: updatedSessions }));
    localStorage.setItem("school_sessions_list", JSON.stringify(updatedSessions));

    alert(`Academic Session "${sessionName}" has been removed from the dropdown list. Existing students and results for this year are preserved.`);
  };

  const renameSchoolSession = (oldName: string, newName: string) => {
    if (!newName.trim()) {
      alert("New session name cannot be empty!");
      return;
    }
    const normalizedNewName = newName.trim().toUpperCase();
    if (oldName === normalizedNewName) return;

    if (customSessions.includes(normalizedNewName)) {
      alert(`A session named "${normalizedNewName}" already exists!`);
      return;
    }

    const updatedSessions = customSessions.map(sess => sess === oldName ? normalizedNewName : sess);
    setCustomSessions(updatedSessions);
    setSchoolConfig(prev => ({ ...prev, sessions: updatedSessions }));
    localStorage.setItem("school_sessions_list", JSON.stringify(updatedSessions));

    setStudents(prev => prev.map(stud => {
      if (stud.session === oldName) {
        return { ...stud, session: normalizedNewName };
      }
      return stud;
    }));

    setResults(prev => prev.map(res => {
      if (res.session === oldName) {
        return { ...res, session: normalizedNewName };
      }
      return res;
    }));

    setAdmissions(prev => prev.map(adm => {
      if (adm.academicYear === oldName) {
        return { ...adm, academicYear: normalizedNewName };
      }
      return adm;
    }));

    setEditingSessionOldName(null);
    alert(`Academic Session "${oldName}" successfully modified to "${normalizedNewName}" across all systems!`);
  };
  const [selectedConfigClass, setSelectedConfigClass] = useState<ClassName>(() => (getSchoolClasses()[0] || 'EDADIA') as ClassName);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [addClassInput, setAddClassInput] = useState("");
  const [editingClassOldName, setEditingClassOldName] = useState<string | null>(null);
  const [editingClassNewName, setEditingClassNewName] = useState("");
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  const renameSchoolClass = (oldName: string, newName: string) => {
    if (!newName.trim()) {
      alert("New class name cannot be empty!");
      return;
    }
    const normalizedNewName = newName.trim().toUpperCase();
    if (oldName === normalizedNewName) return;
    
    if (customClasses.includes(normalizedNewName)) {
      alert(`A class named "${normalizedNewName}" already exists!`);
      return;
    }

    // 1. Update the classes array
    const updatedClasses = customClasses.map(cls => cls === oldName ? normalizedNewName : cls);
    setCustomClasses(updatedClasses);
    setSchoolConfig(prev => ({ ...prev, classes: updatedClasses }));
    localStorage.setItem("school_classes_list", JSON.stringify(updatedClasses));

    // 2. Update the subjects mapping in local storage
    const storedSubs = localStorage.getItem("madarsa_class_subjects");
    let parsedSubs: Record<string, string[]> = {};
    if (storedSubs) {
      try { parsedSubs = JSON.parse(storedSubs); } catch (e) { console.error(e); }
    }
    if (parsedSubs[oldName]) {
      parsedSubs[normalizedNewName] = parsedSubs[oldName];
      delete parsedSubs[oldName];
    } else {
      parsedSubs[normalizedNewName] = [...(DEFAULT_CLASS_SUBJECTS[oldName] || DEFAULT_CLASS_SUBJECTS['EDADIA'] || [])];
    }
    localStorage.setItem("madarsa_class_subjects", JSON.stringify(parsedSubs));

    // 3. Update all students' className
    setStudents(prev => prev.map(stud => {
      if (String(stud.className).toUpperCase() === oldName.toUpperCase()) {
        return { ...stud, className: normalizedNewName as any };
      }
      return stud;
    }));

    // 4. Update all results' className
    setResults(prev => prev.map(res => {
      if (String(res.className).toUpperCase() === oldName.toUpperCase()) {
        return { ...res, className: normalizedNewName as any };
      }
      return res;
    }));

    // 5. Update all admission applications' className
    setAdmissions(prev => prev.map(adm => {
      if (String(adm.className).toUpperCase() === oldName.toUpperCase()) {
        return { ...adm, className: normalizedNewName as any };
      }
      return adm;
    }));

    if (selectedConfigClass === oldName) {
      setSelectedConfigClass(normalizedNewName as any);
    }
    
    setEditingClassOldName(null);
    setSubjectConfigChangeCounter(prev => prev + 1);
    alert(`Class "${oldName}" successfully renamed to "${normalizedNewName}" and updated across all student profiles, report cards, and admissions!`);
  };

  const deleteSchoolClass = (className: string) => {
    if (customClasses.length <= 1) {
      alert("At least one class must exist in the system!");
      return;
    }

    // 1. Update the classes array
    const updatedClasses = customClasses.filter(cls => cls !== className);
    setCustomClasses(updatedClasses);
    setSchoolConfig(prev => ({ ...prev, classes: updatedClasses }));
    localStorage.setItem("school_classes_list", JSON.stringify(updatedClasses));

    // 2. Update subjects mapping 
    const storedSubs = localStorage.getItem("madarsa_class_subjects");
    let parsedSubs: Record<string, string[]> = {};
    if (storedSubs) {
      try { parsedSubs = JSON.parse(storedSubs); } catch (e) { console.error(e); }
    }
    delete parsedSubs[className];
    localStorage.setItem("madarsa_class_subjects", JSON.stringify(parsedSubs));

    // 3. Handle orphaned records by moving them to a fallback class
    const fallbackClass = updatedClasses[0] || 'EDADIA';
    setStudents(prev => prev.map(stud => {
      if (String(stud.className).toUpperCase() === className.toUpperCase()) {
        return { ...stud, className: fallbackClass as any };
      }
      return stud;
    }));

    setResults(prev => prev.map(res => {
      if (String(res.className).toUpperCase() === className.toUpperCase()) {
        return { ...res, className: fallbackClass as any };
      }
      return res;
    }));

    setAdmissions(prev => prev.map(adm => {
      if (String(adm.className).toUpperCase() === className.toUpperCase()) {
        return { ...adm, className: fallbackClass as any };
      }
      return adm;
    }));

    if (selectedConfigClass === className) {
      setSelectedConfigClass(fallbackClass as any);
    }

    setSubjectConfigChangeCounter(prev => prev + 1);
    alert(`Class "${className}" has been deleted and any connected student records moved to fallback class "${fallbackClass}".`);
  };

  const createSchoolClass = (className: string) => {
    if (!className.trim()) {
      alert("Class name cannot be empty!");
      return;
    }
    const normalized = className.trim().toUpperCase();
    if (customClasses.includes(normalized)) {
      alert(`A class named "${normalized}" already exists!`);
      return;
    }

    // 1. Update array
    const updatedClasses = [...customClasses, normalized];
    setCustomClasses(updatedClasses);
    setSchoolConfig(prev => ({ ...prev, classes: updatedClasses }));
    localStorage.setItem("school_classes_list", JSON.stringify(updatedClasses));

    // 2. Setup subjects mapping
    const storedSubs = localStorage.getItem("madarsa_class_subjects");
    let parsedSubs: Record<string, string[]> = {};
    if (storedSubs) {
      try { parsedSubs = JSON.parse(storedSubs); } catch (e) { console.error(e); }
    }
    parsedSubs[normalized] = ["Quran", "Hifz", "Deeniyat", "Urdu", "English", "Hindi", "Science", "Social Science", "Math", "Dua & Kalma"];
    localStorage.setItem("madarsa_class_subjects", JSON.stringify(parsedSubs));

    setAddClassInput("");
    setSelectedConfigClass(normalized as any);
    setSubjectConfigChangeCounter(prev => prev + 1);
    alert(`Class "${normalized}" added successfully with 10 standard default subjects!`);
  };

  const [adminPriceList, setAdminPriceList] = useState<string>(""); // temporary
  const [newInlineSubjectName, setNewInlineSubjectName] = useState("");
  const [selectedRolls, setSelectedRolls] = useState<string[]>([]);
  const [bulkPrintResults, setBulkPrintResults] = useState<Result[]>([]);
  const [adminSchoolLogo, setAdminSchoolLogo] = useState("");
  const [adminUrduLogo, setAdminUrduLogo] = useState("");

  useEffect(() => {
    if (schoolConfig?.marksheetLogo) {
      setAdminSchoolLogo(schoolConfig.marksheetLogo);
    } else {
      const sLogo = localStorage.getItem("m_logo");
      if (sLogo) setAdminSchoolLogo(sLogo);
    }

    if (schoolConfig?.calligraphyBanner) {
      setAdminUrduLogo(schoolConfig.calligraphyBanner);
    } else {
      const uLogo = localStorage.getItem("m_urdu_logo");
      if (uLogo) setAdminUrduLogo(uLogo);
    }
  }, [schoolConfig]);

  // Handle Principal Login Attempt
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'principal123') {
      setIsLoggedIn(true);
      localStorage.setItem('nu_islogged', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid Username or Password. Please try again.');
    }
  };

  // Student CRUD functions
  const handleOpenAddStudentModal = () => {
    // Find next available roll number starting from 1
    const intRolls = students
      .map(s => parseInt(s.rollNo, 10))
      .filter(n => !isNaN(n) && n >= 1);
    const nextRoll = intRolls.length > 0 ? Math.max(...intRolls) + 1 : 1;

    setNewStudent({
      rollNo: nextRoll.toString(),
      name: '',
      fatherName: '',
      className: studentClassFilter === 'ALL' ? 'EDADIA' : studentClassFilter,
      session: studentYearFilter,
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
      dateOfBirth: '2011-01-01',
      contactNo: ''
    });
    setShowAddStudentModal(true);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.rollNo || !newStudent.name) {
      alert("Roll Number and Name are mandatory.");
      return;
    }

    // Check duplicate roll number
    const duplicate = students.find(s => s.rollNo.toString().trim() === newStudent.rollNo.toString().trim());
    if (duplicate) {
      alert(`Roll Number "${newStudent.rollNo}" already exists for student "${duplicate.name}"! Please use a unique roll number.`);
      return;
    }

    const created: Student = {
      id: "s_" + Date.now(),
      ...newStudent,
      session: normalizeSession(newStudent.session || studentYearFilter)
    };
    setStudents(prev => [...prev, created]);
    setShowAddStudentModal(false);
    // Reset inputs
    setNewStudent({
      rollNo: '',
      name: '',
      fatherName: '',
      className: studentClassFilter === 'ALL' ? 'EDADIA' : studentClassFilter,
      session: studentYearFilter,
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
      dateOfBirth: '2011-01-01',
      contactNo: ''
    });
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm("Are you sure you want to remove this student?")) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleEditStudentClick = (student: Student) => {
    setEditStudent({ ...student });
    setShowEditStudentModal(true);
  };

  const handleUpdateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    if (!editStudent.rollNo || !editStudent.name) {
      alert("Roll Number and Name are mandatory.");
      return;
    }

    // Check duplicate roll number, excluding current student
    const duplicate = students.find(s => s.id !== editStudent.id && s.rollNo.toString().trim() === editStudent.rollNo.toString().trim());
    if (duplicate) {
      alert(`Roll Number "${editStudent.rollNo}" is already in use by student "${duplicate.name}"! Please use a unique roll number.`);
      return;
    }

    setStudents(prev => prev.map(s => s.id === editStudent.id ? editStudent : s));
    setShowEditStudentModal(false);
    setEditStudent(null);
  };

  // Result CRUD functions With Auto Grade Computation
  const getAdminTotalMarks = () => {
    return getClassSubjects(adminSclass).reduce((sum, sub) => {
      const val = adminMarks[sub] !== undefined ? adminMarks[sub] : 75;
      return sum + (Number(val) || 0);
    }, 0);
  };

  const handleClearAll = () => {
    if (confirm("Reset current form values?")) {
      setAdminRollno("");
      setAdminSname("");
      setAdminFname("");
      setAdminMname("");
      setAdminDob("12-04-2011");
      setAdminDivision("");
      setAdminPhoto("");
      
      const resetMarks: { [subject: string]: number } = {};
      getClassSubjects(adminSclass).forEach(sub => {
        resetMarks[sub] = 90;
      });
      setAdminMarks(resetMarks);
    }
  };

  const handleSaveAndRank = () => {
    if (!adminRollno.trim() || !adminSname.trim()) {
      alert("Roll No and Student Name are required to save!");
      return;
    }

    const subsList = getClassSubjects(adminSclass);
    const numSubs = subsList.length;
    const totalObtained = getAdminTotalMarks();
    const percentage = numSubs > 0 ? (totalObtained / numSubs) : 0;
    const isPassed = percentage >= 23;
    const computedDivision = adminDivision || "";

    let parsedPassingYear = 2026;
    if (adminSession && adminSession.includes("-")) {
      const parts = adminSession.split("-");
      const secondPart = parseInt(parts[1], 10);
      if (!isNaN(secondPart)) {
        parsedPassingYear = secondPart;
      }
    }

    const cleanedMarks: Record<string, number> = {};
    subsList.forEach(sub => {
      const val = adminMarks[sub] !== undefined ? adminMarks[sub] : 75;
      cleanedMarks[sub] = Number(val) || 0;
    });

    const newResultRecord: Result = {
      id: "r_" + Date.now(),
      rollNo: adminRollno.trim(),
      className: adminSclass,
      passingYear: parsedPassingYear,
      studentName: adminSname.trim(),
      fatherName: adminFname.trim(),
      motherName: adminMname.trim(),
      photoUrl: adminPhoto || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200", 
      session: adminSession,
      marks: cleanedMarks,
      totalMarks: numSubs * 100,
      percentage: percentage,
      isPassed: isPassed,
      address: adminAddress,
      regNo: adminRegNo,
      udise: adminUdise,
      division: computedDivision,
      examType: adminExamType
    };

    // Filter old matching roll number, class, session, and exam type record out to keep multiple different result types per student
    const updatedResults = results.filter(r => 
      !(r.rollNo.toString().trim() === adminRollno.toString().trim() && 
        r.className === adminSclass && 
        normalizeSession(r.session) === normalizeSession(adminSession) &&
        (r.examType || 'Annual').toLowerCase() === adminExamType.toLowerCase())
    );
    updatedResults.push(newResultRecord);

    // Sort by total obtained score descending to determine ranks
    updatedResults.sort((a,b) => {
      const totalA = Object.values(a.marks || {}).reduce((sum, v) => sum + (Number(v)||0), 0);
      const totalB = Object.values(b.marks || {}).reduce((sum, v) => sum + (Number(v)||0), 0);
      return totalB - totalA;
    });

    setResults(updatedResults);
    localStorage.setItem("madarsa_records", JSON.stringify(updatedResults));

    // Webhook Sync
    const whList = schoolConfig.googleSheetsWebhooks || [];
    const specific = whList.find(w => w.year === newResultRecord.session || w.year === String(newResultRecord.passingYear));
    const webhookUrl = specific?.url || schoolConfig.googleSheetsWebhookUrl || "https://script.google.com/macros/s/AKfycbzlXCkVwXgVQPqgAm3qbUsPZTrWAYeaZg_BLyj7ozCt3C7Ns1Y-teOFVcyA9esIqQA-tw/exec";
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(newResultRecord)
      }).catch(err => console.error("Webhook failed", err));
    }

    // Upsert Student profile
    const studentIdx = students.findIndex(s => s.rollNo.toString().trim() === adminRollno.toString().trim() && normalizeSession(s.session) === normalizeSession(adminSession));
    if (studentIdx === -1) {
      const newStudentProfile: Student = {
        id: "s_" + Date.now(),
        rollNo: adminRollno.trim(),
        name: adminSname.trim(),
        fatherName: adminFname.trim(),
        motherName: adminMname.trim(),
        address: adminAddress,
        className: adminSclass,
        session: adminSession,
        photoUrl: adminPhoto || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
        dateOfBirth: adminDob,
        contactNo: "+91 99999 88888"
      };
      setStudents(prev => [...prev, newStudentProfile]);
    } else {
      const updatedStudents = [...students];
      updatedStudents[studentIdx] = {
        ...updatedStudents[studentIdx],
        name: adminSname.trim(),
        fatherName: adminFname.trim(),
        motherName: adminMname.trim(),
        address: adminAddress,
        className: adminSclass,
        session: adminSession,
        photoUrl: adminPhoto || updatedStudents[studentIdx].photoUrl,
        dateOfBirth: adminDob
      };
      setStudents(updatedStudents);
    }

    alert(`Successfully saved record for Roll: ${adminRollno}!`);
  };

  const handleSaveAs = () => {
    // "Save As" logic is identical to SaveAndRank, because by changing the roll number or class, 
    // the system natively creates a new record instead of overwriting the previous one (since ID matching is based on roll no/class).
    // This explicit function satisfies the user's conceptual model.
    handleSaveAndRank();
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Smart session extraction from filename
    let fileSession: string | null = null;
    const sessionMatch1 = file.name.match(/(\d{4}-\d{4})/);
    if (sessionMatch1) {
      fileSession = sessionMatch1[1];
    } else {
      const sessionMatch2 = file.name.match(/(\d{4})-(\d{2})/);
      if (sessionMatch2) {
        fileSession = `${sessionMatch2[1]}-20${sessionMatch2[2]}`;
      } else {
        const yearMatch = file.name.match(/(\d{4})/);
        if (yearMatch) {
          const yr = Number(yearMatch[1]);
          if (yr >= 2000 && yr <= 2100) {
            fileSession = `${yr - 1}-${yr}`;
          }
        }
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          const formatted: Result[] = data.map((item: any) => {
            const mData = item.marks || {};
            const itemMarks: { [sub: string]: number } = {
              "Quran": Number(mData.Quran !== undefined ? mData.Quran : (item.marks?.[0] !== undefined ? item.marks[0] : 75)),
              "Hifz": Number(mData.Hifz !== undefined ? mData.Hifz : (item.marks?.[1] !== undefined ? item.marks[1] : 75)),
              "Deeniyat": Number(mData.Deeniyat !== undefined ? mData.Deeniyat : (item.marks?.[2] !== undefined ? item.marks[2] : 75)),
              "Urdu": Number(mData.Urdu !== undefined ? mData.Urdu : (item.marks?.[3] !== undefined ? item.marks[3] : 75)),
              "English": Number(mData.English !== undefined ? mData.English : (item.marks?.[4] !== undefined ? item.marks[4] : 75)),
              "Hindi": Number(mData.Hindi !== undefined ? mData.Hindi : (item.marks?.[5] !== undefined ? item.marks[5] : 75)),
              "Science": Number(mData.Science !== undefined ? mData.Science : (item.marks?.[6] !== undefined ? item.marks[6] : 75)),
              "Social Science": Number(mData["Social Science"] !== undefined ? mData["Social Science"] : (item.marks?.[7] !== undefined ? item.marks[7] : 75)),
              "Math": Number(mData.Math !== undefined ? mData.Math : (item.marks?.[8] !== undefined ? item.marks[8] : 75)),
              "Dua & Kalma": Number(mData["Dua & Kalma"] !== undefined ? mData["Dua & Kalma"] : (item.marks?.[9] !== undefined ? item.marks[9] : 75)),
            };

            const t = Object.values(itemMarks).reduce((sum, v) => sum + v, 0);
            const rawExam = String(item.examType || item.exam || selectedExamTypeTab).trim().toLowerCase();
            const examVal = rawExam.includes('half') ? 'Half-Yearly' : 'Annual';

            // Automatic Year/Session Assignment
            let itemSession = "";
            if (item.session) {
              itemSession = normalizeSession(item.session);
            } else if (fileSession) {
              itemSession = normalizeSession(fileSession);
            } else if (item.passingYear && Number(item.passingYear)) {
              const yr = Number(item.passingYear);
              itemSession = `${yr - 1}-${yr}`;
            } else {
              itemSession = normalizeSession(savedRecordsYearFilter);
            }

            let itemPassingYear = Number(item.passingYear);
            if (!itemPassingYear) {
              const matchedYr = itemSession.match(/-(\d{4})/);
              if (matchedYr) {
                itemPassingYear = Number(matchedYr[1]);
              } else {
                itemPassingYear = 2026;
              }
            }

            return {
              id: item.id || "r_" + Date.now() + Math.random(),
              rollNo: item.rollNo || item.roll || "2026101",
              className: normalizeClassName(item.className || item.sclass || "EDADIA"),
              passingYear: itemPassingYear,
              studentName: item.studentName || item.name || "Default Student",
              fatherName: item.fatherName || item.fname || "Default Father",
              photoUrl: item.photoUrl || item.photo || "",
              session: itemSession,
              marks: itemMarks,
              totalMarks: 1000,
              percentage: Number(t / 10),
              isPassed: t >= 230,
              motherName: item.motherName || item.mname || "",
              address: item.address || "",
              regNo: item.regNo || "",
              udise: item.udise || "",
              division: item.division || "",
              examType: examVal
            };
          });

          // Merge results
          const merged = [...results];
          formatted.forEach((newItem) => {
            const idx = merged.findIndex(r => 
              r.rollNo.toString().trim() === newItem.rollNo.toString().trim() &&
              r.className === newItem.className &&
              normalizeSession(r.session) === normalizeSession(newItem.session) &&
              (r.examType || 'Annual').toLowerCase() === newItem.examType.toLowerCase()
            );
            if (idx !== -1) {
              merged[idx] = newItem;
            } else {
              merged.push(newItem);
            }
          });

          setResults(merged);
          localStorage.setItem("madarsa_records", JSON.stringify(merged));

          // Also upsert matching Student Profiles to ensure they belong to the correct session as well
          const updatedStudents = [...students];
          formatted.forEach((newItem) => {
            const studentIdx = updatedStudents.findIndex(s => 
              s.rollNo.toString().trim() === newItem.rollNo.toString().trim() &&
              normalizeSession(s.session) === normalizeSession(newItem.session)
            );
            if (studentIdx === -1) {
              updatedStudents.push({
                id: "s_imp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
                rollNo: newItem.rollNo.toString().trim(),
                name: newItem.studentName.trim(),
                fatherName: newItem.fatherName.trim(),
                motherName: newItem.motherName.trim(),
                address: newItem.address.trim(),
                className: newItem.className,
                session: newItem.session,
                photoUrl: newItem.photoUrl || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
                dateOfBirth: "",
                contactNo: "+91 99999 88888"
              });
            } else {
              updatedStudents[studentIdx] = {
                ...updatedStudents[studentIdx],
                name: newItem.studentName.trim(),
                fatherName: newItem.fatherName.trim(),
                motherName: newItem.motherName.trim(),
                address: newItem.address.trim(),
                className: newItem.className,
                photoUrl: newItem.photoUrl || updatedStudents[studentIdx].photoUrl
              };
            }
          });
          setStudents(updatedStudents);
          
          if (formatted.length > 0) {
            const sample = formatted[0];
            setSavedRecordsYearFilter(normalizeSession(sample.session));
            setSelectedExamTypeTab(sample.examType === 'Half-Yearly' ? 'Half-Yearly' : 'Annual');
            setAdminResultClassFilter(sample.className);
          }
          alert(`Successfully imported and merged ${formatted.length} records! Filters automatically updated to match the imported data.`);
        } else {
          alert("Invalid backup file! Expected a list array.");
        }
      } catch (err) {
        alert("Error reading backup file!");
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadBackup = () => {
    const targetResults = results.filter(r => 
      (r.examType || 'Annual').toLowerCase() === selectedExamTypeTab.toLowerCase() &&
      normalizeSession(r.session) === normalizeSession(savedRecordsYearFilter)
    );
    if (targetResults.length === 0) {
      alert(`No records in ${selectedExamTypeTab} for session ${savedRecordsYearFilter} to back up!`);
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(targetResults, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `Madarsa_Backup_${selectedExamTypeTab}_${savedRecordsYearFilter}_${new Date().toISOString().slice(0,10)}.json`);
    dlAnchorElem.click();
  };

  const handleExportToExcel = () => {
    const targetResults = results.filter(r => 
      (r.examType || 'Annual').toLowerCase() === selectedExamTypeTab.toLowerCase() &&
      normalizeSession(r.session) === normalizeSession(savedRecordsYearFilter) &&
      (adminResultClassFilter === 'ALL' || r.className === adminResultClassFilter)
    );
    if (targetResults.length === 0) {
      alert("No matching records to export!");
      return;
    }
    const excelData = targetResults.map((r, index) => {
      const subs = getClassSubjects(r.className);
      const row: any = {
        "Roll No": r.rollNo,
        "Student Name": r.studentName,
        "Class": r.className,
        "Father": r.fatherName,
        "Mother": r.motherName || "",
        "D.O.B": r.dateOfBirth || "",
        "Address": r.address || "",
      };
      
      let tot = 0;
      subs.forEach(s => {
        const val = (r.marks && r.marks[s] !== undefined) ? Number(r.marks[s]) : 75;
        row[s] = val;
        tot += val;
      });

      const maxTot = subs.length * 100;
      const percentage = maxTot > 0 ? (tot / maxTot) * 100 : 0;

      row["Total"] = tot;
      row["Max Total"] = maxTot;
      row["Percentage"] = percentage.toFixed(2) + "%";
      row["Division"] = r.division || "";
      row["Status"] = percentage >= 23 ? "PASS" : "FAIL";
      row["Rank"] = index + 1;
      
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `Madarsa_Results_${selectedExamTypeTab}_${savedRecordsYearFilter}.xlsx`);
  };

  const handlePrintSelected = () => {
    if (selectedRolls.length === 0) {
      alert("Select at least one student via checkboxes first!");
      return;
    }
    const q = results.filter(r => selectedRolls.includes(r.rollNo.toString().trim()));
    setBulkPrintResults(q);
    alert(`Readying printing stack for ${q.length} student(s). Wait for browser window.`);
    setTimeout(() => {
      window.print();
      setBulkPrintResults([]);
    }, 500);
  };

  const handleEditRecord = (roll: string) => {
    const match = results.find(r => r.rollNo.toString().trim() === roll.toString().trim());
    if (match) {
      const normClass = normalizeClassName(match.className);
      setAdminRegNo(match.regNo || "G- 59313");
      setAdminUdise(match.udise || "4053");
      setAdminRollno(match.rollNo);
      setAdminSname(match.studentName);
      setAdminFname(match.fatherName);
      setAdminMname(match.motherName || "");
      setAdminDob(match.dateOfBirth || "12-04-2011");
      setAdminSclass(normClass);
      setAdminAddress(match.address || "VILLAGE & POST KARMA KHAN, DISTRICT SANT KABIR NAGAR, UTTAR PRADESH");
      setAdminDivision(match.division || "");
      const rawSess = match.session || getCurrentSession();
      setAdminSession(normalizeSession(rawSess));
      setAdminExamType(match.examType || "Annual");
      setAdminPhoto(match.photoUrl || "");

      const newMarks: { [sub: string]: number } = {};
      getClassSubjects(normClass).forEach((sub, i) => {
        let val = 75;
        if (match.marks && match.marks[sub] !== undefined) {
          val = Number(match.marks[sub]);
        } else if (match.marks) {
          // Fallback parsing
          const keys = Object.keys(match.marks);
          const values = Object.values(match.marks);
          const keyMatch = keys.find(k => k.toLowerCase().includes(sub.toLowerCase()) || sub.toLowerCase().includes(k.toLowerCase()));
          if (keyMatch !== undefined) val = Number(match.marks[keyMatch]);
          else if (i < values.length) val = Number(values[i]);
        }
        newMarks[sub] = val;
      });
      setAdminMarks(newMarks);

      window.scrollTo({ top: 150, behavior: 'smooth' });
    }
  };

  const handleDeleteRecord = (roll: string) => {
    if (confirm(`Do you really want to delete Roll No: ${roll}?`)) {
      setResults(prev => prev.filter(r => r.rollNo.toString().trim() !== roll.toString().trim()));
      // Update backup local storage too
      const backup = results.filter(r => r.rollNo.toString().trim() !== roll.toString().trim());
      localStorage.setItem("madarsa_records", JSON.stringify(backup));
    }
  };

  // Teacher CRUD
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Teacher = {
      id: "t_" + Date.now(),
      ...newTeacher
    };
    setTeachers(prev => {
      const updated = [...prev, created];
      return updated;
    });
    setShowAddTeacherModal(false);
    // Reset Add Form
    setNewTeacher({
      name: '',
      designation: '',
      qualification: '',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
      phone: '',
      email: ''
    });
  };

  const handleUpdateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setTeachers(prev => {
      const updated = prev.map(t => t.id === editingTeacher.id ? editingTeacher : t);
      return updated;
    });
    setEditingTeacher(null);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm("Remove this teacher from staff records?")) {
      setTeachers(prev => {
        const updated = prev.filter(t => t.id !== id);
        return updated;
      });
    }
  };

  // Admission Action Workflows (Approve adds direct to Student Profile)
  const handleApproveAdmission = (app: AdmissionApplication) => {
    // 1. generate unique roll format
    const activeTerm = "2026" + Math.floor(200 + Math.random() * 800);
    
    // 2. create active student record
    const converted: Student = {
      id: "s_" + Date.now(),
      rollNo: activeTerm,
      name: app.studentName,
      fatherName: app.fatherName,
      motherName: app.motherName || "",
      address: app.address || "",
      className: app.className,
      session: "2026-2027",
      photoUrl: app.studentPhoto || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
      dateOfBirth: app.dateOfBirth,
      contactNo: app.contactPhone
    };

    setStudents(prev => [...prev, converted]);

    // 3. update applicant status
    setAdmissions(prev => prev.map(item => item.id === app.id ? { ...item, status: 'approved' } : item));

    alert(`Application approved! Student registered. Formatted roll number allocated: ${activeTerm}`);
  };

  const handleRejectAdmission = (id: string) => {
    setAdmissions(prev => prev.map(item => item.id === id ? { ...item, status: 'rejected' } : item));
    alert("Application marked as rejected.");
  };

  // Website Config update
  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-amber-500 text-slate-900 px-6 py-3 rounded-xl shadow-2xl font-bold z-[9999]';
    toast.innerText = 'Compressing and saving data...';
    document.body.appendChild(toast);

    let updatedConfig = { ...schoolConfig };
    
    // Compress base64 strings if they exist to prevent Firebase 1MB limit issues
    const keysToCompress: (keyof SchoolConfig)[] = [
      'principalSignatureUrl', 'logoUrl', 'marksheetLogo', 'schoolStampUrl', 'calligraphyBanner',
      'principalPhotoUrl', 'heroBg1', 'heroBg2', 'heroBg3', 'fac1Img', 'fac2Img', 'fac3Img'
    ];
    
    for (const key of keysToCompress) {
      if (typeof updatedConfig[key] === 'string' && updatedConfig[key]!.startsWith('data:image')) {
        try {
          // @ts-ignore
          updatedConfig[key] = await compressBase64Image(updatedConfig[key]!, 600, 400, 0.6);
        } catch (err) {
          console.error("Failed to compress", key, err);
        }
      }
    }
    
    setSchoolConfig(updatedConfig);
    localStorage.setItem('nu_config', JSON.stringify(updatedConfig));
    localStorage.setItem('nu_config_lastModified', Date.now().toString());
    
    if (isLoggedIn) {
      syncToFirebase('schoolData', 'config', updatedConfig);
    }
    
    toast.className = 'fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl font-bold animate-bounce z-[9999]';
    toast.innerText = 'Website configuration saved successfully!';
    setTimeout(() => toast.remove(), 3000);
  };

  // Gallery Add
  const handleAddGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGallery.url) {
      alert("Please upload a photo file first!");
      return;
    }
    const newItem: GalleryItem = {
      id: "g_" + Date.now(),
      ...newGallery
    };
    setGallery(prev => [...prev, newItem]);
    setShowAddGalleryModal(false);
    setNewGallery({
      url: '',
      caption: '',
      category: 'Campus'
    });
  };

  const handleDeleteGallery = (id: string) => {
    setGallery(prev => prev.filter(g => g.id !== id));
  };

  // News Add
  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: NewsItem = {
      id: "n_" + Date.now(),
      date: new Date().toISOString().split('T')[0],
      ...newNews
    };
    setNews(prev => [newItem, ...prev]);
    setShowAddNewsModal(false);
  };

  const handleDeleteNews = (id: string) => {
    setNews(prev => prev.filter(n => n.id !== id));
  };


  if (!isLoggedIn) {
    /* Login Form Display */
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-white dark:bg-slate-800 border-2 border-emerald-500/20 shadow-2xl p-8 rounded-3xl space-y-6 relative overflow-hidden">
          {/* Top golden border ribbon */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-700"></div>

          <div className="text-center space-y-2">
            <span className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-150">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </span>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Admin Office Login</h3>
            <p className="text-xs text-slate-450 text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Principal and school administrators credentials authentication system.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Access ID</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Security Pass Token</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-mono"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-650 bg-red-50 p-2.5 rounded-lg border border-red-150 font-semibold">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-650 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Secure Auth
            </button>
          </form>


        </div>
      </div>
    );
  }

  /* Real ERP Dashboard Interface */
  return (
    <div className="space-y-8 py-4">
      {/* Upper Welcomer */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-6 md:p-8 border border-emerald-850 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase">
            👑 Staff ERP Registry
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight" style={{ textShadow: '0 0 15px rgba(52, 211, 153, 0.7), 0 0 5px rgba(255, 255, 255, 0.9)' }}>
            Principal Management Panel
          </h2>
          <p className="text-xs text-emerald-300/80 max-w-md">
            Manage student databases, publish results certificates, evaluate online admissions, and curate homepage parameters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsLoggedIn(false);
              localStorage.removeItem('nu_islogged');
            }}
            className="px-4 py-2 bg-red-650 hover:bg-red-750 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-colors"
          >
            Secured Sign Out
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Hand Navigation Panel */}
        <aside className={`p-4 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/80 rounded-2xl space-y-2 text-sm shadow transition-all duration-300 flex-shrink-0 ${isSidebarCollapsed ? 'w-full lg:w-20' : 'w-full lg:w-72'}`}>
          <div className="flex items-center justify-between mb-2">
            {!isSidebarCollapsed && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block px-3 py-1">Systems Menu</span>}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer lg:block hidden ml-auto text-slate-500">
              <Menu className="w-5 h-5" />
            </button>
            {/* For mobile, always show toggle button */}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer lg:hidden ml-auto text-slate-500">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => setErpTab('analytics')}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl font-bold flex items-center gap-3 transition-all cursor-pointer ${
              erpTab === 'analytics'
                ? 'bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-700 dark:text-amber-400 shadow-inner'
                : 'text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
            } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
            title="Counter Analytics"
          >
            <span className="text-xl">📊</span>
            {!isSidebarCollapsed && <span>Counter Analytics</span>}
          </button>

          <button
            onClick={() => setErpTab('students')}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl font-bold flex items-center gap-3 transition-all cursor-pointer ${
              erpTab === 'students'
                ? 'bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-700 dark:text-amber-400 shadow-inner'
                : 'text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
            } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
            title="Students Database"
          >
            <span className="text-xl">🎓</span>
            {!isSidebarCollapsed && <span>Students Database</span>}
          </button>

          <button
            onClick={() => setErpTab('results')}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl font-bold flex items-center gap-3 transition-all cursor-pointer ${
              erpTab === 'results'
                ? 'bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-700 dark:text-amber-400 shadow-inner'
                : 'text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
            } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
            title="Marksheets & results"
          >
            <span className="text-xl">🏆</span>
            {!isSidebarCollapsed && <span>Marksheets & results</span>}
          </button>

          <button
            onClick={() => setErpTab('admissions')}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl font-bold flex items-center gap-3 transition-all cursor-pointer relative ${
              erpTab === 'admissions'
                ? 'bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-700 dark:text-amber-400 shadow-inner'
                : 'text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
            } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
            title="Admission Inbox"
          >
            <span className="text-xl relative">
              📑
              {isSidebarCollapsed && admissions.filter(a => a.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse border border-white dark:border-slate-800"></span>
              )}
            </span>
            {!isSidebarCollapsed && <span>Admission Inbox</span>}
            {!isSidebarCollapsed && admissions.filter(a => a.status === 'pending').length > 0 && (
              <span className="absolute right-3 top-2.5 px-2 py-0.5 bg-amber-500 text-white rounded-full text-[9px] font-black animate-pulse">
                {admissions.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setErpTab('admission_setup')}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl font-bold flex items-center gap-3 transition-all cursor-pointer ${
              erpTab === 'admission_setup'
                ? 'bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-700 dark:text-amber-400 shadow-inner'
                : 'text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
            } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
            title="Admission Portal Setup"
          >
            <span className="text-xl">⚙️</span>
            {!isSidebarCollapsed && <span>Admission Settings</span>}
          </button>

          <button
            onClick={() => setErpTab('news')}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl font-bold flex items-center gap-3 transition-all cursor-pointer ${
              erpTab === 'news'
                ? 'bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-700 dark:text-amber-400 shadow-inner'
                : 'text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
            } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
            title="News & Notices"
          >
            <span className="text-xl">🔔</span>
            {!isSidebarCollapsed && <span>News & Notices</span>}
          </button>

          <button
            onClick={() => setErpTab('config')}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl font-bold flex items-center gap-3 transition-all cursor-pointer ${
              erpTab === 'config'
                ? 'bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-700 dark:text-amber-400 shadow-inner'
                : 'text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
            } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
            title="Systems Config"
          >
            <span className="text-xl">⚙️</span>
            {!isSidebarCollapsed && <span>Systems Config</span>}
          </button>

          <button
            onClick={() => setErpTab('duas-mgmt')}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl font-bold flex items-center gap-3 transition-all cursor-pointer ${
              erpTab === 'duas-mgmt'
                ? 'bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-700 dark:text-amber-400 shadow-inner'
                : 'text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
            } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
            title="दुआ मैनेजमेंट (Manage Duas)"
          >
            <span className="text-xl">🕌</span>
            {!isSidebarCollapsed && <span className="truncate">दुआ मैनेजमेंट (Manage Duas)</span>}
          </button>

          <button
            onClick={() => setErpTab('dua-students')}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl font-bold flex items-center gap-3 transition-all cursor-pointer ${
              erpTab === 'dua-students'
                ? 'bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-700 dark:text-amber-400 shadow-inner'
                : 'text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
            } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
            title="पंजीकृत छात्र (Registered Kids)"
          >
            <span className="text-xl">📖</span>
            {!isSidebarCollapsed && <span className="truncate">पंजीकृत छात्र (Registered Kids)</span>}
          </button>
        </aside>

        {/* Right Hand Work Panel */}
        <main className="flex-1 min-w-0 p-6 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/85 rounded-2xl shadow-xl min-h-[400px]">
          {/* ANALYTICS PANEL */}
          {erpTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-750 flex items-center gap-2">
                <span>📈</span> Institution COUNTER Metrics
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from- emerald-50 to-white dark:from-slate-750 dark:to-slate-800 border border-emerald-100 dark:border-slate-700 rounded-xl text-center space-y-1 shadow-sm">
                  <span className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg inline-block text-xs">🎓</span>
                  <p className="text-xs text-slate-400 font-semibold block">Total Students</p>
                  <strong className="text-2xl font-mono text-slate-850 dark:text-white block">{students.length}</strong>
                </div>

                <div className="p-4 bg-gradient-to-br from-amber-50 to-white dark:from-slate-750 dark:to-slate-800 border border-amber-100 dark:border-slate-700 rounded-xl text-center space-y-1 shadow-sm">
                  <span className="p-2 bg-amber-100 dark:bg-emerald-950/50 text-amber-700 dark:text-amber-400 rounded-lg inline-block text-xs">💼</span>
                  <p className="text-xs text-slate-400 font-semibold block">Academic Faculty</p>
                  <strong className="text-2xl font-mono text-slate-850 dark:text-white block">{teachers.length}</strong>
                </div>

                <div className="p-4 bg-gradient-to-br from-emerald-50 to-white dark:from-slate-750 dark:to-slate-800 border border-emerald-100 dark:border-slate-700 rounded-xl text-center space-y-1 shadow-sm">
                  <span className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg inline-block text-xs">📖</span>
                  <p className="text-xs text-slate-400 font-semibold block">Curriculum Courses</p>
                  <strong className="text-2xl font-mono text-slate-850 dark:text-white block">5 Streams</strong>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-50 to-white dark:from-slate-750 dark:to-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl text-center space-y-1 shadow-sm">
                  <span className="p-2 bg-blue-100 dark:bg-emerald-950/50 text-blue-700 dark:text-blue-400 rounded-lg inline-block text-xs">🏆</span>
                  <p className="text-xs text-slate-400 font-semibold block">Published Results</p>
                  <strong className="text-2xl font-mono text-slate-850 dark:text-white block">{results.length}</strong>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-white dark:from-slate-750 dark:to-slate-800 border border-purple-100 dark:border-slate-700 rounded-xl text-center space-y-1 shadow-sm">
                  <span className="p-2 bg-purple-100 dark:bg-emerald-950/50 text-purple-700 dark:text-purple-400 rounded-lg inline-block text-xs">📑</span>
                  <p className="text-xs text-slate-400 font-semibold block">Admissions Registered</p>
                  <strong className="text-2xl font-mono text-slate-850 dark:text-white block">{admissions.length}</strong>
                </div>

                <div className="p-4 bg-gradient-to-br from-pink-50 to-white dark:from-slate-750 dark:to-slate-800 border border-pink-100 dark:border-slate-700 rounded-xl text-center space-y-1 shadow-sm">
                  <span className="p-2 bg-pink-100 dark:bg-emerald-950/50 text-pink-700 dark:text-pink-400 rounded-lg inline-block text-xs">🛎️</span>
                  <p className="text-xs text-slate-400 font-semibold block">Notice Bulletin</p>
                  <strong className="text-2xl font-mono text-slate-850 dark:text-white block">{news.length}</strong>
                </div>
              </div>

              {/* Quick instructions guide */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Live Interconnected ERP States:</span>
                <p className="text-slate-550 leading-relaxed text-slate-600 dark:text-slate-400">
                  Any addition, deletion, or modification of results, students, or admissions will store directly to your browser's persistent session storage structure. When a student files an online admission form on the front page, the total count will escalate here instantly under your <strong>Admissions inbox</strong>.
                </p>
              </div>
            </div>
          )}

          {/* STUDENTS MANAGEMENT */}
          {erpTab === 'students' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-750">
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" /> Active Student Database
                </h3>
                <button
                  onClick={handleOpenAddStudentModal}
                  className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Add Student (छात्र जोड़ें)
                </button>
              </div>

              {/* 📅 YEAR & CLASS FILTERS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-50/50 dark:bg-slate-900/45 p-4 rounded-2xl border border-emerald-150 dark:border-slate-700/60 shadow-inner">
                {/* Academic Session */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#1e5631] dark:text-[#a4be7b] tracking-wider block">Academic Session (सत्र चुनें)</span>
                  <select
                    value={studentYearFilter}
                    onChange={(e) => setStudentYearFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-650 dark:border-slate-700 rounded-xl text-xs text-[#1e5631] dark:text-emerald-450 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {customSessions.slice().reverse().map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Class stream filter */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#1e5631] dark:text-[#a4be7b] tracking-wider block">Class stream (कक्षा चुनें)</span>
                  <select
                    value={studentClassFilter}
                    onChange={(e) => setStudentClassFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-650 dark:border-slate-700 rounded-xl text-xs text-[#1e5631] dark:text-emerald-450 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ALL">ALL CLASSES (सभी कक्षाएं)</option>
                    {customClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                {/* Search field */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#1e5631] dark:text-[#a4be7b] tracking-wider block">Search Query (खोजें)</span>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Name or Roll No..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 py-2 bg-white dark:bg-slate-800 border border-emerald-650 dark:border-slate-700 rounded-xl text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal form placeholder */}
              {showAddStudentModal && (
                <form onSubmit={handleAddStudent} className="p-4 bg-emerald-50/20 dark:bg-slate-900/30 border border-emerald-150 dark:border-slate-700 rounded-xl space-y-3.5 text-xs">
                  <h4 className="font-bold text-emerald-800 dark:text-amber-400">Record New Candidate profile (नया छात्र पंजीकृत करें)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Roll Number *</label>
                      <input
                        type="text" required placeholder="Allocated Roll No (e.g. 2026101)"
                        value={newStudent.rollNo} onChange={e => setNewStudent({ ...newStudent, rollNo: e.target.value.replace(/\D/g, '') })}
                        className="w-full p-2 border border-slate-200 dark:border-slate-750 rounded-lg dark:bg-slate-800 text-slate-850 dark:text-white font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Student Name *</label>
                      <input
                        type="text" required placeholder="Student Full Name"
                        value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                        className="w-full p-2 border border-slate-200 dark:border-slate-750 rounded-lg dark:bg-slate-800 text-slate-850 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Father / Guardian Name (पिता / अभिभावक का नाम) *</label>
                      <input
                        type="text" required placeholder="Father / Guardian Full Name"
                        value={newStudent.fatherName} onChange={e => setNewStudent({ ...newStudent, fatherName: e.target.value })}
                        className="w-full p-2 border border-slate-200 dark:border-slate-750 rounded-lg dark:bg-slate-800 text-slate-850 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Class *</label>
                      <select
                        value={newStudent.className} onChange={e => setNewStudent({ ...newStudent, className: e.target.value as ClassName })}
                        className="w-full p-2 border border-slate-200 dark:border-slate-750 rounded-lg dark:bg-slate-800 text-slate-850 dark:text-white"
                      >
                        {customClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Academic Year (सत्र) *</label>
                      <select
                        value={newStudent.session} onChange={e => setNewStudent({ ...newStudent, session: e.target.value })}
                        className="w-full p-2 border border-slate-200 dark:border-slate-750 rounded-lg dark:bg-slate-800 text-slate-850 dark:text-white"
                      >
                        {customSessions.slice().reverse().map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Phone / Contact No</label>
                      <input
                        type="text" placeholder="Contact No"
                        value={newStudent.contactNo} onChange={e => setNewStudent({ ...newStudent, contactNo: e.target.value })}
                        className="w-full p-2 border border-slate-200 dark:border-slate-750 rounded-lg dark:bg-slate-800 text-slate-850 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowAddStudentModal(false)} className="px-3 py-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">Cancel</button>
                    <button type="submit" className="px-3 py-1.5 bg-emerald-650 text-white rounded-lg font-bold">Register Student</button>
                  </div>
                </form>
              )}

              {/* Student records table list */}
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Roll ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Class stream</th>
                      <th className="p-3">Session</th>
                      <th className="p-3">Father / Guardian Name (पिता/अभिभावक)</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {(() => {
                      const list = students.filter(s => {
                        const matchesYear = normalizeSession(s.session || getCurrentSession()) === normalizeSession(studentYearFilter);
                        const matchesClass = studentClassFilter === 'ALL' || s.className === studentClassFilter;
                        const matchesSearch = !studentSearch.trim() || 
                          s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          s.rollNo.toString().toLowerCase().includes(studentSearch.toLowerCase());
                        return matchesYear && matchesClass && matchesSearch;
                      });
                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                              No students found matching current filters for Session {studentYearFilter} and Class {studentClassFilter}.
                            </td>
                          </tr>
                        );
                      }
                      return list.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                          <td className="p-3 font-mono font-bold text-emerald-800 dark:text-amber-400">{s.rollNo}</td>
                          <td className="p-3 font-semibold text-slate-850 dark:text-slate-105 dark:text-white">{s.name}</td>
                          <td className="p-3 font-medium text-emerald-750 dark:text-emerald-450">{s.className}</td>
                          <td className="p-3 font-mono font-bold text-slate-500 dark:text-slate-400">{s.session}</td>
                          <td className="p-3 text-slate-550 dark:text-slate-400">{s.fatherName}</td>
                          <td className="p-3 font-mono text-slate-550 dark:text-slate-400">{s.contactNo || 'N/A'}</td>
                          <td className="p-3 text-right text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              <button
                                onClick={() => handleEditStudentClick(s)}
                                className="p-1 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-405 rounded-md transition-colors"
                                title="Edit Record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s.id)}
                                className="p-1 px-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-650 dark:text-red-450 rounded-md transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Edit Student Modal Overlay */}
          {showEditStudentModal && editStudent && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
              <div 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📝</span>
                    <div>
                      <h3 className="font-extrabold text-lg text-emerald-800 dark:text-amber-400">Edit Student Profile (छात्र विवरण बदलें)</h3>
                      <p className="text-[10px] text-slate-500">Modify information for Roll No: <span className="font-mono font-bold text-emerald-600">{editStudent.rollNo}</span></p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowEditStudentModal(false);
                      setEditStudent(null);
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateStudentSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 font-bold">Roll Number *</label>
                      <input
                        type="text" 
                        required 
                        placeholder="Allocated Roll No (e.g. 2026101)"
                        value={editStudent.rollNo} 
                        onChange={e => setEditStudent({ ...editStudent, rollNo: e.target.value.replace(/\D/g, '') })}
                        className="w-full p-2.5 border-2 border-emerald-600 dark:border-slate-700/60 rounded-xl bg-white dark:bg-slate-800 text-slate-850 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 font-bold">Student Name *</label>
                      <input
                        type="text" 
                        required 
                        placeholder="Student Full Name"
                        value={editStudent.name} 
                        onChange={e => setEditStudent({ ...editStudent, name: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700/60 rounded-xl bg-white dark:bg-slate-800 text-slate-850 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 font-bold">Father / Guardian Name (पिता / अभिभावक का नाम) *</label>
                      <input
                        type="text" 
                        required 
                        placeholder="Father / Guardian Full Name"
                        value={editStudent.fatherName} 
                        onChange={e => setEditStudent({ ...editStudent, fatherName: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700/60 rounded-xl bg-white dark:bg-slate-800 text-slate-850 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 font-bold">Class *</label>
                      <select
                        value={editStudent.className} 
                        onChange={e => setEditStudent({ ...editStudent, className: e.target.value as ClassName })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700/60 rounded-xl bg-white dark:bg-slate-800 text-slate-850 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {customClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 font-bold">Academic Session *</label>
                      <select
                        value={editStudent.session} 
                        onChange={e => setEditStudent({ ...editStudent, session: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700/60 rounded-xl bg-white dark:bg-slate-800 text-slate-850 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {customSessions.slice().reverse().map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 font-bold">Phone / Contact No</label>
                      <input
                        type="text" 
                        placeholder="Contact No"
                        value={editStudent.contactNo || ''} 
                        onChange={e => setEditStudent({ ...editStudent, contactNo: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700/60 rounded-xl bg-white dark:bg-slate-800 text-slate-850 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowEditStudentModal(false);
                        setEditStudent(null);
                      }} 
                      className="px-4 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition-colors"
                    >
                      Cancel (रद्द करें)
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl font-bold hover:shadow-md transition-all"
                    >
                      Save Changes (बदलाव सुरक्षित करें)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* RESULTS MANAGEMENT */}
          {erpTab === 'results' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-[#1e5631] text-white p-6 rounded-2xl shadow-md gap-4 no-print">
                <div>
                  <h3 className="font-extrabold text-2xl flex items-center gap-2">
                    <span>🕌</span> Madarsa Exam Ledger Controller
                  </h3>
                  <p className="text-xs text-emerald-100 mt-1 max-w-xl">
                    Fill student details, write marks directly inside the colored report card rows, upload logos/portraits, and manage results seamlessly.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearAll}
                    style={{ background: '#7f8c8d' }}
                    className="px-4 py-2 text-white font-bold text-xs rounded-lg shadow cursor-pointer uppercase tracking-wider"
                  >
                    🆕 New Form
                  </button>
                  <button
                    onClick={handleSaveAs}
                    style={{ background: '#f39c12' }}
                    className="px-5 py-2 text-white font-bold text-xs rounded-lg shadow cursor-pointer uppercase tracking-wider transition hover:scale-105"
                    title="Promote or duplicate student record to a new class/roll no without deleting previous record"
                  >
                    📑 Save As
                  </button>
                  <button
                    onClick={handleSaveAndRank}
                    style={{ background: '#27ae60' }}
                    className="px-5 py-2 text-white font-bold text-xs rounded-lg shadow cursor-pointer uppercase tracking-wider transition hover:scale-105"
                  >
                    💾 Save Record
                  </button>
                </div>
              </div>

              {/* Dedicated Logo and Banner uploader for result card / marksheet */}
              <div id="marksheet-logo-banner-uploader" className="bg-white dark:bg-slate-850 border border-emerald-150 dark:border-emerald-900/60 p-5 rounded-2xl shadow-sm no-print">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-750">
                  <span className="text-xl">🖼️</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-400">
                      मार्कशीट लोगो और उर्दू बैनर अपलोडर (Permanent Logo & Banner Settings)
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      यहाँ से आप रिज़ल्ट कार्ड का मुख्य गोल लोगो और उर्दू कैलीग्राफी बैनर अपलोड या चेंज कर सकते हैं। ये हमेशा के लिए सुरक्षित (Save) रहेंगे।
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Marksheet logo */}
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-150 dark:border-slate-800/80">
                    <label className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                      मार्कशीट का गोल लोगो (Crest/Stamp Logo - transparent .png only)
                    </label>
                    <div className="flex items-center gap-3">
                      {adminSchoolLogo ? (
                        <div className="p-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg">
                          <img
                            src={adminSchoolLogo}
                            alt="Crest Logo"
                            className="w-12 h-12 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 text-[9px] text-center leading-tight bg-white dark:bg-slate-950 font-bold">
                          Default Logo
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => document.getElementById('adminLogoUploadInput')?.click()}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-[10px] flex items-center gap-1 shadow-sm"
                        >
                          📤 Upload Logo File
                        </button>
                        {adminSchoolLogo && (
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.removeItem("m_logo");
                              setAdminSchoolLogo("");
                              const updatedConfig = { ...schoolConfig, marksheetLogo: "" };
                              setSchoolConfig(updatedConfig);
                              localStorage.setItem('nu_config', JSON.stringify(updatedConfig));
                              localStorage.setItem('nu_config_lastModified', Date.now().toString());
                              if (isLoggedIn) {
                                syncToFirebase('schoolData', 'config', updatedConfig);
                              }
                            }}
                            className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider hover:underline cursor-pointer text-left pl-1"
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="या डायरेक्ट इमेज लिंक (URL) डालें"
                        value={adminSchoolLogo}
                        onChange={(e) => {
                          const val = e.target.value;
                          localStorage.setItem("m_logo", val);
                          setAdminSchoolLogo(val);
                          const updatedConfig = { ...schoolConfig, marksheetLogo: val };
                          setSchoolConfig(updatedConfig);
                          localStorage.setItem('nu_config', JSON.stringify(updatedConfig));
                          localStorage.setItem('nu_config_lastModified', Date.now().toString());
                          if (isLoggedIn) {
                            syncToFirebase('schoolData', 'config', updatedConfig);
                          }
                        }}
                        className="w-full mt-1 p-2 border border-slate-250 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 font-semibold text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                  </div>

                  {/* Marksheet urdu banner */}
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-150 dark:border-slate-800/80">
                    <label className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                      मार्कशीट का उर्दू बड़ा बैनर (Calligraphy Banner - transparent .png only)
                    </label>
                    <div className="flex items-center gap-3">
                      {adminUrduLogo ? (
                        <div className="p-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg">
                          <img
                            src={adminUrduLogo}
                            alt="Urdu Calligraphy"
                            className="w-24 h-12 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-12 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 text-[9px] text-center leading-tight bg-white dark:bg-slate-950 font-bold">
                          Default Banner
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => document.getElementById('adminUrduUploadInput')?.click()}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-[10px] flex items-center gap-1 shadow-sm"
                        >
                          📤 Upload Banner File
                        </button>
                        {adminUrduLogo && (
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.removeItem("m_urdu_logo");
                              setAdminUrduLogo("");
                              const updatedConfig = { ...schoolConfig, calligraphyBanner: "" };
                              setSchoolConfig(updatedConfig);
                              localStorage.setItem('nu_config', JSON.stringify(updatedConfig));
                              localStorage.setItem('nu_config_lastModified', Date.now().toString());
                              if (isLoggedIn) {
                                syncToFirebase('schoolData', 'config', updatedConfig);
                              }
                            }}
                            className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider hover:underline cursor-pointer text-left pl-1"
                          >
                            Remove Banner
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="या डायरेक्ट इमेज लिंक (URL) डालें"
                        value={adminUrduLogo}
                        onChange={(e) => {
                          const val = e.target.value;
                          localStorage.setItem("m_urdu_logo", val);
                          setAdminUrduLogo(val);
                          const updatedConfig = { ...schoolConfig, calligraphyBanner: val };
                          setSchoolConfig(updatedConfig);
                          localStorage.setItem('nu_config', JSON.stringify(updatedConfig));
                          localStorage.setItem('nu_config_lastModified', Date.now().toString());
                          if (isLoggedIn) {
                            syncToFirebase('schoolData', 'config', updatedConfig);
                          }
                        }}
                        className="w-full mt-1 p-2 border border-slate-250 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 font-semibold text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE IN-PLACE CARD EDITOR */}
              <div className="overflow-x-auto py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-inner no-print">
                <p className="text-center text-xs font-bold font-mono text-slate-450 text-[#1e5631] mb-2 uppercase tracking-widest">
                  👇 Live Certificate Preview & Direct Entry Form 👇
                </p>

                <div
                  id="card"
                  className="bg-white text-black font-sans font-bold shadow-2xl relative select-none rounded-[16px]"
                  style={{
                    width: '900px',
                    maxWidth: '900px',
                    height: '1311px',
                    minHeight: '1311px',
                    maxHeight: '1311px',
                    margin: 'auto',
                    background: '#ffffff',
                    border: '5px solid #1e5631',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                  }}
                >
                               {/* Invisible Image File Selectors */}
                  <input
                    type="file"
                    id="adminLogoUploadInput"
                    accept="image/png"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== "image/png") {
                          alert("Please upload a transparent .png format logo only to avoid background errors!");
                        }
                        resizeImage(file, 1200, 1200, 0.95).then((url) => {
                          localStorage.setItem("m_logo", url);
                          setAdminSchoolLogo(url);
                          const updatedConfig = { ...schoolConfig, marksheetLogo: url };
                          setSchoolConfig(updatedConfig);
                          localStorage.setItem('nu_config', JSON.stringify(updatedConfig));
                          localStorage.setItem('nu_config_lastModified', Date.now().toString());
                          if (isLoggedIn) {
                            syncToFirebase('schoolData', 'config', updatedConfig);
                          }
                        }).catch(e => console.error("Compression failed", e));
                      }
                    }}
                  />
                  <input
                    type="file"
                    id="adminUrduUploadInput"
                    accept="image/png"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== "image/png") {
                          alert("Please upload a transparent .png format Urdu name logo only!");
                        }
                        resizeImage(file, 1600, 600, 0.95).then((url) => {
                          localStorage.setItem("m_urdu_logo", url);
                          setAdminUrduLogo(url);
                          const updatedConfig = { ...schoolConfig, calligraphyBanner: url };
                          setSchoolConfig(updatedConfig);
                          localStorage.setItem('nu_config', JSON.stringify(updatedConfig));
                          localStorage.setItem('nu_config_lastModified', Date.now().toString());
                          if (isLoggedIn) {
                            syncToFirebase('schoolData', 'config', updatedConfig);
                          }
                        }).catch(e => console.error("Compression failed", e));
                      }
                    }}
                  />
                  <input
                    type="file"
                    id="adminPhotoUpload"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setAdminPhoto(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />

                  {/* Header Curved ellipse ribbon */}
                  <div
                    id="topSpace"
                    style={{
                      position: 'relative',
                      height: '280px',
                      marginBottom: '30px',
                      background: 'linear-gradient(90deg, #fdfbf7, #fffdd0, #fdfbf7)',
                      margin: '-20px -20px 30px -20px',
                      padding: '15px',
                      borderRadius: '12px 12px 0 0',
                      clipPath: 'ellipse(110% 100% at 50% 0%)',
                      borderBottom: '2px solid #a5d6a7'
                    }}
                  >
                    {/* Left Reg No */}
                    <div className="absolute top-2.5 left-[22px] text-sm text-[#2e7d32] font-extrabold z-[15] flex gap-1 items-center">
                      Reg. No: 
                      <input 
                        value={adminRegNo} 
                        onChange={(e) => setAdminRegNo(e.target.value)}
                        placeholder="G- 59313"
                        style={{
                          border: 'none', 
                          background: 'transparent', 
                          width: '130px',
                          outline: 'none',
                          color: '#000000',
                          fontWeight: 900
                        }} 
                      />
                    </div>

                    {/* Right Rukniyat No */}
                    <div 
                      className="absolute top-2.5 right-[19px] text-[22px] font-extrabold z-[15] text-[#1b5e20] flex gap-1 items-center" 
                      style={{ direction: 'rtl', fontFamily: '"Urdu Typesetting", "Sakkal Majalla", serif' }}
                    >
                      رکنیت نمبر: 
                      <input 
                        value={adminUdise} 
                        onChange={(e) => setAdminUdise(e.target.value)}
                        placeholder="4053"
                        style={{
                          border: 'none', 
                          background: 'transparent', 
                          width: '130px', 
                          textAlign: 'right', 
                          color: '#1b5e20',
                          outline: 'none',
                          fontWeight: 900,
                          fontFamily: 'sans-serif'
                        }} 
                      />
                    </div>

                    {/* Left Stamp click Logo */}
                    <div 
                      id="logoContainer" 
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '40px',
                        width: '185px',
                        height: '185px',
                        zIndex: '10',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px dashed #a5d6a7'
                      }}
                    >
                      <div className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center p-2 text-center" onClick={() => document.getElementById('adminLogoUploadInput')?.click()} title="Click to Upload Custom Crest Logo">
                        {adminSchoolLogo ? (
                          <img src={adminSchoolLogo} alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'transparent' }} />
                        ) : (
                          <div className="w-[170px] h-[170px] rounded-full border-4 border-[#1e5631] border-dashed flex flex-col items-center justify-center p-2 bg-[#fffdd0]/40 text-center">
                            <span className="text-[28px]">🕌</span>
                            <span className="text-[10px] font-black leading-tight text-[#1e5631]">Click to Upload</span>
                            <span className="text-[9px] font-bold text-[#1e5631]">school_logo.png</span>
                            <span className="text-[8px] text-[#1e5631] opacity-75">(Transparent PNG Only)</span>
                          </div>
                        )}
                      </div>
                      
                      {adminSchoolLogo && (
                        <button
                          type="button"
                          title="Remove Magic Black Background from Logo"
                          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] px-2 py-1 rounded-full shadow z-20 font-bold flex items-center gap-1 w-max"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const cleanUrl = await removeBlackBackground(adminSchoolLogo);
                              localStorage.setItem("m_logo", cleanUrl);
                              setAdminSchoolLogo(cleanUrl);
                              const updatedConfig = { ...schoolConfig, marksheetLogo: cleanUrl };
                              setSchoolConfig(updatedConfig);
                              localStorage.setItem('nu_config', JSON.stringify(updatedConfig));
                              localStorage.setItem('nu_config_lastModified', Date.now().toString());
                              if (isLoggedIn) {
                                syncToFirebase('schoolData', 'config', updatedConfig);
                              }
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                        >
                          <Sparkles size={10} className="inline mr-1" /> Remove Black BG
                        </button>
                      )}
                    </div>

                    {/* Draggable Calligraphy titles banner */}
                    <div 
                      id="headerDraggable" 
                      style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '85%',
                        textAlign: 'center',
                        zIndex: '5',
                        top: '10px'
                      }}
                    >
                      <div className="relative">
                        <div 
                          onClick={() => document.getElementById('adminUrduUploadInput')?.click()}
                          title="Click to Upload Custom Urdu Banner"
                          style={{ cursor: 'pointer' }}
                        >
                          {adminUrduLogo ? (
                            <img 
                              id="urduLogoImg" 
                              src={adminUrduLogo} 
                              alt="Urdu Name calligraphy" 
                              style={{ maxWidth: '750px', height: '120px', objectFit: 'contain', margin: 'auto', backgroundColor: 'transparent' }} 
                            />
                          ) : (
                            <div style={{ height: '120px' }} className="flex flex-col items-center justify-center p-2 rounded bg-[#fffdd0]/30">
                              <span style={{ fontSize: '38px', color: '#1b5e20', fontFamily: 'Georgia, serif' }}>
                                مَدْرَسَة عَرَبِيَّة نُورُ الْعُلُومِ كَارْمَاخَانْ
                              </span>
                              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                                (Click to Upload Calligraphy Banner - Transparent PNG Only)
                              </span>
                            </div>
                          )}
                        </div>
                        {adminUrduLogo && (
                          <button
                            type="button"
                            title="Remove Magic Black Background from Banner"
                            className="absolute top-2 right-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] px-2 py-1 rounded-full shadow z-20 font-bold flex items-center gap-1 w-max"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const cleanUrl = await removeBlackBackground(adminUrduLogo);
                                localStorage.setItem("m_urdu_logo", cleanUrl);
                                setAdminUrduLogo(cleanUrl);
                                const updatedConfig = { ...schoolConfig, calligraphyBanner: cleanUrl };
                                setSchoolConfig(updatedConfig);
                                localStorage.setItem('nu_config', JSON.stringify(updatedConfig));
                                localStorage.setItem('nu_config_lastModified', Date.now().toString());
                                if (isLoggedIn) {
                                  syncToFirebase('schoolData', 'config', updatedConfig);
                                }
                              } catch (error) {
                                console.error(error);
                              }
                            }}
                          >
                            <Sparkles size={10} className="inline mr-1" /> Remove Black BG
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#0000FF', marginTop: '-5px' }}>
                        MADARSA ARABIA NOORUL ULOOM
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0000FF' }}>
                        Karma Khan, Distt: Sant Kabir Nagar (U.P.)
                      </div>
                      <div 
                        style={{
                          fontSize: '24px', 
                          marginTop: '8px', 
                          background: '#FFFDD0', 
                          color: '#000000', 
                          display: 'inline-block', 
                          padding: '4px 28px', 
                          borderRadius: '18px', 
                          border: '2px solid #1e5631',
                          fontWeight: 900
                        }}
                      >
                        <select
                          value={adminExamType}
                          onChange={(e) => setAdminExamType(e.target.value)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontWeight: 900,
                            color: '#000000',
                            marginRight: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Annual">Annual Examination</option>
                          <option value="Half-Yearly">Half-Yearly Examination</option>
                          <option value="Quarterly">Quarterly Examination</option>
                        </select>
                        - 
                        <select
                          value={adminSession}
                          onChange={(e) => setAdminSession(e.target.value)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontWeight: 900,
                            color: '#000000',
                            width: '135px',
                            marginLeft: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          {customSessions.slice().reverse().map(yr => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Right Portrait Photo space */}
                    <div 
                      id="photoBox" 
                      onClick={() => document.getElementById('adminPhotoUpload')?.click()}
                      title="Click to Upload Student Portrait Photo"
                      style={{
                        position: 'absolute',
                        top: '50px',
                        right: '15px',
                        width: '150px',
                        height: '170px',
                        border: '3px solid #2e7d32',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: '10',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                    >
                      {adminPhoto ? (
                        <img 
                          src={adminPhoto} 
                          alt="Student base64 data" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div className="text-center p-1">
                          <span style={{ color: '#2e7d32', fontSize: '12px', fontWeight: 'bold' }}>Click to Upload</span>
                          <span className="block text-[9px] text-[#2e7d32]/70 font-mono">Photo Box</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Student Details Fields - Beautifully Aligned Rows */}
                  {/* Row 1 */}
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '12px', alignItems: 'center', color: '#1e5631', width: '100%' }}>
                    <div style={{ flex: '1.5', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '17px', fontWeight: 800, width: '130px', display: 'inline-block' }}>Student Name:</span> 
                      <input 
                        value={adminSname}
                        onChange={(e) => setAdminSname(e.target.value)}
                        placeholder="E.g. Mohammad Ali"
                        style={{ fontSize: '17px', fontWeight: 900, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000' }}
                      />
                    </div>
                    <div style={{ flex: '1.5', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '17px', fontWeight: 800, width: '130px', display: 'inline-block' }}>Father Name:</span> 
                      <input 
                        value={adminFname}
                        onChange={(e) => setAdminFname(e.target.value)}
                        placeholder="E.g. Abdur Rahman"
                        style={{ fontSize: '17px', fontWeight: 900, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000' }}
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', color: '#1e5631', width: '100%' }}>
                    <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, width: '105px', display: 'inline-block' }}>Mother Name:</span> 
                      <input 
                        value={adminMname}
                        onChange={(e) => setAdminMname(e.target.value)}
                        placeholder="E.g. Fatima Khatoon"
                        style={{ fontSize: '16px', fontWeight: 900, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000' }}
                      />
                    </div>
                    <div style={{ width: '185px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <span style={{ fontSize: '15px', fontWeight: 800 }}>D.O.B:</span> 
                      <input 
                        value={adminDob}
                        onChange={(e) => setAdminDob(e.target.value)}
                        placeholder="DD-MM-YYYY"
                        style={{ fontSize: '16px', fontWeight: 900, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000' }}
                      />
                    </div>
                    <div style={{ width: '145px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <span style={{ fontSize: '15px', fontWeight: 800 }}>Class:</span> 
                      <select 
                        value={adminSclass}
                        onChange={(e) => {
                          const cls = e.target.value as ClassName;
                          setAdminSclass(cls);
                          const subjects = getClassSubjects(cls);
                          const newInitialMarks: { [sub: string]: number } = {};
                          subjects.forEach(sub => {
                            newInitialMarks[sub] = 75;
                          });
                          setAdminMarks(newInitialMarks);
                        }}
                        style={{ fontSize: '16px', fontWeight: 900, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000' }}
                      >
                        {customClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ width: '115px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, width: '55px', display: 'inline-block' }}>Roll No:</span> 
                      <input 
                        value={adminRollno}
                        onChange={(e) => setAdminRollno(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 2026101"
                        style={{ fontSize: '16px', fontWeight: 900, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000', textAlign: 'center' }}
                      />
                    </div>
                  </div>

                  {/* Address full width block underneath */}
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '14px', alignItems: 'center', color: '#1e5631', width: '100%' }}>
                    <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '17px', fontWeight: 800, width: '75px', display: 'inline-block' }}>Address:</span> 
                      <input 
                        value={adminAddress}
                        onChange={(e) => setAdminAddress(e.target.value)}
                        placeholder="Village & Post, District Sant Kabir Nagar"
                        style={{ fontSize: '15px', fontWeight: 950, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000' }}
                      />
                    </div>
                  </div>

                  {/* Rainbow Table with DIRECT EDITING ROWS FOR SUBJECTS! */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: 'white', border: '2px solid #1e5631' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900, width: '60px' }}>S.R.</th>
                        <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900 }}>Subject</th>
                        <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900, width: '100px' }}>Max</th>
                        <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900, width: '150px' }}>Marks Obtained</th>
                        <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900, width: '120px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getClassSubjects(adminSclass).map((sub, idx) => {
                        const mark = adminMarks[sub] !== undefined ? adminMarks[sub] : 75;
                        const color = [
                          "#fce4ec", // Pinkish
                          "#e8f5e9", // Greenish
                          "#e3f2fd", // Blueish
                          "#fff3e0", // Orangeish
                          "#f3e5f5", // Purplish
                          "#f1f8e9", // Light Lime
                          "#e0f2f1", // Tealish
                          "#fffde7", // Yellowish
                          "#efebe9", // Brownish Grey
                          "#e1f5fe"  // Light Blue
                        ][idx % 10];

                        // Assign stable react key using our subjectKeysMap state
                        const stableRowKey = subjectKeysMap[sub] || `temp_${idx}_${sub}`;

                        return (
                          <tr key={stableRowKey} style={{ backgroundColor: color }}>
                            <td style={{ border: '1.5px solid #1e5631', padding: '4px', textAlign: 'center', fontSize: '17px', fontWeight: 900, color: '#000000', fontFamily: 'sans-serif' }}>{idx + 1}</td>
                            <td className="subject-name" style={{ border: '1.5px solid #1e5631', padding: '4px', textAlign: 'center' }}>
                              <input 
                                type="text"
                                value={sub}
                                onChange={(e) => {
                                  const newName = e.target.value;
                                  if (!newName) return;
                                  const currentSubs = getClassSubjects(adminSclass);
                                  const updated = currentSubs.map(s => s === sub ? newName : s);
                                  
                                  const stored = localStorage.getItem("madarsa_class_subjects");
                                  let parsed: Record<string, string[]> = {};
                                  if (stored) {
                                    try { parsed = JSON.parse(stored); } catch (err) { console.error(err); }
                                  }
                                  parsed[adminSclass] = updated;
                                  localStorage.setItem("madarsa_class_subjects", JSON.stringify(parsed));
                                  
                                  // Update the mapping to keep the same key for the new name!
                                  setSubjectKeysMap(prev => {
                                    const next = { ...prev };
                                    if (next[sub]) {
                                      next[newName] = next[sub];
                                      delete next[sub];
                                    }
                                    return next;
                                  });

                                  setAdminMarks(prev => {
                                    const next = { ...prev };
                                    if (prev[sub] !== undefined) {
                                      next[newName] = prev[sub];
                                      delete next[sub];
                                    } else {
                                      next[newName] = 75;
                                    }
                                    return next;
                                  });
                                  
                                  setSubjectConfigChangeCounter(prev => prev + 1);
                                }}
                                onKeyDown={(e) => {
                                  // If key is Backspace or Delete on an empty string field, instantly delete this row
                                  if ((e.key === "Backspace" || e.key === "Delete") && !sub.trim()) {
                                    e.preventDefault();
                                    
                                    const currentSubs = getClassSubjects(adminSclass);
                                    const updated = currentSubs.filter(s => s !== sub);
                                    
                                    const stored = localStorage.getItem("madarsa_class_subjects");
                                    let parsed: Record<string, string[]> = {};
                                    if (stored) {
                                      try { parsed = JSON.parse(stored); } catch (err) { console.error(err); }
                                    }
                                    parsed[adminSclass] = updated;
                                    localStorage.setItem("madarsa_class_subjects", JSON.stringify(parsed));
                                    
                                    setSubjectKeysMap(prev => {
                                      const next = { ...prev };
                                      delete next[sub];
                                      return next;
                                    });

                                    setAdminMarks(prev => {
                                      const next = { ...prev };
                                      delete next[sub];
                                      return next;
                                    });
                                    
                                    setSubjectConfigChangeCounter(prev => prev + 1);
                                  }
                                }}
                                placeholder="Subject Name"
                                style={{
                                  fontSize: '17px',
                                  fontWeight: 950,
                                  fontStyle: 'italic',
                                  fontFamily: 'Georgia, serif',
                                  padding: '4px',
                                  border: '1.5px dashed rgba(30, 86, 49, 0.3)',
                                  borderRadius: '4px',
                                  background: 'rgba(255, 255, 255, 0.4)',
                                  width: '95%',
                                  textAlign: 'center',
                                  color: '#000000',
                                  outline: 'none'
                                }}
                              />
                            </td>
                            <td style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', color: '#000000', fontWeight: 900 }}>100</td>
                            <td style={{ border: '1.5px solid #1e5631', padding: '4px', textAlign: 'center' }}>
                              <input 
                                type="number"
                                min={0}
                                max={100}
                                value={mark === "" ? "" : mark}
                                onChange={(e) => {
                                  const rawVal = e.target.value;
                                  if (rawVal === "") {
                                    setAdminMarks(prev => ({ ...prev, [sub]: "" }));
                                    return;
                                  }
                                  let val = parseInt(rawVal);
                                  if (isNaN(val)) val = 0;
                                  if (val > 100) val = 100;
                                  if (val < 0) val = 0;
                                  setAdminMarks(prev => ({ ...prev, [sub]: val }));
                                }}
                                style={{
                                  fontSize: '17px',
                                  fontWeight: 900,
                                  padding: '4px',
                                  border: '1.5px solid #1e5631',
                                  borderRadius: '4px',
                                  background: '#ffffff',
                                  width: '70px',
                                  textAlign: 'center',
                                  color: '#000000',
                                  outline: 'none'
                                }}
                              />
                            </td>
                            {/* Actions Column */}
                            <td style={{ border: '1.5px solid #1e5631', padding: '4px', textAlign: 'center' }}>
                              <button
                                type="button"
                                title="Delete subject"
                                onClick={() => {
                                  // Instant, promptless deletion to dynamically remove complete row & readjust others
                                  const currentSubs = getClassSubjects(adminSclass);
                                  const updated = currentSubs.filter(s => s !== sub);
                                  
                                  const stored = localStorage.getItem("madarsa_class_subjects");
                                  let parsed: Record<string, string[]> = {};
                                  if (stored) {
                                    try { parsed = JSON.parse(stored); } catch (err) { console.error(err); }
                                  }
                                  parsed[adminSclass] = updated;
                                  localStorage.setItem("madarsa_class_subjects", JSON.stringify(parsed));
                                  
                                  setSubjectKeysMap(prev => {
                                    const next = { ...prev };
                                    delete next[sub];
                                    return next;
                                  });

                                  setAdminMarks(prev => {
                                    const next = { ...prev };
                                    delete next[sub];
                                    return next;
                                  });
                                  
                                  setSubjectConfigChangeCounter(prev => prev + 1);
                                }}
                                style={{
                                  background: '#fee2e2',
                                  border: '1px solid #f87171',
                                  color: '#dc2626',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#fca5a5'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                              >
                                ✕ Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Add Inline Subject Row */}
                      <tr style={{ backgroundColor: '#ffffff' }}>
                        <td colSpan={5} style={{ border: '1.5px solid #1e5631', padding: '10px', textAlign: 'center' }}>
                           <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', maxWidth: '420px', margin: '0 auto' }}>
                            <input 
                              type="text"
                              placeholder="Enter new subject name (e.g. English, URDU)..."
                              value={newInlineSubjectName}
                              onChange={(e) => setNewInlineSubjectName(e.target.value)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '14px',
                                border: '1.5px solid #1e5631',
                                borderRadius: '4px',
                                background: '#f9fff9',
                                flex: '1',
                                boxSizing: 'border-box',
                                height: '34px',
                                color: '#000000',
                                fontWeight: 'bold',
                                outline: 'none'
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const trimmed = newInlineSubjectName.trim();
                                  if (!trimmed) return;
                                  const currentSubs = getClassSubjects(adminSclass);
                                  if (currentSubs.includes(trimmed)) {
                                    alert("Subject already exists!");
                                    return;
                                  }
                                  const updated = [...currentSubs, trimmed];
                                  const stored = localStorage.getItem("madarsa_class_subjects");
                                  let parsed: Record<string, string[]> = {};
                                  if (stored) {
                                    try { parsed = JSON.parse(stored); } catch (err) { console.error(err); }
                                  }
                                  parsed[adminSclass] = updated;
                                  localStorage.setItem("madarsa_class_subjects", JSON.stringify(parsed));
                                  
                                  setAdminMarks(prev => ({
                                    ...prev,
                                    [trimmed]: 75
                                  }));
                                  
                                  setNewInlineSubjectName("");
                                  setSubjectConfigChangeCounter(prev => prev + 1);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const trimmed = newInlineSubjectName.trim();
                                if (!trimmed) return;
                                const currentSubs = getClassSubjects(adminSclass);
                                if (currentSubs.includes(trimmed)) {
                                  alert("Subject already exists!");
                                  return;
                                }
                                const updated = [...currentSubs, trimmed];
                                const stored = localStorage.getItem("madarsa_class_subjects");
                                let parsed: Record<string, string[]> = {};
                                if (stored) {
                                  try { parsed = JSON.parse(stored); } catch (e) { console.error(e); }
                                }
                                parsed[adminSclass] = updated;
                                localStorage.setItem("madarsa_class_subjects", JSON.stringify(parsed));
                                
                                setAdminMarks(prev => ({
                                  ...prev,
                                  [trimmed]: 75
                                }));
                                
                                setNewInlineSubjectName("");
                                setSubjectConfigChangeCounter(prev => prev + 1);
                              }}
                              style={{
                                background: '#1e5631',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#ffffff',
                                padding: '0 16px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                height: '34px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#143c22'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#1e5631'; }}
                            >
                              <span>+</span> Add Subject
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      {/* Calculated Total Row */}
                      <tr style={{ background: '#f9fff9' }}>
                        <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontStyle: 'italic', color: '#000000', fontWeight: 900 }}>Total</th>
                        <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', color: '#000000', fontWeight: 900 }}>
                          {getClassSubjects(adminSclass).length * 100}
                        </th>
                        <th id="total" style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontWeight: 900, color: '#000000' }}>
                          {getAdminTotalMarks()}
                        </th>
                        <th style={{ border: '1.5px solid #1e5631', padding: '6px' }}></th>
                      </tr>

                      {/* Calculated Percentage Row */}
                      <tr style={{ background: '#f9fff9' }}>
                        <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontStyle: 'italic', color: '#000000', fontWeight: 900 }}>Percentage</th>
                        <th colSpan={3} id="percent" style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontWeight: 900, color: '#000000' }}>
                          {(() => {
                            const numSubs = getClassSubjects(adminSclass).length;
                            return numSubs > 0 ? (getAdminTotalMarks() / numSubs).toFixed(2) : "0.00";
                          })()}%
                        </th>
                      </tr>

                      {/* Dynamic Simulated Rank status */}
                      <tr style={{ backgroundColor: '#fffdd0' }}>
                        <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontStyle: 'italic', color: '#000000', fontWeight: 900 }}>Rank</th>
                        <th colSpan={3} id="rank" style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '18px', fontWeight: 900, color: '#000000' }}>
                          {(() => {
                            const currentTotal = getAdminTotalMarks();
                            const classResults = results.filter(r => r.className === adminSclass);
                            const totals = classResults.map(r => getClassSubjects(adminSclass).reduce((sum, sub) => sum + (Number((r.marks || {})[sub]) || 0), 0));
                            if (!totals.includes(currentTotal)) totals.push(currentTotal);
                            totals.sort((a,b) => b-a);
                            const unique = [...new Set(totals)];
                            return unique.indexOf(currentTotal) + 1;
                          })()}
                        </th>
                      </tr>

                      {/* Division string field */}
                      <tr style={{ backgroundColor: '#fffdd0' }}>
                        <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontStyle: 'italic', color: '#000000', fontWeight: 900 }}>Division</th>
                        <th colSpan={3} style={{ border: '1.5px solid #1e5631', padding: '4px', textAlign: 'center' }}>
                          <input 
                            value={adminDivision} 
                            onChange={(e) => setAdminDivision(e.target.value)}
                            placeholder="e.g. First Division"
                            style={{ width: '90%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '18px', fontWeight: 900, fontStyle: 'italic', color: '#000000', outline: 'none' }}
                          />
                        </th>
                      </tr>
                    </tfoot>
                  </table>

                  {/* RESULT PASS/FAIL DYNAMIC PILLS */}
                  <div 
                    id="resultBox"
                    style={{
                      margin: '15px auto', 
                      width: '70%', 
                      padding: '10px', 
                      textAlign: 'center', 
                      fontSize: '22px', 
                      fontWeight: 900, 
                      background: '#fdfbf7', 
                      border: '2px solid #1b5e20', 
                      borderRadius: '10px', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: '40px', 
                      alignItems: 'center', 
                      color: '#1b5e20'
                    }}
                  >
                    <span>RESULT:</span>
                    
                    {/* PASS checkbox pill */}
                    <span 
                      className={`status-label ${
                        (() => {
                          const numSubs = getClassSubjects(adminSclass).length;
                          const pct = numSubs > 0 ? (getAdminTotalMarks() / numSubs) : 0;
                          return pct >= 23;
                        })()
                          ? 'border-2 border-[#1b5e20] opacity-100 bg-white' 
                          : 'opacity-25 line-through font-normal'
                      }`}
                      style={{
                        padding: '2px 20px',
                        borderRadius: '5px',
                        color: (() => {
                          const numSubs = getClassSubjects(adminSclass).length;
                          const pct = numSubs > 0 ? (getAdminTotalMarks() / numSubs) : 0;
                          return pct >= 23 ? '#1b5e20' : '#888';
                        })()
                      }}
                    >
                      PASS ✓
                    </span>

                    {/* FAIL checkbox pill */}
                    <span 
                      className={`status-label ${
                        (() => {
                          const numSubs = getClassSubjects(adminSclass).length;
                          const pct = numSubs > 0 ? (getAdminTotalMarks() / numSubs) : 0;
                          return pct < 23;
                        })()
                          ? 'border-2 border-red-600 opacity-100 bg-white' 
                          : 'opacity-25 line-through font-normal'
                      }`}
                      style={{
                        padding: '2px 20px',
                        borderRadius: '5px',
                        color: (() => {
                          const numSubs = getClassSubjects(adminSclass).length;
                          const pct = numSubs > 0 ? (getAdminTotalMarks() / numSubs) : 0;
                          return pct < 23 ? '#d32f2f' : '#888';
                        })()
                      }}
                    >
                      FAIL ✗
                    </span>
                  </div>

                  {/* Signatures and seals placeholders */}
                  <div 
                    className="footer-sign"
                    style={{
                      marginTop: 'auto',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      padding: '0 40px',
                      paddingBottom: '30px',
                      color: '#1e5631',
                      fontSize: '16px',
                      height: '110px'
                    }}
                  >
                    <div style={{ position: 'relative', width: '250px', textAlign: 'center' }}>
                      {schoolConfig?.principalSignatureUrl ? (
                        <div style={{ position: 'absolute', bottom: '22px', left: '50%', transform: 'translateX(-50%)', width: '160px', height: '65px', pointerEvents: 'none' }}>
                          <img 
                            src={schoolConfig.principalSignatureUrl} 
                            alt="Principal Signature" 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : null}
                      <div style={{ borderTop: '1.5px solid #1e5631', paddingTop: '4px', fontWeight: 900 }}>Principal Signature</div>
                    </div>

                    <div style={{ position: 'relative', width: '250px', textAlign: 'center' }}>
                      {schoolConfig?.schoolStampUrl ? (
                        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', width: '165px', height: '165px', pointerEvents: 'none', zIndex: 10 }}>
                          <img 
                            src={schoolConfig.schoolStampUrl} 
                            alt="School Stamp" 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : null}
                      <div style={{ borderTop: '1.5px solid #1e5631', paddingTop: '4px', fontWeight: 900 }}>Stamp / Seal</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SAVED RECORDS BACKUPS & CONTROLS SECTION */}
              <div id="savedListSection" className="bg-white dark:bg-slate-800 border-3 border-[#1e5631] rounded-2xl p-6 shadow-md no-print">
                <h2 className="text-xl font-bold font-serif text-[#1e5631] dark:text-[#a4be7b] text-center mb-4">
                  Saved Records (Bachon ki List)
                </h2>

                {/* 📅 SELECT ACADEMIC YEAR (SESSION) */}
                <div className="bg-emerald-50/50 dark:bg-slate-900/40 border border-emerald-150 dark:border-slate-700/60 rounded-xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    <div>
                      <span className="text-xs font-bold text-[#1e5631] dark:text-[#a4be7b] uppercase tracking-wider block">Academic Session (सत्र चुनें)</span>
                      <span className="text-[10px] text-slate-500">Filter records by their saved year</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-64">
                    <select
                      value={savedRecordsYearFilter}
                      onChange={(e) => {
                        setSavedRecordsYearFilter(e.target.value);
                        setAdminResultClassFilter('ALL');
                        setSelectedRolls([]);
                      }}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border-2 border-emerald-600 rounded-xl text-xs text-[#1e5631] dark:text-emerald-450 font-bold focus:outline-none focus:ring-1 focus:ring-[#1e5631]"
                    >
                      {customSessions.slice().reverse().map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* THREE EXAMINATION TABS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExamTypeTab('Annual');
                      setAdminResultClassFilter('ALL');
                      setSelectedRolls([]);
                    }}
                    className={`p-4 rounded-xl text-center border-2 transition-all cursor-pointer ${
                      selectedExamTypeTab === 'Annual'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-[#1e5631] text-[#1e5631] dark:text-emerald-400 shadow-md scale-[1.01] font-black'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <span className="text-sm md:text-base block">🏆 ANNUAL EXAMINATION LIST {savedRecordsYearFilter}</span>
                    <span className="block mt-1 text-[10px] uppercase font-sans tracking-widest text-[#1e5631]/80 dark:text-emerald-400/80">
                      वार्षिक परीक्षा सूची ({results.filter(r => (r.examType || 'Annual').toLowerCase() === 'annual' && normalizeSession(r.session) === normalizeSession(savedRecordsYearFilter)).length} Total Saved)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExamTypeTab('Half-Yearly');
                      setAdminResultClassFilter('ALL');
                      setSelectedRolls([]);
                    }}
                    className={`p-4 rounded-xl text-center border-2 transition-all cursor-pointer ${
                      selectedExamTypeTab === 'Half-Yearly'
                        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-800 dark:text-amber-400 shadow-md scale-[1.01] font-black'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <span className="text-sm md:text-base block">📝 HALF YEARLY EXAMINATION {savedRecordsYearFilter}</span>
                    <span className="block mt-1 text-[10px] uppercase font-sans tracking-widest text-amber-700/80 dark:text-amber-400/80">
                      अर्धवार्षिक परीक्षा सूची ({results.filter(r => (r.examType || 'Annual').toLowerCase() === 'half-yearly' && normalizeSession(r.session) === normalizeSession(savedRecordsYearFilter)).length} Total Saved)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExamTypeTab('Quarterly');
                      setAdminResultClassFilter('ALL');
                      setSelectedRolls([]);
                    }}
                    className={`p-4 rounded-xl text-center border-2 transition-all cursor-pointer ${
                      selectedExamTypeTab === 'Quarterly'
                        ? 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-500 text-cyan-800 dark:text-cyan-400 shadow-md scale-[1.01] font-black'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <span className="text-sm md:text-base block">📋 QUARTERLY EXAMINATION {savedRecordsYearFilter}</span>
                    <span className="block mt-1 text-[10px] uppercase font-sans tracking-widest text-cyan-700/80 dark:text-cyan-400/80">
                      तिमाही परीक्षा सूची ({results.filter(r => (r.examType || 'Annual').toLowerCase() === 'quarterly' && normalizeSession(r.session) === normalizeSession(savedRecordsYearFilter)).length} Total Saved)
                    </span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-150 dark:border-slate-750/70 mb-6">
                  <p className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest text-center mb-3">
                    🛠️ {selectedExamTypeTab.toUpperCase()} CONTROLS & BACKUPS:
                  </p>
                  
                  {/* Sub controls button bar for active exam */}
                  <div className="flex flex-wrap justify-center gap-3 select-none text-xs">
                    {/* Invisible JSON backup uploader */}
                    <input
                      type="file"
                      id="adminJsonImport"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={handleImportBackup}
                    />
                    <button
                      onClick={() => document.getElementById('adminJsonImport')?.click()}
                      style={{ backgroundColor: '#e67e22' }}
                      className="px-4 py-2 text-white font-bold rounded-lg cursor-pointer hover:scale-105 transition"
                    >
                      📥 Import {selectedExamTypeTab} Backup
                    </button>
                    <button
                      onClick={handleDownloadBackup}
                      style={{ backgroundColor: '#34495e' }}
                      className="px-4 py-2 text-white font-bold rounded-lg cursor-pointer hover:scale-105 transition"
                    >
                      📤 Download {selectedExamTypeTab} Backup
                    </button>
                    <button
                      onClick={handleExportToExcel}
                      style={{ backgroundColor: '#1d6f42' }}
                      className="px-4 py-2 text-white font-bold rounded-lg cursor-pointer hover:scale-105 transition"
                    >
                      📊 Export to Excel
                    </button>
                    <button
                      onClick={handlePrintSelected}
                      style={{ backgroundColor: '#8e44ad' }}
                      className="px-4 py-2 text-white font-bold rounded-lg cursor-pointer hover:scale-105 transition"
                    >
                      🖨️ Selective Print Selected
                    </button>
                  </div>
                </div>

                {/* SEARCH & CLASS FILTERING SYSTEM */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-750">
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-[#1e5631] dark:text-amber-400 uppercase tracking-widest block">Class-wise Tab Filters:</span>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {['ALL', ...customClasses].map((cls) => {
                        const count = results.filter(r => {
                          const matchesExam = (r.examType || 'Annual').toLowerCase() === selectedExamTypeTab.toLowerCase();
                          const matchesYear = normalizeSession(r.session) === normalizeSession(savedRecordsYearFilter);
                          const matchesClass = cls === 'ALL' || r.className === cls;
                          return matchesExam && matchesYear && matchesClass;
                        }).length;

                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => {
                              setAdminResultClassFilter(cls as any);
                              setSelectedRolls([]);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              adminResultClassFilter === cls
                                ? 'bg-[#1e5631] text-white shadow-md scale-105'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-755'
                            }`}
                          >
                            <span>{cls}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                              adminResultClassFilter === cls 
                                ? 'bg-emerald-950/60 text-white font-black' 
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="w-full md:w-64 space-y-1">
                    <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest block">Search Student:</span>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">
                        <Search className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        placeholder="Name or Roll No..."
                        value={resultSearch}
                        onChange={(e) => setResultSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1e5631]"
                      />
                    </div>
                  </div>
                </div>

                {/* RECORDS LIST TABLE VIEW */}
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-center border ring-1 ring-slate-100 dark:ring-slate-850">
                    <thead>
                      <tr className="bg-[#fffbeb] text-slate-850">
                        <th className="p-2 border border-slate-200 dark:border-slate-700 w-12">
                          <input
                            type="checkbox"
                            checked={
                              results.length > 0 &&
                              (() => {
                                const filteredResults = results
                                  .filter(r => {
                                    const matchesExam = (r.examType || 'Annual').toLowerCase() === selectedExamTypeTab.toLowerCase();
                                    const matchesYear = normalizeSession(r.session) === normalizeSession(savedRecordsYearFilter);
                                    const matchesClass = adminResultClassFilter === 'ALL' || r.className === adminResultClassFilter;
                                    const matchesSearch = !resultSearch.trim() || 
                                      String(r.studentName || '').toLowerCase().includes(resultSearch.toLowerCase()) || 
                                      String(r.rollNo || '').toLowerCase().includes(resultSearch.toLowerCase());
                                    return matchesExam && matchesYear && matchesClass && matchesSearch;
                                  });
                                return filteredResults.length > 0 && filteredResults.every(r => selectedRolls.includes(r.rollNo.toString().trim()));
                              })()
                            }
                            onChange={(e) => {
                              const filteredResults = results
                                .filter(r => {
                                  const matchesExam = (r.examType || 'Annual').toLowerCase() === selectedExamTypeTab.toLowerCase();
                                  const matchesYear = normalizeSession(r.session) === normalizeSession(savedRecordsYearFilter);
                                  const matchesClass = adminResultClassFilter === 'ALL' || r.className === adminResultClassFilter;
                                  const matchesSearch = !resultSearch.trim() || 
                                    String(r.studentName || '').toLowerCase().includes(resultSearch.toLowerCase()) || 
                                    String(r.rollNo || '').toLowerCase().includes(resultSearch.toLowerCase());
                                  return matchesExam && matchesYear && matchesClass && matchesSearch;
                                });
                              const filteredRolls = filteredResults.map(r => r.rollNo.toString().trim());

                              if (e.target.checked) {
                                setSelectedRolls(prev => Array.from(new Set([...prev, ...filteredRolls])));
                              } else {
                                setSelectedRolls(prev => prev.filter(roll => !filteredRolls.includes(roll)));
                              }
                            }}
                          />
                        </th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700">Roll No</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700">Student Name</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700">Class</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700">Total Score</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700">Class Rank</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-750">
                      {(() => {
                        const filteredResults = results
                          .filter(r => {
                            const matchesExam = (r.examType || 'Annual').toLowerCase() === selectedExamTypeTab.toLowerCase();
                            const matchesYear = normalizeSession(r.session) === normalizeSession(savedRecordsYearFilter);
                            const matchesClass = adminResultClassFilter === 'ALL' || r.className === adminResultClassFilter;
                            const matchesSearch = !resultSearch.trim() || 
                              String(r.studentName || '').toLowerCase().includes(resultSearch.toLowerCase()) || 
                              String(r.rollNo || '').toLowerCase().includes(resultSearch.toLowerCase());
                            return matchesExam && matchesYear && matchesClass && matchesSearch;
                          })
                          .sort((a, b) => {
                            const weightA = classWeights[a.className] || 99;
                            const weightB = classWeights[b.className] || 99;
                            if (weightA !== weightB) {
                              return weightA - weightB;
                            }
                            const totalA = Object.values(a.marks || {}).reduce((sum, v) => sum + (Number(v)||0), 0);
                            const totalB = Object.values(b.marks || {}).reduce((sum, v) => sum + (Number(v)||0), 0);
                            return totalB - totalA;
                          });

                        return filteredResults.map((r) => {
                          const total = Object.values(r.marks || {}).reduce((sum, v) => sum + (Number(v)||0), 0);
                          const numSubs = getClassSubjects(r.className).length;
                          const maxScore = numSubs * 100;
                          const isChecked = selectedRolls.includes(r.rollNo.toString().trim());

                          // Calculate proper academic class rank dynamically
                          const classResults = results.filter(item => 
                            item.className === r.className &&
                            (item.examType || 'Annual').toLowerCase() === selectedExamTypeTab.toLowerCase() &&
                            normalizeSession(item.session) === normalizeSession(savedRecordsYearFilter)
                          );
                          const sortedClassResults = [...classResults].sort((a, b) => {
                            const totA = Object.values(a.marks || {}).reduce((sum, v) => sum + (Number(v)||0), 0);
                            const totB = Object.values(b.marks || {}).reduce((sum, v) => sum + (Number(v)||0), 0);
                            return totB - totA;
                          });
                          const classRankIndex = sortedClassResults.findIndex(item => item.rollNo === r.rollNo);
                          const classRank = classRankIndex !== -1 ? classRankIndex + 1 : 1;

                          return (
                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                              <td className="p-2.5 border border-slate-200 dark:border-slate-700 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedRolls(prev => prev.filter(roll => roll !== r.rollNo.toString().trim()));
                                    } else {
                                      setSelectedRolls(prev => [...prev, r.rollNo.toString().trim()]);
                                    }
                                  }}
                                />
                              </td>
                              <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-mono font-bold text-[#1e5631] dark:text-[#a4be7b]">
                                {r.rollNo}
                              </td>
                              <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100 text-left pl-4">
                                {r.studentName}
                              </td>
                              <td className="p-2.5 border border-slate-200 dark:border-slate-700">
                                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-150 dark:border-slate-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                  {r.className}
                                </span>
                              </td>
                              <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">
                                {total} / {maxScore}
                              </td>
                              <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold font-mono text-[#1e5631] dark:text-amber-400">
                                #{classRank}
                              </td>
                              <td className="p-2.5 border border-slate-200 dark:border-slate-700 flex justify-center items-center gap-2">
                                <button
                                  onClick={() => handleEditRecord(r.rollNo)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded text-[11px] transition flex items-center gap-1 cursor-pointer shadow-sm hover:scale-105"
                                  title="Edit this student's result card"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord(r.rollNo)}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded text-[11px] transition flex items-center gap-1 cursor-pointer shadow-sm hover:scale-105"
                                  title="Delete this student's result permanently"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                      {results.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-slate-400 font-bold italic">
                            No records registered yet. Create your first record above!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic Selective/Bulk Print Queue for A4 Media Output */}
              {bulkPrintResults.length > 0 && (
                <div id="bulkPrintArea" className="hidden print:block absolute inset-0 bg-white z-[9999] w-full min-h-screen">
                  <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                      :root {
                        color-scheme: light !important;
                      }
                      html, body {
                        background: white !important;
                        background-color: white !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                      }
                      #bulkPrintArea, #bulkPrintArea * {
                        font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                      }
                      .font-mono, #bulkPrintArea .font-mono, #bulkPrintArea [class*="font-mono"] {
                        font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                      }
                      .font-arabic, #bulkPrintArea .font-arabic, #bulkPrintArea [class*="font-arabic"] {
                        font-family: "Noto Naskh Arabic", serif !important;
                      }
                      .font-urdu, #bulkPrintArea .font-urdu, #bulkPrintArea [class*="font-urdu"] {
                        font-family: "Noto Nastaliq Urdu", serif !important;
                      }
                      /* Counteract dark mode classes during print to prevent black sections */
                      .dark, .dark * {
                        background-color: transparent !important;
                        color: black !important;
                        border-color: #1e5631 !important;
                      }
                      body * {
                        visibility: hidden !important;
                      }
                      #bulkPrintArea, #bulkPrintArea * {
                        visibility: visible !important;
                      }
                      #bulkPrintArea {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        background-color: white !important;
                        display: block !important;
                        box-sizing: border-box !important;
                      }
                      #bulkPrintArea .printable-card-item {
                        width: 900px !important;
                        max-width: 900px !important;
                        height: 1311px !important;
                        min-height: 1311px !important;
                        max-height: 1311px !important;
                        margin: 0 auto !important;
                        page-break-after: always !important;
                        box-shadow: none !important;
                        border: 5px solid #1e5631 !important;
                        box-sizing: border-box !important;
                        transform-origin: top center !important;
                        display: flex !important;
                        flex-direction: column !important;
                        background: white !important;
                        background-color: white !important;
                        padding: 20px !important;
                        justify-content: space-between !important;
                        position: relative !important;
                        overflow: hidden !important;
                      }
                      #bulkPrintArea .card-ribbon-container {
                        background: linear-gradient(90deg, #fdfbf7, #fffdd0, #fdfbf7) !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        height: 280px !important;
                        margin: -20px -20px 30px -20px !important;
                        padding: 15px !important;
                        position: relative !important;
                        border-radius: 12px 12px 0 0 !important;
                        clip-path: ellipse(110% 100% at 50% 0%) !important;
                        border-bottom: 2px solid #a5d6a7 !important;
                      }
                      
                      #logoContainer, #logoContainer * , #logoContainer img, #urduLogoImg, .logo-container, .logo-container img {
                        background-color: transparent !important;
                        background: transparent !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                      }
                      #bulkPrintArea, #bulkPrintArea *, .printable-card-item, .printable-card-item * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                      }
                      @page {
                        size: A4 portrait;
                        margin: 5mm;
                      }
                    }
                  `}} />
                  {bulkPrintResults.map((res, index) => {
                    const subjects = getClassSubjects(res.className);
                    const totalScore = subjects.reduce((sum, sub, i) => {
                      let markVal = 75;
                      const resMarks = res.marks || {};
                      if (resMarks[sub] !== undefined) {
                        markVal = Number(resMarks[sub]) || 0;
                      } else {
                        const keys = Object.keys(resMarks);
                        const values = Object.values(resMarks);
                        const matchKey = keys.find(k => k.toLowerCase().includes(sub.toLowerCase()) || sub.toLowerCase().includes(k.toLowerCase()));
                        if (matchKey !== undefined) {
                          markVal = Number(resMarks[matchKey]) || 0;
                        } else if (i < values.length) {
                          markVal = Number(values[i]) || 0;
                        }
                      }
                      return sum + markVal;
                    }, 0);

                    return (
                      <div 
                        key={res.id || index}
                        className="printable-card-item"
                        style={{
                          width: '900px',
                          maxWidth: '900px',
                          height: '1311px',
                          minHeight: '1311px',
                          maxHeight: '1311px',
                          margin: '0 auto', 
                          background: '#ffffff',
                          border: '5px solid #1e5631',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          pageBreakAfter: 'always',
                          boxSizing: 'border-box',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Curved ellipse ribbon */}
                        <div
                          className="card-ribbon-container"
                          style={{
                            position: 'relative',
                            height: '280px',
                            marginBottom: '30px',
                            background: 'linear-gradient(90deg, #fdfbf7, #fffdd0, #fdfbf7)',
                            margin: '-20px -20px 30px -20px',
                            padding: '15px',
                            borderRadius: '12px 12px 0 0',
                            clipPath: 'ellipse(110% 100% at 50% 0%)',
                            borderBottom: '2px solid #a5d6a7'
                          }}
                        >
                          <div className="absolute top-2.5 left-[22px] text-sm text-[#2e7d32] font-black z-[15]">
                            Reg. No: <span style={{ color: '#000000' }}>{res.regNo || "G- 59313"}</span>
                          </div>
                          <div 
                            className="absolute top-[10px] right-[22px] text-[14px] font-black z-[15] text-[#1b5e20] flex gap-1 items-center" 
                            style={{ direction: 'rtl', fontFamily: '"Urdu Typesetting", "Sakkal Majalla", serif' }}
                          >
                            رکنیت نمبر: <span style={{ color: '#1b5e20', fontFamily: 'sans-serif' }}>{res.udise || "4053"}</span>
                          </div>
                          
                          <div 
                            className="card-logo-wrapper"
                            style={{
                              position: 'absolute',
                              left: '10px',
                              top: '40px',
                              width: '185px',
                              height: '185px',
                              zIndex: '10',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {adminSchoolLogo ? (
                              <img src={adminSchoolLogo} alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'transparent' }} />
                            ) : (
                              <div className="w-[170px] h-[170px] rounded-full border-4 border-[#1e5631] border-dashed flex flex-col items-center justify-center p-2 bg-[#fffdd0]/40 text-center">
                                <span className="text-[40px]">🕌</span>
                                <span className="text-[12px] font-black leading-tight text-[#1e5631]">NOORUL ULOOM</span>
                                <span className="text-[10px] font-bold text-[#1e5631]">KARMALHAN</span>
                              </div>
                            )}
                          </div>

                          <div 
                            className="card-header-center"
                            style={{
                              position: 'absolute',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '100%',
                              textAlign: 'center',
                              zIndex: '5',
                              top: '10px'
                            }}
                          >
                            <div>
                              {adminUrduLogo ? (
                                <img 
                                  src={adminUrduLogo} 
                                  alt="Urdu Name calligraphy" 
                                  style={{ maxWidth: '750px', height: '120px', objectFit: 'contain', margin: 'auto', backgroundColor: 'transparent' }} 
                                />
                              ) : (
                                <div style={{ height: '120px', width: '750px', margin: '0 auto' }} className="flex items-center justify-center p-2">
                                  <span style={{ fontSize: '38px', color: '#1b5e20', fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}>مَدْرَسَة عَرَبِيَّة نُورُ الْعُلُومِ كَارْمَاخَانْ</span>
                                </div>
                              )}
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0000FF', marginTop: '-5px', whiteSpace: 'nowrap' }}>
                              MADARSA ARABIA NOORUL ULOOM
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0000FF', whiteSpace: 'nowrap' }}>
                              Karma Khan, Distt: Sant Kabir Nagar (U.P.)
                            </div>
                            <div 
                              style={{
                                fontSize: '24px', 
                                marginTop: '8px', 
                                background: '#FFFDD0', 
                                color: '#000000', 
                                display: 'inline-block', 
                                padding: '4px 28px', 
                                borderRadius: '18px', 
                                border: '2px solid #1e5631',
                                fontWeight: 900
                              }}
                            >
                              {res.examType || "Annual"} Examination - {res.session || getCurrentSession()}
                            </div>
                          </div>

                          <div 
                            className="card-student-photo"
                            style={{
                              position: 'absolute',
                              top: '50px',
                              right: '15px',
                              width: '150px',
                              height: '170px',
                              border: '3px solid #2e7d32',
                              background: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: '10',
                              overflow: 'hidden'
                            }}
                          >
                            {res.photoUrl ? (
                              <img 
                                src={res.photoUrl} 
                                alt="Candid portrait" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            ) : (
                              <span style={{ color: '#2e7d32', fontSize: '13px', fontWeight: 'bold' }}>Photo</span>
                            )}
                          </div>
                        </div>

                        {/* Student Details Fields Grid - Beautifully Aligned */}
                        {/* Student Details Fields - Beautifully Aligned Rows */}
                        {/* Row 1 */}
                        <div className="card-details-row" style={{ display: 'flex', gap: '15px', marginBottom: '12px', alignItems: 'center', color: '#1e5631', width: '100%' }}>
                          <div style={{ flex: '1.5', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '17px', fontWeight: 800, width: '130px', display: 'inline-block' }}>Student Name:</span> 
                            <input 
                              readOnly 
                              value={res.studentName.toUpperCase()} 
                              style={{ fontSize: '17px', fontWeight: 900, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000' }}
                            />
                          </div>
                          <div style={{ flex: '1.5', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '17px', fontWeight: 800, width: '130px', display: 'inline-block' }}>Father Name:</span> 
                            <input 
                              readOnly 
                              value={res.fatherName.toUpperCase()} 
                              style={{ fontSize: '17px', fontWeight: 900, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000' }}
                            />
                          </div>
                        </div>

                        {/* Row 2 */}
                        <div className="card-details-row" style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', color: '#1e5631', width: '100%' }}>
                          <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, width: '105px', display: 'inline-block' }}>Mother Name:</span> 
                            <input 
                              readOnly 
                              value={(res.motherName || "ZAREENA KHATOON").toUpperCase()} 
                              style={{ fontSize: '16px', fontWeight: 900, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000' }}
                            />
                          </div>
                          <div style={{ width: '185px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            <span style={{ fontSize: '15px', fontWeight: 800 }}>D.O.B:</span> 
                            <input 
                              readOnly 
                              value={res.dateOfBirth || "12-04-2011"} 
                              style={{ fontSize: '16px', fontWeight: 900, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000' }}
                            />
                          </div>
                           <div style={{ width: '145px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            <span style={{ fontSize: '15px', fontWeight: 800 }}>Class:</span> 
                            <input 
                              readOnly 
                              value={formatClassName(res.className)} 
                              style={{ fontSize: '16px', fontWeight: 900, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000', textAlign: 'center' }}
                            />
                          </div>
                          <div style={{ width: '115px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, width: '55px', display: 'inline-block' }}>Roll No:</span> 
                            <input 
                              readOnly 
                              value={res.rollNo} 
                              style={{ fontSize: '16px', fontWeight: 900, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000', textAlign: 'center' }}
                            />
                          </div>
                        </div>

                        {/* Address full width block underneath */}
                        <div className="card-details-row" style={{ display: 'flex', gap: '15px', marginBottom: '14px', alignItems: 'center', color: '#1e5631', width: '100%' }}>
                          <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '17px', fontWeight: 800, width: '75px', display: 'inline-block' }}>Address:</span> 
                            <input 
                              readOnly 
                              value={res.address || "VILLAGE & POST KARMA KHAN, DISTRICT SANT KABIR NAGAR, UTTAR PRADESH"} 
                              style={{ fontSize: '15px', fontWeight: 950, padding: '4px 8px', border: '1.5px solid #1e5631', borderRadius: '4px', background: '#f9fff9', width: '100%', boxSizing: 'border-box', height: '32px', color: '#000000' }}
                            />
                          </div>
                        </div>

                        {/* Rainbow marks sheet table */}
                        <table className="card-marks-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: 'white', border: '2px solid #1e5631' }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900, width: '60px', verticalAlign: 'middle' }}>S.R.</th>
                              <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>Subject</th>
                              <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900, width: '100px', verticalAlign: 'middle' }}>Max</th>
                              <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', background: '#FFFDD0', color: '#000000', fontWeight: 900, width: '160px', verticalAlign: 'middle' }}>Marks Obtained</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subjects.map((sub, idx) => {
                              let mValue = 75;
                              const resMarks = res.marks || {};
                              if (resMarks[sub] !== undefined) {
                                mValue = Number(resMarks[sub]) || 0;
                              } else {
                                const keys = Object.keys(resMarks);
                                const values = Object.values(resMarks);
                                const match = keys.find(k => k.toLowerCase().includes(sub.toLowerCase()) || sub.toLowerCase().includes(k.toLowerCase()));
                                if (match !== undefined) mValue = Number(resMarks[match]) || 0;
                                else if (idx < values.length) mValue = Number(values[idx]) || 0;
                              }

                              const color = [
                                "#fce4ec", // Pinkish
                                "#e8f5e9", // Greenish
                                "#e3f2fd", // Blueish
                                "#fff3e0", // Orangeish
                                "#f3e5f5", // Purplish
                                "#f1f8e9", // Light Lime
                                "#e0f2f1", // Tealish
                                "#fffde7", // Yellowish
                                "#efebe9", // Brownish Grey
                                "#e1f5fe"  // Light Blue
                              ][idx % 10];

                              return (
                                <tr key={sub} style={{ backgroundColor: color }}>
                                  <td style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontWeight: 900, color: '#000000', fontFamily: 'sans-serif', verticalAlign: 'middle' }}>{idx + 1}</td>
                                  <td className="subject-name" style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontWeight: 950, fontStyle: 'italic', fontFamily: 'Georgia, serif', color: '#000000', verticalAlign: 'middle' }}>{sub}</td>
                                  <td style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>100</td>
                                  <td style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontWeight: 900, color: '#000000', verticalAlign: 'middle' }}>{mValue}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: '#f9fff9' }}>
                              <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontStyle: 'italic', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>Total</th>
                              <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>{subjects.length * 100}</th>
                              <th style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontWeight: 900, color: '#000000', verticalAlign: 'middle' }}>{totalScore}</th>
                            </tr>
                            <tr style={{ background: '#f9fff9' }}>
                              <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontStyle: 'italic', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>Percentage</th>
                              <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontWeight: 900, color: '#000000', verticalAlign: 'middle' }}>
                                {subjects.length > 0 ? (totalScore / subjects.length).toFixed(2) : '0.00'}%
                              </th>
                            </tr>
                            <tr style={{ backgroundColor: '#fffdd0' }}>
                              <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontStyle: 'italic', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>Rank</th>
                              <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '18px', fontWeight: 900, color: '#000000', verticalAlign: 'middle' }}>{index + 1}</th>
                            </tr>
                            <tr style={{ backgroundColor: '#fffdd0' }}>
                              <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '17px', fontStyle: 'italic', color: '#000000', fontWeight: 900, verticalAlign: 'middle' }}>Division</th>
                              <th colSpan={2} style={{ border: '1.5px solid #1e5631', padding: '6px', textAlign: 'center', fontSize: '18px', fontWeight: 900, fontStyle: 'italic', color: '#000000', verticalAlign: 'middle' }}>
                                {res.division || ""}
                              </th>
                            </tr>
                          </tfoot>
                        </table>

                        {/* PASS/FAIL box indicators */}
                        <div 
                          className="card-status-container"
                          style={{
                            margin: '15px auto', 
                            width: '70%', 
                            padding: '10px', 
                            textAlign: 'center', 
                            fontSize: '22px', 
                            fontWeight: 900, 
                            background: '#fdfbf7', 
                            border: '2px solid #1b5e20', 
                            borderRadius: '10px', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: '40px', 
                            alignItems: 'center', 
                            color: '#1b5e20'
                          }}
                        >
                          <span>RESULT:</span>
                          <span 
                            className={`status-label ${(subjects.length > 0 && (totalScore / subjects.length) >= 23) ? 'border-2 border-[#1b5e20] bg-white opacity-100 font-extrabold' : 'opacity-25'}`}
                            style={{ padding: '2px 20px', borderRadius: '5px', color: (subjects.length > 0 && (totalScore / subjects.length) >= 23) ? '#1b5e20' : '#888' }}
                          >
                            PASS ✓
                          </span>
                          <span 
                            className={`status-label ${(subjects.length === 0 || (totalScore / subjects.length) < 23) ? 'border-2 border-red-650 bg-white opacity-100 font-extrabold' : 'opacity-25'}`}
                            style={{ padding: '2px 20px', borderRadius: '5px', color: (subjects.length === 0 || (totalScore / subjects.length) < 23) ? '#d32f2f' : '#888' }}
                          >
                            FAIL ✗
                          </span>
                        </div>

                        {/* Signatures and seals */}
                        <div 
                          className="footer-sign card-signatures-container"
                          style={{
                            marginTop: 'auto',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            padding: '0 40px',
                            paddingBottom: '30px',
                            color: '#1e5631',
                            fontSize: '16px',
                            height: '110px'
                          }}
                        >
                          <div style={{ position: 'relative', width: '250px', textAlign: 'center' }}>
                            {schoolConfig?.principalSignatureUrl ? (
                              <div style={{ position: 'absolute', bottom: '22px', left: '50%', transform: 'translateX(-50%)', width: '160px', height: '65px', pointerEvents: 'none' }}>
                                <img 
                                  src={schoolConfig.principalSignatureUrl} 
                                  alt="Principal Signature" 
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ) : null}
                            <div style={{ borderTop: '1.5px solid #1e5631', paddingTop: '4px', fontWeight: 900 }}>Principal Signature</div>
                          </div>

                          <div style={{ position: 'relative', width: '250px', textAlign: 'center' }}>
                            {schoolConfig?.schoolStampUrl ? (
                              <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', width: '165px', height: '165px', pointerEvents: 'none', zIndex: 10 }}>
                                <img 
                                  src={schoolConfig.schoolStampUrl} 
                                  alt="School Stamp" 
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ) : null}
                            <div style={{ borderTop: '1.5px solid #1e5631', paddingTop: '4px', fontWeight: 900 }}>Stamp / Seal</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ADMISSIONS DESK INBOX */}
          {erpTab === 'admissions' && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-750 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" /> Pending Online Admission Forms
              </h3>

              <div className="space-y-4 text-xs">
                {admissions.length === 0 ? (
                  <p className="text-slate-400 text-center py-6">No applications standard. Fresh registrations would pop up here.</p>
                ) : (
                  admissions.map((item) => (
                    <div key={item.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl relative flex flex-col md:flex-row gap-5 shadow-sm">
                      
                      {/* Left side: Avatar portrait and key class */}
                      <div className="flex flex-col items-center justify-start gap-2 w-24 shrink-0 text-center">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-150 bg-slate-100 shadow-sm relative">
                          <img 
                            src={item.studentPhoto || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150"} 
                            alt={item.studentName} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold rounded text-[9px] uppercase tracking-wider block">
                          {item.className}
                        </span>
                      </div>

                      {/* Right side: Detailed ledger of student data */}
                      <div className="flex-grow space-y-3">
                        <div className="flex justify-between items-start gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <strong className="text-base text-slate-900 dark:text-white block font-black">{item.studentName}</strong>
                            <div className="flex gap-3">
                              <span className="text-[10px] text-slate-400 font-bold font-mono">APPLIED DATE: {item.applyDate}</span>
                              <span className="text-[10px] text-slate-400 font-bold font-mono">FORM ID: {item.formNumber || item.id}</span>
                              <span className="text-[10px] text-slate-400 font-bold font-mono">TYPE: {item.admissionType === 'Old' ? 'Old (قدیم)' : 'New (جدید)'}</span>
                            </div>
                          </div>
                          
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                            item.status === 'pending' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-400 animate-pulse' :
                            item.status === 'approved' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-400' : 
                            'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        {/* Config parameters list of 3-column grid structure */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-4 text-[11px] text-slate-600 dark:text-slate-400 text-left">
                          <div>
                            <span className="text-slate-400 block font-medium">Father's Name:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.fatherName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Mother's Name:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{item.motherName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Date of Birth (DOB):</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{item.dateOfBirth}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Aadhaar Number:</span>
                            <span className="font-mono font-bold text-slate-850 dark:text-slate-200">
                              {item.aadhaarNumber ? item.aadhaarNumber.replace(/(\d{4})/g, '$1 ').trim() : 'N/A'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block font-medium">Mobile Contact:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{item.contactPhone}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">WhatsApp Contact:</span>
                            <span className="font-mono font-bold text-emerald-650 dark:text-emerald-450">{item.whatsappNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Gender & Blood Group:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{item.gender || 'Male'} • {item.bloodGroup || 'O+'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Last Attended School:</span>
                            <span className="font-medium text-slate-705 dark:text-slate-300 truncate block max-w-[150px]" title={item.previousSchool}>
                              {item.previousSchool || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Email Address:</span>
                            <span className="font-medium text-slate-705 dark:text-slate-300 truncate block max-w-[150px]" title={item.email}>
                              {item.email || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Academic Year:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {item.academicYear || '2026-2027'}
                            </span>
                          </div>

                          <div className="col-span-2 md:col-span-4 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                            <span className="text-[10px] text-slate-400 block font-medium">Permanent Residential Address:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 block leading-relaxed">{item.address}</span>
                          </div>
                        </div>

                        {item.status === 'pending' && (
                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                            <button
                              type="button"
                              onClick={() => handleRejectAdmission(item.id)}
                              className="px-4 py-1.5 text-xs bg-red-50 hover:bg-red-100 active:bg-red-200 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-xl font-bold cursor-pointer transition-colors"
                            >
                              Reject Application
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveAdmission(item)}
                              className="px-4 py-1.5 text-xs bg-emerald-650 hover:bg-emerald-750 active:bg-emerald-800 text-white rounded-xl font-extrabold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve & Issue Roll
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ADMISSION SETUP */}
          {erpTab === 'admission_setup' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-750">
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" /> Admission Portal Setup
                </h3>
                <button
                  type="button"
                  onClick={async () => {
                    localStorage.setItem('nu_config', JSON.stringify(schoolConfig));
                    localStorage.setItem('nu_config_lastModified', Date.now().toString());
                    if (isLoggedIn) {
                      syncToFirebase('schoolData', 'config', schoolConfig);
                    }
                    const toast = document.createElement('div');
                    toast.className = 'fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl font-bold animate-bounce z-[9999]';
                    toast.innerText = 'Admission Settings Saved Successfully!';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 3000);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all"
                >
                  Save Settings
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                <h4 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
                  📑 Admission Page Configuration
                </h4>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 mb-6">
                  <div className="flex-grow space-y-1 text-left">
                    <p className="font-bold text-slate-800 dark:text-white">Admission Status</p>
                    <p className="text-[10px] text-slate-500">Toggle whether new admissions are currently open or closed.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={schoolConfig.isAdmissionOpen ?? true}
                      onChange={(e) => setSchoolConfig({...schoolConfig, isAdmissionOpen: e.target.checked})}
                    />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className={`font-black text-xs ${schoolConfig.isAdmissionOpen !== false ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {schoolConfig.isAdmissionOpen !== false ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-5 text-xs text-slate-700">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">Current Academic Session</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-2027"
                      value={schoolConfig.defaultAcademicSession || ""}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, defaultAcademicSession: e.target.value })}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-500">This will be the default pre-filled session on the admission form.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">Admission Page Title</label>
                    <input
                      type="text"
                      placeholder="Jamia Noorul Uloom Portal"
                      value={schoolConfig.admissionFormTitle || ""}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionFormTitle: e.target.value })}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">Admission Page Description</label>
                    <textarea
                      rows={3}
                      placeholder="Fill out the secure admission docket below..."
                      value={schoolConfig.admissionFormDescription || ""}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionFormDescription: e.target.value })}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">Admission Notice / Alert Box</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Admission for Class 1 is now closed..."
                      value={schoolConfig.admissionNotice || ""}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionNotice: e.target.value })}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">Candidate ID Badge Text</label>
                    <input
                      type="text"
                      placeholder="Candidate ID Badge"
                      value={schoolConfig.admissionBadgeTitle || ""}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionBadgeTitle: e.target.value })}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">Institution Name (Badge/Form)</label>
                    <input
                      type="text"
                      placeholder="JAMIA NOORUL ULOOM"
                      value={schoolConfig.admissionInstitutionName || ""}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionInstitutionName: e.target.value })}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">Institution Address</label>
                    <input
                      type="text"
                      placeholder="Golaganj, Lucknow, Uttar Pradesh, India"
                      value={schoolConfig.admissionInstitutionAddress || ""}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionInstitutionAddress: e.target.value })}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">Admission Desk Subtitle</label>
                    <input
                      type="text"
                      placeholder="Lucknow Admission Desk"
                      value={schoolConfig.admissionDeskName || ""}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionDeskName: e.target.value })}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">Registered Token Label</label>
                    <input
                      type="text"
                      placeholder="Official Registered Token"
                      value={schoolConfig.admissionRegisteredTokenLabel || ""}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionRegisteredTokenLabel: e.target.value })}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">Apply Tab Label</label>
                    <input
                      type="text"
                      placeholder="Apply Online (दाखिला आवेदन)"
                      value={schoolConfig.admissionApplyTabLabel || ""}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionApplyTabLabel: e.target.value })}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">Track Tab Label</label>
                    <input
                      type="text"
                      placeholder="Check Status (स्थिति जांचें)"
                      value={schoolConfig.admissionTrackTabLabel || ""}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionTrackTabLabel: e.target.value })}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">Academic Session Badge Label</label>
                    <input
                      type="text"
                      placeholder="Academic Admission Session"
                      value={schoolConfig.admissionSessionLabel || ""}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionSessionLabel: e.target.value })}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NEWS TICKER BULLETINS */}
          {erpTab === 'news' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-750">
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-emerald-600" /> News Tickets & Bulletins
                </h3>
                <button
                  onClick={() => setShowAddNewsModal(true)}
                  className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Notice
                </button>
              </div>

              {showAddNewsModal && (
                <form onSubmit={handleAddNews} className="p-4 bg-emerald-50/20 dark:bg-slate-900/30 border border-emerald-150 dark:border-slate-700 rounded-xl space-y-3 text-xs">
                  <h4 className="font-bold text-emerald-850 dark:text-amber-400">Add Bulletin Notice</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text" required placeholder="Notice Heading"
                      value={newNews.title} onChange={e => setNewNews({ ...newNews, title: e.target.value })}
                      className="p-2 border rounded dark:bg-slate-850 dark:border-slate-700"
                    />
                    <textarea
                      required placeholder="Explain bulletin details..."
                      rows={3}
                      value={newNews.content} onChange={e => setNewNews({ ...newNews, content: e.target.value })}
                      className="p-2 border rounded dark:bg-slate-850 dark:border-slate-700"
                    />
                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
                      <input
                        type="checkbox"
                        checked={newNews.isImportant} onChange={e => setNewNews({ ...newNews, isImportant: e.target.checked })}
                      /> Make Important Ticker Announcement
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowAddNewsModal(false)} className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-700">Cancel</button>
                    <button type="submit" className="px-3 py-1.5 bg-emerald-650 text-white rounded-lg font-bold">Declare Notice</button>
                  </div>
                </form>
              )}

              <div className="space-y-4 text-xs">
                {news.map((item) => {
                  const isEditing = editingNewsId === item.id;
                  if (isEditing) {
                    return (
                      <div key={item.id} className="p-4 bg-amber-50/20 dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-800 rounded-xl space-y-3">
                        <h4 className="font-bold text-amber-805 dark:text-amber-400">Modify Bulletin Announcement</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Notice Heading"
                            value={editingNewsTitle}
                            onChange={e => setEditingNewsTitle(e.target.value)}
                            className="p-2 border rounded dark:bg-slate-850 dark:border-slate-700 text-slate-850 dark:text-white font-bold"
                          />
                          <textarea
                            required
                            placeholder="Explain bulletin details..."
                            rows={3}
                            value={editingNewsContent}
                            onChange={e => setEditingNewsContent(e.target.value)}
                            className="p-2 border rounded dark:bg-slate-850 dark:border-slate-700 text-slate-805 dark:text-white leading-relaxed"
                          />
                          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-350 font-semibold cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={editingNewsIsImportant}
                              onChange={e => setEditingNewsIsImportant(e.target.checked)}
                              className="cursor-pointer"
                            /> Make Important Ticker Announcement
                          </label>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingNewsId(null)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!editingNewsTitle.trim() || !editingNewsContent.trim()) {
                                alert("Announcement title and content cannot be empty!");
                                return;
                              }
                              setNews(prev => prev.map(n => n.id === item.id ? {
                                ...n,
                                title: editingNewsTitle.trim(),
                                content: editingNewsContent.trim(),
                                isImportant: editingNewsIsImportant
                              } : n));
                              setEditingNewsId(null);
                            }}
                            className="px-4 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all cursor-pointer"
                          >
                            Save Notice
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-906 border border-slate-150 dark:border-slate-750 rounded-xl relative space-y-2 group">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-150 dark:border-slate-750">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-sm font-extrabold text-slate-805 dark:text-white block">{item.title}</strong>
                            <span className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded-full ${
                              item.isImportant 
                                ? 'bg-amber-100 text-amber-805 dark:bg-amber-950/40 dark:text-amber-400' 
                                : 'bg-emerald-100 text-emerald-805 dark:bg-emerald-950/40 dark:text-emerald-400'
                            }`}>
                              {item.isImportant ? 'IMPORTANT' : 'NOTICE'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-450">{item.date}</span>
                        </div>
                        {deleteConfirmNewsId === item.id ? (
                          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 transition-all animate-fade-in">
                            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold px-1 select-none">Sure? (हटाएं?)</span>
                            <button
                              onClick={() => {
                                handleDeleteNews(item.id);
                                setDeleteConfirmNewsId(null);
                              }}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded font-sans font-bold text-[10px] cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmNewsId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-sans font-semibold text-[10px] cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingNewsId(item.id);
                                setEditingNewsTitle(item.title);
                                setEditingNewsContent(item.content);
                                setEditingNewsIsImportant(!!item.isImportant);
                                setDeleteConfirmNewsId(null);
                              }}
                              className="p-1 text-sky-650 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Edit notice"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmNewsId(item.id);
                              }}
                              className="p-1 text-red-500 hover:text-red-750 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Delete notice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-655 dark:text-slate-400 leading-normal whitespace-pre-line">{item.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* INSTITUTION DETAILS CONFIG */}
          {erpTab === 'config' && (
            <div className="space-y-10 pb-12">
              <form onSubmit={handleUpdateConfig} className="space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-250 dark:border-slate-800">
                  <h3 className="font-extrabold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings className="w-5.5 h-5.5 text-emerald-600 animate-spin-slow" /> Website & Institutional Control (A to Z)
                  </h3>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-mono tracking-widest uppercase cursor-pointer transition-all shadow-md active:scale-95"
                  >
                    Save All Changes
                  </button>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-4xl">
                  Configure any text, slider, counter, academic program, or facility across the entire website instantly. Updates made here are saved directly to local database registries and apply immediately.
                </p>

                {/* SECTION 1: GENERAL BRANDING & PRINCIPAL INFO */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                  <h4 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
                    🛡️ General Institutional Branding
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">Madrasa English Title (e.g. Al-Madrasa Noorul Uloom)</label>
                      <input
                        type="text"
                        value={schoolConfig.schoolName}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, schoolName: e.target.value })}
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-emerald-800 dark:text-emerald-400">Madrasa Arabic Name / अरबी नाम (المدرسة العربية نور العلوم)</label>
                      <input
                        type="text"
                        value={schoolConfig.schoolNameArabic}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, schoolNameArabic: e.target.value })}
                        className="w-full p-2.5 border-emerald-400 dark:border-emerald-600 rounded-lg bg-emerald-50/20 dark:bg-slate-950 text-slate-850 dark:text-white font-bold font-arabic text-center text-sm"
                        placeholder="المدرسة العربية نور العلوم"
                      />
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="font-bold text-amber-700 dark:text-amber-400">Top Header Announcement Alert Text (e.g. ADMISSION 2026: Online Applications Open)</label>
                      <input
                        type="text"
                        value={schoolConfig.admissionNotice || ""}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionNotice: e.target.value })}
                        className="w-full p-2.5 border border-amber-400 dark:border-slate-800 rounded-lg bg-amber-50/10 dark:bg-slate-950 text-slate-805 dark:text-white font-bold"
                        placeholder="ADMISSION 2026: Online Applications Open"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">Head Principal Name</label>
                      <input
                        type="text"
                        value={schoolConfig.principalName}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, principalName: e.target.value })}
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-white font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Principal Portrait (प्रिंसिपल फोटो)</label>
                      <div className="flex items-center gap-3">
                        {schoolConfig.principalPhotoUrl && (
                          <img
                            src={schoolConfig.principalPhotoUrl}
                            alt="Principal Portrait"
                            className="w-12 h-12 object-cover rounded-md border border-slate-300 dark:border-slate-700 shadow-sm"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          id="principalPhotoUploadInput"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              resizeImage(file, 800, 800, 0.6).then((url) => {
                                setSchoolConfig({ ...schoolConfig, principalPhotoUrl: url });
                              }).catch(e => console.error("Compression failed", e));
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('principalPhotoUploadInput')?.click()}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-xs flex items-center gap-1.5"
                        >
                          📤 Upload Photo
                        </button>
                        {schoolConfig.principalPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setSchoolConfig({ ...schoolConfig, principalPhotoUrl: "" })}
                            className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-650 dark:text-slate-300 block mb-1">School Custom Logo (स्कूल का लोगो - गोल आकार में दिखेगा)</label>
                      <div className="flex items-center gap-3">
                        {schoolConfig.logoUrl ? (
                          <img
                            src={schoolConfig.logoUrl}
                            alt="School Logo"
                            className="w-12 h-12 object-cover rounded-full border border-slate-300 dark:border-slate-700 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 dark:border-slate-850 flex items-center justify-center text-slate-400 font-mono text-[9px] text-center leading-tight bg-slate-50 dark:bg-slate-950">
                            Default Logo
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          id="schoolLogoUploadInput"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              resizeImage(file, 1200, 1200, 0.95).then((url) => {
                                setSchoolConfig({ ...schoolConfig, logoUrl: url });
                              }).catch(e => console.error("Compression failed", e));
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('schoolLogoUploadInput')?.click()}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-xs flex items-center gap-1.5"
                        >
                          📤 Upload Logo
                        </button>
                        {schoolConfig.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setSchoolConfig({ ...schoolConfig, logoUrl: "" })}
                            className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste image URL (या लोगो का डायरेक्ट लिंक डालें)"
                        value={schoolConfig.logoUrl || ""}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, logoUrl: e.target.value })}
                        className="w-full mt-1.5 p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-650 dark:text-slate-300 block mb-1">
                        Principal Signature (प्रिंसिपल का हस्ताक्षर - पारदर्शी PNG)
                      </label>
                      <div className="flex items-center gap-3">
                        {schoolConfig.principalSignatureUrl ? (
                          <div className="p-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded">
                            <img
                              src={schoolConfig.principalSignatureUrl}
                              alt="Principal Signature"
                              className="w-16 h-8 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-8 rounded border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 text-[9px] text-center leading-tight bg-slate-50 dark:bg-slate-950">
                            No Sign
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/png"
                          id="principalSignatureUploadInput"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== "image/png") {
                                alert("Please upload a transparent .png format signature to avoid background errors! (कृपया पारदर्शी .png सिग्नेचर अपलोड करें)");
                              }
                              resizeImage(file, 600, 300, 0.95).then((url) => {
                                setSchoolConfig({ ...schoolConfig, principalSignatureUrl: url });
                              }).catch(e => console.error("Compression failed", e));
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('principalSignatureUploadInput')?.click()}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-[10px] flex items-center gap-1"
                        >
                          📤 Upload Signature (सिग्नेचर)
                        </button>
                        {schoolConfig.principalSignatureUrl && (
                          <button
                            type="button"
                            onClick={() => setSchoolConfig({ ...schoolConfig, principalSignatureUrl: "" })}
                            className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste signature image URL (हस्ताक्षर का लिंक डालें)"
                        value={schoolConfig.principalSignatureUrl || ""}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, principalSignatureUrl: e.target.value })}
                        className="w-full mt-1.5 p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-650 dark:text-slate-300 block mb-1">
                        Madrasa Stamp / Seal (मदरसा मुहर / स्टैम्प - पारदर्शी PNG)
                      </label>
                      <div className="flex items-center gap-3">
                        {schoolConfig.schoolStampUrl ? (
                          <div className="p-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded">
                            <img
                              src={schoolConfig.schoolStampUrl}
                              alt="Madrasa Stamp"
                              className="w-12 h-12 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 text-[9px] text-center leading-tight bg-slate-50 dark:bg-slate-950">
                            No Stamp
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/png"
                          id="schoolStampUploadInput"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== "image/png") {
                                alert("Please upload a transparent .png format stamp to avoid background errors! (कृपया पारदर्शी .png स्टैम्प अपलोड करें)");
                              }
                              resizeImage(file, 600, 600, 0.95).then((url) => {
                                setSchoolConfig({ ...schoolConfig, schoolStampUrl: url });
                              }).catch(e => console.error("Compression failed", e));
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('schoolStampUploadInput')?.click()}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-[10px] flex items-center gap-1"
                        >
                          📤 Upload Stamp (मुहर)
                        </button>
                        {schoolConfig.schoolStampUrl && (
                          <button
                            type="button"
                            onClick={() => setSchoolConfig({ ...schoolConfig, schoolStampUrl: "" })}
                            className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste stamp image URL (मुहर का लिंक डालें)"
                        value={schoolConfig.schoolStampUrl || ""}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, schoolStampUrl: e.target.value })}
                        className="w-full mt-1.5 p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-650 dark:text-slate-300 block mb-1">
                        Result Card / Marksheet Custom Crest Logo (मार्कशीट का गोल लोगो - पारदर्शी PNG)
                      </label>
                      <div className="flex items-center gap-3">
                        {schoolConfig.marksheetLogo ? (
                          <div className="p-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded">
                            <img
                              src={schoolConfig.marksheetLogo}
                              alt="Marksheet Logo"
                              className="w-12 h-12 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 text-[9px] text-center leading-tight bg-slate-50 dark:bg-slate-950">
                            Default Logo
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/png"
                          id="schoolMarksheetLogoUploadInput"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== "image/png") {
                                alert("Please upload a transparent .png format logo only to avoid background errors! (कृपया पारदर्शी .png लोगो अपलोड करें)");
                              }
                              resizeImage(file, 1200, 1200, 0.95).then((url) => {
                                setSchoolConfig({ ...schoolConfig, marksheetLogo: url });
                                setAdminSchoolLogo(url);
                                localStorage.setItem("m_logo", url);
                              }).catch(e => console.error("Compression failed", e));
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('schoolMarksheetLogoUploadInput')?.click()}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-[10px] flex items-center gap-1"
                        >
                          📤 Upload Logo (लोगो)
                        </button>
                        {schoolConfig.marksheetLogo && (
                          <button
                            type="button"
                            onClick={() => {
                              setSchoolConfig({ ...schoolConfig, marksheetLogo: "" });
                              setAdminSchoolLogo("");
                              localStorage.removeItem("m_logo");
                            }}
                            className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste marksheet logo image URL (लोगो का लिंक डालें)"
                        value={schoolConfig.marksheetLogo || ""}
                        onChange={(e) => {
                          setSchoolConfig({ ...schoolConfig, marksheetLogo: e.target.value });
                          setAdminSchoolLogo(e.target.value);
                          localStorage.setItem("m_logo", e.target.value);
                        }}
                        className="w-full mt-1.5 p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-650 dark:text-slate-300 block mb-1">
                        Result Card / Marksheet Urdu Calligraphy Banner (मार्कशीट का उर्दू बैनर - पारदर्शी PNG)
                      </label>
                      <div className="flex items-center gap-3">
                        {schoolConfig.calligraphyBanner ? (
                          <div className="p-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded">
                            <img
                              src={schoolConfig.calligraphyBanner}
                              alt="Marksheet Banner"
                              className="w-24 h-12 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-12 rounded border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 text-[9px] text-center leading-tight bg-slate-50 dark:bg-slate-950">
                            Default Banner
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/png"
                          id="schoolMarksheetBannerUploadInput"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== "image/png") {
                                alert("Please upload a transparent .png format Urdu calligraphy banner only! (कृपया पारदर्शी .png उर्दू बैनर अपलोड करें)");
                              }
                              resizeImage(file, 1600, 600, 0.95).then((url) => {
                                setSchoolConfig({ ...schoolConfig, calligraphyBanner: url });
                                setAdminUrduLogo(url);
                                localStorage.setItem("m_urdu_logo", url);
                              }).catch(e => console.error("Compression failed", e));
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('schoolMarksheetBannerUploadInput')?.click()}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-[10px] flex items-center gap-1"
                        >
                          📤 Upload Banner (बैनर)
                        </button>
                        {schoolConfig.calligraphyBanner && (
                          <button
                            type="button"
                            onClick={() => {
                              setSchoolConfig({ ...schoolConfig, calligraphyBanner: "" });
                              setAdminUrduLogo("");
                              localStorage.removeItem("m_urdu_logo");
                            }}
                            className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste marksheet banner image URL (बैनर का लिंक डालें)"
                        value={schoolConfig.calligraphyBanner || ""}
                        onChange={(e) => {
                          setSchoolConfig({ ...schoolConfig, calligraphyBanner: e.target.value });
                          setAdminUrduLogo(e.target.value);
                          localStorage.setItem("m_urdu_logo", e.target.value);
                        }}
                        className="w-full mt-1.5 p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="font-bold text-slate-600 dark:text-slate-300">Principal Desk Message (Greetings address)</label>
                      <textarea
                        rows={4}
                        value={schoolConfig.principalMessage}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, principalMessage: e.target.value })}
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-white font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-amber-700 dark:text-amber-400">Campus Contact Hotline / संपर्क फोन नंबर (e.g. +91 9193984452)</label>
                      <input
                        type="text"
                        value={schoolConfig.contactPhone}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, contactPhone: e.target.value })}
                        className="w-full p-2.5 border-amber-400/60 dark:border-slate-800 rounded-lg bg-amber-50/10 dark:bg-slate-950 text-slate-805 dark:text-white font-mono font-bold"
                        placeholder="+91 9193984452"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">Campus Official Mail</label>
                      <input
                        type="text"
                        value={schoolConfig.contactEmail}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, contactEmail: e.target.value })}
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">Institutional Physical Address</label>
                      <input
                        type="text"
                        value={schoolConfig.address}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, address: e.target.value })}
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-855 dark:text-white font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">WhatsApp Chat Hotline (with country code)</label>
                      <input
                        type="text"
                        value={schoolConfig.whatsappNumber}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, whatsappNumber: e.target.value })}
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-855 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 1.5: HEADER MENU & NAVIGATION CONFIG */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                  <h4 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
                    🧭 Top Header Menu & Navigation Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700">
                    {[
                      { id: 'Home', label: 'Home Page' },
                      { id: 'Dua', label: 'Daily Duas' },
                      { id: 'Results', label: 'Exam Results' },
                      { id: 'Admissions', label: 'Admissions' },
                      { id: 'Donate', label: 'Donate' },
                      { id: 'Dashboard', label: 'Principal Panel' },
                    ].map((nav) => (
                      <div key={nav.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-3">
                        <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          {nav.label} Menu
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder={`${nav.label} Custom Text`}
                            value={(schoolConfig as any)[`navMenu${nav.id}Text`] || ""}
                            onChange={(e) => setSchoolConfig({ ...schoolConfig, [`navMenu${nav.id}Text`]: e.target.value })}
                            className="w-full p-2 border border-slate-250 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                          />
                          <div className="flex items-center gap-3">
                            {(schoolConfig as any)[`navMenu${nav.id}Icon`] && (
                              <img
                                src={(schoolConfig as any)[`navMenu${nav.id}Icon`]}
                                alt={`${nav.label} Custom Photo`}
                                className="w-8 h-8 object-cover rounded-full border border-slate-300 shadow-sm"
                              />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              id={`navMenu${nav.id}UploadInput`}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  resizeImage(file, 200, 200, 0.7).then((url) => {
                                    setSchoolConfig({ ...schoolConfig, [`navMenu${nav.id}Icon`]: url });
                                  }).catch(err => console.error("Compression failed", err));
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById(`navMenu${nav.id}UploadInput`)?.click()}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded cursor-pointer transition text-[10px]"
                            >
                              📤 Upload Photo
                            </button>
                            {(schoolConfig as any)[`navMenu${nav.id}Icon`] && (
                              <button
                                type="button"
                                onClick={() => setSchoolConfig({ ...schoolConfig, [`navMenu${nav.id}Icon`]: "" })}
                                className="text-[10px] text-rose-500 font-extrabold uppercase hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 2: HERO SLIDER IMAGES & COUNTER STATISTICS */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                  <h4 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
                    🖼️ Hero Sliders & Institutional Dynamic Metrics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
                    <div className="space-y-1 bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850 flex flex-col justify-between">
                      <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Hero Slider Image 1 (स्लाइडर १ फोटो)</label>
                      <div className="flex items-center gap-3 mt-1">
                        {schoolConfig.heroBg1 && (
                          <img
                            src={schoolConfig.heroBg1}
                            alt="Slider 1"
                            className="w-16 h-10 object-cover rounded border border-slate-300 dark:border-slate-700 shadow-sm"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          id="heroBg1UploadInput"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              resizeImage(file, 800, 800, 0.6).then((url) => {
                                setSchoolConfig({ ...schoolConfig, heroBg1: url });
                              }).catch(e => console.error("Compression failed", e));
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('heroBg1UploadInput')?.click()}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-[11px] flex items-center gap-1"
                        >
                          📤 Select Image
                        </button>
                        {schoolConfig.heroBg1 && (
                          <button
                            type="button"
                            onClick={() => setSchoolConfig({ ...schoolConfig, heroBg1: "" })}
                            className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
  <input
    type="text"
    placeholder="Or paste image URL (या डायरेक्ट लिंक डालें)"
    value={schoolConfig.heroBg1 || ""}
    onChange={(e) => setSchoolConfig({ ...schoolConfig, heroBg1: e.target.value })}
    className="w-full mt-2 p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-xs font-mono"
  />
                    </div>

                    <div className="space-y-1 bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850 flex flex-col justify-between">
                      <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Hero Slider Image 2 (स्लाइडर २ फोटो)</label>
                      <div className="flex items-center gap-3 mt-1">
                        {schoolConfig.heroBg2 && (
                          <img
                            src={schoolConfig.heroBg2}
                            alt="Slider 2"
                            className="w-16 h-10 object-cover rounded border border-slate-300 dark:border-slate-700 shadow-sm"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          id="heroBg2UploadInput"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              resizeImage(file, 800, 800, 0.6).then((url) => {
                                setSchoolConfig({ ...schoolConfig, heroBg2: url });
                              }).catch(e => console.error("Compression failed", e));
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('heroBg2UploadInput')?.click()}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-[11px] flex items-center gap-1"
                        >
                          📤 Select Image
                        </button>
                        {schoolConfig.heroBg2 && (
                          <button
                            type="button"
                            onClick={() => setSchoolConfig({ ...schoolConfig, heroBg2: "" })}
                            className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
  <input
    type="text"
    placeholder="Or paste image URL (या डायरेक्ट लिंक डालें)"
    value={schoolConfig.heroBg2 || ""}
    onChange={(e) => setSchoolConfig({ ...schoolConfig, heroBg2: e.target.value })}
    className="w-full mt-2 p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-xs font-mono"
  />
                    </div>

                    <div className="space-y-1 bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850 flex flex-col justify-between">
                      <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Hero Slider Image 3 (स्लाइडर ३ फोटो)</label>
                      <div className="flex items-center gap-3 mt-1">
                        {schoolConfig.heroBg3 && (
                          <img
                            src={schoolConfig.heroBg3}
                            alt="Slider 3"
                            className="w-16 h-10 object-cover rounded border border-slate-300 dark:border-slate-700 shadow-sm"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          id="heroBg3UploadInput"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              resizeImage(file, 800, 800, 0.6).then((url) => {
                                setSchoolConfig({ ...schoolConfig, heroBg3: url });
                              }).catch(e => console.error("Compression failed", e));
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('heroBg3UploadInput')?.click()}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-[11px] flex items-center gap-1"
                        >
                          📤 Select Image
                        </button>
                        {schoolConfig.heroBg3 && (
                          <button
                            type="button"
                            onClick={() => setSchoolConfig({ ...schoolConfig, heroBg3: "" })}
                            className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
  <input
    type="text"
    placeholder="Or paste image URL (या डायरेक्ट लिंक डालें)"
    value={schoolConfig.heroBg3 || ""}
    onChange={(e) => setSchoolConfig({ ...schoolConfig, heroBg3: e.target.value })}
    className="w-full mt-2 p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-xs font-mono"
  />
                    </div>
                  </div>


                </div>

                {/* SECTION 5: CAMPUS FACILITIES */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 col-span-2">
                  <h4 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
                    🏢 Smart Campus Facilities
                  </h4>
                  <div className="space-y-4 text-xs">
                    {/* Facility 1 */}
                    <div className="border p-4 rounded-xl bg-slate-50/40 dark:bg-slate-950 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1 space-y-2">
                        <strong className="font-extrabold text-emerald-600 block uppercase">Facility #1 (Library)</strong>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold">Facility Title</label>
                          <input
                            type="text"
                            value={schoolConfig.fac1Title || ""}
                            onChange={(e) => setSchoolConfig({ ...schoolConfig, fac1Title: e.target.value })}
                            className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">Facility Banner Image (फोटो)</label>
                          <div className="flex items-center gap-2">
                            {schoolConfig.fac1Img && (
                              <img
                                src={schoolConfig.fac1Img}
                                alt="Facility 1"
                                className="w-12 h-10 object-cover rounded border border-slate-300 dark:border-slate-705 shadow-sm"
                              />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              id="fac1ImgUploadInput"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  resizeImage(file, 800, 800, 0.6).then((url) => {
                                setSchoolConfig({ ...schoolConfig, fac1Img: url });
                              }).catch(e => console.error("Compression failed", e));
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById('fac1ImgUploadInput')?.click()}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg cursor-pointer text-[10px] flex items-center gap-1"
                            >
                              📤 Upload
                            </button>
                            {schoolConfig.fac1Img && (
                              <button
                                type="button"
                                onClick={() => setSchoolConfig({ ...schoolConfig, fac1Img: "" })}
                                className="text-[9px] text-rose-500 font-extrabold uppercase hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
  <input
    type="text"
    placeholder="Or paste image URL (या डायरेक्ट लिंक डालें)"
    value={schoolConfig.fac1Img || ""}
    onChange={(e) => setSchoolConfig({ ...schoolConfig, fac1Img: e.target.value })}
    className="w-full mt-2 p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-xs font-mono"
  />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold block">Facility Narrative / description</label>
                        <textarea
                          rows={4}
                          value={schoolConfig.fac1Text || ""}
                          onChange={(e) => setSchoolConfig({ ...schoolConfig, fac1Text: e.target.value })}
                          className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    {/* Facility 2 */}
                    <div className="border p-4 rounded-xl bg-slate-50/40 dark:bg-slate-950 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1 space-y-2">
                        <strong className="font-extrabold text-emerald-600 block uppercase">Facility #2 (IT Lab)</strong>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold">Facility Title</label>
                          <input
                            type="text"
                            value={schoolConfig.fac2Title || ""}
                            onChange={(e) => setSchoolConfig({ ...schoolConfig, fac2Title: e.target.value })}
                            className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">Facility Banner Image (फोटो)</label>
                          <div className="flex items-center gap-2">
                            {schoolConfig.fac2Img && (
                              <img
                                src={schoolConfig.fac2Img}
                                alt="Facility 2"
                                className="w-12 h-10 object-cover rounded border border-slate-300 dark:border-slate-705 shadow-sm"
                              />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              id="fac2ImgUploadInput"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  resizeImage(file, 800, 800, 0.6).then((url) => {
                                setSchoolConfig({ ...schoolConfig, fac2Img: url });
                              }).catch(e => console.error("Compression failed", e));
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById('fac2ImgUploadInput')?.click()}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg cursor-pointer text-[10px] flex items-center gap-1"
                            >
                              📤 Upload
                            </button>
                            {schoolConfig.fac2Img && (
                              <button
                                type="button"
                                onClick={() => setSchoolConfig({ ...schoolConfig, fac2Img: "" })}
                                className="text-[9px] text-rose-500 font-extrabold uppercase hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
  <input
    type="text"
    placeholder="Or paste image URL (या डायरेक्ट लिंक डालें)"
    value={schoolConfig.fac2Img || ""}
    onChange={(e) => setSchoolConfig({ ...schoolConfig, fac2Img: e.target.value })}
    className="w-full mt-2 p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-xs font-mono"
  />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold block">Facility Narrative / description</label>
                        <textarea
                          rows={4}
                          value={schoolConfig.fac2Text || ""}
                          onChange={(e) => setSchoolConfig({ ...schoolConfig, fac2Text: e.target.value })}
                          className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    {/* Facility 3 */}
                    <div className="border p-4 rounded-xl bg-slate-50/40 dark:bg-slate-950 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1 space-y-2">
                        <strong className="font-extrabold text-emerald-600 block uppercase">Facility #3 (Sports Ground)</strong>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold">Facility Title</label>
                          <input
                            type="text"
                            value={schoolConfig.fac3Title || ""}
                            onChange={(e) => setSchoolConfig({ ...schoolConfig, fac3Title: e.target.value })}
                            className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">Facility Banner Image (फोटो)</label>
                          <div className="flex items-center gap-2">
                            {schoolConfig.fac3Img && (
                              <img
                                src={schoolConfig.fac3Img}
                                alt="Facility 3"
                                className="w-12 h-10 object-cover rounded border border-slate-300 dark:border-slate-705 shadow-sm"
                              />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              id="fac3ImgUploadInput"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  resizeImage(file, 800, 800, 0.6).then((url) => {
                                setSchoolConfig({ ...schoolConfig, fac3Img: url });
                              }).catch(e => console.error("Compression failed", e));
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById('fac3ImgUploadInput')?.click()}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg cursor-pointer text-[10px] flex items-center gap-1"
                            >
                              📤 Upload
                            </button>
                            {schoolConfig.fac3Img && (
                              <button
                                type="button"
                                onClick={() => setSchoolConfig({ ...schoolConfig, fac3Img: "" })}
                                className="text-[9px] text-rose-500 font-extrabold uppercase hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
  <input
    type="text"
    placeholder="Or paste image URL (या डायरेक्ट लिंक डालें)"
    value={schoolConfig.fac3Img || ""}
    onChange={(e) => setSchoolConfig({ ...schoolConfig, fac3Img: e.target.value })}
    className="w-full mt-2 p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-xs font-mono"
  />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold block">Facility Narrative / description</label>
                        <textarea
                          rows={4}
                          value={schoolConfig.fac3Text || ""}
                          onChange={(e) => setSchoolConfig({ ...schoolConfig, fac3Text: e.target.value })}
                          className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 6: DETAILED MARQUEES, TOPPERS, MOTTO & FOOTER CONFIGURATION */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                  <h4 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
                    ✍️ Headers, Mottos, Hall of Honor & Footer Config
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700 dark:text-slate-200">
                    {/* Header Announcement */}
                    <div className="space-y-1 col-span-2">
                      <label className="font-bold text-amber-700 dark:text-amber-400">Top Amber Bar Banner ALERT Text / प्रवेश सूचना पट्टी (e.g. ADMISSION 2026: Online Applications Open)</label>
                      <input
                        type="text"
                        value={schoolConfig.admissionNotice || ""}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, admissionNotice: e.target.value })}
                        className="w-full p-2.5 border-amber-450 dark:border-slate-800 rounded-lg bg-amber-50/10 dark:bg-slate-950 font-bold"
                        placeholder="ADMISSION 2026: Online Applications Open"
                      />
                    </div>

                    {/* Established Year & Principal Extras */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">Established Year Text</label>
                      <input
                        type="text"
                        value={schoolConfig.establishedYear || ""}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, establishedYear: e.target.value })}
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950"
                        placeholder="Est. 1994"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">Principal Subtitle Line</label>
                      <input
                        type="text"
                        value={schoolConfig.principalSub || ""}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, principalSub: e.target.value })}
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950"
                        placeholder="Sheikh-ul-Hadith & Mufti"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">Principal Desk Title Heading</label>
                      <input
                        type="text"
                        value={schoolConfig.principalTitleHeading || ""}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, principalTitleHeading: e.target.value })}
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950"
                        placeholder="Message from Hazrat Maulana's desk"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">Principal Desk Authorized Label (Ledger tag)</label>
                      <input
                        type="text"
                        value={schoolConfig.principalLedgerTag || ""}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, principalLedgerTag: e.target.value })}
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-[10px]"
                        placeholder="Authorized Institution Ledger 2026"
                      />
                    </div>

                    {/* Hall of honor toppers */}
                    <div className="col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <strong className="text-emerald-700 dark:text-emerald-400 block mb-3 uppercase tracking-wider text-[11px]">🏆 Hall of Honor - Dynamic Toppers:</strong>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Topper 1 */}
                        <div className="space-y-2 p-3 bg-amber-50/20 dark:bg-slate-950/20 border border-amber-500/20 rounded-xl flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="font-extrabold text-amber-600 block text-[9px] uppercase tracking-wider">Topper 1 Heading (श्रेणी/शीर्षक)</label>
                              <input
                                type="text"
                                value={schoolConfig.topper1Heading || ""}
                                onChange={(e) => setSchoolConfig({ ...schoolConfig, topper1Heading: e.target.value })}
                                className="w-full p-1 border border-amber-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-bold text-[10px]"
                                placeholder="Topper #1 (First Place)"
                              />
                            </div>
                            <input
                              type="text"
                              value={schoolConfig.topper1Name || ""}
                              onChange={(e) => setSchoolConfig({ ...schoolConfig, topper1Name: e.target.value })}
                              className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-bold"
                              placeholder="Name"
                            />
                            <input
                              type="text"
                              value={schoolConfig.topper1Badge || ""}
                              onChange={(e) => setSchoolConfig({ ...schoolConfig, topper1Badge: e.target.value })}
                              className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[10px]"
                              placeholder="Score / Badge Details"
                            />
                            <textarea
                              rows={2}
                              value={schoolConfig.topper1Blurb || ""}
                              onChange={(e) => setSchoolConfig({ ...schoolConfig, topper1Blurb: e.target.value })}
                              className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[10px]"
                              placeholder="Blurb/Message description"
                            />
                          </div>
                        </div>
                        {/* Topper 2 */}
                        <div className="space-y-2 p-3 bg-emerald-50/20 dark:bg-slate-950/20 border border-emerald-500/20 rounded-xl flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="font-extrabold text-emerald-600 block text-[9px] uppercase tracking-wider">Topper 2 Heading (श्रेणी/शीर्षक)</label>
                              <input
                                type="text"
                                value={schoolConfig.topper2Heading || ""}
                                onChange={(e) => setSchoolConfig({ ...schoolConfig, topper2Heading: e.target.value })}
                                className="w-full p-1 border border-emerald-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-bold text-[10px]"
                                placeholder="Topper #2 (Saba Top)"
                              />
                            </div>
                            <input
                              type="text"
                              value={schoolConfig.topper2Name || ""}
                              onChange={(e) => setSchoolConfig({ ...schoolConfig, topper2Name: e.target.value })}
                              className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-bold"
                              placeholder="Name"
                            />
                            <input
                              type="text"
                              value={schoolConfig.topper2Badge || ""}
                              onChange={(e) => setSchoolConfig({ ...schoolConfig, topper2Badge: e.target.value })}
                              className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[10px]"
                              placeholder="Score / Badge Details"
                            />
                            <textarea
                              rows={2}
                              value={schoolConfig.topper2Blurb || ""}
                              onChange={(e) => setSchoolConfig({ ...schoolConfig, topper2Blurb: e.target.value })}
                              className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[10px]"
                              placeholder="Blurb/Message description"
                            />
                          </div>
                        </div>
                        {/* Topper 3 */}
                        <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-500/20 rounded-xl flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-550 block text-[9px] uppercase tracking-wider">Topper 3 Heading (श्रेणी/शीर्षक)</label>
                              <input
                                type="text"
                                value={schoolConfig.topper3Heading || ""}
                                onChange={(e) => setSchoolConfig({ ...schoolConfig, topper3Heading: e.target.value })}
                                className="w-full p-1 border border-slate-350 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-bold text-[10px]"
                                placeholder="Topper #3 (Aalim Topper)"
                              />
                            </div>
                            <input
                              type="text"
                              value={schoolConfig.topper3Name || ""}
                              onChange={(e) => setSchoolConfig({ ...schoolConfig, topper3Name: e.target.value })}
                              className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-bold"
                              placeholder="Name"
                            />
                            <input
                              type="text"
                              value={schoolConfig.topper3Badge || ""}
                              onChange={(e) => setSchoolConfig({ ...schoolConfig, topper3Badge: e.target.value })}
                              className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[10px]"
                              placeholder="Score / Badge Details"
                            />
                            <textarea
                              rows={2}
                              value={schoolConfig.topper3Blurb || ""}
                              onChange={(e) => setSchoolConfig({ ...schoolConfig, topper3Blurb: e.target.value })}
                              className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[10px]"
                              placeholder="Blurb/Message description"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer text boxes */}
                    <div className="col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                      <strong className="text-emerald-700 dark:text-emerald-400 block uppercase tracking-wider text-[11px]">🌐 Footer Configurations:</strong>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-650 dark:text-slate-300">About Tab Narrative Text (Footer Area)</label>
                          <textarea
                            rows={3}
                            value={schoolConfig.aboutText || ""}
                            onChange={(e) => setSchoolConfig({ ...schoolConfig, aboutText: e.target.value })}
                            className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[11px]"
                            placeholder="Established in 1994, our Madrasa is dedicated to offering..."
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-655 dark:text-slate-300">Custom Footer Made-With Technical Credit Credit-Tag</label>
                          <input
                            type="text"
                            value={schoolConfig.footerCreditTag || ""}
                            onChange={(e) => setSchoolConfig({ ...schoolConfig, footerCreditTag: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-905"
                            placeholder="for Academic Excellence in Computer Lit & Ifta"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-emerald-800 dark:text-emerald-450">Student Logo Motto (Islamic Script Arabic Text)</label>
                          <input
                            type="text"
                            value={schoolConfig.mottoArabic || ""}
                            onChange={(e) => setSchoolConfig({ ...schoolConfig, mottoArabic: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-arabic text-center font-bold text-base"
                            placeholder="رَّبِّ زِدْنِي عِلْمًا"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-655 dark:text-slate-304">Student Logo Motto Translation (English Text)</label>
                          <input
                            type="text"
                            value={schoolConfig.mottoEnglish || ""}
                            onChange={(e) => setSchoolConfig({ ...schoolConfig, mottoEnglish: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[11px]"
                            placeholder='"O my Sustainer, increase me in knowledge." (Al-Quran - Surah Taha)'
                          />
                        </div>
                         <div className="space-y-1 md:col-span-2">
                          <label className="font-bold text-emerald-850 dark:text-emerald-400">Upar Visual Notice Scrolling Ticker Text (ऊपर का चलता हुआ मुख्य नोटिस बोर्ड टेक्स्ट)</label>
                          <textarea
                            rows={2}
                            value={schoolConfig.topMarqueeText || ""}
                            onChange={(e) => setSchoolConfig({ ...schoolConfig, topMarqueeText: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[11px]"
                            placeholder="Admission registration is completely paperless. Submit forms online now! ✦ Helpdesk Contact: +91 9193984452"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="font-bold text-emerald-800 dark:text-emerald-400">Niche Animating/Scrolling Banner Text (फुटर का चलता हुआ टेक्स्ट)</label>
                          <textarea
                            rows={2}
                            value={schoolConfig.bottomMarqueeText || ""}
                            onChange={(e) => setSchoolConfig({ ...schoolConfig, bottomMarqueeText: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[11px]"
                            placeholder="EXCELLENCE IN ISLAMIC TA'LEEM & DIGITAL EDUCATION ✦ ADMISSIONS OPEN FOR SESSION 2026-2027"
                          />
                        </div>

                        {/* Madrasa Donation details form block */}
                        <div className="col-span-2 border-t border-slate-200 dark:border-slate-800 pt-5 mt-3 space-y-4">
                          <strong className="text-emerald-700 dark:text-emerald-450 block uppercase tracking-wider text-xs flex items-center gap-2 font-serif">
                            🪙 Madrasa Help & Donation (सदाक़ा / ज़कात - बैंक खाता और QR कोड) Settings
                          </strong>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-650 dark:text-slate-300 block text-[11px]">Bank Name (बैंक का नाम)</label>
                              <input
                                type="text"
                                value={schoolConfig.bankName || ""}
                                onChange={(e) => setSchoolConfig({ ...schoolConfig, bankName: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                                placeholder="State Bank of India (SBI)"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-655 dark:text-slate-300 block text-[11px]">Account Holder Name (खाताधारक का नाम)</label>
                              <input
                                type="text"
                                value={schoolConfig.accountName || ""}
                                onChange={(e) => setSchoolConfig({ ...schoolConfig, accountName: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                                placeholder="MADRASA ARABIA NOORUL ULOOM"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-655 dark:text-slate-300 block text-[11px]">Account Number (खाता संख्या)</label>
                              <input
                                type="text"
                                value={schoolConfig.accountNumber || ""}
                                onChange={(e) => setSchoolConfig({ ...schoolConfig, accountNumber: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                                placeholder="38920192831"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-655 dark:text-slate-300 block text-[11px]">IFSC Code (आईएफएससी कोड)</label>
                              <input
                                type="text"
                                value={schoolConfig.ifscCode || ""}
                                onChange={(e) => setSchoolConfig({ ...schoolConfig, ifscCode: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-mono text-xs font-semibold text-slate-800 dark:text-slate-100"
                                placeholder="SBIN0001234"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-655 dark:text-slate-300 block text-[11px]">UPI ID / VPA (यूपीआई आईडी)</label>
                              <input
                                type="text"
                                value={schoolConfig.upiId || ""}
                                onChange={(e) => setSchoolConfig({ ...schoolConfig, upiId: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                                placeholder="madrasanoorululoom@sbi"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-655 dark:text-slate-350 block text-[11px]">Madrasa Donation QR Code (QR कोड)</label>
                              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                                {schoolConfig.qrCodeUrl ? (
                                  <img
                                    src={schoolConfig.qrCodeUrl}
                                    alt="Donation QR preview"
                                    referrerPolicy="no-referrer"
                                    className="w-12 h-12 object-contain rounded border border-slate-300 dark:border-slate-705 shadow-sm bg-white"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded border border-slate-300 dark:border-slate-750 flex items-center justify-center text-[9px] bg-slate-100 dark:bg-slate-950 text-slate-400 font-bold">No QR</div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  id="qrImgUploadInput"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      resizeImage(file, 800, 800, 0.6).then((url) => {
                                setSchoolConfig({ ...schoolConfig, qrCodeUrl: url });
                              }).catch(e => console.error("Compression failed", e));
                                    }
                                  }}
                                />
                                <div className="flex flex-col gap-1">
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById('qrImgUploadInput')?.click()}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded text-[9px] cursor-pointer"
                                  >
                                    📤 UPLOAD
                                  </button>
                                  {schoolConfig.qrCodeUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setSchoolConfig({ ...schoolConfig, qrCodeUrl: "" })}
                                      className="text-[9px] text-rose-500 font-extrabold uppercase hover:underline cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Donation Page custom texts */}
                            <div className="space-y-1 md:col-span-2 lg:col-span-3 border-t border-dashed border-slate-250 dark:border-slate-800 pt-4 mt-2">
                              <strong className="text-[11px] text-emerald-800 dark:text-emerald-450 block uppercase tracking-wider">
                                📢 Custom Donation Section Texts (सहयोग पेज के टेक्स्ट बदलें)
                              </strong>
                            </div>
                            <div className="space-y-1 md:col-span-1 lg:col-span-1">
                              <label className="font-bold text-slate-655 dark:text-slate-350 block text-[11px]">Donation Section Title (दान / सहयोग बॉक्स का मुख्य शीर्षक)</label>
                              <input
                                type="text"
                                value={schoolConfig.donateSectionTitle || ""}
                                onChange={(e) => setSchoolConfig({ ...schoolConfig, donateSectionTitle: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                                placeholder="Support Our Noble Cause (मदरसा की इमदाद करें)"
                              />
                            </div>
                            <div className="space-y-1 md:col-span-2 lg:col-span-2">
                              <label className="font-bold text-slate-655 dark:text-slate-355 block text-[11px]">Donation Section Subtitle (मुख्य विवरण नीचे वाला)</label>
                              <input
                                type="text"
                                value={schoolConfig.donateSectionSubtitle || ""}
                                onChange={(e) => setSchoolConfig({ ...schoolConfig, donateSectionSubtitle: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                                placeholder="अनाथ, गरीब एवं असहाय बच्चों की निःशुल्क दीनी तालीम..."
                              />
                            </div>
                            <div className="space-y-1 md:col-span-1 lg:col-span-1">
                              <label className="font-bold text-slate-655 dark:text-slate-350 block text-[11px]">"Why Support Us" Heading ("हमे सहयोग क्यों करें" हेडिंग)</label>
                              <input
                                type="text"
                                value={schoolConfig.whySupportHeading || ""}
                                onChange={(e) => setSchoolConfig({ ...schoolConfig, whySupportHeading: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                                placeholder="Why Support Us? (सहयोग करें)"
                              />
                            </div>
                            <div className="space-y-1 md:col-span-2 lg:col-span-2">
                              <label className="font-bold text-slate-655 dark:text-slate-355 block text-[11px]">"Why Support Us" Description Text (सहयोग करने का विवरण)</label>
                              <textarea
                                rows={2}
                                value={schoolConfig.whySupportText || ""}
                                onChange={(e) => setSchoolConfig({ ...schoolConfig, whySupportText: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[11px] text-slate-850 dark:text-slate-100 font-semibold"
                                placeholder="Our Madrasa provides free housing, uniforms, study materials..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                  <h4 className="text-sm font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
                    📊 Google Sheets Integration (Auto-Sync)
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    To save records automatically without a login popup, create a Google Apps Script Web App that accepts POST requests, and paste the URL below. You can also specify different URLs for different academic sessions (e.g., 2026-2027).
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-300">Default Webhook URL (Fallback)</label>
                      <input
                        type="url"
                        value={schoolConfig.googleSheetsWebhookUrl || ""}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, googleSheetsWebhookUrl: e.target.value })}
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-mono text-xs"
                        placeholder="https://script.google.com/macros/s/AKfycby.../exec"
                      />
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <label className="font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                        Year-Wise Webhooks
                        <button
                          type="button"
                          onClick={() => {
                            const newWebhooks = [...(schoolConfig.googleSheetsWebhooks || []), { year: '', url: '' }];
                            setSchoolConfig({ ...schoolConfig, googleSheetsWebhooks: newWebhooks });
                          }}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          + Add Session Year
                        </button>
                      </label>
                      {schoolConfig.googleSheetsWebhooks?.map((wh, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                          <input
                            type="text"
                            placeholder="Session (e.g., 2026-2027)"
                            value={wh.year}
                            onChange={(e) => {
                              const newWebhooks = [...(schoolConfig.googleSheetsWebhooks || [])];
                              newWebhooks[idx].year = e.target.value;
                              setSchoolConfig({ ...schoolConfig, googleSheetsWebhooks: newWebhooks });
                            }}
                            className="w-1/3 p-2 border border-slate-250 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-xs"
                          />
                          <input
                            type="url"
                            placeholder="Webhook URL"
                            value={wh.url}
                            onChange={(e) => {
                              const newWebhooks = [...(schoolConfig.googleSheetsWebhooks || [])];
                              newWebhooks[idx].url = e.target.value;
                              setSchoolConfig({ ...schoolConfig, googleSheetsWebhooks: newWebhooks });
                            }}
                            className="w-full p-2 border border-slate-250 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newWebhooks = [...(schoolConfig.googleSheetsWebhooks || [])];
                              newWebhooks.splice(idx, 1);
                              setSchoolConfig({ ...schoolConfig, googleSheetsWebhooks: newWebhooks });
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex max-w-sm gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Are you sure you want to sync ALL ${results.length} results to Google Sheets? This might take a moment.`)) return;
                        
                        let success = 0;
                        let errs = 0;
                        for (const result of results) {
                          try {
                            const whList = schoolConfig.googleSheetsWebhooks || [];
                            const specific = whList.find(w => w.year === result.session || w.year === String(result.passingYear));
                            const webhookUrl = specific?.url || schoolConfig.googleSheetsWebhookUrl || "https://script.google.com/macros/s/AKfycbzlXCkVwXgVQPqgAm3qbUsPZTrWAYeaZg_BLyj7ozCt3C7Ns1Y-teOFVcyA9esIqQA-tw/exec";
                            
                            if (!webhookUrl) continue;
                            
                            await fetch(webhookUrl, {
                              method: 'POST',
                              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                              body: JSON.stringify(result)
                            });
                            success++;
                          } catch (e) {
                            errs++;
                            console.error("Sync error:", e);
                          }
                        }
                        alert(`Sync Complete!\nSuccessfully exported: ${success}\nErrors: ${errs}`);
                      }}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer transition-colors"
                    >
                      Sync ALL Results to Google Sheets
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-emerald-650 to-teal-700 hover:from-emerald-700 hover:to-teal-850 text-white rounded-xl text-xs font-bold font-mono tracking-widest uppercase cursor-pointer transition-all shadow-lg active:scale-95"
                  >
                    Save All Site Parameters
                  </button>
                </div>
              </form>

              {/* SPECIAL SYSTEM: Dynamic Class & Subject Configuration */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                
                {/* 1. SECTION FOR ADDING, RENAMING & DELETING CLASSES */}
                <div className="border-b border-slate-200 dark:border-slate-850 pb-6 space-y-4">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" /> Madrasa Classes Setup & Management (कक्षा सेटअप और प्रबंधन)
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Configure the list of classes in the Madrasa. If you add, rename, or delete classes here, they will automatically be updated across all students, registrations, marksheets, and report files throughout the entire software.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add class card block */}
                    <div className="bg-indigo-50/40 dark:bg-slate-900 border border-indigo-100/60 dark:border-indigo-950 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-indigo-600" /> Create New Class (नई कक्षा जोड़ें)
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. 6TH A, 6TH B"
                          value={addClassInput}
                          onChange={(e) => setAddClassInput(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold text-xs focus:ring-1 focus:indigo-500 focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              createSchoolClass(addClassInput);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => createSchoolClass(addClassInput)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Setup
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Added classes will instantly load with standard defaults ready.
                      </p>
                    </div>

                    {/* Classes quick management table & actions */}
                    <div className="col-span-2 space-y-2">
                      <h4 className="text-xs font-bold text-slate-750 dark:text-slate-350">All Confirmed School Classes ({customClasses.length}):</h4>
                      <div className="border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 p-3 max-h-36 overflow-y-auto flex flex-wrap gap-2.5">
                        {customClasses.map((cls) => {
                          const isEditing = editingClassOldName === cls;
                          return (
                            <div
                              key={cls}
                              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all shadow-sm ${
                                isEditing 
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/20' 
                                  : classToDelete === cls
                                    ? 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/20'
                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingClassNewName}
                                    onChange={(e) => setEditingClassNewName(e.target.value)}
                                    className="w-24 px-1.5 py-0.5 border border-amber-400 rounded text-[11px] font-bold text-slate-850 dark:text-white dark:bg-slate-950 focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') renameSchoolClass(cls, editingClassNewName);
                                      if (e.key === 'Escape') setEditingClassOldName(null);
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => renameSchoolClass(cls, editingClassNewName)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="Save modification"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingClassOldName(null)}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : classToDelete === cls ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-rose-750 dark:text-rose-400">{cls}?</span>
                                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">Sure?</span>
                                  <div className="flex items-center gap-1 pl-1 border-l border-rose-200 dark:border-rose-900">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        deleteSchoolClass(cls);
                                        setClassToDelete(null);
                                      }}
                                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-extrabold cursor-pointer transition-colors"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setClassToDelete(null)}
                                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-150 rounded transition-colors"
                                      title="Cancel"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <span className="font-semibold">{cls}</span>
                                  <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingClassOldName(cls);
                                        setEditingClassNewName(cls);
                                      }}
                                      className="p-1 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                                      title={`Rename Class ${cls}`}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setClassToDelete(cls)}
                                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition-colors"
                                      title={`Delete Class ${cls}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. SECTION FOR ADDING, RENAMING & DELETING ACADEMIC SESSIONS / YEARS */}
                <div className="border-b border-slate-200 dark:border-slate-850 pb-6 space-y-4">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" /> Academic Years Setup & Management (शैक्षणिक वर्ष/सत्र प्रबंधन)
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Configure the list of academic sessions in the school. Adding, renaming, or deleting sessions here will update them instantly across all registration forms, results search, and administrative panel.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add session card block */}
                    <div className="bg-indigo-50/40 dark:bg-slate-900 border border-indigo-100/60 dark:border-indigo-950 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-400 font-mono tracking-wider uppercase flex items-center gap-1.55">
                        <PlusCircle className="w-4 h-4 text-indigo-600" /> Create New Session (नया सत्र जोड़ें)
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. 2026-2027"
                          value={addSessionInput}
                          onChange={(e) => setAddSessionInput(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold text-xs focus:ring-1 focus:indigo-500 focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              createSchoolSession(addSessionInput);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => createSchoolSession(addSessionInput)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Setup
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Format should be like YYYY-YYYY (e.g., 2026-2027).
                      </p>
                    </div>

                    {/* Sessions quick management list */}
                    <div className="col-span-2 space-y-2">
                      <h4 className="text-xs font-bold text-slate-750 dark:text-slate-350">All Academic Sessions ({customSessions.length}):</h4>
                      <div className="border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 p-3 max-h-36 overflow-y-auto flex flex-wrap gap-2.5">
                        {customSessions.map((sess) => {
                          const isEditing = editingSessionOldName === sess;
                          return (
                            <div
                              key={sess}
                              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all shadow-sm ${
                                isEditing 
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/20' 
                                  : sessionToDelete === sess
                                    ? 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/20'
                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingSessionNewName}
                                    onChange={(e) => setEditingSessionNewName(e.target.value)}
                                    className="w-24 px-1.5 py-0.5 border border-amber-400 rounded text-[11px] font-bold text-slate-850 dark:text-white dark:bg-slate-950 focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') renameSchoolSession(sess, editingSessionNewName);
                                      if (e.key === 'Escape') setEditingSessionOldName(null);
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => renameSchoolSession(sess, editingSessionNewName)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="Save modification"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSessionOldName(null)}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : sessionToDelete === sess ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-rose-750 dark:text-rose-400">{sess}</span>
                                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">Sure?</span>
                                  <div className="flex items-center gap-1 pl-1 border-l border-rose-200 dark:border-rose-900">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        deleteSchoolSession(sess);
                                        setSessionToDelete(null);
                                      }}
                                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-extrabold cursor-pointer transition-colors"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSessionToDelete(null)}
                                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-150 rounded transition-colors"
                                      title="Cancel"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <span className="font-semibold">{sess}</span>
                                  <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingSessionOldName(sess);
                                        setEditingSessionNewName(sess);
                                      }}
                                      className="p-1 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                                      title={`Rename Session ${sess}`}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSessionToDelete(sess)}
                                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition-colors"
                                      title={`Delete Session ${sess}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem("school_classes_list", JSON.stringify(customClasses));
                        localStorage.setItem("school_sessions_list", JSON.stringify(customSessions));
                        if (syncToFirebase) {
                          syncToFirebase('schoolData', 'config', schoolConfig);
                        }
                        const toast = document.createElement('div');
                        toast.className = 'fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl font-bold animate-bounce z-50';
                        toast.innerText = 'Classes & Sessions Saved Successfully!';
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 3000);
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all text-xs flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Save Classes & Sessions
                    </button>
                  </div>
                </div>

                {/* 2. CLASS WISE SUBJECT SETTING BLOCK (PREVIOUS SYSTEM) */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" /> Configure Subjects for Class Stream (कक्षा वार विषय सेटिंग्स)
                  </h3>
                  
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Each class can have a custom list of subjects. Adding or removing subjects here will automatically update the marksheet forms & printed reports for that class.
                  </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Select Class Column */}
                  <div className="space-y-2 col-span-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Select Class to Manage:</label>
                    <select
                      value={selectedConfigClass}
                      onChange={(e) => setSelectedConfigClass(e.target.value as ClassName)}
                      className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {customClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Do you want to reset subjects for ${selectedConfigClass} back to original school defaults?`)) {
                            const stored = localStorage.getItem("madarsa_class_subjects");
                            let parsed: Record<string, string[]> = {};
                            if (stored) {
                              try { parsed = JSON.parse(stored); } catch (e) { console.error(e); }
                            }
                            delete parsed[selectedConfigClass];
                            localStorage.setItem("madarsa_class_subjects", JSON.stringify(parsed));
                            setSubjectConfigChangeCounter(prev => prev + 1);
                            alert(`Subjects restored to default for ${selectedConfigClass}!`);
                          }
                        }}
                        className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-705 dark:bg-slate-800 dark:hover:bg-slate-705 dark:text-slate-200 rounded-lg text-[11px] font-bold font-mono tracking-wider transition-colors cursor-pointer"
                      >
                        Restore Defaults
                      </button>
                    </div>
                  </div>

                  {/* Configured Subjects Display Card & Action Column */}
                  <div className="col-span-2 space-y-4">
                    <div className="border border-slate-250 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900">
                      <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                        <span>Current Subjects for {selectedConfigClass} ({getClassSubjects(selectedConfigClass).length}):</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">Active</span>
                      </h4>

                      {getClassSubjects(selectedConfigClass).length === 0 ? (
                        <div className="text-center py-6 text-slate-400 dark:text-slate-500 font-bold text-xs select-none">
                          No subjects configured. Add one below!
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {getClassSubjects(selectedConfigClass).map((sub) => (
                            <div
                              key={sub}
                              className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 text-[#1e5631] dark:text-[#a5d6a7] px-3 py-1 rounded-full flex items-center gap-1.5 font-bold text-xs shadow-sm hover:scale-105 transition-transform"
                            >
                              <span>{sub}</span>
                              <button
                                type="button"
                                title={`Remove ${sub}`}
                                onClick={() => {
                                  const subjects = getClassSubjects(selectedConfigClass);
                                  const updated = subjects.filter(s => s !== sub);
                                  const stored = localStorage.getItem("madarsa_class_subjects");
                                  let parsed: Record<string, string[]> = {};
                                  if (stored) {
                                    try { parsed = JSON.parse(stored); } catch (e) { console.error(e); }
                                  }
                                  parsed[selectedConfigClass] = updated;
                                  localStorage.setItem("madarsa_class_subjects", JSON.stringify(parsed));
                                  setSubjectConfigChangeCounter(prev => prev + 1);
                                }}
                                className="w-5 h-5 rounded-full hover:bg-rose-100 dark:hover:bg-rose-950/50 flex items-center justify-center text-rose-600 transition-colors font-black cursor-pointer text-[12px] leading-none"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add a Subject Inline Row Form */}
                    <div className="flex gap-2 items-center bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner">
                      <input
                        type="text"
                        placeholder="Type standard or custom subject name (e.g. Arabic, Maths)..."
                        value={newSubjectInput}
                        onChange={(e) => setNewSubjectInput(e.target.value)}
                        className="flex-1 p-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = newSubjectInput.trim();
                            if (!input) return;
                            const subjects = getClassSubjects(selectedConfigClass);
                            if (subjects.includes(input)) {
                              alert("This subject is already configured for this class!");
                              return;
                            }
                            const updated = [...subjects, input];
                            const stored = localStorage.getItem("madarsa_class_subjects");
                            let parsed: Record<string, string[]> = {};
                            if (stored) {
                              try { parsed = JSON.parse(stored); } catch (e2) { console.error(e2); }
                            }
                            parsed[selectedConfigClass] = updated;
                            localStorage.setItem("madarsa_class_subjects", JSON.stringify(parsed));
                            setNewSubjectInput("");
                            setSubjectConfigChangeCounter(prev => prev + 1);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = newSubjectInput.trim();
                          if (!input) return;
                          const subjects = getClassSubjects(selectedConfigClass);
                          if (subjects.includes(input)) {
                            alert("This subject is already configured for this class!");
                            return;
                          }
                          const updated = [...subjects, input];
                          const stored = localStorage.getItem("madarsa_class_subjects");
                          let parsed: Record<string, string[]> = {};
                          if (stored) {
                            try { parsed = JSON.parse(stored); } catch (e) { console.error(e); }
                          }
                          parsed[selectedConfigClass] = updated;
                          localStorage.setItem("madarsa_class_subjects", JSON.stringify(parsed));
                          setNewSubjectInput("");
                          setSubjectConfigChangeCounter(prev => prev + 1);
                        }}
                        className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Subject
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* DUAS MANAGEMENT PANEL */}
          {erpTab === 'duas-mgmt' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                    🕌 दुआ सूचि प्रबंधन (Manage Islamic Duas)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Add new custom duas or edit any existing supplications in real-time. Students' app lists are updated immediately.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddDuaModal(true)}
                  className="px-4 py-2.5 bg-emerald-650 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> नई दुआ जोड़ें (Add Dua)
                </button>
              </div>

              {/* Grid of Duas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {duas.map((dua) => {
                  const isEditing = editingDua?.id === dua.id;
                  return (
                    <div 
                      key={dua.id} 
                      className={`p-5 rounded-2xl border transition-all ${
                        isEditing 
                          ? 'border-amber-400/70 bg-amber-50/50 dark:bg-amber-950/10' 
                          : 'border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:shadow-lg'
                      }`}
                    >
                      {isEditing ? (
                        <form onSubmit={handleSaveDua} className="space-y-4">
                          <div className="flex items-center justify-between border-b border-amber-200 pb-2 mb-2">
                            <span className="text-xs font-extrabold text-amber-700">EDIT DUAA #{dua.id}</span>
                            <div className="flex gap-2">
                              <button 
                                type="submit" 
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer"
                              >
                                Save (सहेजें)
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setEditingDua(null)}
                                className="px-3 py-1 bg-slate-200 hover:bg-slate-350 dark:bg-slate-850 dark:hover:bg-slate-750 text-slate-800 dark:text-white rounded-lg text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dua Title (शीर्षक / नाम)</label>
                              <input 
                                type="text" 
                                required
                                value={editingDua.title}
                                onChange={(e) => setEditingDua({ ...editingDua, title: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Arabic Text (अरबी में दुआ)</label>
                              <textarea
                                required
                                rows={2}
                                value={editingDua.arabic}
                                onChange={(e) => setEditingDua({ ...editingDua, arabic: e.target.value })}
                                className="w-full p-2 text-right dir-rtl text-lg font-serif bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hindi Translation (हिंदी अनुवाद)</label>
                              <textarea
                                rows={2}
                                value={editingDua.translationHindi}
                                onChange={(e) => setEditingDua({ ...editingDua, translationHindi: e.target.value })}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Urdu Translation (उर्दू अनुवाद)</label>
                              <textarea
                                rows={2}
                                value={editingDua.translationUrdu}
                                onChange={(e) => setEditingDua({ ...editingDua, translationUrdu: e.target.value })}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-medium"
                              />
                            </div>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-805 pb-2">
                            <div>
                              <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded mr-1.5">
                                #{dua.id}
                              </span>
                              <h4 className="text-sm font-bold text-slate-850 dark:text-slate-150 inline">
                                {dua.title}
                              </h4>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setEditingDua({ ...dua })}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Edit Supplication"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {dua.id > 150 && ( // Allow delete only for user-custom added duas
                                <button
                                  onClick={() => handleDeleteDua(dua.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Delete custom Supplication"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="font-serif text-right text-lg text-slate-900 dark:text-white leading-loose select-all dir-rtl py-1 bg-slate-50 dark:bg-slate-905 px-3 rounded-xl border border-slate-100 dark:border-slate-850 animate-pulse-once">
                            {dua.arabic}
                          </p>

                          <div className="space-y-1.5 text-xs">
                            {dua.translationHindi && (
                              <p className="text-slate-650 dark:text-slate-300 leading-relaxed">
                                <strong className="text-[10px] text-amber-600/90 dark:text-amber-400 font-mono uppercase mr-1.5 font-bold">Hindi:</strong> {dua.translationHindi}
                              </p>
                            )}
                            {dua.translationUrdu && (
                              <p className="text-slate-650 dark:text-slate-300 leading-relaxed text-right dir-rtl font-serif">
                                <strong className="text-[10px] text-emerald-650 dark:text-emerald-400 font-mono uppercase ml-1.5 font-bold">Urdu:</strong> {dua.translationUrdu}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Dua Modal */}
              {showAddDuaModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-in">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="font-black text-slate-850 dark:text-white flex items-center gap-1.5 text-base">
                        🕌 दुआ जोड़ें (Add Supplication)
                      </h4>
                      <button 
                        onClick={() => setShowAddDuaModal(false)}
                        className="p-1 text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleAddDua} className="space-y-4">
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-bold">Dua Title (नाम * )</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. खाने से पहले की दुआ (Dua before eating)"
                            value={newDua.title}
                            onChange={(e) => setNewDua({ ...newDua, title: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-805 rounded-xl text-slate-850 dark:text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-bold">Arabic Text (अरबी में पाठ * )</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ"
                            value={newDua.arabic}
                            onChange={(e) => setNewDua({ ...newDua, arabic: e.target.value })}
                            className="w-full p-2.5 text-right font-serif text-lg bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-805 rounded-xl text-slate-850 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-bold">Hindi Translation (हिंदी अनुवाद)</label>
                          <textarea
                            rows={2.5}
                            placeholder="अल्लाह के नाम से और अल्लाह की बरकत पर..."
                            value={newDua.translationHindi}
                            onChange={(e) => setNewDua({ ...newDua, translationHindi: e.target.value })}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-855 rounded-xl text-slate-850 dark:text-white font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-bold">Urdu Translation (उर्दू अनुवाद)</label>
                          <textarea
                            rows={2.5}
                            placeholder="..."
                            value={newDua.translationUrdu}
                            onChange={(e) => setNewDua({ ...newDua, translationUrdu: e.target.value })}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-255 dark:border-slate-855 rounded-xl text-slate-850 dark:text-white font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-3 border-t">
                        <button
                          type="button"
                          onClick={() => setShowAddDuaModal(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-850 dark:text-slate-200 text-xs font-bold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
                        >
                          Dua Add (सुरक्षित करें)
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DUA REGISTERED STUDENTS PANEL */}
          {erpTab === 'dua-students' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-700/50 pb-4">
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  🎓 दुआ पंजीकृत छात्र (Dua Registered Students)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Students registered inside the mobile Dua learning app. Organize and edit their profile data class-wise.
                </p>
              </div>

              {/* Filters Header Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Search query */}
                <div className="relative col-span-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="खोजें: छात्र का नाम / कोड..."
                    value={duaSearchQuery}
                    onChange={(e) => setDuaSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>

                {/* Class Wise Filter Selection */}
                <div className="col-span-1">
                  <select
                    value={selectedDuaClassFilter}
                    onChange={(e) => setSelectedDuaClassFilter(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">सभी कक्षाएं (All Classes)</option>
                    {customClasses.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                {/* Counter Stats Badge */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/70 dark:border-indigo-900 rounded-2xl p-2.5 flex items-center justify-between col-span-1 pl-4">
                  <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">Registered Kids:</span>
                  <span className="px-2.5 py-1 bg-indigo-650 text-white rounded-xl text-xs font-black">
                    {duaStudents.length}
                  </span>
                </div>
              </div>

              {/* Registered Kids Lists Grouped Class-Wise */}
              {(() => {
                // Filter student array first
                const filteredList = duaStudents.filter(s => {
                  const matchesSearch = s.name.toLowerCase().includes(duaSearchQuery.toLowerCase()) || 
                                        s.code.toLowerCase().includes(duaSearchQuery.toLowerCase()) ||
                                        s.rollNo.includes(duaSearchQuery);
                  const matchesClass = selectedDuaClassFilter === 'ALL' || s.className === selectedDuaClassFilter;
                  return matchesSearch && matchesClass;
                });

                if (filteredList.length === 0) {
                  return (
                    <div className="text-center py-12 border border-dashed rounded-3xl border-slate-200 dark:border-slate-800">
                      <p className="text-slate-400 dark:text-slate-550 font-bold text-sm">इस फ़िल्टर में कोई छात्र पंजीकृत नहीं मिला...</p>
                    </div>
                  );
                }

                // Group entries by Class name
                const groupedMap: Record<string, any[]> = {};
                filteredList.forEach(stud => {
                  const grp = stud.className || 'NOT_SPECIFIED';
                  if (!groupedMap[grp]) groupedMap[grp] = [];
                  groupedMap[grp].push(stud);
                });

                // Get class order based on school custom weights
                const orderedClasses = Object.keys(groupedMap).sort((a, b) => {
                  const wA = classWeights[a] || 999;
                  const wB = classWeights[b] || 999;
                  return wA - wB;
                });

                return (
                  <div className="space-y-8">
                    {orderedClasses.map(classNameKey => {
                      const listInGroup = groupedMap[classNameKey];
                      return (
                        <div key={classNameKey} className="space-y-3 bg-white dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-150 dark:border-slate-850 shadow-sm animate-fade-in">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                              ⭐ Class: <span className="text-emerald-750 dark:text-amber-400 font-extrabold">{classNameKey}</span>
                              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-650 px-2.5 py-0.5 rounded-full font-bold">
                                {listInGroup.length} Students
                              </span>
                            </h4>
                          </div>

                          {/* Responsive student list grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {listInGroup.map(kid => (
                              <div 
                                key={kid.code} 
                                className="bg-slate-50/40 dark:bg-slate-905 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner hover:border-emerald-500/50 transition-colors flex flex-col justify-between"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-start">
                                    <h5 className="font-extrabold text-slate-900 dark:text-white text-xs">{kid.name}</h5>
                                    <span className="text-[10px] font-mono bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-lg border border-purple-100 dark:border-purple-900">
                                      Code: {kid.code}
                                    </span>
                                  </div>
                                  <div className="text-[11px] font-bold text-slate-550 dark:text-slate-400 space-y-1">
                                    <p>Roll No: <span className="text-slate-800 dark:text-slate-200">{kid.rollNo || "N/A"}</span></p>
                                    <p>Memorized Duas: <span className="text-rose-600 font-black">{kid.memorizedDuas?.length || 0} sup</span></p>
                                  </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-3 border-t dark:border-slate-850 mt-3">
                                  <button
                                    onClick={() => setEditingDuaStudent({ ...kid })}
                                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-350 rounded-lg text-[10px] font-extrabold transition-all outline-none flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDuaStudent(kid.code)}
                                    className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-colors"
                                    title="Delete user profile"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Editing Student Modal Popup */}
              {editingDuaStudent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-in">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="font-black text-slate-850 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wider">
                        ✏️ Edit Dua Student Profile
                      </h4>
                      <button 
                        onClick={() => setEditingDuaStudent(null)}
                        className="p-1 text-slate-550 dark:text-slate-400 hover:bg-slate-100 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveDuaStudent} className="space-y-4">
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-bold">Student Name (नाम)</label>
                          <input 
                            type="text" 
                            required
                            value={editingDuaStudent.name}
                            onChange={(e) => setEditingDuaStudent({ ...editingDuaStudent, name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-bold">Class Roll Number</label>
                          <input 
                            type="text" 
                            value={editingDuaStudent.rollNo}
                            onChange={(e) => setEditingDuaStudent({ ...editingDuaStudent, rollNo: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-bold">Assigned Class Name</label>
                          <select
                            value={editingDuaStudent.className}
                            onChange={(e) => setEditingDuaStudent({ ...editingDuaStudent, className: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-850 dark:text-white font-bold"
                          >
                            {customClasses.map((cls) => (
                              <option key={cls} value={cls}>{cls}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Unique App Login Code (Readonly)</label>
                          <input 
                            type="text" 
                            readOnly
                            disabled
                            value={editingDuaStudent.code}
                            className="w-full px-3 py-2 bg-slate-105 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2.5 justify-end pt-3 border-t">
                        <button
                          type="button"
                          onClick={() => setEditingDuaStudent(null)}
                          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 text-slate-705 dark:text-slate-200 text-xs font-bold rounded-lg"
                        >
                          Close
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Update Profile (सहेजें)
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
