import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { VehicleData } from '@/lib/types';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Carbide — a sharp, protective automotive advisor helping first-time car buyers understand the true cost of owning a vehicle. You write like a knowledgeable friend who has your back, not a finance robot. You're direct, honest, and slightly witty. You never use jargon without immediately explaining it in plain English.

Your job is to generate a comprehensive car ownership cost analysis. When a financial term might confuse a first-time buyer, explain it in parentheses.

CRITICAL: Always return valid JSON matching the exact schema provided. Use realistic estimates based on the vehicle data. Never use placeholder text. Be specific with numbers.`;

function buildPrompt(vehicle: VehicleData): string {
  const vehicleDesc = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;

  return `Analyze this vehicle for a first-time car buyer:

VIN: ${vehicle.vin}
Vehicle: ${vehicleDesc}
Engine: ${vehicle.engine || 'Unknown'}
Drivetrain: ${vehicle.drivetrain || 'Unknown'}
Fuel Type: ${vehicle.fuelType || 'Gasoline'}
Body Style: ${vehicle.bodyClass || 'Unknown'}

Generate a complete cost analysis. Return ONLY valid JSON with this exact structure:

{
  "vehicleSummary": {
    "overview": "2-3 sentence plain English summary of what this car is. Include what type of driver it's designed for and any notable features.",
    "specs": "Key specs summary: engine, transmission type, drivetrain, fuel type, body style. Explain any terms a first-time buyer might not know."
  },
  "purchasePriceContext": {
    "fairMarketLow": "$XX,XXX",
    "fairMarketHigh": "$XX,XXX",
    "analysis": "2-3 sentences explaining the price range, what factors affect it (mileage, condition, region), and how to use this info at the dealership."
  },
  "financingEstimate": {
    "monthlyGoodCredit60": "$XXX",
    "monthlyGoodCredit72": "$XXX",
    "monthlyFairCredit60": "$XXX",
    "monthlyFairCredit72": "$XXX",
    "analysis": "2-3 sentences explaining these estimates, what 'good credit' (720+) vs 'fair credit' (620-719) means for your rate, and what to watch out for at the dealership finance office."
  },
  "insuranceEstimate": {
    "monthlyLow": "$XXX",
    "monthlyHigh": "$XXX",
    "analysis": "2-3 sentences explaining the range, what factors push insurance higher or lower for this specific vehicle (engine size, theft rates, safety ratings), and a tip for saving."
  },
  "fuelCosts": {
    "mpgCity": "XX",
    "mpgHighway": "XX",
    "mpgCombined": "XX",
    "monthlyCost": "$XXX",
    "annualCost": "$X,XXX",
    "analysis": "2 sentences using national average gas price (~$3.40/gallon), assuming 1,000 miles/month. Note if this vehicle gets notably good or bad mileage for its class."
  },
  "maintenanceReliability": {
    "annualCost": "$X,XXX",
    "knownIssues": "Bullet list of 3-5 known issues or common repair items for this specific make/model/year. Be honest — this is exactly what a first-time buyer needs to know.",
    "majorRisks": "What are the 1-2 biggest repair risks that could cost $1,000+ on this vehicle? Be specific.",
    "reliabilityRating": "Excellent / Good / Average / Below Average / Poor — with a one-sentence reason why."
  },
  "depreciationResidualValue": {
    "currentValue": "$XX,XXX",
    "value1Year": "$XX,XXX",
    "value3Year": "$XX,XXX",
    "value5Year": "$XX,XXX",
    "analysis": "2-3 sentences explaining depreciation in plain English (what it means, why it matters), how fast this specific vehicle loses value compared to average, and whether it holds value well."
  },
  "totalCostOfOwnership": {
    "year1Total": "$XX,XXX",
    "year3Total": "$XX,XXX",
    "breakdown": "Short breakdown of how you calculated these: purchase + financing + insurance + fuel + maintenance. Make it easy to understand."
  },
  "bottomLine": {
    "verdict": "3-4 sentences. Honest, direct assessment. Is this a smart buy for a first-time buyer? What's the context? Write like you're giving advice to a younger sibling.",
    "watchOut": "2-3 specific things to watch out for with this vehicle — dealer tactics, known problems, hidden costs. Be specific to this make/model.",
    "askDealer": "3 specific questions the buyer should ask the dealer about this specific vehicle. Make them questions that will catch the dealer off guard or reveal important info.",
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

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildPrompt(vehicle),
        },
      ],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from the response
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
