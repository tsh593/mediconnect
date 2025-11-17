import express from 'express';
import { addBooking, listBookings, isSlotBooked, generateDailySlots, cancelBooking } from '../services/bookingFileStore.js';
import { sendBookingConfirmation } from '../services/emailService.js';
import crypto from 'crypto';

const router = express.Router();

function validateBooking(body) {
    const errors = [];
    if (!body?.name) errors.push('name is required');
    if (!body?.age) errors.push('age is required');
    if (!body?.email) errors.push('email is required');
    if (!body?.specialty) errors.push('specialty is required');
    if (!body?.doctorId) errors.push('doctorId is required');
    if (!body?.doctorName) errors.push('doctorName is required');
    if (!body?.date) errors.push('date is required (YYYY-MM-DD)');
    if (!body?.time) errors.push('time is required (HH:mm)');
    return errors;
}

// GET /api/bookings/availability?doctorId=...&date=YYYY-MM-DD
router.get('/availability', async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) return res.status(400).json({ success: false, error: 'doctorId and date are required' });

        const slots = generateDailySlots();
        const booked = listBookings({ doctorId, date }).map(b => b.time);
        const availability = slots.map(t => ({ time: t, available: !booked.includes(t) }));
        res.json({ success: true, date, doctorId, availability });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/bookings/mine?email=...
router.get('/mine', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, error: 'email is required' });
        const bookings = listBookings({ email });
        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/bookings
router.post('/', async (req, res) => {
    try {
        const errors = validateBooking(req.body || {});
        if (errors.length) return res.status(400).json({ success: false, error: errors.join(', ') });

        const { name, age, email, specialty, doctorId, doctorName, date, time, type = 'in-person', notes = '' } = req.body;

        if (isSlotBooked(doctorId, date, time)) {
            return res.status(409).json({ success: false, error: 'Selected slot is no longer available' });
        }

        const confirmationNumber = `MC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const booking = {
            id: crypto.randomUUID(),
            doctorId,
            doctorName,
            specialty,
            user: { name, age, email },
            date,
            time,
            type,
            notes,
            status: 'confirmed',
            confirmationNumber,
            createdAt: new Date().toISOString()
        };

        addBooking(booking);

        // Try to email confirmation (non-fatal on error)
        try {
            await sendBookingConfirmation({
                to: email,
                userName: name,
                doctorName,
                specialty,
                date,
                time,
                confirmationNumber
            });
        } catch (mailErr) {
            console.warn('Email send failed:', mailErr.message);
        }

        res.status(201).json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/bookings/:id?email=...
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, error: 'email is required' });
        
        const cancelled = cancelBooking(id, email);
        if (!cancelled) {
            return res.status(404).json({ success: false, error: 'Booking not found or unauthorized' });
        }
        
        res.json({ success: true, message: 'Booking cancelled successfully', booking: cancelled });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
