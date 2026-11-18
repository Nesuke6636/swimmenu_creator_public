import React from 'react';
import { SwimMenu } from '../types';
import { calcItemTotalDistance, calcItemTotalDurationSec, formatCycleTime, formatTotalTimeMin, calcCategoryBreakdown, normalizeIntensityZone } from '../utils/swimCalculators';

interface PrintablePdfViewProps {
  menu: SwimMenu;
  id?: string;
  team?: 'A' | 'B' | 'C';
}

interface TeamThemeStyles {
  headerGradient: string;
  headerShadow: string;
  badgeBg: string;
  badgeColor: string;
  metaBg: string;
  metaBorder: string;
  metaLabelColor: string;
  timeHighlightColor: string;
  themeBarBg: string;
  themeBarBorder: string;
  themeBarLabelColor: string;
  themeBarTextColor: string;
  summaryBarBg: string;
  summaryBarMutedText: string;
  tableHeaderBg: string;
  tableHeaderColor: string;
  tableHeaderBorder: string;
  tableBorder: string;
  cycleColor: string;
  memoBg: string;
  memoBorder: string;
  memoTitleColor: string;
}

const TEAM_PRINT_THEMES: Record<'A' | 'B' | 'C', TeamThemeStyles> = {
  // Aチーム: 青 (Blue)
  A: {
    headerGradient: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
    headerShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
    badgeBg: '#ffffff',
    badgeColor: '#1e40af',
    metaBg: '#eff6ff',
    metaBorder: '#bfdbfe',
    metaLabelColor: '#1d4ed8',
    timeHighlightColor: '#1e40af',
    themeBarBg: '#dbeafe',
    themeBarBorder: '#2563eb',
    themeBarLabelColor: '#1e40af',
    themeBarTextColor: '#1e3a8a',
    summaryBarBg: '#2563eb',
    summaryBarMutedText: '#dbeafe',
    tableHeaderBg: '#dbeafe',
    tableHeaderColor: '#1e40af',
    tableHeaderBorder: '#93c5fd',
    tableBorder: '#bfdbfe',
    cycleColor: '#1e40af',
    memoBg: '#eff6ff',
    memoBorder: '#bfdbfe',
    memoTitleColor: '#1e40af',
  },
  // Bチーム: 緑 (Green)
  B: {
    headerGradient: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
    headerShadow: '0 2px 8px rgba(5, 150, 105, 0.2)',
    badgeBg: '#ffffff',
    badgeColor: '#065f46',
    metaBg: '#ecfdf5',
    metaBorder: '#a7f3d0',
    metaLabelColor: '#047857',
    timeHighlightColor: '#065f46',
    themeBarBg: '#d1fae5',
    themeBarBorder: '#059669',
    themeBarLabelColor: '#065f46',
    themeBarTextColor: '#064e3b',
    summaryBarBg: '#059669',
    summaryBarMutedText: '#d1fae5',
    tableHeaderBg: '#d1fae5',
    tableHeaderColor: '#065f46',
    tableHeaderBorder: '#6ee7b7',
    tableBorder: '#a7f3d0',
    cycleColor: '#047857',
    memoBg: '#ecfdf5',
    memoBorder: '#a7f3d0',
    memoTitleColor: '#065f46',
  },
  // Cチーム: 黄色 (Yellow / Warm Amber)
  C: {
    headerGradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
    headerShadow: '0 2px 8px rgba(217, 119, 6, 0.2)',
    badgeBg: '#ffffff',
    badgeColor: '#b45309',
    metaBg: '#fffbeb',
    metaBorder: '#fde68a',
    metaLabelColor: '#b45309',
    timeHighlightColor: '#b45309',
    themeBarBg: '#fef3c7',
    themeBarBorder: '#d97706',
    themeBarLabelColor: '#b45309',
    themeBarTextColor: '#78350f',
    summaryBarBg: '#d97706',
    summaryBarMutedText: '#fef3c7',
    tableHeaderBg: '#fef3c7',
    tableHeaderColor: '#92400e',
    tableHeaderBorder: '#fcd34d',
    tableBorder: '#fde68a',
    cycleColor: '#b45309',
    memoBg: '#fffbeb',
    memoBorder: '#fde68a',
    memoTitleColor: '#92400e',
  },
};

