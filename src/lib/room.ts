import type { PersonKey } from '../types';

/**
 * ห้องเดียวตายตัวสำหรับคนสองคนที่ใช้แอพนี้ ไม่มีระบบหลายห้อง/ลิงก์ต่อท้าย ?room=
 * อีกต่อไป (เจตนา: ตัดปัญหาเข้าผิดห้องตอนแชร์ลิงก์หรือกด "เพิ่มไปยังหน้าจอโฮม")
 * ทุกคนที่เปิด URL ของเว็บนี้จะเข้าห้องเดียวกันเสมอ
 */
export const ROOM_ID = '040r3y686q0y6d';

const IDENTITY_KEY = 'bancheeft:identity';

export function getDeviceIdentity(): PersonKey | null {
  try {
    const value = window.localStorage.getItem(IDENTITY_KEY);
    return value === 'a' || value === 'b' ? value : null;
  } catch {
    return null;
  }
}

export function setDeviceIdentity(key: PersonKey): void {
  try {
    window.localStorage.setItem(IDENTITY_KEY, key);
  } catch {
    // ไม่สามารถบันทึกได้ (เช่น private mode) — ไม่ร้ายแรง แค่ต้องเลือกใหม่ครั้งหน้า
  }
}
