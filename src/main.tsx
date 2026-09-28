import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { resolveAndPinRoomId } from './lib/room';
import './index.css';

// ทำก่อน React render อะไรทั้งนั้น เพื่อให้ manifest ชี้ห้องถูกต้องทันที
// ไม่มีช่วงเสี้ยววินาทีที่กด "เพิ่มไปยังหน้าจอโฮม" แล้วจับ manifest ผิดห้อง
const { roomId, isNewRoom } = resolveAndPinRoomId();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App initialRoomId={roomId} initialIsNewRoom={isNewRoom} />
  </React.StrictMode>,
);
