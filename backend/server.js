import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 4000;
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'takreem.jaffery@gmail.com';

app.use(cors());
app.use(express.json());

// Only send real email if SMTP credentials are configured (see .env.example).
// Without them, submissions are just logged — handy for local dev.
const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are all required.' });
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'That email address looks invalid.' });
  }

  try {
    if (transporter) {
      await transporter.sendMail({
        from: `"Portfolio contact form" <${process.env.SMTP_USER}>`,
        to: CONTACT_TO_EMAIL,
        replyTo: email,
        subject: `New portfolio message from ${name}`,
        text: message,
      });
    } else {
      console.log('--- New contact form submission (SMTP not configured, logging only) ---');
      console.log({ name, email, message });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to send contact email:', err);
    res.status(500).json({ error: 'Something went wrong sending your message.' });
  }
});

app.listen(PORT, () => {
  console.log(`Contact API listening on http://localhost:${PORT}`);
  if (!smtpConfigured) {
    console.log('SMTP not configured — submissions will be logged to the console only. See .env.example.');
  }
});
