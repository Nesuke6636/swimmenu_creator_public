import React from 'react';
import { MenuItem } from '../types';
import { calcItemTotalDistance, calcItemTotalDurationSec, calcCategoryBreakdown, calcIntensityBreakdown } from '../utils/swimCalculators';
import { Activity, Clock, Target, Flame } from 'lucide-react';

interface StatsSummaryProps {
  items: MenuItem[];
  onOpenEnGuideModal?: () => void;
  team?: 'A' | 'B' | 'C';
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ items, team = 'A' }) => {
  const totalMeters = items.reduce((acc, item) => acc + calcItemTotalDistance(item), 0);
  const totalSeconds = items.reduce((acc, item) => acc + calcItemTotalDurationSec(item), 0);
  const categoryStats = calcCategoryBreakdown(items);
  const intensityStats = calcIntensityBreakdown(items);

  const isTeamB = team === 'B';
  const isTeamC = team === 'C';

  // Base accent classes (background stays pure white, category and intensity badges untouched)
  const cardBorderClass = isTeamC ? 'border-amber-300' : isTeamB ? 'border-emerald-200' : 'border-blue-200';
  const metricIconClass = isTeamC
    ? 'bg-amber-100 text-amber-950'
    : isTeamB
    ? 'bg-emerald-100 text-emerald-900'
    : 'bg-blue-100 text-blue-900';
  const metricTextClass = isTeamC
    ? 'text-amber-950 font-bold'
    : isTeamB
    ? 'text-emerald-950 font-bold'
    : 'text-blue-900 font-bold';
  const metricUnitClass = isTeamC ? 'text-amber-800' : isTeamB ? 'text-emerald-700' : 'text-blue-700';

  return (
    <div className={`bg-white rounded-lg p-5 mb-6 shadow-xs border text-slate-800 ${cardBorderClass}`}>
      {/* Top Banner Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 pb-4 border-b border-slate-100">
        {/* Total Distance */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded border border-slate-100">
          <div className={`p-2 rounded ${metricIconClass}`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">総練習距離 (TOTAL)</span>
            <span className={`text-xl sm:text-2xl font-mono tracking-tight ${metricTextClass}`}>
              {totalMeters.toLocaleString()}
              <span className={`text-xs font-bold ml-1 ${metricUnitClass}`}>m</span>
            </span>
          </div>
        </div>

        {/* Total Duration */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded border border-slate-100">
          <div className={`p-2 rounded ${metricIconClass}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">予想所要時間 (TIME)</span>
            <span className={`text-xl sm:text-2xl font-mono tracking-tight ${metricTextClass}`}>
              {(() => {
                if (!totalSeconds || totalSeconds <= 0) {
                  return (
                    <>
                      0<span className={`text-xs font-bold ml-1 ${metricUnitClass}`}>分</span>
                    </>
                  );
                }
                const totalMin = Math.round(totalSeconds / 60);
                if (totalMin >= 60) {
                  const hours = Math.floor(totalMin / 60);
                  const mins = totalMin % 60;
                  return (
                    <>
                      {hours}
                      <span className={`text-xs font-bold mx-0.5 ${metricUnitClass}`}>時間</span>
                      {mins > 0 && (
                        <>
                          {mins}
                          <span className={`text-xs font-bold mx-0.5 ${metricUnitClass}`}>分</span>
                        </>
                      )}
                      <span className="text-xs text-slate-500 font-normal ml-1">
                        ({totalMin}<span className="text-[10px] font-normal">分</span>)
                      </span>
                    </>
                  );
                }
                return (
                  <>
                    {totalMin}
                    <span className={`text-xs font-bold ml-1 ${metricUnitClass}`}>分</span>
                  </>
                );
              })()}
            </span>
          </div>
        </div>

        {/* Main Set & Intensity Quick Stat */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-800 rounded">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">メインセット距離 (MAIN)</span>
              <span className="text-xl sm:text-2xl font-mono tracking-tight text-red-700 font-bold">
                {categoryStats.find(c => c.category === 'Main')?.meters || 0}
                <span className="text-xs font-bold text-red-600 ml-1">m</span>
                <span className="text-xs text-slate-500 font-normal ml-1.5">
                  ({categoryStats.find(c => c.category === 'Main')?.percentage || 0}%)
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Category % & Intensity % */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-800" />
              カテゴリ構成比 (W-Up, Kick, Pull, Drill, Main...)
            </h3>
          </div>

          {/* Stacked Progress Bar */}
          <div className="h-3 w-full bg-slate-100 rounded overflow-hidden flex mb-3 border border-slate-200">
            {categoryStats.map(stat => {
              if (stat.percentage <= 0) return null;
              let bg = 'bg-slate-400';
              if (stat.category === 'W-Up') bg = 'bg-blue-500';
              if (stat.category === 'Kick') bg = 'bg-teal-500';
              if (stat.category === 'Pull') bg = 'bg-cyan-500';
              if (stat.category === 'Drill') bg = 'bg-indigo-500';
              if (stat.category === 'Main') bg = 'bg-red-500';
              if (stat.category === 'Swim') bg = 'bg-amber-500';
              if (stat.category === 'Down') bg = 'bg-slate-400';

              return (
                <div
                  key={stat.category}
                  style={{ width: `${stat.percentage}%` }}
                  className={`${bg} h-full transition-all`}
                  title={`${stat.category}: ${stat.meters}m (${stat.percentage}%)`}
                />
              );
            })}
          </div>

          {/* Meter List */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-[11px]">
            {categoryStats.map(stat => {
              let pctColor = 'text-slate-500';
              if (stat.category === 'W-Up') pctColor = 'text-blue-600';
              if (stat.category === 'Kick') pctColor = 'text-teal-600';
              if (stat.category === 'Pull') pctColor = 'text-cyan-600';
              if (stat.category === 'Drill') pctColor = 'text-indigo-600';
              if (stat.category === 'Main') pctColor = 'text-red-600';
              if (stat.category === 'Swim') pctColor = 'text-amber-600';
              if (stat.category === 'Down') pctColor = 'text-slate-500';

              return (
                <div key={stat.category} className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">{stat.category}</span>
                  <span className="font-bold text-slate-900 font-mono">{stat.meters}m</span>
                  <span className={`text-[10px] ${pctColor} font-bold ml-1`}>({stat.percentage}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Intensity Distribution */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-600" />
              運動強度 (A1〜SP3) 分布
            </h3>
          </div>

          {/* Stacked Intensity Bar */}
          <div className="h-3 w-full bg-slate-100 rounded overflow-hidden flex mb-3 border border-slate-200">
            {intensityStats.map(stat => {
              if (stat.percentage <= 0) return null;
              let bg = 'bg-slate-400';
              if (stat.zone === 'A1') bg = 'bg-slate-400';
              if (stat.zone === 'A2') bg = 'bg-sky-400';
              if (stat.zone === 'EN1') bg = 'bg-cyan-500';
              if (stat.zone === 'EN2') bg = 'bg-emerald-500';
              if (stat.zone === 'EN3') bg = 'bg-amber-500';
              if (stat.zone === 'SP1') bg = 'bg-orange-500';
              if (stat.zone === 'SP2') bg = 'bg-rose-500';
              if (stat.zone === 'SP3') bg = 'bg-red-600';

              return (
                <div
                  key={stat.zone}
                  style={{ width: `${stat.percentage}%` }}
                  className={`${bg} h-full transition-all`}
                  title={`${stat.label}: ${stat.meters}m (${stat.percentage}%)`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-[11px]">
            {intensityStats.map(stat => {
              let pctColor = 'text-slate-500';
              if (stat.zone === 'A1') pctColor = 'text-slate-500';
              if (stat.zone === 'A2') pctColor = 'text-sky-600';
              if (stat.zone === 'EN1') pctColor = 'text-cyan-600';
              if (stat.zone === 'EN2') pctColor = 'text-emerald-600';
              if (stat.zone === 'EN3') pctColor = 'text-amber-600';
              if (stat.zone === 'SP1') pctColor = 'text-orange-600';
              if (stat.zone === 'SP2') pctColor = 'text-rose-600';
              if (stat.zone === 'SP3') pctColor = 'text-red-600';

              return (
                <div key={stat.zone} className="bg-slate-50 p-1.5 rounded border border-slate-200 min-w-0">
                  <span className="text-slate-500 block text-[10px] font-bold truncate" title={stat.label}>{stat.label}</span>
                  <span className="font-bold text-slate-900 font-mono">{stat.meters}m</span>
                  <span className={`text-[10px] ${pctColor} font-bold ml-1`}>({stat.percentage}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
