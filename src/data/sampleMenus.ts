import { PresetTemplate } from '../types';

export const SAMPLE_TEMPLATES: PresetTemplate[] = [
  {
    id: 'template-endurance-3500',
    name: '基礎期 3,500m (自由形・IM 基礎持久強化)',
    categoryLabel: '基礎期 (Base)',
    targetDistance: 3500,
    estimatedTimeMin: 85,
    description: '基礎的な有酸素・閾値持久能力(EN1〜EN2)を高める3,500mメニュー。フォーム意識のドリルとビルドアッププル、メインスイムをバランスよく配置。',
    tags: ['基礎期', '有酸素', '3500m', 'EN1-EN2'],
    menu: {
      id: 'menu-sample-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      header: {
        title: '基礎期 3,500m - 有酸素ベース & IMコントロール',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '06:00 - 07:30 (90分)',
        poolLength: '25m',
        targetGroup: '高校・大学 競泳チーム All',
        periodizationPhase: '基礎期 (Base Phase - Week 3)',
        coachName: '競泳ヘッドコーチ',
        theme: '長い距離のストローク効率向上と呼吸リズムの安定',
        laneInfo: '全コース使用 (4〜5名/コース)',
        memo: '強度目標: メインはAT/LT水準のEN2をキープ。ストローク数を数えること。'
      },
      items: [
        {
          id: 'item-1',
          category: 'W-Up',
          distance: 400,
          reps: 1,
          sets: 1,
          stroke: 'Choice',
          description: '400m Choice smooth (100mごとにFr/Ba切替)',
          intensity: 'A1',
          cycleSec: 420,
          equipment: []
        },
        {
          id: 'item-2',
          category: 'Kick',
          distance: 50,
          reps: 8,
          sets: 1,
          stroke: 'Fr',
          description: '1st-4t: Board Kick (A2) / 5th-8t: Side Kick 25m + Swim 25m',
          intensity: 'A2',
          cycleSec: 60,
          equipment: ['ボード']
        },
        {
          id: 'item-3',
          category: 'Pull',
          distance: 100,
          reps: 6,
          sets: 1,
          stroke: 'Fr',
          description: 'Paddles & Buoy, 1-3t: 1:20 Des (ディセンディング) / 4-6t: Smooth DPS',
          intensity: 'EN1',
          cycleSec: 85,
          equipment: ['パドル', 'プルブイ']
        },
        {
          id: 'item-4',
          category: 'Drill',
          distance: 50,
          reps: 6,
          sets: 1,
          stroke: 'IM',
          description: 'IM順 (Fly/Ba/Br/Fr) 各種目キャッチアップドリル',
          intensity: 'A2',
          cycleSec: 65,
          equipment: []
        },
        {
          id: 'item-5',
          category: 'Main',
          distance: 200,
          reps: 6,
          sets: 1,
          stroke: 'Fr',
          description: 'Main Swim! 1st-4t: EN2 Hold (AT維持) / 5th-6t: Last 50m Hard!',
          intensity: 'EN2',
          cycleSec: 165,
          equipment: []
        },
        {
          id: 'item-6',
          category: 'Swim',
          distance: 50,
          reps: 8,
          sets: 1,
          stroke: 'Choice',
          description: '奇数: Easy 25m + Max 25m (SP3) / 偶数: Easy 50m (A1)',
          intensity: 'SP3',
          cycleSec: 60,
          equipment: []
        },
        {
          id: 'item-7',
          category: 'Down',
          distance: 200,
          reps: 1,
          sets: 1,
          stroke: 'Choice',
          description: 'C-Down (緩やかに心拍数を落とす)',
          intensity: 'A1',
          cycleSec: 300,
          equipment: []
        }
      ]
    }
  },
  {
    id: 'template-sprint-2800',
    name: '強化期 2,800m (スプリント＆耐乳酸・ハイパワー)',
    categoryLabel: '強化期 (High Intensity)',
    targetDistance: 2800,
    estimatedTimeMin: 70,
    description: 'VO2max向上と耐乳酸・スプリント能力(EN3〜SP3)を高める高強度インターバル・スプリント特化型メニュー。',
    tags: ['強化期', 'スプリント', '高強度インターバル', 'EN3-SP3'],
    menu: {
      id: 'menu-sample-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      header: {
        title: 'スプリント＆高強度 2,800m - 耐乳酸 & スピードパワー',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '16:30 - 18:00 (90分)',
        poolLength: '25m',
        targetGroup: 'スプリントグループ (50m・100m専門)',
        periodizationPhase: '強化期 (Build Phase - Week 2)',
        coachName: 'スプリントコーチ',
        theme: 'ターン後の壁蹴りからのドルフィンキック最大加速 & 高強度スピード維持',
        laneInfo: '1〜3コース',
        memo: 'レスト中の回復を意識。メインは各セットのターゲット強度（SP1〜SP3）を厳守して出し切ること！'
      },
      items: [
        {
          id: 'item-201',
          category: 'W-Up',
          distance: 400,
          reps: 1,
          sets: 1,
          stroke: 'Choice',
          description: 'W-Up (100m SKPS: Swim/Kick/Pull/Swim)',
          intensity: 'A1',
          cycleSec: 420,
          equipment: []
        },
        {
          id: 'item-202',
          category: 'Kick',
          distance: 50,
          reps: 6,
          sets: 1,
          stroke: 'Choice',
          description: 'Fins On, 15m UW Dolphin Kick Max! + 35m Easy',
          intensity: 'SP3',
          cycleSec: 60,
          equipment: ['フィン']
        },
        {
          id: 'item-203',
          category: 'Pull',
          distance: 50,
          reps: 8,
          sets: 1,
          stroke: 'S1',
          description: 'Paddles & Snorkel, 25m Build-up + 25m Hard',
          intensity: 'EN2',
          cycleSec: 50,
          equipment: ['パドル', 'スノーケル', 'プルブイ']
        },
        {
          id: 'item-204',
          category: 'Main',
          distance: 50,
          reps: 4,
          sets: 3,
          stroke: 'S1',
          description: '1-2t: Race Pace (EN3) / 3-4t: ALL OUT MAX! (SP1)',
          intensity: 'SP1',
          cycleSec: 60,
          restBetweenSetsSec: 120,
          equipment: []
        },
        {
          id: 'item-205',
          category: 'Swim',
          distance: 25,
          reps: 8,
          sets: 1,
          stroke: 'S1',
          description: 'Dive! (飛び込みスタート) Max Speed Sprint (SP3)',
          intensity: 'SP3',
          cycleSec: 90,
          equipment: []
        },
        {
          id: 'item-206',
          category: 'Down',
          distance: 300,
          reps: 1,
          sets: 1,
          stroke: 'Choice',
          description: 'C-Down (ストレッチ＆十分な呼吸回復)',
          intensity: 'A1',
          cycleSec: 360,
          equipment: []
        }
      ]
    }
  },
  {
    id: 'template-masters-2000',
    name: 'マスターズ 2,000m (フォーム改善＆長持ちスイム)',
    categoryLabel: 'マスターズ (Masters)',
    targetDistance: 2000,
    estimatedTimeMin: 60,
    description: '社会人・マスターズスイマー向けの60分完結型メニュー。負担の少ないキャッチと姿勢コントロールを中心に、爽快感を味わえる構成。',
    tags: ['マスターズ', 'フォーム重視', '2000m', '60分'],
    menu: {
      id: 'menu-sample-3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      header: {
        title: 'マスターズ 2,000m - 効率的フォーム＆気持ちよく泳ぐスイム',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '19:30 - 20:30 (60分)',
        poolLength: '25m',
        targetGroup: 'マスターズクラス (初級〜中級)',
        periodizationPhase: '年間継続トレーニング',
        coachName: 'マスターズ指導員',
        theme: '肩関節に負担をかけないハイエルボーと軸の保全',
        laneInfo: '2〜4コース',
        memo: '無理のない範囲でサイクルを守りましょう。水分補給をお忘れなく！'
      },
      items: [
        {
          id: 'item-301',
          category: 'W-Up',
          distance: 300,
          reps: 1,
          sets: 1,
          stroke: 'Choice',
          description: 'Smooth Choice (心拍数を少しずつ上げる)',
          intensity: 'A1',
          cycleSec: 360,
          equipment: []
        },
        {
          id: 'item-302',
          category: 'Drill',
          distance: 50,
          reps: 6,
          sets: 1,
          stroke: 'Fr',
          description: '奇数: 片手スイム (ローテーション意識) / 偶数: キャッチアップ',
          intensity: 'A2',
          cycleSec: 70,
          equipment: []
        },
        {
          id: 'item-303',
          category: 'Pull',
          distance: 100,
          reps: 4,
          sets: 1,
          stroke: 'Fr',
          description: 'プルブイ装着, DPS (少ないストローク数で伸びやかに泳ぐ)',
          intensity: 'EN1',
          cycleSec: 105,
          equipment: ['プルブイ']
        },
        {
          id: 'item-304',
          category: 'Main',
          distance: 50,
          reps: 10,
          sets: 1,
          stroke: 'Choice',
          description: '1-8t: 気持ち良いペースをHold (EN1) / 9-10t: Build-up Fast! (EN2)',
          intensity: 'EN1',
          cycleSec: 65,
          equipment: []
        },
        {
          id: 'item-305',
          category: 'Down',
          distance: 200,
          reps: 1,
          sets: 1,
          stroke: 'Choice',
          description: 'C-Down (ゆったり背泳ぎ・平泳ぎ)',
          intensity: 'A1',
          cycleSec: 300,
          equipment: []
        }
      ]
    }
  },
  {
    id: 'template-taper-1800',
    name: 'レース直前 1,800m (コンディショニング＆テーパー)',
    categoryLabel: 'レース直前 (Taper)',
    targetDistance: 1800,
    estimatedTimeMin: 45,
    description: '大会1〜3日前の最終調整メニュー。距離を極力抑えつつ、水感（水の捉え）とスピード感覚を研ぎ澄ます刺激入力。',
    tags: ['試合前', 'テーパー', '調整', '1800m'],
    menu: {
      id: 'menu-sample-4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      header: {
        title: 'レース前テーパー 1,800m - 水感チェック & スピード神経刺激',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '07:00 - 08:00 (60分)',
        poolLength: '25m',
        targetGroup: '遠征・大会出場全選手',
        periodizationPhase: 'レース直前テーパー期 (Taper Phase)',
        coachName: '競泳ヘッドコーチ',
        theme: '疲労を残さず、最高のボディポジションとスタートスピードを維持する',
        laneInfo: '全コース',
        memo: 'レースウェア（水着）着用可。スタート・ターンの切れ味を確認。'
      },
      items: [
        {
          id: 'item-401',
          category: 'W-Up',
          distance: 400,
          reps: 1,
          sets: 1,
          stroke: 'Choice',
          description: 'Choice smooth (水感を確かめながらゆっくり)',
          intensity: 'A1',
          cycleSec: 420,
          equipment: []
        },
        {
          id: 'item-402',
          category: 'Drill',
          distance: 50,
          reps: 4,
          sets: 1,
          stroke: 'S1',
          description: 'S1 専門種目ドリル (壁蹴り・バサロキック意識)',
          intensity: 'A2',
          cycleSec: 75,
          equipment: []
        },
        {
          id: 'item-403',
          category: 'Main',
          distance: 50,
          reps: 4,
          sets: 1,
          stroke: 'S1',
          description: '1-2t: 15m Fast / 3-4t: レースペース50m (25mターン確認)',
          intensity: 'SP1',
          cycleSec: 90,
          equipment: []
        },
        {
          id: 'item-404',
          category: 'Swim',
          distance: 25,
          reps: 4,
          sets: 1,
          stroke: 'S1',
          description: 'Dive! レーススタート15mブレイクアウトMax (SP3)',
          intensity: 'SP3',
          cycleSec: 120,
          equipment: []
        },
        {
          id: 'item-405',
          category: 'Down',
          distance: 400,
          reps: 1,
          sets: 1,
          stroke: 'Choice',
          description: 'C-Down (筋肉のほぐし＆十分な水分補給)',
          intensity: 'A1',
          cycleSec: 480,
          equipment: []
        }
      ]
    }
  }
];

