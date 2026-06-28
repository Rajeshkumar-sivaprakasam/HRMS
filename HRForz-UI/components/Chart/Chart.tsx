'use client';
import React, { useMemo } from 'react';
import styles from './Chart.module.scss';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartProps {
  type: ChartType;
  data: ChartDataPoint[];
  title?: string;
  width?: number;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showValues?: boolean;
  colors?: string[];
  className?: string;
  style?: React.CSSProperties;
}

const PALETTE = [
  '#4F46E5','#0284C7','#16A34A','#D97706','#DC2626',
  '#7C3AED','#0891B2','#65A30D','#EA580C','#DB2777',
];

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const frac = v / exp;
  return (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * exp;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}k`;
  return String(Number.isInteger(n) ? n : +n.toFixed(1));
}

function polar(cx: number, cy: number, r: number, a: number) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function sectorPath(cx: number, cy: number, or: number, ir: number, sa: number, ea: number): string {
  const o1 = polar(cx, cy, or, sa), o2 = polar(cx, cy, or, ea);
  const large = ea - sa > Math.PI ? 1 : 0;
  if (ir <= 0) return `M ${cx} ${cy} L ${o1.x} ${o1.y} A ${or} ${or} 0 ${large} 1 ${o2.x} ${o2.y} Z`;
  const i1 = polar(cx, cy, ir, ea), i2 = polar(cx, cy, ir, sa);
  return `M ${o1.x} ${o1.y} A ${or} ${or} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${ir} ${ir} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
}

const M = { top: 24, right: 20, bottom: 48, left: 50 };

function CartesianChart({ type, data, width = 480, height = 280, showGrid = true, showValues = false, colors = PALETTE }: {
  type: 'bar' | 'line' | 'area'; data: ChartDataPoint[];
  width?: number; height?: number; showGrid?: boolean; showValues?: boolean; colors?: string[];
}) {
  const CW = width - M.left - M.right, CH = height - M.top - M.bottom;
  const n = data.length;
  const maxVal = niceMax(Math.max(...data.map(d => d.value), 0));
  const TICKS = 5;
  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => (maxVal / TICKS) * i);
  const toY = (v: number) => M.top + (1 - v / maxVal) * CH;
  const botY = M.top + CH;
  const slotW = CW / Math.max(n, 1);
  const barW = Math.max(4, slotW * 0.6);
  const ptX = (i: number) => n > 1 ? M.left + (i / (n - 1)) * CW : M.left + CW / 2;
  const pts = data.map((d, i) => ({ x: ptX(i), y: toY(d.value) }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = n > 0 ? `M ${pts[0].x} ${botY} ${linePath.slice(1)} L ${pts[pts.length - 1].x} ${botY} Z` : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }} aria-hidden="true">
      {ticks.map(t => {
        const y = toY(t);
        return (
          <g key={t}>
            {showGrid && t > 0 && <line x1={M.left} y1={y} x2={M.left + CW} y2={y} stroke="#E2E8F0" strokeWidth={1} />}
            <text x={M.left - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#64748B">{fmt(t)}</text>
          </g>
        );
      })}
      <line x1={M.left} y1={botY} x2={M.left + CW} y2={botY} stroke="#E2E8F0" strokeWidth={1} />
      {type === 'area' && n > 0 && <path d={areaPath} fill={colors[0]} fillOpacity={0.15} strokeWidth={0} />}
      {(type === 'line' || type === 'area') && n > 0 && (
        <path d={linePath} fill="none" stroke={colors[0]} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {type === 'bar' && data.map((d, i) => {
        const color = d.color ?? colors[i % colors.length];
        const bh = Math.max(0, (d.value / maxVal) * CH);
        const bx = M.left + i * slotW + (slotW - barW) / 2;
        const by = botY - bh;
        return (
          <g key={i}>
            <rect x={bx} y={by} width={barW} height={bh} fill={color} rx={3} ry={3} opacity={0.9}>
              <title>{d.label}: {fmt(d.value)}</title>
            </rect>
            {showValues && bh > 12 && (
              <text x={bx + barW / 2} y={by - 4} textAnchor="middle" fontSize={10} fill={color} fontWeight={600}>{fmt(d.value)}</text>
            )}
          </g>
        );
      })}
      {(type === 'line' || type === 'area') && pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#fff" stroke={colors[0]} strokeWidth={2.5}>
            <title>{data[i].label}: {fmt(data[i].value)}</title>
          </circle>
          {showValues && (
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={10} fill={colors[0]} fontWeight={600}>{fmt(data[i].value)}</text>
          )}
        </g>
      ))}
      {data.map((d, i) => {
        const cx = type === 'bar' ? M.left + i * slotW + slotW / 2 : ptX(i);
        return <text key={i} x={cx} y={botY + 16} textAnchor="middle" fontSize={10} fill="#64748B">{d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label}</text>;
      })}
    </svg>
  );
}

