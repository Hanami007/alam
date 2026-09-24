'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen,
  Search,
  Quote,
  X,
  Edit3,
  CheckCircle2,
  Sparkles,
  Loader2,
  RotateCcw,
  Briefcase,
  MapPin,
  Grid,
  List,
  Heart,
  Laugh,
  Filter,
  UserCheck,
  GraduationCap,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  Building2,
  MessageCircle,
  CalendarDays,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export interface YearbookAlumnus {
  id: number | string;
  studentId: string;
  name: string;
  nickname: string;
  generation: string;
  generationNumber: number;
  gradYear: string;
  position: string;
  company: string;
  careerType: string;
  province: string;
  avatarUrl: string;
  quote: string;
  bio: string;
  skills: string[];
  likesCount?: number;
  laughsCount?: number;
  isAvailableForMentorship?: boolean;
}

const FUNNY_SENIOR_QUOTES = [
  'I spent 4 years learning Computer Science just to realize the solution was restarting the computer 💻',
  'เรียน 4 ปี ได้ความรู้ 10% อีก 90% อยู่ใน Stack Overflow กับ ChatGPT 🤖',
  'อย่าเอาเกรดเฉลี่ยมาตัดสินเรา เพราะเกรด 2.01 ก็เขียนบั๊กได้เนียนพอๆ กับเกรด 4.0 🐛',
  'I don\'t always test my code, but when I do, I do it directly in production 🔥',
  'เรียนคอมเพราะคิดว่าได้เล่นเกม พอจบมาได้เล่นเป็นตัวประกอบในกิลด์ Stack Overflow 🎮',
  'นอน 3 ชั่วโมงไม่ตายหรอก... แต่คอมไพล์ไม่ผ่านอาจทำให้หัวร้อนตายได้ ☕',
  'คอมไพล์ผ่านในครั้งแรก = สัญญาณเตือนภัยระดับรุนแรงที่สุด ⚠️',
  'Life is like a NullPointerException. Unexpected and breaks everything 💔',
  'อย่าเรียกว่าแก้บั๊ก ให้เรียกว่าสร้างฟีเจอร์ใหม่ที่ไม่พึงประสงค์ ✨',
  'อาจารย์บอกวิชานี้ง่าย... ง่ายที่ไหน! 😭',
];