export const PRESET_DRILLS = [
  { name: 'キャッチアップ', stroke: 'Fr/Ba', description: '片方の手がもう片方の手に触れてから次のローテーションを始める。軸の安定とグライド感習得。' },
  { name: '片手スイム (One Arm)', stroke: 'Fr/Ba/Fly', description: '片腕は前方に固定または体側につけたまま泳ぐ。ボディロールとキャッチの位置を意識。' },
  { name: 'フィンキック 15m アプローチ', stroke: 'All', description: 'フィンを履き、ターン後のバサロ/ドルフィンキックの減速を防ぐスピード感覚の養成。' },
  { name: 'スカル (フロント / ミドル / インカット)', stroke: 'All', description: '手首の面で水を捉えるハイエルボーキャッチの養成ドリル。' },
  { name: 'ハイエルボーキープ (Finger Drag)', stroke: 'Fr', description: 'リカバリー時に指先で水面を軽くなぞりながら肘を高く保つ。' },
  { name: 'ヘッドアップスイム', stroke: 'Fr/Fly', description: '頭を水面から上げて泳ぐ。体幹の締めとハイキャッチの強化。' },
  { name: '2キック 1プル', stroke: 'Br', description: '平泳ぎのストリームラインとけのび時間を長く保つタイミング調整ドリル。' },
  { name: 'サイドキック (6 Kick 1 Pull)', stroke: 'Fr/Ba', description: '横向きで6回キックした後に1回ローテーションスイム。ローリング軸の確認。' }
];

