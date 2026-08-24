'use client';

import { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  GraduationCap,
  Briefcase,
  Building2,
  MapPin,
  Sparkles,
  Quote,
  Filter,
  ExternalLink,
  Mail,
  Globe,
  Code,
  Award,
  Heart,
  Share2,
  X,
  UserCheck,
} from 'lucide-react';

export interface YearbookAlumnus {
  id: number;
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
  socials?: {
    email?: string;
    linkedin?: string;
    github?: string;
  };
  totalPoints: number;
}

const MOCK_YEARBOOK_ALUMNI: YearbookAlumnus[] = [
  {
    id: 1,
    studentId: '60010001',
    name: 'สมชาย ใจดี',
    nickname: 'ชาย',
    generation: 'รุ่น 43 (CSMJU #28)',
    generationNumber: 43,
    gradYear: '2564 (2021)',
    position: 'Senior Full-stack Developer',
    company: 'Agoda (Thailand)',
    careerType: 'Software & Technology',
    province: 'เชียงใหม่',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    quote: 'Code like there is no tomorrow, debug like you wrote it yesterday 💻',
    bio: 'อดีตประธานสาขาวิทยาการคอมพิวเตอร์ ชื่นชอบการเขียนเว็บและสถาปัตยกรรมระบบคลาวด์ ปัจจุบันพัฒนาระบบ Booking Platform ระดับโลก',
    skills: ['Next.js', 'Node.js', 'Go', 'Kubernetes', 'System Design'],
    socials: {
      email: 'somchai.j@example.edu',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
    },
    totalPoints: 128,
  },
  {
    id: 2,
    studentId: '61010045',
    name: 'สมหญิง รักเรียน',
    nickname: 'หญิง',
    generation: 'รุ่น 44 (CSMJU #29)',
    generationNumber: 44,
    gradYear: '2565 (2022)',
    position: 'Lead AI / Data Scientist',
    company: 'SCB TechX',
    careerType: 'AI & Data Science',
    province: 'กรุงเทพมหานคร',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    quote: 'Data beats opinion every single time. ความจริงอยู่ในข้อมูลเสมอ 📊✨',
    bio: 'เกียรตินิยมอันดับ 1 วิทยาการคอมพิวเตอร์ งานวิจัยด้าน NLP และ Deep Learning ตัวแทนแข่ง AI Hackathon ระดับประเทศ ปัจจุบันดูแลระบบ Large Language Model',
    skills: ['PyTorch', 'LLMs', 'Python', 'MLOps', 'Big Data Analytics'],
    socials: {
      email: 'somying.r@example.edu',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
    },
    totalPoints: 194,
  },
  {
    id: 3,
    studentId: '60010099',
    name: 'สมศักดิ์ มั่นคง',
    nickname: 'ศักดิ์',
    generation: 'รุ่น 43 (CSMJU #28)',
    generationNumber: 43,
    gradYear: '2564 (2021)',
    position: 'Chief Technology Officer (CTO)',
    company: 'DevScale Studio & Labs',
    careerType: 'Tech Entrepreneurship',
    province: 'เชียงใหม่',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    quote: 'สร้างเทคโนโลยีเพื่อยกระดับคุณภาพชีวิตผู้คนและสร้างโอกาสให้รุ่นน้อง 🚀',
    bio: 'ผู้ก่อตั้งสตาร์ทอัพเทคโนโลยีในเชียงใหม่ ให้คำปรึกษาและสนับสนุนโปรเจกต์ของนักศึกษารุ่นใหม่อย่างต่อเนื่อง ได้รับรางวัลศิษย์เก่าดีเด่นสาขาผู้ประกอบการรุ่นใหม่',
    skills: ['Tech Leadership', 'Cloud Architecture', 'Product Strategy', 'DevOps', 'PostgreSQL'],
    socials: {
      email: 'somsak.m@example.edu',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
    },
    totalPoints: 156,
  },
  {
    id: 4,
    studentId: '59010022',
    name: 'ณิชานันท์ เจริญผล',
    nickname: 'พลอย',
    generation: 'รุ่น 42 (CSMJU #27)',
    generationNumber: 42,
    gradYear: '2563 (2020)',
    position: 'Senior Product & UX Designer',
    company: 'LINE MAN Wongnai',
    careerType: 'Design & Product',
    province: 'นนทบุรี',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
    quote: 'Design is not just what it looks like, it is how it works and feels 🎨',
    bio: 'จากโปรแกรมเมอร์สู่เส้นทาง Product Design ดูแลประสบการณ์ผู้ใช้งานกว่า 10 ล้านคน ชื่นชอบการสร้าง Design System ที่เรียบหรูและเข้าถึงง่าย',
    skills: ['Figma', 'Design Systems', 'UX Research', 'Prototyping', 'User Testing'],
    socials: {
      email: 'nichanan.p@example.edu',
      linkedin: 'https://linkedin.com',
    },
    totalPoints: 112,
  },
  {
    id: 5,
    studentId: '62010114',
    name: 'กิตติพงษ์ วัฒนา',
    nickname: 'ท็อป',
    generation: 'รุ่น 45 (CSMJU #30)',
    generationNumber: 45,
    gradYear: '2566 (2023)',
    position: 'Cyber Security Specialist',
    company: 'KASIKORN Business-Technology Group (KBTG)',
    careerType: 'Information Security',
    province: 'เชียงราย',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    quote: 'Security is not a feature, it is the foundation of trust 🛡️🔒',
    bio: 'อดีตสมาชิกทีม CTF ประจำภาควิชา สอบผ่านประกาศนียบัตร OSCP & CISSP ตั้งแต่เรียนจบปีแรก เชี่ยวชาญการทดสอบเจาะระบบและตรวจจับภัยคุกคามไซเบอร์',
    skills: ['Penetration Testing', 'SIEM', 'Cloud Security', 'Network Defense', 'Python'],
    socials: {
      email: 'kittipong.w@example.edu',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
    },
    totalPoints: 140,
  },
];