export function YearbookGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [selectedCareer, setSelectedCareer] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const [selectedAlumnus, setSelectedAlumnus] = useState<YearbookAlumnus | null>(null);
  const [alumniList, setAlumniList] = useState<YearbookAlumnus[]>([]);
  // รุ่นที่มีข้อมูลจริงในระบบเท่านั้น (ดึงจาก lookup_options) ใช้เป็นตัวเลือกในฟอร์มแก้ไขของฉัน
  // — เลือกได้แค่รุ่นที่มีอยู่จริง กันปัญหาเลือกรุ่นที่ไม่มีในระบบแล้วบันทึกไม่ติด
  const [realGenerationOptions, setRealGenerationOptions] = useState<string[]>([]);
  // รุ่นที่มีโฟลเดอร์จริงอยู่บน NAS เท่านั้น (ไม่รวมรุ่นสาธิต/ทดสอบใน lookup_options ที่ไม่มีโฟลเดอร์จริง)
  // ใช้เป็นตัวเลือกในดรอปดาวน์กรองของหน้าหนังสือรุ่นโดยเฉพาะ ตามที่ผู้ใช้ระบุให้อิงตามข้อมูลจริงจาก NAS
  const [nasGenerationNumbers, setNasGenerationNumbers] = useState<number[]>([]);

  // Generation Dropdown Selector State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genSearch, setGenSearch] = useState('');
  const genDropdownWrapRef = useRef<HTMLDivElement>(null);

  // ปิดดรอปดาวน์เลือกรุ่นเมื่อคลิกนอกกรอบ
  useEffect(() => {
    if (!isGenModalOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (genDropdownWrapRef.current && !genDropdownWrapRef.current.contains(event.target as Node)) {
        setIsGenModalOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGenModalOpen]);

  // Reaction State
  const [reactions, setReactions] = useState<Record<string, { likes: number; laughs: number }>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Current logged in user state & My Yearbook Entry form state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusAlert, setStatusAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [myEntryForm, setMyEntryForm] = useState({
    name: '',
    nickname: '',
    avatarUrl: '',
    generation: 'รุ่น 43',
    quote: '',
    isAvailableForMentorship: false,
    birthDate: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await api.auth.me().catch(() => null);
        if (meRes?.user) {
          setCurrentUser(meRes.user);
        }

        const data = await api.admin.getYearbookList().catch(() => null);
        if (Array.isArray(data)) {
          const formatted: YearbookAlumnus[] = data.map((item: any, idx: number) => {
            const fallbackQuote = FUNNY_SENIOR_QUOTES[idx % FUNNY_SENIOR_QUOTES.length];
            const generationLabel = item.generation || 'รุ่น 43';
            // API ส่งมาแค่ label ("รุ่น 43") ไม่มี generationNumber แยกมาให้ ต้องแกะเลขรุ่นจาก label เอง
            // (เดิมใช้ item.generationNumber ตรงๆ ซึ่งไม่มีจริง เลย fallback เป็น 43 ทุกคน ทำให้กรองรุ่นไม่ได้ผล)
            const parsedGenNumber = parseInt(String(generationLabel).replace(/\D/g, ''), 10);
            return {
              id: item.id || `mju-${idx}`,
              studentId: item.studentId || `600100${idx + 10}`,
              name: item.name,
              nickname: item.nickname || item.name.split(' ')[0] || 'เพื่อน',
              generation: generationLabel,
              generationNumber: item.generationNumber || (isNaN(parsedGenNumber) ? 43 : parsedGenNumber),
              gradYear: item.graduationYear ? `${item.graduationYear + 543} (${item.graduationYear})` : '2564 (2021)',
              position: item.position || 'Software Developer',
              company: item.company || 'Tech Company',
              careerType: item.careerType || 'Software & Technology',
              province: item.province || 'เชียงใหม่',
              avatarUrl: item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
              quote: item.quote && item.quote.length > 3 ? item.quote : fallbackQuote,
              bio: item.quote || 'ศิษย์เก่าภาควิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้',
              skills: ['CS MJU'],
              likesCount: 15 + idx * 3,
              laughsCount: 20 + idx * 5,
              isAvailableForMentorship: Boolean(item.isAvailableForMentorship),
            };
          });
          setAlumniList(formatted);
        }

        // ดึงรายชื่อรุ่นที่มีข้อมูลจริงในระบบ (แหล่งเดียวกับหน้าสมัครสมาชิก) มาใช้เป็นตัวเลือก
        // ในฟอร์มแก้ไขข้อมูลของฉัน แทนเลข 1-48 ที่ตั้งไว้ตายตัว
        const lookupRes = await fetch('/api/lookup/register-data').then((r) => r.json()).catch(() => null);
        if (lookupRes?.generations && Array.isArray(lookupRes.generations)) {
          const labels: string[] = Array.from(
            new Set<string>(lookupRes.generations.map((g: any) => String(g.label)))
          );
          setRealGenerationOptions(labels);
        }

        // ดึงเลขรุ่นจริงที่มีโฟลเดอร์อยู่บน NAS มาใช้เป็นตัวเลือกในดรอปดาวน์กรองของหน้านี้โดยเฉพาะ
        const nasRes = await fetch('/api/nas/generations').then((r) => r.json()).catch(() => null);
        if (nasRes?.generations && Array.isArray(nasRes.generations)) {
          setNasGenerationNumbers(nasRes.generations);
        }
      } catch (err) {
        console.error('Error fetching yearbook data:', err);
      }
    }

    loadData();
  }, []);

  // Reaction Handler (toggle like)
  const handleReact = (e: React.MouseEvent, id: number | string, type: 'likes' | 'laughs') => {
    e.stopPropagation();
    const key = String(id);
    if (type === 'likes') {
      const alreadyLiked = likedIds.has(key);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (alreadyLiked) next.delete(key);
        else next.add(key);
        return next;
      });
      setReactions((prev) => {
        const current = prev[key] || { likes: 0, laughs: 0 };
        return {
          ...prev,
          [key]: { ...current, likes: alreadyLiked ? current.likes - 1 : current.likes + 1 },
        };
      });
    } else {
      setReactions((prev) => {
        const current = prev[key] || { likes: 0, laughs: 0 };
        return { ...prev, [key]: { ...current, [type]: current[type] + 1 } };
      });
    }
  };

  const getReactionCount = (alumnus: YearbookAlumnus, type: 'likes' | 'laughs') => {
    const key = String(alumnus.id);
    const added = reactions[key]?.[type] || 0;
    const base = type === 'likes' ? alumnus.likesCount || 0 : alumnus.laughsCount || 0;
    return base + added;
  };

  const myExistingEntry = useMemo(() => {
    if (!currentUser) return null;
    return alumniList.find(
      (a) => String(a.id) === String(currentUser.id) || a.studentId === currentUser.student_id
    );
  }, [alumniList, currentUser]);

  const handleOpenMyModal = () => {
    const isMentor = Boolean(
      myExistingEntry?.isAvailableForMentorship ??
        currentUser?.is_available_for_mentorship ??
        currentUser?.isAvailableForMentorship
    );
    const rawBirthDate = currentUser?.birth_date || currentUser?.birthDate || '';
    const birthDateValue = rawBirthDate ? String(rawBirthDate).slice(0, 10) : '';
    if (myExistingEntry) {
      setMyEntryForm({
        name: myExistingEntry.name || currentUser?.name || '',
        nickname: myExistingEntry.nickname || '',
        avatarUrl: myExistingEntry.avatarUrl || currentUser?.avatar_url || '',
        generation: myExistingEntry.generation || 'รุ่น 43',
        quote: myExistingEntry.quote || '',
        isAvailableForMentorship: isMentor,
        birthDate: birthDateValue,
      });
    } else {
      setMyEntryForm({
        name: currentUser?.name || '',
        nickname: currentUser?.name ? currentUser.name.split(' ')[0] : '',
        avatarUrl: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        generation: currentUser?.generation || 'รุ่น 43',
        quote: currentUser?.bio || '',
        isAvailableForMentorship: isMentor,
        birthDate: birthDateValue,
      });
    }
    setStatusAlert(null);
    setIsEditModalOpen(true);
  };

  const handleSaveMyEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!myEntryForm.name.trim()) {
      setStatusAlert({ type: 'error', message: 'กรุณากรอกชื่อ-นามสกุล' });
      return;
    }
    if (!myEntryForm.quote.trim()) {
      setStatusAlert({ type: 'error', message: 'กรุณากรอกคำคมประจำใจ' });
      return;
    }

    try {
      setIsSaving(true);
      setStatusAlert(null);

      // Save user profile changes directly to Database
      await api.user.updateProfile({
        name: myEntryForm.name.trim(),
        bio: myEntryForm.quote.trim(),
        avatarUrl: myEntryForm.avatarUrl.trim(),
        generation: myEntryForm.generation,
        isAvailableForMentorship: myEntryForm.isAvailableForMentorship,
        birthDate: myEntryForm.birthDate || undefined,
        yearbookPublished: true,
      }).catch((err) => {
        console.error('Error updating profile to Database:', err);
      });

      setCurrentUser((prev: any) => ({
        ...prev,
        name: myEntryForm.name.trim(),
        bio: myEntryForm.quote.trim(),
        avatar_url: myEntryForm.avatarUrl.trim(),
        generation: myEntryForm.generation,
        is_available_for_mentorship: myEntryForm.isAvailableForMentorship,
        birth_date: myEntryForm.birthDate || null,
      }));

      const genNum = parseInt(myEntryForm.generation.replace(/\D/g, '')) || 43;

      setAlumniList((prevList) => {
        const existingIdx = prevList.findIndex(
          (a) => String(a.id) === String(currentUser.id) || a.studentId === currentUser.student_id
        );

        if (existingIdx !== -1) {
          const updated = [...prevList];
          updated[existingIdx] = {
            ...updated[existingIdx],
            name: myEntryForm.name.trim(),
            nickname: myEntryForm.nickname.trim() || myEntryForm.name.trim().split(' ')[0],
            avatarUrl: myEntryForm.avatarUrl.trim(),
            generation: myEntryForm.generation,
            generationNumber: genNum,
            quote: myEntryForm.quote.trim(),
            bio: myEntryForm.quote.trim(),
            isAvailableForMentorship: myEntryForm.isAvailableForMentorship,
          };
          return updated;
        } else {
          const newEntry: YearbookAlumnus = {
            id: currentUser.id || `user-${Date.now()}`,
            studentId: currentUser.student_id || '60010001',
            name: myEntryForm.name.trim(),
            nickname: myEntryForm.nickname.trim() || myEntryForm.name.trim().split(' ')[0],
            generation: myEntryForm.generation,
            generationNumber: genNum,
            gradYear: '2564 (2021)',
            position: currentUser.position || 'ศิษย์เก่า',
            company: currentUser.company || 'มหาวิทยาลัยแม่โจ้',
            careerType: 'Software & Technology',
            province: currentUser.province || 'เชียงใหม่',
            avatarUrl: myEntryForm.avatarUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
            quote: myEntryForm.quote.trim(),
            bio: myEntryForm.quote.trim(),
            skills: ['CS MJU'],
            isAvailableForMentorship: myEntryForm.isAvailableForMentorship,
          };
          return [newEntry, ...prevList];
        }
      });

      setStatusAlert({ type: 'success', message: 'บันทึกข้อมูลหนังสือรุ่นของคุณเรียบร้อยแล้ว!' });
      setTimeout(() => {
        setIsEditModalOpen(false);
        setStatusAlert(null);
      }, 1000);
    } catch (err: any) {
      console.error('Error updating my yearbook entry:', err);
      setStatusAlert({ type: 'error', message: err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
      setIsSaving(false);
    }
  };

  // แสดงเฉพาะรุ่นที่มีโฟลเดอร์จริงอยู่บน NAS เท่านั้น (ไม่รวมรุ่นสาธิต/ทดสอบใน lookup_options ที่ไม่มี
  // โฟลเดอร์จริงรองรับ) เรียงจากรุ่นน้อยไปมากตามที่ผู้ใช้ระบุ
  const availableGenerations = useMemo(() => {
    return Array.from(new Set(nasGenerationNumbers)).sort((a, b) => a - b);
  }, [nasGenerationNumbers]);

  const generations = useMemo(() => {
    return [
      { label: 'ทุกรุ่น', value: 'all' },
      ...availableGenerations.map((n) => ({ label: `รุ่น ${n}`, value: String(n) })),
    ];
  }, [availableGenerations]);

  const careerOptions = useMemo(() => {
    const types = [...new Set(alumniList.map((a) => a.careerType).filter(Boolean))];
    return [{ label: 'ทุกสายงาน', value: 'all' }, ...types.map((t) => ({ label: t, value: t }))];
  }, [alumniList]);

  const provinceOptions = useMemo(() => {
    const list = [...new Set(alumniList.map((a) => a.province).filter(Boolean))];
    return [{ label: 'ทุกจังหวัด', value: 'all' }, ...list.map((p) => ({ label: p, value: p }))];
  }, [alumniList]);

  const filteredAlumni = useMemo(() => {
    return alumniList.filter((alumnus) => {
      if (selectedGeneration !== 'all' && alumnus.generationNumber.toString() !== selectedGeneration) {
        return false;
      }
      if (selectedCareer !== 'all' && alumnus.careerType !== selectedCareer) {
        return false;
      }
      if (selectedProvince !== 'all' && alumnus.province !== selectedProvince) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        alumnus.name.toLowerCase().includes(q) ||
        alumnus.nickname.toLowerCase().includes(q) ||
        alumnus.studentId.includes(q) ||
        alumnus.quote.toLowerCase().includes(q) ||
        alumnus.position.toLowerCase().includes(q) ||
        alumnus.company.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedGeneration, selectedCareer, selectedProvince, alumniList]);

  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedGeneration !== 'all' ||
    selectedCareer !== 'all' ||
    selectedProvince !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGeneration('all');
    setSelectedCareer('all');
    setSelectedProvince('all');
  };

  // Pastel color palette per card index
  const PASTEL_GRADIENTS = [
    'from-rose-100 via-pink-50 to-white',
    'from-sky-100 via-blue-50 to-white',
    'from-violet-100 via-purple-50 to-white',
    'from-emerald-100 via-teal-50 to-white',
    'from-amber-100 via-yellow-50 to-white',
    'from-indigo-100 via-blue-50 to-white',
    'from-fuchsia-100 via-pink-50 to-white',
    'from-cyan-100 via-sky-50 to-white',
  ];
  const PASTEL_RINGS = [
    'ring-rose-300',
    'ring-sky-300',
    'ring-violet-300',
    'ring-emerald-300',
    'ring-amber-300',
    'ring-indigo-300',
    'ring-fuchsia-300',
    'ring-cyan-300',
  ];
  const PASTEL_BADGES = [
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-sky-100 text-sky-700 border-sky-200',
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-2 sm:px-4 py-2">
      {/* ─── HERO HEADER BANNER — Soft Pastel ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-100 via-pink-50 to-sky-100 border border-pink-200/60 p-6 sm:p-8 shadow-sm">
        {/* Decorative blobs */}
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-rose-200/40 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-8 h-40 w-40 rounded-full bg-violet-200/40 blur-2xl pointer-events-none" />
        <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-sky-200/30 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 text-violet-700 text-xs font-bold backdrop-blur-sm border border-violet-200/60 shadow-xs">
              <GraduationCap className="h-3.5 w-3.5 text-violet-500" />
              <span>ทำเนียบหนังสือรุ่นศิษย์เก่า CS MJU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              ความทรงจำ &amp; สายสัมพันธ์
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500">ศิษย์เก่าแม่โจ้ ✨</span>
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-lg">
              รวมเรื่องราว คำคมสุดจำ และทำเนียบศิษย์เก่าภาควิชาวิทยาการคอมพิวเตอร์
            </p>
          </div>
        </div>
      </div>

      {/* ─── ACTION BUTTONS BAR ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* ปุ่มสำหรับกดเลือกรุ่น (คลิกแล้วเป็นดรอปดาวน์) */}
        <div className="relative" ref={genDropdownWrapRef}>
          <button
            onClick={() => setIsGenModalOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-violet-200 text-violet-800 text-xs sm:text-sm font-bold hover:bg-violet-50 hover:border-violet-400 hover:shadow-md transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <GraduationCap className="h-4 w-4 text-violet-500" />
            <span>
              {selectedGeneration === 'all'
                ? '🎓 เลือกรุ่น (ทุกรุ่น)'
                : `กำลังดู: รุ่น ${selectedGeneration}`}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-violet-400 transition-transform duration-200 ${isGenModalOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* ─── Generation Dropdown Panel ─────────────────────────────── */}
          {isGenModalOpen && (
            <div className="animate-fade-in absolute left-0 top-full z-40 mt-2 w-[min(85vw,260px)] max-h-[70vh] flex flex-col rounded-[28px] border border-slate-100 bg-white p-3 shadow-2xl">
              <div className="border-b border-slate-100 pb-3 shrink-0">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                  <span>เลือกรุ่นศิษย์เก่า ({availableGenerations.length} รุ่น)</span>
                </h2>
              </div>

              {/* Quick Search Generation */}
              <div className="relative shrink-0 mt-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={genSearch}
                  onChange={(e) => setGenSearch(e.target.value)}
                  placeholder="ค้นหารุ่น (พิมพ์เลขรุ่น เช่น 1, 43)..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Show All Option */}
              <div className="shrink-0 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGeneration('all');
                    setIsGenModalOpen(false);
                  }}
                  className={`w-full py-2.5 px-4 rounded-2xl text-xs font-extrabold transition-all border flex items-center justify-between cursor-pointer ${
                    selectedGeneration === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🎓 แสดงศิษย์เก่าทุกรุ่น</span>
                  <span className="text-[11px] opacity-80">รวม {alumniList.length} รายการ</span>
                </button>
              </div>

              {/* รายการรุ่นที่มีโฟลเดอร์จริงบน NAS เรียงจากรุ่นน้อยไปมาก */}
              <div className="overflow-y-auto p-1 flex flex-col gap-1.5 flex-1 mt-3 scrollbar-hide">
                {availableGenerations.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">ยังไม่มีข้อมูลรุ่นในระบบ</p>
                )}
                {availableGenerations
                  .filter((genNum) => !genSearch.trim() || String(genNum).includes(genSearch.trim()))
                  .map((genNum) => {
                    const isSelected = selectedGeneration === String(genNum);

                    return (
                      <button
                        key={genNum}
                        type="button"
                        onClick={() => {
                          setSelectedGeneration(String(genNum));
                          setIsGenModalOpen(false);
                        }}
                        className={`w-full px-4 py-2 rounded-2xl text-xs font-bold flex items-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-indigo-50/80 text-indigo-900 border-indigo-200/90 hover:bg-indigo-100'
                        }`}
                      >
                        <span className="font-black text-xs sm:text-sm">รุ่น {genNum}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* ปุ่มเพิ่ม / แก้ไขข้อมูลหนังสือรุ่นของฉัน */}
        <button
          onClick={handleOpenMyModal}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white px-5 py-2.5 text-xs sm:text-sm font-bold hover:opacity-90 hover:shadow-lg transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          <Edit3 className="h-4 w-4" />
          <span>
            {myExistingEntry ? '✏️ แก้ไขข้อมูลของฉัน' : '✨ เพิ่มข้อมูลหนังสือรุ่น'}
          </span>
        </button>
      </div>



      {/* ─── ALUMNI DISPLAY CONTAINER ─────────────────────────────────── */}
      {filteredAlumni.length === 0 ? (
        <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-3xl border border-pink-200/60 p-14 text-center space-y-4 shadow-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mx-auto">
            <BookOpen className="h-8 w-8 text-violet-400" />
          </div>
          <h3 className="text-base font-bold text-slate-700">ไม่พบข้อมูลศิษย์เก่าตามเงื่อนไขที่ค้นหา</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่มรีเซ็ตเพื่อแสดงผลศิษย์เก่าทั้งหมด
          </p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>แสดงผลศิษย์เก่าทั้งหมด</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── PASTEL HORIZONTAL GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredAlumni.map((alumnus, idx) => {
            const isMe =
              currentUser &&
              (String(alumnus.id) === String(currentUser.id) || alumnus.studentId === currentUser.student_id);
            const pastelGrad = isMe ? 'from-amber-50 via-yellow-50 to-white' : PASTEL_GRADIENTS[idx % PASTEL_GRADIENTS.length];
            const pastelRing = isMe ? 'ring-amber-300' : PASTEL_RINGS[idx % PASTEL_RINGS.length];
            const pastelBadge = isMe ? 'bg-amber-100 text-amber-700 border-amber-200' : PASTEL_BADGES[idx % PASTEL_BADGES.length];

            return (
              <div
                key={alumnus.id}
                onClick={() => setSelectedAlumnus(alumnus)}
                className={`group relative flex flex-row items-stretch gap-0 bg-gradient-to-r ${pastelGrad} border border-white/80 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden`}
              >
                {/* Decorative blob */}
                <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/40 blur-xl pointer-events-none" />

                {/* Own Card Badge */}
                {isMe && (
                  <div className="absolute top-2 right-2 z-10 bg-amber-400 text-amber-900 text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-xs border border-amber-300">
                    ✨ ของฉัน
                  </div>
                )}

                {/* 1. รูปภาพสี่เหลี่ยม (ด้านซ้าย ยืดเต็มความสูง มี rounded ซ้ายตามการ์ด) */}
                <div className="relative shrink-0 w-[96px] sm:w-[110px] overflow-hidden rounded-l-2xl">
                  <img
                    src={alumnus.avatarUrl}
                    alt={alumnus.name}
                    className="w-full h-full object-cover object-top"
                    style={{ minHeight: '135px' }}
                  />
                  {alumnus.isAvailableForMentorship && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-500 text-white text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full shadow-xs border border-white">
                      💬
                    </span>
                  )}
                </div>

                {/* RIGHT: badge + ชื่อ + คำคม + ปุ่มใจ */}
                <div className="flex flex-col min-w-0 flex-1 gap-1.5 relative z-10 px-4 py-3.5 justify-center">
                  {/* 2. รุ่น Badge */}
                  <span className={`inline-block self-start text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${pastelBadge}`}>
                    {alumnus.generation}
                  </span>

                  {/* 3. ชื่อ */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug truncate">
                    {alumnus.name}
                    {alumnus.nickname ? <span className="text-xs sm:text-sm font-medium text-slate-500 ml-1">({alumnus.nickname})</span> : null}
                  </h3>

                  {/* 4. คำคม */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 italic">
                    &ldquo;{alumnus.quote}&rdquo;
                  </p>

                  {/* 5. ปุ่มกดใจ */}
                  <button
                    onClick={(e) => handleReact(e, alumnus.id, 'likes')}
                    className={`self-start mt-1 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all duration-200 active:scale-90 ${
                      likedIds.has(String(alumnus.id))
                        ? 'bg-rose-100 text-rose-600 border border-rose-200 shadow-xs'
                        : 'bg-white/80 text-slate-500 hover:bg-rose-50 hover:text-rose-500 border border-white shadow-xs'
                    }`}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 transition-all duration-200 ${
                        likedIds.has(String(alumnus.id))
                          ? 'fill-rose-500 text-rose-500 scale-110'
                          : 'fill-transparent text-rose-300'
                      }`}
                    />
                    <span>{getReactionCount(alumnus, 'likes')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── PASTEL LIST VIEW ── */
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-violet-100 overflow-hidden shadow-xs divide-y divide-violet-50">
          {filteredAlumni.map((alumnus, idx) => {
            const isMe =
              currentUser &&
              (String(alumnus.id) === String(currentUser.id) || alumnus.studentId === currentUser.student_id);
            const pastelRing = isMe ? 'ring-amber-300' : PASTEL_RINGS[idx % PASTEL_RINGS.length];

            return (
              <div
                key={alumnus.id}
                onClick={() => setSelectedAlumnus(alumnus)}
                className={`px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-violet-50/50 transition-colors cursor-pointer ${
                  isMe ? 'bg-amber-50/40' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* 1. รูปภาพวงกลม */}
                  <img
                    src={alumnus.avatarUrl}
                    alt={alumnus.name}
                    className={`h-12 w-12 rounded-full object-cover ring-2 ring-offset-1 ${pastelRing} shrink-0 shadow-xs`}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* 2. ชื่อ */}
                      <h4 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                        {alumnus.name} {alumnus.nickname ? `(${alumnus.nickname})` : ''}
                      </h4>
                      {/* 3. รุ่น */}
                      <span className="text-xs font-extrabold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100 shrink-0">
                        {alumnus.generation}
                      </span>
                      {alumnus.isAvailableForMentorship && (
                        <span className="text-[11px] sm:text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          💬 ให้คำแนะนำ
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[11px] sm:text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                          ✨ ฉัน
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 italic mt-0.5 truncate max-w-xs sm:max-w-md leading-relaxed">
                      &ldquo;{alumnus.quote}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Like button */}
                <div className="flex items-center justify-end shrink-0">
                  <button
                    onClick={(e) => handleReact(e, alumnus.id, 'likes')}
                    className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      likedIds.has(String(alumnus.id))
                        ? 'bg-rose-100 text-rose-600 border border-rose-200'
                        : 'bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 border border-slate-200'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 transition-all ${
                      likedIds.has(String(alumnus.id)) ? 'fill-rose-500 text-rose-500' : 'fill-transparent text-rose-400'
                    }`} />
                    <span>{getReactionCount(alumnus, 'likes')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Add/Edit My Yearbook Entry Modal ────────────────────────────── */}
      {isEditModalOpen && (
        <div
          onClick={() => setIsEditModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white p-6 shadow-2xl rounded-[32px] border border-slate-100 space-y-4 animate-scale-up"
          >
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <span>
                  {myExistingEntry ? 'แก้ไขข้อมูลหนังสือรุ่นของฉัน' : 'เพิ่มข้อมูลหนังสือรุ่นของฉัน'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                (1 บัญชีผู้ใช้สามารถสร้างข้อมูลหนังสือรุ่นได้ 1 รายการ)
              </p>
            </div>

            {statusAlert && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                  statusAlert.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {statusAlert.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                <span>{statusAlert.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveMyEntry} className="space-y-3">
              {/* ชื่อ & ชื่อเล่น */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ชื่อ - นามสกุล *
                  </label>
                  <input
                    type="text"
                    required
                    value={myEntryForm.name}
                    onChange={(e) => setMyEntryForm({ ...myEntryForm, name: e.target.value })}
                    placeholder="เช่น สมชาย ใจดี"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ชื่อเล่น
                  </label>
                  <input
                    type="text"
                    value={myEntryForm.nickname}
                    onChange={(e) => setMyEntryForm({ ...myEntryForm, nickname: e.target.value })}
                    placeholder="เช่น ชาย"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* เลือกรุ่น */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-600" /> รุ่น (Generation) *
                </label>
                <select
                  value={myEntryForm.generation}
                  onChange={(e) => setMyEntryForm({ ...myEntryForm, generation: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  {realGenerationOptions.map((gen) => (
                    <option key={gen} value={gen}>
                      {gen}
                    </option>
                  ))}
                </select>
              </div>

              {/* วันเกิด (ใช้แสดงในวิดเจ็ต "สุขสันต์วันเกิด" หน้าฟีดเมื่อถึงวันจริง) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-pink-500" /> วันเกิด
                </label>
                <input
                  type="date"
                  value={myEntryForm.birthDate}
                  onChange={(e) => setMyEntryForm({ ...myEntryForm, birthDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  ระบบจะแสดงคุณในวิดเจ็ต &ldquo;สุขสันต์วันเกิด&rdquo; หน้าฟีดเมื่อถึงวันเกิดจริงของคุณ
                </p>
              </div>

              {/* อัปโหลดรูปภาพประจำตัว */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-indigo-600" /> รูปภาพประจำตัว (Upload Photo)
                </label>

                <div className="flex items-center gap-3">
                  {/* Preview Thumbnail */}
                  <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    {myEntryForm.avatarUrl ? (
                      <img src={myEntryForm.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    {/* File Upload Input Button */}
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer active:scale-95 shadow-2xs">
                      <Upload className="h-4 w-4" />
                      <span>อัปโหลดรูปภาพจากไฟล์...</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) {
                                setMyEntryForm({ ...myEntryForm, avatarUrl: evt.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* คำคมประจำใจ */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                  <Quote className="h-3.5 w-3.5 text-amber-500" /> คำคมประจำใจ (Senior Quote) *
                </label>
                <textarea
                  rows={3}
                  maxLength={180}
                  required
                  value={myEntryForm.quote}
                  onChange={(e) => setMyEntryForm({ ...myEntryForm, quote: e.target.value })}
                  placeholder="พิมพ์คำคมตลกๆ หรือคติประจำใจของคุณที่นี่..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>จำกัดไม่เกิน 180 ตัวอักษร</span>
                  <span className="font-mono">{myEntryForm.quote.length} / 180</span>
                </div>
              </div>


              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold hover:opacity-90 transition-opacity rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <span>{myExistingEntry ? 'บันทึกการแก้ไข' : 'สร้างข้อมูลหนังสือรุ่น'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Detail Modal ────────────────────────────────────────────── */}
      {selectedAlumnus && (
        <div
          onClick={() => setSelectedAlumnus(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white p-6 sm:p-7 shadow-2xl rounded-[36px] border border-slate-100 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setSelectedAlumnus(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Profile Header (Photo, Gen, Name) */}
            <div className="text-center space-y-3">
              <div className="relative inline-block">
                <img
                  src={selectedAlumnus.avatarUrl}
                  alt={selectedAlumnus.name}
                  className="h-32 w-32 rounded-3xl object-cover mx-auto ring-4 ring-indigo-100 shadow-md"
                />
                {selectedAlumnus.isAvailableForMentorship && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 border-2 border-white">
                    <MessageCircle className="h-3 w-3" /> ยินดีให้คำแนะนำ
                  </span>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-1.5">
                  <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-0.5 text-xs font-extrabold rounded-full border border-indigo-100">
                    {selectedAlumnus.generation}
                  </span>
                  {selectedAlumnus.gradYear && (
                    <span className="inline-block bg-slate-100 text-slate-600 px-2.5 py-0.5 text-xs font-medium rounded-full">
                      จบปี {selectedAlumnus.gradYear}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedAlumnus.name} {selectedAlumnus.nickname ? `(${selectedAlumnus.nickname})` : ''}
                </h2>
                {selectedAlumnus.studentId && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    รหัส: {selectedAlumnus.studentId}
                  </p>
                )}
              </div>
            </div>

            {/* Workplace & Position Info Card (ข้อมูลที่ทำงานและตำแหน่งงาน) */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 mt-0.5">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ตำแหน่งงาน</p>
                  <p className="text-sm font-bold text-slate-800 break-words">
                    {selectedAlumnus.position || 'ไม่ได้ระบุ'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 mt-0.5">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">สถานที่ทำงาน / องค์กร</p>
                  <p className="text-sm font-bold text-slate-800 break-words">
                    {selectedAlumnus.company || 'ไม่ได้ระบุ'}
                  </p>
                </div>
              </div>

              {(selectedAlumnus.province || selectedAlumnus.careerType) && (
                <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">พื้นที่ & ประเภทสายงาน</p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-700">
                      {selectedAlumnus.province || 'ไม่ระบุจังหวัด'} {selectedAlumnus.careerType ? `• ${selectedAlumnus.careerType}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Senior Quote (คำคมประจำใจ) */}
            {selectedAlumnus.quote && (
              <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200/60 text-center shadow-2xs relative">
                <Quote className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <p className="text-sm font-serif italic font-bold text-amber-950 leading-relaxed">
                  &ldquo;{selectedAlumnus.quote}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

