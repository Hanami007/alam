'use client';
import { useState, useEffect } from 'react';
import {
  Briefcase, GraduationCap, ImageIcon, MessageSquareText, Sparkles,
  Mail, MapPin, BadgeCheck, Vote, MessageCircle, Star, Lock, Clock,
  X, Tag, UserMinus, AlertTriangle, CheckCircle2, Eye, Calendar, User as UserIcon,
  Shield, Globe, EyeOff, Edit3, Camera, Upload, Building2, Layers, HeartHandshake,
  Loader2, Quote, Link2
} from 'lucide-react';
import { LocationPicker } from '@/components/ui/location-picker';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
];

interface Photo {
  id: number;
  image_url: string;
  watermark_url?: string | null;
  caption: string;
  created_at?: string;
  tagged_by_name?: string;
}

interface ActivityItem {
  description: string;
  points: number;
  created_at: string;
}

interface ProfileCardProps {
  user: any;
  taggedPhotos: Photo[];
  unlockedPhotos: Photo[];
  activityLog: ActivityItem[];
  isOwner?: boolean;
  lookupOptions?: { generations: any[]; provinces: any[]; careerTypes: any[] };
  onSaveProfile?: (data: Record<string, any>) => Promise<void>;
}

interface EditProfileForm {
  name: string;
  nickname: string;
  avatarUrl: string;
  position: string;
  company: string;
  bio: string;
  generationOptionId: string;
  provinceOptionId: string;
  workProvinceId: string;
  careerOptionId: string;
  isAvailableForMentorship: boolean;
  facebookUrl: string;
  lineId: string;
  showContactOnMap: boolean;
}

const POINTS_PER_LEVEL = 20;

function activityIcon(description: string) {
  if (description.includes('คอมเมนต์')) return MessageCircle;
  if (description.includes('โหวตโพล')) return Vote;
  if (description.includes('Hall of Fame')) return Star;
  if (description.includes('ปลดล็อกรูป')) return Lock;
  return Sparkles;
}

export type ProfileTab = 'overview' | 'privacy' | 'gallery' | 'activity';

