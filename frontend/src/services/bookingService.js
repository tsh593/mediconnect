// Frontend booking service for interacting with backend booking API

const API_BASE = '/api/bookings';

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}

export async function getAvailability(doctorId, date) {
  return jsonFetch(`${API_BASE}/availability?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);
}

export async function createBooking(payload) {
  return jsonFetch(`${API_BASE}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function myBookings(email) {
  return jsonFetch(`${API_BASE}/mine?email=${encodeURIComponent(email)}`);
}

export async function cancelBooking(bookingId, email) {
  return jsonFetch(`${API_BASE}/${encodeURIComponent(bookingId)}?email=${encodeURIComponent(email)}`, {
    method: 'DELETE',
  });
}

export const bookingService = { getAvailability, createBooking, myBookings, cancelBooking };
