import { useEffect, useState } from 'react';
import type { PersonKey, RoomNames } from './types';
import { getOrCreateRoom } from './lib/api';
import { ROOM_ID, getDeviceIdentity, setDeviceIdentity } from './lib/room';
import { RoomProvider } from './context/RoomContext';
import { IdentityPickerPage } from './pages/IdentityPickerPage';
import { MainApp } from './MainApp';

type Phase = 'loading' | 'error' | 'pick-identity' | 'ready';

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [names, setNames] = useState<RoomNames | null>(null);
  const [selfKey, setSelfKey] = useState<PersonKey | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const roomNames = await getOrCreateRoom(ROOM_ID);
        setNames(roomNames);

        const identity = getDeviceIdentity();
        if (identity) {
          setSelfKey(identity);
          setPhase('ready');
        } else {
          setPhase('pick-identity');
        }
      } catch (err) {
        console.error('เชื่อมต่อ Supabase ไม่สำเร็จ:', err);
        let message = 'เชื่อมต่อไม่สำเร็จ (ไม่ทราบสาเหตุ)';
        if (typeof err === 'string') {
          message = err;
        } else if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
          message = (err as { message: string }).message;
        }
        setErrorMessage(message);
        setPhase('error');
      }
    })();
  }, []);

  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--brand-50)] text-gray-500">
        กำลังโหลด...
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--brand-50)] p-6 text-center">
        <p className="font-semibold text-red-600">เชื่อมต่อไม่สำเร็จ</p>
        <p className="text-sm text-gray-500">{errorMessage}</p>
        <p className="text-xs text-gray-400">
          ตรวจสอบว่าตั้งค่า VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ถูกต้องหรือยัง (ดู README.md)
        </p>
      </div>
    );
  }

  if (phase === 'pick-identity' && names) {
    return (
      <IdentityPickerPage
        names={names}
        onPick={(key) => {
          setDeviceIdentity(key);
          setSelfKey(key);
          setPhase('ready');
        }}
      />
    );
  }

  if (phase === 'ready' && names && selfKey) {
    return (
      <RoomProvider roomId={ROOM_ID} initialNames={names} initialSelfKey={selfKey}>
        <MainApp />
      </RoomProvider>
    );
  }

  return null;
}
