// Minimal UUID v4 generator (no extra dep needed in Node 24+)
const { randomUUID } = require('crypto');
module.exports = { v4: () => randomUUID() };
