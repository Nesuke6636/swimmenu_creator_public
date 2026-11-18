import { MenuItem, IntensityZone, SwimMenu } from '../types';

const VALID_INTENSITY_ZONES: IntensityZone[] = ['A1', 'A2', 'EN1', 'EN2', 'EN3', 'SP1', 'SP2', 'SP3'];

/**
 * Normalizes intensity codes or loose strings into A1-SP3 categories.
 */
export function normalizeIntensityZone(zone?: string): IntensityZone {
  if (!zone) return 'A1';
  const trimmed = String(zone).trim();
  if ((VALID_INTENSITY_ZONES as string[]).includes(trimmed)) {
    return trimmed as IntensityZone;
  }

  const upper = trimmed.toUpperCase();
  if ((VALID_INTENSITY_ZONES as string[]).includes(upper)) {
    return upper as IntensityZone;
  }

  if (upper === 'INTB' || upper === 'LOW' || upper === 'BASIC') return 'A1';
  if (upper === 'INT1' || upper === 'MODERATE') return 'EN1';
  if (upper === 'INT2' || upper === 'HEAVY') return 'EN2';
  if (upper === 'INT3' || upper === 'SEVERE') return 'EN3';
  if (upper === 'INT4' || upper === 'AN1' || upper === 'EXTREME') return 'SP1';
  if (upper === 'AN2') return 'SP2';
  if (upper === 'INT5' || upper === 'AN3' || upper === 'SUPRA MAXIMAL') return 'SP3';

  return 'A2';
}

/**
 * Migrates a loaded SwimMenu so all item intensities conform to A1-SP3 categories.
 */
export function migrateMenuIntensities(menu: SwimMenu): SwimMenu {
  if (!menu || !Array.isArray(menu.items)) return menu;
  return {
    ...menu,
    items: menu.items.map((item) => ({
      ...item,
      intensity: normalizeIntensityZone(item.intensity)
    }))
  };
}

/**
 * Calculates the total distance (m) for a single practice item.
 */
export function calcItemTotalDistance(item: MenuItem): number {
  return (item.distance || 0) * (item.reps || 1) * (item.sets || 1);
}

/**
 * Calculates total duration in seconds for a single practice item.
 */
export function calcItemTotalDurationSec(item: MenuItem): number {
  const reps = item.reps || 1;
  const sets = item.sets || 1;
  const cycleSec = item.cycleSec || 0;
  const setRest = item.restBetweenSetsSec || 0;

  const cycleTimeTotal = cycleSec * reps * sets;
  const restTotal = sets > 1 ? setRest * (sets - 1) : 0;

  return cycleTimeTotal + restTotal;
}

/**
 * Formats cycle seconds into swim cycle notation (e.g. 50 -> "50秒", 75 -> "1'15\"").
 */
export function formatCycleTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '-';
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min === 0) {
    return `${sec}秒`;
  }
  return `${min}'${sec < 10 ? '0' : ''}${sec}"`;
}

/**
 * Parses user typed cycle string (e.g. "1:15", "1'15", "1-15", "75") to total seconds.
 */
export function parseCycleStringToSec(str: string): number {
  if (!str) return 0;
  const trimmed = str.trim();

  // Matches "1:15", "1'15", "1-15", "1分15秒"
  if (trimmed.includes(':') || trimmed.includes("'") || trimmed.includes('-')) {
    const parts = trimmed.split(/[:'\-]/);
    if (parts.length >= 2) {
      const min = parseInt(parts[0], 10) || 0;
      const sec = parseInt(parts[1], 10) || 0;
      return min * 60 + sec;
    }
  }

  if (trimmed.includes('分')) {
    const minPart = trimmed.split('分')[0];
    const secPart = trimmed.split('分')[1]?.replace('秒', '');
    const min = parseInt(minPart, 10) || 0;
    const sec = parseInt(secPart, 10) || 0;
    return min * 60 + sec;
  }

  const num = parseInt(trimmed, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats total seconds into human friendly Japanese time (e.g. "1時間25分 (85分)").
 */
export function formatTotalTimeMin(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0分';
  const totalMin = Math.round(totalSeconds / 60);
  if (totalMin >= 60) {
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return `${hours}時間${mins > 0 ? `${mins}分` : ''} (${totalMin}分)`;
  }
  return `${totalMin}分`;
}

/**
 * Category breakdown analytics
 */
export function calcCategoryBreakdown(items: MenuItem[]) {
  const totals: Record<string, number> = {
    'W-Up': 0,
    'Kick': 0,
    'Pull': 0,
    'Drill': 0,
    'Main': 0,
    'Swim': 0,
    'Down': 0
  };

  let grandTotal = 0;
  items.forEach(item => {
    const dist = calcItemTotalDistance(item);
    if (totals[item.category] !== undefined) {
      totals[item.category] += dist;
    } else {
      totals['Swim'] += dist;
    }
    grandTotal += dist;
  });

  return Object.keys(totals).map(cat => ({
    category: cat,
    meters: totals[cat],
    percentage: grandTotal > 0 ? Math.round((totals[cat] / grandTotal) * 100) : 0
  }));
}

/**
 * Intensity zone breakdown analytics (A1 - SP3)
 */
export function calcIntensityBreakdown(items: MenuItem[]) {
  const totals: Record<IntensityZone, number> = {
    'A1': 0,
    'A2': 0,
    'EN1': 0,
    'EN2': 0,
    'EN3': 0,
    'SP1': 0,
    'SP2': 0,
    'SP3': 0
  };

  const labelMap: Record<IntensityZone, string> = {
    'A1': 'A1 (回復)',
    'A2': 'A2 (基礎)',
    'EN1': 'EN1 (有酸素)',
    'EN2': 'EN2 (AT/閾値)',
    'EN3': 'EN3 (VO2max)',
    'SP1': 'SP1 (耐乳酸)',
    'SP2': 'SP2 (乳酸生成)',
    'SP3': 'SP3 (最大スピード)'
  };

  let grandTotal = 0;
  items.forEach(item => {
    const dist = calcItemTotalDistance(item);
    grandTotal += dist;
    const zone = normalizeIntensityZone(item.intensity);
    totals[zone] += dist;
  });

  return VALID_INTENSITY_ZONES.map(zone => ({
    zone,
    label: labelMap[zone],
    meters: totals[zone],
    percentage: grandTotal > 0 ? Math.round((totals[zone] / grandTotal) * 100) : 0
  }));
}