export function ProfileCard({
  user, taggedPhotos = [], unlockedPhotos = [], activityLog = [], isOwner = false,
  lookupOptions, onSaveProfile,
}: ProfileCardProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [activeAlbum, setActiveAlbum] = useState<'tagged' | 'unlocked'>('tagged');
  const [taggedPhotosList, setTaggedPhotosList] = useState<Photo[]>(taggedPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoToUntag, setPhotoToUntag] = useState<Photo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<EditProfileForm>({
    name: '', nickname: '', avatarUrl: '', position: '', company: '', bio: '',
    generationOptionId: '', provinceOptionId: '', workProvinceId: '', careerOptionId: '',
    isAvailableForMentorship: false, facebookUrl: '', lineId: '', showContactOnMap: false,
  });
  const [isUntagging, setIsUntagging] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [showHometownOnMap, setShowHometownOnMap] = useState<boolean>(
    Boolean(user?.show_hometown_on_map ?? user?.showHometownOnMap)
  );
  const [showWorkplaceOnMap, setShowWorkplaceOnMap] = useState<boolean>(
    Boolean(user?.show_workplace_on_map ?? user?.showWorkplaceOnMap)
  );
  const [isSavingPrivacy, setIsSavingPrivacy] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setShowHometownOnMap(Boolean(user?.show_hometown_on_map ?? user?.showHometownOnMap));
      setShowWorkplaceOnMap(Boolean(user?.show_workplace_on_map ?? user?.showWorkplaceOnMap));
    }
  }, [user]);

  async function handleTogglePrivacy(key: 'showHometownOnMap' | 'showWorkplaceOnMap', value: boolean) {
    const nextHometown = key === 'showHometownOnMap' ? value : showHometownOnMap;
    const nextWorkplace = key === 'showWorkplaceOnMap' ? value : showWorkplaceOnMap;
    // showContactOnMap แก้ในโมดัล "แก้ไขข้อมูล" (คู่กับช่อง Facebook/LINE โดยตรง) ไม่ใช่ที่นี่ —
    // ต้องแนบค่าปัจจุบันไปด้วยเสมอ เพราะ /api/user/privacy เขียนทับทั้ง 3 ฟิลด์ทุกครั้ง
    const currentContact = Boolean(user?.show_contact_on_map ?? user?.showContactOnMap);

    if (key === 'showHometownOnMap') setShowHometownOnMap(value);
    if (key === 'showWorkplaceOnMap') setShowWorkplaceOnMap(value);

    setIsSavingPrivacy(true);
    try {
      const res = await fetch('/api/user/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          showHometownOnMap: nextHometown,
          showWorkplaceOnMap: nextWorkplace,
          showContactOnMap: currentContact,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage({ message: 'บันทึกการตั้งค่าความเป็นส่วนตัวบนแผนที่เรียบร้อย ✨', type: 'success' });
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      if (key === 'showHometownOnMap') setShowHometownOnMap(!value);
      if (key === 'showWorkplaceOnMap') setShowWorkplaceOnMap(!value);
      setToastMessage({ message: err.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', type: 'error' });
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSavingPrivacy(false);
    }
  }

  function openEditModal() {
    if (!user) return;
    setEditForm({
      name: user.name || '',
      nickname: user.nickname || '',
      avatarUrl: user.avatar_url || '',
      position: user.position || '',
      company: user.company || '',
      bio: user.bio || '',
      generationOptionId: user.generation_option_id ? String(user.generation_option_id) : '',
      provinceOptionId: user.province_option_id ? String(user.province_option_id) : '',
      workProvinceId: user.work_province_id ? String(user.work_province_id) : '',
      careerOptionId: user.career_option_id ? String(user.career_option_id) : '',
      isAvailableForMentorship: Boolean(user.is_available_for_mentorship),
      facebookUrl: user.facebook_url || '',
      lineId: user.line_id || '',
      showContactOnMap: Boolean(user.show_contact_on_map),
    });
    setIsEditModalOpen(true);
  }

  function handleAvatarFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setToastMessage({ message: 'ขนาดรูปภาพต้องไม่เกิน 2MB', type: 'error' });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditForm((prev) => ({ ...prev, avatarUrl: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSaveProfile) return;
    if (!editForm.name.trim()) {
      setToastMessage({ message: 'กรุณากรอกชื่อ-นามสกุล', type: 'error' });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    setIsSavingProfile(true);
    try {
      await onSaveProfile({
        name: editForm.name.trim(),
        nickname: editForm.nickname.trim(),
        avatarUrl: editForm.avatarUrl,
        position: editForm.position.trim(),
        company: editForm.company.trim(),
        bio: editForm.bio.trim(),
        generationOptionId: editForm.generationOptionId || undefined,
        provinceOptionId: editForm.provinceOptionId || undefined,
        workProvinceId: editForm.workProvinceId || undefined,
        careerOptionId: editForm.careerOptionId || undefined,
        isAvailableForMentorship: editForm.isAvailableForMentorship,
        facebookUrl: editForm.facebookUrl.trim(),
        lineId: editForm.lineId.trim(),
        showContactOnMap: editForm.showContactOnMap,
      });
      setIsEditModalOpen(false);
      setToastMessage({ message: 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว ✨', type: 'success' });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setToastMessage({ message: err.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', type: 'error' });
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSavingProfile(false);
    }
  }

  if (!user) {
    return (
      <div className="card-elevated p-8 text-center text-sm text-muted-foreground">
        ไม่พบข้อมูลผู้ใช้ (ยังไม่ได้ตั้งค่า session ผู้ใช้ปัจจุบัน)
      </div>
    );
  }

  const photos = activeAlbum === 'tagged' ? taggedPhotosList : unlockedPhotos;
  const level = Math.floor((user.total_points ?? 0) / POINTS_PER_LEVEL) + 1;
  const progressInLevel = (user.total_points ?? 0) % POINTS_PER_LEVEL;
  const progressPct = Math.round((progressInLevel / POINTS_PER_LEVEL) * 100);

  // Handle Untag / Remove Tag
  async function confirmUntag() {
    if (!photoToUntag) return;
    setIsUntagging(true);
    try {
      const res = await fetch('/api/gallery/untag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaAssetId: photoToUntag.id, userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setTaggedPhotosList((prev) => prev.filter((p) => p.id !== photoToUntag.id));
        if (selectedPhoto?.id === photoToUntag.id) {
          setSelectedPhoto(null);
        }
        setPhotoToUntag(null);
        setToastMessage({ message: 'ลบแท็กตัวคุณออกจากรูปภาพเรียบร้อยแล้ว ✨', type: 'success' });
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        setToastMessage({ message: data.error || 'เกิดข้อผิดพลาดในการลบแท็ก', type: 'error' });
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err: any) {
      setToastMessage({ message: err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', type: 'error' });
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsUntagging(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-slide-up relative">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce-in flex items-center gap-3 rounded-2xl bg-white/95 px-5 py-3.5 shadow-hero border border-slate-200/80 backdrop-blur-md">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            toastMessage.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}>
            {toastMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <span className="text-sm font-bold text-slate-800">{toastMessage.message}</span>
        </div>
      )}

      {/* ─── 1. PAGE HEADER ─── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">โปรไฟล์ของฉัน</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">จัดการข้อมูลส่วนตัว ความเป็นส่วนตัวบนแผนที่ และคลังภาพความทรงจำ</p>
        </div>
        {isOwner && onSaveProfile && (
          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex items-center gap-1.5 shrink-0 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">แก้ไขข้อมูล</span>
          </button>
        )}
      </div>

      {/* ─── 2. TAB NAVIGATION BAR ─── */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {[
          { id: 'overview' as const, label: 'ข้อมูลส่วนตัว', icon: UserIcon },
          { id: 'privacy' as const, label: 'ความเป็นส่วนตัวแผนที่', icon: Shield },
          {
            id: 'gallery' as const,
            label: 'อัลบั้มของฉัน',
            icon: ImageIcon,
            badge: `${taggedPhotosList.length + unlockedPhotos.length}`,
          },
          {
            id: 'activity' as const,
            label: 'กิจกรรม & แต้ม',
            icon: Sparkles,
            badge: `${user.total_points ?? 0}`,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer text-center ${
                isActive
                  ? 'bg-white text-indigo-900 shadow-sm shadow-indigo-950/5 scale-[1.01]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="truncate">{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB 1: ข้อมูลส่วนตัว (OVERVIEW)
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* 2-Column Balanced Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* การ์ดที่ 1: ข้อมูลส่วนตัว & การศึกษา */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-3.5 pb-3.5 border-b border-slate-100">
                  <div className="relative shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="h-12 w-12 rounded-2xl object-cover border border-slate-200 shadow-xs"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl border border-slate-200 shadow-xs bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg select-none">
                        {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <span className="badge-points absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs px-2 py-0.5 whitespace-nowrap shadow-2xs font-extrabold">
                      Lv.{level}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{user.name}</h3>
                    <p className="text-xs text-slate-500">ข้อมูลส่วนตัว & การศึกษา</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-sm">
                  <div className="py-3 flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">อีเมลติดต่อ</dt>
                      <dd className="text-slate-800 font-medium text-xs sm:text-sm mt-0.5 truncate">{user.email ?? '-'}</dd>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">รหัสนักศึกษา</dt>
                      <dd className="text-slate-800 font-mono font-medium text-xs sm:text-sm mt-0.5">{user.student_id ?? '-'}</dd>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">รุ่นการศึกษา & สถานะ</dt>
                      <dd className="text-slate-800 font-medium text-xs sm:text-sm mt-0.5">
                        {user.generation ?? 'ยังไม่ระบุ'} • {user.student_status === 'alumni' ? 'ศิษย์เก่า' : 'นักศึกษาปัจจุบัน'}
                      </dd>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">จังหวัดภูมิลำเนา</dt>
                      <dd className="text-slate-800 font-medium text-xs sm:text-sm mt-0.5">{user.province ?? 'กรุงเทพมหานคร'}</dd>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* การ์ดที่ 2: ข้อมูลอาชีพ & สถานที่ทำงาน */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-3.5 pb-3.5 border-b border-slate-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 shrink-0">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{user.company || 'อาชีพ & การทำงาน'}</h3>
                    <p className="text-xs text-slate-500">{user.position || 'ข้อมูลสายงานและสถานที่ทำงาน'}</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-sm">
                  <div className="py-3 flex items-start gap-3">
                    <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">ตำแหน่งงาน</dt>
                      <dd className="text-slate-800 font-semibold text-xs sm:text-sm mt-0.5">{user.position ?? 'ยังไม่ระบุตำแหน่ง'}</dd>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">บริษัท / สถานที่ทำงาน</dt>
                      <dd className="text-slate-800 font-semibold text-xs sm:text-sm mt-0.5">{user.company ?? 'ยังไม่ระบุบริษัท'}</dd>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">ประเภทสายงาน & พื้นที่ทำงาน</dt>
                      <dd className="text-slate-800 font-medium text-xs sm:text-sm mt-0.5">
                        {user.career_type ? `${user.career_type}` : 'สายงานทั่วไป'} • {user.work_province ?? user.province ?? 'กรุงเทพมหานคร'}
                      </dd>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">เกี่ยวกับฉัน</dt>
                      <dd className="text-slate-700 italic text-xs sm:text-sm mt-0.5 leading-relaxed">
                        {user.bio ? `"${user.bio}"` : 'ยังไม่มีข้อความแนะนำตัว'}
                      </dd>
                    </div>
                  </div>
                  {(user.facebook_url || user.line_id) && (
                    <div className="py-3 flex items-start gap-3">
                      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                      <div className="min-w-0 flex-1">
                        <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span>ช่องทางติดต่อ</span>
                          {isOwner && (
                            <span className={`normal-case text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              Boolean(user.show_contact_on_map)
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}>
                              {Boolean(user.show_contact_on_map) ? 'แสดงบนแผนที่' : 'ซ่อนจากแผนที่'}
                            </span>
                          )}
                        </dt>
                        <dd className="mt-1.5 flex flex-wrap items-center gap-2">
                          {user.facebook_url && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                              <Link2 className="h-3.5 w-3.5" /> Facebook: {user.facebook_url}
                            </span>
                          )}
                          {user.line_id && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                              <MessageCircle className="h-3.5 w-3.5" /> LINE: {user.line_id}
                            </span>
                          )}
                        </dd>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* สรุปสถิติภาพรวม 4 กล่องเท่ากัน */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="stat-icon-badge bg-amber-50 text-amber-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase">คะแนนสะสม</p>
                <p className="text-base sm:text-lg font-black text-slate-900">{user.total_points ?? 0} แต้ม</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="stat-icon-badge bg-emerald-50 text-emerald-600">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase">ระดับผู้ใช้งาน</p>
                <p className="text-base sm:text-lg font-black text-slate-900">Lv.{level}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="stat-icon-badge bg-indigo-50 text-indigo-600">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase">รูปที่มีคุณ</p>
                <p className="text-base sm:text-lg font-black text-slate-900">{taggedPhotosList.length} รูป</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="stat-icon-badge bg-purple-50 text-purple-600">
                <Lock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase">รูปที่ปลดล็อก</p>
                <p className="text-base sm:text-lg font-black text-slate-900">{unlockedPhotos.length} รูป</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 2: ความเป็นส่วนตัวบนแผนที่ (PRIVACY)
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'privacy' && (
        <div className="space-y-6 animate-fade-in">
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">การตั้งค่าความเป็นส่วนตัวบนแผนที่</h3>
                <p className="text-xs text-slate-500">
                  ควบคุมการปักหมุดตำแหน่งของคุณในระบบแผนที่เครือข่ายศิษย์เก่าทั่วประเทศ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {/* Toggle แสดงภูมิลำเนาบนแผนที่ */}
              <div className="flex flex-col justify-between rounded-2xl bg-slate-50/90 p-5 border border-slate-200/80 space-y-4 transition-all hover:bg-indigo-50/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">แสดงภูมิลำเนาบนแผนที่</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        อนุญาตให้ศิษย์เก่าเห็นจังหวัดบ้านเกิดของคุณในแท็บ &ldquo;ภูมิลำเนา&rdquo;
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showHometownOnMap}
                    disabled={isSavingPrivacy}
                    onClick={() => handleTogglePrivacy('showHometownOnMap', !showHometownOnMap)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                      showHometownOnMap ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        showHometownOnMap ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
                  {showHometownOnMap ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <Globe className="h-3.5 w-3.5 text-emerald-500" /> กำลังแสดง ({user.province || 'กรุงเทพมหานคร'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                      <EyeOff className="h-3.5 w-3.5" /> ซ่อนจากแผนที่
                    </span>
                  )}
                </div>
              </div>

              {/* Toggle แสดงจังหวัดที่ทำงานบนแผนที่ */}
              <div className="flex flex-col justify-between rounded-2xl bg-slate-50/90 p-5 border border-slate-200/80 space-y-4 transition-all hover:bg-indigo-50/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">แสดงที่ทำงานบนแผนที่</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        อนุญาตให้ศิษย์เก่าเห็นจังหวัดที่ทำงานของคุณในแท็บ &ldquo;ที่ทำงานศิษย์เก่า&rdquo;
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showWorkplaceOnMap}
                    disabled={isSavingPrivacy}
                    onClick={() => handleTogglePrivacy('showWorkplaceOnMap', !showWorkplaceOnMap)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                      showWorkplaceOnMap ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        showWorkplaceOnMap ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
                  {showWorkplaceOnMap ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <Globe className="h-3.5 w-3.5 text-emerald-500" /> กำลังแสดงบนแผนที่
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                      <EyeOff className="h-3.5 w-3.5" /> ซ่อนจากแผนที่
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ช่องทางติดต่อ (Facebook/LINE) แก้ไขและเปิด/ปิดการแสดงผลรวมกันในโมดัล "แก้ไขข้อมูล" แทน
                เพราะควบคู่กับการกรอกข้อมูลโดยตรง ไม่แยกเป็นอีกแท็บเพื่อไม่ให้พลาดตั้งค่า */}
            {isOwner && onSaveProfile && (
              <button
                type="button"
                onClick={openEditModal}
                className="w-full rounded-2xl bg-emerald-50/90 p-4 border border-emerald-200/80 flex items-center justify-between gap-3 text-left hover:bg-emerald-100/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">ช่องทางติดต่อ (Facebook / LINE)</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {user?.facebook_url || user?.line_id
                        ? `กำลัง${Boolean(user?.show_contact_on_map ?? user?.showContactOnMap) ? 'แสดง' : 'ซ่อนจาก'}แผนที่ • แก้ไขได้ในปุ่ม "แก้ไขข้อมูล"`
                        : 'ยังไม่ได้กรอก • เพิ่มได้ในปุ่ม "แก้ไขข้อมูล"'}
                    </p>
                  </div>
                </div>
                <Edit3 className="h-4 w-4 text-emerald-600 shrink-0" />
              </button>
            )}

            <div className="rounded-2xl bg-blue-50/80 p-4 border border-blue-100 flex items-start gap-3">
              <Shield className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>ความปลอดภัยของข้อมูล:</strong> ตำแหน่งของคุณจะแสดงเฉพาะระดับจังหวัดเท่านั้น ไม่มีการแสดงที่อยู่บ้านเลขที่หรือสถานที่ทำงานแบบละเอียด และระบบจะบันทึกการตั้งค่าของคุณทันทีโดยอัตโนมัติ
              </p>
            </div>
          </section>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 3: อัลบั้มของฉัน (GALLERY)
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'gallery' && (
        <div className="space-y-6 animate-fade-in">
          {/* Symmetrical 2-card Stat Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">รูปที่มีคุณ (ถูกแท็ก)</p>
                  <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{taggedPhotosList.length} รูปภาพ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveAlbum('tagged')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeAlbum === 'tagged' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ดูรูปที่แท็ก
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">รูปที่ปลดล็อกแล้ว</p>
                  <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{unlockedPhotos.length} รูปภาพ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveAlbum('unlocked')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeAlbum === 'unlocked' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ดูรูปปลดล็อก
              </button>
            </div>
          </section>

          {/* อัลบั้มรูป */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {activeAlbum === 'tagged' ? '🏷️ รูปภาพที่มีคุณ (ถูกแท็ก)' : '🔓 รูปภาพที่คุณตอบคำถามปลดล็อก'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeAlbum === 'tagged'
                    ? 'รูปภาพที่คุณถูกแท็กโดยเพื่อน สามารถแตะเพื่อดูรูปขนาดใหญ่หรือขอลบแท็กออกได้'
                    : 'รูปภาพที่คุณร่วมตอบคำถามปลดล็อกด้วยตนเองในคลังภาพเก่า'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAlbum('tagged')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeAlbum === 'tagged'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🏷️ รูปที่มีคุณ ({taggedPhotosList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAlbum('unlocked')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeAlbum === 'unlocked'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🔓 รูปที่ปลดล็อก ({unlockedPhotos.length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/70 shadow-2xs cursor-pointer aspect-square"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.watermark_url || photo.image_url}
                    alt={photo.caption}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src !== photo.image_url && photo.image_url) {
                        img.src = photo.image_url;
                      } else {
                        img.style.display = 'none';
                      }
                    }}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Hover Overlay with Quick Actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                    <div className="flex justify-end">
                      {activeAlbum === 'tagged' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoToUntag(photo);
                          }}
                          className="flex items-center gap-1 rounded-full bg-rose-500/90 hover:bg-rose-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-xs transition-transform active:scale-95"
                          title="ลบแท็กฉันออกจากรูปนี้"
                        >
                          <UserMinus className="h-3 w-3" />
                          <span>ลบแท็ก</span>
                        </button>
                      )}
                    </div>

                    <div className="text-white">
                      <p className="text-xs font-semibold truncate drop-shadow-sm">{photo.caption || 'รูปภาพกิจกรรม'}</p>
                      {photo.tagged_by_name && (
                        <p className="text-[10px] text-white/80 truncate">แท็กโดย {photo.tagged_by_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {photos.length === 0 && (
                <div className="col-span-full rounded-2xl bg-slate-50 p-12 text-center text-sm text-slate-500 border border-dashed border-slate-200">
                  <p className="font-bold text-slate-700">ยังไม่มีรูปในอัลบั้มนี้</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeAlbum === 'tagged'
                      ? 'เมื่อมีเพื่อนแท็กคุณในคลังภาพเก่า รูปภาพจะมาปรากฏที่นี่โดยอัตโนมัติ'
                      : 'ลองไปตอบคำถามปลดล็อกรูปที่หน้าคลังภาพเก่าเพื่อเก็บสะสมรูปภาพของคุณ'}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 4: กิจกรรม & แต้มสะสม (ACTIVITY)
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'activity' && (
        <div className="space-y-6 animate-fade-in">
          {/* Level Progress Card */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-xs">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">ระดับของคุณ: Level {level}</h3>
                  <p className="text-xs text-slate-500">
                    สะสมอีก <span className="font-bold text-indigo-600">{POINTS_PER_LEVEL - progressInLevel}</span> แต้มเพื่อเลื่อนสู่ Level {level + 1}
                  </p>
                </div>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-base sm:text-lg font-black text-indigo-600">{user.total_points ?? 0} แต้มสะสม</span>
                <p className="text-[11px] text-slate-400">ความคืบหน้า {progressPct}%</p>
              </div>
            </div>

            <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </section>

          {/* Activity log */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">ประวัติกิจกรรมและคะแนนล่าสุด</h3>
                <p className="text-xs text-slate-500">บันทึกกิจกรรมการมีส่วนร่วมในระบบ</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">ทั้งหมด {activityLog.length} รายการ</span>
            </div>

            <div className="space-y-3">
              {activityLog.length === 0 && (
                <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">
                  ยังไม่มีกิจกรรม ลองไปคอมเมนต์ โหวตโพล หรือตอบคำถามปลดล็อกรูปดูสิ
                </p>
              )}
              {activityLog.slice(0, 15).map((item, i) => {
                const Icon = activityIcon(item.description);
                return (
                  <div key={i} className="flex items-center gap-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-50 p-4 border border-slate-100 transition-colors">
                    <div className="stat-icon-badge h-10 w-10 bg-indigo-50 text-indigo-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{item.description}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Clock className="h-3 w-3" /> {new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {item.points > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700 border border-amber-200/80 shadow-2xs">
                        +{item.points} แต้ม
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ===== PHOTO PREVIEW LIGHTBOX MODAL ===== */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-[32px] overflow-hidden shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Photo Image */}
            <div className="relative aspect-4/3 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhoto.image_url || selectedPhoto.watermark_url || ''}
                alt={selectedPhoto.caption}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Photo Info & Untag Action */}
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{selectedPhoto.caption || 'รูปภาพความทรงจำ'}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                    {selectedPhoto.tagged_by_name && (
                      <span className="flex items-center gap-1 text-purple-600 font-medium">
                        <UserIcon className="h-3.5 w-3.5" /> แท็กโดย: {selectedPhoto.tagged_by_name}
                      </span>
                    )}
                    {selectedPhoto.created_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {new Date(selectedPhoto.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {activeAlbum === 'tagged' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoToUntag(selectedPhoto);
                    }}
                    className="flex items-center gap-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 shrink-0"
                  >
                    <UserMinus className="h-4 w-4 text-rose-500" />
                    <span>ลบแท็กตัวฉันออก</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== UNTAG CONFIRMATION DIALOG MODAL ===== */}
      {photoToUntag && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => !isUntagging && setPhotoToUntag(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 animate-scale-up space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 border border-rose-200">
                <UserMinus className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบแท็ก</h3>
                <p className="text-xs text-slate-400">ลบแท็กตัวคุณออกจากรูปนี้</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-xs sm:text-sm text-slate-600 space-y-1.5 border border-slate-100">
              <p className="font-semibold text-slate-800">
                คุณต้องการลบแท็กชื่อของคุณออกจากรูปภาพนี้ใช่หรือไม่?
              </p>
              <p className="text-slate-500 text-xs leading-relaxed">
                • รูปนี้จะไม่แสดงในหน้าโปรไฟล์และอัลบั้มของคุณอีกต่อไป<br />
                • รูปภาพต้นฉบับในคลังภาพยังคงอยู่ตามปกติ
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isUntagging}
                onClick={() => setPhotoToUntag(null)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isUntagging}
                onClick={confirmUntag}
                className="flex items-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-700 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {isUntagging ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>กำลังลบแท็ก...</span>
                  </>
                ) : (
                  <>
                    <UserMinus className="h-3.5 w-3.5" />
                    <span>ยืนยันลบแท็ก</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT PROFILE MODAL ===== */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => !isSavingProfile && setIsEditModalOpen(false)}
        >
          <form
            onSubmit={handleSaveProfileSubmit}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 animate-scale-up space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">แก้ไขข้อมูลส่วนตัว</h3>
                  <p className="text-xs text-slate-400">ข้อมูลนี้จะแสดงบนหน้าโปรไฟล์ วอลล์ และหนังสือรุ่น</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingProfile}
                onClick={() => setIsEditModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Avatar */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-indigo-500" /> รูปโปรไฟล์
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={editForm.avatarUrl || PRESET_AVATARS[0]}
                  alt="ตัวอย่างรูปโปรไฟล์"
                  className="h-16 w-16 rounded-2xl object-cover border-2 border-indigo-200 shadow-xs shrink-0 bg-slate-200"
                />
                <div className="flex-1 w-full space-y-2.5">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditForm((prev) => ({ ...prev, avatarUrl: url }))}
                        className={`relative rounded-xl overflow-hidden h-9 w-9 border-2 transition-all cursor-pointer shrink-0 ${
                          editForm.avatarUrl === url
                            ? 'border-indigo-500 ring-2 ring-indigo-300 scale-105'
                            : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`ตัวเลือก ${idx + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 cursor-pointer transition-all">
                      <Upload className="h-3.5 w-3.5 text-indigo-500" />
                      <span>อัปโหลดจากเครื่อง</span>
                      <input type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
                    </label>
                    <div className="flex-1 min-w-[180px]">
                      <input
                        type="url"
                        value={editForm.avatarUrl.startsWith('data:') ? '' : editForm.avatarUrl}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                        placeholder="หรือวาง URL รูปภาพ..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Name & Nickname */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">ชื่อเล่น</label>
                <input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, nickname: e.target.value }))}
                  placeholder="เช่น เอ, บอย, พลอย..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            {/* Generation & Hometown Province */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> รุ่นการศึกษา
                </label>
                <select
                  value={editForm.generationOptionId}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, generationOptionId: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option value="">ไม่ระบุ</option>
                  {(lookupOptions?.generations || []).map((g) => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" /> จังหวัดภูมิลำเนา
                </label>
                <LocationPicker
                  value={editForm.provinceOptionId}
                  onChange={(val) => setEditForm((prev) => ({ ...prev, provinceOptionId: val }))}
                  options={lookupOptions?.provinces || []}
                  accentColor="indigo"
                  placeholder="เลือกจังหวัด หรือ ประเทศภูมิลำเนา"
                />
              </div>
            </div>

            {/* Company & Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-purple-500" /> บริษัท / สถานที่ทำงาน
                </label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, company: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-purple-500" /> ตำแหน่งงาน
                </label>
                <input
                  type="text"
                  value={editForm.position}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, position: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
            </div>

            {/* Career type & Work province */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-purple-500" /> ประเภทสายงาน
                </label>
                <select
                  value={editForm.careerOptionId}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, careerOptionId: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
                >
                  <option value="">ไม่ระบุ</option>
                  {(lookupOptions?.careerTypes || []).map((ct) => (
                    <option key={ct.id} value={ct.id}>{ct.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-purple-500" /> จังหวัดที่ทำงาน
                </label>
                <LocationPicker
                  value={editForm.workProvinceId}
                  onChange={(val) => setEditForm((prev) => ({ ...prev, workProvinceId: val }))}
                  options={lookupOptions?.provinces || []}
                  accentColor="amber"
                  placeholder="เลือกจังหวัด หรือ ประเทศที่ทำงาน"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Quote className="h-3.5 w-3.5 text-slate-500" /> เกี่ยวกับฉัน
              </label>
              <textarea
                rows={3}
                value={editForm.bio}
                onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="แนะนำตัวสั้นๆ หรือคติประจำใจ..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all resize-none"
              />
            </div>

            {/* Facebook & LINE + toggle แสดงบนแผนที่ รวมอยู่การ์ดเดียวกัน เพื่อไม่ให้พลาดเปิดการแสดงผล */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-indigo-500" />
                  <span>ช่องทางติดต่อ (Facebook / LINE)</span>
                </label>
                <span className="text-[11px] text-slate-400">ไม่บังคับ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-indigo-500" /> Facebook
                  </label>
                  <input
                    type="text"
                    value={editForm.facebookUrl}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, facebookUrl: e.target.value }))}
                    placeholder="ลิงก์โปรไฟล์ หรือ ชื่อผู้ใช้ Facebook"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> LINE ID
                  </label>
                  <input
                    type="text"
                    value={editForm.lineId}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, lineId: e.target.value }))}
                    placeholder="LINE ID ของคุณ"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>
              </div>

              {/* Toggle แสดงบนแผนที่ — อยู่ติดกับช่องกรอกโดยตรง กันพลาดกรอกแล้วลืมเปิด */}
              <div
                onClick={() => setEditForm((prev) => ({ ...prev, showContactOnMap: !prev.showContactOnMap }))}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer select-none transition-all ${
                  editForm.showContactOnMap ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${editForm.showContactOnMap ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {editForm.showContactOnMap ? <Globe className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </div>
                  <p className="text-xs font-bold text-slate-700 truncate">
                    แสดงช่องทางนี้บนแผนที่เมื่อคนอื่นดูโปรไฟล์คุณ
                  </p>
                </div>
                <div className={`relative inline-flex h-5.5 w-10 shrink-0 rounded-full transition-colors ${editForm.showContactOnMap ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span
                    className={`pointer-events-none absolute top-0.5 left-0.5 inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition-transform ${
                      editForm.showContactOnMap ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Mentorship toggle */}
            <div
              onClick={() => setEditForm((prev) => ({ ...prev, isAvailableForMentorship: !prev.isAvailableForMentorship }))}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                editForm.isAvailableForMentorship ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${editForm.isAvailableForMentorship ? 'bg-purple-100 text-purple-600' : 'bg-white text-slate-400'}`}>
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">ยินดีให้คำแนะนำรุ่นน้อง</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">แสดงป้าย &ldquo;ยินดีให้คำแนะนำ&rdquo; บนโปรไฟล์และโพสต์ของคุณ</p>
                </div>
              </div>
              <div className={`h-6 w-11 rounded-full p-0.5 transition-colors shrink-0 ${editForm.isAvailableForMentorship ? 'bg-purple-500' : 'bg-slate-300'}`}>
                <div className={`h-5 w-5 rounded-full bg-white transition-transform ${editForm.isAvailableForMentorship ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSavingProfile}
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>บันทึกข้อมูล</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}