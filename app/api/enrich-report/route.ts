import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { VehicleData, CarReport } from '@/lib/types';

const SYSTEM_PROMPT = `You are Carbide — a sharp, protective automotive advisor for first-time car buyers. You write like a knowledgeable friend who has your back, not a finance robot. Direct, honest, slightly witty. Never use jargon without a plain-English explanation in parentheses. Always return valid JSON only — no markdown, no explanation outside the JSON.`;

// In-memory cache: survives warm function restarts, free on cold starts
const sectionCache = new Map<string, object>();

function vehicleDesc(vehicle: VehicleData): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
}

function buildSectionPrompt(section: string, vehicle: VehicleData, numbers: CarReport, mileage?: number): string {
  const desc = vehicleDesc(vehicle);
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - parseInt(vehicle.year);
  const estimatedMiles = vehicleAge * 12500;
  const mileageStr = mileage
    ? `${mileage.toLocaleString()} miles (actual)`
    : `~${estimatedMiles.toLocaleString()} miles (estimated from age)`;

  switch (section) {
    case 'purchase':
      return `Write a 2-sentence purchase price analysis for the ${desc}.
Fair market range: ${numbers.purchasePriceContext.fairMarketLow} – ${numbers.purchasePriceContext.fairMarketHigh}
Mileage: ${mileageStr}
Return ONLY: { "purchasePriceContext": { "analysis": "2 sentences: why this price range exists, key factors (age/mileage/region), one tip for using it at the dealer." } }`;

    case 'financing':
      return `Write a 2-sentence financing analysis for the ${desc}.
Monthly estimates: good credit 60mo = ${numbers.financingEstimate.monthlyGoodCredit60}, fair credit 60mo = ${numbers.financingEstimate.monthlyFairCredit60}
Return ONLY: { "financingEstimate": { "analysis": "2 sentences: what drives the rate difference, one dealer finance office warning to watch for." } }`;

    case 'insurance':
      return `Write a 2-sentence insurance analysis for the ${desc}.
Monthly range: ${numbers.insuranceEstimate.monthlyLow} – ${numbers.insuranceEstimate.monthlyHigh}
Return ONLY: { "insuranceEstimate": { "analysis": "2 sentences: what makes insurance higher/lower for this specific vehicle, one tip to save money." } }`;

    case 'fuel':
      return `Write 1-2 sentences about fuel costs for the ${desc}.
MPG: ${numbers.fuelCosts.mpgCombined} combined | Annual cost: ${numbers.fuelCosts.annualCost}
Return ONLY: { "fuelCosts": { "analysis": "1-2 sentences: is this good/bad mpg for its class, real-world monthly cost context." } }`;

    case 'depreciation':
      return `Write a 2-sentence depreciation analysis for the ${desc}.
Values: now ${numbers.depreciationResidualValue.currentValue} → 1yr ${numbers.depreciationResidualValue.value1Year} → 3yr ${numbers.depreciationResidualValue.value3Year} → 5yr ${numbers.depreciationResidualValue.value5Year}
Return ONLY: { "depreciationResidualValue": { "analysis": "2 sentences: how fast this model depreciates vs average, what to expect at resale." } }`;

    case 'maintenance':
      return `Based on the ${desc} with ${mileageStr}, list what maintenance is due now and coming up.
Engine: ${vehicle.engine || 'Unknown'} | Drivetrain: ${vehicle.drivetrain || 'Unknown'} | Fuel: ${vehicle.fuelType || 'Gasoline'}
Annual maintenance cost estimate: ${numbers.maintenanceReliability.annualCost}
Known issues: ${numbers.maintenanceReliability.knownIssues}

Use the OEM maintenance schedule for this specific model. Be specific about mileage intervals.
Return ONLY:
{
  "maintenance": {
    "dueSoon": ["3-4 items likely due NOW at this mileage — include the service name and typical cost range"],
    "upcoming": ["3-4 items due in the next 15,000 miles — include mileage interval and typical cost"],
    "criticalNote": "1 sentence: the single most important maintenance item to verify on this specific model at this mileage."
  }
}`;

    case 'verdict':
      return `Write the full verdict for the ${desc}.
Engine: ${vehicle.engine || 'Unknown'} | Drivetrain: ${vehicle.drivetrain || 'Unknown'} | Fuel: ${vehicle.fuelType || 'Gasoline'}
Mileage: ${mileageStr}
Smart Buy: ${numbers.bottomLine.smartBuy} | Reliability: ${numbers.maintenanceReliability.reliabilityRating}
Year 1: ${numbers.totalCostOfOwnership.year1Total} | 3-Year TCO: ${numbers.totalCostOfOwnership.year3Total}
Known issues: ${numbers.maintenanceReliability.knownIssues}
Major risks: ${numbers.maintenanceReliability.majorRisks}

Return ONLY:
{
  "vehicleSummary": {
    "overview": "2-3 sentences: what this car is, what type of driver it suits, notable features.",
    "specs": "1-2 sentences: engine, transmission, drivetrain, fuel. Explain jargon simply."
  },
  "bottomLine": {
    "verdict": "3 sentences: honest assessment for a first-time buyer. Write like advice to a younger sibling.",
    "watchOut": "2-3 specific watch-outs: dealer tactics, known problems, hidden costs for this make/model.",
    "askDealer": "3 specific questions that will catch the dealer off guard or reveal important info about this vehicle."
  }
}`;

    case 'features':
      return `List the key features for the ${desc}${vehicle.trim ? ` (${vehicle.trim} trim)` : ''}.
Engine: ${vehicle.engine || 'Unknown'} | Drivetrain: ${vehicle.drivetrain || 'Unknown'} | Body: ${vehicle.bodyClass || 'Unknown'}

Return ONLY:
{
  "keyFeatures": {
    "tech": ["4 specific tech/infotainment/safety-tech features standard on this trim"],
    "sport": ["3-4 sport/performance/appearance features that differentiate this trim"],
    "trimAdvantage": "1-2 sentences: what this trim adds over the base model and what type of driver it suits best."
  }
}`;

    default:
      return '';
  }
}

function maxTokensForSection(section: string): number {
  if (section === 'verdict') return 1200;
  if (section === 'maintenance') return 600;
  if (section === 'features') return 400;
  return 400;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const vehicle: VehicleData = body.vehicle;
    const numbers: CarReport = body.numbers;
    const section: string | undefined = body.section;
    const mileage: number | undefined = body.mileage ?? undefined;

    if (!vehicle?.vin || !numbers) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const prompt = section ? buildSectionPrompt(section, vehicle, numbers, mileage) : '';
    if (!prompt) {
      return NextResponse.json({ error: 'Invalid section.' }, { status: 400 });
    }

    // Cache key includes mileage so actual vs estimated get separate results
    const cacheKey = `${vehicle.vin}:${section}:${mileage ?? 'est'}`;
    if (sectionCache.has(cacheKey)) {
      return NextResponse.json({ prose: sectionCache.get(cacheKey) });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokensForSection(section!),
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate analysis.' }, { status: 500 });
    }

    const prose = JSON.parse(jsonMatch[0]);
    sectionCache.set(cacheKey, prose);
    return NextResponse.json({ prose });
  } catch (err) {
    console.error('Section analysis error:', err);
    return NextResponse.json({ error: 'Failed to generate analysis.' }, { status: 500 });
  }
}
