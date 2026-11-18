import React from 'react';
import { INTENSITY_INFO } from '../data/sampleMenus';
import { X, Heart, Activity } from 'lucide-react';

interface EnZoneGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnZoneGuideModal: React.FC<EnZoneGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header (Bright Light Blue) */}
        <div
          className="p-4 sm:p-5 text-sky-950 flex justify-between items-center border-b border-sky-500/50"
          style={{ backgroundColor: '#38bdf8' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white text-sky-600 rounded shadow-xs">
              <Heart className="w-5 h-5 fill-sky-500 text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold">運動強度（A1〜SP3）解説</h2>
              <p className="text-xs text-sky-900 font-medium">8段階の強度区分と心拍数目安</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-sky-900 hover:text-sky-950 hover:bg-sky-300/50 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* 8段階カテゴリー一覧 */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-600" />
              運動強度一覧（A1 〜 SP3）
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(INTENSITY_INFO).map(([code, info]) => (
                <div
                  key={code}
                  className={`p-3 rounded-xl border ${info.bg} ${info.border} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5`}
                >
                  <div className="space-y-0.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-black text-sm px-2.5 py-0.5 rounded border bg-white ${info.color} ${info.border}`}>
                        {code}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        {info.purpose}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-snug pt-0.5">
                      {info.desc}
                    </p>
                  </div>

                  <div className="shrink-0 bg-white/90 px-3 py-1 rounded-lg border border-slate-200 text-right font-mono font-bold text-slate-800 min-w-[110px]">
                    <span className="text-[10px] text-slate-400 block font-sans">心拍数目安</span>
                    {info.hr}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 心拍数6秒測定ルール */}
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-950 leading-relaxed">
            <p className="font-bold mb-0.5">💡 心拍数の測り方（6秒測定）</p>
            <p className="text-[11px]">
              泳ぎ終わりに6秒間脈拍を数え、10倍すると1分間の心拍数（bpm）になります。（例: 6秒で16拍 × 10 = 160 bpm → EN2目安）
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
