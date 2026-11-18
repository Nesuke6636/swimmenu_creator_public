import { SwimMenu, MenuItem } from '../types';
import { calcItemTotalDistance } from './swimCalculators';

/**
 * Rounds seconds to standard manageable swim intervals in 5-second steps.
 */
export function roundToManageableSeconds(sec: number): number {
  if (sec <= 0) return 0;
  return Math.max(5, Math.round(sec / 5) * 5);
}

/**
 * 左側の表に「距離」「本数」「サイクル」がそれぞれ独立して表示されているため、
 * 詳細指示欄(description)から冗長な距離・本数・サイクルの表記を除去します。
 */
export function cleanRedundantMetricsFromDescription(desc: string): string {
  if (!desc) return '';
  let text = desc.trim();

  // 1. 先頭の "50m x 8本:" や "50m × 8本 -", "400m x 1本 " などの距離×本数ヘッダーを削除
  text = text.replace(/^\s*\d+\s*m\s*[xX×*]\s*\d+\s*(?:本|t)?\s*[:：\-–—\s]*/gi, '');

  // 2. 先頭の "4本: " や "8本 - " などの本数ヘッダーを削除（ただし 1-4t などのレンジ指示は維持）
  text = text.replace(/^\s*\d+\s*(?:本|t)\s*[:：\-–—\s]+/gi, '');

  // 3. 先頭の単体距離ヘッダー "400m: Choice smooth..." -> "Choice smooth..."
  text = text.replace(/^\s*\d+\s*m\s*[:：\-–—]+\s*/gi, '');

  // 4. 文中の独立した "〇〇m x 〇本" や "〇〇m × 〇本" を削除
  text = text.replace(/[(（]?\s*\b\d+\s*m\s*[xX×*]\s*\d+\s*(?:本|t)?\s*[)）]?\s*[:：\-–—\s]*/gi, ' ');

  // 5. "サイクル: 60秒", "サークル: 50秒" などの表記を削除
  text = text.replace(/[(（]?\s*(?:サイクル|サークル)\s*[:：]?\s*(?:\d+分)?\d+\s*(?:秒|s)?(?:\s*で)?\s*[)）]?\s*[:：\-–—\s]*/gi, ' ');
  text = text.replace(/\b(?:サイクル|サークル)\s*[:：]?\s*(?:\d+分)?\d+\s*(?:秒|s)?(?:\s*で)?\b/gi, ' ');

  // 6. 先頭や末尾、連続する区切り文字・空白の整形
  text = text.replace(/^[:：\-–—,，/／で\s]+/, '');
  text = text.replace(/[:：\-–—,，/／\s]+$/, '');
  text = text.replace(/\s{2,}/g, ' ');

  return text.trim();
}

/**
 * 元Aメニューの記述を可能な限りそのまま利用しつつ、
 * 変更後の本数・距離・サークルと合致するように必要な箇所を更新します。
 */
export function updateDescriptionForNewStructure(
  originalDesc: string,
  oldDist: number,
  newDist: number,
  oldReps: number,
  newReps: number
): string {
  if (!originalDesc) return '';
  let text = cleanRedundantMetricsFromDescription(originalDesc);

  if (oldDist > 0 && newDist > 0 && oldDist !== newDist) {
    const distPattern = new RegExp(`\\b${oldDist}\\s*m\\b`, 'gi');
    text = text.replace(distPattern, `${newDist}m`);
  }

  if (oldReps > 1 && newReps > 0 && oldReps !== newReps) {
    const rangePattern = /(\d+)(?:st|nd|rd|th)?[-〜~](\d+)(?:st|nd|rd|th)?(?:\s*t|\s*本)?/gi;
    text = text.replace(rangePattern, (_match, startStr, endStr) => {
      const startNum = parseInt(startStr, 10);
      const endNum = parseInt(endStr, 10);
      if (isNaN(startNum) || isNaN(endNum)) return _match;

      const ratio = newReps / oldReps;
      let newStart = Math.max(1, Math.round(startNum * ratio));
      let newEnd = Math.max(newStart, Math.min(newReps, Math.round(endNum * ratio)));

      if (startNum === 1) newStart = 1;
      if (endNum === oldReps) newEnd = newReps;

      if (newStart === newEnd) {
        return `${newStart}t`;
      }
      return `${newStart}-${newEnd}t`;
    });

    const singleRepPattern = new RegExp(`\\b${oldReps}\\s*(?:本目|t目)\\b`, 'gi');
    text = text.replace(singleRepPattern, `${newReps}本目`);
  }

  return cleanRedundantMetricsFromDescription(text);
}

export interface TeamConversionOptions {
  teamLevel: 'B' | 'C';
  repsMultiplier?: number; // e.g. 0.6 for B, 0.4 for C
  cycleMultiplier?: number; // e.g. 1.35 for B, 1.6 for C
  shortenLongDistance?: boolean; // default: true
  keepWarmupDown?: boolean; // default: true
}

/**
 * Converts A-Team Swim Menu into B-Team (Moderate Lower Intensity) or C-Team (Light Intensity)
 * keeping descriptions, repetitions, intervals, and distances consistent.
 */
