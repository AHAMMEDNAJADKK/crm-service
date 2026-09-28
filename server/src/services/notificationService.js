const transporter = require('../config/mailer');
const { sendSMS, sendWhatsApp } = require('../config/twilio');
const Settings = require('../models/Settings');

// Helper to replace placeholders in templates
const formatTemplate = (template, data) => {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
};

const getSettings = async () => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create defaults if not present
      settings = await Settings.create({});
    }
    return settings;
  } catch (error) {
    console.error('Error fetching settings for notifications:', error.message);
    return {
      smsTemplates: {
        appointmentConfirmation: 'Hi {customerName}, your appointment for vehicle {vehicleReg} is confirmed for {date} at {time}. Thanks, AutoCare.',
        jobReady: 'Dear Customer, your vehicle {vehicleReg} is ready after service. Total invoice amount is Rs. {amount}. Thank you!',
        invoiceSent: 'Hi {customerName}, invoice {invoiceNumber} for Rs. {amount} has been sent to your email. Outstanding balance: Rs. {balance}.'
      }
    };
  }
};

const sendAppointmentConfirmation = async ({ customerName, mobile, email, vehicleReg, date, time }) => {
  try {
    const settings = await getSettings();
    const template = settings.smsTemplates.appointmentConfirmation;
    const body = formatTemplate(template, { customerName, vehicleReg, date, time });

    // Send SMS
    await sendSMS({ to: mobile, body });

    // Send Email if provided
    if (email) {
      await transporter.sendMail({
        from: '"AutoCare Service" <noreply@autocare.com>',
        to: email,
        subject: 'Appointment Confirmation - AutoCare',
        text: body
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to send appointment confirmation:', error.message);
    return false;
  }
};

const sendJobReadyNotification = async ({ customerName, mobile, email, vehicleReg, amount }) => {
  try {
    const settings = await getSettings();
    const template = settings.smsTemplates.jobReady;
    const body = formatTemplate(template, { customerName, vehicleReg, amount });

    // Send SMS / WhatsApp
    await sendSMS({ to: mobile, body });
    await sendWhatsApp({ to: mobile, body });

    // Send Email if provided
    if (email) {
      await transporter.sendMail({
        from: '"AutoCare Service" <noreply@autocare.com>',
        to: email,
        subject: 'Your Vehicle is Ready for Pickup - AutoCare',
        text: body
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to send job ready notification:', error.message);
    return false;
  }
};

const sendInvoiceNotification = async ({ customerName, mobile, email, invoiceNumber, amount, balance, pdfBuffer }) => {
  try {
    const settings = await getSettings();
    const template = settings.smsTemplates.invoiceSent;
    const body = formatTemplate(template, { customerName, invoiceNumber, amount, balance });

    // Send SMS
    await sendSMS({ to: mobile, body });

    // Send Email with PDF attachment if email is available
    if (email) {
      const attachments = pdfBuffer ? [{
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }] : [];

      await transporter.sendMail({
        from: '"AutoCare Service" <noreply@autocare.com>',
        to: email,
        subject: `Invoice ${invoiceNumber} - AutoCare`,
        text: body,
        attachments
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to send invoice notification:', error.message);
    return false;
  }
};

module.exports = {
  sendAppointmentConfirmation,
  sendJobReadyNotification,
  sendInvoiceNotification
};
