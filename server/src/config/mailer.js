const nodemailer = require('nodemailer');
const env = require('./env');

let transporter;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
  console.log('📧 Mailer Configured with SMTP Server');
} else {
  // Graceful fallback / Mock transporter
  transporter = {
    sendMail: async (options) => {
      console.log('📡 [Mailer MOCK]: SMTP not configured. Printing email content:');
      console.log(`   To:      ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   Text:    ${options.text || '(no plain text)'}`);
      if (options.attachments) {
        console.log(`   Attachments: ${options.attachments.map(a => a.filename).join(', ')}`);
      }
      return { messageId: 'mock-message-id' };
    }
  };
  console.log('📧 Mailer Configured with Console Mock Transporter');
}

module.exports = transporter;
