import React, { useState, useEffect } from 'react';
import { SwimMenu } from '../types';
import { TeamConversionOptions, convertMenuToTeam } from '../utils/bTeamConverter';
import { calcItemTotalDistance, calcItemTotalDurationSec, formatCycleTime } from '../utils/swimCalculators';
import { SAMPLE_TEMPLATES } from '../data/sampleMenus';
import {
  Zap,
  X,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Clock,
  Activity,
  Info
} from 'lucide-react';

interface TeamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTeam: 'B' | 'C';
  menuA: SwimMenu;
  onApply: (convertedMenu: SwimMenu, options: TeamConversionOptions) => void;
}

export const TeamConfigModal: React.FC<TeamConfigModalProps> = ({
  isOpen,
  onClose,
  targetTeam,
  menuA,
  onApply
}) => {
  const isC = targetTeam === 'C';
  const defaultReps = isC ? 0.4 : 0.6;
  const defaultCycle = isC ? 1.6 : 1.4;

  const [repsMultiplier, setRepsMultiplier] = useState<number>(defaultReps);
  const [cycleMultiplier, setCycleMultiplier] = useState<number>(defaultCycle);
  const [shortenLongDistance, setShortenLongDistance] = useState<boolean>(true);
  const [keepWarmupDown, setKeepWarmupDown] = useState<boolean>(true);
  const [showItemPreviewList, setShowItemPreviewList] = useState<boolean>(false);

  // targetTeamが切り替わったとき、またはモーダルが開いたときにデフォルト倍率を同期更新
  useEffect(() => {
    if (isOpen) {
      setRepsMultiplier(isC ? 0.4 : 0.6);
      setCycleMultiplier(isC ? 1.6 : 1.4);
    }
  }, [targetTeam, isC, isOpen]);

  if (!isOpen) return null;

  // Aチームが空の場合は、シミュレーション用サンプルメニューを代替利用してリアルタイム計算を表示
  const isAEmpty = !menuA || !menuA.items || menuA.items.length === 0;
  const effectiveBaseMenu: SwimMenu = isAEmpty ? SAMPLE_TEMPLATES[0].menu : menuA;

  // Calculate live preview totals in real-time
  const currentOptions: TeamConversionOptions = {
    teamLevel: targetTeam,
    repsMultiplier,
    cycleMultiplier,
    shortenLongDistance,
    keepWarmupDown
  };

  const previewMenu = convertMenuToTeam(effectiveBaseMenu, currentOptions);

  const calcTotalDist = (m: SwimMenu) =>
    m.items.reduce((sum, item) => sum + calcItemTotalDistance(item), 0);

  const calcTotalSeconds = (m: SwimMenu) =>
    m.items.reduce((sum, item) => sum + calcItemTotalDurationSec(item), 0);

  const aDist = calcTotalDist(effectiveBaseMenu);
  const previewDist = calcTotalDist(previewMenu);
  const aTotalSec = calcTotalSeconds(effectiveBaseMenu);
  const previewTotalSec = calcTotalSeconds(previewMenu);

  const distDiffPct = aDist > 0 ? Math.round(((previewDist - aDist) / aDist) * 100) : 0;
  const distDiffM = previewDist - aDist;
  const aMin = Math.round(aTotalSec / 60);
  const previewMin = Math.round(previewTotalSec / 60);
  const diffMin = previewMin - aMin;

  // 秒を四捨五入して分単位で計算・表示（ユーザー指定：秒は四捨五入して分で表示）
  const formatTimeDetailed = (totalSec: number) => {
    if (!totalSec || totalSec <= 0) return '0分';
    const totalMin = Math.round(totalSec / 60);
    if (totalMin >= 60) {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return m > 0 ? `${h}時間${m}分` : `${h}時間`;
    }
    return `${totalMin}分`;
  };

  const handleConfirm = () => {
    const targetBaseMenu = effectiveBaseMenu;
    const finalConverted = convertMenuToTeam(targetBaseMenu, currentOptions);
    onApply(finalConverted, currentOptions);
    onClose();
  };

  const themeColors = isC
    ? {
        headerBg: 'bg-amber-400 text-amber-950 font-bold',
        badgeBg: 'bg-amber-100 text-amber-950 border-amber-300 font-bold',
        accentText: 'text-amber-900',
        accentButton: 'bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold border border-amber-300',
        sliderAccent: 'accent-amber-500',
        boxBg: 'bg-amber-50 border-amber-300',
        tag: 'Cチーム (超低強度版)'
      }
    : {
        headerBg: 'bg-emerald-800 text-white',
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200 font-bold',
        accentText: 'text-emerald-900',
        accentButton: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
        sliderAccent: 'accent-emerald-600',
        boxBg: 'bg-emerald-50 border-emerald-200',
        tag: 'Bチーム (低強度版)'
      };

  // 目盛り定義（本数: 0.30 - 1.00, 範囲 0.70, 5%刻み）
  const REPS_RULER_PINS = [
    0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00
  ].map((val) => ({
    val,
    pct: ((val - 0.3) / 0.7) * 100,
    major: Math.round(val * 10) === Math.round(val * 100) / 10
  }));

  const REPS_LABELS = [
    { val: 0.30, label: '0.3倍', pct: 0, tag: undefined },
    { val: 0.40, label: '0.4倍', pct: ((0.4 - 0.3) / 0.7) * 100, tag: isC ? 'C標準' : undefined },
    { val: 0.50, label: '0.5倍', pct: ((0.5 - 0.3) / 0.7) * 100, tag: undefined },
    { val: 0.60, label: '0.6倍', pct: ((0.6 - 0.3) / 0.7) * 100, tag: !isC ? 'B標準' : undefined },
    { val: 0.70, label: '0.7倍', pct: ((0.7 - 0.3) / 0.7) * 100, tag: undefined },
    { val: 0.80, label: '0.8倍', pct: ((0.8 - 0.3) / 0.7) * 100, tag: undefined },
    { val: 0.90, label: '0.9倍', pct: ((0.9 - 0.3) / 0.7) * 100, tag: undefined },
    { val: 1.00, label: '1.0倍', pct: 100, tag: '維持' },
  ];

  // 目盛り定義（サイクル: 1.00 - 2.00, 範囲 1.00, 5%刻み）
  const CYCLE_RULER_PINS = [
    1.00, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30, 1.35, 1.40, 1.45, 1.50, 1.55, 1.60, 1.65, 1.70, 1.75, 1.80, 1.85, 1.90, 1.95, 2.00
  ].map((val) => ({
    val,
    pct: ((val - 1.0) / 1.0) * 100,
    major: Math.round(val * 10) === Math.round(val * 100) / 10
  }));

  const CYCLE_LABELS = [
    { val: 1.00, label: '1.0倍', pct: 0, major: true, tag: '維持' },
    { val: 1.10, label: '1.1', pct: 10, major: false, tag: undefined },
    { val: 1.20, label: '1.2倍', pct: 20, major: true, tag: undefined },
    { val: 1.30, label: '1.3', pct: 30, major: false, tag: undefined },
    { val: 1.40, label: '1.4倍', pct: 40, major: true, tag: !isC ? 'B標準' : undefined },
    { val: 1.50, label: '1.5', pct: 50, major: false, tag: undefined },
    { val: 1.60, label: '1.6倍', pct: 60, major: true, tag: isC ? 'C標準' : undefined },
    { val: 1.70, label: '1.7', pct: 70, major: false, tag: undefined },
    { val: 1.80, label: '1.8倍', pct: 80, major: true, tag: undefined },
    { val: 1.90, label: '1.9', pct: 90, major: false, tag: undefined },
    { val: 2.00, label: '2.0倍', pct: 100, major: true, tag: 'ゆったり' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className={`p-4 ${themeColors.headerBg} flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isC ? 'bg-amber-500/40 text-amber-950' : 'bg-white/20 text-amber-300'}`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {themeColors.tag} 自動作成・変換設定
              </h3>
              <p className={`text-[11px] ${isC ? 'text-amber-900 font-medium' : 'text-emerald-100 opacity-90'}`}>
                スライダー操作に応じて、距離・所要時間・各項目の本数・サイクルを自動調整します
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isC ? 'hover:bg-amber-500/30 text-amber-950' : 'hover:bg-white/20 text-white/80 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Aチーム未入力時の注記 */}
          {isAEmpty && (
            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>💡 Aチームが未作成のためモデル値でシミュレーション中:</strong>
                標準的な競泳練習メニュー（3,200m / 約60分）をもとに、スライダー操作に伴う本数・サイクルの自動計算をプレビューしています。
              </div>
            </div>
          )}

          {/* Live Preview Comparison Summary */}
          <div className={`${themeColors.boxBg} border rounded-xl p-3.5 space-y-2.5`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-xs">
                <Sliders className="w-4 h-4" />
                <span>自動計算による変換予測</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] ${themeColors.badgeBg} px-2 py-0.5 rounded font-mono border`}>
                  距離: {distDiffPct > 0 ? `+${distDiffPct}%` : `${distDiffPct}%`} ({distDiffM > 0 ? `+${distDiffM.toLocaleString()}m` : `${distDiffM.toLocaleString()}m`})
                </span>
                <span className={`text-[10px] ${themeColors.badgeBg} px-2 py-0.5 rounded font-mono border`}>
                  時間: {diffMin > 0 ? `+${diffMin}分` : diffMin < 0 ? `${diffMin}分` : '±0分'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Aチーム (基準メニュー)</div>
                <div className="text-base font-extrabold text-blue-900 font-mono tracking-tight">
                  {aDist.toLocaleString()} <span className="text-xs font-normal">m</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  所要時間: {formatTimeDetailed(aTotalSec)} ({effectiveBaseMenu.items.length}項目)
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-300 shadow-xs ring-2 ring-emerald-500/20">
                <div className={`text-[10px] font-bold ${themeColors.accentText}`}>
                  {targetTeam}チーム (変換後)
                </div>
                <div className={`text-base font-extrabold font-mono tracking-tight ${themeColors.accentText}`}>
                  {previewDist.toLocaleString()} <span className="text-xs font-normal">m</span>
                </div>
                <div className="text-[10px] text-slate-600 font-mono font-medium mt-0.5">
                  所要時間: <strong className="text-slate-900">{formatTimeDetailed(previewTotalSec)}</strong> ({previewMenu.items.length}項目)
                </div>
              </div>
            </div>
          </div>

          {/* Option 1: Reps Multiplier Slider */}
          <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-700" />
                <span>① 本数（リピート数）の調整倍率</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">倍率:</span>
                <span className={`font-extrabold font-mono text-xs px-2.5 py-0.5 rounded border shadow-2xs ${themeColors.badgeBg}`}>
                  {Math.round(repsMultiplier * 100)}% ({Number(repsMultiplier.toFixed(2))}倍)
                </span>
              </div>
            </div>

            {/* Slider track with visual ticks */}
            <div className="pt-2 pb-2">
              <input
                type="range"
                min="0.30"
                max="1.00"
                step="0.05"
                value={repsMultiplier}
                onChange={(e) => setRepsMultiplier(Math.round(parseFloat(e.target.value) * 100) / 100)}
                className={`w-full ${themeColors.sliderAccent} cursor-pointer h-2.5 bg-slate-200 rounded-lg`}
              />

              {/* 5%刻みの見やすい目盛りピン */}
              <div className="relative w-full h-3 mt-1 pointer-events-none select-none">
                {REPS_RULER_PINS.map((t) => {
                  const isSelected = Math.abs(repsMultiplier - t.val) < 0.02;
                  return (
                    <div
                      key={t.val}
                      style={{ left: `${t.pct}%` }}
                      className="absolute -translate-x-1/2 flex flex-col items-center"
                    >
                      <div
                        className={`transition-all ${
                          isSelected
                            ? `${isC ? 'bg-amber-600 ring-2 ring-amber-300' : 'bg-emerald-600 ring-2 ring-emerald-300'} h-3 w-1 rounded-full`
                            : t.major
                            ? 'bg-slate-400 h-2.5 w-0.5'
                            : 'bg-slate-300 h-1.5 w-0.5'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* クリックしてジャンプできる目盛りラベル */}
              <div className="relative w-full h-6 text-[10px] font-mono select-none mt-0.5">
                {REPS_LABELS.map((t) => {
                  const isSelected = Math.abs(repsMultiplier - t.val) < 0.02;
                  return (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setRepsMultiplier(t.val)}
                      style={{ left: `${t.pct}%` }}
                      className={`absolute -translate-x-1/2 cursor-pointer transition-all py-0.5 px-1 rounded flex flex-col items-center leading-none ${
                        isSelected
                          ? `font-extrabold ${isC ? 'text-amber-950 bg-amber-100 ring-1 ring-amber-400' : 'text-emerald-950 bg-emerald-100 ring-1 ring-emerald-400'}`
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
                      }`}
                      title={`${t.label} に設定`}
                    >
                      <span>{t.label}</span>
                      {t.tag && (
                        <span
                          className={`text-[8px] font-sans px-1 rounded mt-0.5 whitespace-nowrap leading-tight ${
                            isSelected
                              ? (isC ? 'bg-amber-500 text-white font-bold' : 'bg-emerald-600 text-white font-bold')
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {t.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* このスライダーによる計算結果の直接表示 */}
            <div className="flex items-center justify-between pt-1.5 text-[11px] font-mono border-t border-slate-200/80 mt-1">
              <span className="text-slate-600 font-sans font-medium flex items-center gap-1">
                計算総距離:
              </span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className={`${themeColors.accentText} text-xs font-extrabold`}>
                  {previewDist.toLocaleString()}m
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (基準A: {aDist.toLocaleString()}m → {distDiffM > 0 ? `+${distDiffM.toLocaleString()}m` : `${distDiffM.toLocaleString()}m`} / {distDiffPct > 0 ? `+${distDiffPct}%` : `${distDiffPct}%`})
                </span>
              </div>
            </div>
          </div>

          {/* Option 2: Cycle Extension Multiplier Slider */}
          <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>② サイクル（インターバル）の延長倍率</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">倍率:</span>
                <span className={`font-extrabold font-mono text-xs px-2.5 py-0.5 rounded border shadow-2xs ${themeColors.badgeBg}`}>
                  {Math.round(cycleMultiplier * 100)}% ({Number(cycleMultiplier.toFixed(2))}倍)
                </span>
              </div>
            </div>

            {/* Slider track with visual ticks */}
            <div className="pt-2 pb-2">
              <input
                type="range"
                min="1.00"
                max="2.00"
                step="0.05"
                value={cycleMultiplier}
                onChange={(e) => setCycleMultiplier(Math.round(parseFloat(e.target.value) * 100) / 100)}
                className={`w-full ${themeColors.sliderAccent} cursor-pointer h-2.5 bg-slate-200 rounded-lg`}
              />

              {/* 5%刻みの見やすい目盛りピン */}
              <div className="relative w-full h-3 mt-1 pointer-events-none select-none">
                {CYCLE_RULER_PINS.map((t) => {
                  const isSelected = Math.abs(cycleMultiplier - t.val) < 0.02;
                  return (
                    <div
                      key={t.val}
                      style={{ left: `${t.pct}%` }}
                      className="absolute -translate-x-1/2 flex flex-col items-center"
                    >
                      <div
                        className={`transition-all ${
                          isSelected
                            ? `${isC ? 'bg-amber-600 ring-2 ring-amber-300' : 'bg-emerald-600 ring-2 ring-emerald-300'} h-3 w-1 rounded-full`
                            : t.major
                            ? 'bg-slate-400 h-2.5 w-0.5'
                            : 'bg-slate-300 h-1.5 w-0.5'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* クリックしてジャンプできる目盛りラベル */}
              <div className="relative w-full h-6 text-[10px] font-mono select-none mt-0.5">
                {CYCLE_LABELS.map((t) => {
                  const isSelected = Math.abs(cycleMultiplier - t.val) < 0.02;
                  return (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setCycleMultiplier(t.val)}
                      style={{ left: `${t.pct}%` }}
                      className={`absolute -translate-x-1/2 cursor-pointer transition-all py-0.5 px-1 rounded flex flex-col items-center leading-none ${
                        isSelected
                          ? `font-extrabold ${isC ? 'text-amber-950 bg-amber-100 ring-1 ring-amber-400' : 'text-emerald-950 bg-emerald-100 ring-1 ring-emerald-400'}`
                          : t.major
                          ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title={`${t.label} に設定`}
                    >
                      <span>{t.label}</span>
                      {t.tag && (
                        <span
                          className={`text-[8px] font-sans px-1 rounded mt-0.5 whitespace-nowrap leading-tight ${
                            isSelected
                              ? (isC ? 'bg-amber-500 text-white font-bold' : 'bg-emerald-600 text-white font-bold')
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {t.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* このスライダーによる計算結果の直接表示 */}
            <div className="flex items-center justify-between pt-1.5 text-[11px] font-mono border-t border-slate-200/80 mt-1">
              <span className="text-slate-600 font-sans font-medium flex items-center gap-1">
                計算所要時間:
              </span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className={`${themeColors.accentText} text-xs font-extrabold`}>
                  {formatTimeDetailed(previewTotalSec)}
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (基準A: {formatTimeDetailed(aTotalSec)} → {diffMin > 0 ? `+${diffMin}分` : diffMin < 0 ? `${diffMin}分` : '±0分'})
                </span>
              </div>
            </div>
          </div>

          {/* 変換後メニュー各項目のリアルタイムプレビューテーブル */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <button
              type="button"
              onClick={() => setShowItemPreviewList(!showItemPreviewList)}
              className="w-full px-3.5 py-2.5 bg-slate-100/90 hover:bg-slate-150 flex items-center justify-between font-bold text-slate-800 text-xs transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span>変換後の各練習項目プレビュー {showItemPreviewList ? '（クリックで折りたたむ）' : '（クリックで展開して確認）'}</span>
                <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-mono">
                  合計 {previewDist.toLocaleString()}m / {formatTimeDetailed(previewTotalSec)} (全{previewMenu.items.length}項目)
                </span>
              </div>
              {showItemPreviewList ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showItemPreviewList && (
              <div className="p-2.5 max-h-48 overflow-y-auto divide-y divide-slate-100 text-[11px]">
                {previewMenu.items.length === 0 ? (
                  <div className="text-center py-4 text-slate-400">表示できる練習項目がありません</div>
                ) : (
                  previewMenu.items.map((item, idx) => {
                    const originalItem = effectiveBaseMenu.items[idx];
                    const dist = calcItemTotalDistance(item);
                    return (
                      <div key={item.id || idx} className="py-1.5 px-2 flex items-center justify-between gap-2 hover:bg-slate-50 rounded">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-4 font-mono text-[10px] text-slate-400 shrink-0">#{idx + 1}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded border border-slate-200 shrink-0">
                            {item.category}
                          </span>
                          <span className="font-semibold text-slate-900 truncate">
                            {item.stroke} - {item.description || item.subName}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-mono text-right">
                          <div className="text-[10px]">
                            {originalItem && (
                              <span className="text-slate-400 line-through mr-1.5">
                                {originalItem.distance}m×{originalItem.reps}
                              </span>
                            )}
                            <strong className="text-slate-900 font-bold">
                              {item.distance}m × {item.reps}本
                            </strong>
                          </div>

                          <div className="text-[10px]">
                            {originalItem && (
                              <span className="text-slate-400 line-through mr-1">
                                {formatCycleTime(originalItem.cycleSec)}
                              </span>
                            )}
                            <strong className="text-emerald-800 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                              {formatCycleTime(item.cycleSec)}
                            </strong>
                          </div>

                          <span className="font-bold text-slate-700 w-12 text-right">
                            {dist}m
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-2 p-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shortenLongDistance}
                onChange={(e) => setShortenLongDistance(e.target.checked)}
                className="w-4 h-4 rounded text-blue-900 cursor-pointer"
              />
              <span className="font-semibold text-slate-800 text-xs">
                50m超の長距離（100m, 200mなど）を50mまたは25mに自動短縮する
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={keepWarmupDown}
                onChange={(e) => setKeepWarmupDown(e.target.checked)}
                className="w-4 h-4 rounded text-blue-900 cursor-pointer"
              />
              <span className="font-semibold text-slate-800 text-xs">
                W-Up（アップ）およびDown（ダウン）は距離・本数を維持する
              </span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-100 cursor-pointer text-xs"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            className={`px-5 py-2 ${themeColors.accentButton} text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer text-xs`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{targetTeam}チームメニューを適用</span>
          </button>
        </div>
      </div>
    </div>
  );
};