function PieChart({ type, data, width = 320, height = 280, showValues = false, colors = PALETTE }: {
  type: 'pie' | 'donut'; data: ChartDataPoint[];
  width?: number; height?: number; showValues?: boolean; colors?: string[];
}) {
  const cx = width / 2, cy = height / 2;
  const r = Math.min(cx, cy) - 24;
  const ir = type === 'donut' ? r * 0.55 : 0;
  const total = data.reduce((s, d) => s + d.value, 0);

  const segments = useMemo(() => {
    let angle = -Math.PI / 2;
    return data.map((d, i) => {
      const sweep = total > 0 ? (d.value / total) * 2 * Math.PI : 0;
      const sa = angle, ea = angle + sweep;
      angle = ea;
      const midA = sa + sweep / 2;
      const lr = ir > 0 ? (r + ir) / 2 : r * 0.65;
      return { d: sectorPath(cx, cy, r, ir, sa, ea - 0.01), color: d.color ?? colors[i % colors.length], midA, lp: polar(cx, cy, lr, midA), pct: total > 0 ? Math.round((d.value / total) * 100) : 0, label: d.label, value: d.value, sweep };
    });
  }, [data, cx, cy, r, ir, total, colors]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }} aria-hidden="true">
      {segments.map((seg, i) => (
        <g key={i}>
          <path d={seg.d} fill={seg.color} stroke="#fff" strokeWidth={2}>
            <title>{seg.label}: {fmt(seg.value)} ({seg.pct}%)</title>
          </path>
          {showValues && seg.sweep > 0.3 && (
            <text x={seg.lp.x} y={seg.lp.y + 4} textAnchor="middle" fontSize={11} fill="#fff" fontWeight={600}>{seg.pct}%</text>
          )}
        </g>
      ))}
      {type === 'donut' && (
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill="#0F172A">{fmt(total)}</text>
      )}
    </svg>
  );
}

function Legend({ data, colors }: { data: ChartDataPoint[]; colors: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={styles.legend}>
      {data.map((d, i) => (
        <div key={i} className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: d.color ?? colors[i % colors.length] }} />
          <span className={styles.legendLabel}>{d.label}</span>
          <span className={styles.legendValue}>{fmt(d.value)}{total > 0 ? ` · ${Math.round(d.value / total * 100)}%` : ''}</span>
        </div>
      ))}
    </div>
  );
}

export const Chart: React.FC<ChartProps> = ({
  type, data, title, width, height, showLegend, showGrid = true,
  showValues = false, colors = PALETTE, className, style,
}) => {
  const resolvedColors = data.map((d, i) => d.color ?? colors[i % colors.length]);
  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')} style={style} data-testid="chart">
      {title && <p className={styles.title}>{title}</p>}
      <div className={styles.svgWrapper}>
        {(type === 'bar' || type === 'line' || type === 'area') && (
          <CartesianChart type={type} data={data} width={width ?? 480} height={height ?? 280} showGrid={showGrid} showValues={showValues} colors={resolvedColors} />
        )}
        {(type === 'pie' || type === 'donut') && (
          <PieChart type={type} data={data} width={width ?? 320} height={height ?? 280} showValues={showValues} colors={resolvedColors} />
        )}
      </div>
      {(showLegend ?? (type === 'pie' || type === 'donut')) && <Legend data={data} colors={resolvedColors} />}
    </div>
  );
};
