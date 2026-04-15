'use client';

import { useState } from 'react';
import VinInput from './VinInput';
import LoadingReport from './LoadingReport';
import CarReport from './CarReport';
import { VehicleData, CarReport as CarReportType, HistoryItem } from '@/lib/types';
import { saveToHistory } from '@/lib/storage';

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

  const handleVinSubmit = async (vin: string) => {
    setError('');
    setState('decoding');
    setVehicle(null);
    setReport(null);

    // Step 1: Decode VIN
    let decodedVehicle: VehicleData;
    try {
      const res = await fetch(`/api/decode-vin?vin=${encodeURIComponent(vin)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to decode VIN.');
        setState('error');
        return;
      }
      decodedVehicle = data.vehicle;
      setVehicle(decodedVehicle);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setState('error');
      return;
    }

    // Step 2: Generate report
    setState('generating');
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle: decodedVehicle }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to generate report.');
        setState('error');
        return;
      }

      const generatedReport: CarReportType = data.report;
      setReport(generatedReport);
      setState('done');

      // Save to history
      const historyItem: HistoryItem = {
        vin: decodedVehicle.vin,
        make: decodedVehicle.make,
        model: decodedVehicle.model,
        year: decodedVehicle.year,
        trim: decodedVehicle.trim,
        dateViewed: new Date().toISOString(),
        vehicleData: decodedVehicle,
        report: generatedReport,
      };
      saveToHistory(historyItem);
      onHistoryUpdate();
    } catch {
      setError('Failed to generate report. Please try again.');
      setState('error');
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
          <CarReport report={report} vehicle={vehicle} theme={theme} />
        </div>
      )}
    </div>
  );
}
