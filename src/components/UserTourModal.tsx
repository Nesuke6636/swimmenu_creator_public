import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  MousePointerClick,
  Maximize2
} from 'lucide-react';

export interface UserTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: 'editor' | 'preview';
  onSwitchTab?: (tab: 'editor' | 'preview') => void;
  onOpenBTeamModal?: () => void;
  onOpenSavedMenus?: () => void;
}

interface TourStep {
  targetId: string;
  requiredTab?: 'editor' | 'preview';
  title: string;
  badge: string;
  badgeColor: string;
  subtitle: string;
  description: string;
  points: string[];
  tips: string;
  preferredPlacement?: 'bottom' | 'top' | 'right' | 'left';
  actionLabel?: string;
  actionType?: 'bteam' | 'preview' | 'savedmenus';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-header-form',
    requiredTab: 'editor',
    title: '① 練習基本情報',
    badge: 'STEP 1 / 7',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    subtitle: '日付・プール長・対象を設定',
    description:
      '練習の日付やプール長（25m/50m）、担当コーチ名、対象チームなどを設定します。',
    points: [
      '「基本情報をデフォルト保存」で次回以降も自動入力可能',
      '目標や注意事項をメモ欄に記載可能'
    ],
    tips: 'よく使うコーチ名や時間帯をデフォルト保存しておくと便利です。',
    preferredPlacement: 'bottom'
  },
  {
    targetId: 'tour-menu-table',
    requiredTab: 'editor',
    title: '② メニュー編集',
    badge: 'STEP 2 / 7',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    subtitle: '先頭・末尾へ直接カテゴリ追加',
    description:
      '「先頭に追加」「末尾に追加」のカテゴリボタン（W-Up、Kick、Pull等）を押すだけで項目を追加できます。',
    points: [
      '距離・本数・サイクル・運動強度（A1〜SP3）を自由に編集',
      '総距離や合計所要時間をリアルタイムに自動計算'
    ],
    tips: '各項目の上下ボタンで並び順も簡単に変更できます。',
    preferredPlacement: 'top'
  },
  {
    targetId: 'tour-team-tabs',
    title: '③ チーム切り替え',
    badge: 'STEP 3 / 7',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    subtitle: 'A(青)・B(緑)・C(黄)で泳力別に管理',
    description:
      'チームタブでAチーム（メイン・青）、Bチーム（低強度・緑）、Cチーム（超低強度・黄）を瞬時に切り替えられます。',
    points: [
      'タブの色に合わせて画面の枠やボタンの色も切り替わります',
      'PDF出力時のカラーも各チームの色（青・緑・黄）に対応'
    ],
    tips: '同じ練習時間で複数の泳力グループを指導する際に便利です。',
    preferredPlacement: 'bottom'
  },
  {
    targetId: 'tour-view-tabs',
    title: '④ 編集・プレビュー切り替え',
    badge: 'STEP 4 / 7',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    subtitle: 'ワンタップで仕上がりを確認',
    description:
      'チームタブの隣にあるボタンで、編集画面とPDFプレビュー画面をすばやく切り替えられます。',
    points: [
      '編集中もワンタップでA4レイアウトを確認可能',
      'プレビュー画面からそのままPDF保存を実行'
    ],
    tips: '全チーム連続表示（A/B/C）への切り替えも可能です。',
    preferredPlacement: 'bottom',
    actionLabel: 'プレビュー画面を表示',
    actionType: 'preview'
  },
  {
    targetId: 'tour-bc-team-btns',
    requiredTab: 'editor',
    title: '⑤ B・Cチーム作成',
    badge: 'STEP 5 / 7',
    badgeColor: 'bg-amber-100 text-amber-950 border-amber-300',
    subtitle: 'Aチームをもとに泳力別メニューを一括作成',
    description:
      'Aチームのメニューから、本数やサイクルを調整したBチーム・Cチームをワンクリックで作成します。',
    points: [
      '本数倍率やサイクル延長率をスライダーで直感的に調整',
      '作成後も各チームごとに内容を自由に編集可能'
    ],
    tips: '泳力の異なる選手を同時に指導する際に役立ちます。',
    preferredPlacement: 'bottom',
    actionLabel: 'Bチーム設定を開いてみる',
    actionType: 'bteam'
  },
  {
    targetId: 'tour-saved-menus-btn',
    title: '⑥ 保存メニュー',
    badge: 'STEP 6 / 7',
    badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    subtitle: 'ブラウザ内に練習メニューを保存',
    description:
      '作成した練習メニューを名前をつけてブラウザ内に保存できます。過去のメニューをいつでも読み込み可能です。',
    points: [
      'メニュー名・日付・総距離・所要時間を一覧で管理',
      'JSONエクスポート/インポートで端末間の共有も可能'
    ],
    tips: '定番メニューや合宿メニューの保存に最適です。',
    preferredPlacement: 'bottom',
    actionLabel: '保存メニューを開いてみる',
    actionType: 'savedmenus'
  },
  {
    targetId: 'tour-pdf-btn',
    title: '⑦ PDF出力',
    badge: 'STEP 7 / 7',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    subtitle: 'プールサイドで見やすいA4レイアウト',
    description:
      '作成したメニューをA4サイズに収まるレイアウトでPDFファイルとして出力・ダウンロードできます。',
    points: [
      '「PDF (A4)」ボタンで即座にPDFをダウンロード',
      'チームごとの基調色（青・緑・黄）で分かりやすく出力'
    ],
    tips: 'プールサイドでも見やすい配色とフォントサイズです。',
    preferredPlacement: 'bottom'
  }
];

