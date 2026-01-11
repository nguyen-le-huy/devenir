import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import logger from './config/logger.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import variantRoutes from './routes/variantRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import colorRoutes from './routes/colorRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import chatAnalyticsRoutes from './routes/chatAnalyticsRoutes.js';
import imageSearchRoutes from './routes/imageSearchRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userOrderRoutes from './routes/userOrderRoutes.js';
import financialRoutes from './routes/financialRoutes.js';
import shipmentRoutes from './routes/shipmentRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import customerIntelligenceRoutes from './routes/customerIntelligenceRoutes.js';
import EventLog from './models/EventLogModel.js';
import { handlePayOSWebhook } from './controllers/PaymentController.js';
import { initImageSearchServices } from './controllers/ImageSearchController.js';


dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

// ============ WEBHOOK ROUTES (BEFORE CORS - Allow external services) ============
// PayOS webhook - must be before CORS middleware
app.post('/api/payments/payos/webhook', express.json(), handlePayOSWebhook);

// ============ CORS MIDDLEWARE (MUST BE FIRST!) ============
// Middleware - CORS configuration cho nhiều origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://devenir-demo.vercel.app',
  'https://devenir-demo-*.vercel.app', // Preview deployments với wildcard
  'https://devenir-admin.vercel.app',
  'https://devenir.shop', // Domain chính
  'https://www.devenir.shop', // Subdomain www
  'https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net', // Tailscale domain
  /\.vercel\.app$/ // Allow ALL Vercel subdomains (preview & production)
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    }
    if (typeof allowedOrigin === 'string' && allowedOrigin.includes('*')) {
      const pattern = new RegExp('^' + allowedOrigin.replace(/\*/g, '.*') + '$');
      return pattern.test(origin);
    }
    return allowedOrigin === origin;
  });
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      return callback(null, true);
    }
    logger.warn('CORS blocked origin:', { origin });
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ============ SECURITY MIDDLEWARE ============

// Helmet - Security headers (after CORS!)
app.use(helmet({
  contentSecurityPolicy: false, // Tắt CSP để tránh conflict với CORS
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Dùng same-origin-allow-popups để cho phép Google OAuth popup postMessage
  // Đây là giá trị chuẩn cho OAuth popup flow
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  referrerPolicy: { policy: "no-referrer-when-downrage" },
}));
// Trust proxy - Required for Tailscale Funnel / reverse proxy
// This allows express-rate-limit to correctly identify clients via X-Forwarded-For
app.set('trust proxy', 1);

// Rate limiting - More generous for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Limit each IP to 1000 requests per minute (generous for local dev)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // Disable X-Forwarded-For validation (handled by trust proxy)
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  },
});

app.use('/api/', limiter);

// Data sanitization against NoSQL injection
// NOTE: Tạm thời tắt do conflict với Express version mới
// app.use(mongoSanitize({
//   replaceWith: '_',
//   onSanitize: ({ req, key }) => {
//     logger.warn('MongoDB injection attempt detected', { ip: req.ip, key });
//   },
// }));

// ============ PERFORMANCE MIDDLEWARE ============

// Compression middleware - compress all responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9, higher = more compression but slower)
}));

app.use(express.json({ limit: '50mb' })); // Increased limit for large image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';

    logger[logLevel](`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/colors', colorRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', userOrderRoutes); // Customer order tracking
app.use('/api/ping', eventRoutes); // Event tracking (renamed to 'ping' to avoid ad-blockers)
app.use('/api/activities', eventRoutes); // Fallback for old clients
app.use('/api/customers', customerRoutes);
app.use('/api/customers', customerIntelligenceRoutes); // Customer Intelligence API
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes); // RAG Chat API
app.use('/api/analytics/chatbot', chatAnalyticsRoutes); // Chatbot Analytics
app.use('/api/image-search', imageSearchRoutes); // Visual Search API
app.use('/api/social', socialRoutes); // Social Media Posting Proxy
app.use('/api/admin/orders', orderRoutes); // Admin Order Management
app.use('/api/admin/inventory', inventoryRoutes); // Inventory Management
app.use('/api/financial', financialRoutes); // Financial reporting
app.use('/api/admin/shipments', shipmentRoutes); // Shipment management

app.get('/', (req, res) => {
  res.send('API is running...');
});

// ============ SOCKET.IO SETUP ============
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) {
        return callback(null, true);
      }
      logger.warn('Socket CORS blocked origin:', { origin });
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  path: '/socket.io', // Explicitly set path
  allowEIO3: true, // Support older clients
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6, // 1MB
});

app.set('io', io);

io.use((socket, next) => {
  const authToken = socket.handshake.auth?.token
    || (socket.handshake.headers?.authorization || '').replace('Bearer ', '')
    || socket.handshake.query?.token;

  if (!authToken) {
    // Allow anonymous connection for tracking
    socket.userId = null;
    return next();
  }

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    return next();
  } catch (err) {
    // If token is invalid, treat as anonymous to prevent reconnection loops
    logger.warn('Socket auth failed (invalid token), proceeding as anonymous', { error: err.message });
    socket.userId = null;
    return next();
  }
});

io.on('connection', (socket) => {
  const { userId } = socket;

  if (userId) {
    socket.join(`user:${userId}`);
  }

  logger.info('Socket connected', { socketId: socket.id, userId });

  // Handle tracking events from client
  socket.on('track_event', async (eventData) => {
    try {
      const { type, data, timestamp } = eventData;

      if (!type) return;

      // Save to EventLog
      await EventLog.create({
        userId: userId || data?.userId || null,
        type,
        data: data || {},
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        sessionId: data?.sessionId || null,
        userAgent: socket.handshake.headers['user-agent'],
        ipAddress: socket.handshake.address,
      });

      logger.info(`✅ [Socket Event] ${type} - User: ${userId || 'anonymous'}`);
    } catch (error) {
      logger.error('Socket event tracking error:', error);
    }
  });

  socket.on('disconnect', (reason) => {
    logger.info('Socket disconnected', { socketId: socket.id, userId, reason });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3111;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running with realtime support on port ${PORT}`);

  // Auto-initialize image search services in background
  initImageSearchServices().then(success => {
    if (success) {
      console.log('✅ Image Search services ready');
    }
  });
});