export function convertMenuToTeam(
  menuA: SwimMenu,
  options: TeamConversionOptions
): SwimMenu {
  const isC = options.teamLevel === 'C';
  const defaultRepsMultiplier = isC ? 0.4 : 0.6;
  const defaultCycleMultiplier = isC ? 1.6 : 1.35;

  const repsMultiplier = options.repsMultiplier ?? defaultRepsMultiplier;
  const cycleMultiplier = options.cycleMultiplier ?? defaultCycleMultiplier;
  const shortenLongDistance = options.shortenLongDistance ?? true;
  const keepWarmupDown = options.keepWarmupDown ?? true;

  const convertedItems: MenuItem[] = menuA.items.map((item) => {
    // ウォーミングアップ・クールダウン (W-Up, Down)
    if (keepWarmupDown && (item.category === 'W-Up' || item.category === 'Down')) {
      const cleanDesc = cleanRedundantMetricsFromDescription(item.description);

      if (isC && item.cycleSec > 0) {
        return {
          ...item,
          description: cleanDesc,
          cycleSec: roundToManageableSeconds(item.cycleSec * 1.15)
        };
      }
      return {
        ...item,
        description: cleanDesc
      };
    }

    const sets = item.sets || 1;

    // 1本あたりの距離が 50m 以下の場合 (または長距離短縮フラグがOFFの場合)
    if (item.distance <= 50 || !shortenLongDistance) {
      let newDistance = item.distance;
      if (isC && item.distance === 50 && shortenLongDistance && item.category !== 'W-Up' && item.category !== 'Down') {
        newDistance = 25;
      }

      let newReps = item.reps;
      let newSets = sets;

      if (newDistance === item.distance) {
        if (item.reps > 1) {
          newReps = Math.max(1, Math.round(item.reps * repsMultiplier));
        } else if (sets > 1) {
          newSets = Math.max(1, Math.round(sets * repsMultiplier));
        }
      } else {
        const targetDist = calcItemTotalDistance(item) * repsMultiplier;
        newReps = Math.max(1, Math.round((targetDist / newSets) / newDistance));
      }

      let baseSec = item.cycleSec;
      if (newDistance !== item.distance) {
        baseSec = item.cycleSec / 2;
      }
      const newCycleSec = baseSec > 0 ? roundToManageableSeconds(baseSec * cycleMultiplier) : 0;

      const newDescription = updateDescriptionForNewStructure(
        item.description,
        item.distance,
        newDistance,
        item.reps,
        newReps
      );

      const subNameStr = `${newDistance}m x ${newReps}${newSets > 1 ? ` x ${newSets}Set` : ''}`;

      return {
        ...item,
        distance: newDistance,
        reps: newReps,
        sets: newSets,
        cycleSec: newCycleSec,
        description: newDescription,
        subName: subNameStr
      };
    }

    // 1本あたりの距離が 50m を超える場合（かつ長距離短縮フラグがON）
    const newDistance = item.distance >= 100 ? 50 : 25;

    const aTotalDist = calcItemTotalDistance(item);
    const targetTotalDist = aTotalDist * repsMultiplier;

    const newSets = sets;
    const targetDistPerSet = targetTotalDist / newSets;
    const newReps = Math.max(1, Math.round(targetDistPerSet / newDistance));

    const ratio50 = item.distance / 50;
    const cycle50Sec = item.cycleSec > 0 ? item.cycleSec / ratio50 : 0;

    const baseCycle = newDistance === 25 ? cycle50Sec / 2 : cycle50Sec;
    const newCycleSec = baseCycle > 0 ? roundToManageableSeconds(baseCycle * cycleMultiplier) : 0;

    const newDescription = updateDescriptionForNewStructure(
      item.description,
      item.distance,
      newDistance,
      item.reps,
      newReps
    );

    const subNameStr = `${newDistance}m x ${newReps}${newSets > 1 ? ` x ${newSets}Set` : ''}`;

    return {
      ...item,
      distance: newDistance,
      reps: newReps,
      sets: newSets,
      cycleSec: newCycleSec,
      description: newDescription,
      subName: subNameStr
    };
  });

  const teamPrefix = isC ? 'C' : 'B';
  const teamLabel = isC ? 'Cチーム (超低強度版)' : 'Bチーム (低強度版)';
  const themeLabel = isC ? 'フォーム維持・安全重視 & 低強度調整' : '基礎フォーム意識 & 運動強度調整';

  return {
    ...menuA,
    id: `menu-${teamPrefix.toLowerCase()}-${Date.now()}`,
    header: {
      ...menuA.header,
      targetGroup: menuA.header.targetGroup
        ? `${menuA.header.targetGroup.replace(/\s*\([BC]チーム.*?\)/g, '')} (${teamLabel})`
        : `${teamLabel}`,
      theme: menuA.header.theme
        ? `${menuA.header.theme.replace(/\s*【[BC]チーム.*】/g, '')} 【${teamPrefix}チーム強度調整版】`
        : themeLabel
    },
    items: convertedItems,
    updatedAt: new Date().toISOString()
  };
}

export type BTeamConversionOptions = Omit<TeamConversionOptions, 'teamLevel'>;

export function convertMenuToBTeam(
  menuA: SwimMenu,
  options?: BTeamConversionOptions
): SwimMenu {
  return convertMenuToTeam(menuA, {
    teamLevel: 'B',
    ...options
  });
}

export function convertMenuToCTeam(
  menuA: SwimMenu,
  options?: BTeamConversionOptions
): SwimMenu {
  return convertMenuToTeam(menuA, {
    teamLevel: 'C',
    ...options
  });
}