export const UserTourModal: React.FC<UserTourModalProps> = ({
  isOpen,
  onClose,
  activeTab = 'editor',
  onSwitchTab,
  onOpenBTeamModal,
  onOpenSavedMenus
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'spotlight' | 'overview'>('spotlight');
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isElementVisible, setIsElementVisible] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setViewMode('spotlight');
    }
  }, [isOpen]);

  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    if (!isOpen) return;
    if (step.requiredTab && onSwitchTab && activeTab !== step.requiredTab) {
      onSwitchTab(step.requiredTab);
    }
  }, [currentStep, isOpen, step.requiredTab, onSwitchTab, activeTab]);

  const updateTargetPosition = useCallback(() => {
    if (!isOpen || viewMode !== 'spotlight') return;

    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        setIsElementVisible(true);
      }, 250);
    } else {
      setTargetRect(null);
      setIsElementVisible(false);
    }
  }, [isOpen, viewMode, step.targetId]);

  useEffect(() => {
    updateTargetPosition();
    const handleResize = () => updateTargetPosition();
    const handleScroll = () => {
      const el = document.getElementById(step.targetId);
      if (el) setTargetRect(el.getBoundingClientRect());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [updateTargetPosition, currentStep, isOpen, viewMode, step.targetId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && currentStep < TOUR_STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, onClose]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTryAction = () => {
    if (!step.actionType) return;
    if (step.actionType === 'bteam' && onOpenBTeamModal) {
      onClose();
      onOpenBTeamModal();
    } else if (step.actionType === 'savedmenus' && onOpenSavedMenus) {
      onClose();
      onOpenSavedMenus();
    } else if (step.actionType === 'preview' && onSwitchTab) {
      onSwitchTab('preview');
    }
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || !isElementVisible) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '480px',
        width: '92vw'
      };
    }

    const margin = 14;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const left = Math.max(16, Math.min(targetCenterX - 220, viewportWidth - 460));

    const spaceBelow = viewportHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    let top: number;
    if (spaceBelow >= 340 || spaceBelow >= spaceAbove) {
      top = Math.min(viewportHeight - 380, targetRect.bottom + margin);
    } else {
      top = Math.max(16, targetRect.top - 360 - margin);
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: '440px',
      width: '92vw'
    };
  };

  return (
    <>
      {/* 1. Spotlight Overlay Mode */}
      {viewMode === 'spotlight' && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          {targetRect && isElementVisible ? (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent cursor-pointer"
                onClick={onClose}
                aria-label="ガイドを閉じる"
              />

              <div
                className="fixed pointer-events-none transition-all duration-300 ease-out z-40 rounded-xl"
                style={{
                  top: `${Math.max(4, targetRect.top - 6)}px`,
                  left: `${Math.max(4, targetRect.left - 6)}px`,
                  width: `${targetRect.width + 12}px`,
                  height: `${targetRect.height + 12}px`,
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.72), 0 0 20px rgba(56, 189, 248, 0.45)'
                }}
              >
                <div className="w-full h-full rounded-xl border-2 border-sky-400 ring-2 ring-sky-400/30" />
              </div>
            </>
          ) : (
            <div
              className="fixed inset-0 z-40 bg-slate-950/70 transition-opacity duration-300 cursor-pointer"
              onClick={onClose}
            />
          )}

          {/* Tooltip Card */}
          <div
            style={getTooltipStyle()}
            onClick={(e) => e.stopPropagation()}
            className="z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[88vh]"
          >
            {/* Header (Bright Light Blue) */}
            <div
              className="p-3.5 text-sky-950 flex items-center justify-between border-b border-sky-500/50"
              style={{ backgroundColor: '#38bdf8' }}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white text-sky-600 rounded-lg shadow-xs">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-900 text-white font-mono">
                      {step.badge}
                    </span>
                    <h3 className="font-extrabold text-xs sm:text-sm text-sky-950 leading-tight">
                      {step.title}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode('overview')}
                  className="px-2 py-1 text-[11px] bg-white/80 hover:bg-white rounded text-sky-950 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="全体一覧ビューに切り替え"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span className="hidden sm:inline">一覧表示</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 hover:bg-sky-300/50 rounded-lg text-sky-900 hover:text-sky-950 transition-colors cursor-pointer"
                  title="ツアーを閉じる (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Dots */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex items-center justify-between">
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentStep(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentStep
                        ? 'w-5 bg-sky-500'
                        : idx < currentStep
                        ? 'w-2 bg-sky-300'
                        : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                    title={`ステップ ${idx + 1}`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto space-y-3 text-xs text-slate-700">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5">
                <p className="text-xs text-sky-950 leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  操作のポイント:
                </h4>
                <ul className="space-y-1 text-[11px] text-slate-600 pl-1.5">
                  {step.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-sky-600 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50/80 border border-amber-200/80 text-amber-950 p-2.5 rounded-xl text-[11px] space-y-0.5">
                <span className="font-bold text-amber-900 block flex items-center gap-1">
                  💡 活用ポイント:
                </span>
                <p className="text-amber-900/90 leading-snug">{step.tips}</p>
              </div>

              {step.actionLabel && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleTryAction}
                    className="w-full py-1.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-lg border border-amber-300 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MousePointerClick className="w-3.5 h-3.5 text-amber-700" />
                    <span>{step.actionLabel}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer controls */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  currentStep === 0
                    ? 'opacity-30 cursor-not-allowed text-slate-400 bg-slate-100'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>前へ</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors cursor-pointer"
                >
                  スキップ
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{currentStep === TOUR_STEPS.length - 1 ? '完了' : '次へ'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Overview Mode */}
      {viewMode === 'overview' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div
              className="p-4 text-sky-950 flex items-center justify-between border-b border-sky-500/50"
              style={{ backgroundColor: '#38bdf8' }}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white text-sky-600 rounded-xl shadow-xs">
                  <HelpCircle className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">使い方ガイド（一覧）</h3>
                  <p className="text-[11px] text-sky-900 font-medium">各機能のポイントと操作の流れ</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('spotlight')}
                  className="px-2.5 py-1 bg-white/85 hover:bg-white text-sky-950 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <MousePointerClick className="w-3.5 h-3.5 text-sky-600" />
                  <span>スポットライトに戻る</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-sky-300/50 rounded-lg text-sky-900 hover:text-sky-950 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-3.5 text-xs text-slate-700">
              {TOUR_STEPS.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentStep(idx);
                    setViewMode('spotlight');
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all cursor-pointer group bg-slate-50/50"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${s.badgeColor}`}>
                        {s.badge}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-sky-700">
                        {s.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-sky-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      表示する <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">{s.description}</p>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700 mr-1">💡 コツ:</span> {s.tips}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                ガイドを閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
