import { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { TrashSection } from '../components/TrashSection';
import type { PersonKey } from '../types';

export function SettingsPage() {
  const { names, selfKey, updateNames, switchIdentity } = useRoom();
  const [nameA, setNameA] = useState(names.a);
  const [nameB, setNameB] = useState(names.b);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = nameA !== names.a || nameB !== names.b;

  const save = async () => {
    if (!nameA.trim() || !nameB.trim()) return;
    setSaving(true);
    try {
      await updateNames({ a: nameA.trim(), b: nameB.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">ชื่อทั้งสองคน</p>
        <div className="space-y-2">
          <input
            value={nameA}
            onChange={(e) => setNameA(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="ชื่อคนที่ 1"
          />
          <input
            value={nameB}
            onChange={(e) => setNameB(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="ชื่อคนที่ 2"
          />
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="mt-3 w-full rounded-lg bg-[var(--brand-500)] py-2 text-sm font-semibold text-[var(--brand-contrast)] disabled:opacity-40"
        >
          {saved ? 'บันทึกแล้ว ✓' : saving ? 'กำลังบันทึก...' : 'บันทึกชื่อ'}
        </button>
      </section>

      <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">เครื่องนี้เป็นของใคร</p>
        <div className="flex gap-2">
          {(['a', 'b'] as PersonKey[]).map((key) => (
            <button
              key={key}
              onClick={() => switchIdentity(key)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                selfKey === key
                  ? key === 'a'
                    ? 'border-person-a-500 bg-person-a-50 text-person-a-700 font-semibold'
                    : 'border-person-b-500 bg-person-b-50 text-person-b-700 font-semibold'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              ฉันคือ {names[key]}
            </button>
          ))}
        </div>
      </section>

      <TrashSection />

      <p className="mt-4 text-center text-[10px] text-gray-300">
        build: {new Date(__BUILD_TIME__).toLocaleString('th-TH')}
      </p>
    </div>
  );
}
