export interface VehicleData {
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  engine: string;
  drivetrain: string;
  fuelType: string;
  bodyClass: string;
  doors: string;
  displacement: string;
  cylinders: string;
}

export interface CarReport {
  // Phase 1 — numbers, loads fast
  purchasePriceContext: {
    fairMarketLow: string;
    fairMarketHigh: string;
    analysis?: string;
  };
  financingEstimate: {
    monthlyGoodCredit60: string;
    monthlyGoodCredit72: string;
    monthlyFairCredit60: string;
    monthlyFairCredit72: string;
    analysis?: string;
  };
  insuranceEstimate: {
    monthlyLow: string;
    monthlyHigh: string;
    analysis?: string;
  };
  fuelCosts: {
    mpgCity: string;
    mpgHighway: string;
    mpgCombined: string;
    monthlyCost: string;
    annualCost: string;
    analysis?: string;
  };
  maintenanceReliability: {
    annualCost: string;
    reliabilityRating: string;
    knownIssues: string;
    majorRisks: string;
  };
  depreciationResidualValue: {
    currentValue: string;
    value1Year: string;
    value3Year: string;
    value5Year: string;
    analysis?: string;
  };
  totalCostOfOwnership: {
    year1Total: string;
    year3Total: string;
    breakdown?: string;
  };
  bottomLine: {
    smartBuy: boolean;
    verdict?: string;
    watchOut?: string;
    askDealer?: string;
  };

  // Phase 2 — prose, loads in background
  vehicleSummary?: {
    overview: string;
    specs: string;
  };
}

export interface HistoryItem {
  vin: string;
  make: string;
  model: string;
  year: string;
  trim: string;
  dateViewed: string;
  vehicleData: VehicleData;
  report: CarReport;
}
