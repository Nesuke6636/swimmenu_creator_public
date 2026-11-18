import React, { useState, useEffect } from 'react';
import { SwimMenuHeader, PoolLength } from '../types';
import { Settings, ChevronDown, ChevronUp, Calendar, Users, Award, Shield, MessageSquare, Clock, BookmarkCheck, RotateCcw, Save } from 'lucide-react';

const DEFAULT_HEADER_STORAGE_KEY = 'swim_menu_default_header_preset';

interface HeaderFormProps {
  header: SwimMenuHeader;
  onChange: (updatedHeader: SwimMenuHeader) => void;
  team?: 'A' | 'B' | 'C';
}

export const HeaderForm: React.FC<HeaderFormProps> = ({ header, onChange, team = 'A' }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [hasDefaultPreset, setHasDefaultPreset] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isTeamB = team === 'B';
  const isTeamC = team === 'C';

  // Base accent classes based on active team (backgrounds remain white)
  const cardBorderClass = isTeamC ? 'border-amber-300' : isTeamB ? 'border-emerald-200' : 'border-blue-200';
  const headerBarBgClass = isTeamC
    ? 'bg-amber-400 text-amber-950 hover:bg-amber-500'
    : isTeamB
    ? 'bg-emerald-800 text-white hover:bg-emerald-700'
    : 'bg-blue-900 text-white hover:bg-blue-800';
  const headerBarIconClass = isTeamC ? 'text-amber-950' : isTeamB ? 'text-emerald-200' : 'text-blue-200';
  const poolBadgeClass = isTeamC
    ? 'bg-amber-300 text-amber-950 border-amber-500 font-bold'
    : isTeamB
    ? 'bg-emerald-700 text-emerald-100 border-emerald-600'
    : 'bg-blue-800 text-blue-100 border-blue-700';
  const focusRingClass = isTeamC
    ? 'focus:ring-1 focus:ring-amber-400 focus:border-amber-400'
    : isTeamB
    ? 'focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500'
    : 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500';
  const saveBtnClass = isTeamC
    ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300 font-bold'
    : isTeamB
    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200 font-bold'
    : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200 font-bold';
  const saveBtnIconClass = isTeamC ? 'text-amber-800' : isTeamB ? 'text-emerald-700' : 'text-blue-800';

  // Pool Length selector classes corresponding to each course tab's palette
  const poolActiveBtnClass = isTeamC
    ? 'bg-amber-400 text-amber-950 font-extrabold shadow-xs'
    : isTeamB
    ? 'bg-emerald-600 text-white font-bold shadow-xs'
    : 'bg-blue-600 text-white font-bold shadow-xs';
  const poolContainerBorderClass = isTeamC
    ? 'border-amber-300 bg-amber-50/50'
    : isTeamB
    ? 'border-emerald-200 bg-emerald-50/50'
    : 'border-blue-200 bg-blue-50/50';
  const poolInactiveBtnClass = isTeamC
    ? 'text-amber-900/70 hover:text-amber-950 hover:bg-white/80'
    : isTeamB
    ? 'text-emerald-900/70 hover:text-emerald-950 hover:bg-white/80'
    : 'text-blue-900/70 hover:text-blue-950 hover:bg-white/80';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DEFAULT_HEADER_STORAGE_KEY);
      if (saved) setHasDefaultPreset(true);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleChange = (field: keyof SwimMenuHeader, value: any) => {
    onChange({
      ...header,
      [field]: value
    });
  };

  const handleSaveDefaultHeader = () => {
    try {
      const presetData: Partial<SwimMenuHeader> = {
        coachName: header.coachName,
        targetGroup: header.targetGroup,
        poolLength: header.poolLength,
        timeSlot: header.timeSlot,
        periodizationPhase: header.periodizationPhase,
        laneInfo: header.laneInfo,
        memo: header.memo
      };
      localStorage.setItem(DEFAULT_HEADER_STORAGE_KEY, JSON.stringify(presetData));
      setHasDefaultPreset(true);
      showStatus('💾 担当コーチ・チーム等の基本情報をデフォルト設定として保存しました！');
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadDefaultHeader = () => {
    try {
      const saved = localStorage.getItem(DEFAULT_HEADER_STORAGE_KEY);
      if (saved) {
        const presetData = JSON.parse(saved);
        onChange({
          ...header,
          ...presetData
        });
        showStatus('📥 デフォルト基本情報を読み込みました！');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div id="tour-header-form" className={`bg-white rounded-lg shadow-xs border overflow-hidden mb-6 transition-all scroll-mt-20 ${cardBorderClass}`}>
      {/* Header bar */}
      <div
        className={`px-5 py-3 flex items-center justify-between cursor-pointer transition-colors ${headerBarBgClass}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5">
          <Settings className={`w-4 h-4 ${headerBarIconClass}`} />
          <span className="font-bold text-sm tracking-tight">基本情報 & パラメータ設定</span>
          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded font-mono ${poolBadgeClass}`}>
            {header.poolLength} Pool
          </span>
        </div>
        <button className={`${headerBarIconClass} transition-colors`}>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-5 space-y-4 text-sm bg-white">
          {/* Row 1: Title & Pool Length */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                練習メニュー名 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={header.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="例: 冬期強化合宿 Day 4 AM - スプリント・耐乳酸"
                className={`w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm font-semibold text-slate-800 ${focusRingClass} outline-none`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                プール仕様 (長さ)
              </label>
              <div className={`flex rounded border overflow-hidden p-0.5 transition-colors ${poolContainerBorderClass}`}>
                {(['25m', '50m'] as PoolLength[]).map((pl) => (
                  <button
                    key={pl}
                    type="button"
                    onClick={() => handleChange('poolLength', pl)}
                    className={`flex-1 py-1 text-xs rounded transition-all cursor-pointer ${
                      header.poolLength === pl
                        ? poolActiveBtnClass
                        : poolInactiveBtnClass
                    }`}
                  >
                    {pl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Date, TimeSlot, TargetGroup, CoachName */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                実施日
              </label>
              <input
                type="date"
                value={header.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 ${focusRingClass} outline-none`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                時間枠
              </label>
              <input
                type="text"
                value={header.timeSlot}
                onChange={(e) => handleChange('timeSlot', e.target.value)}
                placeholder="例: 06:00 - 08:00 (120分)"
                className={`w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 ${focusRingClass} outline-none`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                対象グループ
              </label>
              <input
                type="text"
                value={header.targetGroup}
                onChange={(e) => handleChange('targetGroup', e.target.value)}
                placeholder="例: トップチーム / ジュニア1"
                className={`w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 ${focusRingClass} outline-none`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Award className="w-3 h-3 text-slate-400" />
                担当コーチ
              </label>
              <input
                type="text"
                value={header.coachName}
                onChange={(e) => handleChange('coachName', e.target.value)}
                placeholder="例: 山田 コーチ"
                className={`w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 ${focusRingClass} outline-none`}
              />
            </div>
          </div>

          {/* Row 3: Periodization & Lane Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3 text-slate-400" />
                期分け・フェーズ (Periodization)
              </label>
              <input
                type="text"
                value={header.periodizationPhase}
                onChange={(e) => handleChange('periodizationPhase', e.target.value)}
                placeholder="例: 強化期 (Mesocycle 2 - High Intensity)"
                className={`w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 ${focusRingClass} outline-none`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                コース / レーン割り当て
              </label>
              <input
                type="text"
                value={header.laneInfo}
                onChange={(e) => handleChange('laneInfo', e.target.value)}
                placeholder="例: 1〜4コース (5名/コース)"
                className={`w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 ${focusRingClass} outline-none`}
              />
            </div>
          </div>

          {/* Row 4: Theme & Memo */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              本日の練習テーマ・技術ポイント
            </label>
            <input
              type="text"
              value={header.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              placeholder="例: ターン後の15mバサロキック加速と後半50mのスピード維持"
              className={`w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-800 ${focusRingClass} outline-none`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-slate-400" />
              連絡事項・コーチ指示メモ (PDF出力時に下部配置)
            </label>
            <textarea
              rows={2}
              value={header.memo}
              onChange={(e) => handleChange('memo', e.target.value)}
              placeholder="例: メインスイム直後と1分後に各自脈拍を計測すること。ハイドレーション必須。"
              className={`w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs ${focusRingClass} outline-none resize-none`}
            />
          </div>

          {/* Default Header Preset Action Toolbar */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-500">
              {statusMsg ? (
                <span className="text-blue-900 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-200 animate-in fade-in">
                  {statusMsg}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  担当コーチ名・グループ・時間帯などをデフォルト値として保存・復元できます
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasDefaultPreset && (
                <button
                  type="button"
                  onClick={handleLoadDefaultHeader}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded flex items-center gap-1 transition-colors"
                  title="保存済みの基本情報（コーチ名・グループ等）を呼び出します"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>デフォルト設定を適用</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveDefaultHeader}
                className={`px-2.5 py-1 text-xs rounded flex items-center gap-1 transition-colors cursor-pointer border ${saveBtnClass}`}
                title="現在の担当コーチ名・チーム・プール情報等を次回以降使えるようにデフォルト設定保存"
              >
                <Save className={`w-3.5 h-3.5 ${saveBtnIconClass}`} />
                <span>基本情報をデフォルト保存</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