// 明るく鮮やかで識別しやすいカテゴリバッジ用スタイル
const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  'W-Up': { bg: '#2563eb', color: '#ffffff' },
  'Kick': { bg: '#0d9488', color: '#ffffff' },
  'Pull': { bg: '#0891b2', color: '#ffffff' },
  'Drill': { bg: '#6366f1', color: '#ffffff' },
  'Main': { bg: '#e11d48', color: '#ffffff' },
  'Swim': { bg: '#d97706', color: '#ffffff' },
  'Down': { bg: '#64748b', color: '#ffffff' },
};

// 視認性の高い明瞭な運動強度マップ (A1〜SP3)
const INTENSITY_HEX_MAP: Record<string, { bg: string; color: string; border: string }> = {
  'A1': { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' },
  'A2': { bg: '#e0f2fe', color: '#075985', border: '#7dd3fc' },
  'EN1': { bg: '#cffafe', color: '#155e75', border: '#67e8f9' },
  'EN2': { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  'EN3': { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  'SP1': { bg: '#ffedd5', color: '#9a3412', border: '#fdba74' },
  'SP2': { bg: '#ffe4e6', color: '#9f1239', border: '#fda4af' },
  'SP3': { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
};

// すべての表示フォントをNoto Sans JPに統一
export const JAPANESE_FONT_STACK = '"Noto Sans JP", sans-serif';

export const PrintablePdfView: React.FC<PrintablePdfViewProps> = ({ menu, id, team }) => {
  const { header, items } = menu;

  const grandTotalMeters = items.reduce((acc, item) => acc + calcItemTotalDistance(item), 0);
  const grandTotalSeconds = items.reduce((acc, item) => acc + calcItemTotalDurationSec(item), 0);
  const categoryStats = calcCategoryBreakdown(items);

  const detectedTeam: 'A' | 'B' | 'C' =
    team ||
    (header.targetGroup?.includes('C') ? 'C' :
     header.targetGroup?.includes('B') ? 'B' : 'A');
  const currentTheme = TEAM_PRINT_THEMES[detectedTeam];

  return (
    <div
      id={id}
      data-pdf-page="true"
      className="printable-pdf-page bg-white print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none"
      style={{
        backgroundColor: '#ffffff',
        color: '#1e293b',
        padding: '20px 24px',
        width: '800px',
        minWidth: '800px',
        maxWidth: '800px',
        margin: '0 auto',
        boxSizing: 'border-box',
        fontFamily: JAPANESE_FONT_STACK,
        lineHeight: '1.4',
        letterSpacing: '0em',
        WebkitTextSizeAdjust: '100%',
        fontVariantNumeric: 'tabular-nums'
      }}
    >
      {/* 1. トップヘッダー */}
      <div
        data-pdf-avoid-break="true"
        style={{
          background: currentTheme.headerGradient,
          borderRadius: '12px',
          padding: '14px 18px',
          color: '#ffffff',
          marginBottom: '10px',
          boxShadow: currentTheme.headerShadow
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span
                style={{
                  backgroundColor: currentTheme.badgeBg,
                  color: currentTheme.badgeColor,
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontFamily: JAPANESE_FONT_STACK,
                  whiteSpace: 'nowrap'
                }}
              >
                {header.poolLength} Pool
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontFamily: JAPANESE_FONT_STACK,
                  whiteSpace: 'nowrap'
                }}
              >
                {detectedTeam}チーム
              </span>
              {header.periodizationPhase && (
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontFamily: JAPANESE_FONT_STACK,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {header.periodizationPhase}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: 0, padding: 0, lineHeight: '1.3', fontFamily: JAPANESE_FONT_STACK, letterSpacing: '0em', wordBreak: 'break-word' }}>
              {header.title || `競泳練習メニュー (${detectedTeam}チーム)`}
            </h1>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              textAlign: 'right',
              fontFamily: JAPANESE_FONT_STACK,
              lineHeight: '1.3',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <div style={{ fontSize: '10px', opacity: 0.9, fontWeight: '600' }}>実施日時</div>
            <div style={{ fontWeight: '800' }}>{header.date || '-'} {header.timeSlot ? `(${header.timeSlot})` : ''}</div>
          </div>
        </div>
      </div>

      {/* 2. メタデータグリッド */}
      <div
        data-pdf-avoid-break="true"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '10px',
          backgroundColor: currentTheme.metaBg,
          border: `1px solid ${currentTheme.metaBorder}`,
          borderRadius: '10px',
          padding: '10px 14px',
          fontFamily: JAPANESE_FONT_STACK
        }}
      >
        <div>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: currentTheme.metaLabelColor, textTransform: 'uppercase' }}>
            対象グループ
          </span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>{header.targetGroup || `${detectedTeam}チーム`}</span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: currentTheme.metaLabelColor, textTransform: 'uppercase' }}>
            担当コーチ
          </span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>{header.coachName || '-'}</span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: currentTheme.metaLabelColor, textTransform: 'uppercase' }}>
            レーン情報
          </span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>{header.laneInfo || '-'}</span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: currentTheme.metaLabelColor, textTransform: 'uppercase' }}>
            想定合計時間
          </span>
          <span style={{ fontSize: '12px', fontWeight: '800', color: currentTheme.timeHighlightColor }}>{formatTotalTimeMin(grandTotalSeconds)}</span>
        </div>
      </div>

      {/* 3. 練習テーマバー */}
      {header.theme && (
        <div
          data-pdf-avoid-break="true"
          style={{
            marginBottom: '10px',
            backgroundColor: currentTheme.themeBarBg,
            borderLeft: `4px solid ${currentTheme.themeBarBorder}`,
            borderRadius: '0 8px 8px 0',
            padding: '8px 12px',
            fontSize: '12px',
            fontFamily: JAPANESE_FONT_STACK,
            lineHeight: '1.4'
          }}
        >
          <span style={{ fontWeight: '800', color: currentTheme.themeBarLabelColor, marginRight: '6px' }}>🎯 練習テーマ:</span>
          <span style={{ fontWeight: '700', color: currentTheme.themeBarTextColor }}>{header.theme}</span>
        </div>
      )}

      {/* 4. 総距離・カテゴリバー */}
      <div
        data-pdf-avoid-break="true"
        style={{
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: currentTheme.summaryBarBg,
          color: '#ffffff',
          padding: '8px 14px',
          borderRadius: '10px',
          fontSize: '12px',
          fontFamily: JAPANESE_FONT_STACK
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: currentTheme.summaryBarMutedText, fontWeight: '600' }}>総距離:</span>
          <span style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff' }}>{grandTotalMeters.toLocaleString()}m</span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categoryStats.filter(c => c.meters > 0).map(c => (
            <span
              key={c.category}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '1px 7px',
                borderRadius: '9999px',
                fontSize: '10px',
                color: '#ffffff',
                fontWeight: '600',
                fontFamily: JAPANESE_FONT_STACK
              }}
            >
              {c.category}: <strong style={{ color: '#ffffff' }}>{c.meters}m</strong>
            </span>
          ))}
        </div>

        <span style={{ color: currentTheme.summaryBarMutedText, fontSize: '11px', fontWeight: '600' }}>{items.length}セット</span>
      </div>

      {/* 5. メイン練習メニューテーブル */}
      <div
        data-pdf-table-wrapper="true"
        className="pdf-table-wrapper"
        style={{
          borderRadius: '10px',
          overflow: 'hidden',
          border: `1px solid ${currentTheme.tableBorder}`,
          marginBottom: '10px',
          backgroundColor: '#ffffff'
        }}
      >
        <table data-pdf-table="true" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px', backgroundColor: '#ffffff', fontFamily: JAPANESE_FONT_STACK }}>
          <colgroup>
            <col style={{ width: '64px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '76px' }} />
            <col style={{ width: '48px' }} />
            <col style={{ width: 'auto' }} />
            <col style={{ width: '56px' }} />
            <col style={{ width: '58px' }} />
          </colgroup>
          <thead data-pdf-thead="true">
            <tr data-pdf-avoid-break="true" style={{ backgroundColor: currentTheme.tableHeaderBg, color: currentTheme.tableHeaderColor, borderBottom: `2px solid ${currentTheme.tableHeaderBorder}`, fontWeight: '800' }}>
              <th style={{ padding: '8px 4px', textAlign: 'center', fontFamily: JAPANESE_FONT_STACK, whiteSpace: 'nowrap' }}>カテゴリ</th>
              <th style={{ padding: '8px 4px', textAlign: 'center', fontFamily: JAPANESE_FONT_STACK, whiteSpace: 'nowrap' }}>構成 (距離×本数×Set)</th>
              <th style={{ padding: '8px 4px', textAlign: 'center', fontFamily: JAPANESE_FONT_STACK, whiteSpace: 'nowrap' }}>サイクル</th>
              <th style={{ padding: '8px 4px', textAlign: 'center', fontFamily: JAPANESE_FONT_STACK, whiteSpace: 'nowrap' }}>種目</th>
              <th style={{ padding: '8px 8px', fontFamily: JAPANESE_FONT_STACK }}>内容・ドリル詳細・指示</th>
              <th style={{ padding: '8px 4px', textAlign: 'center', fontFamily: JAPANESE_FONT_STACK, whiteSpace: 'nowrap' }}>強度</th>
              <th style={{ padding: '8px 4px', textAlign: 'center', fontFamily: JAPANESE_FONT_STACK, whiteSpace: 'nowrap' }}>計(m)</th>
            </tr>
          </thead>
          <tbody data-pdf-tbody="true">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontFamily: JAPANESE_FONT_STACK }}>
                  練習項目がありません。
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const itemDist = calcItemTotalDistance(item);
                const catStyle = CATEGORY_STYLES[item.category] || { bg: '#64748b', color: '#ffffff' };
                const normalizedIntensity = normalizeIntensityZone(item.intensity);
                const intensityStyle = INTENSITY_HEX_MAP[normalizedIntensity] || { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };
                const rowBg = idx % 2 === 1 ? '#f8fafc' : '#ffffff';

                return (
                  <tr key={item.id || idx} data-pdf-avoid-break="true" style={{ backgroundColor: rowBg, borderBottom: '1px solid #e2e8f0' }}>
                    {/* Category */}
                    <td style={{ padding: '6px 2px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: '800',
                          backgroundColor: catStyle.bg,
                          color: catStyle.color,
                          fontFamily: JAPANESE_FONT_STACK,
                          lineHeight: '1.2',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.category}
                      </span>
                    </td>

                    {/* Configuration */}
                    <td style={{ padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px', fontFamily: JAPANESE_FONT_STACK, whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: '700', color: '#1e293b' }}>{item.distance}m</span>
                      <span style={{ color: '#94a3b8', margin: '0 2px' }}>×</span>
                      <span style={{ fontWeight: '700', color: '#1e293b' }}>{item.reps}本</span>
                      {item.sets > 1 && (
                        <>
                          <span style={{ color: '#94a3b8', margin: '0 2px' }}>×</span>
                          <span style={{ fontWeight: '800', color: '#e11d48' }}>{item.sets}Set</span>
                        </>
                      )}
                    </td>

                    {/* Cycle */}
                    <td style={{ padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: '700', color: currentTheme.cycleColor, fontSize: '11px', fontFamily: JAPANESE_FONT_STACK, whiteSpace: 'nowrap' }}>
                      {formatCycleTime(item.cycleSec)}
                      {item.sets > 1 && item.restBetweenSetsSec && item.restBetweenSetsSec > 0 ? (
                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 'normal', marginTop: '1px', fontFamily: JAPANESE_FONT_STACK, whiteSpace: 'nowrap' }}>
                          (Rest {item.restBetweenSetsSec}s)
                        </div>
                      ) : null}
                    </td>

                    {/* Stroke */}
                    <td style={{ padding: '6px 2px', textAlign: 'center', verticalAlign: 'middle', fontWeight: '700', color: '#1e293b', fontFamily: JAPANESE_FONT_STACK, whiteSpace: 'nowrap' }}>
                      {item.stroke}
                    </td>

                    {/* Description */}
                    <td style={{ padding: '6px 8px', verticalAlign: 'middle', fontFamily: JAPANESE_FONT_STACK, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b', lineHeight: '1.3' }}>
                        {item.description || `${item.distance}m Swim`}
                      </div>
                      {item.equipment && item.equipment.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '3px' }}>
                          {item.equipment.map((eq, i) => (
                            <span
                              key={i}
                              style={{
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                fontSize: '9px',
                                padding: '1px 5px',
                                borderRadius: '9999px',
                                fontWeight: '500',
                                fontFamily: JAPANESE_FONT_STACK,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {eq}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.note && (
                        <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '1px', fontFamily: JAPANESE_FONT_STACK }}>
                          ※ {item.note}
                        </div>
                      )}
                    </td>

                    {/* Intensity */}
                    <td style={{ padding: '6px 2px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '800',
                          backgroundColor: intensityStyle.bg,
                          color: intensityStyle.color,
                          border: `1px solid ${intensityStyle.border}`,
                          fontFamily: JAPANESE_FONT_STACK,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {normalizedIntensity}
                      </span>
                    </td>

                    {/* Meter Subtotal */}
                    <td style={{ padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: '800', color: '#1e293b', fontFamily: JAPANESE_FONT_STACK, whiteSpace: 'nowrap' }}>
                      {itemDist.toLocaleString()}m
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 6. 備考メモ & 強度基準ブロック */}
      <div data-pdf-avoid-break="true" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', paddingTop: '2px' }}>
        {/* メモ */}
        <div style={{ backgroundColor: currentTheme.memoBg, border: `1px solid ${currentTheme.memoBorder}`, padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontFamily: JAPANESE_FONT_STACK }}>
          <span style={{ fontWeight: '800', color: currentTheme.memoTitleColor, display: 'block', marginBottom: '2px' }}>📌 連絡事項・指示メモ</span>
          <p style={{ color: '#334155', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.4', minHeight: '44px' }}>
            {header.memo && header.memo.trim() ? header.memo : ''}
          </p>
        </div>

        {/* 強度基準 */}
        <div style={{ backgroundColor: currentTheme.memoBg, border: `1px solid ${currentTheme.memoBorder}`, padding: '8px 12px', borderRadius: '8px', fontSize: '9.5px', fontFamily: JAPANESE_FONT_STACK }}>
          <span style={{ fontWeight: '800', color: currentTheme.memoTitleColor, display: 'block', marginBottom: '3px', fontSize: '10px' }}>💡 運動強度基準 (A1〜SP3)</span>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', color: '#475569', lineHeight: '1.45', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 8px' }}>
            <li><strong style={{ color: '#334155' }}>A1:</strong> 回復 / Up・Down</li>
            <li><strong style={{ color: '#075985' }}>A2:</strong> 基礎 / ドリル</li>
            <li><strong style={{ color: '#155e75' }}>EN1:</strong> 有酸素持久</li>
            <li><strong style={{ color: '#065f46' }}>EN2:</strong> AT (閾値)</li>
            <li><strong style={{ color: '#92400e' }}>EN3:</strong> VO2max</li>
            <li><strong style={{ color: '#9a3412' }}>SP1:</strong> 乳酸耐性</li>
            <li><strong style={{ color: '#9f1239' }}>SP2:</strong> 乳酸生成</li>
            <li><strong style={{ color: '#991b1b' }}>SP3:</strong> 最大スピード</li>
          </ul>
        </div>
      </div>

      {/* 7. フッター */}
      <div data-pdf-avoid-break="true" style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', fontFamily: JAPANESE_FONT_STACK }}>
        <span>競泳メニュー作成支援システム</span>
        <span>発行日時: {new Date().toLocaleDateString('ja-JP')}</span>
      </div>
    </div>
  );
};

