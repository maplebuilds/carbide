'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import ReportSection from './ReportSection';
import EmailCapture from './EmailCapture';
import { CarReport as CarReportType, VehicleData } from '@/lib/types';

interface CarReportProps {
  report: CarReportType;
  vehicle: VehicleData;
  theme: 'dark' | 'light';
}

function Stat({ label, value, accent, theme }: { label: string; value: string; accent?: boolean; theme: 'dark' | 'light' }) {
  return (
    <div>
      <p className={`text-xs uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>{label}</p>
      <p className={`text-xl font-black ${accent ? 'text-[#FF5E00]' : theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>
        {value}
      </p>
    </div>
  );
}

function AffiliateCTA({ label, href, theme, trackingId }: { label: string; href: string; theme: 'dark' | 'light'; trackingId: string }) {
  const handleClick = () => {
    console.log(`[Carbide CTA Click] id=${trackingId} label="${label}" href=${href}`);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="flex items-center justify-center gap-2 w-full py-3 px-4 mt-4 rounded-lg border-2 border-[#FF5E00] text-[#FF5E00] font-bold text-sm uppercase tracking-wider hover:bg-[#FF5E00] hover:text-white transition-all active:scale-95"
    >
      {label}
      <ExternalLink size={14} />
    </a>
  );
}

export default function CarReport({ report, vehicle, theme }: CarReportProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const makeDomainMap: Record<string, string> = {
      toyota: 'toyota.com',
      honda: 'honda.com',
      ford: 'ford.com',
      chevrolet: 'chevrolet.com',
      chevy: 'chevrolet.com',
      gmc: 'gmc.com',
      dodge: 'dodge.com',
      chrysler: 'chrysler.com',
      jeep: 'jeep.com',
      ram: 'ramtrucks.com',
      nissan: 'nissanusa.com',
      hyundai: 'hyundaiusa.com',
      kia: 'kia.com',
      subaru: 'subaru.com',
      volkswagen: 'vw.com',
      bmw: 'bmw.com',
      mercedes: 'mercedes-benz.com',
      'mercedes-benz': 'mercedes-benz.com',
      audi: 'audi.com',
      lexus: 'lexus.com',
      acura: 'acura.com',
      infiniti: 'infinitiusa.com',
      cadillac: 'cadillac.com',
      lincoln: 'lincoln.com',
      buick: 'buick.com',
      volvo: 'volvocars.com',
      mazda: 'mazdausa.com',
      mitsubishi: 'mitsubishicars.com',
      porsche: 'porsche.com',
      tesla: 'tesla.com',
      genesis: 'genesis.com',
      maserati: 'maserati.com',
      jaguar: 'jaguar.com',
      'land rover': 'landrover.com',
      mini: 'miniusa.com',
      fiat: 'fiatusa.com',
      alfa: 'alfaromeousa.com',
    };

    const makeKey = vehicle.make.toLowerCase();
    const domain = makeDomainMap[makeKey] || `${makeKey.replace(/\s+/g, '')}.com`;
    const url = `https://logo.clearbit.com/${domain}`;

    const img = new Image();
    img.onload = () => setLogoUrl(url);
    img.onerror = () => setLogoUrl(null);
    img.src = url;
  }, [vehicle.make]);

  const { r } = { r: report };
  const isDark = theme === 'dark';

  return (
    <div className="relative">
      {/* Logo watermark */}
      {logoUrl && (
        <div
          className="pointer-events-none fixed inset-0 flex items-center justify-center z-0 overflow-hidden"
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt=""
            className="w-[70vw] max-w-[500px] object-contain"
            style={{ opacity: 0.06, filter: isDark ? 'invert(1)' : 'none' }}
          />
        </div>
      )}

      <div className="relative z-10 space-y-5">
        {/* Vehicle header */}
        <div className={`rounded-xl border-2 border-[#FF5E00] p-5 sm:p-6 ${isDark ? 'bg-[#FF5E00]/5' : 'bg-[#FF5E00]/5'}`}>
          <p className="text-[#FF5E00] text-xs font-bold uppercase tracking-widest mb-2">Vehicle Decoded</p>
          <h1 className={`text-2xl sm:text-3xl font-black uppercase ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}
            style={{ fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
            {vehicle.year} {vehicle.make} {vehicle.model}
            {vehicle.trim && <span className="text-[#FF5E00] ml-2">{vehicle.trim}</span>}
          </h1>
          <p className={`text-sm mt-1 font-mono ${isDark ? 'text-white/40' : 'text-black/40'}`}>VIN: {vehicle.vin}</p>
        </div>

        {/* 1. Vehicle Summary */}
        <ReportSection title="Vehicle Summary" icon="🚗" theme={theme}>
          <p className={`text-base leading-relaxed mb-3 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            {report.vehicleSummary.overview}
          </p>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            {report.vehicleSummary.specs}
          </p>
        </ReportSection>

        {/* 2. Purchase Price Context */}
        <ReportSection title="Purchase Price Context" icon="💰" theme={theme}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Stat label="Fair Market Low" value={report.purchasePriceContext.fairMarketLow} accent theme={theme} />
            <Stat label="Fair Market High" value={report.purchasePriceContext.fairMarketHigh} accent theme={theme} />
          </div>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {report.purchasePriceContext.analysis}
          </p>
        </ReportSection>

        {/* 3. Financing Estimate */}
        <ReportSection title="Financing Estimate" icon="🏦" theme={theme}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`rounded-lg p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                Good Credit (720+)
              </p>
              <div className="space-y-2">
                <Stat label="60 months" value={report.financingEstimate.monthlyGoodCredit60 + '/mo'} accent theme={theme} />
                <Stat label="72 months" value={report.financingEstimate.monthlyGoodCredit72 + '/mo'} theme={theme} />
              </div>
            </div>
            <div className={`rounded-lg p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                Fair Credit (620-719)
              </p>
              <div className="space-y-2">
                <Stat label="60 months" value={report.financingEstimate.monthlyFairCredit60 + '/mo'} accent theme={theme} />
                <Stat label="72 months" value={report.financingEstimate.monthlyFairCredit72 + '/mo'} theme={theme} />
              </div>
            </div>
          </div>
          <p className={`text-sm leading-relaxed mb-0 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {report.financingEstimate.analysis}
          </p>
          <AffiliateCTA
            label="See real loan rates for this vehicle"
            href="https://www.lendingtree.com/auto/?source=carbide"
            theme={theme}
            trackingId="financing-cta"
          />
        </ReportSection>

        {/* 4. Insurance Estimate */}
        <ReportSection title="Insurance Estimate" icon="🛡️" theme={theme}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Stat label="Monthly Low" value={report.insuranceEstimate.monthlyLow + '/mo'} theme={theme} />
            <Stat label="Monthly High" value={report.insuranceEstimate.monthlyHigh + '/mo'} accent theme={theme} />
          </div>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {report.insuranceEstimate.analysis}
          </p>
          <AffiliateCTA
            label="Get a real insurance quote for this vehicle"
            href="https://www.thezebra.com/?source=carbide"
            theme={theme}
            trackingId="insurance-cta"
          />
        </ReportSection>

        {/* 5. Fuel Costs */}
        <ReportSection title="Fuel Costs" icon="⛽" theme={theme}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="City MPG" value={report.fuelCosts.mpgCity} theme={theme} />
            <Stat label="Highway MPG" value={report.fuelCosts.mpgHighway} theme={theme} />
            <Stat label="Combined MPG" value={report.fuelCosts.mpgCombined} accent theme={theme} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Stat label="Monthly Fuel" value={report.fuelCosts.monthlyCost} accent theme={theme} />
            <Stat label="Annual Fuel" value={report.fuelCosts.annualCost} accent theme={theme} />
          </div>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {report.fuelCosts.analysis}
          </p>
        </ReportSection>

        {/* 6. Maintenance & Reliability */}
        <ReportSection title="Maintenance & Reliability" icon="🔧" theme={theme}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <Stat label="Est. Annual Maintenance" value={report.maintenanceReliability.annualCost} accent theme={theme} />
            <div>
              <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Reliability</p>
              <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                {report.maintenanceReliability.reliabilityRating}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              Known Issues
            </p>
            <div className={`text-sm leading-relaxed whitespace-pre-line ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              {report.maintenanceReliability.knownIssues}
            </div>
          </div>

          <div className={`rounded-lg p-4 border ${isDark ? 'border-red-500/20 bg-red-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2">Major Repair Risks</p>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              {report.maintenanceReliability.majorRisks}
            </p>
          </div>
        </ReportSection>

        {/* 7. Depreciation */}
        <ReportSection title="Depreciation & Residual Value" icon="📉" theme={theme}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Stat label="Current Value" value={report.depreciationResidualValue.currentValue} theme={theme} />
            <Stat label="1 Year" value={report.depreciationResidualValue.value1Year} theme={theme} />
            <Stat label="3 Years" value={report.depreciationResidualValue.value3Year} accent theme={theme} />
            <Stat label="5 Years" value={report.depreciationResidualValue.value5Year} accent theme={theme} />
          </div>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {report.depreciationResidualValue.analysis}
          </p>
        </ReportSection>

        {/* 8. Total Cost of Ownership */}
        <ReportSection title="Total Cost of Ownership" icon="📊" theme={theme}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Stat label="Year 1 All-In" value={report.totalCostOfOwnership.year1Total} accent theme={theme} />
            <Stat label="3-Year Total" value={report.totalCostOfOwnership.year3Total} accent theme={theme} />
          </div>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {report.totalCostOfOwnership.breakdown}
          </p>
        </ReportSection>

        {/* 9. Bottom Line */}
        <div className={`rounded-xl border-2 p-5 sm:p-6 ${
          report.bottomLine.smartBuy
            ? 'border-[#FF5E00]/60 bg-[#FF5E00]/5'
            : 'border-red-500/60 bg-red-500/5'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {report.bottomLine.smartBuy
              ? <CheckCircle size={24} className="text-[#FF5E00] flex-shrink-0" />
              : <XCircle size={24} className="text-red-400 flex-shrink-0" />
            }
            <h2 className={`text-lg font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}
              style={{ fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
              Bottom Line
            </h2>
          </div>

          <p className={`text-base leading-relaxed mb-5 ${isDark ? 'text-white/85' : 'text-black/85'}`}>
            {report.bottomLine.verdict}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className={`rounded-lg p-4 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <p className="text-xs font-bold uppercase tracking-wider text-[#FF5E00] mb-2">Watch Out For</p>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                {report.bottomLine.watchOut}
              </p>
            </div>
            <div className={`rounded-lg p-4 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <p className="text-xs font-bold uppercase tracking-wider text-[#FF5E00] mb-2">Ask The Dealer</p>
              <p className={`text-sm leading-relaxed whitespace-pre-line ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                {report.bottomLine.askDealer}
              </p>
            </div>
          </div>
        </div>

        {/* Email capture */}
        <EmailCapture theme={theme} vehicle={vehicle} />
      </div>
    </div>
  );
}
