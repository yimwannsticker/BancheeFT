import type { PersonKey } from '../types';

const ROOM_QUERY_KEY = 'room';

export function getRoomIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(ROOM_QUERY_KEY);
}

export function generateRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 14);
}

export function setRoomIdInUrl(roomId: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(ROOM_QUERY_KEY, roomId);
  window.history.replaceState({}, '', url.toString());
}

export function roomShareUrl(roomId: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set(ROOM_QUERY_KEY, roomId);
  return url.toString();
}

const LAST_ROOM_KEY = 'bancheeft:lastRoomId';

/** ห้องล่าสุดที่เครื่องนี้เคยเข้า ใช้ตอนเปิดแอพผ่านไอคอนที่ติดตั้งไว้ (ไม่มี ?room= ต่อท้าย)
 * จะได้กลับเข้าห้องเดิมแทนที่จะสร้างห้องใหม่ทุกครั้ง */
export function getLastRoomId(): string | null {
  try {
    return window.localStorage.getItem(LAST_ROOM_KEY);
  } catch {
    return null;
  }
}

export function setLastRoomId(roomId: string): void {
  try {
    window.localStorage.setItem(LAST_ROOM_KEY, roomId);
  } catch {
    // ไม่สามารถบันทึกได้ (เช่น private mode) — ไม่ร้ายแรง
  }
}

/**
 * ค่า manifest เดียวกับที่ตั้งไว้ใน vite.config.ts (VitePWA manifest) — ถ้าแก้ตรงนั้น
 * ต้องแก้ตรงนี้ให้ตรงกันด้วย เขียนซ้ำไว้ตรงนี้เพื่อสร้าง manifest แบบ sync ได้ทันที
 * ไม่ต้องรอ fetch ไฟล์ (ตัด race condition ตอนกด "เพิ่มไปยังหน้าจอโฮม" เร็วเกินไป)
 */
const MANIFEST_BASE = {
  name: 'BancheeFirstTeui',
  short_name: 'BancheeFirstTeui',
  description: 'บันทึกว่าใครจ่ายอะไรแทนกัน และสรุปยอดปลายเดือน',
  theme_color: '#9333ea',
  background_color: '#faf5ff',
  display: 'standalone',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

/**
 * ทำให้ manifest ของ PWA ชี้ไปที่ห้องปัจจุบันโดยตรง (start_url มี ?room= ติดไปด้วย)
 * เพื่อให้ตอนกด "เพิ่มไปยังหน้าจอโฮม" ไอคอนที่ได้เปิดเข้าห้องนี้เสมอ ทำแบบ synchronous
 * ล้วนๆ (ไม่ fetch ไฟล์ใดๆ) เพราะถ้าทำแบบ async จะมีช่วงเสี้ยววินาทีที่ manifest
 * ยังเป็นค่าเดิมอยู่ ถ้าผู้ใช้กด "เพิ่มไปยังหน้าจอโฮม" เร็วเกินไปจะจับค่าเก่าไปแทน
 */
export function setManifestStartUrlSync(roomId: string): void {
  try {
    const shareUrl = new URL(roomShareUrl(roomId));
    const manifest = { ...MANIFEST_BASE, start_url: shareUrl.pathname + shareUrl.search };
    const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));

    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.setAttribute('href', blobUrl);
  } catch {
    // เบราว์เซอร์บางตัวอาจไม่รองรับ manifest แบบไดนามิก — ไม่ร้ายแรง ยังใช้งานเว็บได้ปกติ
  }
}

/**
 * หาว่าตอนนี้ควรใช้ห้องไหน (จาก ?room= ในลิงก์ / ห้องล่าสุดที่เครื่องนี้เคยเข้า / สร้างใหม่)
 * แล้ว "ปักหมุด" ทันที: อัปเดต URL, จำไว้ใน localStorage, และฝังลง manifest แบบ sync
 * เรียกครั้งเดียวตอนแอพเริ่มทำงาน ก่อน React จะ render อะไรทั้งนั้น
 */
export function resolveAndPinRoomId(): { roomId: string; isNewRoom: boolean } {
  let roomId = getRoomIdFromUrl();
  let isNewRoom = false;

  if (!roomId) {
    const resumed = getLastRoomId();
    if (resumed) {
      roomId = resumed;
    } else {
      roomId = generateRoomId();
      isNewRoom = true;
    }
    setRoomIdInUrl(roomId);
  }

  setLastRoomId(roomId);
  setManifestStartUrlSync(roomId);

  return { roomId, isNewRoom };
}

function identityStorageKey(roomId: string): string {
  return `bancheeft:identity:${roomId}`;
}

export function getDeviceIdentity(roomId: string): PersonKey | null {
  try {
    const value = window.localStorage.getItem(identityStorageKey(roomId));
    return value === 'a' || value === 'b' ? value : null;
  } catch {
    return null;
  }
}

export function setDeviceIdentity(roomId: string, key: PersonKey): void {
  try {
    window.localStorage.setItem(identityStorageKey(roomId), key);
  } catch {
    // ไม่สามารถบันทึกได้ (เช่น private mode) — ไม่ร้ายแรง แค่ต้องเลือกใหม่ครั้งหน้า
  }
}
