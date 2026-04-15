import { NextRequest, NextResponse } from 'next/server';
import { VehicleData } from '@/lib/types';

function extractValue(results: Array<{ Variable: string; Value: string | null }>, variableName: string): string {
  const item = results.find((r) => r.Variable === variableName);
  return item?.Value && item.Value !== 'Not Applicable' && item.Value !== 'null' ? item.Value : '';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vin = searchParams.get('vin')?.trim().toUpperCase();

  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: 'VIN must be exactly 17 characters.' }, { status: 400 });
  }

  const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`;

  try {
    const res = await fetch(nhtsaUrl, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to reach NHTSA API.' }, { status: 502 });
    }

    const data = await res.json();
    const results = data?.Results?.[0];

    if (!results) {
      return NextResponse.json({ error: 'No results returned from NHTSA.' }, { status: 404 });
    }

    // Check for error codes indicating invalid VIN
    const errorCode = results['ErrorCode'] || '';
    if (errorCode.startsWith('11') || errorCode.startsWith('8')) {
      return NextResponse.json({ error: 'This VIN is invalid or could not be decoded. Please double-check and try again.' }, { status: 422 });
    }

    const make = results['Make'] || '';
    const model = results['Model'] || '';
    const year = results['ModelYear'] || '';

    if (!make || !model || !year) {
      return NextResponse.json({ error: 'Could not decode this VIN. Please verify it is correct.' }, { status: 422 });
    }

    const vehicle: VehicleData = {
      vin,
      year,
      make,
      model,
      trim: results['Trim'] || results['Series'] || '',
      engine: results['EngineCylinders']
        ? `${results['DisplacementL'] || ''} ${results['EngineCylinders']}-cylinder`.trim()
        : results['DisplacementL'] || '',
      drivetrain: results['DriveType'] || '',
      fuelType: results['FuelTypePrimary'] || '',
      bodyClass: results['BodyClass'] || '',
      doors: results['Doors'] || '',
      displacement: results['DisplacementL'] || '',
      cylinders: results['EngineCylinders'] || '',
    };

    return NextResponse.json({ vehicle });
  } catch {
    return NextResponse.json({ error: 'Network error while contacting NHTSA. Please try again.' }, { status: 503 });
  }
}
