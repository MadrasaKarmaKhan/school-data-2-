export type ClassName = 'L.K.G' | 'U.K.G' | '1ST' | '2ND' | '3RD' | '4TH' | '5TH' | '1ST A' | '1ST B' | '2ND A' | '2ND B' | '3RD A' | '3RD B' | '4TH A' | '4TH B' | '5TH A' | '5TH B' | 'EDADIA' | 'FARSI' | 'ARBI';

export interface SubjectMarks {
  [subject: string]: number;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  fatherName: string;
  className: ClassName;
  session: string;
  photoUrl: string;
  dateOfBirth: string;
  contactNo: string;
  motherName?: string;
  address?: string;
}

export interface Result {
  id: string;
  rollNo: string;
  className: ClassName;
  passingYear: number;
  studentName: string;
  fatherName: string;
  photoUrl: string;
  session: string;
  marks: SubjectMarks;
  totalMarks: number;
  percentage: number;
  grade?: string;
  isPassed: boolean;
  motherName?: string;
  address?: string;
  dateOfBirth?: string;
  regNo?: string;
  udise?: string;
  division?: string;
  rank?: string;
  examType?: string;
}

export interface Teacher {
  id: string;
  name: string;
  designation: string;
  qualification: string;
  photoUrl: string;
  phone: string;
  email: string;
}

export interface AdmissionApplication {
  id: string;
  studentName: string;
  fatherName: string;
  motherName?: string;
  dateOfBirth: string;
  className: ClassName;
  contactPhone: string;
  whatsappNumber?: string;
  aadhaarNumber?: string;
  email: string;
  address: string;
  gender?: 'Male' | 'Female' | 'Other';
  previousSchool?: string;
  bloodGroup?: string;
  studentPhoto?: string;
  academicYear?: string;
  applyDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  category: 'Campus' | 'Events' | 'Classes' | 'Achievements';
}

export interface NewsItem {
  id: string;
  date: string;
  title: string;
  content: string;
  isImportant: boolean;
}

export interface SchoolConfig {
  schoolName: string;
  schoolNameArabic: string;
  tagline: string;
  principalName: string;
  principalMessage: string;
  principalPhotoUrl: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  whatsappNumber: string;

  // Hero backgrounds
  heroBg1?: string;
  heroBg2?: string;
  heroBg3?: string;

  // Hero Quick Counters
  stat1Num?: string;
  stat1Label?: string;
  stat2Num?: string;
  stat2Label?: string;
  stat3Num?: string;
  stat3Label?: string;
  stat4Num?: string;
  stat4Label?: string;

  // About Section blocks
  historyHeader?: string;
  historyText?: string;
  missionHeader?: string;
  missionText?: string;
  visionHeader?: string;
  visionText?: string;

  // Dynamic academic programs
  prog1Title?: string;
  prog1Text?: string;
  prog2Title?: string;
  prog2Text?: string;
  prog3Title?: string;
  prog3Text?: string;
  prog4Title?: string;
  prog4Text?: string;

  // Facilities
  fac1Title?: string;
  fac1Img?: string;
  fac1Text?: string;
  fac2Title?: string;
  fac2Img?: string;
  fac2Text?: string;
  fac3Title?: string;
  fac3Img?: string;
  fac3Text?: string;

  // Extra config fields
  admissionNotice?: string;
  establishedYear?: string;
  principalSub?: string;
  principalTitleHeading?: string;
  principalLedgerTag?: string;
  topper1Heading?: string;
  topper1Name?: string;
  topper1Badge?: string;
  topper1Blurb?: string;
  topper2Heading?: string;
  topper2Name?: string;
  topper2Badge?: string;
  topper2Blurb?: string;
  topper3Heading?: string;
  topper3Name?: string;
  topper3Badge?: string;
  topper3Blurb?: string;
  aboutText?: string;
  mottoArabic?: string;
  mottoEnglish?: string;
  footerCreditTag?: string;
  bottomMarqueeText?: string;
  topMarqueeText?: string;

  // Donation bank info and QR code
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  qrCodeUrl?: string;

  // Donation section texts
  donateSectionTitle?: string;
  donateSectionSubtitle?: string;
  whySupportHeading?: string;
  whySupportText?: string;

  // Custom Logo URL
  logoUrl?: string;
  marksheetLogo?: string;
  calligraphyBanner?: string;
  googleSheetsWebhookUrl?: string;
}
