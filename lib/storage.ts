import { HistoryItem } from './types';

const HISTORY_KEY = 'carbide_history';
const THEME_KEY = 'carbide_theme';
const EMAILS_KEY = 'carbide_emails';

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(item: HistoryItem): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory();
    // Skip write if this VIN is already at the top with the same data
    if (history[0]?.vin === item.vin && history[0]?.dateViewed === item.dateViewed) return;
    const filtered = history.filter((h) => h.vin !== item.vin);
    const updated = [item, ...filtered].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // storage may be unavailable
  }
}

export function updateHistoryReport(vin: string, report: import('./types').CarReport): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory();
    const existing = history.find(h => h.vin === vin);
    // Skip write if report hasn't changed
    if (existing && JSON.stringify(existing.report) === JSON.stringify(report)) return;
    const updated = history.map(h => h.vin === vin ? { ...h, report } : h);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

export function getTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(theme: 'dark' | 'light'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

const DEALER_PRICES_KEY = 'carbide_dealer_prices';

export function getDealerPrice(vin: string): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(DEALER_PRICES_KEY);
    const prices: Record<string, number> = stored ? JSON.parse(stored) : {};
    return prices[vin] ?? null;
  } catch {
    return null;
  }
}

export function saveDealerPrice(vin: string, price: number): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(DEALER_PRICES_KEY);
    const prices: Record<string, number> = stored ? JSON.parse(stored) : {};
    prices[vin] = price;
    localStorage.setItem(DEALER_PRICES_KEY, JSON.stringify(prices));
  } catch {}
}

const MILEAGE_KEY = 'carbide_mileage';

export function getMileage(vin: string): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(MILEAGE_KEY);
    const data: Record<string, number> = stored ? JSON.parse(stored) : {};
    return data[vin] ?? null;
  } catch {
    return null;
  }
}

export function saveMileage(vin: string, miles: number): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(MILEAGE_KEY);
    const data: Record<string, number> = stored ? JSON.parse(stored) : {};
    data[vin] = miles;
    localStorage.setItem(MILEAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function saveEmail(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(EMAILS_KEY);
    const emails: string[] = stored ? JSON.parse(stored) : [];
    if (!emails.includes(email)) {
      emails.push(email);
      localStorage.setItem(EMAILS_KEY, JSON.stringify(emails));
    }
  } catch {}
}
