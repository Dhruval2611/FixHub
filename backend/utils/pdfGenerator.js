const PDFDocument = require('pdfkit');

/**
 * Generate a professional PDF receipt
 * @param {Object} data - Booking and payment data
 * @param {Stream} stream - The stream to write the PDF to
 */
const generateReceiptPDF = (data, stream) => {
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(stream);

    // --- Header Section ---
    doc.fillColor('#111827')
       .fontSize(24)
       .text('FixHub', { align: 'left', continued: true })
       .fontSize(10)
       .fillColor('#6B7280')
       .text('   PREMIUM SERVICES', { baseline: 'middle' });
    
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#9CA3AF').text('www.fixhub.com | support@fixhub.com', { align: 'left' });
    
    doc.rect(400, 50, 150, 60).fill('#F3F4F6');
    doc.fillColor('#4B5563').fontSize(14).text('RECEIPT', 410, 65);
    doc.fontSize(8).fillColor('#9CA3AF').text(`DATE: ${data.date}`, 410, 85);

    doc.moveDown(4);

    // --- Bill To Section ---
    const customerX = 50;
    const customerY = 140;
    
    doc.fillColor('#111827').fontSize(12).text('BILL TO:', customerX, customerY);
    doc.fontSize(10).fillColor('#374151');
    doc.text(data.name || 'Customer', customerX, customerY + 20);
    doc.text(data.email || '', customerX, customerY + 35);

    // --- Summary Box ---
    doc.rect(50, 200, 500, 40).fill('#111827');
    doc.fillColor('#FFFFFF').fontSize(10).text('SERVICE DETAILS', 65, 215);
    doc.text('DATE', 300, 215, { width: 50, align: 'center' });
    doc.text('TIME', 360, 215, { width: 50, align: 'center' });
    doc.text('AMOUNT', 480, 215, { align: 'right' });

    // --- Table Content ---
    let currentY = 255;
    data.bookings.forEach((booking, index) => {
        doc.fillColor('#374151').fontSize(10).text(booking.name || 'Service', 65, currentY);
        doc.text(booking.date ? new Date(booking.date).toLocaleDateString('en-IN') : '-', 300, currentY, { width: 50, align: 'center' });
        doc.text(booking.time || '-', 360, currentY, { width: 50, align: 'center' });
        doc.fillColor('#111827').text(`₹${booking.price || '-'}`, 480, currentY, { align: 'right' });
        
        currentY += 25;
        // Drawing a subtle line
        doc.moveTo(50, currentY - 10).lineTo(550, currentY - 10).strokeColor('#E5E7EB').lineWidth(0.5).stroke();
    });

    // --- Totals ---
    doc.moveDown(2);
    const summaryX = 350;
    const summaryWidth = 200;
    
    doc.fontSize(10).fillColor('#6B7280').text('SUBTOTAL:', summaryX, doc.y);
    doc.fillColor('#111827').text(`₹${data.amount}`, summaryX + summaryWidth / 2, doc.y - 12, { align: 'right' });
    
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#111827').text('TOTAL AMOUNT:', summaryX, doc.y, { bold: true });
    doc.fontSize(14).text(`₹${data.amount}`, summaryX + summaryWidth / 2, doc.y - 14, { align: 'right', bold: true });

    // --- Footer Metadata ---
    doc.moveDown(4);
    doc.fontSize(9).fillColor('#9CA3AF').text('TRANSACTION DETAILS', 50, doc.y);
    doc.moveTo(50, doc.y + 5).lineTo(250, doc.y + 5).strokeColor('#F3F4F6').stroke();
    
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#6B7280').text(`Transaction ID: ${data.transactionId || 'N/A'}`);
    doc.text(`Payment Method: ${data.paymentMethod || 'N/A'}`);
    doc.text(`Status: ${data.confirmed ? 'CONFIRMED' : 'PENDING'}`);

    // --- Bottom Logo/Thank You ---
    doc.fontSize(10).fillColor('#111827').text('Thank you for choosing FixHub Premium.', 50, 700, { align: 'center', width: 500 });

    doc.end();
};

module.exports = { generateReceiptPDF };
