import { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import * as api from '../lib/api';
import { formatBaht } from '../lib/money';
import { formatDateThai, splitTypeLabel } from '../lib/format';
import type { Entry } from '../types';

export function TrashSection() {
  const { roomId, names, restoreEntry } = useRoom();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState<Entry[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setDeleted(await api.fetchDeletedEntries(roomId));
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await restoreEntry(id);
      setDeleted((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
      <button onClick={toggle} className="flex w-full items-center justify-between text-sm font-semibold text-gray-600">
        <span>🗑️ ถังขยะ</span>
        <span className="text-xs font-normal text-gray-400">{open ? 'ซ่อน ▲' : 'แสดง ▼'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-400">รายการที่ลบจะเก็บไว้ที่นี่ 7 วัน ก่อนลบถาวรอัตโนมัติ</p>

          {loading && <p className="py-2 text-center text-sm text-gray-400">กำลังโหลด...</p>}

          {!loading && deleted.length === 0 && (
            <p className="py-2 text-center text-sm text-gray-400">ไม่มีรายการในถังขยะ</p>
          )}

          {deleted.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 p-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-gray-700">
                  {names[entry.payer]} · {entry.description}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDateThai(entry.spentAt)} · {splitTypeLabel(entry.splitType)} · {formatBaht(entry.amountSatang)} ฿
                </p>
              </div>
              <button
                onClick={() => handleRestore(entry.id)}
                disabled={restoringId === entry.id}
                className="shrink-0 rounded-lg bg-[var(--brand-50)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-600)] disabled:opacity-40"
              >
                {restoringId === entry.id ? 'กำลังกู้คืน...' : 'กู้คืน'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
