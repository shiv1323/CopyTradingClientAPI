import express from 'express';
import env from './config/env.js';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import responseHandler from './middlewares/responseHandler.js';
import { notFoundMiddleware } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import indexRouter from './routes/index.js';

const app = express();

const parsedCorsOrigins = (env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients / same-origin (no Origin header)
    if (!origin) return callback(null, true);

    // If CORS_ORIGIN is unset, default to allowing all origins in development.
    if (parsedCorsOrigins.length === 0) return callback(null, true);

    // If configured as "*", reflect the requesting origin (works with credentials).
    if (parsedCorsOrigins.includes('*')) return callback(null, true);

    if (parsedCorsOrigins.includes(origin)) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(express.json());
app.use(helmet()); // Secure HTTP headers
app.use(cors(corsOptions)); // Enable CORS
app.options('*', cors(corsOptions));

// to trust the ip
app.set('trust proxy', 2);

if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(responseHandler);
app.use('/api/v1',  indexRouter);
// Handle 404 (non-existent routes)
app.use(notFoundMiddleware);

// Error Handling Middleware
app.use(errorHandler);

export default app;
