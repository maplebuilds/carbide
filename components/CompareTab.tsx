'use client';

import { BarChart2, ChevronDown } from 'lucide-react';
import { HistoryItem } from '@/lib/types';
import { useState } from 'react';

interface CompareTabProps {
  history: HistoryItem[];
  theme: 'dark' | 'light';
}

function SelectCar({
  label,
  value,
  onChange,
  history,
  exclude,
  theme,
}: {
  label: string;
  value: string;
  onChange: (vin: string) => void;
  history: HistoryItem[];
  exclude: string;
  theme: 'dark' | 'light';
}) {
  const isDark = theme === 'dark';
  return (
    <div className="flex-1 min-w-0">
      <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isDark ? 'text-white/40' : 'text-black/40'}`}>
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none px-4 py-3 pr-10 rounded-lg border text-sm font-medium outline-none transition-colors ${
            isDark
              ? 'bg-white/5 border-white/10 text-white focus:border-[#FF5E00]/60'
              : 'bg-black/5 border-black/10 text-[#1a1a1a] focus:border-[#FF5E00]/60'
          }`}
        >
          <option value="">Select a vehicle...</option>
          {history
            .filter((h) => h.vin !== exclude)
            .map((h) => (
              <option key={h.vin} value={h.vin}>
                {h.year} {h.make} {h.model} {h.trim}
              </option>
            ))}
        </select>
        <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-white/40' : 'text-black/40'}`} />
      </div>
    </div>
  );
}

interface MetricRow {
  label: string;
  getValue: (item: HistoryItem) => string;
  isAccent?: boolean;
}

const METRICS: MetricRow[] = [
  { label: 'Fair Market Price', getValue: (i) => `${i.report.purchasePriceContext.fairMarketLow} – ${i.report.purchasePriceContext.fairMarketHigh}` },
  { label: 'Monthly Payment (Good Credit, 60mo)', getValue: (i) => i.report.financingEstimate.monthlyGoodCredit60 + '/mo' },
  { label: 'Monthly Payment (Fair Credit, 60mo)', getValue: (i) => i.report.financingEstimate.monthlyFairCredit60 + '/mo' },
  { label: 'Insurance (Monthly Range)', getValue: (i) => `${i.report.insuranceEstimate.monthlyLow} – ${i.report.insuranceEstimate.monthlyHigh}/mo` },
  { label: 'Monthly Fuel Cost', getValue: (i) => i.report.fuelCosts.monthlyCost + '/mo' },
  { label: 'Annual Fuel Cost', getValue: (i) => i.report.fuelCosts.annualCost },
  { label: 'Combined MPG', getValue: (i) => i.report.fuelCosts.mpgCombined + ' MPG' },
  { label: 'Annual Maintenance', getValue: (i) => i.report.maintenanceReliability.annualCost, isAccent: false },
  { label: 'Reliability', getValue: (i) => i.report.maintenanceReliability.reliabilityRating },
  { label: 'Value in 3 Years', getValue: (i) => i.report.depreciationResidualValue.value3Year },
  { label: 'Value in 5 Years', getValue: (i) => i.report.depreciationResidualValue.value5Year },
  { label: '1-Year Total Cost', getValue: (i) => i.report.totalCostOfOwnership.year1Total, isAccent: true },
  { label: '3-Year Total Cost', getValue: (i) => i.report.totalCostOfOwnership.year3Total, isAccent: true },
  { label: 'Smart Buy?', getValue: (i) => i.report.bottomLine.smartBuy ? '✓ Yes' : '✗ Caution' },
];

export default function CompareTab({ history, theme }: CompareTabProps) {
  const [vinA, setVinA] = useState('');
  const [vinB, setVinB] = useState('');

  const isDark = theme === 'dark';

  if (history.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <BarChart2 size={40} className={isDark ? 'text-white/20' : 'text-black/20'} />
        <p className={`text-base font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>Nothing to compare yet</p>
        <p className={`text-sm text-center max-w-xs ${isDark ? 'text-white/25' : 'text-black/25'}`}>
          Search at least 2 vehicles to use the comparison tool.
        </p>
      </div>
    );
  }

  const carA = history.find((h) => h.vin === vinA);
  const carB = history.find((h) => h.vin === vinB);

  return (
    <div>
      {/* Selectors */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SelectCar label="Vehicle A" value={vinA} onChange={setVinA} history={history} exclude={vinB} theme={theme} />
        <SelectCar label="Vehicle B" value={vinB} onChange={setVinB} history={history} exclude={vinA} theme={theme} />
      </div>

      {carA && carB ? (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          {/* Header row */}
          <div className={`grid grid-cols-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <div className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              Metric
            </div>
            <div className="px-4 py-3">
              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {carA.year} {carA.make}
              </p>
              <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                {carA.model} {carA.trim}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {carB.year} {carB.make}
              </p>
              <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                {carB.model} {carB.trim}
              </p>
            </div>
          </div>

          {/* Metric rows */}
          {METRICS.map((metric, idx) => {
            const valA = metric.getValue(carA);
            const valB = metric.getValue(carB);
            return (
              <div
                key={metric.label}
                className={`grid grid-cols-3 border-t ${
                  isDark ? 'border-white/5' : 'border-black/5'
                } ${idx % 2 === 0 ? '' : isDark ? 'bg-white/2' : 'bg-black/2'}`}
              >
                <div className={`px-4 py-3 text-xs font-medium leading-tight ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  {metric.label}
                </div>
                <div className={`px-4 py-3 text-sm font-bold ${metric.isAccent ? 'text-[#FF5E00]' : isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                  {valA}
                </div>
                <div className={`px-4 py-3 text-sm font-bold ${metric.isAccent ? 'text-[#FF5E00]' : isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                  {valB}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`rounded-xl border p-10 text-center ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <p className={`text-sm ${isDark ? 'text-white/30' : 'text-black/30'}`}>
            Select two vehicles above to see them side by side.
          </p>
        </div>
      )}
    </div>
  );
}
