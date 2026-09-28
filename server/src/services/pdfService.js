const fs = require('fs');
const PDFDocument = require('pdfkit');

// Helper to draw horizontal lines
const drawLine = (doc, y) => {
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
};

const generateInvoicePDF = (invoice, customer, settings) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- BRANDING HEADER ---
      let headerY = 50;
      if (settings.logoPath && fs.existsSync(settings.logoPath)) {
        try {
          doc.image(settings.logoPath, 50, headerY, { height: 50 });
          headerY += 60;
        } catch (e) {
          console.error("PDF Invoice logo render failed:", e);
          doc.fillColor('#1e293b').fontSize(22).text(settings.stationName || 'AquaClean Vehicle Service', 50, headerY);
          headerY += 25;
        }
      } else {
        doc.fillColor('#1e293b').fontSize(22).text(settings.stationName || 'AquaClean Vehicle Service', 50, headerY);
        headerY += 25;
      }

      doc.fillColor('#64748b').fontSize(10).text(settings.address || 'Plot 42, Bypass Road, Ernakulam, Kerala', 50, headerY);
      doc.text(`GSTIN: ${settings.gstNumber || '32AAAAA0000A1Z2'} | Phone: ${settings.mobile || '9539691738'}`, 50, headerY + 15);
      
      let nextSectionY = headerY + 35;
      drawLine(doc, nextSectionY);
      nextSectionY += 20;

      // --- INVOICE & CUSTOMER INFO ---
      doc.fillColor('#1e293b').fontSize(12).text('Invoice Details', 50, nextSectionY, { underline: true });
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Invoice No: ${invoice.invoiceNumber}`, 50, nextSectionY + 20);
      doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 50, nextSectionY + 35);
      doc.text(`Payment Status: ${invoice.paymentStatus.toUpperCase()}`, 50, nextSectionY + 50);
      doc.text(`Payment Method: ${invoice.paymentMethod.toUpperCase()}`, 50, nextSectionY + 65);

      doc.fillColor('#1e293b').fontSize(12).text('Bill To / Customer', 300, nextSectionY, { underline: true });
      doc.fontSize(10).fillColor('#334155');
      if (customer) {
        doc.text(`Name: ${customer.name}`, 300, nextSectionY + 20);
        doc.text(`Mobile: ${customer.mobile}`, 300, nextSectionY + 35);
        if (customer.email) doc.text(`Email: ${customer.email}`, 300, nextSectionY + 50);
      } else {
        doc.text(`Name: Walk-in Customer`, 300, nextSectionY + 20);
      }
      doc.text(`Vehicle Reg: ${invoice.vehicleReg}`, 300, nextSectionY + 80);
      doc.text(`Vehicle Type: ${invoice.vehicleType.toUpperCase()}`, 300, nextSectionY + 95);

      let tableHeaderY = nextSectionY + 120;
      drawLine(doc, tableHeaderY);
      tableHeaderY += 20;

      // --- TABLE HEADER ---
      doc.fillColor('#1e293b').fontSize(10);
      doc.text('Description (Wash Package)', 50, tableHeaderY, { width: 250 });
      doc.text('Qty', 300, tableHeaderY, { width: 50, align: 'right' });
      doc.text('Unit Price (Rs)', 370, tableHeaderY, { width: 85, align: 'right' });
      doc.text('Amount (Rs)', 470, tableHeaderY, { width: 80, align: 'right' });
      
      let tableContentY = tableHeaderY + 15;
      drawLine(doc, tableContentY);
      tableContentY += 10;

      // --- TABLE ITEMS ---
      doc.fillColor('#334155');
      doc.text(invoice.washPackage.replace('-', ' ').toUpperCase(), 50, tableContentY, { width: 250 });
      doc.text('1', 300, tableContentY, { width: 50, align: 'right' });
      doc.text(invoice.amount.toFixed(2), 370, tableContentY, { width: 85, align: 'right' });
      doc.text(invoice.amount.toFixed(2), 470, tableContentY, { width: 80, align: 'right' });
      
      let sumY = tableContentY + 25;
      drawLine(doc, sumY);
      sumY += 15;

      // --- CALCULATIONS SUMMARY ---
      doc.fillColor('#1e293b');
      doc.text('Sub Total:', 350, sumY, { width: 100, align: 'right' });
      doc.text(`Rs. ${invoice.amount.toFixed(2)}`, 470, sumY, { width: 80, align: 'right' });

      sumY += 15;
      doc.text(`GST (${invoice.taxRate}%):`, 350, sumY, { width: 100, align: 'right' });
      doc.text(`Rs. ${invoice.taxAmount.toFixed(2)}`, 470, sumY, { width: 80, align: 'right' });

      sumY += 20;
      doc.fontSize(12);
      doc.text('Grand Total:', 350, sumY, { width: 100, align: 'right' });
      doc.text(`Rs. ${invoice.grandTotal.toFixed(2)}`, 470, sumY, { width: 80, align: 'right' });

      // Footer notice
      doc.fontSize(9).fillColor('#94a3b8').text('Thank you for choosing AquaClean! Drive clean, drive safe.', 50, 750, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

const generateWashJobPDF = (job, customer, settings) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- HEADER ---
      let headerY = 50;
      if (settings.logoPath && fs.existsSync(settings.logoPath)) {
        try {
          doc.image(settings.logoPath, 50, headerY, { height: 50 });
          headerY += 60;
        } catch (e) {
          console.error("PDF Job Card logo render failed:", e);
          doc.fillColor('#1e293b').fontSize(22).text(settings.stationName || 'AquaClean Vehicle Service', 50, headerY);
          headerY += 25;
        }
      } else {
        doc.fillColor('#1e293b').fontSize(22).text(settings.stationName || 'AquaClean Vehicle Service', 50, headerY);
        headerY += 25;
      }

      doc.fontSize(12).fillColor('#64748b').text('WASH JOB SERVICING TICKET', 50, headerY);
      
      let nextSectionY = headerY + 25;
      drawLine(doc, nextSectionY);
      nextSectionY += 20;

      // --- METADATA ---
      doc.fillColor('#1e293b').fontSize(11);
      doc.text(`Token Number: ${job.tokenNumber}`, 50, nextSectionY);
      doc.text(`Status: ${job.status.toUpperCase()}`, 50, nextSectionY + 15);
      doc.text(`Date Logged: ${new Date(job.createdAt).toLocaleString('en-IN')}`, 50, nextSectionY + 30);

      // --- CUSTOMER & VEHICLE ---
      doc.text('Customer Details', 250, nextSectionY, { underline: true });
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Name: ${customer ? customer.name : 'Walk-in Customer'}`, 250, nextSectionY + 15);
      if (customer) {
        doc.text(`Mobile: ${customer.mobile}`, 250, nextSectionY + 30);
      }

      doc.fillColor('#1e293b').fontSize(11).text('Vehicle Details', 420, nextSectionY, { underline: true });
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Reg No: ${job.vehicleReg}`, 420, nextSectionY + 15);
      doc.text(`Type: ${job.vehicleType.toUpperCase()}`, 420, nextSectionY + 30);
      doc.text(`Bay Number: ${job.bayNumber || 'Queued'}`, 420, nextSectionY + 45);

      let detailY = nextSectionY + 70;
      drawLine(doc, detailY);
      detailY += 20;

      // --- DETAILS ---
      doc.fillColor('#1e293b').fontSize(12).text('Wash Operations Details', 50, detailY);
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Package: ${job.washPackage.replace('-', ' ').toUpperCase()}`, 50, detailY + 20);
      doc.text(`Assigned Staff: ${job.assignedStaff || 'Unassigned'}`, 50, detailY + 40);
      doc.text(`Water Consumption: ${job.waterUsedLitres || 0} Litres`, 50, detailY + 60);
      doc.text(`Notes: ${job.notes || 'None'}`, 50, detailY + 80);

      let footerY = detailY + 140;
      drawLine(doc, footerY);
      footerY += 20;

      doc.fontSize(12).fillColor('#1e293b');
      doc.text(`Wash Charge: Rs. ${job.price.toFixed(2)}`, 350, footerY, { width: 200, align: 'right' });

      doc.fontSize(9).fillColor('#94a3b8').text('Show this ticket at the counter for pickup.', 50, 750, { align: 'center' });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  generateWashJobPDF
};
