'use client';

import { useState } from 'react';
import {
  MapPin,
  Briefcase,
  Shield,
  Globe,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Lock,
  User,
  Bell,
} from 'lucide-react';

interface PrivacySettings {
  showHometownOnMap: boolean;
  showWorkplaceOnMap: boolean;
}

interface SettingsPanelProps {
  userId: number;
  userName: string;
  initialPrivacy: PrivacySettings;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const NAV_ITEMS = [
  { id: 'privacy', label: 'ความเป็นส่วนตัว', icon: Shield, active: true },
  { id: 'profile', label: 'โปรไฟล์', icon: User, active: false },
  { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell, active: false },
  { id: 'security', label: 'ความปลอดภัย', icon: Lock, active: false },
];

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-indigo-500' : 'bg-slate-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function SettingsPanel({ userId, userName, initialPrivacy }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<string>('privacy');
  const [privacy, setPrivacy] = useState<PrivacySettings>(initialPrivacy);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isDirty =
    privacy.showHometownOnMap !== initialPrivacy.showHometownOnMap ||
    privacy.showWorkplaceOnMap !== initialPrivacy.showWorkplaceOnMap;

  async function handleSavePrivacy() {
    setSaveStatus('saving');
    setErrorMsg('');
    try {
      const res = await fetch('/api/user/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          showHometownOnMap: privacy.showHometownOnMap,
          showWorkplaceOnMap: privacy.showWorkplaceOnMap,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setErrorMsg(data.error ?? 'เกิดข้อผิดพลาด');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message ?? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-indigo-600">ตั้งค่าระบบ</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          การตั้งค่าบัญชี
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          จัดการความเป็นส่วนตัว โปรไฟล์ และการแจ้งเตือนของ{' '}
          <span className="font-semibold text-slate-700">{userName}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* ── Sidebar Nav ── */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                  {item.label}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-indigo-400" />}
              </button>
            );
          })}
        </nav>

        {/* ── Content Panel ── */}
        <div className="space-y-4">

          {/* ═══════════════════════════════════════
              PRIVACY SECTION
          ═══════════════════════════════════════ */}
          {activeSection === 'privacy' && (
            <>
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
                    <Shield className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">ความเป็นส่วนตัว</h2>
                    <p className="text-xs text-slate-500">ควบคุมการแสดงข้อมูลของคุณบนแผนที่ศิษย์เก่า</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Map Privacy: Hometown */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:border-indigo-100 hover:bg-indigo-50/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100">
                          <MapPin className="h-4 w-4 text-pink-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            แสดงภูมิลำเนาบนแผนที่
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                            อนุญาตให้ศิษย์เก่าคนอื่นเห็นจังหวัดบ้านเกิดของคุณในแท็บ
                            &ldquo;ภูมิลำเนา&rdquo; บนหน้าแผนที่
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            {privacy.showHometownOnMap ? (
                              <>
                                <Globe className="h-3 w-3 text-emerald-500" />
                                <span className="text-xs font-medium text-emerald-600">กำลังแสดงบนแผนที่</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 text-slate-400" />
                                <span className="text-xs text-slate-400">ซ่อนจากแผนที่</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <Toggle
                          checked={privacy.showHometownOnMap}
                          onChange={(v) => setPrivacy((p) => ({ ...p, showHometownOnMap: v }))}
                          disabled={saveStatus === 'saving'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Map Privacy: Workplace */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:border-indigo-100 hover:bg-indigo-50/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100">
                          <Briefcase className="h-4 w-4 text-sky-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            แสดงจังหวัดที่ทำงานบนแผนที่
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                            อนุญาตให้ศิษย์เก่าคนอื่นเห็นจังหวัดที่คุณทำงานในแท็บ
                            &ldquo;ที่ทำงานศิษย์เก่า&rdquo; บนหน้าแผนที่
                            (เฉพาะศิษย์เก่าที่จบแล้วเท่านั้น)
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            {privacy.showWorkplaceOnMap ? (
                              <>
                                <Globe className="h-3 w-3 text-emerald-500" />
                                <span className="text-xs font-medium text-emerald-600">กำลังแสดงบนแผนที่</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 text-slate-400" />
                                <span className="text-xs text-slate-400">ซ่อนจากแผนที่</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <Toggle
                          checked={privacy.showWorkplaceOnMap}
                          onChange={(v) => setPrivacy((p) => ({ ...p, showWorkplaceOnMap: v }))}
                          disabled={saveStatus === 'saving'}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button + Status */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                  <div className="text-xs text-slate-400">
                    {isDirty && saveStatus === 'idle' && (
                      <span className="text-amber-500 font-medium">● มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
                    )}
                    {saveStatus === 'success' && (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> บันทึกเรียบร้อยแล้ว
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                        <AlertCircle className="h-3.5 w-3.5" /> {errorMsg || 'เกิดข้อผิดพลาด'}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleSavePrivacy}
                    disabled={saveStatus === 'saving' || saveStatus === 'success'}
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      saveStatus === 'success'
                        ? 'bg-emerald-500 text-white'
                        : saveStatus === 'error'
                        ? 'bg-rose-500 text-white'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 active:scale-95'
                    }`}
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : saveStatus === 'success' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        บันทึกแล้ว ✨
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        บันทึกการตั้งค่า
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info box */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 flex items-start gap-3">
                <Shield className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-800">ข้อมูลความเป็นส่วนตัว</p>
                  <p className="mt-0.5 text-xs text-blue-700 leading-relaxed">
                    ข้อมูลที่คุณแชร์จะแสดงเฉพาะจังหวัดเท่านั้น ไม่มีการแสดงที่อยู่แบบละเอียด
                    คุณสามารถเปลี่ยนการตั้งค่านี้ได้ตลอดเวลา
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════
              OTHER SECTIONS (placeholder)
          ═══════════════════════════════════════ */}
          {activeSection !== 'privacy' && (
            <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                {activeSection === 'profile' && <User className="h-6 w-6 text-slate-400" />}
                {activeSection === 'notifications' && <Bell className="h-6 w-6 text-slate-400" />}
                {activeSection === 'security' && <Lock className="h-6 w-6 text-slate-400" />}
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-600">
                {NAV_ITEMS.find((n) => n.id === activeSection)?.label}
              </p>
              <p className="mt-1 text-xs text-slate-400">ส่วนนี้อยู่ในระหว่างการพัฒนา</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
