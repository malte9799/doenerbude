import { brand } from '../../brand/brand.js';

// Parses brand.hours entries like { days: 'Mo–Do', time: '11:00–23:00' }.
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const toMinutes = hhmm => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

const covers = (days, idx) => {
  const [from, to = from] = days.split(/[–-]/).map(s => DAYS.indexOf(s.trim().slice(0, 2)));
  if (from < 0 || to < 0) return false;
  return from <= to ? idx >= from && idx <= to : idx >= from || idx <= to;
};

// Today's opening window in minutes since midnight; close may exceed 1440
// when the shop stays open past midnight.
export function todaysHours(now = new Date()) {
  const idx = (now.getDay() + 6) % 7; // Monday = 0
  const entry = brand.hours.find(h => covers(h.days, idx));
  if (!entry) return null;
  const [open, close] = entry.time.split(/[–-]/).map(toMinutes);
  return { open, close: close <= open ? close + 1440 : close };
}

export const hhmm = minutes => {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

// 15-minute slots from "now + shortest ETA" (rounded up) to closing time.
export function timeSlots(now = new Date()) {
  const hours = todaysHours(now);
  if (!hours) return [];
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const earliest = Math.max(hours.open, nowMin + brand.delivery.etaMinutes[0]);
  const start = Math.ceil(earliest / 15) * 15;
  const slots = [];
  for (let m = start; m <= hours.close - 15; m += 15) slots.push({ value: hhmm(m), minutes: m });
  return slots;
}
