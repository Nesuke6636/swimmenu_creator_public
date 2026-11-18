export type SwimStroke = 'Fr' | 'Ba' | 'Br' | 'Fly' | 'IM' | 'Choice' | 'S1' | 'Other';

export type IntensityZone = 'A1' | 'A2' | 'EN1' | 'EN2' | 'EN3' | 'SP1' | 'SP2' | 'SP3';

export type CategoryType = 'W-Up' | 'Kick' | 'Pull' | 'Drill' | 'Main' | 'Swim' | 'Down';

export type PoolLength = '25m' | '50m';

export interface MenuItem {
  id: string;
  category: CategoryType;
  subName?: string;       // e.g. "100m x 4本"
  distance: number;       // distance per rep (e.g. 50)
  reps: number;           // repetitions (e.g. 8)
  sets: number;           // set count (e.g. 2)
  stroke: SwimStroke;     // Fr, Ba, Br, Fly, IM, Choice, S1...
  description: string;    // e.g. "1st-4t Des / 5th-8t Hard! ハイパドル意識"
  intensity: IntensityZone; // A1, A2, EN1, EN2, EN3, SP1, SP2, SP3
  cycleSec: number;       // cycle time in seconds (e.g. 50 for 50sec, 75 for 1min15sec)
  restBetweenSetsSec?: number; // rest after sets in seconds
  equipment?: string[];   // e.g. ["パドル", "フィン", "スノーケル", "ボード", "プルブイ"]
  note?: string;          // optional note for swimmer
}

export interface SwimMenuHeader {
  title: string;          // e.g. "高校生 強化期 DAY 3 - メインHard"
  date: string;           // YYYY-MM-DD
  timeSlot: string;       // e.g. "06:30 - 08:30 (2時間)"
  poolLength: PoolLength; // 25m, 50m
  targetGroup: string;    // e.g. "高校・大学 競泳チーム (ミドル・スプリント)"
  periodizationPhase: string; // e.g. "強化期 (Mesocycle 2)"
  coachName: string;      // e.g. "山田 太郎 Coach"
  theme: string;          // e.g. "レース後半50mのスピード維持と心拍数維持"
  laneInfo: string;       // e.g. "1〜4コース (5〜6名/コース)"
  memo: string;           // e.g. "各自脈拍測定（メイン直後 & 1分後）。ハイドレーション徹底。"
}

export interface SwimMenu {
  id: string;
  header: SwimMenuHeader;
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedMenuRecord {
  id: string;
  name: string;
  savedAt: string;
  totalDistance: number;
  totalDurationMin: number;
  itemCount: number;
  menuA: SwimMenu;
  menuB?: SwimMenu | null;
  menuC?: SwimMenu | null;
}

export interface PresetTemplate {
  id: string;
  name: string;
  categoryLabel: string; // e.g. "基礎期", "強化期", "スプリント", "マスターズ", "試合前"
  targetDistance: number;
  estimatedTimeMin: number;
  description: string;
  tags: string[];
  menu: SwimMenu;
  isCustom?: boolean;
  createdAt?: string;
}
