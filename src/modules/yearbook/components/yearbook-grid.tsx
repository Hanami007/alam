'use client';

import { useState, useMemo, useEffect } from 'react';
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

const MOCK_YEARBOOK_ALUMNI: YearbookAlumnus[] = [
  {
    id: 101,
    studentId: '18010001',
    name: 'ดร.ประสิทธิ์ ปัญญาดี',
    nickname: 'สิทธิ์',
    generation: 'รุ่น 1',
    generationNumber: 1,
    gradYear: '2522 (1979)',
    position: 'อดีตคณบดี & ที่ปรึกษาเทคโนโลยีสารสนเทศ',
    company: 'มหาวิทยาลัยแม่โจ้',
    careerType: 'Education & Research',
    province: 'เชียงใหม่',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80',
    quote: 'สมัยพี่เรียนยังใช้ Punch Card เจาะรูโปรแกรม การบอร์ดคอมพิวเตอร์คือศิลปะของความอดทน 📜💾',
    bio: 'รุ่นบุกเบิกภาควิชา วางรากฐานห้องปฏิบัติการคอมพิวเตอร์เครื่องแรกของแม่โจ้',
    skills: ['Fortran', 'Assembly', 'Systems Architecture'],
    likesCount: 88,
    laughsCount: 14,
  },
  {
    id: 105,
    studentId: '22010012',
    name: 'คุณวิชัย เลิศพาณิชย์',
    nickname: 'วิชัย',
    generation: 'รุ่น 5',
    generationNumber: 5,
    gradYear: '2526 (1983)',
    position: 'กรรมการผู้จัดการ (Managing Director)',
    company: 'Siam Data Systems',
    careerType: 'Tech Entrepreneurship',
    province: 'กรุงเทพมหานคร',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80',
    quote: 'ยุคพี่ RAM 64KB ถือว่าหรูหราอลังการ วันนี้มือถือพวกเธอมี RAM เป็น Gigabyte ใช้ให้คุ้มนะน้อง! 💻',
    bio: 'ผู้บุกเบิกร้านค้าและซอฟต์แวร์คอมพิวเตอร์ในภาคเหนือ',
    skills: ['COBOL', 'Pascal', 'Business Strategy'],
    likesCount: 65,
    laughsCount: 22,
  },
  {
    id: 110,
    studentId: '27010045',
    name: 'คุณสมพร ศรีสุข',
    nickname: 'พร',
    generation: 'รุ่น 10',
    generationNumber: 10,
    gradYear: '2531 (1988)',
    position: 'Senior Infrastructure Advisor',
    company: 'การไฟฟ้าส่วนภูมิภาค',
    careerType: 'Government & State Enterprise',
    province: 'เชียงใหม่',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
    quote: 'เขียน C++ บรรทัดเดียวลืมเซมิโคลอน หาบั๊กไป 3 วัน แต่ความภูมิใจตอนคอมไพล์ผ่านมันประเมินค่าไม่ได้ ⚙️',
    bio: 'ดูแลระบบเครือข่ายไฟฟ้าและความมั่นคงทางไซเบอร์ภาคเหนือ',
    skills: ['C++', 'Unix', 'Network Engineering'],
    likesCount: 54,
    laughsCount: 39,
  },
  {
    id: 115,
    studentId: '32010088',
    name: 'คุณกมลวรรณ บุญมี',
    nickname: 'แอ๋ว',
    generation: 'รุ่น 15',
    generationNumber: 15,
    gradYear: '2536 (1993)',
    position: 'Enterprise Solutions Director',
    company: 'PTT Digital Solutions',
    careerType: 'Software & Technology',
    province: 'ระยอง',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    quote: 'อินเทอร์เน็ตโมเด็มต่อเสียงดัง ติ๊ด-ตี้-ตู้ สัญญาณหลุดทีต้องเริ่มดาวน์โหลดใหม่ แต่พวกเราไม่เคยท้อ 🌐',
    bio: 'ผู้นำทีมพัฒนาระบบ ERP สำหรับอุตสาหกรรมพลังงาน',
    skills: ['Oracle DB', 'Java', 'ERP Systems'],
    likesCount: 42,
    laughsCount: 18,
  },
  {
    id: 120,
    studentId: '37010102',
    name: 'คุณชาญชัย มีสุข',
    nickname: 'ช้าง',
    generation: 'รุ่น 20',
    generationNumber: 20,
    gradYear: '2541 (1998)',
    position: 'Vice President of IT Security',
    company: 'ธนาคารกรุงเทพ จำกัด (มหาชน)',
    careerType: 'Information Security',
    province: 'กรุงเทพมหานคร',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    quote: 'ผ่านวิกฤต Y2K มาได้ ก็ไม่มีบั๊กอะไรในโลกนี้ที่ทำให้พวกเรากลัวได้อีกแล้ว 🔥',
    bio: 'ผู้เชี่ยวชาญการป้องกันภัยคุกคามทางไซเบอร์ของสถาบันการเงิน',
    skills: ['Cybersecurity', 'Financial Systems', 'Linux'],
    likesCount: 71,
    laughsCount: 40,
  },
  {
    id: 125,
    studentId: '42010150',
    name: 'คุณสุพจน์ ใจกว้าง',
    nickname: 'พจน์',
    generation: 'รุ่น 25',
    generationNumber: 25,
    gradYear: '2546 (2003)',
    position: 'Principal Cloud Architect',
    company: 'True Digital Group',
    careerType: 'Software & Technology',
    province: 'นนทบุรี',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    quote: 'จากยุค Web 1.0 หน้ากระดาษ HTML สีขาว สู่ยุค Cloud & AI... CS แม่โจ้สอนให้เราเรียนรู้ไม่มีวันสิ้นสุด 🚀',
    bio: 'ออกแบบระบบ Cloud Microservices รองรับผู้ใช้งานหลักล้านคน',
    skills: ['AWS', 'Kubernetes', 'System Architecture'],
    likesCount: 63,
    laughsCount: 28,
  },
  {
    id: 130,
    studentId: '47010210',
    name: 'คุณนภา รัตนตระกูล',
    nickname: 'นก',
    generation: 'รุ่น 30',
    generationNumber: 30,
    gradYear: '2551 (2008)',
    position: 'Software Engineering Director',
    company: 'Shopee (Thailand)',
    careerType: 'Software & Technology',
    province: 'กรุงเทพมหานคร',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80',
    quote: 'ตอนเรียนมุ่งมั่นจะเขียนโค้ดเปลี่ยนโลก ตอนทำงานขอแค่ Server ไม่ล่มตอนคืนวันศุกร์ก็พอ 🙏✨',
    bio: 'คุมทีมวิศวกรซอฟต์แวร์พัฒนาระบบ E-commerce ขนาดใหญ่',
    skills: ['Go', 'Distributed Systems', 'Engineering Leadership'],
    likesCount: 80,
    laughsCount: 62,
  },
  {
    id: 132,
    studentId: '49010250',
    name: 'คุณปรีชา เจริญกิจ',
    nickname: 'ชา',
    generation: 'รุ่น 32',
    generationNumber: 32,
    gradYear: '2553 (2010)',
    position: 'Head of Data Platform',
    company: 'Central Group',
    careerType: 'AI & Data Science',
    province: 'เชียงใหม่',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80',
    quote: 'เขียน SQL Query ซับซ้อนแค่ไหนไม่เคยกลัว กลัวที่สุดคือลืมใส่ WHERE Clause ในคำสั่ง DELETE 😱',
    bio: 'ผู้เชี่ยวชาญการวางระบบ Big Data & Analytics สำหรับค้าปลีก',
    skills: ['BigQuery', 'Apache Spark', 'Data Engineering'],
    likesCount: 92,
    laughsCount: 75,
  },
  {
    id: 1,
    studentId: '60010001',
    name: 'สมชาย ใจดี',
    nickname: 'ชาย',
    generation: 'รุ่น 43',
    generationNumber: 43,
    gradYear: '2564 (2021)',
    position: 'Senior Full-stack Developer',
    company: 'Agoda (Thailand)',
    careerType: 'Software & Technology',
    province: 'เชียงใหม่',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    quote: 'I spent 4 years learning CS just to realize the solution was restarting the computer 💻',
    bio: 'อดีตประธานสาขาวิทยาการคอมพิวเตอร์ ชื่นชอบการเขียนเว็บและสถาปัตยกรรมระบบคลาวด์',
    skills: ['Next.js', 'Node.js', 'Go', 'Kubernetes'],
    likesCount: 15,
    laughsCount: 32,
  },
  {
    id: 2,
    studentId: '61010045',
    name: 'สมหญิง รักเรียน',
    nickname: 'หญิง',
    generation: 'รุ่น 44',
    generationNumber: 44,
    gradYear: '2565 (2022)',
    position: 'Lead AI / Data Scientist',
    company: 'SCB TechX',
    careerType: 'AI & Data Science',
    province: 'กรุงเทพมหานคร',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    quote: 'Data beats opinion every single time... แต่ถ้าปวดหัวให้กินพารา ยาไม่ได้ช่วยให้เข้าใจ AI หรอก 📊✨',
    bio: 'เกียรตินิยมอันดับ 1 วิทยาการคอมพิวเตอร์ งานวิจัยด้าน NLP และ Deep Learning',
    skills: ['PyTorch', 'LLMs', 'Python'],
    likesCount: 24,
    laughsCount: 45,
  },
  {
    id: 3,
    studentId: '60010099',
    name: 'สมศักดิ์ มั่นคง',
    nickname: 'ศักดิ์',
    generation: 'รุ่น 43',
    generationNumber: 43,
    gradYear: '2564 (2021)',
    position: 'Chief Technology Officer',
    company: 'DevScale Studio',
    careerType: 'Tech Entrepreneurship',
    province: 'เชียงใหม่',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    quote: 'เรียนคอมเพราะคิดว่าจะได้เล่นเกม สุดท้ายจบมานั่งตั้งค่า Server ตอนตี 3 ☕',
    bio: 'ผู้ก่อตั้งสตาร์ทอัพเทคโนโลยีในเชียงใหม่',
    skills: ['Tech Leadership', 'Cloud Architecture'],
    likesCount: 18,
    laughsCount: 29,
  },
  {
    id: 4,
    studentId: '59010022',
    name: 'ณิชานันท์ เจริญผล',
    nickname: 'พลอย',
    generation: 'รุ่น 42',
    generationNumber: 42,
    gradYear: '2563 (2020)',
    position: 'Senior UX Designer',
    company: 'LINE MAN Wongnai',
    careerType: 'Design & Product',
    province: 'นนทบุรี',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
    quote: 'Design is not just what it looks like... แต่คือการเปลี่ยนสีปุ่มตามใจลูกค้าตอน 5 โมงเย็น 🎨',
    bio: 'จากโปรแกรมเมอร์สู่เส้นทาง Product Design',
    skills: ['Figma', 'Design Systems', 'UX Research'],
    likesCount: 30,
    laughsCount: 19,
  },
  {
    id: 5,
    studentId: '62010114',
    name: 'กิตติพงษ์ วัฒนา',
    nickname: 'ท็อป',
    generation: 'รุ่น 45',
    generationNumber: 45,
    gradYear: '2566 (2023)',
    position: 'Security Specialist',
    company: 'KBTG',
    careerType: 'Information Security',
    province: 'เชียงราย',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    quote: 'Security is not a feature, it is a lifestyle... และพาสเวิร์ดที่ดีที่สุดคือ 123456 (ล้อเล่นนะ!) 🛡️🔒',
    bio: 'อดีตสมาชิกทีม CTF ประจำภาควิชา',
    skills: ['Penetration Testing', 'Cloud Security'],
    likesCount: 21,
    laughsCount: 38,
  },
  {
    id: 6,
    studentId: '63010088',
    name: 'ภัทรพล สุขเสริฐ',
    nickname: 'พีท',
    generation: 'รุ่น 46',
    generationNumber: 46,
    gradYear: '2567 (2024)',
    position: 'Junior Frontend Engineer',
    company: 'Agoda (Thailand)',
    careerType: 'Software & Technology',
    province: 'เชียงใหม่',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    quote: 'อย่าเอาเกรดเฉลี่ยมาตัดสินเรา เพราะเกรด 2.01 ก็เขียนบั๊กได้เนียนพอๆ กับเกรด 4.0 🐛',
    bio: 'น้องใหม่ไฟแรงแห่งวงการ Frontend',
    skills: ['React', 'TypeScript', 'Tailwind CSS'],
    likesCount: 12,
    laughsCount: 51,
  },
];

