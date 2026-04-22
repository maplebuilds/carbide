import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { VehicleData } from '@/lib/types';


const SYSTEM_PROMPT = `You are Carbide — a sharp, protective automotive advisor for first-time car buyers. Your job is to estimate accurate ownership costs for used vehicles.

CRITICAL: Always return valid JSON matching the exact schema. Be specific with numbers. Never use placeholders.`;

function buildPhase1Prompt(vehicle: VehicleData): string {
  const vehicleDesc = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - parseInt(vehicle.year);
  const milesLow = (vehicleAge * 10000).toLocaleString();
  const milesHigh = (vehicleAge * 15000).toLocaleString();
  const milesMid = (vehicleAge * 12500).toLocaleString();

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
    "mpgCity": "XX",
    "mpgHighway": "XX",
    "mpgCombined": "XX",
    "monthlyCost": "$XXX",
    "annualCost": "$X,XXX"
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const vehicle: VehicleData = body.vehicle;

    if (!vehicle?.vin || !vehicle?.make || !vehicle?.model) {
      return NextResponse.json({ error: 'Invalid vehicle data.' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
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
          content: buildPhase1Prompt(vehicle),
        },
      ],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate report. Please try again.' }, { status: 500 });
    }

    const report = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ report });
  } catch (err) {
    console.error('Report generation error:', err);
    return NextResponse.json({ error: 'Failed to generate report. Please try again.' }, { status: 500 });
  }
}
