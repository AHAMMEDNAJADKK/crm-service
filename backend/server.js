// AHAMMED SONS WATER SERVICE CRM - Backend Entry Forwarder
// Forwards to server/src/index.js ensuring single source of truth
const path = require('path');
require(path.join(__dirname, '../server/src/index.js'));
