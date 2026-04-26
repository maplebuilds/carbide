'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import NavTabs, { Tab } from '@/components/NavTabs';
import Footer from '@/components/Footer';
import SearchTab from '@/components/SearchTab';
import HistoryTab from '@/components/HistoryTab';
import CompareTab from '@/components/CompareTab';
import { getTheme, saveTheme, getHistory } from '@/lib/storage';
import { HistoryItem } from '@/lib/types';

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = getTheme();
    setTheme(savedTheme);
    setHistory(getHistory());
    setMounted(true);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed silently
      });
    }
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    saveTheme(next);
  };

  const handleHistoryUpdate = () => {
    setHistory(getHistory());
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
    setActiveTab('search');
  };

  const handleHistoryClear = () => {
    localStorage.removeItem('carbide_history');
    setHistory([]);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'search') {
      setSelectedHistoryItem(null);
    }
  };

  const bgColor = theme === 'dark' ? '#0e0e10' : '#F5F5F5';
  const textColor = theme === 'dark' ? '#ffffff' : '#1a1a1a';

  if (!mounted) {
    return (
      <div style={{ background: '#1a1a1a', minHeight: '100vh' }} />
    );
  }

  return (
    <div
      data-theme={theme}
      className="flex flex-col min-h-screen transition-colors duration-200"
      style={{ background: bgColor, color: textColor }}
    >
      <Header theme={theme} onToggleTheme={handleToggleTheme} />
      <NavTabs activeTab={activeTab} onTabChange={handleTabChange} theme={theme} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pb-8">
        {activeTab === 'search' && (
          <SearchTab
            key={selectedHistoryItem?.vin ?? 'search'}
            theme={theme}
            onHistoryUpdate={handleHistoryUpdate}
            initialItem={selectedHistoryItem}
          />
        )}
        {activeTab === 'history' && (
          <div className="py-6">
            <HistoryTab
              history={history}
              theme={theme}
              onSelect={handleHistorySelect}
              onClear={handleHistoryClear}
            />
          </div>
        )}
        {activeTab === 'compare' && (
          <div className="py-6">
            <CompareTab history={history} theme={theme} />
          </div>
        )}
      </main>

      <Footer theme={theme} />
    </div>
  );
}
