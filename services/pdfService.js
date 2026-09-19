import PDFDocument from 'pdfkit';

/**
 * Generates a clean, professional PDF invoice for a booking.
 * Returns a Promise<Buffer>.
 */
export const generateInvoicePdf = (booking) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor   = '#4F46E5'; // Indigo-600
      const textColor      = '#1E293B'; // Slate-800
      const lightTextColor = '#64748B'; // Slate-500
      const bgColor        = '#F8FAFC'; // Slate-50

      const money = (val) => `Rs. ${Number(val || 0).toLocaleString('en-IN')}`;
      const formatDate = (d) => {
        if (!d) return '—';
        try {
          return new Date(d).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        } catch {
          return String(d);
        }
      };

      // --- Header / Branding ---
      doc.rect(0, 0, 595.28, 90).fill(primaryColor);

      doc
        .fillColor('#FFFFFF')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('SmartStay', 40, 25);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Hotel Booking & Dynamic Pricing System', 40, 55);

      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', 400, 25, { align: 'right' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(booking.invoiceNumber || 'INV-000', 400, 55, { align: 'right' });

      doc.moveDown(3);

      // --- Customer & Booking Info Meta Box ---
      const startY = 110;

      // Left Column: Customer
      doc
        .fillColor(lightTextColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('BILLED TO', 40, startY);

      doc
        .fillColor(textColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(booking.customerSnapshot?.name || 'Valued Guest', 40, startY + 15);

      doc
        .fillColor(lightTextColor)
        .fontSize(9.5)
        .font('Helvetica')
        .text(`Email: ${booking.customerSnapshot?.email || '—'}`, 40, startY + 32);

      if (booking.customerSnapshot?.phone) {
        doc.text(`Phone: ${booking.customerSnapshot.phone}`, 40, startY + 46);
      }

      // Right Column: Booking metadata
      doc
        .fillColor(lightTextColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('BOOKING DETAILS', 340, startY);

      doc
        .fillColor(textColor)
        .fontSize(9.5)
        .font('Helvetica')
        .text(`Booking ID: ${booking.bookingId}`, 340, startY + 15)
        .text(`Booking Date: ${formatDate(booking.createdAt)}`, 340, startY + 30)
        .text(`Payment ID: ${booking.paymentId || 'PAY-DEMO'}`, 340, startY + 45)
        .text(`Payment Method: ${booking.paymentMethod || 'DEMO Payment'}`, 340, startY + 60);

      // --- Hotel & Property Section ---
      const hotelY = startY + 90;
      doc
        .rect(40, hotelY, 515, 60)
        .fillAndStroke(bgColor, '#E2E8F0');

      doc
        .fillColor(primaryColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('PROPERTY DETAILS', 55, hotelY + 10);

      doc
        .fillColor(textColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(booking.hotelSnapshot?.name || 'SmartStay Property', 55, hotelY + 24);

      const locationStr = `${booking.hotelSnapshot?.address || ''}, ${booking.hotelSnapshot?.city || ''}${booking.hotelSnapshot?.state ? ', ' + booking.hotelSnapshot.state : ''}, India`;
      doc
        .fillColor(lightTextColor)
        .fontSize(9.5)
        .font('Helvetica')
        .text(locationStr, 55, hotelY + 40);

      // --- Itemized Breakdown Table ---
      const tableY = hotelY + 80;

      // Table Header
      doc
        .rect(40, tableY, 515, 24)
        .fill('#F1F5F9');

      doc
        .fillColor(textColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('ROOM & STAY DESCRIPTION', 50, tableY + 7)
        .text('NIGHTS', 300, tableY + 7, { width: 60, align: 'center' })
        .text('RATE / NIGHT', 370, tableY + 7, { width: 80, align: 'right' })
        .text('AMOUNT', 460, tableY + 7, { width: 85, align: 'right' });

      // Table Body Row
      const rowY = tableY + 30;
      doc
        .fillColor(textColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${booking.roomType || 'Standard'} Room #${booking.roomNumber || ''}`, 50, rowY);

      doc
        .fillColor(lightTextColor)
        .fontSize(8.5)
        .font('Helvetica')
        .text(
          `${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)}  |  ${booking.guests} Guest(s)`,
          50,
          rowY + 14
        );

      doc
        .fillColor(textColor)
        .fontSize(9.5)
        .font('Helvetica')
        .text(String(booking.nights || 1), 300, rowY + 5, { width: 60, align: 'center' })
        .text(money(booking.pricePerNight), 370, rowY + 5, { width: 80, align: 'right' })
        .text(money(booking.subtotal), 460, rowY + 5, { width: 85, align: 'right' });

      doc
        .moveTo(40, rowY + 35)
        .lineTo(555, rowY + 35)
        .strokeColor('#CBD5E1')
        .stroke();

      // --- Summary Totals ---
      const summaryY = rowY + 45;

      doc
        .fillColor(lightTextColor)
        .fontSize(9.5)
        .text('Room Subtotal:', 350, summaryY, { width: 100, align: 'right' })
        .fillColor(textColor)
        .text(money(booking.subtotal), 460, summaryY, { width: 85, align: 'right' });

      doc
        .fillColor(lightTextColor)
        .fontSize(9.5)
        .text('GST (12%):', 350, summaryY + 18, { width: 100, align: 'right' })
        .fillColor(textColor)
        .text(money(booking.tax), 460, summaryY + 18, { width: 85, align: 'right' });

      // Total Paid Box
      doc
        .rect(340, summaryY + 38, 215, 30)
        .fill(primaryColor);

      doc
        .fillColor('#FFFFFF')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('TOTAL PAID:', 350, summaryY + 47)
        .text(money(booking.totalAmount), 450, summaryY + 47, { width: 95, align: 'right' });

      // --- Footer Notice ---
      const footerY = 740;
      doc
        .rect(40, footerY, 515, 45)
        .fill('#F8FAFC');

      doc
        .fillColor(lightTextColor)
        .fontSize(8)
        .font('Helvetica')
        .text(
          'Thank you for booking with SmartStay! This is a DEMO payment confirmation & invoice generated for a college project.',
          45,
          footerY + 10,
          { align: 'center', width: 505 }
        )
        .text(
          'No actual financial transaction occurred. Keep this receipt for your records.',
          45,
          footerY + 25,
          { align: 'center', width: 505 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
