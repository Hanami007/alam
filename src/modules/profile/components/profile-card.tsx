import { Camera, Mail, Phone, MapPin, Briefcase, BadgeCheck } from 'lucide-react';

export function ProfileCard() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">My profile</p>
            <h2 className="text-xl font-semibold text-slate-900">Editable alumni profile</h2>
          </div>
          <button className="rounded-2xl bg-blue-50 p-3 text-blue-600"><Camera className="h-5 w-5" /></button>
        </div>
        <div className="mt-6 overflow-hidden rounded-[24px]">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80" alt="Profile" className="h-64 w-full object-cover" />
        </div>
        <div className="mt-6 space-y-3 text-sm text-slate-600">
          <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-blue-600" /> Student ID: 20210048</div>
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" /> natacha@example.edu</div>
          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-600" /> +66 81 222 3456</div>
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" /> Bangkok, Thailand</div>
          <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-blue-600" /> Principal Engineer · TechNova</div>
        </div>
      </div>
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Profile details</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ['Generation', 'Gen 18'],
            ['Department', 'Computer Science'],
            ['Faculty', 'Engineering'],
            ['Occupation', 'Principal Engineer'],
            ['Employment Type', 'Private Company'],
            ['Company', 'TechNova'],
            ['Skills', 'TypeScript, Product Design, AI'],
            ['Biography', 'Mentoring students and building civic technology.'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-2 text-sm text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
