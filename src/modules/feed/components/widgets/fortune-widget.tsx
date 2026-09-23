'use client';

import { Sparkles, Dices } from 'lucide-react';

interface FortuneWidgetProps {
  fortuneText: string;
  isSpinning: boolean;
  onSpin: () => void;
}

export function FortuneWidget({ fortuneText, isSpinning, onSpin }: FortuneWidgetProps) {
  return (
    <div className="rounded-[26px] border border-purple-200/70 bg-gradient-to-br from-purple-50/70 via-white to-pink-50/40 p-4.5 shadow-card transition-all duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span>เซียมซีศิษย์เก่าประจำวัน 🔮</span>
        </h3>
        <button
          onClick={onSpin}
          disabled={isSpinning}
          className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-200 transition-colors flex items-center gap-1 active:scale-95"
        >
          <Dices className={`h-3 w-3 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>สุ่มดวง</span>
        </button>
      </div>

      <div className="mt-3 rounded-2xl border border-purple-100/70 bg-white p-3.5 text-center shadow-2xs">
        <p className="text-xs font-semibold text-purple-800 leading-relaxed transition-all">
          {fortuneText}
        </p>
      </div>
    </div>
  );
}
