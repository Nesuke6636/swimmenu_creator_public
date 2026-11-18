import React, { useState, useEffect } from 'react';
import { SwimMenu, SavedMenuRecord } from '../types';
import { calcItemTotalDistance, calcItemTotalDurationSec } from '../utils/swimCalculators';
import { Folder, X, Trash2, FolderDown, Calendar, Layers, Clock, ArrowRight } from 'lucide-react';

const LOCAL_STORAGE_SAVED_MENUS_KEY = 'swim_menu_saved_menus_list';

interface SavedMenusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMenuA: SwimMenu;
  currentMenuB?: SwimMenu | null;
  currentMenuC?: SwimMenu | null;
  onLoadSavedMenu: (saved: SavedMenuRecord) => void;
  onToast?: (msg: string) => void;
}

export const SavedMenusModal: React.FC<SavedMenusModalProps> = ({
  isOpen,
  onClose,
  currentMenuA,
  currentMenuB,
  currentMenuC,
  onLoadSavedMenu,
  onToast
}) => {
  const [savedList, setSavedList] = useState<SavedMenuRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SAVED_MENUS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load saved menus', e);
    }
    return [];
  });

  const [inputName, setInputName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const defaultTitle =
        currentMenuA.header.title ||
        `${new Date().toLocaleDateString('ja-JP')} 練習メニュー`;
      setInputName(defaultTitle);
      setDeleteConfirmId(null);
    }
  }, [isOpen, currentMenuA]);

  const persistList = (newList: SavedMenuRecord[]) => {
    setSavedList(newList);
    try {
      localStorage.setItem(LOCAL_STORAGE_SAVED_MENUS_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  };

  if (!isOpen) return null;

  const handleSaveCurrentMenu = (e: React.FormEvent) => {
    e.preventDefault();
    const name = inputName.trim() || '練習メニュー';
    const totalDist = currentMenuA.items.reduce((acc, it) => acc + calcItemTotalDistance(it), 0);
    const totalSec = currentMenuA.items.reduce((acc, it) => acc + calcItemTotalDurationSec(it), 0);
    const durationMin = Math.round(totalSec / 60);

    const newRecord: SavedMenuRecord = {
      id: 'saved-menu-' + Date.now(),
      name,
      savedAt: new Date().toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      totalDistance: totalDist,
      totalDurationMin: durationMin,
      itemCount: currentMenuA.items.length,
      menuA: JSON.parse(JSON.stringify(currentMenuA)),
      menuB: currentMenuB ? JSON.parse(JSON.stringify(currentMenuB)) : null,
      menuC: currentMenuC ? JSON.parse(JSON.stringify(currentMenuC)) : null
    };

    persistList([newRecord, ...savedList]);
    if (onToast) {
      onToast(`💾 メニュー「${name}」を保存しました`);
    }
  };

  const handleDelete = (id: string, name: string) => {
    const updated = savedList.filter(item => item.id !== id);
    persistList(updated);
    setDeleteConfirmId(null);
    if (onToast) {
      onToast(`🗑️ メニュー「${name}」を削除しました`);
    }
  };

  const handleLoad = (record: SavedMenuRecord) => {
    onLoadSavedMenu(record);
    onClose();
    if (onToast) {
      onToast(`📥 メニュー「${record.name}」を読み込みました`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header (Bright Light Blue) */}
        <div
          className="p-4 text-sky-950 flex justify-between items-center border-b border-sky-500/50 shrink-0"
          style={{ backgroundColor: '#38bdf8' }}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white text-sky-600 rounded shadow-xs">
              <Folder className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">保存メニュー一覧</h2>
              <p className="text-[11px] text-sky-900 font-medium">端末のブラウザ内に作成したメニューを保存・管理</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-sky-900 hover:text-sky-950 hover:bg-sky-300/50 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Save Current Form */}
          <form onSubmit={handleSaveCurrentMenu} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              現在の練習メニューを保存
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="メニュー名（例: 5/10 強化期 メインHard）"
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <FolderDown className="w-3.5 h-3.5" />
                <span>保存する</span>
              </button>
            </div>
          </form>

          {/* Saved List */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center justify-between">
              <span>保存済みメニュー ({savedList.length}件)</span>
            </h3>

            {savedList.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Folder className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">保存されたメニューはありません</p>
                <p className="text-[11px] text-slate-400 mt-0.5">上の入力欄から現在のメニューを保存できます。</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {savedList.map((record) => (
                  <div
                    key={record.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {record.name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" />
                          {record.savedAt}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-900 font-bold rounded border border-blue-200">
                          {record.totalDistance.toLocaleString()}m
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded">
                          約{record.totalDurationMin}分
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded">
                          {record.itemCount}項目
                        </span>
                        {record.menuB && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200">
                            Bあり
                          </span>
                        )}
                        {record.menuC && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-900 text-[10px] font-bold rounded border border-amber-200">
                            Cあり
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleLoad(record)}
                        className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span>読み込む</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {deleteConfirmId === record.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(record.id, record.name)}
                            className="px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            削除確定
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg transition-colors cursor-pointer"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(record.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
