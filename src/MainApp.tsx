import { useState } from 'react';
import { BottomNav, type TabKey } from './components/BottomNav';
import { ChatPage } from './pages/ChatPage';
import { TablePage } from './pages/TablePage';
import { SummaryPage } from './pages/SummaryPage';
import { SettingsPage } from './pages/SettingsPage';

export function MainApp() {
  const [tab, setTab] = useState<TabKey>('chat');

  return (
    <div className="flex h-screen flex-col bg-[var(--brand-50)]">
      <div className="min-h-0 flex-1">
        {tab === 'chat' && <ChatPage />}
        {tab === 'table' && <TablePage />}
        {tab === 'summary' && <SummaryPage />}
        {tab === 'settings' && <SettingsPage />}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
