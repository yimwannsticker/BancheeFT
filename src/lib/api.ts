import { supabase } from './supabase';
import type { Category, DraftEntry, Entry, RoomNames, SplitType } from '../types';

interface EntryRow {
  id: string;
  room_id: string;
  created_at: string;
  spent_at: string;
  payer: 'a' | 'b';
  description: string;
  category: string;
  amount_satang: number;
  split_type: SplitType;
  deleted_at: string | null;
}

interface RoomRow {
  id: string;
  name_a: string;
  name_b: string;
  created_at: string;
}

function rowToEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    roomId: row.room_id,
    createdAt: row.created_at,
    spentAt: row.spent_at,
    payer: row.payer,
    description: row.description,
    category: row.category as Category,
    amountSatang: row.amount_satang,
    splitType: row.split_type,
    deletedAt: row.deleted_at,
  };
}

export async function getOrCreateRoom(roomId: string): Promise<RoomNames> {
  const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).maybeSingle<RoomRow>();
  if (error) throw error;
  if (data) return { a: data.name_a, b: data.name_b };

  const defaults = { id: roomId, name_a: 'เตย', name_b: 'เฟิร์ส' };
  const { error: insertError } = await supabase.from('rooms').insert(defaults);
  if (insertError) throw insertError;
  return { a: defaults.name_a, b: defaults.name_b };
}

export async function updateRoomNames(roomId: string, names: RoomNames): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({ name_a: names.a, name_b: names.b })
    .eq('id', roomId);
  if (error) throw error;
}

export async function fetchEntries(roomId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('room_id', roomId)
    .is('deleted_at', null)
    .order('spent_at', { ascending: false });
  if (error) throw error;
  return (data as EntryRow[]).map(rowToEntry);
}

export async function insertEntry(roomId: string, draft: DraftEntry): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .insert({
      room_id: roomId,
      spent_at: draft.spentAt.toISOString(),
      payer: draft.payer,
      description: draft.description,
      category: draft.category,
      amount_satang: draft.amountSatang,
      split_type: draft.splitType,
    })
    .select('*')
    .single<EntryRow>();
  if (error) throw error;
  return rowToEntry(data);
}

export async function updateEntry(id: string, patch: Partial<DraftEntry>): Promise<void> {
  const update: Record<string, unknown> = {};
  if (patch.payer !== undefined) update.payer = patch.payer;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.category !== undefined) update.category = patch.category;
  if (patch.amountSatang !== undefined) update.amount_satang = patch.amountSatang;
  if (patch.splitType !== undefined) update.split_type = patch.splitType;
  if (patch.spentAt !== undefined) update.spent_at = patch.spentAt.toISOString();

  const { error } = await supabase.from('entries').update(update).eq('id', id);
  if (error) throw error;
}

export async function softDeleteEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

const TRASH_RETENTION_DAYS = 7;

/** รายการที่ถูกลบไปแล้วแต่ยังอยู่ในช่วงเก็บ (ยังไม่เกิน 7 วัน) เรียงลบล่าสุดก่อน */
export async function fetchDeletedEntries(roomId: string): Promise<Entry[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('room_id', roomId)
    .not('deleted_at', 'is', null)
    .gte('deleted_at', cutoff.toISOString())
    .order('deleted_at', { ascending: false });
  if (error) throw error;
  return (data as EntryRow[]).map(rowToEntry);
}

/** กู้คืนรายการที่ลบไปแล้ว (ยังไม่เกิน 7 วัน) */
export async function restoreEntry(id: string): Promise<void> {
  const { error } = await supabase.from('entries').update({ deleted_at: null }).eq('id', id);
  if (error) throw error;
}

/** ลบรายการที่อยู่ในถังขยะเกิน 7 วันทิ้งถาวร เรียกตอนเปิดแอพ (best-effort ไม่ต้องรอผลลัพธ์) */
export async function purgeExpiredDeleted(roomId: string): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);

  await supabase.from('entries').delete().eq('room_id', roomId).not('deleted_at', 'is', null).lt('deleted_at', cutoff.toISOString());
}

export function subscribeToEntries(roomId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`room-entries-${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'entries', filter: `room_id=eq.${roomId}` },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