export interface IntensityInfoItem {
  label: string;
  purpose: string;
  hr: string;
  color: string;
  bg: string;
  border: string;
  desc: string;
}

export const INTENSITY_INFO: Record<string, IntensityInfoItem> = {
  'A1': {
    label: 'A1 (リカバリー)',
    purpose: '回復・準備運動',
    hr: '〜120 bpm',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    desc: 'ウォーミングアップ、クールダウン、疲労回復'
  },
  'A2': {
    label: 'A2 (基礎有酸素)',
    purpose: '基礎持久・技術練習',
    hr: '120〜140 bpm',
    color: 'text-sky-800',
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    desc: '基礎有酸素泳、フォーム修正、ドリル練習'
  },
  'EN1': {
    label: 'EN1 (有酸素持久)',
    purpose: '有酸素基盤の強化',
    hr: '130〜150 bpm',
    color: 'text-cyan-800',
    bg: 'bg-cyan-50',
    border: 'border-cyan-300',
    desc: '一定ペースでの持続泳（有酸素能力向上）'
  },
  'EN2': {
    label: 'EN2 (AT / 乳酸性作業閾値)',
    purpose: 'スピード持久力向上',
    hr: '150〜170 bpm',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    desc: 'ATペース維持による持久スピード強化'
  },
  'EN3': {
    label: 'EN3 (VO2max)',
    purpose: '最大酸素摂取量向上',
    hr: '170〜185 bpm',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    desc: '高強度インターバルによる最大有酸素パワー強化'
  },
  'SP1': {
    label: 'SP1 (乳酸耐性)',
    purpose: '後半の粘り・レース維持',
    hr: '180〜MAX',
    color: 'text-orange-800',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    desc: '高乳酸状態でのスピード維持（レースペース練習）'
  },
  'SP2': {
    label: 'SP2 (乳酸生成)',
    purpose: '無酸素解糖パワー向上',
    hr: 'MAX',
    color: 'text-rose-800',
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    desc: '十分な休息を挟んだ短〜中距離の全力ダッシュ'
  },
  'SP3': {
    label: 'SP3 (最大スピード)',
    purpose: '最大スプリント・神経系',
    hr: 'MAX (超最大)',
    color: 'text-red-900',
    bg: 'bg-red-100',
    border: 'border-red-400',
    desc: 'ATP-CP系・最大速度スプリント、スタート/ターン加速'
  }
};