export function YearbookGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [selectedAlumnus, setSelectedAlumnus] = useState<YearbookAlumnus | null>(null);

  const generations = [
    { label: 'ทุกรุ่น', value: 'all' },
    { label: 'รุ่น 42 (2563)', value: '42' },
    { label: 'รุ่น 43 (2564)', value: '43' },
    { label: 'รุ่น 44 (2565)', value: '44' },
    { label: 'รุ่น 45 (2566)', value: '45' },
  ];

  const filteredAlumni = useMemo(() => {
    return MOCK_YEARBOOK_ALUMNI.filter((alumnus) => {
      // Generation filter
      if (selectedGeneration !== 'all' && alumnus.generationNumber.toString() !== selectedGeneration) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        alumnus.name.toLowerCase().includes(q) ||
        alumnus.nickname.toLowerCase().includes(q) ||
        alumnus.studentId.includes(q) ||
        alumnus.position.toLowerCase().includes(q) ||
        alumnus.company.toLowerCase().includes(q) ||
        alumnus.province.toLowerCase().includes(q) ||
        alumnus.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedGeneration]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Hero Header ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-7 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold backdrop-blur-md border border-white/20">
            <BookOpen className="h-3.5 w-3.5 text-amber-300" />
            <span>Digital Alumni Yearbook</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            หนังสือรุ่นศิษย์เก่า <span className="bg-gradient-to-r from-amber-200 via-white to-pink-200 bg-clip-text text-transparent">CS MJU</span>
          </h1>
          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            บันทึกความทรงจำ สายใยผูกพัน และเส้นทางความสำเร็จของศิษย์เก่าวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้
          </p>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-indigo-200">ศิษย์เก่าในระบบ</p>
            <p className="text-xl font-extrabold text-white mt-0.5">5 คน <span className="text-xs font-normal text-amber-300">(ตัวอย่าง)</span></p>
          </div>
          <div>
            <p className="text-xs text-indigo-200">รุ่นที่สำเร็จการศึกษา</p>
            <p className="text-xl font-extrabold text-white mt-0.5">42 - 45</p>
          </div>
          <div>
            <p className="text-xs text-indigo-200">บริษัทชั้นนำ</p>
            <p className="text-xl font-extrabold text-white mt-0.5">Agoda, SCB, KBTG...</p>
          </div>
          <div>
            <p className="text-xs text-indigo-200">จังหวัดที่สังกัด</p>
            <p className="text-xl font-extrabold text-white mt-0.5">ทั่วประเทศ</p>
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ───────────────────────────────────── */}
      <div className="rounded-[24px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามชื่อ, ชื่อเล่น, รหัสนักศึกษา, ตำแหน่ง, บริษัท หรือทักษะ..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Generation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {generations.map((gen) => (
              <button
                key={gen.value}
                onClick={() => setSelectedGeneration(gen.value)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedGeneration === gen.value
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {gen.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <p>
            แสดงผล <span className="font-bold text-slate-800">{filteredAlumni.length}</span> จากทั้งหมด {MOCK_YEARBOOK_ALUMNI.length} คน
          </p>
          <span className="flex items-center gap-1 text-indigo-600 font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> คลิกที่การ์ดเพื่อดูรายละเอียดหนังสือรุ่น
          </span>
        </div>
      </div>

      {/* ─── Alumni Cards Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlumni.map((alumnus) => (
          <div
            key={alumnus.id}
            onClick={() => setSelectedAlumnus(alumnus)}
            className="group relative flex flex-col rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* Top Pattern Header Strip */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="flex items-start gap-4">
              {/* Avatar Photo with Zoom on hover */}
              <div className="relative shrink-0">
                <img
                  src={alumnus.avatarUrl}
                  alt={alumnus.name}
                  className="h-20 w-20 rounded-2xl object-cover ring-3 ring-indigo-50 shadow-md group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute -bottom-2 -right-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                  รุ่น {alumnus.generationNumber}
                </span>
              </div>

              {/* Identity Info */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {alumnus.name}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    ({alumnus.nickname})
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400">
                  รหัส {alumnus.studentId}
                </p>
                <p className="text-xs text-indigo-700 font-medium truncate">
                  {alumnus.generation}
                </p>
              </div>
            </div>

            {/* Career & Work info */}
            <div className="mt-5 space-y-2 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100/80 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-bold truncate">
                <Briefcase className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">{alumnus.position}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 truncate">
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{alumnus.company}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>จังหวัด{alumnus.province}</span>
              </div>
            </div>

            {/* Yearbook Quote */}
            <div className="mt-4 flex-1">
              <div className="relative pl-5 text-xs italic text-slate-600 leading-relaxed line-clamp-2">
                <Quote className="absolute -left-1 top-0 h-4 w-4 text-indigo-300/80 shrink-0" />
                {alumnus.quote}
              </div>
            </div>

            {/* Skills Pills */}
            <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
              {alumnus.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100/80"
                >
                  {skill}
                </span>
              ))}
              {alumnus.skills.length > 3 && (
                <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                  +{alumnus.skills.length - 3}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Detail Modal (Yearbook Memory Card) ────────────────────── */}
      {selectedAlumnus && (
        <div
          onClick={() => setSelectedAlumnus(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-[36px] bg-white shadow-2xl animate-scale-up border border-slate-100"
          >
            {/* Modal Header Cover */}
            <div className="relative h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
              <button
                onClick={() => setSelectedAlumnus(null)}
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-extrabold backdrop-blur-xs">
                  {selectedAlumnus.generation}
                </span>
                <span className="text-xs text-white/80">
                  ปีที่จบ: {selectedAlumnus.gradYear}
                </span>
              </div>
            </div>

            {/* Profile Avatar & Primary Info */}
            <div className="relative px-7 pb-7 pt-0 space-y-6">
              <div className="flex items-end justify-between -mt-14">
                <img
                  src={selectedAlumnus.avatarUrl}
                  alt={selectedAlumnus.name}
                  className="h-28 w-28 rounded-3xl object-cover ring-4 ring-white shadow-xl"
                />
                <div className="flex items-center gap-2 pb-1">
                  {selectedAlumnus.socials?.email && (
                    <a
                      href={`mailto:${selectedAlumnus.socials.email}`}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      title="ส่งอีเมล"
                    >
                      <Mail className="h-5 w-5" />
                    </a>
                  )}
                  {selectedAlumnus.socials?.linkedin && (
                    <a
                      href={selectedAlumnus.socials.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="LinkedIn"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                  {selectedAlumnus.socials?.github && (
                    <a
                      href={selectedAlumnus.socials.github}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white transition-colors"
                      title="GitHub"
                    >
                      <Code className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {selectedAlumnus.name} ({selectedAlumnus.nickname})
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  รหัสนักศึกษา: {selectedAlumnus.studentId}
                </p>
              </div>

              {/* Quote Card */}
              <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 border border-amber-200/60 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Quote className="h-3.5 w-3.5" /> คติประจำใจในหนังสือรุ่น
                </p>
                <p className="text-sm font-semibold italic text-amber-950 leading-relaxed">
                  &ldquo;{selectedAlumnus.quote}&rdquo;
                </p>
              </div>

              {/* Bio & Journey */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  เกี่ยวกับและประวัติการทำงาน
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedAlumnus.bio}
                </p>
              </div>

              {/* Work & Location details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-slate-50 p-3.5 space-y-1 border border-slate-100">
                  <p className="text-slate-400 font-medium">ตำแหน่งและสถานที่ทำงาน</p>
                  <p className="font-bold text-slate-800">{selectedAlumnus.position}</p>
                  <p className="text-indigo-600 font-semibold">{selectedAlumnus.company}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3.5 space-y-1 border border-slate-100">
                  <p className="text-slate-400 font-medium">สายงาน & ภูมิลำเนา</p>
                  <p className="font-bold text-slate-800">{selectedAlumnus.careerType}</p>
                  <p className="text-slate-600">จังหวัด{selectedAlumnus.province}</p>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  ความเชี่ยวชาญ & ทักษะ (Skills)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAlumnus.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
