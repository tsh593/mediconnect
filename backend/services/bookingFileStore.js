import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

function ensureStore() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, JSON.stringify({ bookings: [] }, null, 2));
}

export function readAll() {
    ensureStore();
    const raw = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
    try { return JSON.parse(raw); } catch {
        return { bookings: [] };
    }
}

export function writeAll(store) {
    ensureStore();
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(store, null, 2));
}

export function listBookings(filter = {}) {
    const store = readAll();
    return store.bookings.filter(b => {
        if (filter.email && b.user?.email?.toLowerCase() !== String(filter.email).toLowerCase()) return false;
        if (filter.doctorId && b.doctorId !== filter.doctorId) return false;
        if (filter.date && b.date !== filter.date) return false;
        return true;
    });
}

export function addBooking(booking) {
    const store = readAll();
    store.bookings.push(booking);
    writeAll(store);
    return booking;
}

export function cancelBooking(bookingId, userEmail) {
    const store = readAll();
    const index = store.bookings.findIndex(b => b.id === bookingId && b.user?.email === userEmail);
    if (index === -1) return null;
    const [cancelled] = store.bookings.splice(index, 1);
    writeAll(store);
    return cancelled;
}

export function isSlotBooked(doctorId, date, time) {
    const store = readAll();
    return store.bookings.some(b => b.doctorId === doctorId && b.date === date && b.time === time);
}

export function generateDailySlots(start = '09:00', end = '17:00', intervalMinutes = 30) {
    const toMinutes = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    const pad = (n) => String(n).padStart(2, '0');
    const slots = [];
    for (let m = toMinutes(start); m < toMinutes(end); m += intervalMinutes) {
        const h = Math.floor(m / 60);
        const mm = m % 60;
        slots.push(`${pad(h)}:${pad(mm)}`);
    }
    return slots;
}
