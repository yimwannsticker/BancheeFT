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
 * ทำให้ manifest ของ PWA ชี้ไปที่ห้องปัจจุบันโดยตรง (start_url มี ?room= ติดไปด้วย)
 * เพื่อให้ตอนกด "เพิ่มไปยังหน้าจอโฮม" ไอคอนที่ได้เปิดเข้าห้องนี้เสมอ
 * (มือถือบางรุ่น เช่น iPhone เก็บ localStorage ของแอพที่ติดตั้งแยกจากเบราว์เซอร์
 *  การจำห้องด้วย localStorage อย่างเดียวจึงไม่พอ ต้องฝัง room ไว้ใน manifest เองด้วย)
 */
export async function setManifestStartUrl(roomId: string): Promise<void> {
  try {
    const linkEl = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const manifestHref = linkEl?.getAttribute('href') ?? '/manifest.webmanifest';
    const res = await fetch(manifestHref);
    const manifest = await res.json();

    const shareUrl = new URL(roomShareUrl(roomId));
    manifest.start_url = shareUrl.pathname + shareUrl.search;

    const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));
    if (linkEl) {
      linkEl.setAttribute('href', blobUrl);
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'manifest';
      newLink.setAttribute('href', blobUrl);
      document.head.appendChild(newLink);
    }
  } catch {
    // เบราว์เซอร์บางตัวอาจไม่รองรับ manifest แบบไดนามิก — ไม่ร้ายแรง ยังใช้งานเว็บได้ปกติ
  }
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
