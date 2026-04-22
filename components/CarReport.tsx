'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import EmailCapture from './EmailCapture';
import { CarReport as CarReportType, VehicleData } from '@/lib/types';
import { getDealerPrice, saveDealerPrice, getMileage, saveMileage } from '@/lib/storage';

interface CarReportProps {
  report: CarReportType;
  vehicle: VehicleData;
  theme: 'dark' | 'light';
  proseLoading?: boolean;
}

// ─── Static data (defined once at module level, not per-render) ──────────────

const MAKE_DOMAIN_MAP: Record<string, string> = {
  toyota: 'toyota.com', honda: 'honda.com', ford: 'ford.com',
  chevrolet: 'chevrolet.com', chevy: 'chevrolet.com', gmc: 'gmc.com',
  dodge: 'dodge.com', chrysler: 'chrysler.com', jeep: 'jeep.com',
  ram: 'ramtrucks.com', nissan: 'nissanusa.com', hyundai: 'hyundaiusa.com',
  kia: 'kia.com', subaru: 'subaru.com', volkswagen: 'vw.com',
  bmw: 'bmw.com', mercedes: 'mercedes-benz.com', 'mercedes-benz': 'mercedes-benz.com',
  audi: 'audi.com', lexus: 'lexus.com', acura: 'acura.com',
  infiniti: 'infinitiusa.com', cadillac: 'cadillac.com', lincoln: 'lincoln.com',
  buick: 'buick.com', volvo: 'volvocars.com', mazda: 'mazdausa.com',
  mitsubishi: 'mitsubishicars.com', porsche: 'porsche.com', tesla: 'tesla.com',
  genesis: 'genesis.com', maserati: 'maserati.com', jaguar: 'jaguar.com',
  'land rover': 'landrover.com', mini: 'miniusa.com', fiat: 'fiatusa.com',
  alfa: 'alfaromeousa.com',
};

// ─── Utilities ───────────────────────────────────────────────────────────────