export function YearbookGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [selectedCareer, setSelectedCareer] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const [selectedAlumnus, setSelectedAlumnus] = useState<YearbookAlumnus | null>(null);
  const [alumniList, setAlumniList] = useState<YearbookAlumnus[]>(MOCK_YEARBOOK_ALUMNI);

  // Generation Modal Selector State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genSearch, setGenSearch] = useState('');

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
  });

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await api.auth.me().catch(() => null);
        if (meRes?.user) {
          setCurrentUser(meRes.user);
        }

        const data = await api.admin.getYearbookList().catch(() => null);
        if (Array.isArray(data) && data.length > 0) {
          const formatted: YearbookAlumnus[] = data.map((item: any, idx: number) => {
            const fallbackQuote = FUNNY_SENIOR_QUOTES[idx % FUNNY_SENIOR_QUOTES.length];
            return {
              id: item.id || `mju-${idx}`,
              studentId: item.studentId || `600100${idx + 10}`,
              name: item.name,
              nickname: item.nickname || item.name.split(' ')[0] || 'เพื่อน',
              generation: item.generation || 'รุ่น 43',
              generationNumber: item.generationNumber || 43,
              gradYear: item.graduationYear ? `${item.graduationYear + 543} (${item.graduationYear})` : '2564 (2021)',
              position: item.position || 'Software Developer',
              company: item.company || 'Tech Company',
              careerType: item.careerType || 'Software & Technology',
              province: item.province || 'เชียงใหม่',
              avatarUrl: item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
              quote: item.bio && item.bio.length > 3 ? item.bio : fallbackQuote,
              bio: item.bio || 'ศิษย์เก่าภาควิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้',
              skills: ['CS MJU'],
              likesCount: 15 + idx * 3,
              laughsCount: 20 + idx * 5,
              isAvailableForMentorship: Boolean(item.isAvailableForMentorship),
            };
          });
          setAlumniList(formatted);
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
    if (myExistingEntry) {
      setMyEntryForm({
        name: myExistingEntry.name || currentUser?.name || '',
        nickname: myExistingEntry.nickname || '',
        avatarUrl: myExistingEntry.avatarUrl || currentUser?.avatar_url || '',
        generation: myExistingEntry.generation || 'รุ่น 43',
        quote: myExistingEntry.quote || '',
        isAvailableForMentorship: isMentor,
      });
    } else {
      setMyEntryForm({
        name: currentUser?.name || '',
        nickname: currentUser?.name ? currentUser.name.split(' ')[0] : '',
        avatarUrl: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        generation: currentUser?.generation || 'รุ่น 43',
        quote: currentUser?.bio || '',
        isAvailableForMentorship: isMentor,
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

  const generations = useMemo(() => {
    const genNums = [...new Set(alumniList.map((a) => a.generationNumber))].sort((a, b) => a - b);
    return [
      { label: 'ทุกรุ่น', value: 'all' },
      ...genNums.map((n) => ({ label: `รุ่น ${n}`, value: String(n) })),
    ];
  }, [alumniList]);

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

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-2">
      {/* ─── HERO HEADER BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-indigo-700/40">
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 -top-10 h-48 w-48 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md border border-white/15">
            <GraduationCap className="h-4 w-4 text-amber-300" />
            <span>ทำเนียบหนังสือรุ่นศิษย์เก่า CS MJU</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ความทรงจำ & สายสัมพันธ์ศิษย์เก่า <span className="text-amber-300">แม่โจ้</span>
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
            รวมเรื่องราว คำคมสุดจำ และทำเนียบศิษย์เก่าภาควิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้
          </p>
        </div>
      </div>

      {/* ─── ACTION BUTTONS BAR (OUTSIDE BANNER) ────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-1">
        {/* ปุ่มสำหรับกดเลือกรุ่น */}
        <button
          onClick={() => setIsGenModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-indigo-200 text-indigo-900 text-xs sm:text-sm font-extrabold hover:bg-indigo-50 hover:border-indigo-400 transition-all shadow-sm cursor-pointer active:scale-95"
        >
          <GraduationCap className="h-4 sm:h-5 w-4 sm:w-5 text-indigo-600" />
          <span>
            {selectedGeneration === 'all'
              ? '🎓 เลือกรุ่น (แสดงทุกรุ่น)'
              : `กำลังดู: รุ่น ${selectedGeneration} (กดเพื่อเปลี่ยนรุ่น)`}
          </span>
          <ChevronDown className="h-4 w-4 text-indigo-400" />
        </button>

        {/* ปุ่มเพิ่ม / แก้ไขข้อมูลหนังสือรุ่นของฉัน (1 บัญชีสร้างได้ 1 ครั้ง) */}
        <button
          onClick={handleOpenMyModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 text-slate-950 px-4.5 py-2.5 text-xs sm:text-sm font-extrabold hover:bg-amber-300 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          <Edit3 className="h-4 w-4" />
          <span>
            {myExistingEntry ? '✏️ แก้ไขข้อมูลหนังสือรุ่นของฉัน' : '+ เพิ่มข้อมูลหนังสือรุ่นของฉัน'}
          </span>
        </button>
      </div>



      {/* ─── ALUMNI DISPLAY CONTAINER ─────────────────────────────────── */}
      {filteredAlumni.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">ไม่พบข้อมูลศิษย์เก่าตามเงื่อนไขที่ค้นหา</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่มรีเซ็ตเพื่อแสดงผลศิษย์เก่าทั้งหมด
          </p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>แสดงผลศิษย์เก่าทั้งหมด</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* CLASSIC YEARBOOK SEPARATED CARDS GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredAlumni.map((alumnus) => {
            const isMe =
              currentUser &&
              (String(alumnus.id) === String(currentUser.id) || alumnus.studentId === currentUser.student_id);

            return (
              <div
                key={alumnus.id}
                onClick={() => setSelectedAlumnus(alumnus)}
                className={`group flex flex-row bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer relative ${
                  isMe
                    ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-200'
                    : 'border-slate-200/90 hover:border-indigo-300 hover:-translate-y-0.5'
                }`}
              >
                {/* Own Card Badge */}
                {isMe && (
                  <div className="absolute top-1.5 right-1.5 z-10 bg-amber-400 text-slate-950 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-amber-300 shadow-xs">
                    ✨ ของฉัน
                  </div>
                )}

                {/* 1. รูปภาพ (Portrait Photo) */}
                <div className="relative shrink-0 w-[95px] sm:w-[105px] overflow-hidden bg-slate-100 border-r border-slate-200/80">
                  <img
                    src={alumnus.avatarUrl}
                    alt={alumnus.name}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    style={{ minHeight: '115px', maxHeight: '135px' }}
                  />
                </div>

                {/* RIGHT CONTENT: รุ่น + ชื่อ + คำคม */}
                <div className="flex flex-col justify-center px-3.5 py-3 flex-1 min-w-0 space-y-1.5">
                  {/* 2. รุ่น (Generation Badge) */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-block text-[10px] font-extrabold tracking-wider uppercase text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100/80">
                      {alumnus.generation}
                    </span>
                    {alumnus.isAvailableForMentorship && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                        💬 ยินดีให้คำแนะนำ
                      </span>
                    )}
                  </div>

                  {/* 3. ชื่อ (Name & Nickname) */}
                  <h3
                    className="text-sm font-bold text-slate-900 leading-tight tracking-wide truncate"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    {alumnus.name} {alumnus.nickname ? `(${alumnus.nickname})` : ''}
                  </h3>

                  {/* 4. คำคม (Senior Quote) */}
                  <p
                    className="text-[11px] text-slate-600 leading-snug line-clamp-3 italic"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    &ldquo;{alumnus.quote}&rdquo;
                  </p>

                  {/* 5. ปุ่มกดใจ */}
                  <div className="flex items-center pt-1">
                    <button
                      onClick={(e) => handleReact(e, alumnus.id, 'likes')}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all duration-200 active:scale-90 ${
                        likedIds.has(String(alumnus.id))
                          ? 'bg-rose-100 text-rose-600 border border-rose-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 border border-transparent'
                      }`}
                    >
                      <Heart
                        className={`h-3.5 w-3.5 transition-all duration-200 ${
                          likedIds.has(String(alumnus.id))
                            ? 'fill-rose-500 text-rose-500 scale-110'
                            : 'fill-transparent text-rose-400'
                        }`}
                      />
                      <span>{getReactionCount(alumnus, 'likes')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT LIST VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {filteredAlumni.map((alumnus) => {
            const isMe =
              currentUser &&
              (String(alumnus.id) === String(currentUser.id) || alumnus.studentId === currentUser.student_id);

            return (
              <div
                key={alumnus.id}
                onClick={() => setSelectedAlumnus(alumnus)}
                className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                  isMe ? 'bg-amber-50/50' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* 1. รูปภาพ */}
                  <img
                    src={alumnus.avatarUrl}
                    alt={alumnus.name}
                    className="h-11 w-11 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {/* 2. ชื่อ */}
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {alumnus.name} {alumnus.nickname ? `(${alumnus.nickname})` : ''}
                      </h4>
                      {/* 3. รุ่น */}
                      <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
                        {alumnus.generation}
                      </span>
                      {alumnus.isAvailableForMentorship && (
                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shrink-0">
                          💬 ยินดีให้คำแนะนำ
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md shrink-0">
                          ฉัน
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. คำคม */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-semibold text-slate-700 truncate max-w-[280px] italic">
                      &ldquo;{alumnus.quote}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleReact(e, alumnus.id, 'likes')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/20" />
                      <span>{getReactionCount(alumnus, 'likes')}</span>
                    </button>
                  </div>
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
                  {Array.from({ length: 48 }, (_, i) => `รุ่น ${i + 1}`).map((gen) => (
                    <option key={gen} value={gen}>
                      {gen}
                    </option>
                  ))}
                </select>
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
            className="relative w-full max-w-md bg-white p-6 shadow-2xl rounded-[36px] border border-slate-100 text-center space-y-4 animate-scale-up"
          >
            <button
              onClick={() => setSelectedAlumnus(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 1. รูปภาพ (Photo) */}
            <img
              src={selectedAlumnus.avatarUrl}
              alt={selectedAlumnus.name}
              className="h-36 w-36 rounded-3xl object-cover mx-auto ring-4 ring-amber-100 shadow-md"
            />

            <div>
              {/* 2. รุ่น (Generation) */}
              <span className="inline-block bg-indigo-50 text-indigo-700 px-3.5 py-1 text-xs font-extrabold rounded-full mb-1.5 border border-indigo-100">
                {selectedAlumnus.generation}
              </span>
              {/* 3. ชื่อ (Name & Nickname) */}
              <h2 className="text-xl font-bold text-slate-900">
                {selectedAlumnus.name} {selectedAlumnus.nickname ? `(${selectedAlumnus.nickname})` : ''}
              </h2>
            </div>

            {/* 4. คำคม (Senior Quote) */}
            <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200/60 text-center shadow-2xs relative">
              <Quote className="h-4 w-4 text-amber-500 mx-auto mb-1" />
              <p className="text-sm font-serif italic font-bold text-amber-950 leading-relaxed">
                &ldquo;{selectedAlumnus.quote}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── All Generations Picker Modal ────────────────────────────── */}
      {isGenModalOpen && (
        <div
          onClick={() => setIsGenModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white p-6 shadow-2xl rounded-[32px] border border-slate-100 space-y-4 max-h-[85vh] flex flex-col animate-scale-up"
          >
            <button
              onClick={() => setIsGenModalOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-slate-100 pb-3 shrink-0">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                <span>ทำเนียบเลือกรุ่นศิษย์เก่า (รุ่น 1 - รุ่น 48)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                เลือกดูรายชื่อและหนังสือรุ่นของศิษย์เก่าแยกตามรุ่นที่ต้องการ
              </p>
            </div>

            {/* Quick Search Generation */}
            <div className="relative shrink-0">
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
            <div className="shrink-0">
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

            {/* Generations Grid 1 to 48 */}
            <div className="overflow-y-auto p-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 flex-1 scrollbar-hide">
              {Array.from({ length: 48 }, (_, i) => i + 1)
                .filter((genNum) => !genSearch.trim() || String(genNum).includes(genSearch.trim()))
                .map((genNum) => {
                  const count = alumniList.filter((a) => a.generationNumber === genNum).length;
                  const isSelected = selectedGeneration === String(genNum);

                  return (
                    <button
                      key={genNum}
                      type="button"
                      onClick={() => {
                        setSelectedGeneration(String(genNum));
                        setIsGenModalOpen(false);
                      }}
                      className={`p-2.5 rounded-2xl text-xs font-bold flex flex-col items-center justify-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                          : count > 0
                          ? 'bg-indigo-50/80 text-indigo-900 border-indigo-200/90 hover:bg-indigo-100'
                          : 'bg-slate-50/90 text-slate-600 border-slate-200/70 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="font-black text-xs">รุ่น {genNum}</span>
                      {count > 0 ? (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full mt-0.5 font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {count} คน
                        </span>
                      ) : (
                        <span className="text-[8px] text-slate-400 mt-0.5 font-normal">ไม่มีข้อมูล</span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

