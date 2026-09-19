import nodemailer from 'nodemailer';

/**
 * Constructs an HTML email template for booking confirmation & invoice receipt.
 */
const buildConfirmationHtml = (booking, recipientEmail) => {
  const money = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;
  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return String(d);
    }
  };

  const customerName = booking.customerSnapshot?.name || 'Valued Guest';
  const hotelName    = booking.hotelSnapshot?.name || 'SmartStay Hotel';
  const hotelAddress = `${booking.hotelSnapshot?.address || ''}, ${booking.hotelSnapshot?.city || ''}${booking.hotelSnapshot?.state ? ', ' + booking.hotelSnapshot.state : ''}, India`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
      .header { background-color: #4f46e5; padding: 32px 24px; text-align: center; color: #ffffff; }
      .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
      .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
      .content { padding: 24px; }
      .badge { display: inline-block; background-color: #d1fae5; color: #047857; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
      .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 8px; }
      .card { background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #f1f5f9; }
      .hotel-name { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
      .hotel-address { font-size: 14px; color: #64748b; margin: 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; }
      td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
      td.label { color: #64748b; }
      td.val { text-align: right; font-weight: 600; color: #0f172a; }
      .total-row td { border-bottom: none; font-size: 16px; font-weight: 700; color: #4f46e5; padding-top: 14px; }
      .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; background-color: #fafafa; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>SmartStay</h1>
        <p>Booking Confirmation & Payment Receipt</p>
      </div>

      <div class="content">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hello <strong>${customerName}</strong>,<br>
          Your booking has been successfully confirmed. Find your stay details and receipt below.
        </p>

        <div style="margin-bottom: 20px;">
          <span class="badge">Payment Confirmed · ${booking.paymentStatus}</span>
        </div>

        <div class="section-title">Hotel / Homestay</div>
        <div class="card">
          <p class="hotel-name">${hotelName}</p>
          <p class="hotel-address">${hotelAddress}</p>
        </div>

        <div class="section-title">Stay & Booking Details</div>
        <div class="card">
          <table>
            <tr><td class="label">Booking ID</td><td class="val">${booking.bookingId}</td></tr>
            <tr><td class="label">Invoice Number</td><td class="val">${booking.invoiceNumber}</td></tr>
            <tr><td class="label">Room Type</td><td class="val">${booking.roomType} Room #${booking.roomNumber}</td></tr>
            <tr><td class="label">Check-in Date</td><td class="val">${formatDate(booking.checkIn)}</td></tr>
            <tr><td class="label">Check-out Date</td><td class="val">${formatDate(booking.checkOut)}</td></tr>
            <tr><td class="label">Nights</td><td class="val">${booking.nights} night(s)</td></tr>
            <tr><td class="label">Guests</td><td class="val">${booking.guests} guest(s)</td></tr>
          </table>
        </div>

        <div class="section-title">Payment Breakdown</div>
        <div class="card">
          <table>
            <tr><td class="label">Price per night</td><td class="val">${money(booking.pricePerNight)}</td></tr>
            <tr><td class="label">Room Subtotal</td><td class="val">${money(booking.subtotal)}</td></tr>
            <tr><td class="label">GST (12%)</td><td class="val">${money(booking.tax)}</td></tr>
            <tr class="total-row"><td class="label" style="color: #4f46e5;">Total Paid</td><td class="val">${money(booking.totalAmount)}</td></tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          A PDF copy of your official SmartStay invoice is attached to this email. You can also view or download your invoice anytime from <strong>My Stays</strong> on the website.
        </p>
      </div>

      <div class="footer">
        <p>This is a DEMO booking receipt for a college project.<br>Sent to: <strong>${recipientEmail}</strong></p>
        <p style="margin-top: 8px;">SmartStay © 2026 — Hotel Booking & Dynamic Pricing System</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Creates Nodemailer transport based on environment variables.
 */
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
};

/**
 * Sends booking confirmation email + PDF invoice attachment to the customer's registered email.
 *
 * @param {Object} options
 * @param {Object} options.booking — Mongoose booking document
 * @param {string} options.recipientEmail — Registered email of the authenticated user
 * @param {Buffer} [options.pdfBuffer] — In-memory PDF Buffer
 */
export const sendBookingEmail = async ({ booking, recipientEmail, pdfBuffer }) => {
  if (!recipientEmail) {
    return { success: false, error: 'Recipient email address is missing.' };
  }

  const subject = `SmartStay Booking Confirmed – Booking #${booking.bookingId}`;
  const html    = buildConfirmationHtml(booking, recipientEmail);
  const from    = process.env.EMAIL_FROM || 'SmartStay <noreply@smartstay.com>';

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `SmartStay-Invoice-${booking.bookingId}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }

  const transporter = createTransporter();

  // If real SMTP transporter is configured, attempt sending real email
  if (transporter && process.env.EMAIL_PROVIDER !== 'mock') {
    try {
      const info = await transporter.sendMail({
        from,
        to: recipientEmail,
        subject,
        html,
        attachments,
      });

      console.log(`[EMAIL SENT] Booking #${booking.bookingId} invoice sent to ${recipientEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, provider: 'smtp' };
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send via SMTP to ${recipientEmail}:`, err.message);
      // Fallback to console log mode below
    }
  }

  // Development / Mock mode logging (console)
  console.log('\n============================================================');
  console.log(`📧 [DEV EMAIL MOCK SERVICE]`);
  console.log(`To:          ${recipientEmail}`);
  console.log(`From:        ${from}`);
  console.log(`Subject:     ${subject}`);
  console.log(`Booking ID:  ${booking.bookingId}`);
  console.log(`Invoice No:  ${booking.invoiceNumber}`);
  console.log(`Amount:      Rs. ${booking.totalAmount}`);
  console.log(`Attachment:  SmartStay-Invoice-${booking.bookingId}.pdf (${pdfBuffer ? pdfBuffer.length : 0} bytes)`);
  console.log('============================================================\n');

  return {
    success: true,
    messageId: `mock-${Date.now()}`,
    provider: 'mock',
    note: 'Logged to server console (mock dev mode). Set SMTP environment variables in .env to send real emails.',
  };
};
