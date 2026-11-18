import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { MenuItem, CategoryType, SwimStroke, IntensityZone } from '../types';
import { calcItemTotalDistance, calcItemTotalDurationSec, formatCycleTime, parseCycleStringToSec, normalizeIntensityZone } from '../utils/swimCalculators';
import { INTENSITY_INFO, PRESET_DRILLS } from '../data/sampleMenus';
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, Layers, Check, HeartPulse } from 'lucide-react';

interface MenuItemTableProps {
  items: MenuItem[];
  onUpdateItems: (newItems: MenuItem[]) => void;
  team?: 'A' | 'B' | 'C';
  onOpenEnGuideModal?: () => void;
}

const CATEGORIES: CategoryType[] = ['W-Up', 'Kick', 'Pull', 'Drill', 'Main', 'Swim', 'Down'];
const STROKES: SwimStroke[] = ['Fr', 'Ba', 'Br', 'Fly', 'IM', 'Choice', 'S1', 'Other'];
const INTENSITIES: IntensityZone[] = ['A1', 'A2', 'EN1', 'EN2', 'EN3', 'SP1', 'SP2', 'SP3'];
const EQUIPMENT_OPTIONS = ['パドル', 'フィン', 'スノーケル', 'ボード', 'プルブイ'];

export const MenuItemTable: React.FC<MenuItemTableProps> = ({ items, onUpdateItems, team = 'A', onOpenEnGuideModal }) => {
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [tempCycleStr, setTempCycleStr] = useState<string>('');
  const [movingItemId, setMovingItemId] = useState<string | null>(null);

  const isTeamB = team === 'B';
  const isTeamC = team === 'C';

  // Dynamic theme accent tokens (backgrounds remain white, category & intensity badges unchanged)
  const cardBorderClass = isTeamC ? 'border-amber-300' : isTeamB ? 'border-emerald-200' : 'border-blue-200';
  const itemCardBorderClass = isTeamC ? 'border-amber-200' : isTeamB ? 'border-emerald-200' : 'border-slate-200';
  const titleIconClass = isTeamC ? 'text-amber-600' : isTeamB ? 'text-emerald-700' : 'text-blue-900';
  const actionBtnClass = isTeamC
    ? 'text-amber-900 bg-white hover:bg-amber-50 hover:text-amber-950 border-amber-300 hover:border-amber-400'
    : isTeamB
    ? 'text-emerald-700 bg-white hover:bg-emerald-50 hover:text-emerald-950 border-emerald-200 hover:border-emerald-400'
    : 'text-blue-700 bg-white hover:bg-blue-50 hover:text-blue-950 border-blue-200 hover:border-blue-400';
  const actionBtnIconClass = isTeamC ? 'text-amber-600' : isTeamB ? 'text-emerald-600' : 'text-blue-600';
  const focusRingClass = isTeamC ? 'focus:ring-amber-500' : isTeamB ? 'focus:ring-emerald-500' : 'focus:ring-blue-500';
  const totalDistBadgeClass = isTeamC
    ? 'bg-amber-400 text-amber-950 font-extrabold shadow-2xs'
    : isTeamB
    ? 'bg-emerald-700 text-white'
    : 'bg-blue-900 text-white';
  const totalTimeBadgeClass = isTeamC
    ? 'text-amber-950 bg-amber-50 border-amber-300'
    : isTeamB
    ? 'text-emerald-900 bg-emerald-50 border-emerald-200'
    : 'text-blue-900 bg-blue-50 border-blue-200';
  const movingRingClass = isTeamC
    ? 'ring-2 ring-amber-400 shadow-md border-amber-300'
    : isTeamB
    ? 'ring-2 ring-emerald-500 shadow-md border-emerald-400'
    : 'ring-2 ring-blue-500 shadow-md border-blue-400';
  const primaryBtnClass = isTeamC
    ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold border border-amber-300'
    : isTeamB
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';
  const cycleCheckBtnClass = isTeamC
    ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold'
    : isTeamB
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  // Reference to track button screen position before reorder so viewport can follow on rapid click
  const lastMoveRef = useRef<{
    itemId: string;
    direction: 'up' | 'down';
    buttonScreenTop: number;
  } | null>(null);

  // Synchronously lock viewport scroll to keep the reordered button exactly under the mouse pointer
  useLayoutEffect(() => {
    if (!lastMoveRef.current) return;
    const { itemId, direction, buttonScreenTop } = lastMoveRef.current;
    lastMoveRef.current = null;

    const targetBtn = document.querySelector<HTMLButtonElement>(`[data-move-btn="${itemId}-${direction}"]`);
    if (!targetBtn) return;

    const newBtnRect = targetBtn.getBoundingClientRect();
    const deltaY = newBtnRect.top - buttonScreenTop;

    if (Math.abs(deltaY) > 0.5) {
      window.scrollBy({
        top: deltaY,
        behavior: 'instant' as ScrollBehavior,
      });
    }

    targetBtn.focus({ preventScroll: true });
  }, [items]);

  useEffect(() => {
    if (!movingItemId) return;
    const timer = setTimeout(() => setMovingItemId(null), 1200);
    return () => clearTimeout(timer);
  }, [movingItemId]);

  // Add new item to start or end
  const handleAddItem = (category: CategoryType = 'Swim', position: 'start' | 'end' = 'end') => {
    const newItem: MenuItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      category,
      distance: 50,
      reps: 4,
      sets: 1,
      stroke: 'Fr',
      description: category === 'W-Up' ? 'Smooth W-Up' : category === 'Down' ? 'Easy C-Down' : `${category} 50m`,
      intensity: category === 'Main' ? 'EN2' : category === 'W-Up' || category === 'Down' ? 'A1' : 'A2',
      cycleSec: 60, // 1:00 default
      equipment: []
    };
    if (position === 'start') {
      onUpdateItems([newItem, ...items]);
    } else {
      onUpdateItems([...items, newItem]);
    }
  };

  // Insert item above or below a specific row
  const handleInsertItem = (index: number, position: 'above' | 'below', baseItem?: MenuItem) => {
    const category = baseItem?.category || 'Swim';
    const newItem: MenuItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      category,
      distance: baseItem?.distance || 50,
      reps: baseItem?.reps || 4,
      sets: 1,
      stroke: baseItem?.stroke || 'Fr',
      description: baseItem ? baseItem.description : (category === 'W-Up' ? 'Smooth W-Up' : category === 'Down' ? 'Easy C-Down' : '50m Swim'),
      intensity: baseItem?.intensity ? normalizeIntensityZone(baseItem.intensity) : (category === 'Main' ? 'EN2' : category === 'W-Up' || category === 'Down' ? 'A1' : 'A2'),
      cycleSec: baseItem?.cycleSec || 60,
      equipment: baseItem?.equipment ? [...baseItem.equipment] : []
    };
    const targetIdx = position === 'above' ? index : index + 1;
    const newItems = [...items];
    newItems.splice(targetIdx, 0, newItem);
    onUpdateItems(newItems);
  };

  const handleUpdateItem = (id: string, field: keyof MenuItem, value: any) => {
    const updated = items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onUpdateItems(updated);
  };

  const handleDuplicate = (id: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    const idx = items.findIndex(i => i.id === id);
    const newItem: MenuItem = {
      ...target,
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
    };
    const newItems = [...items];
    newItems.splice(idx + 1, 0, newItem);
    onUpdateItems(newItems);
  };

  const handleDelete = (id: string) => {
    onUpdateItems(items.filter(i => i.id !== id));
  };

  const handleMove = (index: number, direction: 'up' | 'down', e: React.MouseEvent<HTMLButtonElement>, itemId: string) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === items.length - 1)) return;

    const btnRect = e.currentTarget.getBoundingClientRect();
    lastMoveRef.current = {
      itemId,
      direction,
      buttonScreenTop: btnRect.top,
    };
    setMovingItemId(itemId);

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    onUpdateItems(newItems);
  };

  const toggleEquipment = (itemId: string, eq: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const currentEq = item.equipment || [];
    const newEq = currentEq.includes(eq)
      ? currentEq.filter(e => e !== eq)
      : [...currentEq, eq];
    handleUpdateItem(itemId, 'equipment', newEq);
  };

  // Cycle time inline editing
  const startEditingCycle = (item: MenuItem) => {
    setEditingCycleId(item.id);
    setTempCycleStr(formatCycleTime(item.cycleSec));
  };

  const saveCycle = (id: string) => {
    const parsedSec = parseCycleStringToSec(tempCycleStr);
    handleUpdateItem(id, 'cycleSec', parsedSec);
    setEditingCycleId(null);
  };

  return (
    <div id="tour-menu-table" className={`bg-white rounded-lg shadow-xs border p-5 mb-6 scroll-mt-20 ${cardBorderClass}`}>
      {/* Table Header Controls */}
      <div className="mb-3 pb-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Layers className={`w-4 h-4 ${titleIconClass}`} />
            練習メニュー項目編成
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            練習項目の距離・本数・サイクル・強度を設定
          </p>
        </div>

        {onOpenEnGuideModal && (
          <button
            type="button"
            onClick={onOpenEnGuideModal}
            className="px-3 py-1.5 bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-sky-950 border border-sky-500/60 font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="運動強度（A1〜SP3）の解説を開く"
          >
            <HeartPulse className="w-4 h-4 text-sky-900" />
            <span>強度解説 (A1〜SP3)</span>
          </button>
        )}
      </div>

      {/* Head Direct Add Category Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4 p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/90">
        <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5 text-slate-500" />
          先頭に追加:
        </span>
        {CATEGORIES.map(cat => (
          <button
            key={`top-${cat}`}
            type="button"
            onClick={() => handleAddItem(cat, 'start')}
            className={`text-xs px-2.5 py-1 rounded font-bold border transition-colors cursor-pointer ${actionBtnClass}`}
            title={`先頭に ${cat} を追加`}
          >
            + {cat}
          </button>
        ))}
      </div>

      {/* Items List / Cards */}
      {items.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-4">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">メニュー項目がありません</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">カテゴリボタンを押して項目を追加してください。</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={`empty-${cat}`}
                type="button"
                onClick={() => handleAddItem(cat, 'end')}
                className={`text-xs px-3 py-1.5 rounded font-bold border transition-colors cursor-pointer ${actionBtnClass}`}
              >
                + {cat}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const totalDist = calcItemTotalDistance(item);
            const totalDuration = calcItemTotalDurationSec(item);
            const normalizedIntensity = normalizeIntensityZone(item.intensity);
            const intensityObj = INTENSITY_INFO[normalizedIntensity] || INTENSITY_INFO['A1'];
            const isMoving = movingItemId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-lg p-3 transition-all ${
                  isMoving ? movingRingClass : itemCardBorderClass
                }`}
              >
                {/* Top Row: Category, Stroke, Distance x Reps x Sets, Total Badge, Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/80">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Index */}
                    <span className="text-xs font-mono font-bold text-slate-500 w-6">
                      #{index + 1}
                    </span>

                    {/* Category Selector */}
                    <select
                      value={item.category}
                      onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value as CategoryType)}
                      className={`text-xs font-bold rounded px-2 py-1 border outline-none cursor-pointer ${
                        item.category === 'Main' ? 'bg-red-700 text-white border-red-800' :
                        item.category === 'W-Up' ? 'bg-blue-700 text-white border-blue-800' :
                        item.category === 'Kick' ? 'bg-teal-700 text-white border-teal-800' :
                        item.category === 'Pull' ? 'bg-cyan-700 text-white border-cyan-800' :
                        item.category === 'Drill' ? 'bg-indigo-700 text-white border-indigo-800' :
                        'bg-slate-800 text-white border-slate-900'
                      }`}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c} className="bg-white text-slate-900">{c}</option>
                      ))}
                    </select>

                    {/* Stroke Selector */}
                    <select
                      value={item.stroke}
                      onChange={(e) => handleUpdateItem(item.id, 'stroke', e.target.value as SwimStroke)}
                      className="text-xs font-bold bg-white text-slate-800 border border-slate-200 rounded px-2 py-1 outline-none cursor-pointer"
                    >
                      {STROKES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    {/* Intensity Selector */}
                    <select
                      value={normalizedIntensity}
                      onChange={(e) => handleUpdateItem(item.id, 'intensity', e.target.value as IntensityZone)}
                      className={`text-xs font-bold border rounded px-2 py-1 outline-none cursor-pointer ${intensityObj.bg} ${intensityObj.color} ${intensityObj.border}`}
                      title={intensityObj.label}
                    >
                      {INTENSITIES.map(iz => (
                        <option key={iz} value={iz} className="bg-white text-slate-900">{iz}</option>
                      ))}
                    </select>
                  </div>

                  {/* Calculations Badge & Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${totalDistBadgeClass}`}>
                      {totalDist.toLocaleString()}m
                    </span>
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${totalTimeBadgeClass}`}>
                      約 {formatCycleTime(totalDuration)}
                    </span>

                    {/* Actions: 上に追加 / 下に追加 / 上へ移動 / 下へ移動 / 複製 / 削除 */}
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                      {/* 上に追加ボタン */}
                      <button
                        type="button"
                        onClick={() => handleInsertItem(index, 'above', item)}
                        className={`px-2 py-1 text-[11px] font-bold rounded border flex items-center gap-0.5 transition-colors cursor-pointer ${actionBtnClass}`}
                        title="この項目の上に新しいメニュー項目を追加"
                      >
                        <Plus className={`w-3 h-3 ${actionBtnIconClass}`} />
                        <span>上に追加</span>
                      </button>

                      {/* 下に追加ボタン */}
                      <button
                        type="button"
                        onClick={() => handleInsertItem(index, 'below', item)}
                        className={`px-2 py-1 text-[11px] font-bold rounded border flex items-center gap-0.5 transition-colors cursor-pointer ${actionBtnClass}`}
                        title="この項目の下に新しいメニュー項目を追加"
                      >
                        <Plus className={`w-3 h-3 ${actionBtnIconClass}`} />
                        <span>下に追加</span>
                      </button>

                      <div className="h-4 w-px bg-slate-200 mx-0.5" />

                      {/* 上へ移動 (連打対応) */}
                      <button
                        type="button"
                        data-move-btn={`${item.id}-up`}
                        onClick={(e) => handleMove(index, 'up', e, item.id)}
                        disabled={index === 0}
                        title={index === 0 ? '先頭です' : '上に移動（同じ場所を連打してどんどん上へ移動できます）'}
                        className={`p-1 text-slate-600 disabled:opacity-25 rounded border border-slate-200 disabled:border-transparent transition-colors cursor-pointer ${
                          isTeamC ? 'hover:text-amber-800 hover:bg-amber-50' : isTeamB ? 'hover:text-emerald-700 hover:bg-emerald-50' : 'hover:text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* 下へ移動 (連打対応) */}
                      <button
                        type="button"
                        data-move-btn={`${item.id}-down`}
                        onClick={(e) => handleMove(index, 'down', e, item.id)}
                        disabled={index === items.length - 1}
                        title={index === items.length - 1 ? '末尾です' : '下に移動（同じ場所を連打してどんどん下へ移動できます）'}
                        className={`p-1 text-slate-600 disabled:opacity-25 rounded border border-slate-200 disabled:border-transparent transition-colors cursor-pointer ${
                          isTeamC ? 'hover:text-amber-800 hover:bg-amber-50' : isTeamB ? 'hover:text-emerald-700 hover:bg-emerald-50' : 'hover:text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* 複製 */}
                      <button
                        type="button"
                        onClick={() => handleDuplicate(item.id)}
                        title="複製"
                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* 削除 */}
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        title="削除"
                        className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Math Inputs (Distance, Reps, Sets, Cycle) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">距離 (m)</label>
                    <input
                      type="number"
                      step={25}
                      min={25}
                      value={item.distance || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'distance', parseInt(e.target.value, 10) || 0)}
                      className={`w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 outline-none ${focusRingClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">本数</label>
                    <input
                      type="number"
                      min={1}
                      value={item.reps === 0 ? '' : (item.reps ?? '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleUpdateItem(item.id, 'reps', 0);
                        } else {
                          const parsed = parseInt(val, 10);
                          handleUpdateItem(item.id, 'reps', isNaN(parsed) ? 0 : Math.max(0, parsed));
                        }
                      }}
                      onBlur={() => {
                        if (!item.reps || item.reps < 1) {
                          handleUpdateItem(item.id, 'reps', 1);
                        }
                      }}
                      className={`w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 outline-none ${focusRingClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">セット数</label>
                    <input
                      type="number"
                      min={1}
                      value={item.sets === 0 ? '' : (item.sets ?? 1)}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleUpdateItem(item.id, 'sets', 0);
                        } else {
                          const parsed = parseInt(val, 10);
                          handleUpdateItem(item.id, 'sets', isNaN(parsed) ? 0 : Math.max(0, parsed));
                        }
                      }}
                      onBlur={() => {
                        if (!item.sets || item.sets < 1) {
                          handleUpdateItem(item.id, 'sets', 1);
                        }
                      }}
                      className={`w-full text-xs font-bold px-2 py-1 border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 outline-none ${focusRingClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">1本サイクル</label>
                    {editingCycleId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tempCycleStr}
                          onChange={(e) => setTempCycleStr(e.target.value)}
                          placeholder="例: 1:15 または 50"
                          className="w-full text-xs font-mono font-bold px-2 py-1 border border-slate-400 rounded bg-slate-50 text-slate-900 focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveCycle(item.id);
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => saveCycle(item.id)}
                          className={`p-1 rounded cursor-pointer ${cycleCheckBtnClass}`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingCycle(item)}
                        className={`w-full text-left text-xs font-mono font-bold px-2 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 flex justify-between items-center cursor-pointer ${
                          isTeamC ? 'text-amber-950' : isTeamB ? 'text-emerald-900' : 'text-blue-900'
                        }`}
                        title="クリックしてサイクル入力 (例: 1:15 または 50秒)"
                      >
                        <span>{formatCycleTime(item.cycleSec)}</span>
                        <span className="text-[9px] text-slate-400 font-sans">編集</span>
                      </button>
                    )}
                  </div>

                  {item.sets > 1 && (
                    <div className="col-span-2 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-rose-600 mb-0.5">セット間レスト (秒)</label>
                      <input
                        type="number"
                        step={10}
                        min={0}
                        value={item.restBetweenSetsSec || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'restBetweenSetsSec', parseInt(e.target.value, 10) || 0)}
                        placeholder="例: 60秒レスト"
                        className="w-full text-xs font-bold px-2 py-1 border border-rose-300 rounded bg-rose-50/50 text-rose-900 focus:ring-1 focus:ring-rose-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Bottom Row: Description & Equipment Chips */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      placeholder="練習内容・指示 (例: 1st-4t: Des / 5th-8t: Hard! ハイパドル意識)"
                      className={`w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 outline-none ${focusRingClass}`}
                    />
                  </div>

                  {/* Equipment selector chips */}
                  <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 rounded p-1">
                    <span className="text-[10px] font-bold text-slate-400 mr-0.5 ml-1">道具:</span>
                    {EQUIPMENT_OPTIONS.map(eq => {
                      const isSelected = item.equipment?.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => toggleEquipment(item.id, eq)}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                            isSelected
                              ? (isTeamC ? 'bg-amber-400 text-amber-950 font-bold' : isTeamB ? 'bg-emerald-700 text-white shadow-xs' : 'bg-blue-700 text-white shadow-xs')
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {eq}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Bottom Toolbar */}
      {items.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            末尾に追加:
          </span>
          {CATEGORIES.map(cat => (
            <button
              key={`bottom-${cat}`}
              type="button"
              onClick={() => handleAddItem(cat, 'end')}
              className={`text-xs px-2.5 py-1 rounded font-bold border transition-colors cursor-pointer ${actionBtnClass}`}
              title={`末尾に ${cat} を追加`}
            >
              + {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
