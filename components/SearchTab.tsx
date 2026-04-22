'use client';

import { useState, useRef } from 'react';
import VinInput from './VinInput';
import LoadingReport from './LoadingReport';
import CarReport from './CarReport';
import { VehicleData, CarReport as CarReportType, HistoryItem } from '@/lib/types';
import { saveToHistory, updateHistoryReport } from '@/lib/storage';

interface SearchTabProps {
  theme: 'dark' | 'light';
  onHistoryUpdate: () => void;
  initialItem?: HistoryItem | null;
}

type State = 'idle' | 'decoding' | 'generating' | 'done' | 'error';

export default function SearchTab({ theme, onHistoryUpdate, initialItem }: SearchTabProps) {
  const [state, setState] = useState<State>(initialItem ? 'done' : 'idle');
  const [vehicle, setVehicle] = useState<VehicleData | null>(initialItem?.vehicleData ?? null);
  const [report, setReport] = useState<CarReportType | null>(initialItem?.report ?? null);
  const [error, setError] = useState<string>('');
  const [proseLoading, setProseLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleVinSubmit = async (vin: string) => {
    // Cancel any in-flight requests from a previous search
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setError('');
    setState('decoding');
    setVehicle(null);
    setReport(null);

    // Step 1: Decode VIN
    let decodedVehicle: VehicleData;
    try {
      const res = await fetch(`/api/decode-vin?vin=${encodeURIComponent(vin)}`, { signal });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to decode VIN.');
        setState('error');
        return;
      }
      decodedVehicle = data.vehicle;
      setVehicle(decodedVehicle);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError('Network error. Please check your connection and try again.');
      setState('error');
      return;
    }

    // Step 2: Phase 1 — numbers only (fast, ~6-8s)
    setState('generating');
    let phase1Report: CarReportType;
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle: decodedVehicle }),
        signal,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to generate report.');
        setState('error');
        return;
      }
      phase1Report = data.report;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError('Failed to generate report. Please try again.');
      setState('error');
      return;
    }

    // Show numbers immediately
    setReport(phase1Report);
    setState('done');
    setProseLoading(true);

    // Save phase 1 to history right away so Back works
    const historyItem: HistoryItem = {
      vin: decodedVehicle.vin,
      make: decodedVehicle.make,
      model: decodedVehicle.model,
      year: decodedVehicle.year,
      trim: decodedVehicle.trim,
      dateViewed: new Date().toISOString(),
      vehicleData: decodedVehicle,
      report: phase1Report,
    };
    saveToHistory(historyItem);
    onHistoryUpdate();

    // Step 3: Phase 2 — prose in background (doesn't block UI)
    try {
      const enrichRes = await fetch('/api/enrich-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle: decodedVehicle, numbers: phase1Report }),
        signal,
      });
      const enrichData = await enrichRes.json();
      if (enrichRes.ok && enrichData.prose) {
        const { prose } = enrichData;
        const enrichedReport: CarReportType = {
          ...phase1Report,
          vehicleSummary: prose.vehicleSummary,
          purchasePriceContext: { ...phase1Report.purchasePriceContext, analysis: prose.purchasePriceContext?.analysis },
          financingEstimate: { ...phase1Report.financingEstimate, analysis: prose.financingEstimate?.analysis },
          insuranceEstimate: { ...phase1Report.insuranceEstimate, analysis: prose.insuranceEstimate?.analysis },
          fuelCosts: { ...phase1Report.fuelCosts, analysis: prose.fuelCosts?.analysis },
          depreciationResidualValue: { ...phase1Report.depreciationResidualValue, analysis: prose.depreciationResidualValue?.analysis },
          totalCostOfOwnership: { ...phase1Report.totalCostOfOwnership, breakdown: prose.totalCostOfOwnership?.breakdown },
          bottomLine: {
            ...phase1Report.bottomLine,
            verdict: prose.bottomLine?.verdict,
            watchOut: prose.bottomLine?.watchOut,
            askDealer: prose.bottomLine?.askDealer,
          },
        };
        setReport(enrichedReport);
        updateHistoryReport(decodedVehicle.vin, enrichedReport);
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      // prose failed silently — numbers are still shown
    } finally {
      setProseLoading(false);
    }
  };

  const handleReset = () => {
    setState('idle');
    setVehicle(null);
    setReport(null);
    setError('');
  };

  const isLoading = state === 'decoding' || state === 'generating';

  return (
    <div>
      {/* VIN input — always visible at top unless report shown */}
      {state !== 'done' && (
        <div className="py-10 sm:py-16">
          <VinInput
            onSubmit={handleVinSubmit}
            loading={isLoading}
            theme={theme}
            error={state === 'error' ? error : undefined}
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && <LoadingReport theme={theme} />}

      {/* Report */}
      {state === 'done' && vehicle && report && (
        <div className="py-6">
          {/* Back / New search button */}
          <button
            onClick={handleReset}
            className={`text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-1 transition-colors ${
              theme === 'dark' ? 'text-white/30 hover:text-white/60' : 'text-black/30 hover:text-black/60'
            }`}
          >
            ← New Search
          </button>
          <CarReport report={report} vehicle={vehicle} theme={theme} proseLoading={proseLoading} />
        </div>
      )}
    </div>
  );
}
