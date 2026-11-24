require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { Server } = require('socket.io');
const winston = require('winston');

// ── Init DB (node:sqlite built-in — no install needed) ───────────────────────
const { initDb }   = require('./db/initSqlite');
const { seedDemo } = require('./db/seedDemo');
initDb();
seedDemo();

const staffRoutes     = require('./routes/staffRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const authRoutes      = require('./routes/authRoutes');

// ── Logger ───────────────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// ── App + Socket.IO ───────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true },
});
io.on('connection', (socket) => {
  const { staffId } = socket.handshake.query;
  if (staffId) socket.join(`staff_${staffId}`);
  logger.info(`Socket connected: ${socket.id}`);
});
app.set('io', io);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => { logger.info(`${req.method} ${req.url}`); next(); });

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/staff',      staffRoutes);
app.use('/api/complaints', complaintRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', module: 'staff-maintenance', db: 'node:sqlite (built-in)', ts: new Date() })
);
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use((err, _req, res, _next) => {
  logger.error(err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  logger.info(`🚀  Staff Maintenance API → http://localhost:${PORT}`)
);