function parseDollar(s: string): number {
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function formatDollar(n: number): string {
  return '$' + Math.round(n).toLocaleString();
}

function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.replace(/^[\s\-•*·]+/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(s => s.length > 8);
}

function reliabilityColor(r: string): string {
  const s = r.toLowerCase();
  if (s.startsWith('excellent') || s.startsWith('good')) return '#22c55e';
  if (s.includes('below') || s.startsWith('poor')) return '#ef4444';
  return '#f59e0b';
}

function reliabilityShort(r: string): string {
  return r.split(/[.,—\-]/)[0].trim();
}

function calcMonthlyPayment(principal: number, annualRatePct: number, months: number): string {
  const r = annualRatePct / 100 / 12;
  const payment = principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return '$' + Math.round(payment).toLocaleString();
}

function getDealAnalysis(dealerPrice: number, marketLow: number, marketHigh: number) {
  const deltaFromLow = dealerPrice - marketLow;
  const deltaFromHigh = dealerPrice - marketHigh;
  const fmt = (n: number) => formatDollar(Math.abs(n));
  if (dealerPrice <= marketLow) return { rating: 'Great Deal', color: '#22c55e', deltaLabel: `${fmt(deltaFromLow)} below market` };
  if (dealerPrice <= marketHigh) return { rating: 'Fair Deal', color: '#f59e0b', deltaLabel: 'Within market range' };
  if (deltaFromHigh <= marketHigh * 0.10) return { rating: 'Overpriced', color: '#f97316', deltaLabel: `${fmt(deltaFromHigh)} above market` };
  return { rating: 'Walk Away', color: '#ef4444', deltaLabel: `${fmt(deltaFromHigh)} above market` };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Flag({ type, children, theme }: { type: 'green' | 'yellow' | 'red'; children: React.ReactNode; theme: 'dark' | 'light' }) {
  const s = {
    green: { bg: 'rgba(34,197,94,0.05)', border: 'rgba(34,197,94,0.18)', icon: '🟢' },
    yellow: { bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.18)', icon: '🟡' },
    red:   { bg: 'rgba(239,68,68,0.05)',   border: 'rgba(239,68,68,0.18)',   icon: '🔴' },
  }[type];
  return (
    <div className="flex gap-2.5 items-start px-3 py-2.5 rounded-lg text-[13px] leading-relaxed mb-2 last:mb-0"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="flex-shrink-0 text-xs mt-0.5">{s.icon}</span>
      <span className={theme === 'dark' ? 'text-white/70' : 'text-black/70'}>{children}</span>
    </div>
  );
}

function CostRow({ label, value, highlight, theme }: { label: string; value: string; highlight?: boolean; theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div className={`flex justify-between items-baseline py-2.5 border-b last:border-0 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
      <span className={`text-sm ${highlight ? (isDark ? 'text-white font-medium' : 'text-[#0e0e10] font-medium') : (isDark ? 'text-white/50' : 'text-black/50')}`}>{label}</span>
      <span className={`font-data text-sm font-medium ${highlight ? 'text-[#00B4FF]' : isDark ? 'text-white' : 'text-[#0e0e10]'}`}>{value}</span>
    </div>
  );
}

function Section({ label, children, theme }: { label: string; children: React.ReactNode; theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div className={`rounded-xl p-5 ${isDark ? 'steel-card' : 'light-card'}`}>
      <p className={`font-data text-[10px] uppercase tracking-[0.12em] mb-4 ${isDark ? 'text-white/30' : 'text-black/30'}`}>{label}</p>
      {children}
    </div>
  );
}

function Stat({ label, value, accent, dim, theme }: { label: string; value: string; accent?: boolean; dim?: boolean; theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div>
      <p className={`font-data text-[10px] uppercase tracking-[0.08em] mb-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>{label}</p>
      <p className={`font-data text-lg font-medium ${accent ? 'text-[#00B4FF]' : dim ? (isDark ? 'text-white/50' : 'text-black/50') : isDark ? 'text-white' : 'text-[#0e0e10]'}`}>
        {value}
      </p>
    </div>
  );
}

function AnalyzeButton({ onClick, loading, error, theme }: { onClick: () => void; loading: boolean; error?: boolean; theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  return (
    <>
      {error && (
        <p className="mt-3 text-center font-data text-[11px] text-red-400/80">Analysis failed — tap to retry</p>
      )}
      <button
        onClick={onClick}
        disabled={loading}
        className={`mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border font-data text-[11px] uppercase tracking-wider transition-all active:scale-95 ${
          loading
            ? isDark ? 'border-white/[0.07] text-white/25 cursor-wait' : 'border-black/[0.07] text-black/25 cursor-wait'
            : error
              ? 'border-red-400/40 text-red-400/70 hover:border-red-400/70 hover:text-red-400'
              : isDark
                ? 'border-white/[0.1] text-white/40 hover:border-[#00B4FF]/60 hover:text-[#00B4FF] hover:bg-[#00B4FF]/[0.04]'
                : 'border-black/[0.1] text-black/40 hover:border-[#00B4FF]/60 hover:text-[#00B4FF] hover:bg-[#00B4FF]/[0.04]'
        }`}
      >
        {loading ? (
          <>
            <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            Analyzing…
          </>
        ) : error ? '↺ Retry Analysis' : '↓ Get Analysis'}
      </button>
    </>
  );
}

function AffiliateCTA({ label, href, theme, trackingId }: { label: string; href: string; theme: 'dark' | 'light'; trackingId: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      onClick={() => console.log(`[Carbide CTA Click] id=${trackingId}`)}
      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mt-4 rounded-lg border border-[#00B4FF]/50 text-[#00B4FF] font-data text-xs uppercase tracking-wider hover:bg-[#00B4FF] hover:text-white transition-all active:scale-95"
    >
      {label} <ExternalLink size={12} />
    </a>
  );
}

// ─── Section analysis state types ────────────────────────────────────────────

type SectionKey = 'purchase' | 'financing' | 'insurance' | 'fuel' | 'depreciation' | 'verdict' | 'features' | 'maintenance';

interface SectionData {
  analysis?: string;
  overview?: string;
  specs?: string;
  verdict?: string;
  watchOut?: string;
  askDealer?: string;
  // features section
  tech?: string[];
  sport?: string[];
  trimAdvantage?: string;
  // maintenance section
  dueSoon?: string[];
  upcoming?: string[];
  criticalNote?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CarReport({ report, vehicle, theme }: CarReportProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [dealerPriceInput, setDealerPriceInput] = useState('');
  const [analyzedDealerPrice, setAnalyzedDealerPrice] = useState<number | null>(null);
  const [mileageInput, setMileageInput] = useState('');
  const [actualMileage, setActualMileage] = useState<number | null>(null);
  const [sectionData, setSectionData] = useState<Partial<Record<SectionKey, SectionData>>>({});
  const [sectionLoading, setSectionLoading] = useState<Partial<Record<SectionKey, boolean>>>({});
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<SectionKey, boolean>>>({});

  // Pre-populate from existing report prose (loaded from history)
  useEffect(() => {
    const prefilled: Partial<Record<SectionKey, SectionData>> = {};
    if (report.purchasePriceContext.analysis)
      prefilled.purchase = { analysis: report.purchasePriceContext.analysis };
    if (report.financingEstimate.analysis)
      prefilled.financing = { analysis: report.financingEstimate.analysis };
    if (report.insuranceEstimate.analysis)
      prefilled.insurance = { analysis: report.insuranceEstimate.analysis };
    if (report.fuelCosts.analysis)
      prefilled.fuel = { analysis: report.fuelCosts.analysis };
    if (report.depreciationResidualValue.analysis)
      prefilled.depreciation = { analysis: report.depreciationResidualValue.analysis };
    if (report.bottomLine.verdict)
      prefilled.verdict = {
        overview: report.vehicleSummary?.overview,
        specs: report.vehicleSummary?.specs,
        verdict: report.bottomLine.verdict,
        watchOut: report.bottomLine.watchOut,
        askDealer: report.bottomLine.askDealer,
      };
    if (Object.keys(prefilled).length > 0) setSectionData(prefilled);
  }, [report]);

  // Load persisted dealer price + mileage
  useEffect(() => {
    const savedPrice = getDealerPrice(vehicle.vin);
    if (savedPrice) {
      setDealerPriceInput(savedPrice.toLocaleString());
      setAnalyzedDealerPrice(savedPrice);
    }
    const savedMiles = getMileage(vehicle.vin);
    if (savedMiles) {
      setMileageInput(savedMiles.toLocaleString());
      setActualMileage(savedMiles);
    }
  }, [vehicle.vin]);

  // Brand logo watermark
  useEffect(() => {
    const domain = MAKE_DOMAIN_MAP[vehicle.make.toLowerCase()] || `${vehicle.make.toLowerCase().replace(/\s+/g, '')}.com`;
    const url = `https://logo.clearbit.com/${domain}`;
    const img = new Image();
    img.onload = () => setLogoUrl(url);
    img.onerror = () => setLogoUrl(null);
    img.src = url;
  }, [vehicle.make]);

  const analyzeSection = useCallback(async (section: SectionKey) => {
    setSectionLoading(prev => ({ ...prev, [section]: true }));
    setSectionErrors(prev => ({ ...prev, [section]: false }));
    try {
      const res = await fetch('/api/enrich-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle, numbers: report, section, mileage: actualMileage ?? undefined }),
      });
      const data = await res.json();
      if (res.ok && data.prose) {
        const prose = data.prose;
        let flat: SectionData = {};
        if (section === 'purchase')     flat = { analysis: prose.purchasePriceContext?.analysis };
        if (section === 'financing')    flat = { analysis: prose.financingEstimate?.analysis };
        if (section === 'insurance')    flat = { analysis: prose.insuranceEstimate?.analysis };
        if (section === 'fuel')         flat = { analysis: prose.fuelCosts?.analysis };
        if (section === 'depreciation') flat = { analysis: prose.depreciationResidualValue?.analysis };
        if (section === 'verdict')      flat = {
          overview:  prose.vehicleSummary?.overview,
          specs:     prose.vehicleSummary?.specs,
          verdict:   prose.bottomLine?.verdict,
          watchOut:  prose.bottomLine?.watchOut,
          askDealer: prose.bottomLine?.askDealer,
        };
        if (section === 'features')     flat = {
          tech:          prose.keyFeatures?.tech,
          sport:         prose.keyFeatures?.sport,
          trimAdvantage: prose.keyFeatures?.trimAdvantage,
        };
        if (section === 'maintenance')  flat = {
          dueSoon:      prose.maintenance?.dueSoon,
          upcoming:     prose.maintenance?.upcoming,
          criticalNote: prose.maintenance?.criticalNote,
        };
        setSectionData(prev => ({ ...prev, [section]: flat }));
      } else {
        setSectionErrors(prev => ({ ...prev, [section]: true }));
      }
    } catch {
      setSectionErrors(prev => ({ ...prev, [section]: true }));
    } finally {
      setSectionLoading(prev => ({ ...prev, [section]: false }));
    }
  }, [vehicle, report, actualMileage]);

  const isDark = theme === 'dark';
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - parseInt(vehicle.year);
  const estimatedMiles = vehicleAge * 12500;
  const displayMileage = actualMileage
    ? actualMileage.toLocaleString() + ' miles'
    : '~' + estimatedMiles.toLocaleString() + ' miles est.';
  const marketLow  = parseDollar(report.purchasePriceContext.fairMarketLow);
  const marketHigh = parseDollar(report.purchasePriceContext.fairMarketHigh);
  const dealAnalysis = analyzedDealerPrice !== null
    ? getDealAnalysis(analyzedDealerPrice, marketLow, marketHigh) : null;

  const knownIssueLines = parseLines(report.maintenanceReliability.knownIssues);
  const relColor  = reliabilityColor(report.maintenanceReliability.reliabilityRating);
  const relShort  = reliabilityShort(report.maintenanceReliability.reliabilityRating);
  const relIsGood = relColor === '#22c55e';

  const monthly60 = analyzedDealerPrice
    ? calcMonthlyPayment(analyzedDealerPrice, 7.5, 60)
    : report.financingEstimate.monthlyGoodCredit60;

  const tcoMidpointDelta = analyzedDealerPrice !== null
    ? analyzedDealerPrice - (marketLow + marketHigh) / 2 : 0;

  return (
    <div className="relative">
      {/* Logo watermark */}
      {logoUrl && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-0 overflow-hidden" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" className="w-[70vw] max-w-[500px] object-contain"
            style={{ opacity: 0.04, filter: isDark ? 'invert(1)' : 'none' }} />
        </div>
      )}

      <div className="relative z-10 space-y-4">

        {/* ── Vehicle header ── */}
        <div className={`rounded-xl border-2 border-[#00B4FF] px-5 py-5 ${isDark ? 'bg-[#00B4FF]/[0.04]' : 'bg-[#00B4FF]/[0.04]'}`}>
          <p className="font-data text-[10px] text-[#00B4FF] uppercase tracking-[0.15em] mb-1">
            {vehicle.year} · {vehicle.make}
          </p>
          <h1 className="font-display text-[26px] leading-tight" style={{ color: isDark ? '#e8e8ec' : '#0e0e10' }}>
            {vehicle.model}
            {vehicle.trim && <em className="text-[#00B4FF] not-italic"> {vehicle.trim}</em>}
          </h1>
          <div className={`flex items-center gap-3 mt-1.5 font-data text-[11px] ${isDark ? 'text-white/25' : 'text-black/25'}`}>
            <span>Market: {report.purchasePriceContext.fairMarketLow} – {report.purchasePriceContext.fairMarketHigh}</span>
            <span>·</span>
            <span style={{ color: actualMileage ? '#00B4FF' : undefined }}>{displayMileage}</span>
          </div>
          <div className="mt-3">
            {report.bottomLine.smartBuy ? (
              <span className="inline-flex items-center gap-1.5 font-data text-[11px] px-2.5 py-1 rounded-full"
                style={{ color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <CheckCircle size={11} /> Smart Buy
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-data text-[11px] px-2.5 py-1 rounded-full"
                style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <XCircle size={11} /> Proceed with Caution
              </span>
            )}
          </div>
        </div>

        {/* ── Dealer price + deal badge ── */}
        <div className={`rounded-xl p-4 ${isDark ? 'steel-card' : 'light-card'}`}>
          <p className={`font-data text-[10px] uppercase tracking-[0.12em] mb-3 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
            Your Numbers — Optional
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-data text-sm pointer-events-none ${isDark ? 'text-white/30' : 'text-black/30'}`}>$</span>
              <input
                type="text" inputMode="numeric" placeholder="Dealer asking price"
                value={dealerPriceInput}
                onChange={(e) => {
                  setDealerPriceInput(e.target.value.replace(/[^0-9,]/g, ''));
                  if (analyzedDealerPrice !== null) setAnalyzedDealerPrice(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const p = parseDollar(dealerPriceInput);
                    if (p > 0) { setAnalyzedDealerPrice(p); saveDealerPrice(vehicle.vin, p); }
                  }
                }}
                className={`w-full pl-7 pr-4 py-2.5 rounded-lg font-data text-sm border outline-none focus:border-[#00B4FF] transition-colors ${
                  isDark ? 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/20'
                         : 'bg-white border-black/15 text-[#0e0e10] placeholder:text-black/25'}`}
              />
            </div>
            <button
              onClick={() => {
                const p = parseDollar(dealerPriceInput);
                if (p > 0) { setAnalyzedDealerPrice(p); saveDealerPrice(vehicle.vin, p); }
              }}
              disabled={parseDollar(dealerPriceInput) <= 0}
              className="px-4 py-2.5 rounded-lg bg-[#00B4FF] text-white font-data text-xs uppercase tracking-wider hover:bg-[#0099e0] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Analyze
            </button>
          </div>
          {/* Mileage input */}
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <input
                type="text" inputMode="numeric" placeholder="Actual mileage (e.g. 47,000)"
                value={mileageInput}
                onChange={(e) => setMileageInput(e.target.value.replace(/[^0-9,]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const m = parseDollar(mileageInput);
                    if (m > 0) { setActualMileage(m); saveMileage(vehicle.vin, m); }
                  }
                }}
                className={`w-full px-4 py-2.5 rounded-lg font-data text-sm border outline-none focus:border-[#00B4FF] transition-colors ${
                  isDark ? 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/20'
                         : 'bg-white border-black/15 text-[#0e0e10] placeholder:text-black/25'}`}
              />
            </div>
            <button
              onClick={() => {
                const m = parseDollar(mileageInput);
                if (m > 0) { setActualMileage(m); saveMileage(vehicle.vin, m); }
              }}
              disabled={parseDollar(mileageInput) <= 0}
              className="px-4 py-2.5 rounded-lg bg-[#00B4FF] text-white font-data text-xs uppercase tracking-wider hover:bg-[#0099e0] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Save
            </button>
          </div>

          {dealAnalysis && analyzedDealerPrice !== null && (
            <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t"
              style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}>
              <p className="font-display text-[22px]" style={{ color: dealAnalysis.color }}>{dealAnalysis.rating}</p>
              <div className="text-right">
                <p className="font-data text-sm font-medium" style={{ color: dealAnalysis.color }}>{dealAnalysis.deltaLabel}</p>
                <p className={`font-data text-[11px] mt-0.5 ${isDark ? 'text-white/25' : 'text-black/25'}`}>
                  vs. {report.purchasePriceContext.fairMarketLow}–{report.purchasePriceContext.fairMarketHigh} market range
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className={`rounded-xl p-4 ${isDark ? 'steel-inner' : 'light-inner'}`}>
            <p className={`font-data text-[10px] uppercase tracking-[0.1em] mb-2 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              {analyzedDealerPrice ? 'Monthly (your price)' : 'Monthly Payment'}
            </p>
            <p className="font-data text-[22px] font-medium leading-none text-[#00B4FF]">
              {monthly60}<span className={`text-xs ml-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>/mo</span>
            </p>
            <p className={`text-[11px] mt-1.5 ${isDark ? 'text-white/25' : 'text-black/25'}`}>good credit · 60 months</p>
          </div>
          <div className={`rounded-xl p-4 ${isDark ? 'steel-inner' : 'light-inner'}`}>
            <p className={`font-data text-[10px] uppercase tracking-[0.1em] mb-2 ${isDark ? 'text-white/30' : 'text-black/30'}`}>3-Year TCO</p>
            <p className="font-data text-[22px] font-medium leading-none text-[#00B4FF]">
              {analyzedDealerPrice
                ? formatDollar(parseDollar(report.totalCostOfOwnership.year3Total) + tcoMidpointDelta)
                : report.totalCostOfOwnership.year3Total}
            </p>
            <p className={`text-[11px] mt-1.5 ${isDark ? 'text-white/25' : 'text-black/25'}`}>total cost of ownership</p>
          </div>
        </div>

        {/* ── Cost breakdown ── */}
        <div className={`rounded-xl p-5 ${isDark ? 'steel-card' : 'light-card'}`}>
          <p className={`font-data text-[10px] uppercase tracking-[0.12em] mb-3 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Cost Breakdown</p>
          {analyzedDealerPrice !== null && (
            <CostRow label="Dealer asking price" value={formatDollar(analyzedDealerPrice)} theme={theme} />
          )}
          <CostRow label={`Monthly payment · good credit · 60mo`} value={monthly60 + '/mo'} theme={theme} />
          <CostRow
            label="Insurance (est. annual)"
            value={'~' + formatDollar(Math.round(((parseDollar(report.insuranceEstimate.monthlyLow) + parseDollar(report.insuranceEstimate.monthlyHigh)) / 2) * 12 / 100) * 100)}
            theme={theme}
          />
          <CostRow label="Fuel (annual)" value={report.fuelCosts.annualCost} theme={theme} />
          <CostRow label="Maintenance (annual)" value={report.maintenanceReliability.annualCost} theme={theme} />
          <CostRow
            label="Year 1 All-In"
            value={analyzedDealerPrice !== null
              ? formatDollar(parseDollar(report.totalCostOfOwnership.year1Total) + tcoMidpointDelta)
              : report.totalCostOfOwnership.year1Total}
            theme={theme}
          />
          <CostRow
            label="3-Year Total"
            value={analyzedDealerPrice !== null
              ? formatDollar(parseDollar(report.totalCostOfOwnership.year3Total) + tcoMidpointDelta)
              : report.totalCostOfOwnership.year3Total}
            highlight theme={theme}
          />
        </div>

        {/* ── Flags ── */}
        <div className={`rounded-xl p-5 ${isDark ? 'steel-card' : 'light-card'}`}>
          <p className={`font-data text-[10px] uppercase tracking-[0.12em] mb-3 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Flags</p>
          {relIsGood && <Flag type="green" theme={theme}><strong>Reliability:</strong> {relShort}</Flag>}
          {knownIssueLines.map((issue, i) => <Flag key={i} type="yellow" theme={theme}>{issue}</Flag>)}
          <Flag type="red" theme={theme}><strong>Major Risk:</strong> {report.maintenanceReliability.majorRisks}</Flag>
        </div>

        {/* ─── On-demand deep analysis ─────────────────────────────────────── */}

        {/* Purchase Price Context */}
        <Section label="Purchase Price Context" theme={theme}>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Market Low" value={report.purchasePriceContext.fairMarketLow} accent theme={theme} />
            <Stat label="Market High" value={report.purchasePriceContext.fairMarketHigh} accent theme={theme} />
          </div>
          {sectionData.purchase?.analysis
            ? <p className={`text-sm leading-relaxed mt-4 ${isDark ? 'text-white/60' : 'text-black/60'}`}>{sectionData.purchase.analysis}</p>
            : <AnalyzeButton onClick={() => analyzeSection('purchase')} loading={!!sectionLoading.purchase} error={!!sectionErrors.purchase} theme={theme} />}
        </Section>

        {/* Financing */}
        <Section label="Financing Estimate" theme={theme}>
          {(() => {
            const p = analyzedDealerPrice;
            const gc60 = p ? calcMonthlyPayment(p, 7.5, 60)  : report.financingEstimate.monthlyGoodCredit60;
            const gc72 = p ? calcMonthlyPayment(p, 7.5, 72)  : report.financingEstimate.monthlyGoodCredit72;
            const fc60 = p ? calcMonthlyPayment(p, 11,  60)  : report.financingEstimate.monthlyFairCredit60;
            const fc72 = p ? calcMonthlyPayment(p, 11,  72)  : report.financingEstimate.monthlyFairCredit72;
            return (
              <div className="grid grid-cols-2 gap-2.5">
                <div className={`rounded-lg p-3 ${isDark ? 'steel-inner' : 'light-inner'}`}>
                  <p className={`font-data text-[10px] uppercase tracking-[0.08em] mb-3 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Good Credit (720+)</p>
                  <Stat label="60 months" value={gc60 + '/mo'} accent theme={theme} />
                  <div className="mt-2"><Stat label="72 months" value={gc72 + '/mo'} theme={theme} /></div>
                </div>
                <div className={`rounded-lg p-3 ${isDark ? 'steel-inner' : 'light-inner'}`}>
                  <p className={`font-data text-[10px] uppercase tracking-[0.08em] mb-3 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Fair Credit (620–719)</p>
                  <Stat label="60 months" value={fc60 + '/mo'} accent theme={theme} />
                  <div className="mt-2"><Stat label="72 months" value={fc72 + '/mo'} theme={theme} /></div>
                </div>
              </div>
            );
          })()}
          {sectionData.financing?.analysis
            ? <p className={`text-sm leading-relaxed mt-4 ${isDark ? 'text-white/60' : 'text-black/60'}`}>{sectionData.financing.analysis}</p>
            : <AnalyzeButton onClick={() => analyzeSection('financing')} loading={!!sectionLoading.financing} error={!!sectionErrors.financing} theme={theme} />}
          <AffiliateCTA label="See real loan rates for this vehicle" href="https://www.lendingtree.com/auto/?source=carbide" theme={theme} trackingId="financing-cta" />
        </Section>

        {/* Insurance */}
        <Section label="Insurance Estimate" theme={theme}>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Monthly Low" value={report.insuranceEstimate.monthlyLow + '/mo'} theme={theme} />
            <Stat label="Monthly High" value={report.insuranceEstimate.monthlyHigh + '/mo'} accent theme={theme} />
          </div>
          {sectionData.insurance?.analysis
            ? <p className={`text-sm leading-relaxed mt-4 ${isDark ? 'text-white/60' : 'text-black/60'}`}>{sectionData.insurance.analysis}</p>
            : <AnalyzeButton onClick={() => analyzeSection('insurance')} loading={!!sectionLoading.insurance} error={!!sectionErrors.insurance} theme={theme} />}
          <AffiliateCTA label="Get a real insurance quote" href="https://www.thezebra.com/?source=carbide" theme={theme} trackingId="insurance-cta" />
        </Section>

        {/* Fuel */}
        <Section label="Fuel Costs" theme={theme}>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Stat label="City" value={report.fuelCosts.mpgCity + ' mpg'} theme={theme} />
            <Stat label="Highway" value={report.fuelCosts.mpgHighway + ' mpg'} theme={theme} />
            <Stat label="Combined" value={report.fuelCosts.mpgCombined + ' mpg'} accent theme={theme} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Monthly" value={report.fuelCosts.monthlyCost} accent theme={theme} />
            <Stat label="Annual" value={report.fuelCosts.annualCost} accent theme={theme} />
          </div>
          {sectionData.fuel?.analysis
            ? <p className={`text-sm leading-relaxed mt-4 ${isDark ? 'text-white/60' : 'text-black/60'}`}>{sectionData.fuel.analysis}</p>
            : <AnalyzeButton onClick={() => analyzeSection('fuel')} loading={!!sectionLoading.fuel} error={!!sectionErrors.fuel} theme={theme} />}
        </Section>

        {/* Depreciation */}
        <Section label="Depreciation & Residual Value" theme={theme}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Now" value={report.depreciationResidualValue.currentValue} theme={theme} />
            <Stat label="1 Year" value={report.depreciationResidualValue.value1Year} dim theme={theme} />
            <Stat label="3 Years" value={report.depreciationResidualValue.value3Year} accent theme={theme} />
            <Stat label="5 Years" value={report.depreciationResidualValue.value5Year} accent theme={theme} />
          </div>
          {sectionData.depreciation?.analysis
            ? <p className={`text-sm leading-relaxed mt-4 ${isDark ? 'text-white/60' : 'text-black/60'}`}>{sectionData.depreciation.analysis}</p>
            : <AnalyzeButton onClick={() => analyzeSection('depreciation')} loading={!!sectionLoading.depreciation} error={!!sectionErrors.depreciation} theme={theme} />}
        </Section>

        {/* Key Features */}
        <Section label="Key Features" theme={theme}>
          {sectionData.features ? (
            <div className="space-y-4">
              {sectionData.features.tech && sectionData.features.tech.length > 0 && (
                <div>
                  <p className={`font-data text-[10px] uppercase tracking-[0.1em] mb-2 text-[#00B4FF]`}>Tech</p>
                  <ul className="space-y-1.5">
                    {sectionData.features.tech.map((f, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[#00B4FF] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sectionData.features.sport && sectionData.features.sport.length > 0 && (
                <div>
                  <p className={`font-data text-[10px] uppercase tracking-[0.1em] mb-2 text-[#00B4FF]`}>Sport</p>
                  <ul className="space-y-1.5">
                    {sectionData.features.sport.map((f, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[#00B4FF] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sectionData.features.trimAdvantage && (
                <div className={`pt-3 border-t ${isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'}`}>
                  <p className={`font-data text-[10px] uppercase tracking-[0.1em] mb-2 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Why This Trim Over Base</p>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>{sectionData.features.trimAdvantage}</p>
                </div>
              )}
            </div>
          ) : (
            <AnalyzeButton onClick={() => analyzeSection('features')} loading={!!sectionLoading.features} error={!!sectionErrors.features} theme={theme} />
          )}
        </Section>

        {/* Maintenance Schedule */}
        <Section label={`Maintenance Schedule${actualMileage ? ` · ${actualMileage.toLocaleString()} miles` : ' · Estimated Mileage'}`} theme={theme}>
          {sectionData.maintenance ? (
            <div className="space-y-4">
              {sectionData.maintenance.criticalNote && (
                <div className="flex gap-2.5 px-3 py-2.5 rounded-lg text-[13px] leading-relaxed"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)' }}>
                  <span className="flex-shrink-0 text-xs mt-0.5">⚠️</span>
                  <span className={isDark ? 'text-white/70' : 'text-black/70'}>{sectionData.maintenance.criticalNote}</span>
                </div>
              )}
              {sectionData.maintenance.dueSoon && sectionData.maintenance.dueSoon.length > 0 && (
                <div>
                  <p className="font-data text-[10px] uppercase tracking-[0.1em] mb-2 text-red-400">Due Now</p>
                  <ul className="space-y-1.5">
                    {sectionData.maintenance.dueSoon.map((item, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sectionData.maintenance.upcoming && sectionData.maintenance.upcoming.length > 0 && (
                <div className={`pt-3 border-t ${isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'}`}>
                  <p className="font-data text-[10px] uppercase tracking-[0.1em] mb-2 text-[#00B4FF]">Coming Up</p>
                  <ul className="space-y-1.5">
                    {sectionData.maintenance.upcoming.map((item, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[#00B4FF] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {!actualMileage && (
                <p className={`text-xs mb-3 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                  Enter your actual mileage above for a more accurate schedule.
                </p>
              )}
              <AnalyzeButton onClick={() => analyzeSection('maintenance')} loading={!!sectionLoading.maintenance} error={!!sectionErrors.maintenance} theme={theme} />
            </>
          )}
        </Section>

        {/* The Verdict */}
        <div className={`rounded-xl border-2 p-5 ${report.bottomLine.smartBuy ? 'border-[#00B4FF]/40 bg-[#00B4FF]/[0.03]' : 'border-red-500/40 bg-red-500/[0.03]'}`}>
          <div className="flex items-center gap-2.5 mb-4">
            {report.bottomLine.smartBuy
              ? <CheckCircle size={18} className="text-[#00B4FF] flex-shrink-0" />
              : <XCircle size={18} className="text-red-400 flex-shrink-0" />}
            <p className={`font-data text-[10px] uppercase tracking-[0.12em] ${isDark ? 'text-white/30' : 'text-black/30'}`}>The Verdict</p>
          </div>
          {sectionData.verdict ? (
            <>
              {sectionData.verdict.overview && (
                <p className={`text-sm leading-relaxed mb-3 ${isDark ? 'text-white/55' : 'text-black/55'}`}>{sectionData.verdict.overview}</p>
              )}
              <p className={`text-sm leading-relaxed mb-5 ${isDark ? 'text-white/85' : 'text-black/85'}`}>{sectionData.verdict.verdict}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className={`rounded-lg p-4 ${isDark ? 'steel-inner' : 'light-inner'}`}>
                  <p className="font-data text-[10px] uppercase tracking-[0.1em] text-[#00B4FF] mb-2">Watch Out For</p>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>{sectionData.verdict.watchOut}</p>
                </div>
                <div className={`rounded-lg p-4 ${isDark ? 'steel-inner' : 'light-inner'}`}>
                  <p className="font-data text-[10px] uppercase tracking-[0.1em] text-[#00B4FF] mb-2">Ask The Dealer</p>
                  <p className={`text-sm leading-relaxed whitespace-pre-line ${isDark ? 'text-white/65' : 'text-black/65'}`}>{sectionData.verdict.askDealer}</p>
                </div>
              </div>
            </>
          ) : (
            <AnalyzeButton onClick={() => analyzeSection('verdict')} loading={!!sectionLoading.verdict} error={!!sectionErrors.verdict} theme={theme} />
          )}
        </div>

        <EmailCapture theme={theme} vehicle={vehicle} />
      </div>
    </div>
  );
}
