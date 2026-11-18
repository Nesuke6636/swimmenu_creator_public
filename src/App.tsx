import React, { useState, useEffect } from 'react';
import { SwimMenu, SwimMenuHeader, MenuItem, SavedMenuRecord } from './types';
import { SAMPLE_TEMPLATES } from './data/sampleMenus';
import { HeaderForm } from './components/HeaderForm';
import { MenuItemTable } from './components/MenuItemTable';
import { StatsSummary } from './components/StatsSummary';
import { PrintablePdfView } from './components/PrintablePdfView';
import { SavedMenusModal } from './components/SavedMenusModal';
import { EnZoneGuideModal } from './components/EnZoneGuideModal';
import { generateAndDownloadPdf } from './utils/pdfExport';
import {
  convertMenuToBTeam,
  convertMenuToCTeam,
  TeamConversionOptions
} from './utils/bTeamConverter';
import { calcItemTotalDistance, calcItemTotalDurationSec, formatTotalTimeMin, migrateMenuIntensities, normalizeIntensityZone } from './utils/swimCalculators';
import { TeamConfigModal } from './components/TeamConfigModal';
import { UserTourModal } from './components/UserTourModal';
import {
  Folder,
  Download,
  RotateCcw,
  FileText,
  Eye,
  Edit3,
  HelpCircle,
  Loader2,
  Check,
  Share2,
  Upload,
  Trash2,
  Users
} from 'lucide-react';

const LOCAL_STORAGE_KEY_A = 'swim_menu_pro_active_menu_a';
const LOCAL_STORAGE_KEY_B = 'swim_menu_pro_active_menu_b';
const LOCAL_STORAGE_KEY_C = 'swim_menu_pro_active_menu_c';

