import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bookingsRoutes from './routes/bookings.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5180'],
    credentials: true
}));
app.use(express.json());

// Register booking routes only
app.use('/api/bookings', bookingsRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'MediConnect Bookings API',
        timestamp: new Date().toISOString()
    });
});

// Start server immediately (no CSV loading)
const server = app.listen(PORT, () => {
    console.log(`🚀 MediConnect Bookings API running on port ${PORT}`);
    console.log(`🌐 Health: http://localhost:${PORT}/health`);
    console.log(`📅 Bookings API: http://localhost:${PORT}/api/bookings`);
});

// Error handling
server.on('error', (err) => {
    console.error('❌ Server error:', err);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});
