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
    const filtered = history.filter((h) => h.vin !== item.vin);
    const updated = [item, ...filtered].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // storage may be unavailable
  }
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
