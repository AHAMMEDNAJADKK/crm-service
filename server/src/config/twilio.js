const env = require('./env');

let twilioClient = null;

if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    console.log('📱 Twilio client configured');
  } catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
  }
}

const sendSMS = async ({ to, body }) => {
  if (twilioClient && env.TWILIO_PHONE_NUMBER) {
    try {
      const response = await twilioClient.messages.create({
        body,
        from: env.TWILIO_PHONE_NUMBER,
        to
      });
      return response;
    } catch (error) {
      console.error('❌ Twilio SMS Error:', error.message);
      throw error;
    }
  } else {
    console.log(`📱 [Twilio SMS MOCK]:\n   To: ${to}\n   Message: ${body}`);
    return { sid: 'mock-sms-sid' };
  }
};

const sendWhatsApp = async ({ to, body }) => {
  if (twilioClient && env.TWILIO_WHATSAPP_NUMBER) {
    try {
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const response = await twilioClient.messages.create({
        body,
        from: `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`,
        to: formattedTo
      });
      return response;
    } catch (error) {
      console.error('❌ Twilio WhatsApp Error:', error.message);
      throw error;
    }
  } else {
    console.log(`📱 [Twilio WhatsApp MOCK]:\n   To: ${to}\n   Message: ${body}`);
    return { sid: 'mock-whatsapp-sid' };
  }
};

module.exports = {
  sendSMS,
  sendWhatsApp
};
