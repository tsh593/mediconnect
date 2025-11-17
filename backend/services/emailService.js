import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export function getTransporter() {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        throw new Error('SMTP configuration missing. Please set SMTP_HOST, SMTP_USER, SMTP_PASS');
    }
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
}

export async function sendBookingConfirmation({ to, userName, doctorName, specialty, date, time, confirmationNumber }) {
    const transporter = getTransporter();
    const subject = `Appointment Confirmation - ${doctorName} on ${date} at ${time}`;
    const html = `
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;">
            <h2>Appointment Confirmed</h2>
            <p>Hi ${userName},</p>
            <p>Your appointment has been scheduled successfully.</p>
            <ul>
                <li><strong>Doctor:</strong> ${doctorName} (${specialty})</li>
                <li><strong>Date & Time:</strong> ${date} ${time}</li>
                <li><strong>Confirmation #:</strong> ${confirmationNumber}</li>
            </ul>
            <p>Please arrive 10 minutes early and bring your ID and any relevant medical records.</p>
            <p>Best regards,<br/>MediConnect</p>
        </div>
    `;
    await transporter.sendMail({ from: SMTP_USER, to, subject, html });
}
