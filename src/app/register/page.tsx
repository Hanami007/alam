'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';

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
  const [showHometownOnMap, setShowHometownOnMap] = useState<boolean>(true);
  const [autoMatchedGen, setAutoMatchedGen] = useState<any | null>(null);

  // Alumni Specific Fields (ข้อมูลเพิ่มเติมสำหรับศิษย์เก่า)
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [careerOptionId, setCareerOptionId] = useState<string>('');
  const [workProvinceId, setWorkProvinceId] = useState<string>('');
  const [showWorkplaceOnMap, setShowWorkplaceOnMap] = useState<boolean>(true);
  const [bio, setBio] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const res = await fetch('/api/lookup/register-data');
        const data = await res.json();
        if (res.ok) {
          setGenerations(data.generations || []);
          setProvinces(data.provinces || []);
          setCareerTypes(data.careerTypes || []);

          if (data.generations?.length > 0) {
            // Default to Gen 29 (66) if found, else first
            const gen29 = data.generations.find((g: any) => g.code === 'gen-29' || g.label === 'รุ่น 29');
            setGenerationOptionId(String(gen29 ? gen29.id : data.generations[0].id));
          }
          if (data.provinces?.length > 0) {
            // Default to Chiang Mai if found, else first province
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

  // เมื่อผู้ใช้พิมพ์รหัสนักศึกษา 10 หลัก: เชื่อมโยงรุ่นอัตโนมัติ (เช่น 66 -> 66 - 37 = รุ่น 29)
  function handleStudentIdChange(val: string) {
    // รับเฉพาะตัวเลขและจำกัดไม่เกิน 10 หลัก
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

      // เชื่อมโยงรุ่นจากฐานข้อมูลอัตโนมัติ
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !studentId.trim() || !email.trim() || !password) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
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
          showHometownOnMap,
          company: company.trim(),
          position: position.trim(),
          careerOptionId: careerOptionId ? Number(careerOptionId) : null,
          workProvinceId: workProvinceId ? Number(workProvinceId) : Number(provinceOptionId),
          showWorkplaceOnMap,
          bio: bio.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full max-w-5xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl my-8">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30 border border-white/20 mb-1">
            <GraduationCap className="h-9 w-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            สมัครสมาชิก CS MJU CONNECT
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            ลงทะเบียนเข้าร่วมเครือข่ายศิษย์เก่าและนักศึกษา วิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้
          </p>
        </div>

        {/* Registration Card or Success Card */}
        {successData ? (
          <div className="rounded-[32px] border border-white/15 bg-white/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-slide-up">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-md">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">
                ลงทะเบียนสำเร็จเรียบร้อย!
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                ระบบได้ส่งการแจ้งเตือนไปยัง <span className="font-bold text-indigo-700">ผู้ดูแลระบบ (Admin)</span> และ <span className="font-bold text-indigo-700">เพื่อนร่วมรุ่น</span> เพื่อตรวจสอบและยืนยันตัวตนของคุณแล้ว
              </p>
            </div>

            <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 text-left space-y-2 text-xs text-indigo-950">
              <p className="font-bold flex items-center gap-1.5 text-indigo-700">
                <ShieldCheck className="h-4 w-4" /> ขั้นตอนต่อไปคืออะไร?
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>เมื่อแอดมินหรือเพื่อนร่วมรุ่นกดยืนยันตัวตน บัญชีของคุณจะเปลี่ยนเป็นสถานะ <strong className="text-emerald-700">อนุมัติแล้ว</strong> ทันที</li>
                <li>คุณจะสามารถเข้าสู่ระบบด้วยรหัสนักศึกษา/อีเมล และรหัสผ่านที่ตั้งไว้</li>
                <li>ข้อมูลจังหวัดที่คุณเลือกจะถูกแสดงหมุดบนแผนที่ศิษย์เก่า (Alumni Map) หลังได้รับการอนุมัติ</li>
              </ul>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>ไปที่หน้าเข้าสู่ระบบ (Login)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-[32px] border border-white/15 bg-white/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-100 pb-4 text-center sm:text-left">
              <h2 className="text-lg font-bold text-slate-900">กรอกข้อมูลผู้สมัคร</h2>
              <p className="text-xs text-slate-500">กรุณากรอกข้อมูลจริงเพื่อความสะดวกในการยืนยันตัวตนโดยเพื่อนร่วมรุ่นและแอดมิน</p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 font-medium animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Toggle Status: ศิษย์ปัจจุบัน vs ศิษย์เก่า */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-indigo-600" /> ประเภทผู้ใช้งาน
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setStudentStatus('studying')}
                    className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      studentStatus === 'studying'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🎓 ศิษย์ปัจจุบัน (Studying)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentStatus('alumni')}
                    className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      studentStatus === 'alumni'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏛️ ศิษย์เก่า (Alumni)
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  * หากเลือกศิษย์ปัจจุบัน เมื่อครบ 4 ปีตามปีปัจจุบัน ระบบจะเลื่อนเป็นศิษย์เก่าให้อัตโนมัติ
                </p>
              </div>

              {/* Row 1: Name and Student ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-indigo-600" /> ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-indigo-600" /> รหัสนักศึกษา (10 หลัก) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">2 ตัวหน้าจะระบุรุ่นอัตโนมัติ</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={studentId}
                    onChange={(e) => handleStudentIdChange(e.target.value)}
                    placeholder="เช่น 66041013xx (10 หลัก)"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-mono"
                  />
                  {autoMatchedGen && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-xl px-3 py-1.5 font-medium animate-slide-up">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>เชื่อมโยงอัตโนมัติ: <strong>{autoMatchedGen.label}</strong> (รหัส {autoMatchedGen.prefix}xx / เข้าปี {autoMatchedGen.yearBE})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-indigo-600" /> อีเมล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="เช่น somchai@example.com หรือ student@mju.ac.th"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>

              {/* Row 3: Province (For Map) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-indigo-600" /> จังหวัดภูมิลำเนา / ปัจจุบัน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={provinceOptionId}
                  onChange={(e) => setProvinceOptionId(e.target.value)}
                  disabled={loadingOptions}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                >
                  {provinces.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.label} ({prov.region || 'ทั่วไทย'})
                    </option>
                  ))}
                </select>
                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHometownOnMap}
                      onChange={(e) => setShowHometownOnMap(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="flex items-center gap-1">
                      <Compass className="h-3.5 w-3.5 text-indigo-600" />
                      ยินยอมแสดงตำแหน่งจังหวัดภูมิลำเนาบนแผนที่ศิษย์เก่า (Alumni Map)
                    </span>
                  </label>
                </div>
              </div>

              {/* 🏛️ ส่วนกรอกข้อมูลเฉพาะสำหรับศิษย์เก่า (Alumni Workplace, Career & Bio) */}
              {studentStatus === 'alumni' && (
                <div className="rounded-3xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 p-5 sm:p-6 space-y-4 shadow-sm animate-slide-up">
                  <div className="flex items-start justify-between border-b border-amber-200/60 pb-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-300 text-amber-800 px-3 py-1 text-xs font-bold mb-1">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        <span>ข้อมูลเฉพาะสำหรับศิษย์เก่า (Alumni Details)</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-amber-600" />
                        ประวัติการทำงานและสายอาชีพปัจจุบัน
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ข้อมูลนี้จะถูกนำไปแสดงในทำเนียบรุ่น (Yearbook), แผนที่สถานที่ทำงาน (Workplace Map) และหน้าโปรไฟล์ของคุณ
                      </p>
                    </div>
                  </div>

                  {/* Company & Position */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-amber-600" /> บริษัท / องค์กรที่ทำงาน <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={studentStatus === 'alumni'}
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="เช่น Agoda, SCB TechX, ม.แม่โจ้, บริษัท..."
                        className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all shadow-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-amber-600" /> ตำแหน่งงานปัจจุบัน <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={studentStatus === 'alumni'}
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="เช่น Senior Software Engineer, ครู, ผู้จัดการ..."
                        className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Career Type & Workplace Province */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-amber-600" /> ประเภทสายงาน / ภาคส่วน
                      </label>
                      <select
                        value={careerOptionId}
                        onChange={(e) => setCareerOptionId(e.target.value)}
                        className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all shadow-xs"
                      >
                        {careerTypes.map((ct) => (
                          <option key={ct.id} value={ct.id}>
                            {ct.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-amber-600" /> จังหวัดของสถานที่ทำงาน
                      </label>
                      <select
                        value={workProvinceId}
                        onChange={(e) => setWorkProvinceId(e.target.value)}
                        className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all shadow-xs"
                      >
                        {provinces.map((prov) => (
                          <option key={prov.id} value={prov.id}>
                            {prov.label} ({prov.region || 'ทั่วไทย'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Checkbox show workplace on map */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showWorkplaceOnMap}
                        onChange={(e) => setShowWorkplaceOnMap(e.target.checked)}
                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                      />
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Compass className="h-3.5 w-3.5 text-amber-600" />
                        ยินยอมแสดงหมุดสถานที่ทำงานบนแผนที่ศิษย์เก่า (Workplace Map)
                      </span>
                    </label>
                  </div>

                  {/* Bio / Quote */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Quote className="h-3.5 w-3.5 text-amber-600" /> คำแนะนำตัวสั้นๆ / ประสบการณ์ / คติประจำใจ
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="เช่น ศิษย์เก่า CS แม่โจ้ ชื่นชอบด้าน Fullstack & Cloud ยินดีให้คำแนะนำแก่น้องๆ ในสาขา"
                      className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all resize-none shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* Row 5: Password and Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-indigo-600" /> รหัสผ่าน <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="กำหนดรหัสผ่าน (ขั้นต่ำ 6 ตัว)"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 pr-10 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-indigo-600" /> ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>กำลังส่งข้อมูลลงทะเบียน...</span>
                  </div>
                ) : (
                  <>
                    <span>ยืนยันการสมัครสมาชิก</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Link back to login */}
            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-xs text-slate-500">
                มีบัญชีอยู่แล้วใช่หรือไม่?{' '}
                <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-800 underline transition-colors">
                  เข้าสู่ระบบที่นี่
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          ภาควิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้ © 2026
        </p>
      </div>
    </div>
  );
}
