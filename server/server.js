import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { Server as SocketIOServer } from 'socket.io';
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
import { handlePayOSWebhook } from './controllers/PaymentController.js';


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
  'https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net' // Thêm Tailscale domain
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin.includes('*')) {
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
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

// Rate limiting - More generous for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Limit each IP to 1000 requests per minute (generous for local dev)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
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
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes); // RAG Chat API

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
  },
  transports: ['websocket', 'polling'],
});

app.set('io', io);

io.on('connection', (socket) => {
  logger.info('Admin socket connected', { socketId: socket.id });

  socket.on('disconnect', (reason) => {
    logger.info('Admin socket disconnected', { socketId: socket.id, reason });
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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running with realtime support on port ${PORT}`);
});