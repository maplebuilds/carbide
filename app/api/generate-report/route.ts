import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { VehicleData } from '@/lib/types';

const SYSTEM_PROMPT = `You are Carbide — a sharp, protective automotive advisor for first-time car buyers. Your job is to estimate accurate ownership costs for used vehicles.

CRITICAL: Always return valid JSON matching the exact schema. Be specific with numbers. Never use placeholders.`;

// ─── EPA Fuel Economy ─────────────────────────────────────────────────────────

const GAS_PRICE_PER_GALLON = 3.40; // national avg — update periodically
const ANNUAL_MILES = 15000;

function titleCase(str: string): string {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// NHTSA model names include chassis codes: "IS 300 ASE30L/GSE31L/GSE36L/GSE37L"
// fueleconomy.gov uses simple names: "IS 300"
// Try progressively shorter versions until we get a hit.
function modelCandidates(model: string): string[] {
  const candidates: string[] = [model];
  // Strip everything after first slash
  if (model.includes('/')) candidates.push(model.split('/')[0].trim());
  const words = model.split(' ');
  // Strip trailing all-caps tokens (chassis codes like ASE30L)
  const stripped = words.filter(w => !/^[A-Z0-9]{4,}$/.test(w)).join(' ').trim();
  if (stripped && stripped !== model) candidates.push(stripped);
  // First two words
  if (words.length > 2) candidates.push(words.slice(0, 2).join(' '));
  // First word only
  if (words.length > 1) candidates.push(words[0]);
  return [...new Set(candidates)];
}

interface EPAFuelData {
  mpgCity: string;
  mpgHighway: string;
  mpgCombined: string;
  monthlyCost: string;
  annualCost: string;
}

async function fetchEPAFuelData(vehicle: VehicleData): Promise<EPAFuelData | null> {
  const make = titleCase(vehicle.make);
  const models = modelCandidates(vehicle.model);

  for (const model of models) {
    try {
      const optionsUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${vehicle.year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
      const optionsRes = await fetch(optionsUrl, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 86400 }, // cache 24h
      });
      if (!optionsRes.ok) continue;

      const optionsData = await optionsRes.json();
      const items = optionsData?.menuItem;
      if (!items) continue;

      // API returns object if one result, array if multiple
      const firstItem = Array.isArray(items) ? items[0] : items;
      const vehicleId = firstItem?.value;
      if (!vehicleId) continue;

      const detailRes = await fetch(`https://www.fueleconomy.gov/ws/rest/vehicle/${vehicleId}`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 86400 },
      });
      if (!detailRes.ok) continue;

      const d = await detailRes.json();

      // comb08 = MPG for gasoline; combA08 = MPG for alt fuel (EV/hybrid electric portion)
      const combined = d.comb08 || d.combA08;
      const city     = d.city08  || d.cityA08;
      const highway  = d.highway08 || d.highwayA08;

      if (!combined || combined === 0) continue;

      const annualCostNum  = Math.round(((ANNUAL_MILES / combined) * GAS_PRICE_PER_GALLON) / 50) * 50;
      const monthlyCostNum = Math.round(annualCostNum / 12 / 5) * 5;

      return {
        mpgCity:      String(city     ?? '—'),
        mpgHighway:   String(highway  ?? '—'),
        mpgCombined:  String(combined),
        annualCost:   '$' + annualCostNum.toLocaleString(),
        monthlyCost:  '$' + monthlyCostNum.toLocaleString(),
      };
    } catch {
      continue;
    }
  }
  return null;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPhase1Prompt(vehicle: VehicleData, epaFuel: EPAFuelData | null): string {
  const vehicleDesc = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
  const currentYear = new Date().getFullYear();
  const vehicleAge  = currentYear - parseInt(vehicle.year);
  const milesLow    = (vehicleAge * 10000).toLocaleString();
  const milesHigh   = (vehicleAge * 15000).toLocaleString();
  const milesMid    = (vehicleAge * 12500).toLocaleString();

  const fuelSection = epaFuel
    ? `FUEL ECONOMY (EPA official — do NOT change these numbers):
- City: ${epaFuel.mpgCity} MPG | Highway: ${epaFuel.mpgHighway} MPG | Combined: ${epaFuel.mpgCombined} MPG
- Annual fuel cost: ${epaFuel.annualCost} (15,000 mi/yr at $${GAS_PRICE_PER_GALLON}/gal)
- Monthly fuel cost: ${epaFuel.monthlyCost}
Use these exact values in fuelCosts. Do not estimate.`
    : `FUEL ECONOMY: Estimate based on engine and vehicle class. Be accurate for this specific engine.`;

  return `Generate ownership cost numbers for this used vehicle. Return ONLY the JSON — no explanation.

Vehicle: ${vehicleDesc}
Age: ${vehicleAge} years old (${new Date().getFullYear()})
Est. mileage: ~${milesLow}–${milesHigh} miles
Engine: ${vehicle.engine || 'Unknown'}
Drivetrain: ${vehicle.drivetrain || 'Unknown'}
Fuel: ${vehicle.fuelType || 'Gasoline'}
Body: ${vehicle.bodyClass || 'Unknown'}

PRICING RULES — follow exactly:
- fairMarketLow/High = what this USED vehicle trades for TODAY (CarGurus/KBB/Edmunds), NOT MSRP
- This is a ${vehicleAge}-year-old car with ~${milesMid} miles. Price accordingly.
- Brands like Alfa Romeo, Land Rover, Lincoln depreciate hard. Japanese/Korean brands hold better.
- Range spread: $3,000–$6,000 for most; wider for luxury/specialty
- depreciationResidualValue.currentValue must equal the fairMarket midpoint
- year1Total = fairMarket midpoint + annual insurance + annual fuel + annual maintenance
- year3Total = fairMarket midpoint + (3 × annual running costs)

${fuelSection}

Return this JSON structure with real numbers only (no analysis text):

{
  "purchasePriceContext": {
    "fairMarketLow": "$XX,XXX",
    "fairMarketHigh": "$XX,XXX"
  },
  "financingEstimate": {
    "monthlyGoodCredit60": "$XXX",
    "monthlyGoodCredit72": "$XXX",
    "monthlyFairCredit60": "$XXX",
    "monthlyFairCredit72": "$XXX"
  },
  "insuranceEstimate": {
    "monthlyLow": "$XXX",
    "monthlyHigh": "$XXX"
  },
  "fuelCosts": {
    "mpgCity": "${epaFuel?.mpgCity ?? 'XX'}",
    "mpgHighway": "${epaFuel?.mpgHighway ?? 'XX'}",
    "mpgCombined": "${epaFuel?.mpgCombined ?? 'XX'}",
    "monthlyCost": "${epaFuel?.monthlyCost ?? '$XXX'}",
    "annualCost": "${epaFuel?.annualCost ?? '$X,XXX'}"
  },
  "maintenanceReliability": {
    "annualCost": "$X,XXX",
    "reliabilityRating": "Good/Average/etc — one sentence reason",
    "knownIssues": "• Issue 1\\n• Issue 2\\n• Issue 3",
    "majorRisks": "1-2 specific repair risks over $1,000 for this model"
  },
  "depreciationResidualValue": {
    "currentValue": "$XX,XXX",
    "value1Year": "$XX,XXX",
    "value3Year": "$XX,XXX",
    "value5Year": "$XX,XXX"
  },
  "totalCostOfOwnership": {
    "year1Total": "$XX,XXX",
    "year3Total": "$XX,XXX"
  },
  "bottomLine": {
    "smartBuy": true
  }
}`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const vehicle: VehicleData = body.vehicle;

    if (!vehicle?.vin || !vehicle?.make || !vehicle?.model) {
      return NextResponse.json({ error: 'Invalid vehicle data.' }, { status: 400 });
    }

    // Fetch EPA fuel data in parallel with nothing (first) — fast, cached
    const epaFuel = await fetchEPAFuelData(vehicle);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: buildPhase1Prompt(vehicle, epaFuel),
        },
      ],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate report. Please try again.' }, { status: 500 });
    }

    const report = JSON.parse(jsonMatch[0]);

    // Always override fuelCosts with real EPA data if we got it — never trust Claude's MPG
    if (epaFuel) {
      report.fuelCosts = epaFuel;
    }

    return NextResponse.json({ report, epaSource: epaFuel ? 'EPA' : 'estimated' });
  } catch (err) {
    console.error('Report generation error:', err);
    return NextResponse.json({ error: 'Failed to generate report. Please try again.' }, { status: 500 });
  }
}
