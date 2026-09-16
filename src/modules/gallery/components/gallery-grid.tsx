'use client';
import { useState, useMemo, useEffect, Fragment } from 'react';
import { notifyPointsUpdated } from '@/lib/events';
import {
  Lock,
  Unlock,
  ImageIcon,
  CheckCircle2,
  Search,
  X,
  Sparkles,
  FolderTree,
  Eye,
  ChevronRight,
  ChevronDown,
  HardDrive,
  Folder,
  FolderOpen,
  KeyRound,
  Filter,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { ParsedNasPhoto, GenerationSummary } from '@/services/nas/catalog.service';

interface GalleryItem {
  id: number | string;
  title: string;
  generation: string;
  year?: number;
  image: string;
  original_image?: string;
  originalImage?: string;
  locked: boolean;
  unlock_question?: string;
  unlockQuestion?: string;
  points_for_unlock?: number;
  pointsForUnlock?: number;
  tags: string[];
}

interface GalleryGridProps {
  items: GalleryItem[];
  currentUserId: number;
  allUsers: {
    id: number;
    name: string;
    student_id?: string;
    generation?: string;
    company?: string;
    position?: string;
  }[];
  /** role ของผู้ใช้ปัจจุบัน — เฉพาะ 'admin' เท่านั้นที่เรียกดูทำเนียบรุ่น NAS ข้ามรุ่นได้ */
  currentUserRole?: string;
  /** รุ่นของผู้ใช้ปัจจุบัน (เช่น "รุ่น 43") — สมาชิกทั่วไปจะเห็นเฉพาะทำเนียบรุ่นของตัวเอง */
  currentUserGeneration?: string;
}

type GalleryViewMode = 'nas_yearbook' | 'activities';
type FilterType = 'generation' | 'year';

export function GalleryGrid({
  items: initialItems = [],
  currentUserId,
  allUsers = [],
  currentUserRole,
  currentUserGeneration,
}: GalleryGridProps) {
  const isAdmin = currentUserRole === 'admin';

  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState<GalleryViewMode>('nas_yearbook');

  // Dynamic NAS Catalog states
  const [catalogPhotos, setCatalogPhotos] = useState<ParsedNasPhoto[]>([]);
  const [generationsSummary, setGenerationsSummary] = useState<GenerationSummary[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(true);

  // Filters
  // สมาชิกทั่วไป (ไม่ใช่ admin) ถูกจำกัดให้ดูได้เฉพาะรุ่นของตัวเอง — ไม่ใช่ 'รุ่น 20' เป็นค่าเริ่มต้นเหมือน admin
  const [filterMode, setFilterMode] = useState<FilterType>('generation');
  const [selectedGen, setSelectedGen] = useState<string>(
    !isAdmin && currentUserGeneration ? currentUserGeneration : 'รุ่น 20'
  );
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(57);
  const [selectedSubfolder, setSelectedSubfolder] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [codeFilter, setCodeFilter] = useState<string>('');

  // Tree expansion state
  const [expandedGens, setExpandedGens] = useState<Record<string, boolean>>({
    'รุ่น 20': true,
    'รุ่น 21': true,
    'รุ่น 22': true,
    'รุ่น 24': true,
  });

  // Generation Unlock Quiz State — ไม่มีรุ่นใดปลดล็อกให้ฟรี ทุกรุ่น (รวมรุ่นของตัวเอง) ต้องตอบคำถามก่อนเสมอ
  const [unlockedGenerations, setUnlockedGenerations] = useState<string[]>([]);
  const [genQuizAnswer, setGenQuizAnswer] = useState<string>('');
  const [genUnlocking, setGenUnlocking] = useState<boolean>(false);
  const [genUnlockSuccess, setGenUnlockSuccess] = useState<boolean>(false);

  // Lightbox
  const [lightbox, setLightbox] = useState<{
    title: string;
    image: string;
    subtitle?: string;
    filename?: string;
    code3?: string;
    year?: number;
    tags?: string[];
  } | null>(null);

  // Pagination state (20 photos per page)
  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Load catalog and unlocked generations whenever selectedGen or selectedSubfolder changes
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setCatalogLoading(true);
        const subParam = selectedSubfolder ? `&sub=${encodeURIComponent(selectedSubfolder)}` : '';
        const [catalogRes, unlockedRes] = await Promise.allSettled([
          fetch(`/api/nas/catalog?gen=${encodeURIComponent(selectedGen)}${subParam}`).then((r) => r.json()),
          fetch('/api/gallery/unlocked-generations').then((r) => r.json()),
        ]);

        if (!isMounted) return;

        if (catalogRes.status === 'fulfilled' && catalogRes.value.success) {
          setCatalogPhotos(catalogRes.value.photos || []);
          setCurrentPage(1);
          if (catalogRes.value.generations) {
            setGenerationsSummary(catalogRes.value.generations);
          }
          if (catalogRes.value.availableYears) {
            setAvailableYears(catalogRes.value.availableYears);
          }
        }

        if (unlockedRes.status === 'fulfilled' && unlockedRes.value.success) {
          setUnlockedGenerations((prev) =>
            Array.from(new Set([...prev, ...(unlockedRes.value.unlockedGenerations || [])]))
          );
        }
      } catch (err) {
        console.error('Error loading NAS catalog:', err);
      } finally {
        if (isMounted) setCatalogLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedGen, selectedSubfolder]);

  // Filtered photo list based on dynamic parsing (2-digit Year & 3-digit Code)
  const filteredPhotos = useMemo(() => {
    let list = catalogPhotos;

    if (filterMode === 'generation') {
      if (selectedGen !== 'all') {
        const genNum = parseInt(selectedGen.replace(/[^0-9]/g, ''), 10);
        list = list.filter((p) => p.generationNumber === genNum);
      }
    } else {
      if (selectedYear !== 'all') {
        list = list.filter((p) => p.year === selectedYear);
      }
    }

    if (codeFilter.trim()) {
      const c = codeFilter.replace(/[^0-9]/g, '');
      list = list.filter((p) => p.personCode.includes(c) || p.studentId.includes(c));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.studentId.includes(q) ||
          p.personCode.includes(q) ||
          p.filename.toLowerCase().includes(q)
      );
    }

    return list;
  }, [catalogPhotos, filterMode, selectedGen, selectedYear, codeFilter, searchQuery]);

  // Paginated 20 photos
  const totalPhotosCount = filteredPhotos.length;
  const totalPages = Math.max(1, Math.ceil(totalPhotosCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPhotos = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredPhotos.slice(start, start + PAGE_SIZE);
  }, [filteredPhotos, safePage]);

  const activeGenObj = generationsSummary.find((g) => g.generationLabel === selectedGen);
  const activeQuiz = activeGenObj?.quiz || 'อาจารย์ประจำสาขาหรือที่ปรึกษาของรุ่นนี้คือใคร?';
  const isCurrentGenUnlocked = unlockedGenerations.includes(selectedGen);

  // สมาชิกทั่วไปเห็นเฉพาะทำเนียบรุ่นของตัวเองใน sidebar — admin เห็นทุกรุ่นเหมือนเดิม
  const visibleGenerations = isAdmin
    ? generationsSummary
    : generationsSummary.filter((g) => g.generationLabel === currentUserGeneration);
  // true เมื่อรุ่นของสมาชิกไม่อยู่ในช่วงที่คลัง NAS มีข้อมูล (รุ่น 20-32) เลย
  const ownGenerationNotArchived = !isAdmin && !!currentUserGeneration && visibleGenerations.length === 0;

  // Handle generation unlock quiz submit
  async function handleUnlockGeneration() {
    if (!genQuizAnswer.trim()) return;
    setGenUnlocking(true);
    try {
      const res = await fetch('/api/gallery/unlock-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, generation: selectedGen, answer: genQuizAnswer }),
      });
      const data = await res.json();

      if (data.success) {
        notifyPointsUpdated(10);
        setGenUnlockSuccess(true);
        setUnlockedGenerations((prev) => [...prev, selectedGen]);
        setTimeout(() => {
          setGenUnlocking(false);
          setGenUnlockSuccess(false);
          setGenQuizAnswer('');
        }, 1200);
      } else {
        alert(data.error || 'คำตอบไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        setGenUnlocking(false);
      }
    } catch {
      setGenUnlockSuccess(true);
      setUnlockedGenerations((prev) => [...prev, selectedGen]);
      setTimeout(() => {
        setGenUnlocking(false);
        setGenUnlockSuccess(false);
        setGenQuizAnswer('');
      }, 1200);
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Lightbox Modal ────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-[32px] p-5 border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2.5 text-white/80 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex justify-center bg-slate-950/60 rounded-2xl p-3">
              <img
                src={lightbox.image}
                alt={lightbox.title}
                className="max-h-[75vh] object-contain rounded-xl shadow-lg"
              />
            </div>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 text-white">
              <div>
                <p className="text-lg font-bold">{lightbox.title}</p>
                {lightbox.subtitle && <p className="text-xs text-indigo-300 font-semibold">{lightbox.subtitle}</p>}
              </div>
              <div className="flex items-center gap-2">
                {lightbox.year && (
                  <span className="rounded-xl bg-indigo-500/30 px-3.5 py-1.5 text-xs font-bold text-indigo-300 border border-indigo-500/40">
                    📅 ปีการศึกษา 25{lightbox.year}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Hero Header & Mode Switcher ───────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-7 sm:p-8 text-white shadow-hero">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-purple-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/15 text-indigo-200">
              <HardDrive className="h-3.5 w-3.5 text-indigo-300" />
              <span>Synology NAS: ธรรมเนียมรุ่น 20 - ปัจจุบัน (ปี 57 - 69)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ทำเนียบรุ่นและคลังภาพศิษย์เก่า 🎓
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              สแกนภาพอัตโนมัติจาก NAS สกัด <span className="font-bold text-amber-300">2 ตัวหน้า (ปีการศึกษา)</span> และ <span className="font-bold text-amber-300">3 ตัวท้าย (รหัสบุคคล 301..N)</span> พร้อมระบบตอบคำถามปลดล็อก
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/15 shrink-0">
            <button
              onClick={() => setActiveTab('nas_yearbook')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'nas_yearbook'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderTree className="h-4 w-4" />
              <span>ทำเนียบรุ่น NAS (ปี 57-69)</span>
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'activities'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>ภาพกิจกรรมชมรม</span>
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ─── TAB 1: DYNAMIC PARSER & YEARBOOK GRID WITH LOCK QUIZ ──────── */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'nas_yearbook' && (
        <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
          {/* ─── LEFT: Synology FileStation Folder Tree Sidebar ───────────── */}
          <div className="rounded-[28px] border border-slate-200/90 bg-white p-4 shadow-card h-fit space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-indigo-600" />
                <span>{isAdmin ? 'ธรรมเนียมรุ่น 20 - ปัจจุบัน' : 'ทำเนียบรุ่นของคุณ'}</span>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-600 font-extrabold">
                {catalogPhotos.length} รูป
              </span>
            </div>

            {ownGenerationNotArchived ? (
              <p className="text-xs text-slate-400 px-1 py-2">
                ยังไม่มีคลังภาพทำเนียบรุ่น NAS สำหรับ {currentUserGeneration} (ระบบมีข้อมูลย้อนหลังเฉพาะรุ่น 20-32)
              </p>
            ) : (
            <div className="space-y-1 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin text-xs">
              {visibleGenerations.map((genInfo) => {
                const isSelected = selectedGen === genInfo.generationLabel;
                const isExpanded = !!expandedGens[genInfo.generationLabel];
                const isUnlocked = unlockedGenerations.includes(genInfo.generationLabel);

                return (
                  <div key={genInfo.generationLabel} className="space-y-0.5">
                    <div
                      onClick={() => {
                        setSelectedGen(genInfo.generationLabel);
                        setSelectedYear(genInfo.year);
                        setSelectedSubfolder(genInfo.subfolders[0] || '');
                        setExpandedGens((prev) => ({
                          ...prev,
                          [genInfo.generationLabel]: !prev[genInfo.generationLabel],
                        }));
                      }}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {genInfo.subfolders.length > 0 ? (
                          isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          )
                        ) : (
                          <span className="w-3.5" />
                        )}

                        {isExpanded ? (
                          <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
                        ) : (
                          <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                        )}

                        <span className="truncate">{genInfo.generationLabel} ({genInfo.yearLabel})</span>
                      </div>

                      {isUnlocked ? (
                        <Unlock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      )}
                    </div>

                    {/* Subfolders Tree Items */}
                    {isExpanded && genInfo.subfolders.length > 0 && (
                      <div className="pl-6 space-y-0.5 border-l border-slate-100 ml-4 py-0.5">
                        {genInfo.subfolders.map((sub) => {
                          const isSubActive = isSelected && selectedSubfolder === sub;
                          return (
                            <div
                              key={sub}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGen(genInfo.generationLabel);
                                setSelectedYear(genInfo.year);
                                setSelectedSubfolder(sub);
                              }}
                              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 cursor-pointer text-xs transition-colors ${
                                isSubActive
                                  ? 'bg-indigo-100/70 text-indigo-800 font-bold'
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                              }`}
                            >
                              <ChevronRight className="h-3 w-3 text-slate-400" />
                              <span className="truncate">{sub}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* ─── RIGHT: Filter Controls & Dynamic Photos ─────────────────── */}
          <div className="space-y-5">
            {ownGenerationNotArchived ? (
              <div className="rounded-[28px] border border-slate-200/90 bg-white p-12 text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  ยังไม่มีคลังภาพทำเนียบรุ่น NAS สำหรับ {currentUserGeneration}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ระบบมีข้อมูลภาพย้อนหลังเฉพาะรุ่น 20-32 (ปีการศึกษา 2557-2569) เท่านั้น
                </p>
              </div>
            ) : (
              <>
            {/* Filter Bar Header */}
            <div className="rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-400">โฟลเดอร์:</span>
                    <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      📁 {isAdmin ? 'ธรรมเนียมรุ่น 20 - ปัจจุบัน' : 'ทำเนียบรุ่นของคุณ'}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className="rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-indigo-700 border border-indigo-100">
                      📁 {selectedGen} ({activeGenObj?.yearLabel})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    พบภาพถ่าย: <span className="font-bold text-indigo-600">{filteredPhotos.length}</span> ภาพ · รหัส: <span className="font-mono font-bold text-slate-700">{activeGenObj?.year}04101301...</span> · สถานะ: {isCurrentGenUnlocked ? '🟢 ปลดล็อกแล้ว' : '🔒 ล็อกอยู่ (ต้องตอบคำถาม)'}
                  </p>
                </div>

                {/* Filter Mode Switcher: By Gen / By Year — เฉพาะ admin เท่านั้นที่สลับดูรุ่นอื่นได้ */}
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                      <button
                        onClick={() => setFilterMode('generation')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          filterMode === 'generation' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        กรองตามรุ่น
                      </button>
                      <button
                        onClick={() => setFilterMode('year')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          filterMode === 'year' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        กรองตามปี พ.ศ.
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Inputs (Name, Full ID, 3-digit Code) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อไฟล์ หรือรหัสนักศึกษา (5704101301)..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                  <input
                    type="text"
                    value={codeFilter}
                    onChange={(e) => setCodeFilter(e.target.value)}
                    placeholder="ค้นหาด้วยรหัส 3 ตัวท้าย (เช่น 301, 305)..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>
              </div>

              {/* Quick Year Badges if filterMode === 'year' */}
              {filterMode === 'year' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> เลือกปี:
                  </span>
                  <button
                    onClick={() => setSelectedYear('all')}
                    className={`shrink-0 rounded-xl px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                      selectedYear === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    ทุกปี
                  </button>
                  {availableYears.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => {
                        setSelectedYear(yr);
                        const matchedGen = generationsSummary.find((g) => g.year === yr);
                        if (matchedGen) setSelectedGen(matchedGen.generationLabel);
                      }}
                      className={`shrink-0 rounded-xl px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                        selectedYear === yr
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      ปี 25{yr} (รุ่น {yr - 37})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ─── LOCKED STATE: Generation Unlock Quiz Card ───────────────── */}
            {!isCurrentGenUnlocked && (
              <div className="rounded-[32px] border-2 border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-6 sm:p-7 shadow-md space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 border border-amber-200 shadow-xs">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      ตอบคำถามเพื่อปลดล็อกดูภาพทำเนียบ {selectedGen} ({activeGenObj?.yearLabel}) 🎓
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      เพื่อความเป็นส่วนตัวของรุ่น สมาชิกต้องตอบคำถามความทรงจำประจำรุ่นเพื่อเข้าชมภาพคมชัดและรับแต้มกิจกรรม
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-amber-200/80 p-4 space-y-3 shadow-2xs">
                  <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                    <span>❓ คำถามประจำรุ่น:</span>
                    <span className="text-slate-800">{activeQuiz}</span>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={genQuizAnswer}
                      onChange={(e) => setGenQuizAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUnlockGeneration()}
                      placeholder="พิมพ์คำตอบของคุณที่นี่..."
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                    />
                    <button
                      type="button"
                      disabled={!genQuizAnswer.trim() || genUnlocking}
                      onClick={handleUnlockGeneration}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                        genUnlockSuccess
                          ? 'bg-emerald-600'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 active:scale-95'
                      }`}
                    >
                      {genUnlocking ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          <span>กำลังตรวจสอบ...</span>
                        </>
                      ) : genUnlockSuccess ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>ปลดล็อกสำเร็จ! (+10 แต้ม)</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4" />
                          <span>ปลดล็อกทำเนียบรุ่น ✨ (+10 แต้ม)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── PHOTOS GRID (ครั้งละ 20 รูป) ── */}
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
              {paginatedPhotos.length === 0 ? (
                <div className="col-span-full rounded-[28px] border border-slate-100 bg-white p-12 text-center">
                  <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-500">ไม่พบรูปภาพตามเงื่อนไขที่ค้นหา</p>
                  <p className="text-xs text-slate-400 mt-1">ลองล้างคำค้นหาหรือเลือกรุ่น/ปีอื่น</p>
                </div>
              ) : (
                paginatedPhotos.map((photo) => {
                  return (
                    <div
                      key={photo.id}
                      className="group rounded-[24px] border border-slate-200/90 bg-white p-3.5 shadow-card hover:shadow-lg hover:border-indigo-200 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Photo Display */}
                        <div
                          onClick={() => {
                            if (isCurrentGenUnlocked) {
                              setLightbox({
                                title: `${photo.generationLabel} (${photo.yearLabel})`,
                                subtitle: `ทำเนียบรุ่นภาควิชาวิทยาการคอมพิวเตอร์ แม่โจ้`,
                                year: photo.year,
                                image: photo.photoUrl,
                              });
                            }
                          }}
                          className={`relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100 ${
                            isCurrentGenUnlocked ? 'cursor-zoom-in group-hover:scale-[1.02] transition-transform' : ''
                          }`}
                        >
                          <img
                            src={photo.photoUrl}
                            alt={`${photo.generationLabel} ${photo.yearLabel}`}
                            className={`h-full w-full object-cover transition-all duration-300 ${
                              !isCurrentGenUnlocked ? 'blur-md brightness-90 scale-105' : 'hover:scale-105'
                            }`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                photo.generationLabel
                              )}&background=6366f1&color=fff`;
                            }}
                          />

                          {/* Lock Overlay if not unlocked */}
                          {!isCurrentGenUnlocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-slate-900/30 backdrop-blur-[2px]">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-md">
                                <Lock className="h-4 w-4" />
                              </div>
                              <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-semibold text-white">
                                ตอบคำถามเพื่อดู
                              </span>
                            </div>
                          )}

                          {/* Unlocked Eye Hover Icon */}
                          {isCurrentGenUnlocked && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>

                        {/* Generation and Year info ONLY */}
                        <div className="mt-2.5 text-center">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {photo.generationLabel} · {photo.yearLabel}
                          </h4>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ─── PAGINATION CONTROLS (ครั้งละ 20 รูป) ──────────────────── */}
            {totalPhotosCount > PAGE_SIZE && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-white border border-slate-200/90 p-4 shadow-2xs">
                <p className="text-xs sm:text-sm font-medium text-slate-500">
                  แสดงรูปที่{' '}
                  <span className="font-bold text-indigo-600">
                    {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                    {Math.min(currentPage * PAGE_SIZE, totalPhotosCount)}
                  </span>{' '}
                  จากทั้งหมด <span className="font-bold text-slate-800">{totalPhotosCount}</span> รูป (ครั้งละ 20 รูป)
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    ← ก่อนหน้า
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .map((pageNum, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <Fragment key={pageNum}>
                            {prev && pageNum - prev > 1 && (
                              <span className="px-1 text-slate-400 text-xs">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPage(pageNum);
                                window.scrollTo({ top: 380, behavior: 'smooth' });
                              }}
                              className={`h-8 w-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                currentPage === pageNum
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          </Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    ถัดไป →
                  </button>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ─── TAB 2: ACTIVITY PHOTOS & STORYTELLING ─────────────────────── */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'activities' && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {items.length === 0 && (
            <div className="col-span-full rounded-[28px] border border-slate-100 bg-white p-16 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-400">ยังไม่มีรูปภาพกิจกรรม</p>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[28px] border border-slate-200/90 bg-white shadow-card overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              <div
                className="relative aspect-[4/3] overflow-hidden bg-slate-100 cursor-zoom-in"
                onClick={() =>
                  setLightbox({
                    title: item.title,
                    subtitle: item.generation,
                    image: item.original_image || item.originalImage || item.image,
                    tags: item.tags,
                  })
                }
              >
                <img src={item.image} alt={item.title} className="h-full w-full object-cover hover:scale-105 transition-transform" />
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {item.generation}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-slate-900 truncate">{item.title || 'รูปกิจกรรม'}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.map((t, idx) => (
                      <span key={idx} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 border border-indigo-100">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}