const createEmptyMenu = (team: 'A' | 'B' | 'C'): SwimMenu => ({
  id: `menu-${team.toLowerCase()}-${Date.now()}`,
  header: {
    title: '',
    date: new Date().toISOString().slice(0, 10),
    timeSlot: '',
    targetGroup: `${team}チーム`,
    coachName: '',
    poolLength: '25m',
    periodizationPhase: '',
    laneInfo: '',
    theme: '',
    memo: ''
  },
  items: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export default function App() {
  // Team A Menu (starts completely empty on first visit)
  const [menuA, setMenuA] = useState<SwimMenu>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_A);
      if (saved) return migrateMenuIntensities(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load menuA from localStorage', e);
    }
    return createEmptyMenu('A');
  });

  // Team B Menu (Lower Intensity)
  const [menuB, setMenuB] = useState<SwimMenu | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_B);
      if (saved) return migrateMenuIntensities(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load menuB from localStorage', e);
    }
    return null;
  });

  // Team C Menu (Even Lighter Intensity / Beginner - Yellow theme)
  const [menuC, setMenuC] = useState<SwimMenu | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_C);
      if (saved) return migrateMenuIntensities(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load menuC from localStorage', e);
    }
    return null;
  });

  const [activeTeam, setActiveTeam] = useState<'A' | 'B' | 'C'>('A');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [printTarget, setPrintTarget] = useState<'active' | 'all'>('active');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Modals
  const [showSavedMenusModal, setShowSavedMenusModal] = useState(false);
  const [showEnGuideModal, setShowEnGuideModal] = useState(false);
  const [showResetTabConfirmModal, setShowResetTabConfirmModal] = useState(false);
  const [showResetAllConfirmModal, setShowResetAllConfirmModal] = useState(false);
  const [showResetSampleConfirmModal, setShowResetSampleConfirmModal] = useState(false);
  const [teamConfigModalTarget, setTeamConfigModalTarget] = useState<'B' | 'C' | null>(null);
  const [showTourModal, setShowTourModal] = useState(false);

  // Active working menu
  const activeMenu =
    activeTeam === 'A' ? menuA :
    activeTeam === 'B' ? (menuB || menuA) :
    (menuC || menuA);

  // Save menus to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_A, JSON.stringify(menuA));
      if (menuB) {
        localStorage.setItem(LOCAL_STORAGE_KEY_B, JSON.stringify(menuB));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_B);
      }
      if (menuC) {
        localStorage.setItem(LOCAL_STORAGE_KEY_C, JSON.stringify(menuC));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_C);
      }
    } catch (e) {
      console.error('LocalStorage save error', e);
    }
  }, [menuA, menuB, menuC]);

  const handleUpdateHeader = (header: SwimMenuHeader) => {
    if (activeTeam === 'A') {
      setMenuA(prev => ({ ...prev, header, updatedAt: new Date().toISOString() }));
    } else if (activeTeam === 'B') {
      setMenuB(prev => (prev ? { ...prev, header, updatedAt: new Date().toISOString() } : { ...menuA, header }));
    } else {
      setMenuC(prev => (prev ? { ...prev, header, updatedAt: new Date().toISOString() } : { ...menuA, header }));
    }
  };

  const handleUpdateItems = (items: MenuItem[]) => {
    if (activeTeam === 'A') {
      setMenuA(prev => ({ ...prev, items, updatedAt: new Date().toISOString() }));
    } else if (activeTeam === 'B') {
      setMenuB(prev => (prev ? { ...prev, items, updatedAt: new Date().toISOString() } : { ...menuA, items }));
    } else {
      setMenuC(prev => (prev ? { ...prev, items, updatedAt: new Date().toISOString() } : { ...menuA, items }));
    }
  };

  const handleLoadSavedMenu = (saved: SavedMenuRecord) => {
    setMenuA(migrateMenuIntensities(saved.menuA));
    setMenuB(saved.menuB ? migrateMenuIntensities(saved.menuB) : null);
    setMenuC(saved.menuC ? migrateMenuIntensities(saved.menuC) : null);
    setActiveTeam('A');
  };

  const handleGenerateBTeamMenu = () => {
    if (menuA.items.length === 0) {
      triggerToast('⚠️ Aチームの練習メニュー項目を作成してから実行してください。');
      return;
    }
    setTeamConfigModalTarget('B');
  };

  const handleGenerateCTeamMenu = () => {
    if (menuA.items.length === 0) {
      triggerToast('⚠️ Aチームの練習メニュー項目を作成してから実行してください。');
      return;
    }
    setTeamConfigModalTarget('C');
  };

  const handleApplyTeamConfigMenu = (convertedMenu: SwimMenu, options: TeamConversionOptions) => {
    if (options.teamLevel === 'B') {
      setMenuB(convertedMenu);
      setActiveTeam('B');
      triggerToast('Bチームメニューを作成・適用しました！');
    } else {
      setMenuC(convertedMenu);
      setActiveTeam('C');
      triggerToast('Cチームメニューを作成・適用しました！');
    }
  };

  const handleResetCurrentTab = () => {
    setShowResetTabConfirmModal(true);
  };

  const confirmExecuteResetTab = () => {
    const teamName = `${activeTeam}チーム`;
    const emptyMenu = createEmptyMenu(activeTeam);

    if (activeTeam === 'A') {
      setMenuA(emptyMenu);
    } else if (activeTeam === 'B') {
      setMenuB(emptyMenu);
    } else {
      setMenuC(emptyMenu);
    }
    setShowResetTabConfirmModal(false);
    triggerToast(`🧹 ${teamName}の入力項目をリセットしました。`);
  };

  const handleResetAllTeams = () => {
    setShowResetAllConfirmModal(true);
  };

  const confirmExecuteResetAll = () => {
    const emptyA = createEmptyMenu('A');
    setMenuA(emptyA);
    setMenuB(null);
    setMenuC(null);
    setActiveTeam('A');
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_A, JSON.stringify(emptyA));
      localStorage.removeItem(LOCAL_STORAGE_KEY_B);
      localStorage.removeItem(LOCAL_STORAGE_KEY_C);
    } catch (e) {
      console.error(e);
    }
    setShowResetAllConfirmModal(false);
    triggerToast('🧹 全チームの入力項目をすべてリセットしました。');
  };

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    const safeTitle = (activeMenu.header.title || '競泳練習メニュー').replace(/[\/\\?%*:|"<>]/g, '_');
    const isAll = printTarget === 'all';
    const teamLabel = isAll ? '全チーム合同' : `${activeTeam}チーム`;
    const filename = `${safeTitle}_${teamLabel}_${activeMenu.header.date || 'menu'}.pdf`;

    setTimeout(async () => {
      let targets: string[] = [];
      if (isAll) {
        targets.push('swim-pdf-export-a');
        if (menuB) targets.push('swim-pdf-export-b');
        if (menuC) targets.push('swim-pdf-export-c');
      } else {
        targets = ['swim-pdf-export-active'];
      }

      const success = await generateAndDownloadPdf(targets, filename);
      setIsExportingPdf(false);
      if (success) {
        triggerToast('📄 PDFのダウンロードが完了しました！');
      } else {
        triggerToast('⚠️ PDF作成中にエラーが発生しました。再度お試しください。');
      }
    }, 100);
  };

  const handleResetToSample = () => {
    setShowResetSampleConfirmModal(true);
  };

  const confirmExecuteResetSample = () => {
    const base = SAMPLE_TEMPLATES[0].menu;
    setMenuA(base);
    setMenuB(convertMenuToBTeam(base));
    setMenuC(convertMenuToCTeam(base));
    setShowResetSampleConfirmModal(false);
    triggerToast('🔄 初期サンプルデータ（A・B・C全チーム）を復元しました。');
  };

  const handleExportJson = () => {
    const exportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      menuA,
      menuB,
      menuC
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swim_menu_${activeMenu.header.date || 'data'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('💾 メニューデータをJSON形式でエクスポートしました');
  };

  const sanitizeImportedMenu = (raw: any, team: 'A' | 'B' | 'C'): SwimMenu | null => {
    if (!raw || typeof raw !== 'object' || !raw.header || !Array.isArray(raw.items)) return null;
    const validCategories = new Set(['W-Up', 'Kick', 'Pull', 'Drill', 'Main', 'Swim', 'Down']);
    const validStrokes = new Set(['Fr', 'Ba', 'Br', 'Fly', 'IM', 'Choice', 'S1', 'Other']);

    const sanitizedHeader: SwimMenuHeader = {
      title: String(raw.header.title || '').slice(0, 200),
      date: String(raw.header.date || new Date().toISOString().slice(0, 10)).slice(0, 20),
      timeSlot: String(raw.header.timeSlot || '').slice(0, 100),
      poolLength: raw.header.poolLength === '50m' ? '50m' : '25m',
      targetGroup: String(raw.header.targetGroup || `${team}チーム`).slice(0, 120),
      periodizationPhase: String(raw.header.periodizationPhase || '').slice(0, 120),
      coachName: String(raw.header.coachName || '').slice(0, 100),
      theme: String(raw.header.theme || '').slice(0, 300),
      laneInfo: String(raw.header.laneInfo || '').slice(0, 120),
      memo: String(raw.header.memo || '').slice(0, 1000),
    };

    const sanitizedItems: MenuItem[] = raw.items.slice(0, 200).map((it: any, idx: number) => ({
      id: typeof it?.id === 'string' && it.id ? it.id.slice(0, 80) : `imported-${team}-${Date.now()}-${idx}`,
      category: validCategories.has(it?.category) ? it.category : 'Swim',
      subName: typeof it?.subName === 'string' ? it.subName.slice(0, 100) : undefined,
      distance: Math.min(Math.max(parseInt(it?.distance, 10) || 50, 25), 10000),
      reps: Math.min(Math.max(parseInt(it?.reps, 10) || 1, 1), 200),
      sets: Math.min(Math.max(parseInt(it?.sets, 10) || 1, 1), 50),
      stroke: validStrokes.has(it?.stroke) ? it.stroke : 'Fr',
      description: String(it?.description || '').slice(0, 500),
      intensity: normalizeIntensityZone(it?.intensity),
      cycleSec: Math.min(Math.max(parseInt(it?.cycleSec, 10) || 0, 0), 7200),
      restBetweenSetsSec: it?.restBetweenSetsSec ? Math.min(Math.max(parseInt(it.restBetweenSetsSec, 10) || 0, 0), 3600) : undefined,
      equipment: Array.isArray(it?.equipment) ? it.equipment.slice(0, 10).map((eq: any) => String(eq).slice(0, 30)) : [],
      note: typeof it?.note === 'string' ? it.note.slice(0, 300) : undefined,
    }));

    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id.slice(0, 80) : `menu-${team.toLowerCase()}-${Date.now()}`,
      header: sanitizedHeader,
      items: sanitizedItems,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt.slice(0, 40) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      triggerToast('⚠️ ファイルサイズが大きすぎます（2MB以下にしてください）');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && typeof json === 'object' && json.menuA) {
          const parsedA = sanitizeImportedMenu(json.menuA, 'A');
          if (!parsedA) throw new Error('Invalid menuA');
          setMenuA(parsedA);
          setMenuB(json.menuB ? sanitizeImportedMenu(json.menuB, 'B') : null);
          setMenuC(json.menuC ? sanitizeImportedMenu(json.menuC, 'C') : null);
        } else if (json && typeof json === 'object' && json.items && json.header) {
          const parsedA = sanitizeImportedMenu(json, 'A');
          if (!parsedA) throw new Error('Invalid menu');
          setMenuA(parsedA);
          setMenuB(convertMenuToBTeam(parsedA));
          setMenuC(convertMenuToCTeam(parsedA));
        } else {
          throw new Error('Unsupported JSON structure');
        }
        setActiveTeam('A');
        triggerToast('📥 メニューデータを正常にインポートしました');
      } catch (err) {
        console.error(err);
        triggerToast('❌ JSONファイルの形式が正しくありません');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Top Navigation Bar - Sticky Header with Browser Tab Strip (Bright Light Blue) */}
      <header
        className="text-sky-950 sticky top-0 z-40 shadow-md border-b border-sky-500/60"
        style={{ backgroundColor: '#38bdf8' }}
      >
        {/* Tier 1: Logo & Title + Action Buttons */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="bg-white text-sky-600 p-1.5 rounded-lg flex items-center justify-center shadow-xs">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight leading-none text-sky-950">
                競泳メニュー作成支援システム
              </h1>
              <p className="text-[10.5px] text-sky-900 font-medium mt-0.5">
                練習メニュー作成・A/B/Cチーム編成 & A4 PDF出力
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Saved Menus Button */}
            <button
              id="tour-saved-menus-btn"
              onClick={() => setShowSavedMenusModal(true)}
              className="px-3 py-1.5 bg-white/90 hover:bg-white text-sky-950 text-xs font-bold rounded-lg border border-sky-200/80 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="保存メニューを開く"
            >
              <Folder className="w-3.5 h-3.5 text-sky-600" />
              <span>保存メニュー</span>
            </button>

            {/* Quick Tour Button */}
            <button
              id="tour-guide-btn"
              onClick={() => setShowTourModal(true)}
              className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              title="使い方ガイドを開く"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-950" />
              <span>使い方</span>
            </button>

            {/* PDF Export Button */}
            <button
              id="tour-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3 py-1.5 bg-sky-900 hover:bg-sky-950 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-sky-200" />
              )}
              <span>PDF (A4)</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Browser-style Tab Strip for Team Switching (A / B / C teams) + Edit/Preview Switch */}
        <div
          className="border-t border-sky-300/60 px-3 sm:px-6"
          style={{ backgroundColor: '#0ea5e9' }}
        >
          <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row lg:items-end justify-between gap-1.5 lg:gap-3 pt-1.5 lg:pt-1">
            {/* Left Area: On mobile, stacked in 2 clean rows. On sm+, single row with tabs + switcher side-by-side */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-1.5 sm:gap-2 w-full sm:w-auto">
              {/* Mobile Row 1 / Desktop adjacent: View Tab Switcher (編集 / プレビュー) + Mobile-only Distance & Time */}
              <div className="order-1 sm:order-2 flex items-center justify-between gap-2 w-full sm:w-auto sm:mb-1 sm:ml-2 shrink-0">
                <div
                  id="tour-view-tabs"
                  className="flex flex-1 sm:flex-initial min-w-0 sm:w-auto bg-sky-700/55 p-0.5 rounded-lg border border-sky-300/40 sm:shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 text-xs font-bold rounded-md flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'editor'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-sky-50 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 shrink-0" />
                    <span>編集</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 text-xs font-bold rounded-md flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'preview'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-sky-50 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>プレビュー</span>
                  </button>
                </div>

                {/* Mobile-only Distance & Time */}
                <div className="sm:hidden flex items-center gap-1.5 font-mono font-bold text-[10.5px] text-amber-200 bg-sky-800/55 px-2.5 py-1 rounded-md border border-sky-300/40 whitespace-nowrap shrink-0">
                  <span>
                    {activeMenu.items.reduce((acc, item) => acc + calcItemTotalDistance(item), 0).toLocaleString()}m
                  </span>
                  <span className="text-sky-200/70 font-sans">•</span>
                  <span>
                    約 {formatTotalTimeMin(activeMenu.items.reduce((acc, item) => acc + calcItemTotalDurationSec(item), 0))}
                  </span>
                </div>
              </div>

              {/* Browser Tabs Row (A / B / C teams) */}
              <div
                id="tour-team-tabs"
                className="order-2 sm:order-1 flex items-end gap-1 sm:gap-1.5 w-full sm:w-auto"
              >
                {/* Tab A (青 / Blue) */}
                <button
                  type="button"
                  onClick={() => setActiveTeam('A')}
                  className={`group flex-1 sm:flex-initial min-w-0 px-2 sm:px-4 py-2 sm:py-1.5 text-xs rounded-t-lg transition-all flex items-center justify-center sm:justify-start gap-1 sm:gap-2 cursor-pointer border-t-[3px] select-none whitespace-nowrap ${
                    activeTeam === 'A'
                      ? 'bg-white text-blue-950 font-bold border-blue-600 shadow-sm relative z-10'
                      : 'bg-sky-700/55 hover:bg-blue-900/75 text-sky-50 hover:text-white border-transparent'
                  }`}
                >
                  <span className={`w-4 h-4 shrink-0 rounded text-[10px] font-bold flex items-center justify-center ${
                    activeTeam === 'A' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-800 text-blue-100'
                  }`}>
                    A
                  </span>
                  <span className="shrink-0">Aチーム</span>
                  <span className="text-[10px] opacity-75 hidden sm:inline">(メイン)</span>
                  <span className={`text-[10px] px-1.5 py-0.2 shrink-0 rounded-full font-mono ${
                    activeTeam === 'A' ? 'bg-blue-100 text-blue-900 font-bold' : 'bg-sky-900/60 text-blue-100'
                  }`}>
                    {menuA.items.length}
                  </span>
                </button>

                {/* Tab B (緑 / Green) */}
                <button
                  type="button"
                  onClick={() => {
                    if (!menuB) {
                      handleGenerateBTeamMenu();
                    } else {
                      setActiveTeam('B');
                    }
                  }}
                  className={`group flex-1 sm:flex-initial min-w-0 px-2 sm:px-4 py-2 sm:py-1.5 text-xs rounded-t-lg transition-all flex items-center justify-center sm:justify-start gap-1 sm:gap-2 cursor-pointer border-t-[3px] select-none whitespace-nowrap ${
                    activeTeam === 'B'
                      ? 'bg-white text-emerald-950 font-bold border-emerald-600 shadow-sm relative z-10'
                      : 'bg-sky-700/55 hover:bg-emerald-800/75 text-emerald-50 hover:text-white border-transparent'
                  }`}
                >
                  <span className={`w-4 h-4 shrink-0 rounded text-[10px] font-bold flex items-center justify-center ${
                    activeTeam === 'B' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-800 text-emerald-100'
                  }`}>
                    B
                  </span>
                  <span className="shrink-0">Bチーム</span>
                  <span className="text-[10px] opacity-75 hidden sm:inline">(低強度)</span>
                  {menuB ? (
                    <span className={`text-[10px] px-1.5 py-0.2 shrink-0 rounded-full font-mono ${
                      activeTeam === 'B' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-emerald-950/60 text-emerald-100'
                    }`}>
                      {menuB.items.length}
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 shrink-0 rounded-full bg-emerald-900/45 text-emerald-100 border border-emerald-200/40 font-bold">
                      作成
                    </span>
                  )}
                </button>

                {/* Tab C (黄色 / Yellow) */}
                <button
                  type="button"
                  onClick={() => {
                    if (!menuC) {
                      handleGenerateCTeamMenu();
                    } else {
                      setActiveTeam('C');
                    }
                  }}
                  className={`group flex-1 sm:flex-initial min-w-0 px-2 sm:px-4 py-2 sm:py-1.5 text-xs rounded-t-lg transition-all flex items-center justify-center sm:justify-start gap-1 sm:gap-2 cursor-pointer border-t-[3px] select-none whitespace-nowrap ${
                    activeTeam === 'C'
                      ? 'bg-white text-amber-950 font-extrabold border-amber-400 shadow-sm relative z-10'
                      : 'bg-sky-700/55 hover:bg-amber-700/75 text-amber-100 hover:text-white border-transparent'
                  }`}
                >
                  <span className={`w-4 h-4 shrink-0 rounded text-[10px] font-extrabold flex items-center justify-center ${
                    activeTeam === 'C' ? 'bg-amber-400 text-amber-950 font-extrabold' : 'bg-amber-500/80 text-amber-950 font-bold'
                  }`}>
                    C
                  </span>
                  <span className="shrink-0">Cチーム</span>
                  <span className="text-[10px] opacity-80 hidden sm:inline font-normal">(超低強度)</span>
                  {menuC ? (
                    <span className={`text-[10px] px-1.5 py-0.2 shrink-0 rounded-full font-mono font-bold ${
                      activeTeam === 'C' ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-amber-950/55 text-amber-100'
                    }`}>
                      {menuC.items.length}
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 shrink-0 rounded-full bg-amber-900/40 text-amber-100 border border-amber-200/40 font-bold">
                      作成
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Active Team Mini Indicator (Desktop/Tablet) */}
            <div className="hidden sm:flex items-center justify-between lg:justify-end gap-2 flex-nowrap whitespace-nowrap text-[11px] text-white px-2.5 py-1 lg:px-0 lg:py-0 lg:pb-1.5 lg:pr-1 bg-sky-700/45 lg:bg-transparent rounded-md lg:rounded-none border border-sky-300/40 lg:border-0 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="text-sky-100 shrink-0">編集対象:</span>
                <span className="font-bold text-white truncate">
                  {activeTeam === 'A' ? 'Aチーム (メイン)' : activeTeam === 'B' ? 'Bチーム (低強度)' : 'Cチーム (超低強度)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono font-bold text-amber-200 shrink-0 bg-sky-900/35 px-2 py-0.5 rounded">
                <span>
                  合計 {activeMenu.items.reduce((acc, item) => acc + calcItemTotalDistance(item), 0).toLocaleString()}m
                </span>
                <span className="text-sky-200/70 font-sans">•</span>
                <span>
                  約 {formatTotalTimeMin(activeMenu.items.reduce((acc, item) => acc + calcItemTotalDurationSec(item), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-cyan-500/50 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        {/* Team Sub-toolbar Bar */}
        <div className={`flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border shadow-xs mb-4 ${
          activeTeam === 'A' ? 'border-blue-200' :
          activeTeam === 'B' ? 'border-emerald-200' :
          'border-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeTeam === 'A' ? 'bg-blue-600' :
                  activeTeam === 'B' ? 'bg-emerald-600' :
                  'bg-amber-400'
                }`}
              />
              編集中のチーム:
              <strong className="text-slate-900 text-sm">
                {activeTeam === 'A' ? 'Aチーム (メイン)' :
                 activeTeam === 'B' ? 'Bチーム (低強度版)' :
                 'Cチーム (超低強度版)'}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div id="tour-bc-team-btns" className="flex flex-wrap items-center gap-2">
              {/* Generate B-Team Button */}
              <button
                onClick={handleGenerateBTeamMenu}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="AチームからBチームメニューを作成"
              >
                <Users className="w-3.5 h-3.5 text-emerald-100" />
                <span>Bチーム作成</span>
              </button>

              {/* Generate C-Team Button (Yellow) */}
              <button
                onClick={handleGenerateCTeamMenu}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer border border-amber-300"
                title="AチームからCチームメニューを作成"
              >
                <Users className="w-3.5 h-3.5 text-amber-950" />
                <span>Cチーム作成</span>
              </button>
            </div>

            {/* Reset Current Tab Button with Confirmation */}
            <button
              id="tour-reset-btn"
              onClick={handleResetCurrentTab}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title={`${activeTeam}チームの入力項目をリセット`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>タブをリセット</span>
            </button>
          </div>
        </div>

        {/* Real-time Analytics Summary Header */}
        <StatsSummary
          items={activeMenu.items}
          team={activeTeam}
        />

        {/* View Mode: Editor or Print Preview */}
        {activeTab === 'editor' ? (
          <div>
            {/* Header Form */}
            <HeaderForm
              header={activeMenu.header}
              onChange={handleUpdateHeader}
              team={activeTeam}
            />

            {/* Menu Items Table */}
            <MenuItemTable
              items={activeMenu.items}
              onUpdateItems={handleUpdateItems}
              team={activeTeam}
              onOpenEnGuideModal={() => setShowEnGuideModal(true)}
            />

            {/* JSON Import/Export & Reset Toolbar */}
            <div className={`bg-white p-4 rounded-xl border shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs mb-8 ${
              activeTeam === 'A' ? 'border-blue-200' :
              activeTeam === 'B' ? 'border-emerald-200' :
              'border-amber-300'
            }`}>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportJson}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>JSONエクスポート</span>
                </button>

                <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>JSON読み込み</span>
                  <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleResetToSample}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="標準サンプルメニューに復元"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>初期サンプルデータに復元</span>
                </button>

                <button
                  onClick={handleResetAllTeams}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="すべてのチーム(A/B/C)の練習メニューと基本情報を完全にリセット"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>すべてリセット</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Printable PDF View Mode */
          <div className="bg-slate-200/80 p-4 sm:p-8 rounded-2xl border border-slate-300 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 max-w-4xl mx-auto bg-white p-3 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-600" />
                  印刷レイアウトプレビュー
                </span>

                <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 text-[11px]">
                  <button
                    onClick={() => setPrintTarget('active')}
                    className={`px-2.5 py-1 font-bold rounded ${
                      printTarget === 'active' ? 'bg-blue-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    選択中チーム ({activeTeam})
                  </button>
                  <button
                    onClick={() => setPrintTarget('all')}
                    className={`px-2.5 py-1 font-bold rounded ${
                      printTarget === 'all' ? 'bg-blue-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    全チーム連続表示 (A/B/C)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDFダウンロード</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto pb-4">
              {printTarget === 'active' ? (
                <PrintablePdfView menu={activeMenu} id="swim-preview-view" team={activeTeam} />
              ) : (
                <div className="space-y-6">
                  {/* Aチーム */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-900 text-white text-[11px] font-bold rounded">
                        1ページ目：Aチーム (メイン)
                      </span>
                    </div>
                    <PrintablePdfView menu={menuA} id="swim-preview-view-a" team="A" />
                  </div>

                  {/* Bチーム */}
                  {menuB && (
                    <>
                      <div className="flex items-center gap-3 my-6 px-2">
                        <div className="flex-1 border-t-2 border-dashed border-emerald-300"></div>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                          ⬇ PDFの2ページ目へ改ページ ⬇
                        </span>
                        <div className="flex-1 border-t-2 border-dashed border-emerald-300"></div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-emerald-800 text-white text-[11px] font-bold rounded">
                            2ページ目：Bチーム (低強度版)
                          </span>
                        </div>
                        <PrintablePdfView menu={menuB} id="swim-preview-view-b" team="B" />
                      </div>
                    </>
                  )}

                  {/* Cチーム */}
                  {menuC && (
                    <>
                      <div className="flex items-center gap-3 my-6 px-2">
                        <div className="flex-1 border-t-2 border-dashed border-amber-300"></div>
                        <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-2xs">
                          ⬇ PDFの3ページ目へ改ページ ⬇
                        </span>
                        <div className="flex-1 border-t-2 border-dashed border-amber-300"></div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-amber-500 text-amber-950 text-[11px] font-extrabold rounded">
                            3ページ目：Cチーム (超低強度版)
                          </span>
                        </div>
                        <PrintablePdfView menu={menuC} id="swim-preview-view-c" team="C" />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Offscreen PDF Target Container for html2canvas rendering */}
      <div
        id="swim-pdf-offscreen-capture"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '800px',
          minWidth: '800px',
          maxWidth: '800px',
          backgroundColor: '#ffffff',
          pointerEvents: 'none',
          zIndex: -50,
          boxSizing: 'border-box',
        }}
      >
        {printTarget === 'active' ? (
          <PrintablePdfView menu={activeMenu} id="swim-pdf-export-active" team={activeTeam} />
        ) : (
          <div>
            <PrintablePdfView menu={menuA} id="swim-pdf-export-a" team="A" />
            {menuB && <PrintablePdfView menu={menuB} id="swim-pdf-export-b" team="B" />}
            {menuC && <PrintablePdfView menu={menuC} id="swim-pdf-export-c" team="C" />}
          </div>
        )}
      </div>

      {/* Hidden Printable Target for Browser Native Printing */}
      <div id="swim-print-root" className="hidden print:block">
        {printTarget === 'active' ? (
          <PrintablePdfView menu={activeMenu} id="swim-print-view-active" team={activeTeam} />
        ) : (
          <div>
            <PrintablePdfView menu={menuA} id="swim-print-view-a" team="A" />
            {menuB && (
              <>
                <div className="page-break" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}></div>
                <PrintablePdfView menu={menuB} id="swim-print-view-b" team="B" />
              </>
            )}
            {menuC && (
              <>
                <div className="page-break" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}></div>
                <PrintablePdfView menu={menuC} id="swim-print-view-c" team="C" />
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}

      <SavedMenusModal
        isOpen={showSavedMenusModal}
        onClose={() => setShowSavedMenusModal(false)}
        currentMenuA={menuA}
        currentMenuB={menuB}
        currentMenuC={menuC}
        onLoadSavedMenu={handleLoadSavedMenu}
        onToast={(msg) => triggerToast(msg)}
      />

      <EnZoneGuideModal
        isOpen={showEnGuideModal}
        onClose={() => setShowEnGuideModal(false)}
      />

      {/* Team Conversion Modal (B or C) */}
      {teamConfigModalTarget && (
        <TeamConfigModal
          isOpen={!!teamConfigModalTarget}
          onClose={() => setTeamConfigModalTarget(null)}
          targetTeam={teamConfigModalTarget}
          menuA={menuA}
          onApply={handleApplyTeamConfigMenu}
        />
      )}

      {/* Reset Current Tab Modal */}
      {showResetTabConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-rose-100 bg-rose-50 flex items-center gap-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">タブのリセット確認</h3>
                <p className="text-xs text-rose-700">対象: {activeTeam}チーム 練習メニュー</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900">
                現在開いている【{activeTeam}チーム】の入力項目（基本情報および練習メニュー項目）を空にリセットします。
              </p>
              <div className="bg-amber-50 text-amber-900 p-3 rounded-lg border border-amber-200">
                ⚠️ リセットを実行すると、このタブで入力中のデータは削除されます。取り消しはできません。
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetTabConfirmModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirmExecuteResetTab}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>タブをリセット</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Teams Modal */}
      {showResetAllConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-rose-100 bg-rose-50 flex items-center gap-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">全メニューのすべてリセット確認</h3>
                <p className="text-xs text-rose-700">対象: Aチーム・Bチーム・Cチーム 全データ</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900">
                すべてのチーム（A・B・Cチーム）の入力項目およびメニューを完全にリセットして初期状態（すべて空）に戻します。
              </p>
              <div className="bg-red-50 text-red-900 p-3 rounded-lg border border-red-200">
                ⚠️ すべてのチームの作業内容が消去されます。よろしいですか？
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetAllConfirmModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirmExecuteResetAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>すべてリセットを実行</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Sample Modal */}
      {showResetSampleConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-blue-100 bg-blue-50 flex items-center gap-3">
              <div className="p-2.5 bg-blue-900 text-white rounded-xl shadow-xs">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-blue-950">初期サンプルデータへの復元</h3>
                <p className="text-xs text-blue-800">全チームのデータを標準サンプルにリセット</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900">
                現在の全チーム編集内容を破棄して、初期サンプル練習メニューに復元しますか？
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetSampleConfirmModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirmExecuteResetSample}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                サンプルデータに復元
              </button>
            </div>
          </div>
        </div>
      )}

      <UserTourModal
        isOpen={showTourModal}
        onClose={() => setShowTourModal(false)}
        activeTab={activeTab}
        onSwitchTab={(tab) => setActiveTab(tab)}
        onOpenBTeamModal={() => handleGenerateBTeamMenu()}
        onOpenSavedMenus={() => setShowSavedMenusModal(true)}
      />
    </div>
  );
}
