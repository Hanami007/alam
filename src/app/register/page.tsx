'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LocationPicker } from '@/components/ui/location-picker';
import {
  GraduationCap,
  Lock,
  User,
  Mail,
  MapPin,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Users,
  Compass,
  Building2,
  Briefcase,
  Layers,
  Quote,
  FileText,
  BookOpen,
  BellRing,
  CheckSquare,
  Square,
  ExternalLink,
  Shield,
  X,
  ChevronRight,
  Info,
  Check,
  Camera,
  Upload,
  HeartHandshake,
  Link2,
  MessageCircle,
  Image as ImageIcon,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
];

export default function RegisterPage() {
  const router = useRouter();

  // Options from API
  const [generations, setGenerations] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [careerTypes, setCareerTypes] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentStatus, setStudentStatus] = useState<'studying' | 'alumni'>('studying');
  const [generationOptionId, setGenerationOptionId] = useState<string>('');
  const [provinceOptionId, setProvinceOptionId] = useState<string>('');
  const [admissionYear, setAdmissionYear] = useState<string>('2566');
  const [autoMatchedGen, setAutoMatchedGen] = useState<any | null>(null);
  const [birthDate, setBirthDate] = useState<string>('');

  // Alumni Specific Fields
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [careerOptionId, setCareerOptionId] = useState<string>('');
  const [workProvinceId, setWorkProvinceId] = useState<string>('');
  const [bio, setBio] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [lineId, setLineId] = useState('');

  // Profile & Mentorship (ข้อมูลจำเป็นสำหรับแสดงในหน้าเว็บ)
  const [avatarUrl, setAvatarUrl] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  );
  const [customAvatarInput, setCustomAvatarInput] = useState<string>('');
  const [isAvailableForMentorship, setIsAvailableForMentorship] = useState<boolean>(true);

  // Consents & Agreements (ข้อกำหนดและความยินยอม)
  const [consentPdpa, setConsentPdpa] = useState(false); // Required
  const [consentTerms, setConsentTerms] = useState(false); // Required
  const [consentVerification, setConsentVerification] = useState(false); // Required
  // รวม 4 ตัวเลือกเดิม (Yearbook, Hometown Map, Workplace Map, Communications) เป็น 1 ตัวเลือก
  const [consentPublicNetwork, setConsentPublicNetwork] = useState(true);

  // Policy Details Modal State
  const [activeModal, setActiveModal] = useState<'pdpa' | 'terms' | 'verification' | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const res = await fetch('/api/lookup/register-data');
        const data = await res.json().catch(() => null);
        if (res.ok && data) {
          setGenerations(data.generations || []);
          setProvinces(data.provinces || []);
          setCareerTypes(data.careerTypes || []);

          if (data.generations?.length > 0) {
            const gen29 = data.generations.find((g: any) => g.code === 'gen-29' || g.label === 'รุ่น 29');
            setGenerationOptionId(String(gen29 ? gen29.id : data.generations[0].id));
          }
          if (data.provinces?.length > 0) {
            const cnx = data.provinces.find((p: any) => p.label === 'เชียงใหม่');
            const defaultProvId = String(cnx ? cnx.id : data.provinces[0].id);
            setProvinceOptionId(defaultProvId);
            setWorkProvinceId(defaultProvId);
          }
          if (data.careerTypes?.length > 0) {
            setCareerOptionId(String(data.careerTypes[0].id));
          }
        }
      } catch (err) {
        console.error('Error fetching register options:', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  // เมื่อผู้ใช้พิมพ์รหัสนักศึกษา 10 หลัก: คำนวณรุ่นอัตโนมัติ
  function handleStudentIdChange(val: string) {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
    setStudentId(cleaned);

    if (cleaned.length >= 2) {
      const prefix = cleaned.slice(0, 2);
      const prefixNum = parseInt(prefix, 10);
      const calculatedGenNumber = prefixNum - 37; // เช่น 66 - 37 = 29
      const yearBE = 2500 + prefixNum;

      setAdmissionYear(String(yearBE));

      // กฎ 4 ปีเทียบกับปีปัจจุบัน (พ.ศ. 2569)
      const currentYearBE = new Date().getFullYear() + 543;
      if (yearBE + 4 <= currentYearBE) {
        setStudentStatus('alumni');
      } else {
        setStudentStatus('studying');
      }

      if (generations.length > 0 && calculatedGenNumber >= 1) {
        const matched = generations.find(
          (g: any) =>
            g.extra?.gen_number === calculatedGenNumber ||
            g.code === `gen-${calculatedGenNumber}` ||
            g.label === `รุ่น ${calculatedGenNumber}`
        );
        if (matched) {
          setGenerationOptionId(String(matched.id));
          setAutoMatchedGen({
            genNumber: calculatedGenNumber,
            label: matched.label,
            yearBE,
            prefix,
          });
          return;
        }
      }
    }
    setAutoMatchedGen(null);
  }

  // Toggle All Consents
  const areAllConsentsSelected =
    consentPdpa &&
    consentTerms &&
    consentVerification &&
    consentPublicNetwork;

  function handleToggleAllConsents() {
    const nextState = !areAllConsentsSelected;
    setConsentPdpa(nextState);
    setConsentTerms(nextState);
    setConsentVerification(nextState);
    setConsentPublicNetwork(nextState);
  }

  function handleAvatarFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('ขนาดรูปภาพต้องไม่เกิน 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  // Check required consents
  const requiredCount = [consentPdpa, consentTerms, consentVerification].filter(Boolean).length;
  const isRequiredConsentsComplete = requiredCount === 3;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !studentId.trim() || !email.trim() || !password) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (studentId.trim().length !== 10) {
      setError('รหัสนักศึกษาต้องมีความยาวครบ 10 หลัก');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (!generationOptionId) {
      setError('กรุณาเลือกรุ่น');
      return;
    }

    if (!provinceOptionId) {
      setError('กรุณาเลือกจังหวัด');
      return;
    }

    if (studentStatus === 'alumni') {
      if (!company.trim()) {
        setError('กรุณากรอกชื่อบริษัทหรือองค์กรที่ทำงานปัจจุบันสำหรับศิษย์เก่า');
        return;
      }
      if (!position.trim()) {
        setError('กรุณากรอกตำแหน่งงานปัจจุบันสำหรับศิษย์เก่า');
        return;
      }
    }

    // ตรวจสอบความยินยอมที่จำเป็น
    if (!isRequiredConsentsComplete) {
      setError('กรุณายอมรับข้อกำหนด นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) และการยินยอมตรวจสอบตัวตน (3 ข้อแรก) ให้ครบถ้วน');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          studentId: studentId.trim(),
          email: email.trim().toLowerCase(),
          password,
          generationOptionId: Number(generationOptionId),
          provinceOptionId: Number(provinceOptionId),
          studentStatus,
          admissionYear: parseInt(admissionYear, 10) || 2566,
          company: company.trim(),
          position: position.trim(),
          careerOptionId: careerOptionId ? Number(careerOptionId) : null,
          workProvinceId: workProvinceId ? Number(workProvinceId) : Number(provinceOptionId),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
          isAvailableForMentorship,
          birthDate: birthDate || undefined,
          facebookUrl: facebookUrl.trim() || undefined,
          lineId: lineId.trim() || undefined,
          // Consents (4 ตัวเลือกเดิมรวมเป็น 1 ตัวเลือก ส่งครบถ้วนเข้าสู่ระบบ)
          consentPdpa,
          consentTerms,
          consentVerification,
          consentYearbook: consentPublicNetwork,
          showHometownOnMap: consentPublicNetwork,
          showWorkplaceOnMap: consentPublicNetwork,
          consentCommunications: consentPublicNetwork,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
        return;
      }

      setSuccessData(data);
    } catch (err: any) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute top-[30%] -right-[15%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        {/* Header Branding */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold backdrop-blur-md shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>เครือข่ายศิษย์เก่าและนักศึกษา วิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            สมัครสมาชิก CS MJU CONNECT
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            เชื่อมต่อสายสัมพันธ์ ส่งเสริมโอกาสทางวิชาชีพ และร่วมสร้างเครือข่าย CS แม่โจ้ให้เข้มแข็ง
          </p>
        </div>

        {/* Success Card */}
        {successData ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl text-center space-y-6 animate-slide-up">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                ลงทะเบียนสำเร็จและพร้อมใช้งานทันที!
              </h2>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                บัญชีของคุณได้รับการบันทึกลงสู่ฐานข้อมูล และตั้งค่าสถานะ <span className="font-bold text-emerald-400">อนุมัติแล้ว (Approved)</span> พร้อมเข้าใช้งานระบบเครือข่าย CS MJU CONNECT ได้ทันที
              </p>
            </div>

            <div className="rounded-2xl bg-indigo-950/50 border border-indigo-500/30 p-5 text-left space-y-3 text-xs text-slate-300">
              <p className="font-bold flex items-center gap-2 text-indigo-300 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                สถานะการลงทะเบียนในระบบ
              </p>
              <ul className="space-y-2 text-slate-300 list-disc list-inside">
                <li>ข้อมูลโปรไฟล์ รูปภาพประจำตัว และการตั้งค่าความเป็นส่วนตัวได้รับการบันทึกลง Database เรียบร้อย</li>
                <li>คุณได้เข้าสู่ระบบโดยอัตโนมัติแล้ว สามารถเริ่มใช้งานกระดานข่าวสาร ทำเนียบรุ่น หรือแผนที่เครือข่ายได้ทันที</li>
                <li>ระบบได้ส่งการแจ้งเตือนไปยังผู้ดูแลระบบและเพื่อนร่วมรุ่นเพื่อต้อนรับคุณสู่เครือข่าย</li>
              </ul>
            </div>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/feed"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-600 p-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>เริ่มใช้งานระบบ (Go to Feed)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/profile"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 p-4 text-sm font-bold text-slate-200 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>ดูโปรไฟล์ของฉัน</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Main Form Card */
          <div className="rounded-3xl border border-white/10 bg-slate-900/85 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Top Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Error Banner */}
              {error && (
                <div className="flex items-start gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs sm:text-sm text-rose-300 font-medium animate-shake">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-rose-200">ไม่สามารถดำเนินการต่อได้</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-7">
                {/* 1. Category Switcher */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-indigo-400" />
                    ประเภทผู้ใช้งาน (User Type)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-slate-950/60 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setStudentStatus('studying')}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        studentStatus === 'studying'
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>🎓</span>
                      <span>ศิษย์ปัจจุบัน (Studying)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentStatus('alumni')}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        studentStatus === 'alumni'
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>🏛️</span>
                      <span>ศิษย์เก่า (Alumni)</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    * เมื่อพิมพ์รหัสนักศึกษา ระบบจะคำนวณรุ่นและสลับสถานะให้อัตโนมัติ (เข้าศึกษาครบ 4 ปีนับเป็นศิษย์เก่า)
                  </p>
                </div>

                {/* 2. Personal & Account Information */}
                <div className="space-y-4 pt-1 border-t border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-400" />
                    ข้อมูลส่วนบุคคลและบัญชีผู้ใช้
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>ชื่อ-นามสกุล <span className="text-rose-400">*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="เช่น สมชาย ใจดี"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>

                    {/* Student ID */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">
                          รหัสนักศึกษา (10 หลัก) <span className="text-rose-400">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">เลข 2 ตัวหน้าจะระบุรุ่น</span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={studentId}
                        onChange={(e) => handleStudentIdChange(e.target.value)}
                        placeholder="เช่น 66041013xx"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white font-mono placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      />
                      {autoMatchedGen && (
                        <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded-xl px-3 py-1.5 font-medium animate-slide-up">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <span>เชื่อมโยง: <strong>{autoMatchedGen.label}</strong> (รหัส {autoMatchedGen.prefix}xx / เข้าปี {autoMatchedGen.yearBE})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email & Hometown Province */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-indigo-400" /> อีเมลติดต่อ <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="somchai@example.com"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-indigo-400" /> จังหวัด / ประเทศภูมิลำเนา <span className="text-rose-400">*</span>
                        </span>
                        <span className="text-[10px] text-indigo-300">รองรับทั้งในไทยและต่างประเทศ</span>
                      </label>
                      <LocationPicker
                        value={provinceOptionId}
                        onChange={(val) => setProvinceOptionId(val)}
                        options={provinces}
                        disabled={loadingOptions}
                        accentColor="indigo"
                        placeholder="เลือกจังหวัด หรือ ประเทศภูมิลำเนา"
                      />
                    </div>
                  </div>

                  {/* Birth Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>วันเกิด</span>
                      <span className="text-[10px] text-slate-400">ใช้แสดงในวิดเจ็ต &ldquo;สุขสันต์วันเกิด&rdquo; หน้าฟีดเมื่อถึงวันจริง</span>
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all [color-scheme:dark]"
                    />
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-indigo-400" /> รหัสผ่าน <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="รหัสผ่านขั้นต่ำ 6 ตัวอักษร"
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-indigo-400" /> ยืนยันรหัสผ่าน <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่านอีกครั้ง"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Avatar Picker & Profile Display */}
                  <div className="rounded-2xl border border-indigo-500/20 bg-slate-950/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Camera className="h-4 w-4 text-indigo-400" />
                        <span>รูปภาพโปรไฟล์ (Avatar)</span>
                      </label>
                      <span className="text-[11px] text-slate-400">แสดงบนทำเนียบรุ่น, ฟีด และหน้าโปรไฟล์</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Avatar Preview */}
                      <div className="relative shrink-0">
                        <img
                          src={avatarUrl || PRESET_AVATARS[0]}
                          alt="Avatar Preview"
                          className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl object-cover border-2 border-indigo-500/60 shadow-md shadow-indigo-500/20 bg-slate-800"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 shadow">
                          <Sparkles className="h-3 w-3" />
                        </div>
                      </div>

                      {/* Presets & Custom Upload */}
                      <div className="flex-1 w-full space-y-2.5">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          <span className="text-[11px] text-slate-400 shrink-0">เลือกรูปแนะนำ:</span>
                          <div className="flex items-center gap-1.5">
                            {PRESET_AVATARS.map((url, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setAvatarUrl(url)}
                                className={`relative rounded-xl overflow-hidden h-9 w-9 border-2 transition-all cursor-pointer shrink-0 ${
                                  avatarUrl === url
                                    ? 'border-indigo-400 ring-2 ring-indigo-400/40 scale-105'
                                    : 'border-white/15 opacity-70 hover:opacity-100 hover:border-white/40'
                                }`}
                              >
                                <img src={url} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-slate-200 cursor-pointer transition-all">
                            <Upload className="h-3.5 w-3.5 text-indigo-400" />
                            <span>อัปโหลดจากเครื่อง</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarFileUpload}
                              className="hidden"
                            />
                          </label>

                          <div className="flex-1 min-w-[200px]">
                            <input
                              type="url"
                              value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                              onChange={(e) => setAvatarUrl(e.target.value)}
                              placeholder="หรือวาง URL รูปภาพ..."
                              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mentorship Availability Option */}
                  <div
                    onClick={() => setIsAvailableForMentorship(!isAvailableForMentorship)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                      isAvailableForMentorship
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-slate-950/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isAvailableForMentorship ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-400'}`}>
                        <HeartHandshake className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">ยินดีให้คำแนะนำรุ่นน้อง (Open for Mentorship)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                            แนะนำ
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          เปิดให้รุ่นน้องในสาขาติดต่อขอคำปรึกษาด้านการเรียนหรือการทำงาน พร้อมแสดงเหรียญตรา Mentor บนโปรไฟล์
                        </p>
                      </div>
                    </div>

                    <div className={`h-6 w-11 rounded-full p-0.5 transition-colors shrink-0 ${isAvailableForMentorship ? 'bg-purple-500' : 'bg-slate-700'}`}>
                      <div className={`h-5 w-5 rounded-full bg-white transition-transform ${isAvailableForMentorship ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>

                  {/* Student Bio (เมื่อเป็นนักศึกษาปัจจุบัน) */}
                  {studentStatus === 'studying' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Quote className="h-3.5 w-3.5 text-indigo-400" /> แนะนำตัวสั้นๆ / สิ่งที่สนใจ (Bio)
                      </label>
                      <input
                        type="text"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="เช่น สนใจศึกษาด้าน Web Development, Cloud & AI ยินดีทำความรู้จักเพื่อนๆ พี่ๆ ครับ"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  )}

                  {/* ช่องทางติดต่อ (ไม่บังคับ) — แก้ไขได้ทีหลังในหน้าโปรไฟล์ และมี toggle เปิด/ปิดการแสดงบนแผนที่แยกต่างหาก */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5 text-indigo-400" /> Facebook (ไม่บังคับ)
                      </label>
                      <input
                        type="text"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        placeholder="ลิงก์โปรไฟล์ หรือ ชื่อผู้ใช้ Facebook"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> LINE ID (ไม่บังคับ)
                      </label>
                      <input
                        type="text"
                        value={lineId}
                        onChange={(e) => setLineId(e.target.value)}
                        placeholder="LINE ID ของคุณ"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Alumni Specific Details (แสดงเมื่อเป็นศิษย์เก่า) */}
                {studentStatus === 'alumni' && (
                  <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-950/70 to-orange-500/10 p-5 sm:p-6 space-y-4 shadow-xl animate-slide-up">
                    <div className="flex items-start justify-between border-b border-amber-500/20 pb-3">
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 px-3 py-1 text-xs font-bold mb-1">
                          <Briefcase className="h-3.5 w-3.5 text-amber-400" />
                          <span>ข้อมูลเฉพาะสำหรับศิษย์เก่า (Alumni Profile)</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          ประวัติการทำงานและสายอาชีพปัจจุบัน
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          ข้อมูลนี้จะถูกนำไปแสดงในทำเนียบรุ่น (Yearbook), แผนที่สถานที่ทำงาน (Workplace Map) และหน้าโปรไฟล์
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-amber-400" /> บริษัท / องค์กรที่ทำงาน <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required={studentStatus === 'alumni'}
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="เช่น Agoda, SCB TechX, ม.แม่โจ้..."
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-amber-400" /> ตำแหน่งงานปัจจุบัน <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required={studentStatus === 'alumni'}
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          placeholder="เช่น Senior Software Engineer, ครู..."
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-amber-400" /> ประเภทสายงาน / ภาคส่วน
                        </label>
                        <select
                          value={careerOptionId}
                          onChange={(e) => setCareerOptionId(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all"
                        >
                          {careerTypes.map((ct) => (
                            <option key={ct.id} value={ct.id} className="bg-slate-900 text-white">
                              {ct.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-amber-400" /> ที่ตั้งสถานที่ทำงาน (จังหวัด / ต่างประเทศ) <span className="text-rose-400">*</span>
                          </span>
                          <span className="text-[10px] text-amber-300">แสดงหมุดบนแผนที่ศิษย์เก่า</span>
                        </label>
                        <LocationPicker
                          value={workProvinceId}
                          onChange={(val) => setWorkProvinceId(val)}
                          options={provinces}
                          disabled={loadingOptions}
                          accentColor="amber"
                          placeholder="เลือกจังหวัดในไทย หรือ ประเทศที่ทำงาน"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Quote className="h-3.5 w-3.5 text-amber-400" /> คำแนะนำตัวสั้นๆ / ประสบการณ์ / คติประจำใจ
                      </label>
                      <textarea
                        rows={2}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="เช่น ศิษย์เก่า CS แม่โจ้ มีความเชี่ยวชาญด้าน Web & Cloud ยินดีให้คำปรึกษาแก่น้องๆ ในสาขา"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* 4. ข้อกำหนด ความยินยอม และนโยบายความเป็นส่วนตัว (PDPA & Consents) */}
                <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-950/60 to-purple-950/30 p-5 sm:p-6 space-y-4 shadow-xl">
                  {/* Consent Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
                        <Shield className="h-3.5 w-3.5 text-indigo-400" />
                        <span>หนังสือแสดงความยินยอมและการคุ้มครองข้อมูล (Consent & PDPA)</span>
                      </div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        ข้อตกลง นโยบายความเป็นส่วนตัว และการยินยอม
                      </h3>
                      <p className="text-xs text-slate-400">
                        ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 และระเบียบเครือข่าย CS MJU CONNECT
                      </p>
                    </div>

                    {/* Quick Toggle All Button */}
                    <button
                      type="button"
                      onClick={handleToggleAllConsents}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        areAllConsentsSelected
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-white/10 border border-white/15 text-slate-300 hover:bg-white/15'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{areAllConsentsSelected ? 'ยกเลิกการเลือกทั้งหมด' : 'ยินยอมทั้งหมด (Select All)'}</span>
                    </button>
                  </div>

                  {/* Consents List */}
                  <div className="space-y-3">
                    {/* Item 1: PDPA (Required) */}
                    <div
                      onClick={() => setConsentPdpa(!consentPdpa)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                        consentPdpa
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-inner'
                          : 'bg-slate-950/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        {consentPdpa ? (
                          <div className="h-5 w-5 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-lg border-2 border-slate-500 hover:border-slate-400 transition-colors" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            การยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA Consent)
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            จำเป็น *
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          ข้าพเจ้ายินยอมให้ระบบ CS MJU CONNECT เก็บรวบรวม ใช้ และประมวลผลข้อมูลส่วนบุคคล เพื่อการตรวจสอบสิทธิ์ ให้บริการสมาชิก และการบริหารเครือข่ายศิษย์เก่า
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModal('pdpa');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 pt-0.5"
                        >
                          <FileText className="h-3 w-3" />
                          <span>อ่านนโยบายคุ้มครองข้อมูลส่วนบุคคลฉบับเต็ม</span>
                        </button>
                      </div>
                    </div>

                    {/* Item 2: Terms of Service (Required) */}
                    <div
                      onClick={() => setConsentTerms(!consentTerms)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                        consentTerms
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-inner'
                          : 'bg-slate-950/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        {consentTerms ? (
                          <div className="h-5 w-5 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-lg border-2 border-slate-500 hover:border-slate-400 transition-colors" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            ข้อกำหนดและเงื่อนไขการใช้งาน (Terms of Service)
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            จำเป็น *
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          ข้าพเจ้าได้อ่าน เข้าใจ และยอมรับข้อกำหนดการใช้งานทั้งหมด พร้อมรับรองว่าข้อมูลและหลักฐานที่กรอกลงในระบบเป็นความจริงทุกประการ
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModal('terms');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 pt-0.5"
                        >
                          <BookOpen className="h-3 w-3" />
                          <span>อ่านข้อกำหนดและเงื่อนไขการใช้งาน</span>
                        </button>
                      </div>
                    </div>

                    {/* Item 3: Peer & Admin Verification (Required) */}
                    <div
                      onClick={() => setConsentVerification(!consentVerification)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                        consentVerification
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-inner'
                          : 'bg-slate-950/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        {consentVerification ? (
                          <div className="h-5 w-5 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-lg border-2 border-slate-500 hover:border-slate-400 transition-colors" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            การยินยอมให้ตรวจสอบและยืนยันตัวตน (Peer & Admin Verification)
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            จำเป็น *
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          ข้าพเจ้ายินยอมให้ส่งข้อมูลการสมัคร (ชื่อ, รหัสนักศึกษา, รุ่น) แจ้งเตือนไปยังผู้ดูแลระบบและเพื่อนร่วมรุ่นเพื่อทำการตรวจสอบและยืนยันสถานะความเป็นนักศึกษา/ศิษย์เก่า
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModal('verification');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 pt-0.5"
                        >
                          <Users className="h-3 w-3" />
                          <span>ดูขั้นตอนและกลไกการยืนยันตัวตน</span>
                        </button>
                      </div>
                    </div>

                    {/* Item 4: รวม 4 ตัวเลือกเป็น 1 ตัวเลือก (ทำเนียบรุ่น, แผนที่ภูมิลำเนา, แผนที่ที่ทำงาน, และการรับข่าวสาร) */}
                    <div
                      onClick={() => setConsentPublicNetwork(!consentPublicNetwork)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                        consentPublicNetwork
                          ? 'bg-indigo-500/10 border-indigo-500/40 shadow-inner ring-1 ring-indigo-500/20'
                          : 'bg-slate-950/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        {consentPublicNetwork ? (
                          <div className="h-5 w-5 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-lg border-2 border-slate-500 hover:border-slate-400 transition-colors" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            การเผยแพร่ข้อมูลและแสดงผลในระบบเครือข่ายศิษย์เก่า (ทำเนียบรุ่น, หมุดแผนที่ และรับข่าวสาร)
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            แนะนำ (รวมทุกตัวเลือก)
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          ยินยอมให้นำข้อมูลโปรไฟล์ (ชื่อ-สกุล, รุ่น, ภาพโปรไฟล์, ข้อมูลวิชาชีพ) แสดงในสมุดทำเนียบรุ่น (Yearbook), ปักหมุดพิกัดจังหวัดภูมิลำเนาและที่ทำงานบนแผนที่เครือข่ายศิษย์เก่า (Alumni Map) และรับข่าวสารประชาสัมพันธ์กิจกรรมของสาขาวิชา
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                            📖 ทำเนียบรุ่น (Yearbook)
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                            📍 แผนที่ภูมิลำเนา (Hometown Map)
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                            💼 แผนที่ที่ทำงาน (Workplace Map)
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                            📢 ข่าวสารและกิจกรรม (News & Events)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Required Consents Status Indicator */}
                  <div className="pt-2">
                    {isRequiredConsentsComplete ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span>ยินยอมตามข้อกำหนดและเงื่อนไขที่จำเป็นครบถ้วนแล้ว (3/3 ข้อ) พร้อมสำหรับการลงทะเบียน</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                        <Info className="h-4 w-4 shrink-0 text-amber-400" />
                        <span>ยังขาดความยินยอมที่จำเป็นอีก {3 - requiredCount} ข้อ (กรุณาทำเครื่องหมายในช่องที่มีแถบสีแดงกำกับ &quot;จำเป็น *&quot;)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !isRequiredConsentsComplete}
                  className={`w-full flex items-center justify-center gap-2.5 rounded-2xl p-4 text-sm font-bold text-white shadow-xl transition-all cursor-pointer ${
                    !isRequiredConsentsComplete
                      ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-70'
                      : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:brightness-110 active:scale-[0.98] shadow-indigo-600/30 border border-indigo-400/30'
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>กำลังส่งข้อมูลการลงทะเบียนและบันทึกความยินยอม...</span>
                    </div>
                  ) : (
                    <>
                      <span>ยืนยันการสมัครสมาชิก CS MJU CONNECT</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Link back to login */}
              <div className="pt-4 text-center border-t border-white/10">
                <p className="text-xs text-slate-400">
                  มีบัญชีผู้ใช้งานอยู่แล้วใช่หรือไม่?{' '}
                  <Link href="/login" className="font-bold text-indigo-400 hover:text-indigo-300 underline transition-colors">
                    เข้าสู่ระบบที่นี่ (Sign In)
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-xs text-slate-500">
            หลักสูตรวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้ © 2026
          </p>
          <p className="text-[11px] text-slate-600">
            ระบบคุ้มครองข้อมูลส่วนบุคคลตามมาตรฐาน PDPA แห่งราชอาณาจักรไทย
          </p>
        </div>
      </div>

      {/* Policy & Terms Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                  {activeModal === 'pdpa' && <ShieldCheck className="h-5 w-5" />}
                  {activeModal === 'terms' && <BookOpen className="h-5 w-5" />}
                  {activeModal === 'verification' && <Users className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {activeModal === 'pdpa' && 'นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA Privacy Policy)'}
                    {activeModal === 'terms' && 'ข้อกำหนดและเงื่อนไขการใช้งาน (Terms of Service)'}
                    {activeModal === 'verification' && 'ขั้นตอนและกลไกการยืนยันตัวตน (Verification Protocol)'}
                  </h3>
                  <p className="text-xs text-slate-400">ระบบเครือข่าย CS MJU CONNECT</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-8 w-8 rounded-xl bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed custom-scrollbar">
              {activeModal === 'pdpa' && (
                <>
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs">
                    ประกาศตาม พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) เพื่อแจ้งวัตถุประสงค์และสิทธิของท่านในฐานะเจ้าของข้อมูลส่วนบุคคล
                  </div>

                  <h4 className="font-bold text-white text-sm">1. วัตถุประสงค์ในการเก็บรวบรวมข้อมูล</h4>
                  <p>
                    ระบบจะทำการจัดเก็บข้อมูล เช่น ชื่อ-นามสกุล, รหัสนักศึกษา, อีเมล, ประวัติการศึกษา, ที่ทำงาน และตำแหน่งงาน เพื่อวัตถุประสงค์ในการสร้างเครือข่ายศิษย์เก่า การตรวจสอบสิทธิ์การเข้าใช้งาน การให้บริการทำเนียบรุ่น (Yearbook) แผนที่ศิษย์เก่า และการติดต่อประสานงานทางวิชาการเท่านั้น
                  </p>

                  <h4 className="font-bold text-white text-sm">2. การรักษาความปลอดภัยของข้อมูล</h4>
                  <p>
                    ข้อมูลรหัสผ่านจะถูกเข้ารหัสทางเดียว (Bcrypt Hash) อย่างปลอดภัย ข้อมูลการยืนยันตัวตนและหนังสือยินยอมจะถูกจัดเก็บบันทึกประวัติ (Audit Trail) ในระบบฐานข้อมูลที่มีการจำกัดสิทธิ์เข้าถึงเฉพาะผู้ดูแลระบบที่ได้รับมอบหมาย
                  </p>

                  <h4 className="font-bold text-white text-sm">3. สิทธิของเจ้าของข้อมูลส่วนบุคคล</h4>
                  <p>
                    ท่านมีสิทธิ์ในการเข้าถึง ขอสำเนา แก้ไขข้อมูลส่วนบุคคลให้ถูกต้อง ขอระงับการใช้งาน หรือถอนความยินยอมในการแสดงข้อมูลบนแผนที่หรือทำเนียบรุ่นได้ตลอดเวลาผ่านทางหน้าตั้งค่าโปรไฟล์ส่วนตัว
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs">
                    ข้อตกลงและกติกาการใช้งานร่วมกันสำหรับนักศึกษาและศิษย์เก่า วิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้
                  </div>

                  <h4 className="font-bold text-white text-sm">1. ความถูกต้องของข้อมูล</h4>
                  <p>
                    ผู้สมัครต้องกรอกข้อมูลที่เป็นความจริงและตรงกับประวัติการศึกษาในมหาวิทยาลัยแม่โจ้ การแอบอ้างตัวตนหรือนำข้อมูลของผู้อื่นมาลงทะเบียนถือเป็นความผิดและจะถูกระงับสิทธิ์ทันที
                  </p>

                  <h4 className="font-bold text-white text-sm">2. มารยาทและการใช้งานในระบบ</h4>
                  <p>
                    ห้ามนำข้อมูลติดต่อ รูปภาพ หรือข้อมูลส่วนบุคคลของเพื่อนสมาชิกในระบบไปเผยแพร่ในเชิงพาณิชย์ ส่งสแปม หรือใช้งานในลักษณะที่ก่อให้เกิดความเดือดร้อนรำคาญแก่ผู้อื่นโดยไม่ได้รับอนุญาต
                  </p>

                  <h4 className="font-bold text-white text-sm">3. สิทธิ์ของผู้ดูแลระบบ</h4>
                  <p>
                    ผู้ดูแลระบบขอสงวนสิทธิ์ในการตรวจสอบ อนุมัติ หรือระงับบัญชีผู้ใช้ที่ไม่ปฏิบัติตามข้อกำหนด เพื่อรักษาความปลอดภัยและความสงบเรียบร้อยของเครือข่าย
                  </p>
                </>
              )}

              {activeModal === 'verification' && (
                <>
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs">
                    กลไกการยืนยันตัวตนแบบตรวจสอบร่วมกัน (Peer & Admin Verification Mechanism)
                  </div>

                  <h4 className="font-bold text-white text-sm">1. เหตุใดจึงต้องมีการยืนยันตัวตน?</h4>
                  <p>
                    เนื่องจากแพลตฟอร์มนี้เป็นเครือข่ายเฉพาะของนักศึกษาและศิษย์เก่า วิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้ จึงจำเป็นต้องมีกระบวนการตรวจสอบเพื่อป้องกันบุคคลภายนอกหรือผู้ไม่ประสงค์ดีเข้ามาแอบอ้าง
                  </p>

                  <h4 className="font-bold text-white text-sm">2. ใครเป็นผู้มีสิทธิ์ยืนยันตัวตนให้คุณ?</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong className="text-white">ผู้ดูแลระบบ (Admin):</strong> สามารถตรวจสอบประวัติกับระบบและกดอนุมัติได้ทันทีผ่านหน้า Admin Dashboard</li>
                    <li><strong className="text-white">เพื่อนร่วมรุ่น (Batchmates):</strong> สมาชิกในรุ่นเดียวกันที่ได้รับอนุมัติแล้ว จะได้รับการแจ้งเตือนและสามารถกดยืนยันว่าคุณเป็นเพื่อนร่วมรุ่นจริงได้</li>
                  </ul>

                  <h4 className="font-bold text-white text-sm">3. หลังจากได้รับการอนุมัติ</h4>
                  <p>
                    สถานะของคุณจะเปลี่ยนจาก &quot;รอการตรวจสอบ (Pending)&quot; เป็น &quot;อนุมัติแล้ว (Approved)&quot; ทันที และสามารถเข้าสู่ระบบเพื่อใช้งานทุกฟังก์ชันได้อย่างเต็มรูปแบบ
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-white/10 pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (activeModal === 'pdpa') setConsentPdpa(true);
                  if (activeModal === 'terms') setConsentTerms(true);
                  if (activeModal === 'verification') setConsentVerification(true);
                  setActiveModal(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 text-white text-xs font-bold hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>เข้าใจและยอมรับข้อนี้ทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
