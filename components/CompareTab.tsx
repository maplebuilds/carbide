'use client';

import { BarChart2, ChevronDown, Check } from 'lucide-react';
import { HistoryItem } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { getDealerPrice, saveDealerPrice } from '@/lib/storage';

interface CompareTabProps {
  history: HistoryItem[];
  theme: 'dark' | 'light';
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseDollar(s: string): number {
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.replace(/^[\s\-•*·]+/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(s => s.length > 8)
    .slice(0, 3);
}

function reliabilityRank(r: string): number {
  const s = r.toLowerCase();
  if (s.startsWith('excellent')) return 5;
  if (s.startsWith('good')) return 4;
  if (s.includes('average') && !s.includes('below')) return 3;
  if (s.includes('below')) return 2;
  if (s.startsWith('poor')) return 1;
  return 3;
}

function reliabilityShort(r: string): string {
  return r.split(/[.,—\-]/)[0].trim();
}

function reliabilityColor(r: string): string {
  const rank = reliabilityRank(r);
  if (rank >= 4) return '#22c55e';
  if (rank <= 2) return '#ef4444';
  return '#f59e0b';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SelectCar({ label, value, onChange, history, exclude, theme }: {
  label: string; value: string; onChange: (vin: string) => void;
  history: HistoryItem[]; exclude: string; theme: 'dark' | 'light';
}) {
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = history.filter(h => h.vin !== exclude);
  const selected = options.find(h => h.vin === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex-1 min-w-0" ref={ref}>
      <p className={`font-data text-[10px] uppercase tracking-[0.1em] mb-2 ${isDark ? 'text-white/30' : 'text-black/30'}`}>{label}</p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm text-left transition-colors ${
            open
              ? 'border-[#FF5E00]/60 ' + (isDark ? 'bg-white/[0.05]' : 'bg-black/[0.05]')
              : isDark ? 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15]' : 'bg-black/[0.04] border-black/[0.08] hover:border-black/[0.15]'
          }`}
        >
          <span className={selected ? (isDark ? 'text-white' : 'text-[#0e0e10]') : (isDark ? 'text-white/25' : 'text-black/25')}>
            {selected ? `${selected.year} ${selected.make} ${selected.model}${selected.trim ? ' ' + selected.trim : ''}` : 'Select a vehicle…'}
          </span>
          <ChevronDown size={14} className={`flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-white/30' : 'text-black/30'}`} />
        </button>

        {open && (
          <div className={`absolute z-50 w-full mt-1 rounded-lg border overflow-hidden shadow-xl ${isDark ? 'bg-[#1a1a1e] border-white/[0.1]' : 'bg-white border-black/[0.1]'}`}>
            {options.length === 0 ? (
              <p className={`px-4 py-3 text-sm ${isDark ? 'text-white/30' : 'text-black/30'}`}>No other vehicles in history</p>
            ) : options.map(h => (
              <button
                key={h.vin}
                type="button"
                onClick={() => { onChange(h.vin); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors ${
                  h.vin === value
                    ? 'bg-[#FF5E00]/10 text-[#FF5E00]'
                    : isDark ? 'text-white/80 hover:bg-white/[0.06]' : 'text-[#0e0e10] hover:bg-black/[0.04]'
                }`}
              >
                <span>{h.year} {h.make} {h.model}{h.trim ? ' ' + h.trim : ''}</span>
                {h.vin === value && <Check size={13} className="flex-shrink-0 text-[#FF5E00]" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Flag({ type, children, theme }: { type: 'green' | 'yellow' | 'red'; children: React.ReactNode; theme: 'dark' | 'light' }) {
  const s = {
    green: { bg: 'rgba(34,197,94,0.05)', border: 'rgba(34,197,94,0.18)', icon: '🟢' },
    yellow: { bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.18)', icon: '🟡' },
    red: { bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.18)', icon: '🔴' },
  }[type];
  return (
    <div className="flex gap-2.5 items-start px-3 py-2.5 rounded-lg text-[12px] leading-relaxed mb-2 last:mb-0"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="flex-shrink-0 text-[11px] mt-0.5">{s.icon}</span>
      <span className={theme === 'dark' ? 'text-white/65' : 'text-black/65'}>{children}</span>
    </div>
  );
}

function CostRow({ label, value, highlight, theme }: { label: string; value: string; highlight?: boolean; theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div className={`flex justify-between items-baseline py-2 border-b last:border-0 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
      <span className={`text-[12px] ${highlight ? (isDark ? 'text-white font-medium' : 'text-[#0e0e10] font-medium') : (isDark ? 'text-white/45' : 'text-black/45')}`}>{label}</span>
      <span className={`font-data text-[12px] font-medium ${highlight ? 'text-[#FF5E00]' : isDark ? 'text-white' : 'text-[#0e0e10]'}`}>{value}</span>
    </div>
  );
}

// ─── Deal helpers (mirrored from CarReport) ───────────────────────────────────

function calcMonthlyPayment(principal: number, annualRatePct: number, months: number): string {
  const r = annualRatePct / 100 / 12;
  const p = principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return '$' + Math.round(p).toLocaleString();
}

function getDealBadge(dealerPrice: number, marketLow: number, marketHigh: number): { label: string; color: string; deltaLabel: string } {
  const deltaFromLow = dealerPrice - marketLow;
  const deltaFromHigh = dealerPrice - marketHigh;
  const fmt = (n: number) => '$' + Math.round(Math.abs(n)).toLocaleString();
  if (dealerPrice <= marketLow) return { label: 'Great Deal', color: '#22c55e', deltaLabel: `${fmt(deltaFromLow)} below market` };
  if (dealerPrice <= marketHigh) return { label: 'Fair Deal', color: '#f59e0b', deltaLabel: 'Within market range' };
  if (deltaFromHigh <= marketHigh * 0.10) return { label: 'Overpriced', color: '#f97316', deltaLabel: `${fmt(deltaFromHigh)} above market` };
  return { label: 'Walk Away', color: '#ef4444', deltaLabel: `${fmt(deltaFromHigh)} above market` };
}

// ─── Car section ──────────────────────────────────────────────────────────────

function CarSection({ car, theme }: { car: HistoryItem; theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  const r = car.report;
  const relRank = reliabilityRank(r.maintenanceReliability.reliabilityRating);
  const issues = parseLines(r.maintenanceReliability.knownIssues);

  const [dealerPriceInput, setDealerPriceInput] = useState('');
  const [dealerPrice, setDealerPrice] = useState<number | null>(null);

  useEffect(() => {
    const saved = getDealerPrice(car.vin);
    if (saved) {
      setDealerPriceInput(saved.toLocaleString());
      setDealerPrice(saved);
    }
  }, [car.vin]);

  const analyzePrice = () => {
    const p = parseInt(dealerPriceInput.replace(/[^0-9]/g, ''), 10);
    if (p > 0) { setDealerPrice(p); saveDealerPrice(car.vin, p); }
  };

  const marketLow = parseDollar(r.purchasePriceContext.fairMarketLow);
  const marketHigh = parseDollar(r.purchasePriceContext.fairMarketHigh);
  const badge = dealerPrice ? getDealBadge(dealerPrice, marketLow, marketHigh) : null;
  const monthly60 = dealerPrice ? calcMonthlyPayment(dealerPrice, 7.5, 60) : r.financingEstimate.monthlyGoodCredit60;

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`font-data text-[10px] uppercase tracking-[0.12em] mb-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              {car.year} {car.make}
            </p>
            <p className="font-display text-[22px] leading-tight" style={{ color: isDark ? '#e8e8ec' : '#0e0e10' }}>
              {car.model}{car.trim ? <em className="text-[#FF5E00] not-italic"> {car.trim}</em> : null}
            </p>
            <p className={`font-data text-[11px] mt-1 ${isDark ? 'text-white/25' : 'text-black/25'}`}>
              Market: {r.purchasePriceContext.fairMarketLow} – {r.purchasePriceContext.fairMarketHigh}
            </p>
          </div>
          {badge && dealerPrice && (
            <div className="text-right flex-shrink-0">
              <p className="font-data text-lg font-medium" style={{ color: isDark ? '#e8e8ec' : '#0e0e10' }}>
                ${dealerPrice.toLocaleString()}
              </p>
              <span className="inline-block font-data text-[10px] px-2 py-0.5 rounded mt-1"
                style={{ color: badge.color, background: badge.color + '18', border: `1px solid ${badge.color}33` }}>
                {badge.label} · {badge.deltaLabel}
              </span>
            </div>
          )}
        </div>

        {/* Dealer price input */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 font-data text-xs pointer-events-none ${isDark ? 'text-white/30' : 'text-black/30'}`}>$</span>
            <input
              type="text" inputMode="numeric"
              placeholder={dealerPrice ? dealerPrice.toLocaleString() : 'Dealer asking price'}
              value={dealerPriceInput}
              onChange={(e) => { setDealerPriceInput(e.target.value.replace(/[^0-9,]/g, '')); if (dealerPrice !== null) setDealerPrice(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') analyzePrice(); }}
              className={`w-full pl-6 pr-3 py-2 rounded-lg font-data text-xs border outline-none focus:border-[#FF5E00] transition-colors ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20' : 'bg-black/[0.04] border-black/[0.08] text-[#0e0e10] placeholder:text-black/25'}`}
            />
          </div>
          <button
            onClick={analyzePrice}
            disabled={!dealerPriceInput.trim()}
            className="px-3 py-2 rounded-lg bg-[#FF5E00] text-white font-data text-[10px] uppercase tracking-wider hover:bg-[#e55400] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Analyze
          </button>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: dealerPrice ? 'Monthly (your price)' : 'Monthly (60mo)', value: monthly60 + '/mo' },
          { label: '3-Year TCO', value: r.totalCostOfOwnership.year3Total },
        ].map(item => (
          <div key={item.label} className={`rounded-lg p-3 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-black/[0.04] border border-black/[0.06]'}`}>
            <p className={`font-data text-[10px] uppercase tracking-[0.08em] mb-1.5 ${isDark ? 'text-white/30' : 'text-black/30'}`}>{item.label}</p>
            <p className="font-data text-base font-medium text-[#FF5E00]">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Cost breakdown */}
      <div className={`rounded-lg border p-4 mb-4 ${isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-black/[0.07] bg-black/[0.02]'}`}>
        <p className={`font-data text-[10px] uppercase tracking-[0.1em] mb-3 ${isDark ? 'text-white/25' : 'text-black/25'}`}>Cost Breakdown</p>
        {dealerPrice && <CostRow label="Dealer asking price" value={'$' + dealerPrice.toLocaleString()} theme={theme} />}
        <CostRow label="Monthly payment (good credit, 60mo)" value={monthly60 + '/mo'} theme={theme} />
        <CostRow label="Insurance (est. annual)" value={'~' + (Math.round(((parseDollar(r.insuranceEstimate.monthlyLow) + parseDollar(r.insuranceEstimate.monthlyHigh)) / 2) * 12 / 100) * 100).toLocaleString().replace(/^/, '$')} theme={theme} />
        <CostRow label="Fuel (annual)" value={r.fuelCosts.annualCost} theme={theme} />
        <CostRow label="Maintenance (annual)" value={r.maintenanceReliability.annualCost} theme={theme} />
        <CostRow label="Year 1 All-In" value={r.totalCostOfOwnership.year1Total} theme={theme} />
        <CostRow label="3-Year Total" value={r.totalCostOfOwnership.year3Total} highlight theme={theme} />
      </div>

      {/* Flags */}
      <div>
        <p className={`font-data text-[10px] uppercase tracking-[0.1em] mb-2.5 ${isDark ? 'text-white/25' : 'text-black/25'}`}>Flags</p>
        {relRank >= 4 && <Flag type="green" theme={theme}><strong>Reliability:</strong> {reliabilityShort(r.maintenanceReliability.reliabilityRating)}</Flag>}
        {issues.map((issue, i) => <Flag key={i} type={relRank <= 2 ? 'red' : 'yellow'} theme={theme}>{issue}</Flag>)}
        <Flag type="red" theme={theme}><strong>Major risk:</strong> {r.maintenanceReliability.majorRisks}</Flag>
        <Flag type="yellow" theme={theme}><strong>Watch out:</strong> {r.bottomLine.watchOut}</Flag>
      </div>
    </div>
  );
}

// ─── Scorecard ────────────────────────────────────────────────────────────────

function Scorecard({ carA, carB, theme }: { carA: HistoryItem; carB: HistoryItem; theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  const ra = carA.report, rb = carB.report;

  const metrics: Array<{
    label: string;
    aVal: string; bVal: string;
    aWins: boolean; bWins: boolean;
  }> = [
    (() => {
      const a = parseDollar(ra.totalCostOfOwnership.year3Total), b = parseDollar(rb.totalCostOfOwnership.year3Total);
      return { label: '3-Yr TCO', aVal: ra.totalCostOfOwnership.year3Total, bVal: rb.totalCostOfOwnership.year3Total, aWins: a < b, bWins: b < a };
    })(),
    (() => {
      const a = parseDollar(ra.financingEstimate.monthlyGoodCredit60), b = parseDollar(rb.financingEstimate.monthlyGoodCredit60);
      return { label: 'Payment', aVal: ra.financingEstimate.monthlyGoodCredit60 + '/mo', bVal: rb.financingEstimate.monthlyGoodCredit60 + '/mo', aWins: a < b, bWins: b < a };
    })(),
    (() => {
      const avgA = (parseDollar(ra.insuranceEstimate.monthlyLow) + parseDollar(ra.insuranceEstimate.monthlyHigh)) / 2;
      const avgB = (parseDollar(rb.insuranceEstimate.monthlyLow) + parseDollar(rb.insuranceEstimate.monthlyHigh)) / 2;
      return { label: 'Insurance', aVal: ra.insuranceEstimate.monthlyLow + '–' + ra.insuranceEstimate.monthlyHigh + '/mo', bVal: rb.insuranceEstimate.monthlyLow + '–' + rb.insuranceEstimate.monthlyHigh + '/mo', aWins: avgA < avgB, bWins: avgB < avgA };
    })(),
    (() => {
      const a = parseDollar(ra.fuelCosts.annualCost), b = parseDollar(rb.fuelCosts.annualCost);
      return { label: 'Annual Fuel', aVal: ra.fuelCosts.annualCost, bVal: rb.fuelCosts.annualCost, aWins: a < b, bWins: b < a };
    })(),
    (() => {
      const a = parseDollar(ra.maintenanceReliability.annualCost), b = parseDollar(rb.maintenanceReliability.annualCost);
      return { label: 'Maintenance', aVal: ra.maintenanceReliability.annualCost + '/yr', bVal: rb.maintenanceReliability.annualCost + '/yr', aWins: a < b, bWins: b < a };
    })(),
    (() => {
      const a = reliabilityRank(ra.maintenanceReliability.reliabilityRating), b = reliabilityRank(rb.maintenanceReliability.reliabilityRating);
      return { label: 'Reliability', aVal: reliabilityShort(ra.maintenanceReliability.reliabilityRating), bVal: reliabilityShort(rb.maintenanceReliability.reliabilityRating), aWins: a > b, bWins: b > a };
    })(),
    (() => {
      return { label: 'Smart Buy', aVal: ra.bottomLine.smartBuy ? 'Yes' : 'Caution', bVal: rb.bottomLine.smartBuy ? 'Yes' : 'Caution', aWins: ra.bottomLine.smartBuy && !rb.bottomLine.smartBuy, bWins: rb.bottomLine.smartBuy && !ra.bottomLine.smartBuy };
    })(),
  ];

  return (
    <div className={`rounded-xl border p-5 ${isDark ? 'border-white/[0.07] bg-white/[0.025]' : 'border-black/[0.07] bg-black/[0.02]'}`}>
      <p className={`font-data text-[10px] uppercase tracking-[0.12em] mb-4 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Head-to-Head</p>
      <div className="space-y-1">
        {metrics.map(m => (
          <div key={m.label} className="grid grid-cols-[1fr_64px_1fr] gap-2 items-center py-1.5">
            <p className={`text-[12px] font-data text-right ${m.aWins ? (isDark ? 'text-white font-medium' : 'text-[#0e0e10] font-medium') : (isDark ? 'text-white/35' : 'text-black/35')}`}>
              {m.aVal}{m.aWins ? ' ✓' : ''}
            </p>
            <p className={`font-data text-[9px] uppercase tracking-[0.1em] text-center ${isDark ? 'text-white/25' : 'text-black/25'}`}>{m.label}</p>
            <p className={`text-[12px] font-data ${m.bWins ? (isDark ? 'text-white font-medium' : 'text-[#0e0e10] font-medium') : (isDark ? 'text-white/35' : 'text-black/35')}`}>
              {m.bWins ? '✓ ' : ''}{m.bVal}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Verdict ─────────────────────────────────────────────────────────────────

function Verdict({ carA, carB, theme }: { carA: HistoryItem; carB: HistoryItem; theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  const tcoA = parseDollar(carA.report.totalCostOfOwnership.year3Total);
  const tcoB = parseDollar(carB.report.totalCostOfOwnership.year3Total);
  const costWinner = tcoA < tcoB ? carA : carB;
  const costLoser = tcoA < tcoB ? carB : carA;
  const tcoDiff = Math.abs(tcoA - tcoB);
  const relA = reliabilityRank(carA.report.maintenanceReliability.reliabilityRating);
  const relB = reliabilityRank(carB.report.maintenanceReliability.reliabilityRating);
  const reliabilityWinner = relA > relB ? carA : relB > relA ? carB : null;

  return (
    <div className={`rounded-xl border p-5 ${isDark ? 'border-white/[0.07] bg-white/[0.025]' : 'border-black/[0.07] bg-black/[0.02]'}`}>
      <p className={`font-data text-[10px] uppercase tracking-[0.12em] mb-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>The Verdict</p>
      <p className={`text-sm mb-5 ${isDark ? 'text-white/45' : 'text-black/45'}`}>
        The {costWinner.year} {costWinner.make} {costWinner.model} costs{' '}
        <span className={isDark ? 'text-white font-medium' : 'text-[#0e0e10] font-medium'}>${tcoDiff.toLocaleString()} less</span> over 3 years.
        {reliabilityWinner && reliabilityWinner.vin !== costWinner.vin && ` The ${reliabilityWinner.year} ${reliabilityWinner.make} ${reliabilityWinner.model} has better reliability.`}
      </p>

      <div className="space-y-3">
        {/* Cost winner */}
        <div className="rounded-lg border p-4" style={{ borderColor: 'rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.04)' }}>
          <p className="font-data text-[10px] uppercase tracking-[0.1em] text-green-400 mb-1">If You're Optimizing Cost</p>
          <p className="font-display text-[16px] mb-2" style={{ color: isDark ? '#e8e8ec' : '#0e0e10' }}>
            {costWinner.year} {costWinner.make} {costWinner.model}
            {costWinner.trim ? <em className="text-[#FF5E00] not-italic"> {costWinner.trim}</em> : null}
          </p>
          <p className={`text-[12px] leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>{costWinner.report.bottomLine.verdict}</p>
        </div>

        {/* Experience pick (if different from cost winner) */}
        {(costLoser.report.bottomLine.smartBuy || relA === relB) && (
          <div className="rounded-lg border p-4" style={{ borderColor: 'rgba(255,94,0,0.25)', background: 'rgba(255,94,0,0.03)' }}>
            <p className="font-data text-[10px] uppercase tracking-[0.1em] text-[#FF5E00] mb-1">If Experience Matters More</p>
            <p className="font-display text-[16px] mb-2" style={{ color: isDark ? '#e8e8ec' : '#0e0e10' }}>
              {costLoser.year} {costLoser.make} {costLoser.model}
              {costLoser.trim ? <em className="text-[#FF5E00] not-italic"> {costLoser.trim}</em> : null}
            </p>
            <p className={`text-[12px] leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>{costLoser.report.bottomLine.verdict}</p>
          </div>
        )}
      </div>

      {/* Caveat */}
      <div className={`mt-4 pt-4 border-t font-data text-[11px] leading-relaxed ${isDark ? 'border-white/[0.06] text-white/25' : 'border-black/[0.06] text-black/30'}`}>
        ⚠ Market ranges are AI estimates. Enter a dealer price in the Search tab for deal-specific analysis.
        Get actual insurance quotes before deciding — the difference can be significant.
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function CompareTab({ history, theme }: CompareTabProps) {
  const [vinA, setVinA] = useState('');
  const [vinB, setVinB] = useState('');
  const isDark = theme === 'dark';

  if (history.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <BarChart2 size={36} className={isDark ? 'text-white/15' : 'text-black/15'} />
        <p className={`text-sm font-medium ${isDark ? 'text-white/35' : 'text-black/35'}`}>Nothing to compare yet</p>
        <p className={`text-[13px] text-center max-w-xs ${isDark ? 'text-white/20' : 'text-black/20'}`}>
          Search at least 2 vehicles to use the comparison tool.
        </p>
      </div>
    );
  }

  const carA = history.find(h => h.vin === vinA);
  const carB = history.find(h => h.vin === vinB);

  return (
    <div className="space-y-5">
      {/* Selectors */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SelectCar label="Vehicle A" value={vinA} onChange={setVinA} history={history} exclude={vinB} theme={theme} />
        <SelectCar label="Vehicle B" value={vinB} onChange={setVinB} history={history} exclude={vinA} theme={theme} />
      </div>

      {carA && carB ? (
        <>
          {/* Scorecard */}
          <Scorecard carA={carA} carB={carB} theme={theme} />

          {/* Verdict */}
          <Verdict carA={carA} carB={carB} theme={theme} />

          {/* Divider */}
          <div className={`flex items-center gap-4 ${isDark ? 'text-white/15' : 'text-black/15'}`}>
            <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.07]' : 'bg-black/[0.07]'}`} />
            <span className="font-data text-[10px] uppercase tracking-widest">vehicle details</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.07]' : 'bg-black/[0.07]'}`} />
          </div>

          {/* Car A */}
          <div className={`rounded-xl border p-5 ${isDark ? 'border-white/[0.07] bg-white/[0.025]' : 'border-black/[0.07] bg-black/[0.02]'}`}>
            <CarSection car={carA} theme={theme} />
          </div>

          {/* Car B */}
          <div className={`rounded-xl border p-5 ${isDark ? 'border-white/[0.07] bg-white/[0.025]' : 'border-black/[0.07] bg-black/[0.02]'}`}>
            <CarSection car={carB} theme={theme} />
          </div>
        </>
      ) : (
        <div className={`rounded-xl border p-10 text-center ${isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'}`}>
          <p className={`text-sm ${isDark ? 'text-white/25' : 'text-black/25'}`}>Select two vehicles above to compare them.</p>
        </div>
      )}
    </div>
  );
}
