import { useEffect, useState } from 'react';
import type { PersonKey, RoomNames } from './types';
import { getOrCreateRoom } from './lib/api';
import { generateRoomId, getRoomIdFromUrl, setRoomIdInUrl } from './lib/room';
import { RoomProvider, loadStoredIdentity } from './context/RoomContext';
import { IdentityPickerPage } from './pages/IdentityPickerPage';
import { MainApp } from './MainApp';

type Phase = 'loading' | 'error' | 'pick-identity' | 'ready';

function findNonLatin1Chars(value: string | undefined): string {
  if (!value) return '';
  const bad: string[] = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 255) {
      bad.push(`ตำแหน่งที่ ${i + 1}: "${value[i]}" (U+${code.toString(16).toUpperCase().padStart(4, '0')})`);
    }
  }
  return bad.join(', ');
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [names, setNames] = useState<RoomNames | null>(null);
  const [selfKey, setSelfKey] = useState<PersonKey | null>(null);
  const [isNewRoom, setIsNewRoom] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        let id = getRoomIdFromUrl();
        const freshlyCreated = !id;
        if (!id) {
          id = generateRoomId();
          setRoomIdInUrl(id);
        }
        const roomNames = await getOrCreateRoom(id);
        setRoomId(id);
        setNames(roomNames);
        setIsNewRoom(freshlyCreated);

        const identity = loadStoredIdentity(id);
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
      <div className="flex min-h-screen items-center justify-center bg-brand-50 text-gray-500">
        กำลังโหลด...
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-50 p-6 text-center">
        <p className="font-semibold text-red-600">เชื่อมต่อไม่สำเร็จ</p>
        <p className="text-sm text-gray-500">{errorMessage}</p>
        <p className="text-xs text-gray-400">
          ตรวจสอบว่าตั้งค่า VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ถูกต้องหรือยัง (ดู README.md)
        </p>
        <div className="mt-2 rounded-lg bg-gray-100 p-3 text-left text-xs text-gray-500">
          <p>VITE_SUPABASE_URL = {JSON.stringify(import.meta.env.VITE_SUPABASE_URL)}</p>
          <p>
            VITE_SUPABASE_ANON_KEY ยาว {import.meta.env.VITE_SUPABASE_ANON_KEY?.length ?? 0} ตัวอักษร
            {import.meta.env.VITE_SUPABASE_ANON_KEY ? ` (ขึ้นต้นด้วย "${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 12)}...")` : ''}
          </p>
          {findNonLatin1Chars(import.meta.env.VITE_SUPABASE_URL) && (
            <p className="mt-1 text-red-600">
              พบอักขระผิดปกติใน URL: {findNonLatin1Chars(import.meta.env.VITE_SUPABASE_URL)}
            </p>
          )}
          {findNonLatin1Chars(import.meta.env.VITE_SUPABASE_ANON_KEY) && (
            <p className="mt-1 text-red-600">
              พบอักขระผิดปกติใน ANON_KEY: {findNonLatin1Chars(import.meta.env.VITE_SUPABASE_ANON_KEY)}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'pick-identity' && roomId && names) {
    return (
      <IdentityPickerPage
        names={names}
        onPick={(key) => {
          setSelfKey(key);
          setPhase('ready');
        }}
      />
    );
  }

  if (phase === 'ready' && roomId && names && selfKey) {
    return (
      <RoomProvider roomId={roomId} initialNames={names} initialSelfKey={selfKey}>
        <MainApp showShareBannerInitially={isNewRoom} />
      </RoomProvider>
    );
  }

  return null;
}
