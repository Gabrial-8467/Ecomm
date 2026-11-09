import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalRateLimiter } from './middleware/security.js';

// Import domain routes
import authRoutes from './modules/auth/auth.routes.js';
import productRoutes from './modules/products/product.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import legalRoutes from './modules/legal/legal.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';

const app: Application = express();

// Security and utility middleware
app.use(helmet());
app.use(compression());
app.use(cookieParser(ENV.COOKIE_SECRET));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan(ENV.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// CORS setup for customer storefront (3000) and admin dashboard (3001)
const allowedOrigins = ENV.CORS_ORIGIN.split(',').map((origin) => origin.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS policy'));
      }
    },
    credentials: true,
  })
);

// Apply rate limiting
app.use(globalRateLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'retail-backend-api',
    business: ENV.BUSINESS_NAME,
    version: '1.0.0',
    categories: ['Furniture', 'Electronics', 'Mobile Phones & Accessories'],
  });
});

// Mount domain routes on /api/v1
const prefix = ENV.API_PREFIX;
app.use(`${prefix}/auth`, authRoutes);
app.use(`${prefix}/products`, productRoutes);
app.use(`${prefix}`, categoryRoutes);
app.use(`${prefix}/inventory`, inventoryRoutes);
app.use(`${prefix}/cart`, cartRoutes);
app.use(`${prefix}/orders`, orderRoutes);
app.use(`${prefix}/billing`, billingRoutes);
app.use(`${prefix}/legal`, legalRoutes);
app.use(`${prefix}/settings`, settingsRoutes);

// Root API documentation endpoint
app.get(`${prefix}`, (req: Request, res: Response) => {
  res.status(200).json({
    name: 'Apex Retail Management API',
    version: '1.0.0',
    compliance: 'DPDP Act 2023 / Consumer Protection (E-Commerce) Rules 2020',
    endpoints: {
      auth: `${prefix}/auth`,
      products: `${prefix}/products`,
      categories: `${prefix}/categories`,
      brands: `${prefix}/brands`,
      cart: `${prefix}/cart`,
      orders: `${prefix}/orders`,
      inventory: `${prefix}/inventory`,
      billing: `${prefix}/billing`,
      legal: `${prefix}/legal`,
      settings: `${prefix}/settings`,
    },
  });
});

// 404 Route Handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
